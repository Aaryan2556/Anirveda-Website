/**
 * In-memory stand-in for Appwrite TablesDB, faithful where the adapter depends on it:
 * - listRows / getRow with equal, limit, cursorAfter and orderDesc queries;
 * - transactions: operations are staged, then committed all-or-nothing;
 * - row IDs and the schema's unique indexes are enforced (409 on a clash);
 * - like real Appwrite (verified 2026-09-26), the "unique()" placeholder is NOT
 *   expanded inside transactions, so the fake rejects it there;
 * - `canWrite = false` simulates a user without write permission (401);
 * - every call yields to the event loop, so concurrent callers really interleave.
 */
import { SCHEMA, TABLES } from "../repository/appwriteSchema.js";
import { stateToRows } from "../repository/appwriteMapper.js";

export const Query = {
  equal: (key, value) => ({ method: "equal", key, value }),
  limit: (n) => ({ method: "limit", n }),
  cursorAfter: (id) => ({ method: "cursorAfter", id }),
  orderDesc: (key) => ({ method: "orderDesc", key }),
};

const appwriteError = (code, message) => Object.assign(new Error(message), { code });
const yieldTurn = () => new Promise((resolve) => setImmediate(resolve));
const uniqueIndexes = Object.fromEntries(
  SCHEMA.map((table) => [table.id, table.indexes.filter((i) => i.type === "unique").map((i) => i.columns)])
);

export function createFakeTablesDB() {
  let tables = Object.fromEntries(Object.values(TABLES).map((id) => [id, new Map()]));
  const transactions = new Map();
  let generated = 0;

  function applyOperation(target, op) {
    const table = target[op.tableId];
    if (op.action === "create") {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(op.rowId ?? "")) {
        throw appwriteError(400, `Invalid rowId "${op.rowId}" in transaction (unique() is not expanded here)`);
      }
      const rowId = op.rowId;
      if (table.has(rowId)) throw appwriteError(409, `Row ${op.tableId}/${rowId} already exists`);
      const row = { $id: rowId, ...op.data };
      for (const columns of uniqueIndexes[op.tableId]) {
        const clash = [...table.values()].some((other) => columns.every((c) => other[c] === row[c]));
        if (clash) throw appwriteError(409, `Unique index (${columns}) violated in ${op.tableId}`);
      }
      table.set(rowId, row);
    } else if (op.action === "update") {
      if (!table.has(op.rowId)) throw appwriteError(404, `Row ${op.tableId}/${op.rowId} not found`);
      table.set(op.rowId, { ...table.get(op.rowId), ...op.data });
    } else if (op.action === "delete") {
      if (!table.delete(op.rowId)) throw appwriteError(404, `Row ${op.tableId}/${op.rowId} not found`);
    } else {
      throw appwriteError(400, `Unknown action ${op.action}`);
    }
  }

  const db = {
    canWrite: true,
    failReads: false,
    /** Optional hook run before each child-table list (to land a write mid-read). */
    beforeList: null,
    /** Optional hook run before each commit (to force a conflict). */
    beforeCommit: null,
    stats: { commits: 0, rollbacks: 0, transactions: 0 },

    /** Writes an engine state directly (test setup), replacing that auction's rows. */
    store(state) {
      for (const [tableId, table] of Object.entries(tables)) {
        for (const [rowId, row] of table) {
          const owner = tableId === TABLES.AUCTIONS ? row.$id : row.auctionId;
          if (owner === state.auctionId) table.delete(rowId);
        }
      }
      const rows = stateToRows(state);
      const put = (tableId, row) => {
        const rowId = row.$id ?? `gen-${++generated}`;
        tables[tableId].set(rowId, { ...row, $id: rowId });
      };
      put(TABLES.AUCTIONS, rows.auction);
      rows.teams.forEach((row) => put(TABLES.TEAMS, row));
      rows.players.forEach((row) => put(TABLES.PLAYERS, row));
      rows.purchases.forEach((row) => put(TABLES.PURCHASES, row));
      rows.activity.forEach((row) => put(TABLES.ACTIVITY, row));
    },

    rows(tableId) {
      return [...tables[tableId].values()];
    },

    async getRow({ tableId, rowId }) {
      await yieldTurn();
      if (db.failReads) throw new TypeError("Failed to fetch");
      const row = tables[tableId].get(rowId);
      if (!row) throw appwriteError(404, "Row not found");
      return { ...row };
    },

    async listRows({ tableId, queries }) {
      await yieldTurn();
      if (db.failReads) throw new TypeError("Failed to fetch");
      if (tableId !== TABLES.AUCTIONS) db.beforeList?.(tableId);
      let rows = [...tables[tableId].values()];
      let limit = 25;
      for (const q of queries) {
        if (q.method === "equal") rows = rows.filter((r) => r[q.key] === q.value);
        if (q.method === "orderDesc") rows.sort((a, b) => b[q.key] - a[q.key]);
        if (q.method === "limit") limit = q.n;
      }
      const cursor = queries.find((q) => q.method === "cursorAfter");
      if (cursor) rows = rows.slice(rows.findIndex((r) => r.$id === cursor.id) + 1);
      return { total: rows.length, rows: rows.slice(0, limit).map((r) => ({ ...r })) };
    },

    async createTransaction() {
      await yieldTurn();
      const id = `tx-${db.stats.transactions++}`;
      transactions.set(id, []);
      return { $id: id };
    },

    async createOperations({ transactionId, operations }) {
      await yieldTurn();
      if (!db.canWrite) throw appwriteError(401, "The current user is not authorized to perform the requested action.");
      transactions.get(transactionId).push(...operations);
    },

    async updateTransaction({ transactionId, commit, rollback }) {
      await yieldTurn();
      const operations = transactions.get(transactionId);
      transactions.delete(transactionId);
      if (rollback) {
        db.stats.rollbacks += 1;
        return;
      }
      if (!commit || !operations) throw appwriteError(400, "Bad transaction update");
      await db.beforeCommit?.();
      // All or nothing: apply to a copy, swap in only if every operation succeeds.
      const draft = Object.fromEntries(Object.entries(tables).map(([id, rows]) => [id, new Map(rows)]));
      for (const op of operations) applyOperation(draft, op);
      tables = draft;
      db.stats.commits += 1;
    },
  };
  return db;
}
