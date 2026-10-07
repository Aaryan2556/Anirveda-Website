/**
 * Appwrite repository adapter.
 *
 * Same contract as localAdapter.js (getSnapshot / subscribe / dispatch / destroy):
 * - Reads the auction from Appwrite TablesDB and maps it with appwriteMapper.js.
 * - While anything is subscribed: listens to Appwrite Realtime (Phase 6) and polls
 *   as a safety net (every 1 hour with realtime, every 2 s without).
 * - Realtime events are only "something changed" signals: a burst of events is
 *   collapsed into ONE full refetch (debounced), and an event that arrives while a
 *   read is in flight schedules another read afterwards, so a write that landed
 *   mid-read is never missed. The same refetch runs when the socket reconnects,
 *   the tab becomes visible again, or the browser comes back online.
 * - Never goes backwards: a fetched state replaces the current one only if it is
 *   newer (contract §4), so out-of-order, duplicate or partial events can't show
 *   an older or mixed state.
 * - dispatch(command): re-reads the latest stored state, runs the engine, and
 *   commits every resulting write in ONE TablesDB transaction (all or nothing).
 *   Every accepted command creates exactly one activity row, and the unique
 *   (auctionId, seq) index makes a commit based on an out-of-date state fail;
 *   the command is then re-run against the newer state (bounded retries).
 * - Who may write is enforced by Appwrite table permissions (admins only, see
 *   appwriteSchema.js), not by this code. reset() is not available.
 *
 * Dependencies are injected (tablesDB, Query, ID) so this file runs in Node tests
 * without Vite or a network. `ID.unique()` must generate a real ID locally (the
 * SDK's does): Appwrite does NOT expand the "unique()" placeholder inside
 * transaction operations — it would store the literal text as the row ID.
 */
import { DEV_DEFAULT_CONFIG } from "../config.js";
import { ERROR, SCHEMA_VERSION, createInitialState, reduce, COMMANDS } from "../engine/index.js";
import { TABLES } from "./appwriteSchema.js";
import { diffToWrites, rowsToState } from "./appwriteMapper.js";
import { isNewer } from "./isNewer.js";
import { realtimeChannels } from "./appwriteRealtime.js";

/** Adapter-level failure codes (the engine's ERROR codes cover rule violations). */
export const ADAPTER_ERROR = Object.freeze({
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
});

const PAGE_SIZE = 100;
const MAX_CONSISTENT_READ_ATTEMPTS = 3;
const MAX_COMMIT_ATTEMPTS = 3;
/** Stays under Appwrite's per-transaction operation limit. */
const MAX_OPERATIONS_PER_COMMAND = 100;
const TRANSACTION_TTL_SECONDS = 300;

const failure = (state, code, message) => ({ ok: false, state, error: { code, message } });

/** Maps an Appwrite/network error to the contract's error shape. */
function toContractError(error) {
  const status = error?.code;
  if (status === 401 || status === 403) {
    return { code: ERROR.UNAUTHORIZED, message: "Only a signed-in IPL admin can change the auction." };
  }
  if (!status) return { code: ADAPTER_ERROR.NETWORK_ERROR, message: `Could not reach Appwrite: ${error?.message ?? error}` };
  return { code: ADAPTER_ERROR.SERVER_ERROR, message: `Appwrite rejected the change (${status}): ${error.message}` };
}

/** A commit that lost a race (unique index clash or transaction conflict). */
const isConflict = (error) => error?.code === 409;

/** Connection states reported by `connection.getStatus().status`. */
export const CONNECTION_STATUS = Object.freeze({
  POLLING: "polling", // no realtime source: polling only
  CONNECTING: "connecting", // first socket connection in progress
  LIVE: "live", // realtime socket open
  RECONNECTING: "reconnecting", // socket dropped; the SDK is retrying, polling covers the gap
  OFFLINE: "offline", // the browser reports no network
});

/** Calls `onWake` when the tab becomes visible or the network returns; `onOffline` when it drops. */
function browserLifecycle({ onWake, onOffline }) {
  if (typeof document === "undefined" || typeof window === "undefined") return () => {};
  const onVisibility = () => {
    if (document.visibilityState === "visible") onWake();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("online", onWake);
  window.addEventListener("offline", onOffline);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("online", onWake);
    window.removeEventListener("offline", onOffline);
  };
}

