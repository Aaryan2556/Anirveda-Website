import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AUCTION_STATUS,
  COMMANDS,
  ERROR,
  PLAYER_STATUS,
  createInitialState,
  getAuctionSummary,
  getMaxBid,
  getNextPlayerInSequence,
  getRecentSales,
  getSquad,
  getTeamStats,
  getUpcomingPlayers,
  reduce,
} from "../engine/index.js";
import { DEV_DEFAULT_CONFIG } from "../config.js";
import {
  ADMIN, apply, buy, live, open, reject, sell, setup, teamActor, testConfig, TEAMS, PLAYERS,
} from "./fixtures.js";

const { OPEN_LOT, SELL_PLAYER, MARK_UNSOLD, CANCEL_SALE, REORDER_PLAYERS, WITHDRAW_PLAYER, REINSTATE_PLAYER, UNDO } =
  COMMANDS;

/** A SELL_PLAYER command for whoever is on the block. */
const sale = (state, teamId, price) => ({ type: SELL_PLAYER, playerId: state.lot?.playerId, teamId, price });

describe("initial state", () => {
  it("starts in SETUP with every player available", () => {
    const state = setup();
    assert.equal(state.status, AUCTION_STATUS.SETUP);
    assert.equal(state.version, 0);
    assert.ok(Object.values(state.players).every((p) => p.status === PLAYER_STATUS.AVAILABLE));
    assert.equal(getTeamStats(state, "t1").purse, 1000);
  });

  it("copies the config instead of sharing it", () => {
    const state = createInitialState({ auctionId: "a", config: DEV_DEFAULT_CONFIG });
    assert.notEqual(state.config, DEV_DEFAULT_CONFIG);
    assert.deepEqual(state.config, structuredClone(DEV_DEFAULT_CONFIG));
  });

  it("throws on invalid seed data", () => {
    assert.throws(() => createInitialState({ auctionId: "a", config: testConfig({ initialPurse: -1 }) }));
    assert.throws(() => createInitialState({ auctionId: "a", config: testConfig(), players: [PLAYERS[0], PLAYERS[0]] }));
    assert.throws(() => createInitialState({ auctionId: "a", config: testConfig(), players: [{ ...PLAYERS[0], basePrice: 12.5 }] }));
  });
});

describe("commands and permissions", () => {
  it("rejects unknown commands, including the removed in-app bidding", () => {
    reject(setup(), { type: "DELETE_EVERYTHING" }, ERROR.UNKNOWN_COMMAND);
    reject(open(live(), "bat1"), { type: "PLACE_BID", teamId: "t1", amount: 20 }, ERROR.UNKNOWN_COMMAND);
  });

  it("requires an actor", () => {
    const result = reduce(setup(), { type: COMMANDS.START_AUCTION });
    assert.equal(result.error.code, ERROR.UNAUTHORIZED);
  });

  it("teams are view-only: every command is admin-only", () => {
    reject(setup(), { type: COMMANDS.START_AUCTION, actor: teamActor("t1") }, ERROR.UNAUTHORIZED);
    const state = open(live(), "bat1");
    reject(state, { ...sale(state, "t1", 20), actor: teamActor("t1") }, ERROR.UNAUTHORIZED);
    reject(state, { type: MARK_UNSOLD, actor: teamActor("t1") }, ERROR.UNAUTHORIZED);
    reject(state, { type: UNDO, actor: teamActor("t1") }, ERROR.UNAUTHORIZED);
    const sold = buy(live(), "t1", "bat1");
    reject(sold, { type: CANCEL_SALE, playerId: "bat1", actor: teamActor("t1") }, ERROR.UNAUTHORIZED);
  });

  it("every accepted command bumps the version and logs activity", () => {
    const state = open(live(), "bat1");
    assert.equal(state.version, 2);
    assert.equal(state.activity.length, 2);
    assert.equal(state.activity[1].type, OPEN_LOT);
    assert.equal(state.activity[1].at, 1000);
  });
});

