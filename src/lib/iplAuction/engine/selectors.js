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
  let female = 0;
  for (const purchase of state.purchases) {
    if (purchase.teamId !== teamId) continue;
    const player = state.players[purchase.playerId];
    spent += purchase.price;
    count += 1;
    if (player?.isOverseas) overseas += 1;
    if (player?.isFemale) female += 1;
    if (player) roles[player.role] += 1;
  }
  return { spent, purse: state.config.initialPurse - spent, count, overseas, female, roles };
}

export function getSquad(state, teamId) {
  return state.purchases
    .filter((purchase) => purchase.teamId === teamId)
    .map((purchase) => ({ ...state.players[purchase.playerId], price: purchase.price }))
    .filter((p) => p && p.name);
}

export function getTeamsInOrder(state) {
  return state.teamOrder.map((id) => state.teams[id]).filter(Boolean);
}

export function getPlayersInOrder(state) {
  return state.playerOrder.map((id) => state.players[id]).filter(Boolean);
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
  return (state.purchases || [])
    .slice(-limit)
    .reverse()
    .map((purchase) => ({
      ...purchase,
      player: state.players[purchase.playerId] ?? null,
      team: state.teams[purchase.teamId] ?? null,
    }));
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
    if ((state.config.minFemale || 0) > stats.female) rolesShort.push("FEMALE");
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

/**
 * The player pool in auction order with its position and buyer, filtered.
 * `status`: a PLAYER_STATUS or "ALL"; `role`: a role or "ALL";
 * `overseas`: true / false / null (any); `query`: case-insensitive name match.
 */
export function getMarket(state, { status = "ALL", role = "ALL", overseas = null, query = "" } = {}) {
  const text = query.trim().toLowerCase();
  return getPlayersInOrder(state)
    .map((player, index) => ({
      player,
      position: index + 1,
      team: player.soldTo ? state.teams[player.soldTo] ?? null : null,
    }))
    .filter(({ player }) =>
      (status === "ALL" || player.status === status)
      && (role === "ALL" || player.role === role)
      && (overseas === null || player.isOverseas === overseas)
      && (!text || player.name.toLowerCase().includes(text)));
}

/** One team's purchases in the order they happened, with each player. */
export function getTeamPurchaseHistory(state, teamId) {
  return state.purchases
    .filter((purchase) => purchase.teamId === teamId)
    .map((purchase) => ({ ...purchase, player: state.players[purchase.playerId] }));
}

/**
 * What a team still needs: open squad slots, players short of the squad
 * minimum, overseas slots left, and per-role have / min / max / need.
 */
export function getRoleNeeds(state, teamId) {
  const { squad, maxOverseas, roleLimits } = state.config;
  const stats = getTeamStats(state, teamId);
  const roles = Object.fromEntries(
    ROLE_LIST.map((role) => {
      const { min, max } = roleLimits[role];
      const have = stats.roles[role];
      return [role, { have, min, max, need: Math.max(0, min - have), full: max !== null && have >= max }];
    })
  );
  return {
    slotsLeft: Math.max(0, squad.max - stats.count),
    squadShort: Math.max(0, squad.min - stats.count),
    overseasLeft: maxOverseas === null ? null : Math.max(0, maxOverseas - stats.overseas),
    female: {
      have: stats.female,
      min: state.config.minFemale || 0,
      need: Math.max(0, (state.config.minFemale || 0) - stats.female),
    },
    roles,
  };
}

const LOT_RESULT_EVENTS = {
  SELL_PLAYER: "SOLD",
  MARK_UNSOLD: "UNSOLD",
  WITHDRAW_PLAYER: "WITHDRAWN",
};

/**
 * Every lot so far, oldest first, rebuilt from the activity log:
 *   { playerId, player, openedAt, closedAt, result, teamId, team, price, cancelled }
 * `result` is SOLD / UNSOLD / WITHDRAWN, or OPEN for the lot on the block.
 * Undone actions are ignored (an undone sale re-opens its lot, an undone
 * OPEN_LOT never happened); a sale later reversed with CANCEL_SALE stays in
 * the history with `cancelled: true`.
 */
export function getLotHistory(state) {
  const undone = new Set(state.activity.filter((entry) => entry.undoneSeq != null).map((entry) => entry.undoneSeq));
  const lots = [];
  let open = null;
  for (const entry of state.activity) {
    if (undone.has(entry.seq)) continue;
    if (entry.type === "OPEN_LOT") {
      open = { playerId: entry.playerId, openedAt: entry.at, closedAt: null, result: "OPEN", teamId: null, price: null, cancelled: false };
      lots.push(open);
    } else if (open && LOT_RESULT_EVENTS[entry.type] && entry.playerId === open.playerId) {
      Object.assign(open, {
        result: LOT_RESULT_EVENTS[entry.type],
        closedAt: entry.at,
        teamId: entry.type === "SELL_PLAYER" ? entry.teamId : null,
        price: entry.type === "SELL_PLAYER" ? entry.amount : null,
      });
      open = null;
    } else if (entry.type === "CANCEL_SALE") {
      const sale = lots.findLast((lot) => lot.playerId === entry.playerId && lot.result === "SOLD" && !lot.cancelled);
      if (sale) sale.cancelled = true;
    }
  }
  return lots.map((lot) => ({
    ...lot,
    player: state.players[lot.playerId] ?? null,
    team: lot.teamId ? state.teams[lot.teamId] ?? null : null,
  }));
}

/**
 * The most expensive purchases, highest price first; ties keep the order they
 * were bought in. Each comes with its player and team.
 */
export function getTopSales(state, limit = 5) {
  return state.purchases
    .map((purchase, index) => ({ purchase, index }))
    .sort((a, b) => b.purchase.price - a.purchase.price || a.index - b.index)
    .slice(0, limit)
    .map(({ purchase }) => ({ ...purchase, player: state.players[purchase.playerId], team: state.teams[purchase.teamId] }));
}
