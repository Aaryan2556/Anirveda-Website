/**
 * Which backend the IPL Auction runs on, decided once from the build's env vars.
 *
 *   resolveAuctionMode({ adapter, databaseId, isProduction })
 *     → { mode: "appwrite" | "local" | "disabled", reason }
 *
 * - `VITE_IPL_AUCTION_ADAPTER=appwrite` needs `VITE_IPL_AUCTION_DATABASE_ID`.
 * - The local (browser-only) adapter is for development: in a production build it
 *   is never used, so nobody on the live site gets a no-login "admin" console or
 *   the "Reset local data" button. A production build without Appwrite settings
 *   shows the auction as unavailable instead.
 */
export const AUCTION_MODES = Object.freeze({ APPWRITE: "appwrite", LOCAL: "local", DISABLED: "disabled" });

export function resolveAuctionMode({ adapter, databaseId, isProduction }) {
  if (adapter === AUCTION_MODES.APPWRITE) {
    if (!databaseId) {
      return { mode: AUCTION_MODES.DISABLED, reason: "VITE_IPL_AUCTION_DATABASE_ID is not set." };
    }
    return { mode: AUCTION_MODES.APPWRITE, reason: null };
  }
  if (adapter && adapter !== AUCTION_MODES.LOCAL) {
    return { mode: AUCTION_MODES.DISABLED, reason: `Unknown VITE_IPL_AUCTION_ADAPTER "${adapter}".` };
  }
  if (isProduction) {
    return { mode: AUCTION_MODES.DISABLED, reason: "The auction is not connected to its database in this build." };
  }
  return { mode: AUCTION_MODES.LOCAL, reason: null };
}