describe("auction lifecycle and pause/resume", () => {
  it("needs at least two teams to start", () => {
    reject(setup({ teams: [TEAMS[0]] }), { type: COMMANDS.START_AUCTION }, ERROR.NOT_ENOUGH_PARTICIPANTS);
  });

  it("no player can be put up before the auction starts", () => {
    reject(setup(), { type: OPEN_LOT, playerId: "bat1" }, ERROR.AUCTION_NOT_LIVE);
  });

  it("rules and teams can only change during SETUP", () => {
    const state = setup();
    const updated = apply(state, { type: COMMANDS.UPDATE_CONFIG, config: testConfig({ initialPurse: 500 }) });
    assert.equal(getTeamStats(updated, "t1").purse, 500);
    reject(state, { type: COMMANDS.UPDATE_CONFIG, config: testConfig({ squad: { min: 9, max: 1 } }) }, ERROR.INVALID_CONFIG);
    const started = apply(updated, { type: COMMANDS.START_AUCTION });
    reject(started, { type: COMMANDS.UPDATE_CONFIG, config: testConfig() }, ERROR.AUCTION_NOT_IN_SETUP);
    reject(started, { type: COMMANDS.ADD_TEAM, team: { id: "t9", name: "Late" } }, ERROR.AUCTION_NOT_IN_SETUP);
  });

  it("pause blocks opening lots and recording results; resume restores them", () => {
    let state = open(live(), "bat1");
    state = apply(state, { type: COMMANDS.PAUSE_AUCTION });
    assert.equal(state.status, AUCTION_STATUS.PAUSED);
    reject(state, sale(state, "t1", 20), ERROR.AUCTION_PAUSED);
    reject(state, { type: MARK_UNSOLD }, ERROR.AUCTION_PAUSED);
    reject(state, { type: COMMANDS.PAUSE_AUCTION }, ERROR.AUCTION_PAUSED);

    state = apply(state, { type: COMMANDS.RESUME_AUCTION });
    assert.equal(state.lot.playerId, "bat1", "the open lot survives a pause");
    assert.equal(sell(state, "t2", 25).players.bat1.soldTo, "t2");
    reject(state, { type: COMMANDS.RESUME_AUCTION }, ERROR.AUCTION_NOT_LIVE);
  });

  it("can only end with no open lot, and nothing changes afterwards", () => {
    let state = open(live(), "bat1");
    reject(state, { type: COMMANDS.END_AUCTION }, ERROR.LOT_IN_PROGRESS);
    state = sell(state, "t1");
    state = apply(state, { type: COMMANDS.END_AUCTION });
    assert.equal(state.status, AUCTION_STATUS.COMPLETED);
    reject(state, { type: OPEN_LOT, playerId: "bat2" }, ERROR.AUCTION_COMPLETED);
    reject(state, { type: UNDO }, ERROR.AUCTION_COMPLETED);
    reject(state, { type: WITHDRAW_PLAYER, playerId: "bat2" }, ERROR.AUCTION_COMPLETED);
    reject(state, { type: CANCEL_SALE, playerId: "bat1" }, ERROR.AUCTION_COMPLETED);
  });
});

describe("player sequence", () => {
  it("with no playerId, the next available player in sequence goes up", () => {
    let state = live();
    assert.equal(getNextPlayerInSequence(state).id, "bat1");
    state = open(state);
    assert.equal(state.lot.playerId, "bat1");
    state = apply(sell(state, "t1"), { type: OPEN_LOT });
    assert.equal(state.lot.playerId, "bat2");
    state = apply(apply(state, { type: MARK_UNSOLD }), { type: OPEN_LOT });
    assert.equal(state.lot.playerId, "bat3", "unsold players are not picked up again automatically");
  });

  it("skips withdrawn players and reports when the sequence is exhausted", () => {
    let state = apply(live(), { type: WITHDRAW_PLAYER, playerId: "bat1" });
    assert.equal(open(state).lot.playerId, "bat2");
    state = live({ players: PLAYERS.slice(0, 1) });
    state = apply(open(state), { type: MARK_UNSOLD });
    assert.equal(getNextPlayerInSequence(state), null);
    reject(state, { type: OPEN_LOT }, ERROR.NO_PLAYERS_LEFT);
  });

  it("the admin can still put up any available player out of order", () => {
    const state = open(live(), "wk1");
    assert.equal(state.lot.playerId, "wk1");
    assert.equal(getUpcomingPlayers(state)[0].id, "bat1");
  });

  it("the sequence can be reordered, but only as a full permutation", () => {
    const state = live();
    const reversed = [...state.playerOrder].reverse();
    const reordered = apply(state, { type: REORDER_PLAYERS, playerOrder: reversed });
    assert.deepEqual(reordered.playerOrder, reversed);
    assert.equal(open(reordered).lot.playerId, reversed[0]);

    reject(state, { type: REORDER_PLAYERS, playerOrder: reversed.slice(1) }, ERROR.INVALID_INPUT);
    reject(state, { type: REORDER_PLAYERS, playerOrder: [...reversed.slice(1), reversed[1]] }, ERROR.INVALID_INPUT);
    reject(state, { type: REORDER_PLAYERS, playerOrder: [...reversed.slice(1), "ghost"] }, ERROR.INVALID_INPUT);
    reject(state, { type: REORDER_PLAYERS, playerOrder: "bat1" }, ERROR.INVALID_INPUT);
  });
});

