/**
 * /ipl-auction/play?team=<teamId> — functional team dashboard (local only). Final design is Phase 8.
 *
 * View-only: bidding happens in the room and the admin records each sale. This
 * page updates as soon as the admin assigns a player (purse, squad, sales).
 *
 * There is no authentication yet: the team is chosen from the URL. Real identity
 * arrives with the Appwrite phases; teams cannot send any command either way.
 */
import { useSearchParams } from "react-router-dom";
import { ROLE_LABELS, ROLE_LIST } from "../../lib/iplAuction/config";
import {
  getMaxBid,
  getRecentSales,
  getSquad,
  getTeamStats,
  getTeamsInOrder,
  validateSale,
} from "../../lib/iplAuction/engine";
import { formatLakhs } from "../../lib/iplAuction/money";
import { useAuction } from "../../lib/iplAuction/hooks/useAuction";
import {
  ActivityLog,
  AuctionHeader,
  Button,
  CurrentLot,
  DevBanner,
  RecentSales,
  Section,
  SquadList,
  TeamsTable,
  UpcomingPlayers,
} from "../../components/IPLAuction/DevPanels";

function TeamPicker({ state, onPick }) {
  return (
    <Section title="Choose your team (one tab per team)">
      <div className="flex flex-wrap gap-2">
        {getTeamsInOrder(state).map((team) => (
          <Button key={team.id} onClick={() => onPick(team.id)}>
            {team.name}
          </Button>
        ))}
      </div>
    </Section>
  );
}

export default function PlayPage() {
  const { state, kind } = useAuction();
  const [params, setParams] = useSearchParams();
  const teamId = params.get("team");
  const team = teamId ? state.teams[teamId] : null;
  const pickTeam = (id) => setParams({ team: id });

  return (
    <div className="min-h-screen bg-tertiary px-4 py-6 font-Lato text-white">
      <div className="mx-auto max-w-6xl space-y-4">
        <h1 className="font-Bebas text-4xl tracking-wide">
          IPL Auction · {team ? team.name : "Team dashboard"} (dev)
        </h1>
        <DevBanner kind={kind} />
        <AuctionHeader state={state} />

        {!team ? (
          <>
            {teamId && <p className="text-sm text-red-400">Unknown team &quot;{teamId}&quot;.</p>}
            <TeamPicker state={state} onPick={pickTeam} />
          </>
        ) : (
          <>
            <LatestSale state={state} teamId={teamId} />

            <Section title="On the block">
              <CurrentLot state={state} />
              {state.lot && <BuyingPower state={state} teamId={teamId} />}
            </Section>

            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="My team">
                <MyTeam state={state} teamId={teamId} />
              </Section>
              <Section title="Up next">
                <UpcomingPlayers state={state} />
              </Section>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="Recent sales">
                <RecentSales state={state} highlightTeamId={teamId} />
              </Section>
              <Section title="Activity">
                <ActivityLog state={state} />
              </Section>
            </div>

            <Section title="All teams">
              <TeamsTable state={state} highlightTeamId={teamId} />
            </Section>

            <div className="text-xs text-white/50">
              Switch team:{" "}
              {getTeamsInOrder(state).map((t) => (
                <button key={t.id} type="button" className="mr-3 underline" onClick={() => pickTeam(t.id)}>
                  {t.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Announces the most recent sale, and calls it out when it was this team's. */
function LatestSale({ state, teamId }) {
  const [sale] = getRecentSales(state, 1);
  if (!sale) return null;
  const mine = sale.teamId === teamId;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`border p-3 text-sm ${mine ? "border-primary bg-primary/15" : "border-white/15"}`}
    >
      {mine ? "You bought " : "Last sale: "}
      <strong>{sale.player.name}</strong>
      {mine ? "" : ` to ${sale.team.name}`} for <strong>{formatLakhs(sale.price)}</strong>.
    </div>
  );
}

/** Whether this team can buy the player on the block, and how high it can go (from the engine's rules). */
function BuyingPower({ state, teamId }) {
  const player = state.players[state.lot.playerId];
  const blocked = validateSale(state, teamId, player, player.basePrice);
  return (
    <div className="mt-4 border-t border-white/10 pt-4 text-sm">
      {blocked ? (
        <span className="text-red-300">You can&apos;t buy this player: {blocked.message}</span>
      ) : (
        <span>
          You can pay up to <strong className="text-primary">{formatLakhs(getMaxBid(state, teamId))}</strong> for
          this player.
        </span>
      )}
    </div>
  );
}

function MyTeam({ state, teamId }) {
  const { config } = state;
  const stats = getTeamStats(state, teamId);
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <span>
          Purse left: <strong className="text-primary">{formatLakhs(stats.purse)}</strong>
        </span>
        <span>Spent: {formatLakhs(stats.spent)}</span>
        <span>Max price next: {formatLakhs(getMaxBid(state, teamId))}</span>
        <span>
          Squad: {stats.count}/{config.squad.max} (min {config.squad.min})
        </span>
        <span>
          Overseas: {stats.overseas}/{config.maxOverseas ?? "∞"}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/70">
        {ROLE_LIST.map((role) => (
          <span key={role}>
            {ROLE_LABELS[role]}: {stats.roles[role]}/{config.roleLimits[role].max ?? "∞"}
            {config.roleLimits[role].min > 0 ? ` (min ${config.roleLimits[role].min})` : ""}
          </span>
        ))}
      </div>
      <SquadList state={state} teamId={teamId} squad={getSquad(state, teamId)} />
    </div>
  );
}
