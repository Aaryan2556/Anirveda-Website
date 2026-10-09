/**
 * /ipl-auction/play — team dashboard (phone-first).
 *
 * View-only: bidding happens in the room and the admin records each sale. This
 * page updates as soon as the admin assigns a player (purse, squad, sales).
 * It never imports admin components and never sends commands.
 *
 * One team only: a team signs in with its own account and sees only its own
 * team (useTeamActor reads the team from the account's label; there is no way
 * to switch team and no other team's purse is shown). In local development
 * mode there are no logins and the team comes from `?team=`.
 */
import { useSearchParams } from "react-router-dom";
import { ROLE_LABELS } from "../../lib/iplAuction/config";
import { getMaxBid, getTeamStats, getTeamsInOrder } from "../../lib/iplAuction/engine";
import { useAuction } from "../../lib/iplAuction/hooks/useAuction";
import { useTeamActor } from "../../lib/iplAuction/hooks/useAuctionActor";
import { formatLakhs } from "../../lib/iplAuction/money";
import { AUCTION_MODES, getAuctionMode } from "../../lib/iplAuction/repository";
import { Button, Page, PageHeader, Panel, SignInPanel, Spinner, Tabs } from "../../components/IPLAuction/ui/controls";
import {
  AuctionStatus,
  FictionalNotice,
  LocalModeNotice,
  SoldBanner,
  useSoldAnnouncement,
} from "../../components/IPLAuction/ui/auction";
import HistoryPanel from "../../components/IPLAuction/play/HistoryPanel";
import LivePanel from "../../components/IPLAuction/play/LivePanel";
import TeamsPanel from "../../components/IPLAuction/play/TeamsPanel";

const TABS = [
  { id: "live", label: "Live" },
  { id: "teams", label: "Teams" },
  { id: "leaderboard", label: "Leaderboard " },
  { id: "history", label: "History" },
];