describe("lots and player status", () => {
  it("only one player can be on the block at a time", () => {
    const state = open(live(), "bat1");
    assert.equal(state.players.bat1.status, PLAYER_STATUS.ON_BLOCK);
    reject(state, { type: OPEN_LOT, playerId: "bat2" }, ERROR.LOT_IN_PROGRESS);
    reject(state, { type: OPEN_LOT }, ERROR.LOT_IN_PROGRESS);
  });

  it("rejects unknown players", () => {
    reject(live(), { type: OPEN_LOT, playerId: "nobody" }, ERROR.NOT_FOUND);
  });
});

describe("recording a sale (SOLD)", () => {
  const lot = () => open(live(), "bat2"); // base price 50

  it("assigns the player to the team, reduces its purse and closes the lot", () => {
    const state = sell(lot(), "t2", 75);
    assert.equal(state.lot, null);
    assert.equal(state.players.bat2.status, PLAYER_STATUS.SOLD);
    assert.equal(state.players.bat2.soldTo, "t2");
    assert.equal(state.players.bat2.soldPrice, 75);
    assert.deepEqual(
      { playerId: state.purchases[0].playerId, teamId: state.purchases[0].teamId, price: state.purchases[0].price },
      { playerId: "bat2", teamId: "t2", price: 75 }
    );
    const stats = getTeamStats(state, "t2");
    assert.equal(stats.purse, 925);
    assert.equal(stats.spent, 75);
    assert.equal(stats.count, 1);
    assert.equal(stats.roles.BATTER, 1);
    assert.equal(getTeamStats(state, "t1").purse, 1000);
    assert.deepEqual(getSquad(state, "t2").map((p) => [p.id, p.price]), [["bat2", 75]]);
    assert.equal(getRecentSales(state)[0].team.id, "t2");
  });

  it("any whole-lakh price at or above base is accepted (the room sets the price)", () => {
    assert.equal(sell(lot(), "t1", 50).players.bat2.soldPrice, 50);
    assert.equal(sell(lot(), "t1", 63).players.bat2.soldPrice, 63);
  });

  it("rejects prices below base, non-whole lakhs and non-numbers", () => {
    reject(lot(), sale(lot(), "t1", 45), ERROR.PRICE_BELOW_BASE);
    reject(lot(), sale(lot(), "t1", 50.5), ERROR.INVALID_AMOUNT);
    reject(lot(), sale(lot(), "t1", "50"), ERROR.INVALID_AMOUNT);
    reject(lot(), sale(lot(), "t1", 0), ERROR.INVALID_AMOUNT);
    reject(lot(), sale(lot(), "t1", -50), ERROR.INVALID_AMOUNT);
    reject(lot(), sale(lot(), "t1", undefined), ERROR.INVALID_AMOUNT);
  });

  it("rejects unknown teams and a missing lot", () => {
    reject(lot(), sale(lot(), "ghost", 50), ERROR.NOT_FOUND);
    reject(live(), { type: SELL_PLAYER, playerId: "bat1", teamId: "t1", price: 20 }, ERROR.NO_ACTIVE_LOT);
  });

  it("refuses a sale aimed at a player who is no longer on the block", () => {
    const state = open(live(), "bat2");
    reject(state, { type: SELL_PLAYER, playerId: "bat1", teamId: "t1", price: 50 }, ERROR.STALE_STATE);
    reject(state, { type: SELL_PLAYER, teamId: "t1", price: 50 }, ERROR.STALE_STATE);
  });
});

