import { DEV_DEFAULT_CONFIG } from "../config.js";
import { createInitialState } from "../engine/index.js";
import mockPlayers from "../../../data/iplAuction/mockPlayers.js";
import mockTeams from "../../../data/iplAuction/mockTeams.js";

function makeId(prefix) {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}

/** A fresh local auction built from FICTIONAL mock teams and players and the dev default rules. */
export function createMockAuctionState({ config = DEV_DEFAULT_CONFIG, at = Date.now() } = {}) {
  return createInitialState({
    auctionId: makeId("local-auction"),
    name: "Local simulation (fictional data)",
    config,
    teams: mockTeams,
    players: mockPlayers,
    at,
  });
}

export { makeId };
