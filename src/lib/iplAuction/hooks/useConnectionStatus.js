import { useSyncExternalStore } from "react";
import { getAuctionRepository } from "../repository/index.js";

const LOCAL = Object.freeze({ status: "local", lastSyncAt: null });
const noopSubscribe = () => () => {};
const getLocal = () => LOCAL;

/**
 * Sync health of the auction data: `{ status, lastSyncAt }`.
 * status: "local" (browser-only adapter) | "polling" | "connecting" | "live" | "reconnecting" | "offline".
 */
export function useConnectionStatus(repository = getAuctionRepository()) {
  const connection = repository.connection;
  return useSyncExternalStore(connection?.subscribe ?? noopSubscribe, connection?.getStatus ?? getLocal);
}