/** Real-time Auction Leaderboard: Top 10 Most Expensive Players & Franchise Spend Rankings */
function LeaderboardPanel({ state }) {
  const maxSquad = state.config?.squad?.max || 15;

  const expensivePlayers = [...(state.purchases || [])]
    .map((p) => ({
      ...p,
      player: state.players[p.playerId],
      team: state.teams[p.teamId],
    }))
    .filter((p) => p.player && p.team)
    .sort((a, b) => b.price - a.price)
    .slice(0, 10);

  const topSpenders = getTeamsInOrder(state)
    .map((team) => ({
      team,
      stats: getTeamStats(state, team.id),
    }))
    .sort((a, b) => b.stats.spent - a.stats.spent);

  const getRankBadgeStyle = (rank) => {
    if (rank === 1) return "border-gold/60 bg-gold/20 text-gold font-bold shadow-goldGlow";
    if (rank === 2) return "border-slate-300/60 bg-slate-300/15 text-slate-200 font-bold";
    if (rank === 3) return "border-amber-700/60 bg-amber-700/15 text-amber-400 font-bold";
    return "border-slate-800 bg-obsidian-900 text-slate-400 font-medium";
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return "🏆 1";
    if (rank === 2) return "🥈 2";
    if (rank === 3) return "🥉 3";
    return `#${rank}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left Column: Top 10 Most Expensive Players */}
        <Panel title="🏆 Most Expensive Players">
          {expensivePlayers.length === 0 ? (
            <p className="py-8 text-center font-mono text-xs text-slate-500">No players sold yet.</p>
          ) : (
            <ol className="divide-y divide-slate-800/80 text-sm">
              {expensivePlayers.map((item, index) => {
                const rank = index + 1;
                return (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 transition hover:bg-slate-900/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`flex h-7 min-w-[2.25rem] shrink-0 items-center justify-center rounded-lg border px-1 font-mono text-xs ${getRankBadgeStyle(rank)}`}>
                        {getRankIcon(rank)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-Bebas text-lg font-bold uppercase tracking-tight text-slate-100 sm:text-xl">
                            {item.player.name}
                          </span>
                          <span className="shrink-0 rounded border border-slate-700/60 bg-slate-900/80 px-1.5 py-0.5 font-mono text-[10px] uppercase text-slate-300">
                            {ROLE_LABELS[item.player.role] || item.player.role}
                          </span>
                        </div>
                        <p className="truncate font-mono text-xs text-slate-400">
                          Franchise: <strong className="text-primary">{item.team.name}</strong> ({item.team.shortName})
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-base font-bold text-gold drop-shadow-[0_0_12px_rgba(212,175,55,0.25)] sm:text-lg">
                        {formatLakhs(item.price)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>

        {/* Right Column: Teams Spending Leaderboard */}
        <Panel title="💰 Franchise Spend Leaderboard">
          <ol className="divide-y divide-slate-800/80 text-sm">
            {topSpenders.map(({ team, stats }, index) => {
              const rank = index + 1;
              return (
                <li key={team.id} className="flex items-center justify-between gap-3 py-2.5 transition hover:bg-slate-900/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`flex h-7 min-w-[2.25rem] shrink-0 items-center justify-center rounded-lg border px-1 font-mono text-xs ${getRankBadgeStyle(rank)}`}>
                      {getRankIcon(rank)}
                    </span>
                    <div className="min-w-0">
                      <h4 className="truncate font-Bebas text-lg font-bold uppercase tracking-tight text-slate-100 sm:text-xl">
                        {team.name}
                      </h4>
                      <p className="font-mono text-xs text-slate-400">
                        Purse Left: <span className="text-gold font-bold">{formatLakhs(stats.purse)}</span> · Squad: <span className="text-slate-200">{stats.count}/{maxSquad}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">Total Spent</span>
                    <span className="font-mono text-base font-bold text-primary sm:text-lg">
                      {formatLakhs(stats.spent)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>
    </div>
  );
}

/** The team's own numbers, pinned to the top of the screen. */
function PurseBar({ state, teamId }) {
  const stats = getTeamStats(state, teamId);
  const maxSquad = state.config?.squad?.max || 15;
  const items = [
    { label: "Purse left", value: formatLakhs(stats.purse), accent: true },
    { label: "Max next", value: formatLakhs(getMaxBid(state, teamId)) },
    { label: "Squad", value: `${stats.count}/${maxSquad}` },
  ];
  return (
    <div className="sticky top-0 z-10 -mx-4 mb-5 border-b border-gold/20 bg-obsidian-900/90 px-4 py-2.5 backdrop-blur-2xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <dl className="mx-auto grid max-w-7xl grid-cols-3 gap-2">
        {items.map(({ label, value, accent }) => (
          <div key={label}>
            <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
            <dd className={`font-mono text-lg font-bold leading-tight sm:text-2xl ${accent ? "text-gold" : "text-slate-100"}`}>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function PlayPage() {
  const { mode, reason } = getAuctionMode();
  if (mode === AUCTION_MODES.DISABLED) {
    return (
      <Page>
        <PageHeader title="Team dashboard" />
        <p className="text-slate-400">IPL Auction is not available: {reason}</p>
      </Page>
    );
  }
  return <TeamDashboard />;
}

function TeamDashboard() {
  const { state, kind } = useAuction();
  const identity = useTeamActor(state);
  const { teamId, auth } = identity;
  const [params, setParams] = useSearchParams();
  const team = teamId ? state.teams[teamId] : null;
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "live";
  const selectTab = (id) => setParams((current) => ({ ...Object.fromEntries(current), tab: id }));
  const loadingData = state.teamOrder.length === 0; // the database read is still in flight
  // In appwrite mode a team must be signed in via DB auth before we show the dashboard.
  const needsLogin = kind !== "local" && !identity.isAdmin && !identity.teamId;
  const sold = useSoldAnnouncement(state);
  const mySold = sold && sold.teamId === teamId ? sold : null;

  let body;
  if (identity.status === "loading" || (loadingData && !needsLogin)) {
    body = <Spinner label="Loading your team…" />;
  } else if (needsLogin) {
    body = (
      <div className="mx-auto max-w-md">
        <SignInPanel title="Team login" auth={auth} note="Sign in with the team account the organisers gave you." useUsername={true} />
      </div>
    );
  } else if (!team) {
    body = (
      <div className="mx-auto max-w-md">
        <Panel title="No team">
          <p className="mb-4 text-sm text-slate-400" role="alert">
            {kind === "local"
              ? "Local development mode: open this page with ?team=<team id>."
              : identity.reason ?? "This account is not linked to a team in this auction."}
          </p>
          {auth.user && <Button onClick={auth.signOut}>Sign out</Button>}
        </Panel>
      </div>
    );
  } else {
    body = (
      <>
        <Tabs tabs={TABS} current={tab} onSelect={selectTab} label="Dashboard sections" />
        {tab === "live" && <LivePanel state={state} teamId={teamId} />}
        {tab === "leaderboard" && <LeaderboardPanel state={state} />}
        {tab === "teams" && <TeamsPanel state={state} teamId={teamId} />}
        {tab === "history" && <HistoryPanel state={state} teamId={teamId} />}
      </>
    );
  }

  return (
    <Page>
      <PageHeader title={team ? team.name : "Team dashboard"}>
        <AuctionStatus state={state} />
        {auth.user && (
          <Button size="sm" onClick={auth.signOut}>
            Sign out
          </Button>
        )}
      </PageHeader>
      {team && <PurseBar state={state} teamId={teamId} />}
      <LocalModeNotice kind={kind} />
      {team && <FictionalNotice state={state} />}
      {body}
      <SoldBanner sale={mySold} />
    </Page>
  );
}
