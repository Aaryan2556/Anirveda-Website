/**
 * /ipl-auction/sabka_malik — the admin console.
 * All business rules live in src/lib/iplAuction; this page only wires them up.
 *
 * Flow: set up rules, teams and players; start; players come up in sequence,
 * teams bid in the room, and the admin records each result here — SOLD to a
 * team at the hammer price, or UNSOLD. Summary and exports at the end.
 * The big screen (/ipl-auction/sabka_malik/screen) and the summary are admin-only too.
 */
import { Suspense, lazy } from "react";
import { useSearchParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuction } from "../../lib/iplAuction/hooks/useAuction";
import { useAuctionCommand } from "../../lib/iplAuction/hooks/useAuctionCommand";
import { AUCTION_STATUS, COMMANDS } from "../../lib/iplAuction/engine";
import { Button, Empty, Page, PageHeader, Panel, Tabs, Spinner } from "../../components/IPLAuction/ui/controls";
import {
  ActivityLog,
  AuctionStatus,
  FictionalNotice,
  FranchiseSummaryCard,
  LocalModeNotice,
  RecentSales,
  TeamsTable,
} from "../../components/IPLAuction/ui/auction";
import { getTeamsInOrder } from "../../lib/iplAuction/engine";
import { AuctionControls, OnTheBlock } from "../../components/IPLAuction/admin/RunAuction";
import RequireAdmin from "../../components/IPLAuction/admin/RequireAdmin";
import { ConfirmButton } from "../../components/IPLAuction/admin/fields";

const AuctionSummary = lazy(() => import("../../components/IPLAuction/admin/AuctionSummary"));
const PlayerEditor = lazy(() => import("../../components/IPLAuction/admin/PlayerEditor"));
const PlayerImport = lazy(() => import("../../components/IPLAuction/admin/PlayerImport"));
const PlayerSequence = lazy(() => import("../../components/IPLAuction/admin/PlayerSequence"));
const RulesForm = lazy(() => import("../../components/IPLAuction/admin/RulesForm"));
const TeamManager = lazy(() => import("../../components/IPLAuction/admin/TeamManager"));
const TeamCredentials = lazy(() => import("../../components/IPLAuction/admin/TeamCredentials"));

const TABS = [
  { id: "run", label: "Run auction" },
  { id: "players", label: "Players" },
  { id: "teams", label: "Teams" },
  { id: "rules", label: "Rules" },
  { id: "summary", label: "Summary & export" },
];

/** Admins only: Appwrite mode requires a signed-in user with the admin label; local mode needs no login. */
export default function AdminPage() {
  return <RequireAdmin title="Admin console">{(identity) => <AdminConsole identity={identity} />}</RequireAdmin>;
}

function AdminConsole({ identity }) {
  const { state, reset, kind } = useAuction();
  // A refused write may mean the session expired: re-check it (back to sign-in if so).
  const { send, pending } = useAuctionCommand(identity.actor, { onUnauthorized: identity.auth.refresh });
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "run";
  const selectTab = (id) => setParams((current) => ({ ...Object.fromEntries(current), tab: id }));
  const isCompleted = state.status === AUCTION_STATUS.COMPLETED;
  const { user, signOut } = identity.auth;
  const lotPlayer = state.lot ? state.players[state.lot.playerId] : null;

  /** Correcting an earlier sale refunds the team and clears the undo history, so it asks first. */
  const cancelSaleAction = (playerId) => (
    <ConfirmButton
      label="Cancel sale"
      confirmLabel="Confirm cancel (clears undo)"
      disabled={isCompleted || pending}
      onConfirm={() => send({ type: COMMANDS.CANCEL_SALE, playerId }, { success: "Sale cancelled and purse refunded." })}
    />
  );

  return (
    <Page>
      <Toaster position="top-right" />
      <PageHeader title="Admin console">
        <AuctionStatus state={state} />
        <a
          href="/ipl-auction/sabka_malik/screen"
          target="_blank"
          rel="noreferrer"
          className="rounded-3xl border border-primary px-3 py-1 text-xs text-primary transition hover:bg-primary hover:text-slate-100"
        >
          Open big screen
        </a>
        {user && (
          <span className="flex items-center gap-2 text-xs text-slate-400">
            {user.email}
            <Button size="sm" onClick={signOut}>
              Sign out
            </Button>
          </span>
        )}
      </PageHeader>
      <LocalModeNotice kind={kind} />
      <FictionalNotice state={state} />
      <p className="mb-4 font-sans text-lg text-slate-400">{state.name}</p>

      <Tabs tabs={TABS} current={tab} onSelect={selectTab} label="Admin sections" trailing={pending ? "Saving…" : null} />

      {lotPlayer && tab !== "run" && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm">
          <span>
            <span className="text-slate-400">On the block: </span>
            <strong className="text-slate-100">{lotPlayer.name}</strong>
          </span>
          <Button size="sm" variant="outline" onClick={() => selectTab("run")}>
            Go to hammer
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {tab === "run" && (
          <>
            <OnTheBlock state={state} send={send} actor={identity.actor} pending={pending} />
            <AuctionControls state={state} send={send} pending={pending} reset={reset} />
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Recent sales">
                <RecentSales state={state} renderAction={(sale) => cancelSaleAction(sale.playerId)} />
              </Panel>
              <Panel title="Activity">
                <ActivityLog state={state} />
              </Panel>
            </div>
            <Panel title="Franchise Summary">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {getTeamsInOrder(state).map((team) => (
                  <FranchiseSummaryCard key={team.id} state={state} team={team} />
                ))}
              </div>
            </Panel>
          </>
        )}

        {tab === "players" && (
          <Suspense fallback={<Spinner label="Loading players section..." />}>
            <Panel title="Player sequence">
              <PlayerSequence state={state} send={send} pending={pending} renderSaleAction={cancelSaleAction} />
            </Panel>
            <Panel title="Add player">
              {isCompleted ? <Empty>The auction has ended.</Empty> : <PlayerEditor player={null} send={send} pending={pending} />}
            </Panel>
            <Panel title="Bulk import">
              {isCompleted ? <Empty>The auction has ended.</Empty> : <PlayerImport state={state} send={send} pending={pending} />}
            </Panel>
          </Suspense>
        )}

        {tab === "teams" && (
          <Suspense fallback={<Spinner label="Loading teams section..." />}>
            <Panel title="Teams">
              <TeamManager state={state} send={send} pending={pending} />
            </Panel>
            <Panel title="Team login credentials">
              <TeamCredentials state={state} />
            </Panel>
          </Suspense>
        )}

        {tab === "rules" && (
          <Suspense fallback={<Spinner label="Loading rules section..." />}>
            <Panel title="Auction rules">
              <RulesForm state={state} send={send} pending={pending} />
            </Panel>
          </Suspense>
        )}

        {tab === "summary" && (
          <Suspense fallback={<Spinner label="Loading summary section..." />}>
            <Panel title="Auction summary">
              <AuctionSummary state={state} renderSaleAction={(sale) => cancelSaleAction(sale.playerId)} />
            </Panel>
          </Suspense>
        )}
      </div>
    </Page>
  );
}
