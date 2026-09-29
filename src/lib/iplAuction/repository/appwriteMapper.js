/**
 * Pure mapping between engine state and Appwrite rows (see appwriteSchema.js).
 *
 *   stateToRows(state)         -> { auction, teams, players, purchases, activity }
 *   rowsToState(rows)          -> engine state (inverse of stateToRows)
 *   diffToWrites(prev, next)   -> [{ action, tableId, rowId, data }]
 *
 * Rows are plain objects: `$id` plus column values. Appwrite system fields
 * (`$createdAt`, `$permissions`, …) are ignored on the way in. Activity rows
 * carry no `$id`; their writes use `rowId: null`, meaning "generate one".
 *
 * The write list uses the same shape as Appwrite transaction operations (minus
 * `databaseId`, which the adapter adds), so Phase 3 can submit it atomically.
 */
import { TABLES } from "./appwriteSchema.js";

const toJson = (value) => JSON.stringify(value);
const fromJson = (text, fallback = null) => (text == null ? fallback : JSON.parse(text));

// ---------------------------------------------------------------------------
// State -> rows
// ---------------------------------------------------------------------------

function auctionRow(state) {
  return {
    $id: state.auctionId,
    name: state.name,
    status: state.status,
    schemaVersion: state.schemaVersion,
    version: state.version,
    createdAtMs: state.createdAt,
    config: toJson(state.config),
    counters: toJson(state.counters),
    undoStack: toJson(state.undoStack),
    lotId: state.lot?.id ?? null,
    lotPlayerId: state.lot?.playerId ?? null,
    lotOpenedAtMs: state.lot?.openedAt ?? null,
    lotCurrentBid: state.lot?.currentBid ?? null,
    lotCurrentBidTeamId: state.lot?.currentBidTeamId ?? null,
  };
}

function teamRow(state, team, order) {
  return {
    $id: team.id,
    auctionId: state.auctionId,
    order,
    name: team.name,
    shortName: team.shortName,
    logo: team.logo,
  };
}

function playerRow(state, player, order) {
  return {
    $id: player.id,
    auctionId: state.auctionId,
    order,
    name: player.name,
    role: player.role,
    isOverseas: player.isOverseas,
    basePrice: player.basePrice,
    nationality: player.nationality,
    age: player.age,
    battingStyle: player.battingStyle,
    bowlingStyle: player.bowlingStyle,
    image: player.image,
    stats: player.stats == null ? null : toJson(player.stats),
    recentPerformance: toJson(player.recentPerformance),
    dataSource: player.dataSource,
    status: player.status,
    soldTo: player.soldTo,
    soldPrice: player.soldPrice,
  };
}

function purchaseRow(state, purchase) {
  return {
    $id: purchase.playerId,
    auctionId: state.auctionId,
    seq: purchase.seq,
    lotId: purchase.lotId,
    playerId: purchase.playerId,
    teamId: purchase.teamId,
    price: purchase.price,
    atMs: purchase.at,
  };
}

function activityRow(state, entry) {
  return {
    auctionId: state.auctionId,
    seq: entry.seq,
    type: entry.type,
    atMs: entry.at,
    actorRole: entry.actor.role,
    actorTeamId: entry.actor.teamId ?? null,
    playerId: entry.playerId ?? null,
    teamId: entry.teamId ?? null,
    amount: entry.amount ?? null,
    undoneSeq: entry.undoneSeq ?? null,
    message: entry.message,
  };
}

export function stateToRows(state) {
  return {
    auction: auctionRow(state),
    teams: state.teamOrder.map((teamId, i) => teamRow(state, state.teams[teamId], i)),
    players: state.playerOrder.map((playerId, i) => playerRow(state, state.players[playerId], i)),
    purchases: state.purchases.map((purchase) => purchaseRow(state, purchase)),
    activity: state.activity.map((entry) => activityRow(state, entry)),
  };
}

// ---------------------------------------------------------------------------
// Rows -> state
// ---------------------------------------------------------------------------

const byOrder = (a, b) => a.order - b.order;
const bySeq = (a, b) => a.seq - b.seq;

function withOptional(target, fields) {
  for (const [key, value] of Object.entries(fields)) {
    if (value != null) target[key] = value;
  }
  return target;
}

