/**
 * IPL Auction Appwrite schema (TablesDB: tables / rows / columns), as code.
 *
 * Single source of truth for the setup script (scripts/ipl-auction/) and the
 * mapper. Table IDs are fixed constants, not env vars; only the database ID
 * comes from configuration.
 *
 * Conventions:
 * - Money columns are integers in whole lakhs.
 * - Engine timestamps are integer epoch ms (`*Ms`), separate from Appwrite's `$createdAt`.
 * - JSON blobs (config, stats, undo stack…) are text columns holding JSON.
 * - Row IDs: auction, team and player rows use the engine ID. A purchase row uses
 *   the PLAYER's ID, so the database itself refuses a second sale of the same
 *   player. Activity rows use a generated ID plus a unique (auctionId, seq) index.
 */
import { ROLE_LIST } from "../config.js";
import { AUCTION_STATUS, PLAYER_STATUS } from "../engine/constants.js";

export const TABLES = Object.freeze({
  AUCTIONS: "ipl_auctions",
  TEAMS: "ipl_teams",
  PLAYERS: "ipl_players",
  PURCHASES: "ipl_purchases",
  ACTIVITY: "ipl_activity",
});

const MAX_SAFE = Number.MAX_SAFE_INTEGER;
const id = (key, required = true) => ({ key, type: "string", size: 36, required });
const str = (key, size, required = false) => ({ key, type: "string", size, required });
const json = (key, size, required = false) => ({ key, type: "string", size, required });
const int = (key, { required = false, min = 0, max = MAX_SAFE } = {}) => ({ key, type: "integer", required, min, max });
const bool = (key, required = true) => ({ key, type: "boolean", required });
const enumeration = (key, elements, required = true) => ({ key, type: "enum", elements: [...elements], required });
const index = (key, columns, type = "key") => ({ key, type, columns, orders: columns.map(() => "ASC") });

export const SCHEMA = Object.freeze([
  {
    id: TABLES.AUCTIONS,
    name: "IPL Auctions",
    columns: [
      str("name", 128, true),
      enumeration("status", Object.values(AUCTION_STATUS)),
      int("schemaVersion", { required: true }),
      int("version", { required: true }),
      int("createdAtMs", { required: true }),
      json("config", 20000, true),
      json("counters", 1000, true),
      json("undoStack", 1000000, true),
      id("lotId", false),
      id("lotPlayerId", false),
      int("lotOpenedAtMs"),
    ],
    indexes: [index("createdAtMs", ["createdAtMs"])],
  },
  {
    id: TABLES.TEAMS,
    name: "IPL Teams",
    columns: [
      id("auctionId"),
      int("order", { required: true }),
      str("name", 128, true),
      str("shortName", 16, true),
      str("logo", 2000),
    ],
    indexes: [index("auctionId", ["auctionId"])],
  },
  {
    id: TABLES.PLAYERS,
    name: "IPL Players",
    columns: [
      id("auctionId"),
      int("order", { required: true }),
      str("name", 128, true),
      enumeration("role", ROLE_LIST),
      bool("isOverseas"),
      int("basePrice", { required: true, min: 1 }),
      str("nationality", 64),
      int("age"),
      str("battingStyle", 64),
      str("bowlingStyle", 64),
      str("image", 2000),
      json("stats", 20000),
      json("recentPerformance", 5000, true),
      str("dataSource", 32, true),
      enumeration("status", Object.values(PLAYER_STATUS)),
      id("soldTo", false),
      int("soldPrice"),
    ],
    indexes: [index("auctionId", ["auctionId"]), index("auctionId_status", ["auctionId", "status"])],
  },
  {
    id: TABLES.PURCHASES,
    name: "IPL Purchases",
    columns: [
      id("auctionId"),
      int("seq", { required: true, min: 1 }),
      id("lotId"),
      id("playerId"),
      id("teamId"),
      int("price", { required: true, min: 1 }),
      int("atMs"),
    ],
    indexes: [
      index("auctionId_player", ["auctionId", "playerId"], "unique"),
      index("auctionId_seq", ["auctionId", "seq"], "unique"),
    ],
  },
  {
    id: TABLES.ACTIVITY,
    name: "IPL Activity",
    columns: [
      id("auctionId"),
      int("seq", { required: true, min: 1 }),
      str("type", 32, true),
      int("atMs"),
      str("actorRole", 16, true),
      id("actorTeamId", false),
      id("playerId", false),
      id("teamId", false),
      int("amount"),
      int("undoneSeq"),
      str("message", 1000, true),
    ],
    // The unique (auctionId, seq) index doubles as the per-auction write guard in Phase 3.
    indexes: [index("auctionId_seq", ["auctionId", "seq"], "unique")],
  },
]);
