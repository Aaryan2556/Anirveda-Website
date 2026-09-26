/**
 * Appwrite repository adapter.
 *
 * Same contract as localAdapter.js (getSnapshot / subscribe / dispatch / destroy):
 * - Reads the auction from Appwrite TablesDB and maps it with appwriteMapper.js.
 * - Polls while anything is subscribed (realtime replaces polling in Phase 6).
 * - Never goes backwards: a fetched state replaces the current one only if it is newer.
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
import { ERROR, SCHEMA_VERSION, createInitialState, reduce } from "../engine/index.js";
import { TABLES } from "./appwriteSchema.js";
import { diffToWrites, rowsToState } from "./appwriteMapper.js";
import { isNewer } from "./isNewer.js";

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
const TRANSACTION_TTL_SECONDS = 60;

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
  now = () => Date.now(),
  setIntervalImpl = globalThis.setInterval,
  clearIntervalImpl = globalThis.clearInterval,
  onError = (error) => console.error("[IPL Auction] Appwrite read failed:", error),
}) {
  if (!tablesDB || !Query || !ID) throw new Error("createAppwriteRepository: tablesDB, Query and ID are required.");
  if (!databaseId) throw new Error("createAppwriteRepository: databaseId is required (VITE_IPL_AUCTION_DATABASE_ID).");

  const listeners = new Set();
  let state = placeholderState("Loading auction from Appwrite…");
  let loaded = false;
  let timer = null;
  let inFlight = null;

  function setState(next) {
    state = next;
    listeners.forEach((listener) => listener());
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
      const [teams, players, purchases, activity] = await Promise.all(
        [TABLES.TEAMS, TABLES.PLAYERS, TABLES.PURCHASES, TABLES.ACTIVITY].map((tableId) => listAll(tableId, auction.$id))
      );
      const check = await tablesDB.getRow({ databaseId, tableId: TABLES.AUCTIONS, rowId: auction.$id });
      if (check.version === auction.version) return rowsToState({ auction, teams, players, purchases, activity });
    }
    throw new Error("The auction kept changing while it was being read. Will retry on the next poll.");
  }

  function refresh() {
    if (!inFlight) {
      inFlight = readConsistentState()
        .then((next) => {
          if (!loaded || isNewer(next, state)) setState(next);
          loaded = true;
        })
        .catch((error) => {
          onError(error);
          if (!loaded) setState(placeholderState(`Could not load from Appwrite: ${error.message}`));
        })
        .finally(() => {
          inFlight = null;
        });
    }
    return inFlight;
  }

  /** Applies all writes atomically; rolls the transaction back if anything fails. */
  async function commit(writes) {
    const transaction = await tablesDB.createTransaction({ ttl: TRANSACTION_TTL_SECONDS });
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

  function startPolling() {
    refresh();
    timer = setIntervalImpl(refresh, pollMs);
  }

  function stopPolling() {
    if (timer !== null) clearIntervalImpl(timer);
    timer = null;
  }

  return {
    kind: "appwrite",

    getSnapshot: () => state,

    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) startPolling();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) stopPolling();
      };
    },

    async dispatch(command) {
      for (let attempt = 1; attempt <= MAX_COMMIT_ATTEMPTS; attempt += 1) {
        let latest;
        try {
          latest = await readConsistentState();
        } catch (error) {
          return { ok: false, state, error: toContractError(error) };
        }
        if (!loaded || isNewer(latest, state)) setState(latest);
        loaded = true;

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

    destroy() {
      stopPolling();
      listeners.clear();
    },
  };
}
