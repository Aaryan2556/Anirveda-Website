import { ROLE_LIST } from "../config.js";
import { PLAYER_STATUS } from "./constants.js";

/**
 * Derived data. Purse, spend and squad composition are always computed from
 * `purchases` so there is a single source of truth (and undo cannot leave a
 * cached purse out of sync).
 */
export function getTeamStats(state, teamId) {
  const roles = Object.fromEntries(ROLE_LIST.map((role) => [role, 0]));
  let spent = 0;
  let count = 0;
  let overseas = 0;
  for (const purchase of state.purchases) {
    if (purchase.teamId !== teamId) continue;
    const player = state.players[purchase.playerId];
    spent += purchase.price;
    count += 1;
    if (player?.isOverseas) overseas += 1;
    if (player) roles[player.role] += 1;
  }
  return { spent, purse: state.config.initialPurse - spent, count, overseas, roles };
}

export function getSquad(state, teamId) {
  return state.purchases
    .filter((purchase) => purchase.teamId === teamId)
    .map((purchase) => ({ ...state.players[purchase.playerId], price: purchase.price }));
}

export function getTeamsInOrder(state) {
  return state.teamOrder.map((id) => state.teams[id]);
}

export function getPlayersInOrder(state) {
  return state.playerOrder.map((id) => state.players[id]);
}

/** Description of the action the next UNDO would reverse, or null. */
export function getUndoPreview(state) {
  return state.undoStack.length ? state.undoStack[state.undoStack.length - 1].description : null;
}

/** Players still waiting to come up, in auction sequence (playerOrder). */
export function getUpcomingPlayers(state) {
  return getPlayersInOrder(state).filter((player) => player.status === PLAYER_STATUS.AVAILABLE);
}

/** The next player in the sequence, or null when every player has been through. */
export function getNextPlayerInSequence(state) {
  return getUpcomingPlayers(state)[0] ?? null;
}

/** Latest sales first, each with its player and team. */
export function getRecentSales(state, limit = Infinity) {
  return state.purchases
    .slice(-limit)
    .reverse()
    .map((purchase) => ({ ...purchase, player: state.players[purchase.playerId], team: state.teams[purchase.teamId] }));
}

/**
 * End-of-auction (or running) summary for organisers: per team squad, spend,
 * role mix and whether the squad/role minimums are met, plus pool totals.
 */
export function getAuctionSummary(state) {
  const { squad, roleLimits } = state.config;
  const teams = getTeamsInOrder(state).map((team) => {
    const stats = getTeamStats(state, team.id);
    const rolesShort = ROLE_LIST.filter((role) => stats.roles[role] < roleLimits[role].min);
    return {
      team,
      stats,
      squad: getSquad(state, team.id),
      meetsSquadMinimum: stats.count >= squad.min,
      rolesShort,
    };
  });
  const byStatus = Object.fromEntries(Object.values(PLAYER_STATUS).map((status) => [status, 0]));
  for (const player of Object.values(state.players)) byStatus[player.status] += 1;
  return {
    teams,
    players: { total: state.playerOrder.length, byStatus },
    totalSpent: state.purchases.reduce((sum, purchase) => sum + purchase.price, 0),
  };
}