describe("purse and minimum reserve", () => {
  it("a team cannot pay more than its remaining purse", () => {
    const state = open(live({ config: testConfig({ initialPurse: 150 }) }), "ar1"); // base 200
    reject(state, sale(state, "t1", 200), ERROR.INSUFFICIENT_PURSE);
  });

  it("spending reduces the purse and blocks later over-spending", () => {
    let state = live({ config: testConfig({ initialPurse: 250 }) });
    state = buy(state, "t1", "ar1"); // 200
    assert.equal(getTeamStats(state, "t1").purse, 50);
    state = open(state, "bat3"); // base 100
    reject(state, sale(state, "t1", 100), ERROR.INSUFFICIENT_PURSE);
    assert.equal(sell(state, "t2", 100).players.bat3.soldTo, "t2");
  });

  it("keeps a reserve for the slots still needed to reach squad.min", () => {
    const config = testConfig({
      initialPurse: 200,
      squad: { min: 3, max: 4 },
      minimumReserve: { enabled: true, perSlot: 50 },
    });
    const state = open(live({ config }), "bat3"); // base 100
    // After buying one player, 2 slots remain to reach min 3 → reserve 100 → max price 100.
    assert.equal(getMaxBid(state, "t1"), 100);
    reject(state, sale(state, "t1", 110), ERROR.RESERVE_REQUIRED);
    reject(state, sale(state, "t1", 210), ERROR.INSUFFICIENT_PURSE);
    assert.equal(sell(state, "t1", 100).players.bat3.soldTo, "t1");
  });

  it("the reserve is always applied, even if disabled in config", () => {
    const config = testConfig({ initialPurse: 200, squad: { min: 3, max: 4 } });
    assert.equal(getMaxBid(live({ config }), "t1"), 160);
  });
});

describe("squad, overseas and role limits", () => {
  it("rejects a sale once the team's squad is full", () => {
    let state = live({ config: testConfig({ squad: { min: 0, max: 1 } }) });
    state = open(buy(state, "t1", "bat1"), "bowl1");
    reject(state, sale(state, "t1", 20), ERROR.SQUAD_FULL);
    assert.equal(sell(state, "t2").players.bowl1.soldTo, "t2");
  });

  it("enforces the overseas limit", () => {
    const state = open(buy(live(), "t1", "os1"), "os2"); // maxOverseas = 1
    reject(state, sale(state, "t1", 20), ERROR.OVERSEAS_LIMIT);
  });

  it("enforces per-role maximums", () => {
    const state = open(buy(live(), "t1", "wk1"), "wk2"); // WICKETKEEPER max = 1
    reject(state, sale(state, "t1", 30), ERROR.ROLE_LIMIT);
  });

  it("keeps enough slots free to meet role minimums", () => {
    const config = testConfig({
      squad: { min: 0, max: 2 },
      roleLimits: {
        BATTER: { min: 0, max: 2 },
        BOWLER: { min: 0, max: 2 },
        ALL_ROUNDER: { min: 0, max: 2 },
        WICKETKEEPER: { min: 1, max: 1 },
      },
    });
    const state = buy(live({ config }), "t1", "bat1");
    // One slot left and no wicketkeeper yet: only a wicketkeeper may be bought.
    const batter = open(state, "bat2");
    reject(batter, sale(batter, "t1", 50), ERROR.ROLE_MINIMUM_UNREACHABLE);
    assert.equal(buy(state, "t1", "wk1").players.wk1.soldTo, "t1");
  });
});

describe("duplicate sale prevention", () => {
  it("a sold player cannot be put up again", () => {
    const state = buy(live(), "t1", "bat1");
    reject(state, { type: OPEN_LOT, playerId: "bat1" }, ERROR.ALREADY_SOLD);
  });

  it("recording the same sale twice fails (the lot is already closed)", () => {
    const onBlock = open(live(), "bat1");
    const sold = sell(onBlock, "t1", 20);
    reject(sold, { type: SELL_PLAYER, playerId: "bat1", teamId: "t1", price: 20 }, ERROR.NO_ACTIVE_LOT);
  });

  it("refuses a second sale even if the lot state is inconsistent", () => {
    const sold = buy(live(), "t1", "bat1");
    // Simulate corrupted/raced data: a lot pointing at an already-sold player.
    const corrupted = {
      ...sold,
      players: { ...sold.players, bat1: { ...sold.players.bat1, status: PLAYER_STATUS.ON_BLOCK } },
      lot: { id: "lot-x", playerId: "bat1", openedAt: 1 },
    };
    reject(corrupted, { type: SELL_PLAYER, playerId: "bat1", teamId: "t2", price: 20 }, ERROR.ALREADY_SOLD);
  });

  it("a sold player cannot be withdrawn or edited", () => {
    const state = buy(live(), "t1", "bat1");
    reject(state, { type: WITHDRAW_PLAYER, playerId: "bat1" }, ERROR.ALREADY_SOLD);
    reject(state, { type: COMMANDS.UPDATE_PLAYER, playerId: "bat1", changes: { basePrice: 5 } }, ERROR.PLAYER_LOCKED);
  });
});

