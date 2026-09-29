/**
 * /ipl-auction/play?team=<teamId> — team dashboard (phone-first).
 *
 * View-only: bidding happens in the room and the admin records each sale. This
 * page updates as soon as the admin assigns a player (purse, squad, sales).
 * It never imports admin components and never sends commands.
 *
 * One team per link: the team comes from the URL (useTeamActor) and the page
 * offers no way to switch team or see other teams' purses. The admin sends each
 * team its own link. Teams cannot write, so no team login is needed (Phase 7).
 */
import { useSearchParams } from "react-router-dom";
import { getMaxBid, getTeamStats } from "../../lib/iplAuction/engine";
import { useAuction } from "../../lib/iplAuction/hooks/useAuction";
import { useTeamActor } from "../../lib/iplAuction/hooks/useAuctionActor";
import { formatLakhs } from "../../lib/iplAuction/money";
import { AUCTION_MODES, getAuctionMode } from "../../lib/iplAuction/repository";
import { Page, PageHeader, Panel, Spinner, Tabs } from "../../components/IPLAuction/ui/controls";
import { AuctionStatus, FictionalNotice, LocalModeNotice } from "../../components/IPLAuction/ui/auction";
import HistoryPanel from "../../components/IPLAuction/play/HistoryPanel";
import LivePanel from "../../components/IPLAuction/play/LivePanel";
import MarketPanel from "../../components/IPLAuction/play/MarketPanel";

const TABS = [
  { id: "live", label: "Live" },
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
    <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-secondary/20 bg-black/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <dl className="mx-auto grid max-w-7xl grid-cols-3 gap-2">
        {items.map(({ label, value, accent }) => (
          <div key={label}>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-secondary">{label}</dt>
            <dd className={`font-Bebas text-2xl leading-tight tracking-wide sm:text-3xl ${accent ? "text-primary" : "text-white"}`}>
              {value}
            </dd>
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
        <p className="text-secondary">IPL Auction is not available: {reason}</p>
      </Page>
    );
  }
  return <TeamDashboard />;
}

function TeamDashboard() {
  const { state, kind } = useAuction();
  const { teamId } = useTeamActor();
  const [params, setParams] = useSearchParams();
  const team = teamId ? state.teams[teamId] : null;
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "live";
  const selectTab = (id) => setParams((current) => ({ ...Object.fromEntries(current), tab: id }));

  return (
    <Page>
      <PageHeader title={team ? team.name : "Team dashboard"}>
        <AuctionStatus state={state} />
      </PageHeader>
      {team && <PurseBar state={state} teamId={teamId} />}
      <LocalModeNotice kind={kind} />
      <FictionalNotice state={state} />

      {!team && teamId && state.teamOrder.length === 0 ? (
        // Nothing loaded yet (the database read is still in flight).
        <Spinner label="Loading your team…" />
      ) : !team ? (
        <Panel title={teamId ? "Team not found" : "Team link needed"}>
          <p className="text-sm text-secondary" role={teamId ? "alert" : undefined}>
            Open the team link the organisers sent you. Each link shows one team&apos;s dashboard.
          </p>
        </Panel>
      ) : (
        <>
          <Tabs tabs={TABS} current={tab} onSelect={selectTab} label="Dashboard sections" />

          {tab === "live" && <LivePanel state={state} teamId={teamId} />}
          {tab === "market" && (
            <Panel title="Player market">
              <MarketPanel state={state} teamId={teamId} />
            </Panel>
          )}
          {tab === "history" && <HistoryPanel state={state} teamId={teamId} />}
        </>
      )}
    </Page>
  );
}
