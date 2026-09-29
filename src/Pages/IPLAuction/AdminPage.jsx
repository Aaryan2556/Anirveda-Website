/**
 * /ipl-auction/admin — the admin console.
 * All business rules live in src/lib/iplAuction; this page only wires them up.
 *
 * Flow: set up rules, teams and players; start; players come up in sequence,
 * teams bid in the room, and the admin records each result here — SOLD to a
 * team at the hammer price, or UNSOLD. Summary and exports at the end.
 * The big screen (/ipl-auction/admin/screen) and the summary are admin-only too.
 */
import { useSearchParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuction } from "../../lib/iplAuction/hooks/useAuction";
import { useAuctionCommand } from "../../lib/iplAuction/hooks/useAuctionCommand";
import { AUCTION_STATUS, COMMANDS } from "../../lib/iplAuction/engine";
import { Button, Empty, Page, PageHeader, Panel, Tabs } from "../../components/IPLAuction/ui/controls";
import {
  ActivityLog,
  AuctionStatus,
  FictionalNotice,
  LocalModeNotice,
  RecentSales,
  TeamsTable,
} from "../../components/IPLAuction/ui/auction";
import AuctionSummary from "../../components/IPLAuction/admin/AuctionSummary";
import PlayerEditor from "../../components/IPLAuction/admin/PlayerEditor";
import PlayerImport from "../../components/IPLAuction/admin/PlayerImport";
import PlayerSequence from "../../components/IPLAuction/admin/PlayerSequence";
import RulesForm from "../../components/IPLAuction/admin/RulesForm";
import { AuctionControls, OnTheBlock } from "../../components/IPLAuction/admin/RunAuction";
import RequireAdmin from "../../components/IPLAuction/admin/RequireAdmin";
import TeamManager from "../../components/IPLAuction/admin/TeamManager";
import { ConfirmButton } from "../../components/IPLAuction/admin/fields";

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
          href="/ipl-auction/admin/screen"
          target="_blank"
          rel="noreferrer"
          className="rounded-3xl border border-primary px-3 py-1 text-xs text-primary transition hover:bg-primary hover:text-white"
        >
          Open big screen
        </a>
        {user && (
          <span className="flex items-center gap-2 text-xs text-secondary">
            {user.email}
            <Button size="sm" onClick={signOut}>
              Sign out
            </Button>
          </span>
        )}
      </PageHeader>
      <LocalModeNotice kind={kind} />
      <FictionalNotice state={state} />
      <p className="mb-4 font-Abel text-lg text-secondary">{state.name}</p>

      <Tabs tabs={TABS} current={tab} onSelect={selectTab} label="Admin sections" trailing={pending ? "Saving…" : null} />

      {lotPlayer && tab !== "run" && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm">
          <span>
            <span className="text-secondary">On the block: </span>
            <strong className="text-white">{lotPlayer.name}</strong>
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
            <Panel title="Teams">
              <TeamsTable state={state} />
            </Panel>
          </>
        )}

        {tab === "players" && (
          <>
            <Panel title="Player sequence">
              <PlayerSequence state={state} send={send} pending={pending} renderSaleAction={cancelSaleAction} />
            </Panel>
            <Panel title="Add player">
              {isCompleted ? <Empty>The auction has ended.</Empty> : <PlayerEditor player={null} send={send} pending={pending} />}
            </Panel>
            <Panel title="Bulk import">
              {isCompleted ? <Empty>The auction has ended.</Empty> : <PlayerImport state={state} send={send} pending={pending} />}
            </Panel>
          </>
        )}

        {tab === "teams" && (
          <Panel title="Teams">
            <TeamManager state={state} send={send} pending={pending} />
          </Panel>
        )}

        {tab === "rules" && (
          <Panel title="Auction rules">
            <RulesForm state={state} send={send} pending={pending} />
          </Panel>
        )}

        {tab === "summary" && (
          <Panel title="Auction summary">
            <AuctionSummary state={state} renderSaleAction={(sale) => cancelSaleAction(sale.playerId)} />
          </Panel>
        )}
      </div>
    </Page>
  );
}
