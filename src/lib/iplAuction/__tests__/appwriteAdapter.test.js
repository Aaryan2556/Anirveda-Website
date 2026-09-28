import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { COMMANDS, ERROR, PLAYER_STATUS } from "../engine/index.js";
import { ADAPTER_ERROR, createAppwriteRepository } from "../repository/appwriteAdapter.js";
import { TABLES } from "../repository/appwriteSchema.js";
import { rowsToState } from "../repository/appwriteMapper.js";
import { createLocalRepository } from "../repository/localAdapter.js";
import { ADMIN, apply, buy, live, setup, teamActor } from "./fixtures.js";
import { Query, createFakeTablesDB } from "./fakeTablesDB.js";

const openRepos = [];
afterEach(() => openRepos.splice(0).forEach((repo) => repo.destroy()));

let generatedIds = 0;
const ID = { unique: () => `id${(generatedIds += 1).toString(36).padStart(8, "0")}` };

function repoFor(tablesDB, options = {}) {
  const timers = [];
  let clock = 10_000;
  const repo = createAppwriteRepository({
    tablesDB,
    Query,
    ID,
    databaseId: "ipl-dev",
    now: () => (clock += 1000),
    setIntervalImpl: (fn) => timers.push(fn) - 1,
    clearIntervalImpl: () => {},
    onError: () => {},
    ...options,
  });
  openRepos.push(repo);
  return { repo, tick: () => Promise.all(timers.map((fn) => fn())) };
}

/** What is actually stored, read back through the mapper. */
function storedState(db) {
  return rowsToState({
    auction: db.rows(TABLES.AUCTIONS)[0],
    teams: db.rows(TABLES.TEAMS),
    players: db.rows(TABLES.PLAYERS),
    purchases: db.rows(TABLES.PURCHASES),
    activity: db.rows(TABLES.ACTIVITY),
  });
}

const cmd = (type, extra = {}) => ({ type, actor: ADMIN, ...extra });

/** Runs `commands` through the Appwrite adapter (fake DB) and the local adapter; final states must match. */
async function assertParity(seed, commands) {
  const db = createFakeTablesDB();
  db.store(seed);
  const { repo: remote } = repoFor(db);
  let clock = 10_000;
  const local = createLocalRepository({
    createSeedState: () => seed,
    storage: null,
    BroadcastChannelImpl: null,
    locks: null,
    now: () => (clock += 1000),
  });
  openRepos.push(local);

  for (const command of commands) {
    const [a, b] = [await remote.dispatch(command), await local.dispatch(command)];
    assert.equal(a.ok, b.ok, `${command.type}: ${a.error?.message ?? b.error?.message}`);
    assert.equal(a.ok, true, `${command.type}: ${a.error?.message}`);
  }
  assert.deepStrictEqual(storedState(db), local.getSnapshot());
  assert.deepStrictEqual(remote.getSnapshot(), local.getSnapshot());
}

describe("appwrite adapter: reading", () => {
  it("shows a placeholder, then loads the newest auction once subscribed", async () => {
    const db = createFakeTablesDB();
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
    const db = createFakeTablesDB();
    const first = setup();
    db.store(first);
    db.store({ ...setup(), auctionId: "other", createdAt: 99 });
    const { repo } = repoFor(db, { auctionId: first.auctionId });
    repo.subscribe(() => {});
    await repo.refresh();
    assert.equal(repo.getSnapshot().auctionId, first.auctionId);
  });

  it("pages through large tables", async () => {
    const db = createFakeTablesDB();
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
    const db = createFakeTablesDB();
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
    const db = createFakeTablesDB();
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
    const empty = repoFor(createFakeTablesDB()).repo;
    empty.subscribe(() => {});
    await empty.refresh();
    assert.match(empty.getSnapshot().name, /Could not load.*seed/);

    const db = createFakeTablesDB();
    const state = live();
    db.store(state);
    const { repo, tick } = repoFor(db);
    repo.subscribe(() => {});
    await repo.refresh();
    db.failReads = true;
    await tick();
    assert.deepStrictEqual(repo.getSnapshot(), state);
  });

  it("rejects stored data from a different schema version", async () => {
    const db = createFakeTablesDB();
    db.store({ ...setup(), schemaVersion: 1 });
    const { repo } = repoFor(db);
    repo.subscribe(() => {});
    await repo.refresh();
    assert.match(repo.getSnapshot().name, /schema v1/);
  });

  it("only polls while subscribed, has no reset, and requires its dependencies", async () => {
    const { repo } = repoFor(createFakeTablesDB());
    assert.equal(repo.reset, undefined);
    assert.equal(repo.kind, "appwrite");
    assert.throws(() => createAppwriteRepository({ Query, ID, databaseId: "x" }));
    assert.throws(() => createAppwriteRepository({ tablesDB: createFakeTablesDB(), Query, ID }));
    assert.throws(() => createAppwriteRepository({ tablesDB: createFakeTablesDB(), Query, databaseId: "x" }));
  });
});

