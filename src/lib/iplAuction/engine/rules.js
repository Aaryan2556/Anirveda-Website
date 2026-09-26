import { ROLE_LIST, ROLE_LABELS } from "../config.js";
import { formatLakhs } from "../money.js";
import { ERROR, fail } from "./errors.js";
import { getTeamStats } from "./selectors.js";

/** Lakhs a team must keep back to still reach squad.min after owning `squadCountAfter` players. */
export function reserveRequired(config, squadCountAfter) {
  if (!config.minimumReserve.enabled) return 0;
  return Math.max(0, config.squad.min - squadCountAfter) * config.minimumReserve.perSlot;
}

/** Highest price a team may pay for its next player (purse minus minimum reserve). */
export function getMaxBid(state, teamId) {
  const stats = getTeamStats(state, teamId);
  return Math.max(0, stats.purse - reserveRequired(state.config, stats.count + 1));
}

/** Squad-size, overseas and role checks for `teamId` acquiring `player`. Returns an error or null. */
export function checkEligibility(state, teamId, player) {
  const { squad, maxOverseas, roleLimits } = state.config;
  const stats = getTeamStats(state, teamId);

  if (stats.count >= squad.max) {
    return fail(ERROR.SQUAD_FULL, `Squad is full (${stats.count}/${squad.max}).`);
  }
  if (player.isOverseas && maxOverseas !== null && stats.overseas >= maxOverseas) {
    return fail(ERROR.OVERSEAS_LIMIT, `Overseas limit reached (${stats.overseas}/${maxOverseas}).`);
  }
  const limit = roleLimits[player.role];
  if (limit.max !== null && stats.roles[player.role] >= limit.max) {
    return fail(
      ERROR.ROLE_LIMIT,
      `${ROLE_LABELS[player.role]} limit reached (${stats.roles[player.role]}/${limit.max}).`
    );
  }

  // After this purchase, are there still enough open slots to meet every role minimum?
  const slotsLeft = squad.max - (stats.count + 1);
  let slotsNeeded = 0;
  for (const role of ROLE_LIST) {
    const have = stats.roles[role] + (role === player.role ? 1 : 0);
    slotsNeeded += Math.max(0, roleLimits[role].min - have);
  }
  if (slotsNeeded > slotsLeft) {
    return fail(
      ERROR.ROLE_MINIMUM_UNREACHABLE,
      `Buying this ${ROLE_LABELS[player.role].toLowerCase()} would leave too few slots to meet the role minimums.`
    );
  }
  return null;
}

/** Purse and minimum-reserve checks. Returns an error or null. */
export function checkAffordability(state, teamId, amount) {
  const stats = getTeamStats(state, teamId);
  if (amount > stats.purse) {
    return fail(ERROR.INSUFFICIENT_PURSE, `${formatLakhs(amount)} exceeds remaining purse ${formatLakhs(stats.purse)}.`);
  }
  const maxBid = getMaxBid(state, teamId);
  if (amount > maxBid) {
    return fail(
      ERROR.RESERVE_REQUIRED,
      `${formatLakhs(amount)} exceeds the maximum allowed ${formatLakhs(maxBid)} (must keep a reserve to complete the minimum squad).`
    );
  }
  return null;
}

/**
 * Full validation of the admin assigning `player` to `teamId` for `price` (the
 * hammer price from the room). Returns an error or null. Bidding itself happens
 * offline, so the price only has to be whole lakhs and at least the base price.
 */
export function validateSale(state, teamId, player, price) {
  if (!state.teams[teamId]) return fail(ERROR.NOT_FOUND, "Unknown team.");
  if (!Number.isSafeInteger(price) || price <= 0) {
    return fail(ERROR.INVALID_AMOUNT, "Price must be a positive whole number of lakhs.");
  }
  if (price < player.basePrice) {
    return fail(ERROR.PRICE_BELOW_BASE, `Price must be at least the base price ${formatLakhs(player.basePrice)}.`);
  }
  return checkEligibility(state, teamId, player) || checkAffordability(state, teamId, price);
}