describe("UNSOLD", () => {
  it("marks the player on the block unsold and closes the lot", () => {
    const state = apply(open(live(), "bat1"), { type: MARK_UNSOLD });
    assert.equal(state.players.bat1.status, PLAYER_STATUS.UNSOLD);
    assert.equal(state.lot, null);
    reject(state, { type: MARK_UNSOLD }, ERROR.NO_ACTIVE_LOT);
  });

  it("unsold players can be relisted only when the config allows it", () => {
    const relisted = open(apply(open(live(), "bat1"), { type: MARK_UNSOLD }), "bat1");
    assert.equal(relisted.players.bat1.status, PLAYER_STATUS.ON_BLOCK);

    const strict = apply(open(live({ config: testConfig({ allowUnsoldRelist: false }) }), "bat1"), { type: MARK_UNSOLD });
    reject(strict, { type: OPEN_LOT, playerId: "bat1" }, ERROR.PLAYER_NOT_AVAILABLE);
  });
});

describe("cancelling an earlier sale", () => {
  it("refunds the team and returns the player to the pool", () => {
    let state = buy(live(), "t1", "bat2", 80);
    state = buy(state, "t2", "bowl1", 30);
    state = apply(state, { type: CANCEL_SALE, playerId: "bat2" });
    assert.equal(state.players.bat2.status, PLAYER_STATUS.AVAILABLE);
    assert.equal(state.players.bat2.soldTo, null);
    assert.equal(state.players.bat2.soldPrice, null);
    assert.equal(getTeamStats(state, "t1").purse, 1000);
    assert.equal(getTeamStats(state, "t1").count, 0);
    assert.equal(getTeamStats(state, "t2").spent, 30, "other sales are untouched");
    assert.deepEqual(state.purchases.map((p) => p.playerId), ["bowl1"]);
  });

  it("the player can then be sold again, to the right team", () => {
    let state = apply(buy(live(), "t1", "bat2", 80), { type: CANCEL_SALE, playerId: "bat2" });
    state = buy(state, "t3", "bat2", 90);
    assert.equal(state.players.bat2.soldTo, "t3");
    assert.equal(state.purchases.length, 1);
    assert.equal(state.purchases[0].seq, 2, "purchase sequence numbers are never reused");
  });

  it("clears the undo stack, since earlier entries no longer line up", () => {
    const state = apply(buy(live(), "t1", "bat2"), { type: CANCEL_SALE, playerId: "bat2" });
    assert.equal(state.undoStack.length, 0);
    reject(state, { type: UNDO }, ERROR.NOTHING_TO_UNDO);
  });

  it("rejects players who were never sold", () => {
    reject(live(), { type: CANCEL_SALE, playerId: "bat1" }, ERROR.NOT_SOLD);
    reject(live(), { type: CANCEL_SALE, playerId: "ghost" }, ERROR.NOT_FOUND);
  });
});

describe("withdrawal", () => {
  it("withdrawn players cannot be put up until reinstated", () => {
    let state = apply(live(), { type: WITHDRAW_PLAYER, playerId: "bat1" });
    assert.equal(state.players.bat1.status, PLAYER_STATUS.WITHDRAWN);
    reject(state, { type: OPEN_LOT, playerId: "bat1" }, ERROR.PLAYER_NOT_AVAILABLE);
    reject(state, { type: WITHDRAW_PLAYER, playerId: "bat1" }, ERROR.PLAYER_NOT_AVAILABLE);
    state = apply(state, { type: REINSTATE_PLAYER, playerId: "bat1" });
    assert.equal(state.players.bat1.status, PLAYER_STATUS.AVAILABLE);
    reject(state, { type: REINSTATE_PLAYER, playerId: "bat1" }, ERROR.PLAYER_NOT_AVAILABLE);
  });

  it("withdrawing the player on the block closes the lot", () => {
    const withdrawn = apply(open(live(), "bat1"), { type: WITHDRAW_PLAYER, playerId: "bat1" });
    assert.equal(withdrawn.lot, null);
    assert.equal(withdrawn.players.bat1.status, PLAYER_STATUS.WITHDRAWN);
  });
});

