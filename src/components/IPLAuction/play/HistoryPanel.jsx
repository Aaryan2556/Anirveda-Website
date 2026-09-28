/**
 * Team dashboard, history view: every lot so far with its outcome, and the
 * full activity log.
 */
import { ROLE_LABELS } from "../../../lib/iplAuction/config";
import { getLotHistory } from "../../../lib/iplAuction/engine";
import { formatLakhs } from "../../../lib/iplAuction/money";
import { ActivityLog, Section } from "../DevPanels";

const RESULT_STYLE = {
  SOLD: "text-green-300",
  UNSOLD: "text-white/60",
  WITHDRAWN: "text-red-300",
  OPEN: "text-primary",
};

export default function HistoryPanel({ state, teamId }) {
  const lots = getLotHistory(state).reverse();
  return (
    <div className="space-y-4">
      <Section title={`Lots (${lots.length})`}>
        {lots.length === 0 ? (
          <p className="text-sm text-white/60">No player has been up yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-white/50">
                <tr>
                  <th className="py-1 pr-3">#</th>
                  <th className="pr-3">Player</th>
                  <th className="pr-3">Role</th>
                  <th className="pr-3">Base</th>
                  <th className="pr-3">Result</th>
                  <th className="pr-3">Team</th>
                  <th className="pr-3">Price</th>
                  <th className="pr-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((lot, index) => (
                  <tr
                    key={`${lot.playerId}-${lot.openedAt}-${index}`}
                    className={`border-t border-white/10 ${lot.teamId === teamId && !lot.cancelled ? "bg-primary/15" : ""}`}
                  >
                    <td className="py-1 pr-3 text-white/50">{lots.length - index}</td>
                    <td className="pr-3">{lot.player?.name ?? "(removed player)"}</td>
                    <td className="pr-3">{ROLE_LABELS[lot.player?.role] ?? "—"}</td>
                    <td className="whitespace-nowrap pr-3">{formatLakhs(lot.player?.basePrice)}</td>
                    <td className={`pr-3 ${RESULT_STYLE[lot.result]}`}>
                      {lot.result === "OPEN" ? "ON THE BLOCK" : lot.result}
                      {lot.cancelled && <span className="ml-1 text-yellow-200">(sale cancelled)</span>}
                    </td>
                    <td className="pr-3">{lot.team?.name ?? "—"}</td>
                    <td className="whitespace-nowrap pr-3">{lot.price == null ? "—" : formatLakhs(lot.price)}</td>
                    <td className="whitespace-nowrap pr-3 text-white/60">
                      {lot.openedAt ? new Date(lot.openedAt).toLocaleTimeString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
      <Section title="Activity">
        <ActivityLog state={state} limit={200} />
      </Section>
    </div>
  );
}
