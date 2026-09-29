/**
 * IPL Auction engine.
 *
 *   reduce(state, command) -> { ok: true, state, events } | { ok: false, state, error }
 *
 * Pure: never mutates its input, never reads the clock, never touches storage,
 * the network or React. Timestamps arrive on the command (`command.at`) from
 * whichever adapter runs the engine — the browser today, a server function later.
 * State is plain JSON so any adapter can persist or transmit it.
 *
 * Auction format: players come up one at a time in sequence (`playerOrder`),
 * bidding happens offline in the room, and the admin records each result —
 * SOLD to a team at the hammer price, or UNSOLD. Teams have view-only access.
 */
import { DEV_DEFAULT_CONFIG, ROLE_LIST, validateConfig } from "../config.js";
import { formatLakhs } from "../money.js";
import { ACTOR_ROLES, AUCTION_STATUS, COMMANDS, PLAYER_STATUS, TEXT_LIMITS } from "./constants.js";
import { ERROR, fail } from "./errors.js";
import { validateSale } from "./rules.js";
import { getNextPlayerInSequence } from "./selectors.js";

export * from "./constants.js";
export * from "./errors.js";
export * from "./rules.js";
export * from "./selectors.js";

export const SCHEMA_VERSION = 2;

/** Commands whose effects UNDO can reverse (last-in, first-out). */
const UNDOABLE = new Set([
  COMMANDS.OPEN_LOT,
  COMMANDS.SELL_PLAYER,
  COMMANDS.MARK_UNSOLD,
  COMMANDS.WITHDRAW_PLAYER,
  COMMANDS.REINSTATE_PLAYER,
]);

/** Player fields the auction changes. Undo restores only these, so profile edits survive. */
const PLAYER_AUCTION_FIELDS = ["status", "soldTo", "soldPrice"];

const EDITABLE_PLAYER_STATUSES = [PLAYER_STATUS.AVAILABLE, PLAYER_STATUS.UNSOLD, PLAYER_STATUS.WITHDRAWN];

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

/** Trimmed text, null when empty; `undefined` when the value is not text or is too long. */
function optionalText(value, maxLength) {
  if (value == null) return null;
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (text.length > maxLength) return undefined;
  return text || null;
}

const jsonLength = (value) => JSON.stringify(value).length;

function normalizePlayer(input) {
  const invalid = (message) => ({ error: fail(ERROR.INVALID_INPUT, message) });
  if (!input || typeof input !== "object") return invalid("Player data is required.");
  const id = typeof input.id === "string" ? input.id.trim() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!id) return invalid("Player id is required.");
  if (!name) return invalid("Player name is required.");
  if (name.length > TEXT_LIMITS.name) return invalid(`Player name is longer than ${TEXT_LIMITS.name} characters.`);
  if (!ROLE_LIST.includes(input.role)) return invalid(`Unknown role "${input.role}".`);
  if (!Number.isSafeInteger(input.basePrice) || input.basePrice <= 0) {
    return invalid("Base price must be a positive whole number of lakhs.");
  }
  if (typeof input.isOverseas !== "boolean") return invalid("isOverseas must be true or false.");

  const textLimits = {
    nationality: TEXT_LIMITS.nationality,
    battingStyle: TEXT_LIMITS.style,
    bowlingStyle: TEXT_LIMITS.style,
    image: TEXT_LIMITS.url,
    dataSource: TEXT_LIMITS.dataSource,
  };
  const text = {};
  for (const [field, maxLength] of Object.entries(textLimits)) {
    text[field] = optionalText(input[field], maxLength);
    if (text[field] === undefined) return invalid(`${field} must be text of at most ${maxLength} characters.`);
  }
  text.dataSource ??= "UNSPECIFIED";
  const age = input.age ?? null;
  if (age !== null && (!Number.isSafeInteger(age) || age < 0 || age > 100)) {
    return invalid("Age must be a whole number between 0 and 100.");
  }
  const stats = input.stats ?? null;
  if (stats !== null && (typeof stats !== "object" || Array.isArray(stats) || jsonLength(stats) > TEXT_LIMITS.stats)) {
    return invalid("Statistics must be an object (and not too large).");
  }
  const recentPerformance = input.recentPerformance ?? [];
  if (
    !Array.isArray(recentPerformance)
    || !recentPerformance.every((entry) => typeof entry === "string")
    || jsonLength(recentPerformance) > TEXT_LIMITS.recentPerformance
  ) {
    return invalid("Recent performance must be a list of short text entries.");
  }

  return {
    player: {
      id,
      name,
      role: input.role,
      isOverseas: input.isOverseas,
      basePrice: input.basePrice,
      nationality: text.nationality,
      age,
      battingStyle: text.battingStyle,
      bowlingStyle: text.bowlingStyle,
      image: text.image,
      stats,
      recentPerformance,
      dataSource: text.dataSource,
      status: PLAYER_STATUS.AVAILABLE,
      soldTo: null,
      soldPrice: null,
    },
  };
}

