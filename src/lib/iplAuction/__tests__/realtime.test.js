import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { COMMANDS } from "../engine/index.js";
import { CONNECTION_STATUS, createAppwriteRepository } from "../repository/appwriteAdapter.js";
import { createAppwriteRealtimeSource, realtimeChannels, toAuctionEvent } from "../repository/appwriteRealtime.js";
import { TABLES } from "../repository/appwriteSchema.js";
import { ADMIN, apply, live, setup, testConfig } from "./fixtures.js";
import { Query, createFakeTablesDB } from "./fakeTablesDB.js";

const openRepos = [];
afterEach(() => openRepos.splice(0).forEach((repo) => repo.destroy()));

let generatedIds = 0;
const ID = { unique: () => `rt${(generatedIds += 1).toString(36).padStart(8, "0")}` };

/** Lets every pending fake-DB call (each yields via setImmediate) finish. */
async function settle(turns = 40) {
  for (let i = 0; i < turns; i += 1) await new Promise((resolve) => setImmediate(resolve));
}

function fakeTimers() {
  const timeouts = new Map();
  const intervals = new Map();
  let next = 0;
  return {
    setTimeoutImpl: (fn, ms) => (timeouts.set(++next, { fn, ms }), next),
    clearTimeoutImpl: (id) => timeouts.delete(id),
    setIntervalImpl: (fn, ms) => (intervals.set(++next, { fn, ms }), next),
    clearIntervalImpl: (id) => intervals.delete(id),
    /** Fires every pending timeout once (debounce windows, idle stop). */
    runTimeouts() {
      const due = [...timeouts.values()];
      timeouts.clear();
      due.forEach(({ fn }) => fn());
    },
    pendingTimeouts: () => timeouts.size,
    intervals: () => [...intervals.values()],
  };
}

/** Fake realtime source with the same shape as createAppwriteRealtimeSource(). */
function fakeSource() {
  const subs = new Set();
  return {
    subs,
    subscribe(channels, onEvent, onStatus) {
      const sub = { channels, onEvent, onStatus };
      subs.add(sub);
      onStatus("connecting");
      return () => subs.delete(sub);
    },
    emit: (event) => [...subs].forEach((sub) => sub.onEvent(event)),
    status: (status) => [...subs].forEach((sub) => sub.onStatus(status)),
  };
}

/** Lifecycle stub: `wake()` = tab visible / back online, `offline()` = network lost. */
function fakeLifecycle() {
  const handlers = { onWake: () => {}, onOffline: () => {} };
  let watching = 0;
  return {
    watch(h) {
      Object.assign(handlers, h);
      watching += 1;
      return () => (watching -= 1);
    },
    wake: () => handlers.onWake(),
    offline: () => handlers.onOffline(),
    watching: () => watching,
  };
}

function countReads(db) {
  const counter = { reads: 0 };
  db.beforeList = (tableId) => {
    if (tableId === TABLES.TEAMS) counter.reads += 1;
  };
  return counter;
}

function realtimeRepo(db, options = {}) {
  const timers = fakeTimers();
  const source = fakeSource();
  const lifecycle = fakeLifecycle();
  let clock = 50_000;
  const repo = createAppwriteRepository({
    tablesDB: db,
    Query,
    ID,
    databaseId: "ipl-dev",
    realtime: source,
    watchLifecycle: lifecycle.watch,
    now: () => (clock += 1000),
    onError: () => {},
    ...timers,
    ...options,
  });
  openRepos.push(repo);
  return { repo, timers, source, lifecycle };
}

const auctionEvent = (auctionId = "test-auction") => ({ tableId: TABLES.AUCTIONS, auctionId, events: [] });
const rowEvent = (tableId, auctionId = "test-auction") => ({ tableId, auctionId, events: [] });

describe("realtime: channels and events", () => {
  it("subscribes to every IPL table under both channel naming schemes", () => {
    const channels = realtimeChannels("ipl-dev");
    for (const tableId of Object.values(TABLES)) {
      assert.ok(channels.includes(`databases.ipl-dev.tables.${tableId}.rows`));
      assert.ok(channels.includes(`databases.ipl-dev.collections.${tableId}.documents`));
    }
  });

  it("reads the table and owning auction from an SDK event", () => {
    const auction = toAuctionEvent({
      channels: ["rows", `databases.ipl-dev.tables.${TABLES.AUCTIONS}.rows.a1`],
      events: ["x.update"],
      payload: { $id: "a1" },
    });
    assert.deepEqual(auction, { tableId: TABLES.AUCTIONS, auctionId: "a1", events: ["x.update"], payload: { $id: "a1" } });
    const purchase = toAuctionEvent({
      channels: [`databases.ipl-dev.collections.${TABLES.PURCHASES}.documents`],
      events: [],
      payload: { $id: "bat1", auctionId: "a1" },
    });
    assert.equal(purchase.tableId, TABLES.PURCHASES);
    assert.equal(purchase.auctionId, "a1");
    assert.equal(toAuctionEvent({ channels: ["account"], payload: {} }).tableId, null);
  });
});

