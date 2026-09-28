/**
 * The single place that decides which repository adapter (and matching admin
 * auth) the app uses.
 *
 * Default: the local (browser-only) adapter, no login.
 * VITE_IPL_AUCTION_ADAPTER=appwrite: the auction lives in the IPL Appwrite
 * database; admins sign in with an Appwrite account carrying the admin label.
 * Needs VITE_IPL_AUCTION_DATABASE_ID; VITE_IPL_AUCTION_ID is optional (defaults
 * to the newest auction).
 */
import { Realtime } from "appwrite";
import { ID, IPL_AUCTION_DATABASE_ID, Query, account, client, tablesDB } from "../../../config/appwrite.js";
import { createAppwriteAdminAuth, createLocalAdminAuth } from "../auth/adminAuth.js";
import { createAppwriteRepository } from "./appwriteAdapter.js";
import { createAppwriteRealtimeSource } from "./appwriteRealtime.js";
import { createLocalRepository } from "./localAdapter.js";
import { createMockAuctionState } from "./mockSeed.js";

const useAppwrite = import.meta.env.VITE_IPL_AUCTION_ADAPTER === "appwrite";

let repository = null;
let adminAuth = null;

export function getAuctionRepository() {
  if (!repository) {
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
  if (!adminAuth) adminAuth = useAppwrite ? createAppwriteAdminAuth({ account }) : createLocalAdminAuth();
  return adminAuth;
}
