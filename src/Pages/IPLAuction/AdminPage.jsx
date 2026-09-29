/**
 * /ipl-auction/admin — the admin console.
 * All business rules live in src/lib/iplAuction; this page only wires them up.
 *
 * Flow: set up rules, teams and players; start; players come up in sequence,
 * teams bid in the room, and the admin records each result here — SOLD to a
 * team at the hammer price, or UNSOLD. Summary and exports at the end.
 */
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuction } from "../../lib/iplAuction/hooks/useAuction";
import { useAdminActor } from "../../lib/iplAuction/hooks/useAuctionActor";
import { useAuctionCommand } from "../../lib/iplAuction/hooks/useAuctionCommand";
import { AUCTION_STATUS, COMMANDS } from "../../lib/iplAuction/engine";
import { AUCTION_MODES, getAuctionMode } from "../../lib/iplAuction/repository";
import { Button, Empty, Page, PageHeader, Panel, Spinner, Tabs, inputClass } from "../../components/IPLAuction/ui/controls";
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
import TeamManager from "../../components/IPLAuction/admin/TeamManager";
import { ConfirmButton } from "../../components/IPLAuction/admin/fields";

const TABS = [
  { id: "run", label: "Run auction" },
  { id: "players", label: "Players" },
  { id: "teams", label: "Teams" },
  { id: "rules", label: "Rules" },
  { id: "summary", label: "Summary & export" },
];

/** Appwrite mode requires a signed-in user with the admin label; local mode needs no login. */
export default function AdminPage() {
  const { mode, reason } = getAuctionMode();
  if (mode === AUCTION_MODES.DISABLED) {
    return (
      <Shell>
        <p className="text-secondary">IPL Auction is not available: {reason}</p>
      </Shell>
    );
  }
  return <AdminGate />;
}

function AdminGate() {
  const identity = useAdminActor();
  if (identity.status === "loading") {
    return (
      <Shell>
        <Spinner label="Checking sign-in…" />
      </Shell>
    );
  }
  if (!identity.isAdmin) return <SignIn auth={identity.auth} />;
  return <AdminConsole identity={identity} />;
}

function Shell({ children }) {
  return (
    <Page>
      <PageHeader title="Admin console" />
      <div className="mx-auto max-w-md">{children}</div>
    </Page>
  );
}

function SignIn({ auth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    await auth.signIn(email, password);
    setBusy(false);
  };
  return (
    <Shell>
      {auth.user ? (
        <Panel title="Not an admin">
          <p className="mb-4 text-sm text-secondary">
            Signed in as <strong className="text-white">{auth.user.email}</strong>, but this account is not an IPL
            Auction admin.
          </p>
          <Button onClick={auth.signOut}>Sign out</Button>
        </Panel>
      ) : (
        <Panel title="Admin login">
          <form onSubmit={submit} className="grid gap-4">
            <label className="grid gap-1 text-xs">
              <span className="font-medium uppercase tracking-wider text-secondary">Email</span>
              <input
                required
                type="email"
                autoComplete="username"
                className={`${inputClass} py-2.5`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-xs">
              <span className="font-medium uppercase tracking-wider text-secondary">Password</span>
              <input
                required
                type="password"
                autoComplete="current-password"
                className={`${inputClass} py-2.5`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <Button variant="primary" size="lg" type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Panel>
      )}
      {auth.error && (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {auth.error}
        </p>
      )}
    </Shell>
  );
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
