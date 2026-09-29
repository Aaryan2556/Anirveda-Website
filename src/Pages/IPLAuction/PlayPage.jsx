/**
 * /ipl-auction/play?team=<teamId> — team dashboard (phone-first).
 *
 * View-only: bidding happens in the room and the admin records each sale. This
 * page updates as soon as the admin assigns a player (purse, squad, sales).
 * It never imports admin components and never sends commands.
 *
 * The team comes from the URL (useTeamActor). All auction data is public and
 * teams cannot write, so no team login is needed (Phase 7).
 */
import { useSearchParams } from "react-router-dom";
import { getMaxBid, getTeamStats, getTeamsInOrder } from "../../lib/iplAuction/engine";
import { useAuction } from "../../lib/iplAuction/hooks/useAuction";
import { useTeamActor } from "../../lib/iplAuction/hooks/useAuctionActor";
import { formatLakhs } from "../../lib/iplAuction/money";
import { AUCTION_MODES, getAuctionMode } from "../../lib/iplAuction/repository";
import { Button, Page, PageHeader, Panel, Tabs } from "../../components/IPLAuction/ui/controls";
import { AuctionStatus, FictionalNotice, LocalModeNotice } from "../../components/IPLAuction/ui/auction";
import HistoryPanel from "../../components/IPLAuction/play/HistoryPanel";
import LivePanel from "../../components/IPLAuction/play/LivePanel";
import MarketPanel from "../../components/IPLAuction/play/MarketPanel";
import TeamsPanel from "../../components/IPLAuction/play/TeamsPanel";

const TABS = [
  { id: "live", label: "Live" },
  { id: "market", label: "Market" },
  { id: "teams", label: "Teams" },
  { id: "history", label: "History" },
];

function TeamPicker({ state, onPick }) {
  return (
    <Panel title="Choose your team">
      <div className="flex flex-wrap gap-2">
        {getTeamsInOrder(state).map((team) => (
          <Button key={team.id} variant="outline" size="lg" onClick={() => onPick(team.id)}>
            {team.name}
          </Button>
        ))}
      </div>
    </Panel>
  );
}

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
  const { teamId, setTeamId } = useTeamActor();
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

      {!team ? (
        <>
          {teamId && (
            <p className="mb-3 text-sm text-red-300" role="alert">
              Unknown team &quot;{teamId}&quot;.
            </p>
          )}
          <TeamPicker state={state} onPick={setTeamId} />
        </>
      ) : (
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

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-secondary/20 pt-4 text-xs text-secondary">
            <span className="uppercase tracking-wider">Switch team:</span>
            {getTeamsInOrder(state).map((t) => (
              <button
                key={t.id}
                type="button"
                className={`underline-offset-2 hover:text-primary hover:underline ${t.id === teamId ? "text-primary" : ""}`}
                onClick={() => setTeamId(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
