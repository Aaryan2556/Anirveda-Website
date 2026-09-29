/**
 * /ipl-auction/play?team=<teamId> — functional team dashboard. Final design is Phase 8.
 *
 * View-only: bidding happens in the room and the admin records each sale. This
 * page updates as soon as the admin assigns a player (purse, squad, sales).
 * It never imports admin components and never sends commands.
 *
 * There is no team login yet: the team comes from the URL (useTeamActor).
 * Real identities arrive in Phase 7.
 */
import { useSearchParams } from "react-router-dom";
import { getTeamsInOrder } from "../../lib/iplAuction/engine";
import { useAuction } from "../../lib/iplAuction/hooks/useAuction";
import { useTeamActor } from "../../lib/iplAuction/hooks/useAuctionActor";
import { AUCTION_MODES, getAuctionMode } from "../../lib/iplAuction/repository";
import { AuctionHeader, Button, DevBanner, Section } from "../../components/IPLAuction/DevPanels";
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
    <Section title="Choose your team">
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
  const { mode, reason } = getAuctionMode();
  if (mode === AUCTION_MODES.DISABLED) {
    return <div className="min-h-screen bg-tertiary p-6 font-Lato text-white">IPL Auction is not available: {reason}</div>;
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
    <div className="min-h-screen bg-tertiary px-3 py-4 font-Lato text-white sm:px-4 sm:py-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <h1 className="font-Bebas text-3xl tracking-wide sm:text-4xl">
          IPL Auction · {team ? team.name : "Team dashboard"} (dev)
        </h1>
        <DevBanner kind={kind} />
        <AuctionHeader state={state} />

        {!team ? (
          <>
            {teamId && <p className="text-sm text-red-400">Unknown team &quot;{teamId}&quot;.</p>}
            <TeamPicker state={state} onPick={setTeamId} />
          </>
        ) : (
          <>
            <nav className="flex gap-1 overflow-x-auto border-b border-white/15" aria-label="Dashboard sections">
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-current={tab === id ? "page" : undefined}
                  onClick={() => selectTab(id)}
                  className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm ${
                    tab === id ? "border-primary text-white" : "border-transparent text-white/60 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            {tab === "live" && <LivePanel state={state} teamId={teamId} />}
            {tab === "market" && (
              <Section title="Player market">
                <MarketPanel state={state} teamId={teamId} />
              </Section>
            )}
            {tab === "teams" && <TeamsPanel state={state} teamId={teamId} />}
            {tab === "history" && <HistoryPanel state={state} teamId={teamId} />}

            <div className="text-xs text-white/50">
              Switch team:{" "}
              {getTeamsInOrder(state).map((t) => (
                <button key={t.id} type="button" className="mr-3 underline" onClick={() => setTeamId(t.id)}>
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
