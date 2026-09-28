/**
 * Team dashboard, teams view: every team's purse and composition, and each
 * team's squad (the viewer's own team first).
 */
import { ROLE_LABELS } from "../../../lib/iplAuction/config";
import { getTeamPurchaseHistory, getTeamStats, getTeamsInOrder } from "../../../lib/iplAuction/engine";
import { formatLakhs } from "../../../lib/iplAuction/money";
import { isFictional } from "../../../lib/iplAuction/playerFields";
import { Section, TeamsTable } from "../DevPanels";

export default function TeamsPanel({ state, teamId }) {
  const teams = getTeamsInOrder(state);
  const ordered = [...teams.filter((t) => t.id === teamId), ...teams.filter((t) => t.id !== teamId)];
  return (
    <div className="space-y-4">
      <Section title="All teams">
        <TeamsTable state={state} highlightTeamId={teamId} />
      </Section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ordered.map((team) => {
          const stats = getTeamStats(state, team.id);
          const squad = getTeamPurchaseHistory(state, team.id);
          return (
            <section key={team.id} className={`border p-3 ${team.id === teamId ? "border-primary" : "border-white/15"}`}>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="font-bold">
                  {team.name}
                  {team.id === teamId && <span className="ml-2 text-xs font-normal text-primary">(you)</span>}
                </h3>
                <span className="text-xs text-white/60">
                  {stats.count} players · {formatLakhs(stats.purse)} left
                </span>
              </div>
              {squad.length === 0 ? (
                <p className="text-xs text-white/50">No players yet.</p>
              ) : (
                <ul className="space-y-0.5 text-xs">
                  {squad.map((purchase) => (
                    <li key={purchase.id} className="flex justify-between gap-2">
                      <span>
                        {purchase.player.name} · {ROLE_LABELS[purchase.player.role]}
                        {purchase.player.isOverseas ? " · OS" : ""}
                        {isFictional(purchase.player) && <span className="text-yellow-300/70"> (fictional)</span>}
                      </span>
                      <span>{formatLakhs(purchase.price)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
