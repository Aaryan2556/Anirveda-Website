export const AUCTION_STATUS = Object.freeze({
  SETUP: "SETUP",
  LIVE: "LIVE",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
});

export const PLAYER_STATUS = Object.freeze({
  AVAILABLE: "AVAILABLE",
  ON_BLOCK: "ON_BLOCK",
  SOLD: "SOLD",
  UNSOLD: "UNSOLD",
  WITHDRAWN: "WITHDRAWN",
});

export const ACTOR_ROLES = Object.freeze({
  ADMIN: "ADMIN",
  TEAM: "TEAM",
});

export const COMMANDS = Object.freeze({
  UPDATE_CONFIG: "UPDATE_CONFIG",
  ADD_TEAM: "ADD_TEAM",
  UPDATE_TEAM: "UPDATE_TEAM",
  REMOVE_TEAM: "REMOVE_TEAM",
  ADD_PLAYER: "ADD_PLAYER",
  UPDATE_PLAYER: "UPDATE_PLAYER",
  REMOVE_PLAYER: "REMOVE_PLAYER",
  REORDER_PLAYERS: "REORDER_PLAYERS",
  START_AUCTION: "START_AUCTION",
  PAUSE_AUCTION: "PAUSE_AUCTION",
  RESUME_AUCTION: "RESUME_AUCTION",
  END_AUCTION: "END_AUCTION",
  OPEN_LOT: "OPEN_LOT",
  SELL_PLAYER: "SELL_PLAYER",
  MARK_UNSOLD: "MARK_UNSOLD",
  CANCEL_SALE: "CANCEL_SALE",
  WITHDRAW_PLAYER: "WITHDRAW_PLAYER",
  REINSTATE_PLAYER: "REINSTATE_PLAYER",
  UNDO: "UNDO",
  UPDATE_BID: "UPDATE_BID",
});

/**
 * Maximum lengths of free-text fields. The engine rejects longer values so the
 * local and Appwrite adapters behave the same; appwriteSchema.js sizes its
 * columns from these.
 */
export const TEXT_LIMITS = Object.freeze({
  name: 128,
  shortName: 16,
  url: 2000,
  nationality: 64,
  style: 64,
  dataSource: 32,
  stats: 20000,
  recentPerformance: 5000,
});