describe("realtime: adapter", () => {
  it("collapses a burst of events into one refetch", async () => {
    const db = createFakeTablesDB();
    db.store(live());
    const counter = countReads(db);
    const { repo, timers, source } = realtimeRepo(db);
    repo.subscribe(() => {});
    await settle();
    assert.equal(counter.reads, 1, "initial load");

    for (const tableId of Object.values(TABLES)) source.emit(rowEvent(tableId));
    source.emit(auctionEvent());
    assert.equal(timers.pendingTimeouts(), 1, "one debounce window for the whole burst");
    timers.runTimeouts();
    await settle();
    assert.equal(counter.reads, 2);
  });

  it("applies a newer snapshot and ignores older or duplicate ones", async () => {
    const db = createFakeTablesDB();
    const opened = apply(live(), { type: COMMANDS.OPEN_LOT });
    db.store(opened);
    const { repo, timers, source } = realtimeRepo(db);
    let notified = 0;
    repo.subscribe(() => (notified += 1));
    await settle();
    const first = repo.getSnapshot();
    assert.equal(first.version, opened.version);
    notified = 0;

    // Duplicate: same version again → same reference, no re-render.
    source.emit(auctionEvent());
    timers.runTimeouts();
    await settle();
    assert.equal(repo.getSnapshot(), first);
    assert.equal(notified, 0);

    // Older (a delayed/replayed read) → ignored.
    db.store(live());
    source.emit(auctionEvent());
    timers.runTimeouts();
    await settle();
    assert.equal(repo.getSnapshot(), first);

    // Newer → applied.
    const sold = apply(opened, { type: COMMANDS.SELL_PLAYER, playerId: opened.lot.playerId, teamId: "t1", price: 100 });
    db.store(sold);
    source.emit(rowEvent(TABLES.PURCHASES));
    timers.runTimeouts();
    await settle();
    assert.equal(repo.getSnapshot().version, sold.version);
    assert.equal(notified, 1);
  });

  it("re-reads when a change signal arrives while a read is in flight", async () => {
    const db = createFakeTablesDB();
    const base = live();
    db.store(base);
    const newer = apply(base, { type: COMMANDS.OPEN_LOT });
    const { repo } = realtimeRepo(db);
    let versionChecks = 0;
    const getRow = db.getRow;
    // Land a write right after the first read's final version check (its only getRow
    // call when not pinned to an auction), then signal it.
    db.getRow = async (args) => {
      const row = await getRow(args);
      versionChecks += 1;
      if (versionChecks === 1) {
        db.store(newer);
        repo.refresh();
      }
      return row;
    };
    await repo.refresh();
    assert.equal(repo.getSnapshot().version, newer.version, "the write that landed mid-read must be picked up");
  });

  it("ignores events for other auctions when it is pinned to one", async () => {
    const db = createFakeTablesDB();
    db.store(live());
    const { repo, timers, source } = realtimeRepo(db, { auctionId: "test-auction" });
    repo.subscribe(() => {});
    await settle();
    source.emit(rowEvent(TABLES.PURCHASES, "another-auction"));
    source.emit(auctionEvent("another-auction"));
    assert.equal(timers.pendingTimeouts(), 0);
    source.emit(rowEvent(TABLES.PURCHASES, "test-auction"));
    assert.equal(timers.pendingTimeouts(), 1);
  });

  it("switches to a newly created auction when not pinned", async () => {
    const db = createFakeTablesDB();
    db.store(live());
    const { repo, timers, source } = realtimeRepo(db);
    repo.subscribe(() => {});
    await settle();
    // Child rows of another auction are ignored, but a new auction row is followed.
    source.emit(rowEvent(TABLES.PLAYERS, "reset-auction"));
    assert.equal(timers.pendingTimeouts(), 0);
    db.store({ ...setup(), auctionId: "reset-auction", createdAt: 99 });
    source.emit(auctionEvent("reset-auction"));
    timers.runTimeouts();
    await settle();
    assert.equal(repo.getSnapshot().auctionId, "reset-auction");
  });

  it("reports connection status and refetches after a reconnect", async () => {
    const db = createFakeTablesDB();
    db.store(live());
    const counter = countReads(db);
    const { repo, timers, source } = realtimeRepo(db);
    const seen = [];
    repo.connection.subscribe(() => seen.push(repo.connection.getStatus().status));
    repo.subscribe(() => {});
    await settle();
    assert.equal(repo.connection.getStatus().status, CONNECTION_STATUS.CONNECTING);
    assert.ok(repo.connection.getStatus().lastSyncAt > 0);

    source.status("open");
    assert.equal(repo.connection.getStatus().status, CONNECTION_STATUS.LIVE);
    assert.equal(timers.pendingTimeouts(), 0, "the first open needs no catch-up read");

    source.status("closed");
    assert.equal(repo.connection.getStatus().status, CONNECTION_STATUS.RECONNECTING);
    const readsBefore = counter.reads;
    db.store(apply(live(), { type: COMMANDS.OPEN_LOT })); // written while disconnected
    source.status("connecting"); // the SDK retrying must not hide "reconnecting"
    assert.equal(repo.connection.getStatus().status, CONNECTION_STATUS.RECONNECTING);
    source.status("open");
    assert.equal(repo.connection.getStatus().status, CONNECTION_STATUS.LIVE);
    timers.runTimeouts();
    await settle();
    assert.equal(counter.reads, readsBefore + 1, "reconnect triggers a catch-up read");
    assert.ok(repo.getSnapshot().lot, "the change made while disconnected is shown");
    assert.deepEqual(seen.filter((s, i) => s !== seen[i - 1]).slice(0, 4), ["connecting", "live", "reconnecting", "live"]);
  });

  it("refetches when the tab becomes visible or the network returns, and shows offline", async () => {
    const db = createFakeTablesDB();
    db.store(live());
    const counter = countReads(db);
    const { repo, timers, source, lifecycle } = realtimeRepo(db);
    repo.subscribe(() => {});
    await settle();
    source.status("open");

    lifecycle.offline();
    assert.equal(repo.connection.getStatus().status, CONNECTION_STATUS.OFFLINE);
    lifecycle.wake();
    assert.equal(repo.connection.getStatus().status, CONNECTION_STATUS.LIVE);
    timers.runTimeouts();
    await settle();
    assert.equal(counter.reads, 2);
  });

  it("polls every 10 s as a safety net with realtime, every 2 s without", async () => {
    const withRealtime = realtimeRepo(createFakeTablesDB());
    withRealtime.repo.subscribe(() => {});
    assert.deepEqual(withRealtime.timers.intervals().map((i) => i.ms), [10_000]);

    const timers = fakeTimers();
    const polling = createAppwriteRepository({
      tablesDB: createFakeTablesDB(), Query, ID, databaseId: "ipl-dev", onError: () => {}, watchLifecycle: () => () => {}, ...timers,
    });
    openRepos.push(polling);
    polling.subscribe(() => {});
    assert.deepEqual(timers.intervals().map((i) => i.ms), [2000]);
    assert.equal(polling.connection.getStatus().status, CONNECTION_STATUS.POLLING);
    await settle();
  });

  it("keeps the socket through a quick unsubscribe/resubscribe, closes it when idle", async () => {
    const db = createFakeTablesDB();
    db.store(live());
    const { repo, timers, source, lifecycle } = realtimeRepo(db);
    const off = repo.subscribe(() => {});
    off();
    off(); // calling unsubscribe twice is harmless
    repo.subscribe(() => {}); // e.g. React StrictMode remount or a page change
    timers.runTimeouts();
    await settle();
    assert.equal(source.subs.size, 1, "still subscribed, no reconnect");
    assert.equal(timers.intervals().length, 1);

    const repo2 = realtimeRepo(db);
    const off2 = repo2.repo.subscribe(() => {});
    await settle();
    off2();
    repo2.timers.runTimeouts();
    assert.equal(repo2.source.subs.size, 0, "socket closed after the idle grace period");
    assert.equal(repo2.timers.intervals().length, 0);
    assert.equal(repo2.lifecycle.watching(), 0);
    assert.equal(lifecycle.watching(), 1);
  });
});

