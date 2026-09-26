import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { COMMANDS } from "../engine/index.js";
import { ADAPTER_ERROR, createAppwriteRepository } from "../repository/appwriteAdapter.js";
import { TABLES } from "../repository/appwriteSchema.js";
import { stateToRows } from "../repository/appwriteMapper.js";
import { ADMIN, apply, buy, live, setup } from "./fixtures.js";

/** Query builders shaped like the Appwrite SDK's, readable by the fake below. */
const Query = {
  equal: (key, value) => ({ method: "equal", key, value }),
  limit: (n) => ({ method: "limit", n }),
  cursorAfter: (id) => ({ method: "cursorAfter", id }),
  orderDesc: (key) => ({ method: "orderDesc", key }),
};

/** In-memory TablesDB holding one or more auctions' rows. */
function fakeTablesDB() {
  const tables = Object.fromEntries(Object.values(TABLES).map((id) => [id, []]));
  let generated = 0;
  const calls = [];
  const db = {
    calls,
    /** Hook to run between reads (simulates a write landing mid-read). */
    beforeList: null,
    store(state) {
      const rows = stateToRows(state);
      tables[TABLES.AUCTIONS] = tables[TABLES.AUCTIONS].filter((r) => r.$id !== state.auctionId).concat(rows.auction);
      for (const [key, tableId] of [["teams", TABLES.TEAMS], ["players", TABLES.PLAYERS], ["purchases", TABLES.PURCHASES]]) {
        tables[tableId] = tables[tableId].filter((r) => r.auctionId !== state.auctionId).concat(rows[key]);
      }
      tables[TABLES.ACTIVITY] = tables[TABLES.ACTIVITY]
        .filter((r) => r.auctionId !== state.auctionId)
        .concat(rows.activity.map((r) => ({ $id: `act-${generated++}`, ...r })));
    },
    async getRow({ tableId, rowId }) {
      calls.push(["getRow", tableId]);
      const row = tables[tableId].find((r) => r.$id === rowId);
      if (!row) throw Object.assign(new Error("Row not found"), { code: 404 });
      return { ...row };
    },
    async listRows({ tableId, queries }) {
      calls.push(["listRows", tableId]);
      if (tableId !== TABLES.AUCTIONS) db.beforeList?.(tableId);
      let rows = [...tables[tableId]];
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
  };
  return db;
}

const openRepos = [];
afterEach(() => openRepos.splice(0).forEach((repo) => repo.destroy()));

function repoFor(tablesDB, options = {}) {
  const timers = [];
  const repo = createAppwriteRepository({
    tablesDB,
    Query,
    databaseId: "ipl-dev",
    setIntervalImpl: (fn) => timers.push(fn) - 1,
    clearIntervalImpl: () => {},
    onError: () => {},
    ...options,
  });
  openRepos.push(repo);
  return { repo, tick: () => Promise.all(timers.map((fn) => fn())) };
}

describe("appwrite adapter (read-only)", () => {
  it("shows a placeholder, then loads the newest auction once subscribed", async () => {
    const db = fakeTablesDB();
    db.store(setup());
    const newer = { ...buy(live(), "t1", "bat1"), auctionId: "newer-auction", createdAt: 50 };
    db.store(newer);
    const { repo } = repoFor(db);
    assert.match(repo.getSnapshot().name, /Loading/);

    let notified = 0;
    repo.subscribe(() => { notified += 1; });
    await repo.refresh();
    assert.deepStrictEqual(repo.getSnapshot(), newer);
    assert.ok(notified >= 1);
  });

  it("loads a specific auction when auctionId is given", async () => {
    const db = fakeTablesDB();
    const first = setup();
    db.store(first);
    db.store({ ...setup(), auctionId: "other", createdAt: 99 });
    const { repo } = repoFor(db, { auctionId: first.auctionId });
    repo.subscribe(() => {});
    await repo.refresh();
    assert.equal(repo.getSnapshot().auctionId, first.auctionId);
  });

  it("pages through large tables", async () => {
    const db = fakeTablesDB();
    let state = setup();
    for (let i = 0; i < 130; i += 1) {
      state = apply(state, {
        type: COMMANDS.ADD_PLAYER,
        player: { id: `extra-${i}`, name: `Extra ${i}`, role: "BOWLER", basePrice: 20, isOverseas: false },
      });
    }
    db.store(state);
    const { repo } = repoFor(db);
    repo.subscribe(() => {});
    await repo.refresh();
    assert.equal(repo.getSnapshot().playerOrder.length, state.playerOrder.length);
    assert.equal(repo.getSnapshot().activity.length, 130);
  });

  it("keeps the same snapshot reference when nothing changed, and updates on a newer version", async () => {
    const db = fakeTablesDB();
    const state = live();
    db.store(state);
    const { repo, tick } = repoFor(db);
    repo.subscribe(() => {});
    await repo.refresh();
    const first = repo.getSnapshot();
    await tick();
    assert.equal(repo.getSnapshot(), first, "unchanged poll must not replace the snapshot");

    const next = buy(state, "t2", "bat1");
    db.store(next);
    await tick();
    assert.equal(repo.getSnapshot().version, next.version);
    assert.equal(repo.getSnapshot().players.bat1.soldTo, "t2");
  });

  it("retries a read that raced a write, and never shows a torn state", async () => {
    const db = fakeTablesDB();
    const before = live();
    const after = buy(before, "t1", "bat1");
    db.store(before);
    let raced = false;
    db.beforeList = () => {
      if (!raced) {
        raced = true;
        db.store(after); // lands between the first auction read and the child reads
      }
    };
    const { repo } = repoFor(db);
    repo.subscribe(() => {});
    await repo.refresh();
    assert.deepStrictEqual(repo.getSnapshot(), after);
  });

  it("shows the error when the first load fails, and keeps the last good state on later failures", async () => {
    const db = fakeTablesDB();
    const { repo: empty } = repoFor(db);
    empty.subscribe(() => {});
    await empty.refresh();
    assert.match(empty.getSnapshot().name, /Could not load.*seed/);

    const state = live();
    db.store(state);
    const { repo, tick } = repoFor(db);
    repo.subscribe(() => {});
    await repo.refresh();
    db.listRows = async () => { throw new Error("network down"); };
    await tick();
    assert.deepStrictEqual(repo.getSnapshot(), state);
  });

  it("rejects stored data from a different schema version", async () => {
    const db = fakeTablesDB();
    db.store({ ...setup(), schemaVersion: 1 });
    const { repo } = repoFor(db);
    repo.subscribe(() => {});
    await repo.refresh();
    assert.match(repo.getSnapshot().name, /schema v1/);
  });

  it("is read-only: dispatch is NOT_IMPLEMENTED and there is no reset", async () => {
    const { repo } = repoFor(fakeTablesDB());
    const result = await repo.dispatch({ type: COMMANDS.START_AUCTION, actor: ADMIN });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, ADAPTER_ERROR.NOT_IMPLEMENTED);
    assert.equal(repo.reset, undefined);
  });

  it("only polls while subscribed", async () => {
    const db = fakeTablesDB();
    db.store(live());
    const { repo } = repoFor(db);
    assert.equal(db.calls.length, 0, "no reads before anyone subscribes");
    const unsubscribe = repo.subscribe(() => {});
    await repo.refresh();
    assert.ok(db.calls.length > 0);
    unsubscribe();
  });

  it("requires its dependencies", () => {
    assert.throws(() => createAppwriteRepository({ Query, databaseId: "x" }));
    assert.throws(() => createAppwriteRepository({ tablesDB: fakeTablesDB(), Query }));
  });
});
