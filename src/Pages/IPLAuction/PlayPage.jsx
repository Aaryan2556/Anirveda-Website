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
import { getMaxBid, getTeamStats } from "../../lib/iplAuction/engine";
import { useAuction } from "../../lib/iplAuction/hooks/useAuction";
import { useTeamActor } from "../../lib/iplAuction/hooks/useAuctionActor";
import { formatLakhs } from "../../lib/iplAuction/money";
import { AUCTION_MODES, getAuctionMode } from "../../lib/iplAuction/repository";
import { Button, Page, PageHeader, Panel, SignInPanel, Spinner, Tabs } from "../../components/IPLAuction/ui/controls";
import { AuctionStatus, FictionalNotice, LocalModeNotice } from "../../components/IPLAuction/ui/auction";
import HistoryPanel from "../../components/IPLAuction/play/HistoryPanel";
import LivePanel from "../../components/IPLAuction/play/LivePanel";
import MarketPanel from "../../components/IPLAuction/play/MarketPanel";
import TeamsPanel from "../../components/IPLAuction/play/TeamsPanel";

const TABS = [
  { id: "live", label: "Live" },
  { id: "teams", label: "Teams" },
  { id: "market", label: "Market" },
  { id: "history", label: "History" },
];

/** The team's own numbers, pinned to the top of the screen. */
function PurseBar({ state, teamId }) {
  const stats = getTeamStats(state, teamId);
  const items = [
    { label: "Purse left", value: formatLakhs(stats.purse), accent: true },
    { label: "Max next", value: formatLakhs(getMaxBid(state, teamId)) },
    { label: "Squad", value: `${stats.count}/${state.config.squad.max}` },
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
  const needsLogin = kind !== "local" && !auth.user;

  let body;
  if (identity.status === "loading" || (loadingData && !needsLogin)) {
    body = <Spinner label="Loading your team…" />;
  } else if (needsLogin) {
    body = (
      <div className="mx-auto max-w-md">
        <SignInPanel title="Team login" auth={auth} note="Sign in with the team account the organisers gave you." />
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
        {tab === "market" && (
          <Panel title="Player market">
            <MarketPanel state={state} teamId={teamId} />
          </Panel>
        )}
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
    </Page>
  );
}
