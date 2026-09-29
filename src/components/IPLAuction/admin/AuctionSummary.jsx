/**
 * Organiser summary (admin only): totals, the most expensive buys, per-team
 * spend, squad and role mix, the full purchase history, and CSV/JSON downloads. All numbers come from engine selectors.
 */
import { ROLE_LABELS, ROLE_LIST } from "../../../lib/iplAuction/config";
import { getAuctionSummary, getRecentSales, getTopSales } from "../../../lib/iplAuction/engine";
import { buildPurchasesCsv, buildSummaryJson } from "../../../lib/iplAuction/io/auctionExport";
import { formatLakhs } from "../../../lib/iplAuction/money";
import { Button, Empty, StatTile, table } from "../ui/controls";
import { TeamSquadCard } from "../ui/auction";

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AuctionSummary({ state, renderSaleAction }) {
  const summary = getAuctionSummary(state);
  const { config } = state;
  const sales = getRecentSales(state).reverse();
  const topSales = getTopSales(state, 5);
  const slug = `${state.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "auction"}-v${state.version}`;

  return (
    <div className="space-y-6 text-sm">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Total spent" value={formatLakhs(summary.totalSpent)} accent />
        {Object.entries(summary.players.byStatus).map(([status, count]) => (
          <StatTile key={status} label={status.replace("_", " ")} value={count} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => download(`${slug}-purchases.csv`, buildPurchasesCsv(state), "text/csv")}>
          Download purchases (CSV)
        </Button>
        <Button variant="outline" onClick={() => download(`${slug}-summary.json`, buildSummaryJson(state), "application/json")}>
          Download summary (JSON)
        </Button>
      </div>

      <div>
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-secondary">Most expensive buys</div>
        {topSales.length === 0 ? (
          <Empty>No players sold yet.</Empty>
        ) : (
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {topSales.map((sale, index) => (
              <li
                key={sale.id}
                className={`rounded-lg border px-3 py-2 ${index === 0 ? "border-primary bg-primary/10" : "border-secondary/20 bg-secondary-15"}`}
              >
                <div className="text-[10px] uppercase tracking-wider text-secondary">
                  #{index + 1} · {ROLE_LABELS[sale.player.role]}
                </div>
                <div className="truncate text-white">{sale.player.name}</div>
                <div className="truncate text-xs text-secondary">{sale.team.name}</div>
                <div className="font-Bebas text-2xl leading-tight tracking-wide text-primary">{formatLakhs(sale.price)}</div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className={table.wrap}>
        <table className={table.table}>
          <thead className={table.thead}>
            <tr>
              <th className={table.th}>Team</th>
              <th className={table.th}>Spent</th>
              <th className={table.th}>Purse left</th>
              <th className={table.th}>Squad</th>
              <th className={table.th}>Overseas</th>
              {ROLE_LIST.map((role) => (
                <th key={role} className={table.th}>
                  {ROLE_LABELS[role]}
                </th>
              ))}
              <th className={table.th}>Minimums</th>
            </tr>
          </thead>
          <tbody className={table.tbody}>
            {summary.teams.map(({ team, stats, meetsSquadMinimum, rolesShort }) => (
              <tr key={team.id}>
                <td className={table.td}>{team.name}</td>
                <td className={table.td}>{formatLakhs(stats.spent)}</td>
                <td className={table.td}>{formatLakhs(stats.purse)}</td>
                <td className={table.td}>
                  {stats.count}/{config.squad.max}
                </td>
                <td className={table.td}>
                  {stats.overseas}/{config.maxOverseas ?? "∞"}
                </td>
                {ROLE_LIST.map((role) => (
                  <td key={role} className={table.td}>
                    {stats.roles[role]}
                  </td>
                ))}
                <td className={table.td}>
                  {meetsSquadMinimum && !rolesShort.length ? (
                    <span className="text-green-300">Met</span>
                  ) : (
                    <span className="text-yellow-200">
                      {!meetsSquadMinimum && `Squad below ${config.squad.min}. `}
                      {rolesShort.length > 0 && `Short: ${rolesShort.map((role) => ROLE_LABELS[role]).join(", ")}`}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summary.teams.map(({ team }) => (
          <TeamSquadCard key={team.id} state={state} team={team} />
        ))}
      </div>

      <div>
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-secondary">Purchase history ({sales.length})</div>
        <div className={table.wrap}>
          <table className={table.table}>
            <thead className={table.thead}>
              <tr>
                <th className={table.th}>#</th>
                <th className={table.th}>Player</th>
                <th className={table.th}>Role</th>
                <th className={table.th}>Base</th>
                <th className={table.th}>Team</th>
                <th className={table.th}>Price</th>
                <th className={table.th}>Time</th>
                {renderSaleAction && <th className={table.th}>Correct</th>}
              </tr>
            </thead>
            <tbody className={table.tbody}>
              {sales.map((sale, index) => (
                <tr key={sale.id}>
                  <td className={table.td}>{index + 1}</td>
                  <td className={table.td}>{sale.player?.name}</td>
                  <td className={table.td}>{ROLE_LABELS[sale.player?.role]}</td>
                  <td className={table.td}>{formatLakhs(sale.player?.basePrice)}</td>
                  <td className={table.td}>{sale.team?.name}</td>
                  <td className={table.td}>{formatLakhs(sale.price)}</td>
                  <td className={`${table.td} text-secondary`}>{sale.at ? new Date(sale.at).toLocaleTimeString() : "—"}</td>
                  {renderSaleAction && <td className={`${table.td} space-x-1 whitespace-nowrap`}>{renderSaleAction(sale)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
