/**
 * Appwrite repository adapter — READ-ONLY until Phase 3.
 *
 * Same contract as localAdapter.js (getSnapshot / subscribe / dispatch / destroy):
 * - Reads the auction from Appwrite TablesDB and maps it with appwriteMapper.js.
 * - Polls while anything is subscribed (realtime replaces polling in Phase 6).
 * - Never goes backwards: a fetched state replaces the current one only if it is newer.
 * - dispatch() resolves to { ok: false, error: { code: "NOT_IMPLEMENTED" } } until
 *   Phase 3 adds server-authoritative writes. reset() is not available.
 *
 * Dependencies are injected (tablesDB, Query) so this file runs in Node tests
 * without Vite or a network.
 */
import { DEV_DEFAULT_CONFIG } from "../config.js";
import { SCHEMA_VERSION, createInitialState } from "../engine/index.js";
import { TABLES } from "./appwriteSchema.js";
import { rowsToState } from "./appwriteMapper.js";
import { isNewer } from "./isNewer.js";

/** Adapter-level failure codes (the engine's ERROR codes cover rule violations). */
export const ADAPTER_ERROR = Object.freeze({
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  NOT_IMPLEMENTED: "NOT_IMPLEMENTED",
});

const PAGE_SIZE = 100;
const MAX_CONSISTENT_READ_ATTEMPTS = 3;

/** Stand-in state shown before the first successful load, or when loading fails. */
function placeholderState(name) {
  return createInitialState({ auctionId: "appwrite-placeholder", name, config: DEV_DEFAULT_CONFIG, at: -1 });
}

export function createAppwriteRepository({
  tablesDB,
  Query,
  databaseId,
  auctionId = null,
  pollMs = 2000,
  setIntervalImpl = globalThis.setInterval,
  clearIntervalImpl = globalThis.clearInterval,
  onError = (error) => console.error("[IPL Auction] Appwrite read failed:", error),
}) {
  if (!tablesDB || !Query) throw new Error("createAppwriteRepository: tablesDB and Query are required.");
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

  function startPolling() {
    refresh();
    timer = setIntervalImpl(refresh, pollMs);
  }

  function stopPolling() {
    if (timer !== null) clearIntervalImpl(timer);
    timer = null;
  }

  return {
    getSnapshot: () => state,

    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) startPolling();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) stopPolling();
      };
    },

    /** Read-only until Phase 3. */
    dispatch() {
      return Promise.resolve({
        ok: false,
        state,
        error: { code: ADAPTER_ERROR.NOT_IMPLEMENTED, message: "The Appwrite adapter is read-only until Phase 3." },
      });
    },

    /** Fetches now instead of waiting for the next poll. */
    refresh,

    destroy() {
      stopPolling();
      listeners.clear();
    },
  };
}