describe("undo", () => {
  it("undoing a sale refunds the purse and puts the player back on the block", () => {
    const onBlock = open(live(), "bat2");
    const undone = apply(sell(onBlock, "t2", 55), { type: UNDO });
    assert.deepEqual(undone.lot, onBlock.lot);
    assert.deepEqual(undone.players.bat2, onBlock.players.bat2);
    assert.deepEqual(undone.purchases, []);
    assert.equal(getTeamStats(undone, "t2").purse, 1000);
    // The corrected sale can now happen, exactly once.
    const resold = sell(undone, "t1", 60);
    assert.equal(resold.purchases.length, 1);
    assert.equal(resold.players.bat2.soldTo, "t1");
    reject(resold, { type: OPEN_LOT, playerId: "bat2" }, ERROR.ALREADY_SOLD);
  });

  it("steps back through several actions in reverse order", () => {
    const start = live();
    let state = buy(start, "t1", "bat1");
    state = apply(state, { type: UNDO });
    state = apply(state, { type: UNDO });
    assert.equal(state.lot, null);
    assert.deepEqual(state.players, start.players);
    assert.deepEqual(state.purchases, []);
    reject(state, { type: UNDO }, ERROR.NOTHING_TO_UNDO);
  });

  it("undoes UNSOLD and withdrawal", () => {
    const onBlock = open(live(), "bat1");
    assert.deepEqual(apply(apply(onBlock, { type: MARK_UNSOLD }), { type: UNDO }).lot, onBlock.lot);
    const withdrawn = apply(live(), { type: WITHDRAW_PLAYER, playerId: "bat2" });
    assert.equal(apply(withdrawn, { type: UNDO }).players.bat2.status, PLAYER_STATUS.AVAILABLE);
  });

  it("is itself logged as activity and bumps the version", () => {
    const state = open(live(), "bat1");
    const undone = apply(state, { type: UNDO });
    assert.equal(undone.version, state.version + 1);
    const last = undone.activity[undone.activity.length - 1];
    assert.equal(last.type, UNDO);
    assert.equal(last.undoneSeq, state.activity[state.activity.length - 1].seq);
  });

  it("never reuses purchase sequence numbers after an undo", () => {
    let state = sell(open(live(), "bat1"), "t1");
    state = apply(state, { type: UNDO });
    state = sell(state, "t2");
    assert.equal(state.purchases[0].seq, 2);
  });

  it("does not undo a later pause or revert profile edits", () => {
    let state = apply(live(), { type: WITHDRAW_PLAYER, playerId: "bat2" });
    state = apply(state, { type: COMMANDS.UPDATE_PLAYER, playerId: "bat2", changes: { name: "Renamed" } });
    state = apply(state, { type: COMMANDS.PAUSE_AUCTION });
    state = apply(state, { type: UNDO });
    assert.equal(state.status, AUCTION_STATUS.PAUSED);
    assert.equal(state.players.bat2.status, PLAYER_STATUS.AVAILABLE);
    assert.equal(state.players.bat2.name, "Renamed");
  });

  it("respects the configured undo depth", () => {
    let state = live({ config: testConfig({ undoDepth: 2 }) });
    state = buy(buy(state, "t1", "bat1"), "t2", "bowl1");
    assert.equal(state.undoStack.length, 2);
    state = apply(apply(state, { type: UNDO }), { type: UNDO });
    reject(state, { type: UNDO }, ERROR.NOTHING_TO_UNDO);
    assert.equal(state.players.bat1.soldTo, "t1", "the first sale is beyond the undo depth");
  });
});

describe("players and teams during setup", () => {
  it("adds and edits players; rejects duplicates and bad data", () => {
    let state = setup();
    const newPlayer = { id: "new1", name: "Fictional New", role: "BOWLER", basePrice: 40, isOverseas: false };
    state = apply(state, { type: COMMANDS.ADD_PLAYER, player: newPlayer });
    assert.equal(state.players.new1.status, PLAYER_STATUS.AVAILABLE);
    assert.equal(state.playerOrder.at(-1), "new1", "new players join the end of the sequence");
    reject(state, { type: COMMANDS.ADD_PLAYER, player: newPlayer }, ERROR.DUPLICATE_ID);
    reject(state, { type: COMMANDS.ADD_PLAYER, player: { ...newPlayer, id: "new2", role: "CAPTAIN" } }, ERROR.INVALID_INPUT);
    state = apply(state, { type: COMMANDS.UPDATE_PLAYER, playerId: "new1", changes: { basePrice: 60, status: "SOLD" } });
    assert.equal(state.players.new1.basePrice, 60);
    assert.equal(state.players.new1.status, PLAYER_STATUS.AVAILABLE, "status cannot be edited directly");
  });

  it("players on the block cannot be edited", () => {
    reject(open(live(), "bat1"), { type: COMMANDS.UPDATE_PLAYER, playerId: "bat1", changes: { basePrice: 5 } }, ERROR.PLAYER_LOCKED);
  });

  it("adds teams during setup", () => {
    const state = apply(setup(), { type: COMMANDS.ADD_TEAM, team: { id: "t4", name: "Fourth" } });
    assert.equal(state.teams.t4.shortName, "FOU");
    reject(state, { type: COMMANDS.ADD_TEAM, team: { id: "t4", name: "Again" } }, ERROR.DUPLICATE_ID);
  });
});

