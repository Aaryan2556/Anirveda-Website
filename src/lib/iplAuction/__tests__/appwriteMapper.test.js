import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { COMMANDS } from "../engine/index.js";
import { SCHEMA, TABLES } from "../repository/appwriteSchema.js";
import { diffToWrites, rowsToState, stateToRows } from "../repository/appwriteMapper.js";
import { createMockAuctionState, makeId } from "../repository/mockSeed.js";
import { apply, buy, live, open, sell, setup } from "./fixtures.js";

/** A state exercising every field: sales, unsold, withdrawal, reorder, cancel, undo, open lot, pause. */
function busyState() {
  let state = live();
  state = apply(state, { type: COMMANDS.REORDER_PLAYERS, playerOrder: [...state.playerOrder].reverse() });
  state = buy(state, "t1", "bat2", 80);
  state = buy(state, "t2", "wk1", 30);
  state = apply(open(state, "bowl1"), { type: COMMANDS.MARK_UNSOLD });
  state = apply(state, { type: COMMANDS.WITHDRAW_PLAYER, playerId: "bat3" });
  state = apply(state, { type: COMMANDS.CANCEL_SALE, playerId: "bat2" });
  state = buy(state, "t3", "bat2", 90);
  state = apply(open(state, "ar1"), { type: COMMANDS.UNDO });
  state = open(state, "os1");
  return apply(state, { type: COMMANDS.PAUSE_AUCTION });
}

/** Simulates Appwrite: rows come back with system fields, activity rows get generated IDs. */
function asStored(rows) {
  const system = (row, i) => ({ $createdAt: "2026-09-26T00:00:00.000Z", $permissions: [], $sequence: i, ...row });
  return {
    auction: system(rows.auction, 0),
    teams: rows.teams.map(system).reverse(),
    players: rows.players.map(system).reverse(),
    purchases: rows.purchases.map(system).reverse(),
    activity: rows.activity.map((row, i) => system({ $id: `gen-${i}`, ...row }, i)).reverse(),
  };
}

/** Applies write operations to an in-memory copy of the stored rows. */
function applyWrites(rows, writes) {
  const tables = {
    [TABLES.AUCTIONS]: new Map([[rows.auction.$id, rows.auction]]),
    [TABLES.TEAMS]: new Map(rows.teams.map((r) => [r.$id, r])),
    [TABLES.PLAYERS]: new Map(rows.players.map((r) => [r.$id, r])),
    [TABLES.PURCHASES]: new Map(rows.purchases.map((r) => [r.$id, r])),
    [TABLES.ACTIVITY]: new Map(rows.activity.map((r, i) => [`a${i}`, r])),
  };
  let generated = 0;
  for (const write of writes) {
    const table = tables[write.tableId];
    if (write.action === "create") {
      const rowId = write.rowId ?? `generated-${generated++}`;
      assert.ok(!table.has(rowId), `create of existing row ${write.tableId}/${rowId}`);
      table.set(rowId, { $id: rowId, ...write.data });
    } else if (write.action === "update") {
      assert.ok(table.has(write.rowId), `update of missing row ${write.tableId}/${write.rowId}`);
      table.set(write.rowId, { ...table.get(write.rowId), ...write.data });
    } else {
      assert.ok(table.delete(write.rowId), `delete of missing row ${write.tableId}/${write.rowId}`);
    }
  }
  return {
    auction: [...tables[TABLES.AUCTIONS].values()][0],
    teams: [...tables[TABLES.TEAMS].values()],
    players: [...tables[TABLES.PLAYERS].values()],
    purchases: [...tables[TABLES.PURCHASES].values()],
    activity: [...tables[TABLES.ACTIVITY].values()],
  };
}

describe("appwrite mapper: round trip", () => {
  it("restores a fresh state exactly", () => {
    const state = setup();
    assert.deepStrictEqual(rowsToState(asStored(stateToRows(state))), state);
  });

  it("restores a busy auction exactly, regardless of row order and system fields", () => {
    const state = busyState();
    assert.ok(state.lot && state.purchases.length === 2 && state.undoStack.length > 0);
    assert.deepStrictEqual(rowsToState(asStored(stateToRows(state))), state);
  });

  it("restores the fictional mock auction (stats, recent form, nulls)", () => {
    const state = createMockAuctionState({ at: 1234 });
    assert.deepStrictEqual(rowsToState(asStored(stateToRows(state))), state);
  });

  it("keeps money and timestamps as integers and JSON blobs as strings", () => {
    const rows = stateToRows(busyState());
    assert.equal(typeof rows.auction.config, "string");
    assert.equal(typeof rows.auction.undoStack, "string");
    for (const row of rows.purchases) assert.ok(Number.isSafeInteger(row.price) && Number.isSafeInteger(row.atMs));
    for (const row of rows.players) assert.equal(typeof row.recentPerformance, "string");
  });

  it("uses the player ID as the purchase row ID (one sale per player, enforced by the database)", () => {
    const rows = stateToRows(busyState());
    for (const row of rows.purchases) assert.equal(row.$id, row.playerId);
  });
});

