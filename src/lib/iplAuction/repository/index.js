/**
 * The single place that decides which repository adapter (and matching admin
 * auth) the app uses. The rules are in mode.js:
 *
 * Development default: the local (browser-only) adapter, no login.
 * VITE_IPL_AUCTION_ADAPTER=appwrite: the auction lives in the IPL Appwrite
 * database; admins sign in with an Appwrite account carrying the admin label.
 * Needs VITE_IPL_AUCTION_DATABASE_ID; VITE_IPL_AUCTION_ID is optional (defaults
 * to the newest auction).
 * Production builds never use the local adapter; without Appwrite settings the
 * mode is "disabled" and pages show the auction as unavailable (check
 * getAuctionMode() before calling any other function here).
 */
import { Realtime } from "appwrite";
import { ID, IPL_AUCTION_DATABASE_ID, Query, account, client, tablesDB } from "../../../config/appwrite.js";
import { createAppwriteAdminAuth, createLocalAdminAuth } from "../auth/adminAuth.js";
import { createAppwriteRepository } from "./appwriteAdapter.js";
import { createAppwriteRealtimeSource } from "./appwriteRealtime.js";
import { createLocalRepository } from "./localAdapter.js";
import { createMockAuctionState } from "./mockSeed.js";
import { AUCTION_MODES, resolveAuctionMode } from "./mode.js";

export { AUCTION_MODES };

const auctionMode = resolveAuctionMode({
  adapter: import.meta.env.VITE_IPL_AUCTION_ADAPTER,
  databaseId: IPL_AUCTION_DATABASE_ID,
  isProduction: import.meta.env.PROD,
});
const useAppwrite = auctionMode.mode === AUCTION_MODES.APPWRITE;

let repository = null;
let adminAuth = null;

/** `{ mode: "appwrite" | "local" | "disabled", reason }`, fixed for the build. */
export function getAuctionMode() {
  return auctionMode;
}

function assertEnabled() {
  if (auctionMode.mode === AUCTION_MODES.DISABLED) {
    throw new Error(`IPL Auction is disabled: ${auctionMode.reason}`);
  }
}

export function getAuctionRepository() {
  if (!repository) {
    assertEnabled();
    repository = useAppwrite
      ? createAppwriteRepository({
        tablesDB,
        Query,
        ID,
        databaseId: IPL_AUCTION_DATABASE_ID,
        auctionId: import.meta.env.VITE_IPL_AUCTION_ID || null,
        // VITE_IPL_AUCTION_REALTIME=off falls back to polling only (every 2 s).
        realtime:
          import.meta.env.VITE_IPL_AUCTION_REALTIME === "off"
            ? null
            : createAppwriteRealtimeSource({ realtime: new Realtime(client) }),
      })
      : createLocalRepository({ createSeedState: () => createMockAuctionState() });
  }
  return repository;
}

export function getAdminAuth() {
  if (!adminAuth) {
    assertEnabled();
    adminAuth = useAppwrite ? createAppwriteAdminAuth({ account }) : createLocalAdminAuth();
  }
  return adminAuth;
}
