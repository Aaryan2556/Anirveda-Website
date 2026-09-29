/**
 * /ipl-auction/admin — functional admin console. Final design is Phase 8.
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
import {
  ActivityLog,
  AuctionHeader,
  Button,
  DevBanner,
  RecentSales,
  Section,
  TeamsTable,
} from "../../components/IPLAuction/DevPanels";
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
  if (mode === AUCTION_MODES.DISABLED) return <Shell>IPL Auction is not available: {reason}</Shell>;
  return <AdminGate />;
}

function AdminGate() {
  const identity = useAdminActor();
  if (identity.status === "loading") return <Shell>Checking sign-in…</Shell>;
  if (!identity.isAdmin) return <SignIn auth={identity.auth} />;
  return <AdminConsole identity={identity} />;
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-tertiary px-4 py-6 font-Lato text-white">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="font-Bebas text-4xl tracking-wide">IPL Auction · Admin</h1>
        {children}
      </div>
    </div>
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
        <div className="space-y-2 border border-red-500/60 p-3 text-sm">
          <p>
            Signed in as <strong>{auth.user.email}</strong>, but this account is not an IPL admin.
          </p>
          <Button onClick={auth.signOut}>Sign out</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-2 border border-white/15 p-4 text-sm">
          <input
            required
            type="email"
            placeholder="Admin email"
            autoComplete="username"
            className="border border-white/30 bg-black px-2 py-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            required
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            className="border border-white/30 bg-black px-2 py-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button variant="primary" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      )}
      {auth.error && <p className="text-sm text-red-300">{auth.error}</p>}
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
    <div className="min-h-screen bg-tertiary px-4 py-6 font-Lato text-white">
      <Toaster position="top-right" />
      <div className="mx-auto max-w-7xl space-y-4">
        <h1 className="font-Bebas text-4xl tracking-wide">IPL Auction · Admin (dev)</h1>
        <DevBanner kind={kind} />
        {user && (
          <div className="flex items-center gap-3 text-xs text-white/60">
            Signed in as {user.email}
            <Button onClick={signOut}>Sign out</Button>
          </div>
        )}
        <AuctionHeader state={state} />

        <nav className="flex flex-wrap gap-1 border-b border-white/15" aria-label="Admin sections">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? "page" : undefined}
              onClick={() => selectTab(id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                tab === id ? "border-primary text-white" : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
          {pending && <span className="ml-auto self-center text-xs text-white/50">Saving…</span>}
        </nav>

        {tab === "run" && (
          <>
            <AuctionControls state={state} send={send} pending={pending} reset={reset} />
            <OnTheBlock state={state} send={send} actor={identity.actor} pending={pending} />
            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="Recent sales">
                <RecentSales state={state} renderAction={(sale) => cancelSaleAction(sale.playerId)} />
              </Section>
              <Section title="Activity">
                <ActivityLog state={state} />
              </Section>
            </div>
            <Section title="Teams">
              <TeamsTable state={state} />
            </Section>
          </>
        )}

        {tab === "players" && (
          <>
            <Section title="Player sequence">
              <PlayerSequence state={state} send={send} pending={pending} renderSaleAction={cancelSaleAction} />
            </Section>
            <Section title="Add player">
              {isCompleted ? (
                <p className="text-sm text-white/60">The auction has ended.</p>
              ) : (
                <PlayerEditor player={null} send={send} pending={pending} />
              )}
            </Section>
            <Section title="Bulk import">
              {isCompleted ? (
                <p className="text-sm text-white/60">The auction has ended.</p>
              ) : (
                <PlayerImport state={state} send={send} pending={pending} />
              )}
            </Section>
          </>
        )}

        {tab === "teams" && (
          <Section title="Teams">
            <TeamManager state={state} send={send} pending={pending} />
          </Section>
        )}

        {tab === "rules" && (
          <Section title="Auction rules">
            <RulesForm state={state} send={send} pending={pending} />
          </Section>
        )}

        {tab === "summary" && (
          <Section title="Auction summary">
            <AuctionSummary state={state} renderSaleAction={(sale) => cancelSaleAction(sale.playerId)} />
          </Section>
        )}
      </div>
    </div>
  );
}
