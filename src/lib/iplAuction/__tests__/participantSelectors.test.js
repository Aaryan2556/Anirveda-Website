import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  COMMANDS,
  PLAYER_STATUS,
  getLotHistory,
  getMarket,
  getRoleNeeds,
  getTeamPurchaseHistory,
} from "../engine/index.js";
import { apply, buy, live, open, sell, testConfig } from "./fixtures.js";

const { MARK_UNSOLD, WITHDRAW_PLAYER, CANCEL_SALE, UNDO } = COMMANDS;

describe("getMarket", () => {
  it("lists every player in sequence with position and buyer", () => {
    const state = buy(live(), "t2", "bat2", 60);
    const market = getMarket(state);
    assert.equal(market.length, state.playerOrder.length);
    assert.deepEqual(market.slice(0, 2).map(({ player, position }) => [player.id, position]), [["bat1", 1], ["bat2", 2]]);
    assert.equal(market[1].team.id, "t2");
    assert.equal(market[0].team, null);
  });

  it("filters by status, role, overseas and name", () => {
    const state = buy(live(), "t2", "bat2", 60);
    const ids = (filters) => getMarket(state, filters).map(({ player }) => player.id);
    assert.deepEqual(ids({ status: PLAYER_STATUS.SOLD }), ["bat2"]);
    assert.deepEqual(ids({ role: "WICKETKEEPER" }), ["wk1", "wk2"]);
    assert.deepEqual(ids({ overseas: true }), ["bowl2", "os1", "os2"]);
    assert.deepEqual(ids({ role: "BOWLER", overseas: false }), ["bowl1"]);
    assert.deepEqual(ids({ query: "  WK " }), ["wk1", "wk2"]);
    assert.deepEqual(ids({ status: PLAYER_STATUS.SOLD, role: "BOWLER" }), []);
  });
});

describe("getTeamPurchaseHistory", () => {
  it("returns only that team's buys, oldest first, with players", () => {
    let state = buy(live(), "t1", "bat1", 30);
    state = buy(state, "t2", "bat2", 60);
    state = buy(state, "t1", "wk1", 25);
    const history = getTeamPurchaseHistory(state, "t1");
    assert.deepEqual(history.map((p) => [p.player.id, p.price]), [["bat1", 30], ["wk1", 25]]);
    assert.deepEqual(getTeamPurchaseHistory(state, "t3"), []);
  });
});

describe("getRoleNeeds", () => {
  it("reports open slots, squad shortfall, overseas left and per-role needs", () => {
    const config = testConfig({
      squad: { min: 3, max: 4 },
      maxOverseas: 1,
      roleLimits: {
        BATTER: { min: 1, max: 2 },
        BOWLER: { min: 1, max: 2 },
        ALL_ROUNDER: { min: 0, max: null },
        WICKETKEEPER: { min: 1, max: 1 },
      },
    });
    let state = live({ config });
    state = buy(state, "t1", "wk1");
    state = buy(state, "t1", "os1");
    const needs = getRoleNeeds(state, "t1");
    assert.equal(needs.slotsLeft, 2);
    assert.equal(needs.squadShort, 1);
    assert.equal(needs.overseasLeft, 0);
    assert.deepEqual(needs.roles.WICKETKEEPER, { have: 1, min: 1, max: 1, need: 0, full: true });
    assert.deepEqual(needs.roles.BOWLER, { have: 0, min: 1, max: 2, need: 1, full: false });
    assert.deepEqual(needs.roles.ALL_ROUNDER, { have: 0, min: 0, max: null, need: 0, full: false });
    assert.equal(getRoleNeeds(state, "t2").squadShort, 3);
  });

  it("reports no overseas limit as null", () => {
    assert.equal(getRoleNeeds(live({ config: testConfig({ maxOverseas: null }) }), "t1").overseasLeft, null);
  });
});

describe("getLotHistory", () => {
  it("records each lot's outcome in order, including the open lot", () => {
    let state = buy(live(), "t1", "bat1", 40);
    state = apply(open(state, "bat2"), { type: MARK_UNSOLD });
    state = apply(open(state, "bat3"), { type: WITHDRAW_PLAYER, playerId: "bat3" });
    state = open(state, "wk1");
    const lots = getLotHistory(state);
    assert.deepEqual(
      lots.map((lot) => [lot.playerId, lot.result, lot.team?.id ?? null, lot.price]),
      [["bat1", "SOLD", "t1", 40], ["bat2", "UNSOLD", null, null], ["bat3", "WITHDRAWN", null, null], ["wk1", "OPEN", null, null]]
    );
    assert.equal(lots[0].player.name, "Test bat1");
  });

  it("ignores undone actions: an undone sale re-opens its lot, an undone open never happened", () => {
    let state = open(live(), "bat1");
    state = sell(state, "t1", 50);
    state = apply(state, { type: UNDO }); // sale undone, bat1 back on the block
    state = sell(state, "t2", 70);
    state = open(state, "bat2");
    state = apply(state, { type: UNDO }); // bat2 never went up
    assert.deepEqual(
      getLotHistory(state).map((lot) => [lot.playerId, lot.result, lot.teamId, lot.price]),
      [["bat1", "SOLD", "t2", 70]]
    );
  });

  it("keeps a cancelled sale, marked cancelled, and records the player's later lot", () => {
    let state = buy(live(), "t1", "bat1", 40);
    state = apply(state, { type: CANCEL_SALE, playerId: "bat1" });
    state = buy(state, "t3", "bat1", 55);
    const lots = getLotHistory(state);
    assert.deepEqual(
      lots.map((lot) => [lot.teamId, lot.price, lot.cancelled]),
      [["t1", 40, true], ["t3", 55, false]]
    );
  });

  it("is empty before any player goes up", () => {
    assert.deepEqual(getLotHistory(live()), []);
  });
});
