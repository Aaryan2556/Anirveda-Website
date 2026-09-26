/**
 * The single place that decides which repository adapter the app uses.
 * Phase 1: the local adapter only. A later phase adds an Appwrite adapter with
 * the same contract (see localAdapter.js) and switches it in here.
 */
import { createLocalRepository } from "./localAdapter.js";
import { createMockAuctionState } from "./mockSeed.js";

let repository = null;

export function getAuctionRepository() {
  if (!repository) {
    repository = createLocalRepository({ createSeedState: () => createMockAuctionState() });
  }
  return repository;
}
