/**
 * Team dashboard, teams view: every team's purse and composition, and each
 * team's squad (the viewer's own team first).
 */
import { getTeamsInOrder } from "../../../lib/iplAuction/engine";
import { Panel } from "../ui/controls";
import { TeamSquadCard, TeamsTable } from "../ui/auction";

export default function TeamsPanel({ state, teamId }) {
  const teams = getTeamsInOrder(state);
  const ordered = [...teams.filter((t) => t.id === teamId), ...teams.filter((t) => t.id !== teamId)];
  return (
    <div className="space-y-4">
      <Panel title="All teams">
        <TeamsTable state={state} highlightTeamId={teamId} />
      </Panel>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ordered.map((team) => (
          <TeamSquadCard key={team.id} state={state} team={team} mine={team.id === teamId} />
        ))}
      </div>
    </div>
  );
}