describe("removing players and managing teams (setup only)", () => {
  const { REMOVE_PLAYER, UPDATE_TEAM, REMOVE_TEAM, START_AUCTION } = COMMANDS;

  it("removes a player from the pool and the sequence", () => {
    const state = apply(setup(), { type: REMOVE_PLAYER, playerId: "bat2" });
    assert.equal(state.players.bat2, undefined);
    assert.ok(!state.playerOrder.includes("bat2"));
    assert.equal(state.playerOrder.length, PLAYERS.length - 1);
    assert.equal(state.activity.at(-1).type, REMOVE_PLAYER);
  });

  it("clears undo entries that could resurrect a removed player", () => {
    let state = apply(setup(), { type: WITHDRAW_PLAYER, playerId: "bat2" });
    assert.equal(state.undoStack.length, 1);
    state = apply(state, { type: REMOVE_PLAYER, playerId: "bat2" });
    assert.equal(state.undoStack.length, 0);
    reject(state, { type: UNDO }, ERROR.NOTHING_TO_UNDO);
  });

  it("rejects removing unknown players or removing after the start", () => {
    reject(setup(), { type: REMOVE_PLAYER, playerId: "nobody" }, ERROR.NOT_FOUND);
    reject(live(), { type: REMOVE_PLAYER, playerId: "bat1" }, ERROR.AUCTION_NOT_IN_SETUP);
  });

  it("edits a team's name, short name and logo; the id cannot change", () => {
    const state = apply(setup(), {
      type: UPDATE_TEAM,
      teamId: "t1",
      changes: { id: "hijack", name: "  Renamed  ", shortName: "REN", logo: "https://example.com/logo.png" },
    });
    assert.deepEqual(state.teams.t1, { id: "t1", name: "Renamed", shortName: "REN", logo: "https://example.com/logo.png" });
    assert.equal(state.teams.hijack, undefined);
  });

  it("rejects invalid team edits", () => {
    reject(setup(), { type: UPDATE_TEAM, teamId: "nope", changes: { name: "X" } }, ERROR.NOT_FOUND);
    reject(setup(), { type: UPDATE_TEAM, teamId: "t1", changes: { name: " " } }, ERROR.INVALID_INPUT);
    reject(setup(), { type: UPDATE_TEAM, teamId: "t1", changes: { shortName: "WAY-TOO-LONG-SHORTNAME" } }, ERROR.INVALID_INPUT);
    reject(live(), { type: UPDATE_TEAM, teamId: "t1", changes: { name: "Late" } }, ERROR.AUCTION_NOT_IN_SETUP);
  });

  it("removes a team; the auction then needs 2 teams to start", () => {
    let state = apply(setup(), { type: REMOVE_TEAM, teamId: "t3" });
    assert.equal(state.teams.t3, undefined);
    assert.deepEqual(state.teamOrder, ["t1", "t2"]);
    state = apply(state, { type: REMOVE_TEAM, teamId: "t2" });
    reject(state, { type: START_AUCTION }, ERROR.NOT_ENOUGH_PARTICIPANTS);
  });

  it("rejects removing unknown teams or removing after the start", () => {
    reject(setup(), { type: REMOVE_TEAM, teamId: "nope" }, ERROR.NOT_FOUND);
    reject(live(), { type: REMOVE_TEAM, teamId: "t1" }, ERROR.AUCTION_NOT_IN_SETUP);
  });

  it("teams cannot manage players or teams", () => {
    for (const command of [
      { type: REMOVE_PLAYER, playerId: "bat1" },
      { type: UPDATE_TEAM, teamId: "t1", changes: { name: "Mine" } },
      { type: REMOVE_TEAM, teamId: "t2" },
    ]) {
      const result = reduce(setup(), { ...command, actor: teamActor("t1") });
      assert.equal(result.error.code, ERROR.UNAUTHORIZED);
    }
  });
});