describe("realtime: SDK wrapper", () => {
  function fakeSdkRealtime() {
    const opens = [];
    const closes = [];
    let resolveSub;
    const sdk = {
      closed: 0,
      callback: null,
      onOpen: (cb) => opens.push(cb),
      onClose: (cb) => closes.push(cb),
      subscribe(channels, callback) {
        sdk.callback = callback;
        return new Promise((resolve) => {
          resolveSub = () => resolve({ close: async () => (sdk.closed += 1) });
        });
      },
      open: () => opens.forEach((cb) => cb()),
      drop: () => closes.forEach((cb) => cb()),
      resolve: () => resolveSub(),
    };
    return sdk;
  }

  it("forwards events and socket status, and closes the subscription", async () => {
    const sdk = fakeSdkRealtime();
    const source = createAppwriteRealtimeSource({ realtime: sdk });
    const events = [];
    const statuses = [];
    const off = source.subscribe(realtimeChannels("db"), (e) => events.push(e), (s) => statuses.push(s));
    sdk.resolve();
    await settle(2);
    sdk.open();
    sdk.callback({ channels: [`databases.db.tables.${TABLES.PLAYERS}.rows`], events: [], payload: { auctionId: "a" } });
    sdk.drop();
    sdk.open();
    assert.deepEqual(statuses, ["connecting", "open", "closed", "open"]);
    assert.deepEqual(events, [{ tableId: TABLES.PLAYERS, auctionId: "a", events: [], payload: { auctionId: "a" } }]);
    off();
    await settle(2);
    assert.equal(sdk.closed, 1);
    sdk.open();
    sdk.callback({ channels: [], events: [], payload: {} });
    assert.equal(statuses.length, 4, "no status after unsubscribe");
    assert.equal(events.length, 1, "no events after unsubscribe");
  });

  it("closes a subscription that resolves after unsubscribe", async () => {
    const sdk = fakeSdkRealtime();
    const off = createAppwriteRealtimeSource({ realtime: sdk }).subscribe(["c"], () => {}, () => {});
    off();
    sdk.resolve();
    await settle(2);
    assert.equal(sdk.closed, 1);
  });
});