export function rowsToState({ auction, teams = [], players = [], purchases = [], activity = [] }) {
  const sortedTeams = [...teams].sort(byOrder);
  const sortedPlayers = [...players].sort(byOrder);
  return {
    schemaVersion: auction.schemaVersion,
    auctionId: auction.$id,
    name: auction.name,
    createdAt: auction.createdAtMs,
    version: auction.version,
    status: auction.status,
    config: fromJson(auction.config),
    teams: Object.fromEntries(
      sortedTeams.map((row) => [row.$id, { id: row.$id, name: row.name, shortName: row.shortName, logo: row.logo ?? null }])
    ),
    teamOrder: sortedTeams.map((row) => row.$id),
    players: Object.fromEntries(
      sortedPlayers.map((row) => [
        row.$id,
        {
          id: row.$id,
          name: row.name,
          role: row.role,
          isOverseas: row.isOverseas,
          basePrice: row.basePrice,
          nationality: row.nationality ?? null,
          age: row.age ?? null,
          battingStyle: row.battingStyle ?? null,
          bowlingStyle: row.bowlingStyle ?? null,
          image: row.image ?? null,
          stats: fromJson(row.stats),
          recentPerformance: fromJson(row.recentPerformance, []),
          dataSource: row.dataSource,
          status: row.status,
          soldTo: row.soldTo ?? null,
          soldPrice: row.soldPrice ?? null,
        },
      ])
    ),
    playerOrder: sortedPlayers.map((row) => row.$id),
    lot: auction.lotId
      ? { id: auction.lotId, playerId: auction.lotPlayerId, openedAt: auction.lotOpenedAtMs ?? null, currentBid: auction.lotCurrentBid ?? null, currentBidTeamId: auction.lotCurrentBidTeamId ?? null }
      : null,
    purchases: [...purchases].sort(bySeq).map((row) => ({
      id: `purchase-${row.seq}`,
      seq: row.seq,
      lotId: row.lotId,
      playerId: row.playerId,
      teamId: row.teamId,
      price: row.price,
      at: row.atMs ?? null,
    })),
    activity: [...activity].sort(bySeq).map((row) =>
      withOptional(
        {
          seq: row.seq,
          type: row.type,
          at: row.atMs ?? null,
          actor: row.actorTeamId ? { role: row.actorRole, teamId: row.actorTeamId } : { role: row.actorRole },
          message: row.message,
        },
        { playerId: row.playerId, teamId: row.teamId, amount: row.amount, undoneSeq: row.undoneSeq }
      )
    ),
    undoStack: fromJson(auction.undoStack, []),
    counters: fromJson(auction.counters),
  };
}

// ---------------------------------------------------------------------------
// Diff -> writes
// ---------------------------------------------------------------------------

const withoutId = ({ $id, ...data }) => data; // eslint-disable-line no-unused-vars

/** Columns whose values differ between two rows of the same table. */
function changedColumns(before, after) {
  const changes = {};
  for (const [key, value] of Object.entries(withoutId(after))) {
    if (toJson(value) !== toJson(before[key])) changes[key] = value;
  }
  return changes;
}

function diffTable(tableId, beforeRows, afterRows) {
  const writes = [];
  const before = new Map(beforeRows.map((row) => [row.$id, row]));
  const after = new Map(afterRows.map((row) => [row.$id, row]));
  for (const [rowId, row] of after) {
    const previous = before.get(rowId);
    if (!previous) {
      writes.push({ action: "create", tableId, rowId, data: withoutId(row) });
    } else {
      const data = changedColumns(previous, row);
      if (Object.keys(data).length) writes.push({ action: "update", tableId, rowId, data });
    }
  }
  for (const rowId of before.keys()) {
    if (!after.has(rowId)) writes.push({ action: "delete", tableId, rowId });
  }
  return writes;
}

/**
 * The writes that turn the stored `prev` into `next`. With no `prev` (or a
 * different auction), everything is created.
 *
 * Order: new activity first (its unique (auctionId, seq) index is the write
 * guard), then the auction row, then the rest. Activity is append-only.
 */
export function diffToWrites(prev, next) {
  const same = prev && prev.auctionId === next.auctionId;
  const a = same ? stateToRows(prev) : { auction: null, teams: [], players: [], purchases: [], activity: [] };
  const b = stateToRows(next);

  const lastSeq = a.activity.length ? a.activity[a.activity.length - 1].seq : 0;
  const activity = b.activity
    .filter((row) => row.seq > lastSeq)
    .map((row) => ({ action: "create", tableId: TABLES.ACTIVITY, rowId: null, data: row }));

  return [
    ...activity,
    ...diffTable(TABLES.AUCTIONS, a.auction ? [a.auction] : [], [b.auction]),
    ...diffTable(TABLES.TEAMS, a.teams, b.teams),
    ...diffTable(TABLES.PLAYERS, a.players, b.players),
    ...diffTable(TABLES.PURCHASES, a.purchases, b.purchases),
  ];
}
