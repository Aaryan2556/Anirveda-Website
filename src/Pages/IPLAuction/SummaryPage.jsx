/**
 * /ipl-auction/summary — public, read-only auction summary: totals, the most
 * expensive buys and every team's final squad, spend and role mix. Works while
 * the auction is running too. The admin's version (with exports and sale
 * corrections) is the "Summary & export" tab of the admin console.
 */
import { getAuctionSummary, getTopSales } from "../../lib/iplAuction/engine";
import { ROLE_LABELS } from "../../lib/iplAuction/config";
import { useAuction } from "../../lib/iplAuction/hooks/useAuction";
import { formatLakhs } from "../../lib/iplAuction/money";
import { AUCTION_MODES, getAuctionMode } from "../../lib/iplAuction/repository";
import { Empty, Page, PageHeader, Panel, StatTile, table } from "../../components/IPLAuction/ui/controls";
import { AuctionStatus, FictionalNotice, TeamSquadCard } from "../../components/IPLAuction/ui/auction";

export default function SummaryPage() {
  const { mode, reason } = getAuctionMode();
  if (mode === AUCTION_MODES.DISABLED) {
    return (
      <Page>
        <PageHeader title="Auction summary" />
        <p className="text-secondary">IPL Auction is not available: {reason}</p>
      </Page>
    );
  }
  return <Summary />;
}

function Summary() {
  const { state } = useAuction();
  const summary = getAuctionSummary(state);
  const topSales = getTopSales(state, 5);
  const { byStatus, total } = summary.players;

  return (
    <Page>
      <PageHeader title="Auction summary">
        <AuctionStatus state={state} />
      </PageHeader>
      <FictionalNotice state={state} />
      <p className="mb-5 font-Abel text-lg text-secondary">{state.name}</p>

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Total spent" value={formatLakhs(summary.totalSpent)} accent />
        <StatTile label="Sold" value={`${byStatus.SOLD}/${total}`} />
        <StatTile label="Unsold" value={byStatus.UNSOLD} />
        <StatTile label="Still to come" value={byStatus.AVAILABLE + byStatus.ON_BLOCK} />
      </div>

      <Panel title="Most expensive buys" className="mb-6">
        {topSales.length === 0 ? (
          <Empty>No players sold yet.</Empty>
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead className={table.thead}>
                <tr>
                  <th className={table.th}>#</th>
                  <th className={table.th}>Player</th>
                  <th className={table.th}>Role</th>
                  <th className={table.th}>Team</th>
                  <th className={table.th}>Base</th>
                  <th className={table.th}>Price</th>
                </tr>
              </thead>
              <tbody className={table.tbody}>
                {topSales.map((sale, index) => (
                  <tr key={sale.id} className={index === 0 ? table.highlight : ""}>
                    <td className={`${table.td} font-Bebas text-xl text-secondary`}>{index + 1}</td>
                    <td className={`${table.td} text-white`}>{sale.player.name}</td>
                    <td className={`${table.td} text-secondary`}>{ROLE_LABELS[sale.player.role]}</td>
                    <td className={`${table.td} text-secondary`}>{sale.team.name}</td>
                    <td className={`${table.td} whitespace-nowrap text-secondary`}>{formatLakhs(sale.player.basePrice)}</td>
                    <td className={`${table.td} whitespace-nowrap font-bold text-primary`}>{formatLakhs(sale.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <h2 className="mb-3 font-Bebas text-3xl tracking-wide text-primary">Squads</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summary.teams.map(({ team, meetsSquadMinimum, rolesShort }) => (
          <TeamSquadCard
            key={team.id}
            state={state}
            team={team}
            footer={
              <p className={`mt-3 text-xs ${meetsSquadMinimum && !rolesShort.length ? "text-green-300" : "text-yellow-200"}`}>
                {meetsSquadMinimum && !rolesShort.length
                  ? "Squad and role minimums met."
                  : [
                    !meetsSquadMinimum && `Squad below the minimum of ${state.config.squad.min}.`,
                    rolesShort.length > 0 && `Short: ${rolesShort.map((role) => ROLE_LABELS[role]).join(", ")}.`,
                  ]
                    .filter(Boolean)
                    .join(" ")}
              </p>
            }
          />
        ))}
      </div>
    </Page>
  );
}
