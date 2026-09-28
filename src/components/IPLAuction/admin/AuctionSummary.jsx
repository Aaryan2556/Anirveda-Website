/**
 * Organiser summary: per-team spend, squad and role mix, the full purchase
 * history, and CSV/JSON downloads. All numbers come from engine selectors.
 */
import { ROLE_LABELS, ROLE_LIST } from "../../../lib/iplAuction/config";
import { getAuctionSummary, getRecentSales } from "../../../lib/iplAuction/engine";
import { buildPurchasesCsv, buildSummaryJson } from "../../../lib/iplAuction/io/auctionExport";
import { formatLakhs } from "../../../lib/iplAuction/money";
import { isFictional } from "../../../lib/iplAuction/playerFields";
import { Button } from "../DevPanels";

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
  const slug = `${state.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "auction"}-v${state.version}`;

  return (
    <div className="space-y-6 text-sm">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span>
          Total spent: <strong className="text-primary">{formatLakhs(summary.totalSpent)}</strong>
        </span>
        {Object.entries(summary.players.byStatus).map(([status, count]) => (
          <span key={status} className="text-white/70">
            {status}: {count}
          </span>
        ))}
        <span className="flex gap-2">
          <Button onClick={() => download(`${slug}-purchases.csv`, buildPurchasesCsv(state), "text/csv")}>
            Download purchases (CSV)
          </Button>
          <Button onClick={() => download(`${slug}-summary.json`, buildSummaryJson(state), "application/json")}>
            Download summary (JSON)
          </Button>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-white/50">
            <tr>
              <th className="py-1 pr-3">Team</th>
              <th className="pr-3">Spent</th>
              <th className="pr-3">Purse left</th>
              <th className="pr-3">Squad</th>
              <th className="pr-3">Overseas</th>
              {ROLE_LIST.map((role) => (
                <th key={role} className="pr-3">
                  {ROLE_LABELS[role]}
                </th>
              ))}
              <th className="pr-3">Minimums</th>
            </tr>
          </thead>
          <tbody>
            {summary.teams.map(({ team, stats, meetsSquadMinimum, rolesShort }) => (
              <tr key={team.id} className="border-t border-white/10">
                <td className="py-1 pr-3">{team.name}</td>
                <td className="pr-3">{formatLakhs(stats.spent)}</td>
                <td className="pr-3">{formatLakhs(stats.purse)}</td>
                <td className="pr-3">
                  {stats.count}/{config.squad.max}
                </td>
                <td className="pr-3">
                  {stats.overseas}/{config.maxOverseas ?? "∞"}
                </td>
                {ROLE_LIST.map((role) => (
                  <td key={role} className="pr-3">
                    {stats.roles[role]}
                  </td>
                ))}
                <td className="pr-3">
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
        {summary.teams.map(({ team, squad }) => (
          <div key={team.id} className="border border-white/10 p-3">
            <div className="mb-2 font-bold">{team.name}</div>
            {squad.length === 0 ? (
              <p className="text-xs text-white/50">No players yet.</p>
            ) : (
              <ul className="space-y-0.5 text-xs">
                {squad.map((player) => (
                  <li key={player.id} className="flex justify-between gap-2">
                    <span>
                      {player.name} · {ROLE_LABELS[player.role]}
                      {player.isOverseas ? " · OS" : ""}
                      {isFictional(player) && <span className="text-yellow-300/70"> (fictional)</span>}
                    </span>
                    <span>{formatLakhs(player.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div>
        <div className="mb-2 text-xs uppercase text-white/50">Purchase history ({sales.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-white/50">
              <tr>
                <th className="py-1 pr-3">#</th>
                <th className="pr-3">Player</th>
                <th className="pr-3">Role</th>
                <th className="pr-3">Base</th>
                <th className="pr-3">Team</th>
                <th className="pr-3">Price</th>
                <th className="pr-3">Time</th>
                {renderSaleAction && <th className="pr-3">Correct</th>}
              </tr>
            </thead>
            <tbody>
              {sales.map((sale, index) => (
                <tr key={sale.id} className="border-t border-white/10">
                  <td className="py-1 pr-3">{index + 1}</td>
                  <td className="pr-3">{sale.player?.name}</td>
                  <td className="pr-3">{ROLE_LABELS[sale.player?.role]}</td>
                  <td className="pr-3">{formatLakhs(sale.player?.basePrice)}</td>
                  <td className="pr-3">{sale.team?.name}</td>
                  <td className="pr-3">{formatLakhs(sale.price)}</td>
                  <td className="pr-3 text-white/60">{sale.at ? new Date(sale.at).toLocaleTimeString() : "—"}</td>
                  {renderSaleAction && <td className="space-x-1 whitespace-nowrap py-1 pr-3">{renderSaleAction(sale)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
