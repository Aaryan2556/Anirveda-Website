/**
 * Team dashboard, history view: every lot so far with its outcome, and the
 * full activity log.
 */
import { ROLE_LABELS } from "../../../lib/iplAuction/config";
import { getLotHistory } from "../../../lib/iplAuction/engine";
import { formatLakhs } from "../../../lib/iplAuction/money";
import { Panel, table } from "../ui/controls";
import { ActivityLog } from "../ui/auction";

const RESULT_STYLE = {
  SOLD: "text-neon-emerald",
  UNSOLD: "text-slate-400",
  WITHDRAWN: "text-red-300",
  OPEN: "text-primary",
};

export default function HistoryPanel({ state, teamId }) {
  const lots = getLotHistory(state).reverse();
  return (
    <div className="space-y-4">
      <Panel title={`Lots (${lots.length})`}>
        {lots.length === 0 ? (
          <p className="text-sm text-slate-400">No player has been up yet.</p>
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead className={table.thead}>
                <tr>
                  <th className={table.th}>#</th>
                  <th className={table.th}>Player</th>
                  <th className={table.th}>Role</th>
                  <th className={table.th}>Base</th>
                  <th className={table.th}>Result</th>
                  <th className={table.th}>Team</th>
                  <th className={table.th}>Price</th>
                  <th className={table.th}>Time</th>
                </tr>
              </thead>
              <tbody className={table.tbody}>
                {lots.map((lot, index) => (
                  <tr
                    key={`${lot.playerId}-${lot.openedAt}-${index}`}
                    className={`${lot.teamId === teamId && !lot.cancelled ? "bg-primary/10" : ""}`}
                  >
                    <td className={`${table.td} text-slate-500`}>{lots.length - index}</td>
                    <td className={table.td}>{lot.player?.name ?? "(removed player)"}</td>
                    <td className={table.td}>{ROLE_LABELS[lot.player?.role] ?? "—"}</td>
                    <td className={`${table.td} whitespace-nowrap`}>{formatLakhs(lot.player?.basePrice)}</td>
                    <td className={`${table.td} whitespace-nowrap ${RESULT_STYLE[lot.result]}`}>
                      {lot.result === "OPEN" ? "ON THE BLOCK" : lot.result}
                      {lot.cancelled && <span className="ml-1 text-amber-300">(sale cancelled)</span>}
                    </td>
                    <td className={table.td}>{lot.team?.name ?? "—"}</td>
                    <td className={`${table.td} whitespace-nowrap`}>{lot.price == null ? "—" : formatLakhs(lot.price)}</td>
                    <td className={`${table.td} whitespace-nowrap text-slate-400`}>
                      {lot.openedAt ? new Date(lot.openedAt).toLocaleTimeString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Panel title="Activity">
        <ActivityLog state={state} limit={200} />
      </Panel>
    </div>
  );
}