describe("realtime: multi-device simulation", () => {
  /**
   * 1 admin + 8 team screens on one fake database. After every commit the hub
   * sends a change signal per written row to every screen, some late, some twice,
   * in shuffled order; one screen drops its socket for part of the auction.
   */
  it("every screen ends identical to the database after 50 lots", async () => {
    const teams = Array.from({ length: 8 }, (_, i) => ({ id: `team${i}`, name: `Fictional Team ${i}` }));
    const roles = ["BATTER", "BOWLER", "ALL_ROUNDER", "WICKETKEEPER"];
    const players = Array.from({ length: 50 }, (_, i) => ({
      id: `p${i}`, name: `Fictional Player ${i}`, role: roles[i % 4], basePrice: 20, isOverseas: i % 5 === 0, dataSource: "FICTIONAL",
    }));
    const unlimited = { min: 0, max: 20 };
    const config = testConfig({
      initialPurse: 5000, squad: unlimited, maxOverseas: 20,
      roleLimits: { BATTER: unlimited, BOWLER: unlimited, ALL_ROUNDER: unlimited, WICKETKEEPER: unlimited },
    });
    const db = createFakeTablesDB();
    db.store(apply(setup({ config, teams, players }), { type: COMMANDS.START_AUCTION }));

    let seed = 7;
    const random = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    const screens = Array.from({ length: 9 }, () => realtimeRepo(db, { auctionId: "test-auction" }));
    const [admin, ...teamScreens] = screens;
    screens.forEach(({ repo, source }) => {
      repo.subscribe(() => {});
      source.status("open");
    });
    await settle();

    const deliveries = [];
    const commit = db.updateTransaction;
    db.updateTransaction = async (args) => {
      await commit(args);
      if (!args.commit) return;
      for (const tableId of [TABLES.AUCTIONS, TABLES.PLAYERS, TABLES.PURCHASES, TABLES.ACTIVITY]) {
        for (const screen of screens) {
          const copies = random() < 0.2 ? 2 : 1;
          for (let c = 0; c < copies; c += 1) deliveries.push({ screen, event: rowEvent(tableId) });
        }
      }
    };
    async function deliverSome() {
      deliveries.sort(() => random() - 0.5);
      const now = deliveries.splice(0, Math.ceil(deliveries.length * random()));
      now.forEach(({ screen, event }) => screen.source.emit(event));
      screens.forEach(({ timers }) => timers.runTimeouts());
      await settle(5);
    }

    const flaky = teamScreens[3];
    const send = async (command) => {
      const result = await admin.repo.dispatch({ actor: ADMIN, ...command });
      assert.equal(result.ok, true, `${command.type}: ${result.error?.message}`);
      await deliverSome();
    };
    for (let lot = 0; lot < 50; lot += 1) {
      if (lot === 10) flaky.source.status("closed");
      if (lot === 20) {
        flaky.source.status("open"); // reconnect → catch-up read
        flaky.timers.runTimeouts();
      }
      await send({ type: COMMANDS.OPEN_LOT });
      const { playerId } = admin.repo.getSnapshot().lot;
      if (lot % 7 === 6) await send({ type: COMMANDS.MARK_UNSOLD });
      else await send({ type: COMMANDS.SELL_PLAYER, playerId, teamId: teams[lot % 8].id, price: 20 + lot });
    }

    // Deliver whatever is still queued (the flaky screen dropped events while down).
    while (deliveries.length) await deliverSome();
    screens.forEach(({ timers }) => timers.runTimeouts());
    await settle();

    const expected = admin.repo.getSnapshot();
    assert.equal(expected.purchases.length, 50 - Math.floor(50 / 7));
    for (const [i, { repo }] of teamScreens.entries()) {
      assert.deepStrictEqual(repo.getSnapshot(), expected, `team screen ${i} differs from the admin screen`);
    }
  });
});
