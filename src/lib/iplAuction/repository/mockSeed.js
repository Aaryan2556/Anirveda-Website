import { DEV_DEFAULT_CONFIG } from "../config.js";
import { createInitialState } from "../engine/index.js";
import mockPlayers from "../../../data/iplAuction/mockPlayers.js";
import mockTeams from "../../../data/iplAuction/mockTeams.js";

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const MAX_ID_LENGTH = 36; // Appwrite row ID limit

/**
 * `${prefix}-${random}`, valid as an Appwrite row ID: at most 36 characters of
 * a-z 0-9 and "-", starting with a letter (so prefixes must start with one).
 */
function makeId(prefix, randomLength = 16) {
  if (!/^[a-z][a-z0-9-]*$/.test(prefix) || prefix.length + 1 + randomLength > MAX_ID_LENGTH) {
    throw new Error(`makeId: prefix "${prefix}" is invalid or too long for an Appwrite ID.`);
  }
  const bytes = new Uint8Array(randomLength);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < randomLength; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  const random = Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("");
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