function normalizeTeam(input) {
  const invalid = (message) => ({ error: fail(ERROR.INVALID_INPUT, message) });
  if (!input || typeof input !== "object") return invalid("Team data is required.");
  const id = typeof input.id === "string" ? input.id.trim() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!id) return invalid("Team id is required.");
  if (!name) return invalid("Team name is required.");
  if (name.length > TEXT_LIMITS.name) return invalid(`Team name is longer than ${TEXT_LIMITS.name} characters.`);
  const shortName = typeof input.shortName === "string" && input.shortName.trim()
    ? input.shortName.trim()
    : name.slice(0, 3).toUpperCase();
  if (shortName.length > TEXT_LIMITS.shortName) {
    return invalid(`Short name is longer than ${TEXT_LIMITS.shortName} characters.`);
  }
  const logo = optionalText(input.logo, TEXT_LIMITS.url);
  if (logo === undefined) return invalid(`Logo must be a URL of at most ${TEXT_LIMITS.url} characters.`);
  return { team: { id, name, shortName, logo } };
}

/**
 * Builds a fresh auction in SETUP. Throws on invalid seed data, since that is a
 * programming error rather than a user action.
 */
export function createInitialState({
  auctionId,
  name = "Auction",
  config = DEV_DEFAULT_CONFIG,
  teams = [],
  players = [],
  at = 0,
} = {}) {
  if (!auctionId) throw new Error("createInitialState: auctionId is required.");
  const configErrors = validateConfig(config);
  if (configErrors.length) throw new Error(`createInitialState: invalid config. ${configErrors.join(" ")}`);

  const state = {
    schemaVersion: SCHEMA_VERSION,
    auctionId,
    name,
    createdAt: at,
    version: 0,
    status: AUCTION_STATUS.SETUP,
    config: structuredClone(config),
    teams: {},
    teamOrder: [],
    players: {},
    playerOrder: [],
    lot: null,
    purchases: [],
    activity: [],
    undoStack: [],
    counters: { activity: 0, purchase: 0, lot: 0 },
  };

  for (const input of teams) {
    const { team, error } = normalizeTeam(input);
    if (error) throw new Error(`createInitialState: ${error.message}`);
    if (state.teams[team.id]) throw new Error(`createInitialState: duplicate team id "${team.id}".`);
    state.teams[team.id] = team;
    state.teamOrder.push(team.id);
  }
  for (const input of players) {
    const { player, error } = normalizePlayer(input);
    if (error) throw new Error(`createInitialState: ${error.message}`);
    if (state.players[player.id]) throw new Error(`createInitialState: duplicate player id "${player.id}".`);
    state.players[player.id] = player;
    state.playerOrder.push(player.id);
  }
  return state;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const rejected = (code, message) => ({ error: fail(code, message) });
const accepted = (state, activity) => ({ state, activity });

function requireSetup(state) {
  if (state.status === AUCTION_STATUS.SETUP) return null;
  return rejected(ERROR.AUCTION_NOT_IN_SETUP, "Only allowed before the auction starts.");
}

function requireLive(state) {
  switch (state.status) {
    case AUCTION_STATUS.LIVE:
      return null;
    case AUCTION_STATUS.PAUSED:
      return rejected(ERROR.AUCTION_PAUSED, "The auction is paused.");
    case AUCTION_STATUS.COMPLETED:
      return rejected(ERROR.AUCTION_COMPLETED, "The auction has ended.");
    default:
      return rejected(ERROR.AUCTION_NOT_LIVE, "The auction has not started.");
  }
}

function requireNotCompleted(state) {
  if (state.status !== AUCTION_STATUS.COMPLETED) return null;
  return rejected(ERROR.AUCTION_COMPLETED, "The auction has ended.");
}

function withPlayer(state, playerId, changes) {
  return { ...state, players: { ...state.players, [playerId]: { ...state.players[playerId], ...changes } } };
}

function isAlreadySold(state, playerId) {
  return state.players[playerId].status === PLAYER_STATUS.SOLD
    || state.purchases.some((purchase) => purchase.playerId === playerId);
}

function checkPermission(command) {
  const actor = command.actor;
  if (!actor || !Object.values(ACTOR_ROLES).includes(actor.role)) {
    return fail(ERROR.UNAUTHORIZED, "Missing or unknown actor.");
  }
  // Teams are view-only: bidding happens in the room and the admin records every result.
  if (actor.role === ACTOR_ROLES.ADMIN) return null;
  return fail(ERROR.UNAUTHORIZED, "Only the auction admin can do that.");
}

// ---------------------------------------------------------------------------
// Command handlers: (state, command) -> { state, activity } | { error }
// ---------------------------------------------------------------------------

const handlers = {
  [COMMANDS.UPDATE_CONFIG](state, { config }) {
    const notSetup = requireSetup(state);
    if (notSetup) return notSetup;
    const errors = validateConfig(config);
    if (errors.length) return rejected(ERROR.INVALID_CONFIG, errors.join(" "));
    return accepted({ ...state, config: structuredClone(config) }, { message: "Auction rules updated." });
  },

  [COMMANDS.ADD_TEAM](state, { team: input }) {
    const completed = requireNotCompleted(state);
    if (completed) return completed;
    const { team, error } = normalizeTeam(input);
    if (error) return { error };
    if (state.teams[team.id]) return rejected(ERROR.DUPLICATE_ID, `Team id "${team.id}" already exists.`);
    return accepted(
      { ...state, teams: { ...state.teams, [team.id]: team }, teamOrder: [...state.teamOrder, team.id] },
      { teamId: team.id, message: `Team ${team.name} added.` }
    );
  },

  [COMMANDS.UPDATE_TEAM](state, { teamId, changes }) {
    const completed = requireNotCompleted(state);
    if (completed) return completed;
    const current = state.teams[teamId];
    if (!current) return rejected(ERROR.NOT_FOUND, "Unknown team.");
    const { team, error } = normalizeTeam({ ...current, ...changes, id: current.id });
    if (error) return { error };
    return accepted(
      { ...state, teams: { ...state.teams, [teamId]: team } },
      { teamId, message: `Team ${team.name} updated.` }
    );
  },

  /** Can be removed anytime before auction ends, as long as it has no purchases. */
  [COMMANDS.REMOVE_TEAM](state, { teamId }) {
    const completed = requireNotCompleted(state);
    if (completed) return completed;
    const team = state.teams[teamId];
    if (!team) return rejected(ERROR.NOT_FOUND, "Unknown team.");
    if (state.purchases.some((p) => p.teamId === teamId)) {
      return rejected(ERROR.INVALID_INPUT, "Cannot remove a team that has already bought players.");
    }
    const { [teamId]: removed, ...teams } = state.teams; // eslint-disable-line no-unused-vars
    return accepted(
      { ...state, teams, teamOrder: state.teamOrder.filter((id) => id !== teamId) },
      { message: `Team ${team.name} removed.` }
    );
  },

  [COMMANDS.ADD_PLAYER](state, { player: input }) {
    const completed = requireNotCompleted(state);
    if (completed) return completed;
    const { player, error } = normalizePlayer(input);
    if (error) return { error };
    if (state.players[player.id]) return rejected(ERROR.DUPLICATE_ID, `Player id "${player.id}" already exists.`);
    return accepted(
      { ...state, players: { ...state.players, [player.id]: player }, playerOrder: [...state.playerOrder, player.id] },
      { playerId: player.id, message: `Player ${player.name} added to the pool.` }
    );
  },

  [COMMANDS.UPDATE_PLAYER](state, { playerId, changes }) {
    const completed = requireNotCompleted(state);
    if (completed) return completed;
    const current = state.players[playerId];
    if (!current) return rejected(ERROR.NOT_FOUND, "Unknown player.");
    if (!EDITABLE_PLAYER_STATUSES.includes(current.status)) {
      return rejected(ERROR.PLAYER_LOCKED, "Players on the block or already sold cannot be edited.");
    }
    const { player, error } = normalizePlayer({ ...current, ...changes, id: current.id });
    if (error) return { error };
    const updated = {
      ...player,
      status: current.status,
      soldTo: current.soldTo,
      soldPrice: current.soldPrice,
    };
    return accepted(
      { ...state, players: { ...state.players, [playerId]: updated } },
      { playerId, message: `Player ${updated.name} updated.` }
    );
  },

  /**
   * Deletes a player from the pool (SETUP only, so they cannot be on the block or
   * sold). Withdraw/reinstate are allowed in SETUP and are undoable, so the undo
   * stack may hold entries for this player; undoing one would bring back a
   * half-deleted player, so the stack is cleared.
   */
  [COMMANDS.REMOVE_PLAYER](state, { playerId }) {
    const notSetup = requireSetup(state);
    if (notSetup) return notSetup;
    const player = state.players[playerId];
    if (!player) return rejected(ERROR.NOT_FOUND, "Unknown player.");
    const { [playerId]: removed, ...players } = state.players; // eslint-disable-line no-unused-vars
    return accepted(
      { ...state, players, playerOrder: state.playerOrder.filter((id) => id !== playerId), undoStack: [] },
      { message: `Player ${player.name} removed from the pool.` }
    );
  },

  [COMMANDS.REORDER_PLAYERS](state, { playerOrder }) {
    const completed = requireNotCompleted(state);
    if (completed) return completed;
    const isPermutation = Array.isArray(playerOrder)
      && playerOrder.length === state.playerOrder.length
      && new Set(playerOrder).size === playerOrder.length
      && playerOrder.every((id) => state.players[id]);
    if (!isPermutation) {
      return rejected(ERROR.INVALID_INPUT, "The new order must list every player exactly once.");
    }
    return accepted({ ...state, playerOrder: [...playerOrder] }, { message: "Player sequence updated." });
  },

  [COMMANDS.START_AUCTION](state) {
    const notSetup = requireSetup(state);
    if (notSetup) return notSetup;
    if (state.teamOrder.length < 2) return rejected(ERROR.NOT_ENOUGH_PARTICIPANTS, "At least 2 teams are required.");
    if (state.playerOrder.length < 1) return rejected(ERROR.NOT_ENOUGH_PARTICIPANTS, "At least 1 player is required.");
    return accepted({ ...state, status: AUCTION_STATUS.LIVE }, { message: "Auction started." });
  },

  [COMMANDS.PAUSE_AUCTION](state) {
    const notLive = requireLive(state);
    if (notLive) return notLive;
    return accepted({ ...state, status: AUCTION_STATUS.PAUSED }, { message: "Auction paused." });
  },

  [COMMANDS.RESUME_AUCTION](state) {
    if (state.status !== AUCTION_STATUS.PAUSED) return rejected(ERROR.AUCTION_NOT_LIVE, "The auction is not paused.");
    return accepted({ ...state, status: AUCTION_STATUS.LIVE }, { message: "Auction resumed." });
  },

  [COMMANDS.END_AUCTION](state) {
    if (state.status !== AUCTION_STATUS.LIVE && state.status !== AUCTION_STATUS.PAUSED) {
      return rejected(ERROR.AUCTION_NOT_LIVE, "Only a live or paused auction can be ended.");
    }
    if (state.lot) return rejected(ERROR.LOT_IN_PROGRESS, "Close the current lot before ending the auction.");
    return accepted({ ...state, status: AUCTION_STATUS.COMPLETED }, { message: "Auction ended." });
  },

  /** Puts `playerId` on the block, or the next player in the sequence when omitted. */
  [COMMANDS.OPEN_LOT](state, { playerId, at }) {
    const notLive = requireLive(state);
    if (notLive) return notLive;
    if (state.lot) return rejected(ERROR.LOT_IN_PROGRESS, "Another player is already up for bidding.");
    if (playerId === undefined) {
      const upNext = getNextPlayerInSequence(state);
      if (!upNext) return rejected(ERROR.NO_PLAYERS_LEFT, "Every player in the sequence has been up.");
      playerId = upNext.id;
    }
    const player = state.players[playerId];
    if (!player) return rejected(ERROR.NOT_FOUND, "Unknown player.");
    if (isAlreadySold(state, playerId)) return rejected(ERROR.ALREADY_SOLD, `${player.name} has already been sold.`);
    const canOpen = player.status === PLAYER_STATUS.AVAILABLE
      || (player.status === PLAYER_STATUS.UNSOLD && state.config.allowUnsoldRelist);
    if (!canOpen) {
      return rejected(ERROR.PLAYER_NOT_AVAILABLE, `${player.name} is ${player.status.toLowerCase()} and cannot be put up.`);
    }
    const lotSeq = state.counters.lot + 1;
    const next = withPlayer(
      {
        ...state,
        counters: { ...state.counters, lot: lotSeq },
        lot: { id: `lot-${lotSeq}`, playerId, openedAt: at ?? null },
      },
      playerId,
      { status: PLAYER_STATUS.ON_BLOCK }
    );
    return accepted(next, {
      playerId,
      amount: player.basePrice,
      message: `${player.name} is up for bidding at base price ${formatLakhs(player.basePrice)}.`,
    });
  },

  /**
   * Records the result of the offline bidding: the player on the block goes to
   * `teamId` for `price`. `playerId` must name the player on the block, so a
   * sale from an out-of-date admin screen can never land on the wrong player.
   */
  [COMMANDS.SELL_PLAYER](state, { playerId, teamId, price, at }) {
    const notLive = requireLive(state);
    if (notLive) return notLive;
    const lot = state.lot;
    if (!lot) return rejected(ERROR.NO_ACTIVE_LOT, "No player is up for bidding.");
    if (playerId !== lot.playerId) {
      return rejected(ERROR.STALE_STATE, "The player on the block has changed. Review before selling.");
    }
    const player = state.players[lot.playerId];
    if (isAlreadySold(state, player.id)) return rejected(ERROR.ALREADY_SOLD, `${player.name} has already been sold.`);
    if (player.status !== PLAYER_STATUS.ON_BLOCK) {
      return rejected(ERROR.PLAYER_NOT_AVAILABLE, `${player.name} is not on the block.`);
    }
    const invalid = validateSale(state, teamId, player, price);
    if (invalid) return { error: invalid };

    const seq = state.counters.purchase + 1;
    const purchase = { id: `purchase-${seq}`, seq, lotId: lot.id, playerId: player.id, teamId, price, at: at ?? null };
    const next = withPlayer(
      {
        ...state,
        counters: { ...state.counters, purchase: seq },
        purchases: [...state.purchases, purchase],
        lot: null,
      },
      player.id,
      { status: PLAYER_STATUS.SOLD, soldTo: teamId, soldPrice: price }
    );
    return accepted(next, {
      playerId: player.id,
      teamId,
      amount: price,
      message: `SOLD: ${player.name} to ${state.teams[teamId].name} for ${formatLakhs(price)}.`,
    });
  },

  [COMMANDS.MARK_UNSOLD](state) {
    const notLive = requireLive(state);
    if (notLive) return notLive;
    const lot = state.lot;
    if (!lot) return rejected(ERROR.NO_ACTIVE_LOT, "No player is up for bidding.");
    const player = state.players[lot.playerId];
    return accepted(
      withPlayer({ ...state, lot: null }, player.id, { status: PLAYER_STATUS.UNSOLD }),
      { playerId: player.id, message: `UNSOLD: ${player.name}.` }
    );
  },

  [COMMANDS.UPDATE_BID](state, { price, teamId }) {
    const notLive = requireLive(state);
    if (notLive) return notLive;
    if (!state.lot) return rejected(ERROR.NO_ACTIVE_LOT, "No player is up for bidding.");
    return accepted({ ...state, lot: { ...state.lot, currentBid: price, currentBidTeamId: teamId } }, { message: "" });
  },

  /**
   * Corrects an earlier sale: the purchase is removed (refunding the team) and the
   * player returns to the pool at their place in the sequence. Removing a purchase
   * from the middle of the history invalidates the undo stack, so it is cleared.
   */
  [COMMANDS.CANCEL_SALE](state, { playerId }) {
    const completed = requireNotCompleted(state);
    if (completed) return completed;
    const player = state.players[playerId];
    if (!player) return rejected(ERROR.NOT_FOUND, "Unknown player.");
    const purchase = state.purchases.find((p) => p.playerId === playerId);
    if (!purchase) return rejected(ERROR.NOT_SOLD, `${player.name} has not been sold.`);
    const next = withPlayer(
      { ...state, purchases: state.purchases.filter((p) => p !== purchase), undoStack: [] },
      playerId,
      { status: PLAYER_STATUS.AVAILABLE, soldTo: null, soldPrice: null }
    );
    return accepted(next, {
      playerId,
      teamId: purchase.teamId,
      amount: purchase.price,
      message: `SALE CANCELLED: ${player.name} returned to the pool; ${formatLakhs(purchase.price)} refunded to ${
        state.teams[purchase.teamId].name
      }. Undo history cleared.`,
    });
  },

  [COMMANDS.WITHDRAW_PLAYER](state, { playerId }) {
    const completed = requireNotCompleted(state);
    if (completed) return completed;
    const player = state.players[playerId];
    if (!player) return rejected(ERROR.NOT_FOUND, "Unknown player.");
    if (isAlreadySold(state, playerId)) return rejected(ERROR.ALREADY_SOLD, `${player.name} has already been sold.`);
    if (player.status === PLAYER_STATUS.WITHDRAWN) {
      return rejected(ERROR.PLAYER_NOT_AVAILABLE, `${player.name} is already withdrawn.`);
    }
    const next = player.status === PLAYER_STATUS.ON_BLOCK ? { ...state, lot: null } : state;
    return accepted(withPlayer(next, playerId, { status: PLAYER_STATUS.WITHDRAWN }), {
      playerId,
      message: `${player.name} withdrawn from the auction.`,
    });
  },

  [COMMANDS.REINSTATE_PLAYER](state, { playerId }) {
    const completed = requireNotCompleted(state);
    if (completed) return completed;
    const player = state.players[playerId];
    if (!player) return rejected(ERROR.NOT_FOUND, "Unknown player.");
    if (player.status !== PLAYER_STATUS.WITHDRAWN) {
      return rejected(ERROR.PLAYER_NOT_AVAILABLE, `${player.name} is not withdrawn.`);
    }
    return accepted(withPlayer(state, playerId, { status: PLAYER_STATUS.AVAILABLE }), {
      playerId,
      message: `${player.name} reinstated to the pool.`,
    });
  },

  [COMMANDS.UNDO](state) {
    const completed = requireNotCompleted(state);
    if (completed) return completed;
    const entry = state.undoStack[state.undoStack.length - 1];
    if (!entry) return rejected(ERROR.NOTHING_TO_UNDO, "There is nothing to undo.");
    const restored = applyUndoEntry(state, entry);
    return accepted(
      { ...restored, undoStack: state.undoStack.slice(0, -1) },
      { undoneSeq: entry.activitySeq, message: `UNDO: ${entry.description}` }
    );
  },
};

// ---------------------------------------------------------------------------
// Undo
// ---------------------------------------------------------------------------

/**
 * Records just enough of `prev` to reverse the change to `next`. Players are
 * compared by reference, which works because handlers only replace what they touch.
 * Auction status is deliberately not recorded: no undoable command changes it, and
 * restoring it would silently undo a later pause.
 */
function buildUndoEntry(prev, next, command, activitySeq, description) {
  const players = {};
  for (const id of Object.keys(next.players)) {
    const before = prev.players[id];
    if (before && before !== next.players[id]) {
      players[id] = Object.fromEntries(PLAYER_AUCTION_FIELDS.map((field) => [field, before[field]]));
    }
  }
  return {
    commandType: command.type,
    activitySeq,
    description,
    lot: prev.lot,
    purchasesLength: prev.purchases.length,
    players,
  };
}

function applyUndoEntry(state, entry) {
  let players = state.players;
  for (const [id, fields] of Object.entries(entry.players)) {
    players = { ...players, [id]: { ...players[id], ...fields } };
  }
  return {
    ...state,
    lot: entry.lot,
    players,
    purchases: state.purchases.slice(0, entry.purchasesLength),
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function reduce(state, command) {
  const reject = (error) => ({ ok: false, state, error });

  if (!command || !Object.prototype.hasOwnProperty.call(handlers, command.type)) {
    return reject(fail(ERROR.UNKNOWN_COMMAND, `Unknown command "${command?.type}".`));
  }
  const denied = checkPermission(command);
  if (denied) return reject(denied);

  const outcome = handlers[command.type](state, command);
  if (outcome.error) return reject(outcome.error);

  if (command.type === COMMANDS.UPDATE_BID) {
    let next = { ...outcome.state, version: state.version + 1 };
    return { ok: true, state: next, events: [] };
  }

  const activitySeq = state.counters.activity + 1;
  const { actor } = command;
  const event = {
    seq: activitySeq,
    type: command.type,
    at: command.at ?? null,
    actor: actor.role === ACTOR_ROLES.TEAM ? { role: actor.role, teamId: actor.teamId } : { role: actor.role },
    ...outcome.activity,
  };

  let next = outcome.state;
  if (UNDOABLE.has(command.type) && state.config.undoDepth > 0) {
    const entry = buildUndoEntry(state, next, command, activitySeq, outcome.activity.message);
    next = { ...next, undoStack: [...next.undoStack, entry].slice(-state.config.undoDepth) };
  }
  next = {
    ...next,
    version: state.version + 1,
    counters: { ...next.counters, activity: activitySeq },
    activity: [...state.activity, event],
  };
  return { ok: true, state: next, events: [event] };
}
