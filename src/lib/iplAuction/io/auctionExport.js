/**
 * Organiser exports: purchase history as CSV and a full summary as JSON.
 * Pure (returns strings); the page turns them into downloads.
 */
import { ROLE_LABELS, ROLE_LIST } from "../config.js";
import { getAuctionSummary, getRecentSales } from "../engine/index.js";

const csvCell = (value) => {
  if (value == null) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (rows) => rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

/** One row per sale, in the order the sales happened. Prices in whole lakhs. */
export function buildPurchasesCsv(state) {
  const header = ["#", "Player", "Role", "Overseas", "Base price (lakhs)", "Team", "Price (lakhs)", "Sold at", "Data source"];
  const rows = getRecentSales(state)
    .reverse()
    .map((sale, index) => [
      index + 1,
      sale.player?.name,
      ROLE_LABELS[sale.player?.role] ?? sale.player?.role,
      sale.player?.isOverseas ? "Yes" : "No",
      sale.player?.basePrice,
      sale.team?.name,
      sale.price,
      sale.at == null ? "" : new Date(sale.at).toISOString(),
      sale.player?.dataSource,
    ]);
  return toCsv([header, ...rows]);
}

/** Per-team squads, spend and role mix, plus the rules used. Money in whole lakhs. */
export function buildSummaryJson(state) {
  const summary = getAuctionSummary(state);
  return JSON.stringify(
    {
      auction: { id: state.auctionId, name: state.name, status: state.status, version: state.version },
      moneyUnit: "lakhs",
      config: state.config,
      totalSpent: summary.totalSpent,
      players: summary.players,
      teams: summary.teams.map(({ team, stats, squad, meetsSquadMinimum, rolesShort }) => ({
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        spent: stats.spent,
        purseLeft: stats.purse,
        squadSize: stats.count,
        overseas: stats.overseas,
        roles: Object.fromEntries(ROLE_LIST.map((role) => [role, stats.roles[role]])),
        meetsSquadMinimum,
        rolesShort,
        squad: squad.map((player) => ({
          id: player.id,
          name: player.name,
          role: player.role,
          isOverseas: player.isOverseas,
          price: player.price,
          dataSource: player.dataSource,
        })),
      })),
    },
    null,
    2
  );
}
