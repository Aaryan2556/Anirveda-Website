import assert from "node:assert/strict";
import { DEV_DEFAULT_CONFIG } from "../config.js";
import { ACTOR_ROLES, COMMANDS, createInitialState, reduce } from "../engine/index.js";

export const ADMIN = { role: ACTOR_ROLES.ADMIN };
export const teamActor = (teamId) => ({ role: ACTOR_ROLES.TEAM, teamId });

/** Small, explicit test rules (independent of the dev defaults), overridable per test. */
export function testConfig(overrides = {}) {
  return {
    ...structuredClone(DEV_DEFAULT_CONFIG),
    initialPurse: 1000,
    squad: { min: 0, max: 4 },
    maxOverseas: 1,
    roleLimits: {
      BATTER: { min: 0, max: 2 },
      BOWLER: { min: 0, max: 2 },
      ALL_ROUNDER: { min: 0, max: 2 },
      WICKETKEEPER: { min: 0, max: 1 },
    },
    minimumReserve: { enabled: false, perSlot: 20 },
    allowUnsoldRelist: true,
    undoDepth: 20,
    ...overrides,
  };
}

export const TEAMS = [
  { id: "t1", name: "Test Team One" },
  { id: "t2", name: "Test Team Two" },
  { id: "t3", name: "Test Team Three" },
];

const p = (id, role, basePrice, isOverseas = false) => ({
  id, name: `Test ${id}`, role, basePrice, isOverseas, dataSource: "FICTIONAL",
});

export const PLAYERS = [
  p("bat1", "BATTER", 20),
  p("bat2", "BATTER", 50),
  p("bat3", "BATTER", 100),
  p("bowl1", "BOWLER", 20),
  p("bowl2", "BOWLER", 75, true),
  p("ar1", "ALL_ROUNDER", 200),
  p("wk1", "WICKETKEEPER", 20),
  p("wk2", "WICKETKEEPER", 30),
  p("os1", "BATTER", 20, true),
  p("os2", "BOWLER", 20, true),
];

export function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze(value[key]);
  }
  return value;
}

export function setup({ config = testConfig(), teams = TEAMS, players = PLAYERS } = {}) {
  return deepFreeze(createInitialState({ auctionId: "test-auction", config, teams, players, at: 1 }));
}

/**
 * Applies a command that must succeed. The input state is deep-frozen, so any
 * mutation inside the engine throws — this proves reduce() is pure.
 */
export function apply(state, command) {
  const result = reduce(deepFreeze(state), { actor: ADMIN, at: 1000, ...command });
  assert.equal(result.ok, true, `expected ${command.type} to succeed, got ${result.error?.code}: ${result.error?.message}`);
  return deepFreeze(result.state);
}

/** Applies a command that must be rejected with `code`, and checks state is untouched. */
export function reject(state, command, code) {
  const frozen = deepFreeze(state);
  const result = reduce(frozen, { actor: ADMIN, at: 1000, ...command });
  assert.equal(result.ok, false, `expected ${command.type} to be rejected with ${code}`);
  assert.equal(result.error.code, code, result.error.message);
  assert.equal(result.state, frozen, "a rejected command must return the same state");
  return result.error;
}

export const live = (options) => apply(setup(options), { type: COMMANDS.START_AUCTION });
export const open = (state, playerId) => apply(state, { type: COMMANDS.OPEN_LOT, playerId });

/** Records the offline result: the player on the block goes to `teamId` for `price` (default: base price). */
export function sell(state, teamId, price) {
  const playerId = state.lot.playerId;
  return apply(state, { type: COMMANDS.SELL_PLAYER, playerId, teamId, price: price ?? state.players[playerId].basePrice });
}

/** Puts `playerId` up and sells them to `teamId` (at the base price unless `price` is given). */
export const buy = (state, teamId, playerId, price) => sell(open(state, playerId), teamId, price);