describe("player field validation", () => {
  const base = { id: "v1", name: "Valid Fictional", role: "BATTER", basePrice: 20, isOverseas: false };
  const add = (player) => ({ type: COMMANDS.ADD_PLAYER, player: { ...base, ...player } });

  it("accepts full profiles and trims text; blank optional text becomes null", () => {
    const state = apply(setup(), add({
      nationality: " India ", age: 24, battingStyle: "", image: null,
      stats: { batting: { runs: 100 } }, recentPerformance: ["12 (9)"], dataSource: "MANUAL_ENTRY",
    }));
    const player = state.players.v1;
    assert.equal(player.nationality, "India");
    assert.equal(player.battingStyle, null);
    assert.deepEqual(player.stats, { batting: { runs: 100 } });
  });

  it("rejects values the database could not store", () => {
    const cases = [
      { name: "x".repeat(129) },
      { nationality: "x".repeat(65) },
      { bowlingStyle: 12 },
      { image: "x".repeat(2001) },
      { dataSource: "x".repeat(33) },
      { stats: ["not", "an", "object"] },
      { recentPerformance: "12 (9)" },
      { recentPerformance: [12] },
    ];
    for (const fields of cases) reject(setup(), add(fields), ERROR.INVALID_INPUT);
  });

  it("applies the same checks to edits", () => {
    reject(setup(), { type: COMMANDS.UPDATE_PLAYER, playerId: "bat1", changes: { basePrice: -1 } }, ERROR.INVALID_INPUT);
  });
});

describe("auction summary", () => {
  it("reports each team's squad, spend, minimums and pool totals", () => {
    let state = live({ config: testConfig({ squad: { min: 2, max: 4 }, roleLimits: {
      BATTER: { min: 1, max: 2 }, BOWLER: { min: 1, max: 2 }, ALL_ROUNDER: { min: 0, max: 2 }, WICKETKEEPER: { min: 0, max: 1 },
    } }) });
    state = buy(buy(state, "t1", "bat1", 40), "t1", "bowl1");
    state = buy(state, "t2", "bat2", 60);
    state = apply(apply(state, { type: OPEN_LOT, playerId: "wk1" }), { type: MARK_UNSOLD });

    const summary = getAuctionSummary(state);
    const [t1, t2, t3] = summary.teams;
    assert.equal(summary.totalSpent, 40 + 20 + 60);
    assert.deepEqual([t1.stats.spent, t1.squad.length, t1.meetsSquadMinimum, t1.rolesShort], [60, 2, true, []]);
    assert.deepEqual([t2.meetsSquadMinimum, t2.rolesShort], [false, ["BOWLER"]]);
    assert.deepEqual(t3.rolesShort, ["BATTER", "BOWLER"]);
    assert.equal(summary.players.byStatus.SOLD, 3);
    assert.equal(summary.players.byStatus.UNSOLD, 1);
    assert.equal(summary.players.total, PLAYERS.length);
  });
});

describe("full simulated auction", () => {
  it("runs start → next player → sold/unsold → end with consistent totals", () => {
    let state = live();
    state = sell(apply(state, { type: OPEN_LOT }), "t2", 220); // bat1
    state = apply(apply(state, { type: OPEN_LOT }), { type: MARK_UNSOLD }); // bat2
    state = sell(apply(state, { type: OPEN_LOT }), "t3", 100); // bat3
    state = sell(apply(state, { type: OPEN_LOT }), "t1"); // bowl1 at base 20
    state = apply(state, { type: COMMANDS.END_AUCTION });

    const totalSpent = TEAMS.reduce((sum, team) => sum + getTeamStats(state, team.id).spent, 0);
    assert.equal(totalSpent, state.purchases.reduce((sum, purchase) => sum + purchase.price, 0));
    assert.equal(totalSpent, 220 + 100 + 20);
    assert.equal(new Set(state.purchases.map((purchase) => purchase.playerId)).size, state.purchases.length);
    for (const purchase of state.purchases) {
      assert.equal(state.players[purchase.playerId].soldTo, purchase.teamId);
    }
    assert.equal(state.status, AUCTION_STATUS.COMPLETED);
  });
});

describe("activity attribution", () => {
  it("SOLD entries carry the player, team and price for team dashboards", () => {
    const state = buy(live(), "t2", "bat2", 70);
    const entry = state.activity.at(-1);
    assert.equal(entry.type, SELL_PLAYER);
    assert.deepEqual([entry.playerId, entry.teamId, entry.amount], ["bat2", "t2", 70]);
    assert.deepEqual(entry.actor, ADMIN);
  });
});
