import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { COMMANDS, ERROR, SCHEMA_VERSION, createInitialState } from "../engine/index.js";
import { createLocalRepository } from "../repository/localAdapter.js";
import { createMockAuctionState } from "../repository/mockSeed.js";
import { ADMIN, PLAYERS, TEAMS, teamActor, testConfig } from "./fixtures.js";

/** In-memory stand-in for localStorage, shared between "tabs". */
function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

let channelCounter = 0;
const openRepos = [];

/** Creates N repositories that behave like N browser tabs of the same origin. */
function tabs(count, { storage = memoryStorage(), seed } = {}) {
  channelCounter += 1;
  const channelName = `ipl-test-${process.pid}-${channelCounter}`;
  let clock = 1000;
  const createSeedState = seed ?? (() => createInitialState({
    auctionId: `test-${channelCounter}-${clock}`,
    config: testConfig(),
    teams: TEAMS,
    players: PLAYERS,
    at: clock++,
  }));
  const repos = Array.from({ length: count }, () => createLocalRepository({
    createSeedState,
    storage,
    channelName,
    storageKey: channelName,
    locks: null,
    now: () => clock++,
  }));
  openRepos.push(...repos);
  return { repos, storage, key: channelName };
}

async function waitFor(predicate, timeoutMs = 1000) {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error("waitFor timed out");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

afterEach(() => {
  while (openRepos.length) openRepos.pop().destroy();
});

describe("local repository", () => {
  it("seeds once and every tab shares the same auction", () => {
    const { repos: [a, b] } = tabs(2);
    assert.equal(a.getSnapshot().auctionId, b.getSnapshot().auctionId);
    assert.equal(a.getSnapshot().version, 0);
  });

  it("persists accepted commands and syncs other tabs over BroadcastChannel", async () => {
    const { repos: [admin, team], storage, key } = tabs(2);
    let notified = 0;
    team.subscribe(() => { notified += 1; });

    const result = await admin.dispatch({ type: COMMANDS.START_AUCTION, actor: ADMIN });
    assert.equal(result.ok, true);
    assert.equal(admin.getSnapshot().status, "LIVE");
    assert.equal(JSON.parse(storage.getItem(key)).status, "LIVE");

    await waitFor(() => team.getSnapshot().status === "LIVE");
    assert.ok(notified >= 1);
  });

  it("stamps commands with the adapter clock", async () => {
    const { repos: [admin] } = tabs(1);
    await admin.dispatch({ type: COMMANDS.START_AUCTION, actor: ADMIN });
    assert.equal(typeof admin.getSnapshot().activity[0].at, "number");
  });

  it("does not write rejected commands", async () => {
    const { repos: [admin], storage, key } = tabs(1);
    const before = storage.getItem(key);
    const result = await admin.dispatch({ type: COMMANDS.START_AUCTION, actor: teamActor("t1") });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, ERROR.UNAUTHORIZED);
    assert.equal(storage.getItem(key), before);
  });

  it("a tab that missed a broadcast still validates against the latest stored state", async () => {
    const { repos: [admin, t1, t2] } = tabs(3); // t1, t2: two more admin tabs
    await admin.dispatch({ type: COMMANDS.START_AUCTION, actor: ADMIN });
    await admin.dispatch({ type: COMMANDS.OPEN_LOT, playerId: "bat1", actor: ADMIN });

    // Two admin screens race to record different results for the same lot; exactly one can win.
    const results = await Promise.all([
      t1.dispatch({ type: COMMANDS.SELL_PLAYER, playerId: "bat1", teamId: "t1", price: 20, actor: ADMIN }),
      t2.dispatch({ type: COMMANDS.SELL_PLAYER, playerId: "bat1", teamId: "t2", price: 30, actor: ADMIN }),
    ]);
    assert.deepEqual(results.map((r) => r.ok).sort(), [false, true]);
    assert.equal(results.find((r) => !r.ok).error.code, ERROR.NO_ACTIVE_LOT);

    await waitFor(() => admin.getSnapshot().purchases.length === 1);
    assert.equal(admin.getSnapshot().lot, null);
  });

  it("reset starts a new auction in every tab", async () => {
    const { repos: [admin, team] } = tabs(2);
    await admin.dispatch({ type: COMMANDS.START_AUCTION, actor: ADMIN });
    await waitFor(() => team.getSnapshot().status === "LIVE");
    const oldId = team.getSnapshot().auctionId;

    await admin.reset();
    await waitFor(() => team.getSnapshot().auctionId !== oldId);
    assert.equal(team.getSnapshot().status, "SETUP");
    assert.equal(team.getSnapshot().version, 0);
  });

  it("ignores corrupt or outdated stored data and reseeds", () => {
    const storage = memoryStorage();
    storage.setItem("ipl-bad", "{not json");
    const repo = createLocalRepository({
      createSeedState: () => createInitialState({ auctionId: "fresh", config: testConfig(), teams: TEAMS, players: PLAYERS }),
      storage,
      storageKey: "ipl-bad",
      BroadcastChannelImpl: null,
      locks: null,
    });
    openRepos.push(repo);
    assert.equal(repo.getSnapshot().auctionId, "fresh");

    storage.setItem("ipl-old", JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1, auctionId: "future" }));
    const repo2 = createLocalRepository({
      createSeedState: () => createInitialState({ auctionId: "fresh2", config: testConfig(), teams: TEAMS, players: PLAYERS }),
      storage,
      storageKey: "ipl-old",
      BroadcastChannelImpl: null,
      locks: null,
    });
    openRepos.push(repo2);
    assert.equal(repo2.getSnapshot().auctionId, "fresh2");
  });

  it("the default mock seed is a valid auction built from fictional data", () => {
    const state = createMockAuctionState({ at: 5 });
    assert.equal(state.status, "SETUP");
    assert.ok(state.teamOrder.length >= 2);
    assert.ok(Object.values(state.players).every((player) => player.dataSource === "FICTIONAL"));
  });
});