/** Stand-in state shown before the first successful load, or when loading fails. */
function placeholderState(name) {
  return createInitialState({ auctionId: "appwrite-placeholder", name, config: DEV_DEFAULT_CONFIG, at: -1 });
}

export function createAppwriteRepository({
  tablesDB,
  Query,
  ID,
  databaseId,
  auctionId = null,
  pollMs = 2000,
  realtime = null,
  realtimePollMs = 3600_000,
  refetchDebounceMs = 100,
  idleStopMs = 1000,
  watchLifecycle = browserLifecycle,
  now = () => Date.now(),
  setIntervalImpl = globalThis.setInterval,
  clearIntervalImpl = globalThis.clearInterval,
  setTimeoutImpl = globalThis.setTimeout,
  clearTimeoutImpl = globalThis.clearTimeout,
  onError = (error) => console.error("[IPL Auction] Appwrite read failed:", error),
}) {
  if (!tablesDB || !Query || !ID) throw new Error("createAppwriteRepository: tablesDB, Query and ID are required.");
  if (!databaseId) throw new Error("createAppwriteRepository: databaseId is required (VITE_IPL_AUCTION_DATABASE_ID).");

  const LOCAL_STORAGE_KEY = `ipl_auction_cache_${databaseId}_${auctionId || 'latest'}`;

  const listeners = new Set();
  let cachedRows = null;
  let loaded = false;
  let state = placeholderState("Loading auction from Appwrite…");

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.auction && parsed.auction.schemaVersion === SCHEMA_VERSION) {
          const loadedState = rowsToState(parsed);
          state = loadedState;
          cachedRows = parsed;
          loaded = true;
        }
      }
    } catch (err) {
      console.warn("Failed to load auction from localStorage", err);
    }
  }

  function saveToLocalStorage() {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      if (cachedRows) {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cachedRows));
      }
    } catch (err) {
      console.warn("Failed to save auction to localStorage", err);
    }
  }

  let timer = null;
  let inFlight = null;
  let rerun = false;
  let debounceTimer = null;
  let idleTimer = null;
  let stopRealtime = null;
  let stopLifecycle = null;

  const connectionListeners = new Set();
  let socketStatus = realtime ? CONNECTION_STATUS.CONNECTING : CONNECTION_STATUS.POLLING;
  let online = true;
  let connection = { status: socketStatus, lastSyncAt: null };

  function setState(next) {
    state = next;
    listeners.forEach((listener) => listener());
  }

  function publishConnection(changes) {
    const status = online ? socketStatus : CONNECTION_STATUS.OFFLINE;
    const next = { ...connection, status, ...changes };
    if (next.status === connection.status && next.lastSyncAt === connection.lastSyncAt) return;
    connection = next;
    connectionListeners.forEach((listener) => listener());
  }

  async function fetchAuctionRow() {
    if (auctionId) return tablesDB.getRow({ databaseId, tableId: TABLES.AUCTIONS, rowId: auctionId });
    const { rows } = await tablesDB.listRows({
      databaseId,
      tableId: TABLES.AUCTIONS,
      queries: [Query.orderDesc("createdAtMs"), Query.limit(1)],
    });
    if (!rows.length) throw new Error("No auction found in the IPL database. Run the seed script first.");
    return rows[0];
  }

  async function listAll(tableId, id) {
    const all = [];
    let cursor = null;
    for (;;) {
      const queries = [Query.equal("auctionId", id), Query.limit(PAGE_SIZE)];
      if (cursor) queries.push(Query.cursorAfter(cursor));
      const { rows } = await tablesDB.listRows({ databaseId, tableId, queries });
      all.push(...rows);
      if (rows.length < PAGE_SIZE) return all;
      cursor = rows[rows.length - 1].$id;
    }
  }

  /**
   * Reads the auction row, then its child rows, then the auction row again. If the
   * version moved in between, a write landed mid-read, so the read is retried.
   */
  async function readConsistentState() {
    for (let attempt = 1; attempt <= MAX_CONSISTENT_READ_ATTEMPTS; attempt += 1) {
      const auction = await fetchAuctionRow();
      if (auction.schemaVersion !== SCHEMA_VERSION) {
        throw new Error(`Stored auction uses schema v${auction.schemaVersion}; this app expects v${SCHEMA_VERSION}.`);
      }
      if (cachedRows && cachedRows.auction && cachedRows.auction.version === auction.version && cachedRows.auction.$id === auction.$id) {
        return rowsToState(cachedRows);
      }
      const [teams, players, purchases] = await Promise.all(
        [TABLES.TEAMS, TABLES.PLAYERS, TABLES.PURCHASES].map((tableId) => listAll(tableId, auction.$id))
      );
      const { rows: activity } = await tablesDB.listRows({
        databaseId,
        tableId: TABLES.ACTIVITY,
        queries: [Query.equal("auctionId", auction.$id), Query.orderDesc("seq"), Query.limit(25)],
      });
      const check = await tablesDB.getRow({ databaseId, tableId: TABLES.AUCTIONS, rowId: auction.$id });
      if (check.version === auction.version) {
        cachedRows = { auction, teams, players, purchases, activity };
        saveToLocalStorage();
        return rowsToState(cachedRows);
      }
    }
    throw new Error("The auction kept changing while it was being read. Will retry on the next poll.");
  }

  async function loadOnce() {
    try {
      const next = await readConsistentState();
      if (!loaded || isNewer(next, state)) setState(next);
      loaded = true;
      publishConnection({ lastSyncAt: now() });
    } catch (error) {
      onError(error);
      if (!loaded) setState(placeholderState(`Could not load from Appwrite: ${error.message}`));
    }
  }

  /**
   * Reads now. Concurrent calls share one read; a call made while a read is in
   * flight (for example a realtime event for a write that landed mid-read) makes
   * that read run once more when it finishes, and the returned promise covers it.
   */
  function refresh() {
    if (inFlight) {
      rerun = true;
      return inFlight;
    }
    inFlight = (async () => {
      do {
        rerun = false;
        await loadOnce();
      } while (rerun);
    })().finally(() => {
      inFlight = null;
    });
    return inFlight;
  }

  /** Collapses a burst of change signals into one refetch (the first signal starts the window). */
  function scheduleRefresh() {
    if (debounceTimer !== null) return;
    debounceTimer = setTimeoutImpl(() => {
      debounceTimer = null;
      refresh();
    }, refetchDebounceMs);
  }

  function onRealtimeEvent({ tableId, auctionId: rowAuctionId, payload, events }) {
    const pinned = auctionId ?? (loaded ? state.auctionId : null);
    const maybeNewAuction = !auctionId && tableId === TABLES.AUCTIONS;
    if (pinned && rowAuctionId && rowAuctionId !== pinned && !maybeNewAuction) return;

    if (!cachedRows || !payload) {
      scheduleRefresh();
      return;
    }

    const isDelete = events.some((e) => e.includes(".delete"));
    const listKey =
      tableId === TABLES.TEAMS ? "teams" :
      tableId === TABLES.PLAYERS ? "players" :
      tableId === TABLES.PURCHASES ? "purchases" :
      tableId === TABLES.ACTIVITY ? "activity" : null;

    if (tableId === TABLES.AUCTIONS) {
      if (!isDelete && (!cachedRows.auction || payload.version > cachedRows.auction.version)) {
        cachedRows.auction = payload;
      }
    } else if (listKey) {
      const list = cachedRows[listKey];
      const idx = list.findIndex((r) => r.$id === payload.$id);
      if (isDelete) {
        if (idx >= 0) list.splice(idx, 1);
      } else {
        if (idx >= 0) list[idx] = payload;
        else list.push(payload);
      }
    }

    try {
      const nextState = rowsToState(cachedRows);
      if (isNewer(nextState, state)) {
        setState(nextState);
        saveToLocalStorage();
      }
    } catch (err) {
      scheduleRefresh();
    }
  }

  function onRealtimeStatus(status) {
    const wasDown = socketStatus === CONNECTION_STATUS.RECONNECTING;
    if (status === "open") socketStatus = CONNECTION_STATUS.LIVE;
    else if (status === "closed") socketStatus = CONNECTION_STATUS.RECONNECTING;
    else if (socketStatus !== CONNECTION_STATUS.RECONNECTING) socketStatus = CONNECTION_STATUS.CONNECTING;
    publishConnection();
    // Events sent while the socket was down are lost: catch up with a full read.
    if (status === "open" && wasDown) scheduleRefresh();
  }

  /** Applies all writes atomically; rolls the transaction back if anything fails. */
  async function commit(writes) {
    const transaction = await tablesDB.createTransaction();
    const transactionId = transaction.$id;
    try {
      await tablesDB.createOperations({
        transactionId,
        operations: writes.map(({ action, tableId, rowId, data }) => ({
          action,
          databaseId,
          tableId,
          rowId: rowId ?? ID.unique(),
          ...(data ? { data } : {}),
        })),
      });
      await tablesDB.updateTransaction({ transactionId, commit: true });
    } catch (error) {
      await tablesDB.updateTransaction({ transactionId, rollback: true }).catch(() => {});
      throw error;
    }
  }

  function start() {
    if (idleTimer !== null) {
      clearTimeoutImpl(idleTimer);
      idleTimer = null;
    }
    if (timer !== null) return; // still running (the last listener left moments ago)
    refresh();
    timer = setIntervalImpl(refresh, realtime ? realtimePollMs : pollMs);
    if (realtime) stopRealtime = realtime.subscribe(realtimeChannels(databaseId), onRealtimeEvent, onRealtimeStatus);
    stopLifecycle = watchLifecycle({
      onWake: () => {
        online = true;
        publishConnection();
        scheduleRefresh();
      },
      onOffline: () => {
        online = false;
        publishConnection();
      },
    });
  }

  function stop() {
    if (timer !== null) clearIntervalImpl(timer);
    if (debounceTimer !== null) clearTimeoutImpl(debounceTimer);
    if (idleTimer !== null) clearTimeoutImpl(idleTimer);
    timer = debounceTimer = idleTimer = null;
    stopRealtime?.();
    stopLifecycle?.();
    stopRealtime = stopLifecycle = null;
    if (realtime) socketStatus = CONNECTION_STATUS.CONNECTING;
    online = true;
  }

  /**
   * Waits a moment before closing the socket when the last listener leaves, so a
   * page change (or React StrictMode's mount/unmount/mount) doesn't reconnect.
   */
  function stopWhenIdle() {
    if (idleStopMs <= 0) return stop();
    idleTimer = setTimeoutImpl(() => {
      idleTimer = null;
      if (listeners.size === 0) stop();
    }, idleStopMs);
  }

  return {
    kind: "appwrite",

    getSnapshot: () => state,

    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) start();
      return () => {
        if (!listeners.delete(listener)) return;
        if (listeners.size === 0) stopWhenIdle();
      };
    },

    async dispatch(command) {
      if (command.type === COMMANDS.UPDATE_BID) {
        const result = reduce(state, { ...command, at: command.at ?? now() });
        if (result.ok) {
          const writes = diffToWrites(state, result.state);
          if (isNewer(result.state, state)) setState(result.state);
          commit(writes).catch(() => {});
        }
        return result;
      }

      for (let attempt = 1; attempt <= MAX_COMMIT_ATTEMPTS; attempt += 1) {
        let latest = state;
        if (attempt > 1 || !loaded) {
          try {
            latest = await readConsistentState();
          } catch (error) {
            return { ok: false, state, error: toContractError(error) };
          }
          if (!loaded || isNewer(latest, state)) setState(latest);
          loaded = true;
        }

        const result = reduce(latest, { ...command, at: command.at ?? now() });
        if (!result.ok) return result;

        const writes = diffToWrites(latest, result.state);
        if (writes.length > MAX_OPERATIONS_PER_COMMAND) {
          return failure(state, ADAPTER_ERROR.SERVER_ERROR, `This action changes ${writes.length} rows; the limit is ${MAX_OPERATIONS_PER_COMMAND}.`);
        }
        try {
          await commit(writes);
        } catch (error) {
          if (!isConflict(error)) return { ok: false, state, error: toContractError(error) };
          continue; // someone else wrote first: re-run the command on the fresh state
        }
        if (isNewer(result.state, state)) setState(result.state);
        return result;
      }
      return failure(state, ERROR.STALE_STATE, "The auction changed while saving. Check the latest state and try again.");
    },

    /** Fetches now instead of waiting for the next poll. */
    refresh,

    /** Sync health for a "reconnecting…" indicator: `{ status, lastSyncAt }` (same reference until it changes). */
    connection: {
      getStatus: () => connection,
      subscribe(listener) {
        connectionListeners.add(listener);
        return () => connectionListeners.delete(listener);
      },
    },

    destroy() {
      stop();
      listeners.clear();
      connectionListeners.clear();
    },
  };
}