describe("appwrite mapper: rows match the schema", () => {
  const rows = stateToRows(busyState());
  const byTable = {
    [TABLES.AUCTIONS]: [rows.auction],
    [TABLES.TEAMS]: rows.teams,
    [TABLES.PLAYERS]: rows.players,
    [TABLES.PURCHASES]: rows.purchases,
    [TABLES.ACTIVITY]: rows.activity,
  };

  for (const table of SCHEMA) {
    it(`${table.id}: every value has a column, required columns are filled, sizes fit`, () => {
      const columns = new Map(table.columns.map((c) => [c.key, c]));
      for (const row of byTable[table.id]) {
        for (const [key, value] of Object.entries(row)) {
          if (key === "$id") continue;
          const column = columns.get(key);
          assert.ok(column, `${table.id}.${key} has no column`);
          if (value == null) {
            assert.ok(!column.required, `${table.id}.${key} is required but null`);
            continue;
          }
          if (column.type === "string") {
            assert.equal(typeof value, "string", `${table.id}.${key}`);
            assert.ok(value.length <= column.size, `${table.id}.${key} longer than ${column.size}`);
          }
          if (column.type === "integer") assert.ok(Number.isSafeInteger(value) && value >= column.min, `${table.id}.${key}`);
          if (column.type === "boolean") assert.equal(typeof value, "boolean");
          if (column.type === "enum") assert.ok(column.elements.includes(value), `${table.id}.${key}=${value}`);
        }
        for (const column of table.columns) {
          if (column.required) assert.ok(row[column.key] != null, `${table.id}.${column.key} missing`);
        }
        if (row.$id != null) assert.match(row.$id, /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/);
      }
    });
  }
});

describe("appwrite mapper: diffToWrites", () => {
  it("with no previous state, creates every row (activity with generated IDs)", () => {
    const state = busyState();
    const writes = diffToWrites(null, state);
    assert.ok(writes.every((w) => w.action === "create"));
    const count = (tableId) => writes.filter((w) => w.tableId === tableId).length;
    assert.equal(count(TABLES.AUCTIONS), 1);
    assert.equal(count(TABLES.PLAYERS), state.playerOrder.length);
    assert.equal(count(TABLES.PURCHASES), state.purchases.length);
    assert.equal(count(TABLES.ACTIVITY), state.activity.length);
    assert.ok(writes.filter((w) => w.tableId === TABLES.ACTIVITY).every((w) => w.rowId === null));
  });

  it("an unchanged state produces no writes", () => {
    const state = busyState();
    assert.deepEqual(diffToWrites(state, state), []);
  });

  it("a sale writes one activity row first, then only what changed", () => {
    const before = open(live(), "bat1");
    const after = sell(before, "t2", 40);
    const writes = diffToWrites(before, after);
    assert.equal(writes[0].tableId, TABLES.ACTIVITY);
    assert.deepEqual(writes.map((w) => `${w.action}:${w.tableId}:${w.rowId}`), [
      `create:${TABLES.ACTIVITY}:null`,
      `update:${TABLES.AUCTIONS}:test-auction`,
      `update:${TABLES.PLAYERS}:bat1`,
      `create:${TABLES.PURCHASES}:bat1`,
    ]);
    const playerUpdate = writes.find((w) => w.tableId === TABLES.PLAYERS);
    assert.deepEqual(playerUpdate.data, { status: "SOLD", soldTo: "t2", soldPrice: 40 });
  });

  it("cancelling a sale deletes that purchase row; undo never deletes activity", () => {
    const sold = buy(live(), "t1", "bat2", 80);
    const cancelled = apply(sold, { type: COMMANDS.CANCEL_SALE, playerId: "bat2" });
    const writes = diffToWrites(sold, cancelled);
    assert.ok(writes.some((w) => w.action === "delete" && w.tableId === TABLES.PURCHASES && w.rowId === "bat2"));
    const undone = apply(sold, { type: COMMANDS.UNDO });
    assert.ok(!diffToWrites(sold, undone).some((w) => w.action === "delete" && w.tableId === TABLES.ACTIVITY));
  });

  it("applying the writes step by step always reproduces the engine state", () => {
    let state = setup();
    let stored = asStored(stateToRows(state));
    const steps = [
      (s) => apply(s, { type: COMMANDS.START_AUCTION }),
      (s) => apply(s, { type: COMMANDS.REORDER_PLAYERS, playerOrder: [...s.playerOrder].reverse() }),
      (s) => open(s),
      (s) => sell(s, "t1", 60),
      (s) => apply(open(s), { type: COMMANDS.MARK_UNSOLD }),
      (s) => apply(s, { type: COMMANDS.UNDO }),
      (s) => sell(s, "t2", 25),
      (s) => apply(s, { type: COMMANDS.CANCEL_SALE, playerId: s.purchases[0].playerId }),
      (s) => apply(s, { type: COMMANDS.WITHDRAW_PLAYER, playerId: "bat1" }),
      (s) => apply(s, { type: COMMANDS.END_AUCTION }),
    ];
    for (const step of steps) {
      const next = step(state);
      stored = applyWrites(stored, diffToWrites(state, next));
      assert.deepStrictEqual(rowsToState(stored), next);
      state = next;
    }
  });

  it("a different auction is written from scratch", () => {
    const writes = diffToWrites(setup(), createMockAuctionState({ at: 5 }));
    assert.ok(writes.every((w) => w.action === "create"));
  });
});

describe("makeId", () => {
  it("produces valid Appwrite row IDs (≤ 36 chars, safe characters, unique)", () => {
    const ids = new Set();
    for (let i = 0; i < 500; i += 1) {
      for (const prefix of ["player", "local-auction"]) {
        const id = makeId(prefix);
        assert.match(id, /^[a-z][a-z0-9-]{0,35}$/);
        ids.add(id);
      }
    }
    assert.equal(ids.size, 1000);
  });

  it("rejects prefixes that would break the rules", () => {
    assert.throws(() => makeId("-bad"));
    assert.throws(() => makeId("Player"));
    assert.throws(() => makeId("a-very-long-prefix-that-overflows"));
  });
});