describe("appwrite adapter: writing (transactions)", () => {
  it("commits an accepted command in one transaction and updates the snapshot", async () => {
    const db = createFakeTablesDB();
    db.store(live());
    const { repo } = repoFor(db);
    const result = await repo.dispatch(cmd(COMMANDS.OPEN_LOT));
    assert.equal(result.ok, true);
    assert.equal(db.stats.commits, 1);
    assert.deepStrictEqual(storedState(db), result.state);
    assert.equal(repo.getSnapshot(), result.state);
    assert.equal(result.state.activity.at(-1).at, 11_000, "the adapter stamps the time");
    const activityIds = db.rows(TABLES.ACTIVITY).map((row) => row.$id);
    assert.ok(activityIds.every((rowId) => rowId !== "unique()"), "activity rows get real generated IDs");
  });

  it("a full SOLD flow persists the purchase, purse and player status", async () => {
    const db = createFakeTablesDB();
    db.store(live());
    const { repo } = repoFor(db);
    await repo.dispatch(cmd(COMMANDS.OPEN_LOT, { playerId: "bat2" }));
    const sold = await repo.dispatch(cmd(COMMANDS.SELL_PLAYER, { playerId: "bat2", teamId: "t2", price: 75 }));
    assert.equal(sold.ok, true, sold.error?.message);
    const stored = storedState(db);
    assert.equal(stored.players.bat2.status, PLAYER_STATUS.SOLD);
    assert.equal(stored.players.bat2.soldTo, "t2");
    assert.deepEqual(db.rows(TABLES.PURCHASES).map((r) => [r.$id, r.teamId, r.price]), [["bat2", "t2", 75]]);
  });

  it("an engine rejection writes nothing", async () => {
    const db = createFakeTablesDB();
    db.store(live());
    const { repo } = repoFor(db);
    const result = await repo.dispatch(cmd(COMMANDS.SELL_PLAYER, { playerId: "bat1", teamId: "t1", price: 20 }));
    assert.equal(result.ok, false);
    assert.equal(result.error.code, ERROR.NO_ACTIVE_LOT);
    assert.equal(db.stats.transactions, 0);
  });

  it("teams cannot write: the engine rejects TEAM actors before anything is sent", async () => {
    const db = createFakeTablesDB();
    db.store(live());
    const { repo } = repoFor(db);
    const result = await repo.dispatch({ type: COMMANDS.OPEN_LOT, actor: teamActor("t1") });
    assert.equal(result.error.code, ERROR.UNAUTHORIZED);
    assert.equal(db.stats.transactions, 0);
  });

  it("a user without write permission gets UNAUTHORIZED, and the transaction is rolled back", async () => {
    const db = createFakeTablesDB();
    const state = live();
    db.store(state);
    db.canWrite = false;
    const { repo } = repoFor(db);
    const result = await repo.dispatch(cmd(COMMANDS.OPEN_LOT));
    assert.equal(result.ok, false);
    assert.equal(result.error.code, ERROR.UNAUTHORIZED);
    assert.equal(db.stats.rollbacks, 1);
    assert.deepStrictEqual(storedState(db), state);
  });

  it("runs against the latest stored state, not an out-of-date snapshot", async () => {
    const db = createFakeTablesDB();
    db.store(live());
    const { repo: tabA } = repoFor(db);
    const { repo: tabB } = repoFor(db);
    tabA.subscribe(() => {});
    await tabA.refresh(); // tab A now holds a snapshot with no lot
    await tabB.dispatch(cmd(COMMANDS.OPEN_LOT, { playerId: "bat1" }));
    const result = await tabA.dispatch(cmd(COMMANDS.OPEN_LOT, { playerId: "bat2" }));
    assert.equal(result.error.code, ERROR.LOT_IN_PROGRESS);
    assert.equal(tabA.getSnapshot().lot.playerId, "bat1", "the failed dispatch still refreshed tab A");
  });

  it("two admin tabs racing to sell the same lot: exactly one sale is recorded", async () => {
    const db = createFakeTablesDB();
    db.store(live());
    const { repo: tabA } = repoFor(db);
    const { repo: tabB } = repoFor(db);
    await tabA.dispatch(cmd(COMMANDS.OPEN_LOT, { playerId: "bat1" }));

    const results = await Promise.all([
      tabA.dispatch(cmd(COMMANDS.SELL_PLAYER, { playerId: "bat1", teamId: "t1", price: 20 })),
      tabB.dispatch(cmd(COMMANDS.SELL_PLAYER, { playerId: "bat1", teamId: "t2", price: 30 })),
    ]);
    assert.deepEqual(results.map((r) => r.ok).sort(), [false, true]);
    assert.equal(results.find((r) => !r.ok).error.code, ERROR.NO_ACTIVE_LOT, "the loser retried on fresh state");
    assert.equal(db.rows(TABLES.PURCHASES).length, 1);
    const stored = storedState(db);
    assert.equal(stored.purchases.length, 1);
    assert.equal(stored.activity.length, new Set(stored.activity.map((a) => a.seq)).size);
  });

  it("gives up with STALE_STATE if it keeps losing races", async () => {
    const db = createFakeTablesDB();
    db.store(live());
    const { repo } = repoFor(db);
    let sneak = live();
    db.beforeCommit = async () => {
      // Another admin commits first every time.
      sneak = apply(sneak, { type: sneak.lot ? COMMANDS.MARK_UNSOLD : COMMANDS.OPEN_LOT });
      db.store(sneak);
    };
    const result = await repo.dispatch(cmd(COMMANDS.PAUSE_AUCTION));
    assert.equal(result.ok, false);
    assert.equal(result.error.code, ERROR.STALE_STATE);
  });

  it("a network failure is reported as NETWORK_ERROR", async () => {
    const db = createFakeTablesDB();
    db.store(live());
    db.failReads = true;
    const { repo } = repoFor(db);
    const result = await repo.dispatch(cmd(COMMANDS.OPEN_LOT));
    assert.equal(result.error.code, ADAPTER_ERROR.NETWORK_ERROR);
  });

  it("parity: the same commands give the same final state as the local adapter", async () => {
    const seed = live();
    const commands = [
      cmd(COMMANDS.REORDER_PLAYERS, { playerOrder: [...seed.playerOrder].reverse() }),
      cmd(COMMANDS.OPEN_LOT),
      cmd(COMMANDS.MARK_UNSOLD),
      cmd(COMMANDS.OPEN_LOT),
      cmd(COMMANDS.UNDO),
      cmd(COMMANDS.OPEN_LOT, { playerId: "bat2" }),
      cmd(COMMANDS.SELL_PLAYER, { playerId: "bat2", teamId: "t1", price: 90 }),
      cmd(COMMANDS.OPEN_LOT, { playerId: "wk1" }),
      cmd(COMMANDS.SELL_PLAYER, { playerId: "wk1", teamId: "t3", price: 20 }),
      cmd(COMMANDS.CANCEL_SALE, { playerId: "bat2" }),
      cmd(COMMANDS.WITHDRAW_PLAYER, { playerId: "bat3" }),
      cmd(COMMANDS.PAUSE_AUCTION),
      cmd(COMMANDS.END_AUCTION),
    ];

    await assertParity(seed, commands);
  });

  it("parity: setup commands that delete rows (players, teams) match the local adapter", async () => {
    const seed = setup();
    await assertParity(seed, [
      cmd(COMMANDS.UPDATE_TEAM, { teamId: "t1", changes: { name: "Renamed One", shortName: "RN1" } }),
      cmd(COMMANDS.REMOVE_TEAM, { teamId: "t3" }),
      cmd(COMMANDS.ADD_PLAYER, { player: { id: "imp1", name: "Imported", role: "BOWLER", basePrice: 25, isOverseas: false, dataSource: "FICTIONAL" } }),
      cmd(COMMANDS.WITHDRAW_PLAYER, { playerId: "bat2" }),
      cmd(COMMANDS.REMOVE_PLAYER, { playerId: "bat2" }),
      cmd(COMMANDS.REMOVE_PLAYER, { playerId: "bat1" }),
      cmd(COMMANDS.UPDATE_PLAYER, { playerId: "imp1", changes: { age: 30, stats: { bowling: { wickets: 4 } } } }),
      cmd(COMMANDS.START_AUCTION),
      cmd(COMMANDS.OPEN_LOT),
      cmd(COMMANDS.SELL_PLAYER, { playerId: "bat3", teamId: "t1", price: 100 }),
    ]);
  });

  it("a command touching more rows than one transaction allows fails cleanly (known limit)", async () => {
    // Removing the FIRST of many players renumbers every later player's `order`.
    const players = Array.from({ length: 120 }, (_, i) => ({
      id: `p${i}`, name: `Fictional ${i}`, role: "BATTER", basePrice: 20, isOverseas: false, dataSource: "FICTIONAL",
    }));
    const db = createFakeTablesDB();
    db.store(setup({ players }));
    const { repo } = repoFor(db);
    const before = storedState(db);

    const result = await repo.dispatch(cmd(COMMANDS.REMOVE_PLAYER, { playerId: "p0" }));
    assert.equal(result.error.code, ADAPTER_ERROR.SERVER_ERROR);
    assert.match(result.error.message, /limit is 100/);
    assert.deepStrictEqual(storedState(db), before, "nothing was written");

    const last = await repo.dispatch(cmd(COMMANDS.REMOVE_PLAYER, { playerId: "p119" }));
    assert.equal(last.ok, true, "removing a later player touches few rows and works");
  });
});
