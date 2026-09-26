import { useSyncExternalStore } from "react";
import { getAuctionRepository } from "../repository/index.js";

/** Subscribes a component to the auction state. `dispatch` resolves to the engine result. */
export function useAuction(repository = getAuctionRepository()) {
  const state = useSyncExternalStore(repository.subscribe, repository.getSnapshot);
  return { state, dispatch: repository.dispatch, reset: repository.reset };
}
