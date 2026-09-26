/**
 * The single place that decides which repository adapter the app uses.
 *
 * Default: the local (browser-only) adapter.
 * Dev-only opt-in: VITE_IPL_AUCTION_ADAPTER=appwrite reads the auction from the
 * IPL dev database (read-only until Phase 3). Needs VITE_IPL_AUCTION_DATABASE_ID;
 * VITE_IPL_AUCTION_ID is optional (defaults to the newest auction).
 */
import { IPL_AUCTION_DATABASE_ID, Query, tablesDB } from "../../../config/appwrite.js";
import { createAppwriteRepository } from "./appwriteAdapter.js";
import { createLocalRepository } from "./localAdapter.js";
import { createMockAuctionState } from "./mockSeed.js";

let repository = null;

export function getAuctionRepository() {
  if (!repository) {
    repository =
      import.meta.env.VITE_IPL_AUCTION_ADAPTER === "appwrite"
        ? createAppwriteRepository({
          tablesDB,
          Query,
          databaseId: IPL_AUCTION_DATABASE_ID,
          auctionId: import.meta.env.VITE_IPL_AUCTION_ID || null,
        })
        : createLocalRepository({ createSeedState: () => createMockAuctionState() });
  }
  return repository;
}
