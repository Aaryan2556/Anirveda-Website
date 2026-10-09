import { getTeamsInOrder } from "../../../lib/iplAuction/engine";
import { FranchiseSummaryCard } from "../ui/auction";

export default function TeamsPanel({ state, teamId }) {
  const teams = getTeamsInOrder(state);
  const ordered = [...teams.filter((t) => t.id === teamId), ...teams.filter((t) => t.id !== teamId)];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {ordered.map((team) => (
        <FranchiseSummaryCard key={team.id} state={state} team={team} mine={team.id === teamId} />
      ))}
    </div>
  );
}
