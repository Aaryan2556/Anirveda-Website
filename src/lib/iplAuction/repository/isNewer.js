/** True when `candidate` is a later state than `current` (a newer reset, or a higher version). */
export function isNewer(candidate, current) {
  if (!current) return true;
  if (candidate.createdAt !== current.createdAt) return candidate.createdAt > current.createdAt;
  if (candidate.auctionId !== current.auctionId) return true;
  return candidate.version > current.version;
}
