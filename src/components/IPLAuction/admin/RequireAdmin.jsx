/**
 * Admin-only gate for IPL Auction pages (admin console, big screen).
 *
 *   <RequireAdmin title="Admin console">{(identity) => <Console identity={identity} />}</RequireAdmin>
 *
 * Shows "not available" when the auction is disabled for this build, a sign-in
 * form in Appwrite mode, and renders the children only for a signed-in user
 * with the admin label (always, in local development mode). The UI check is a
 * convenience: Appwrite table permissions are what stop non-admins writing.
 */
import { useState } from "react";
import { useAdminActor } from "../../../lib/iplAuction/hooks/useAuctionActor";
import { AUCTION_MODES, getAuctionMode } from "../../../lib/iplAuction/repository";
import { Button, Page, PageHeader, Panel, Spinner, inputClass } from "../ui/controls";

function Shell({ title, children }) {
  return (
    <Page>
      <PageHeader title={title} />
      <div className="mx-auto max-w-md">{children}</div>
    </Page>
  );
}

export default function RequireAdmin({ title, children }) {
  const { mode, reason } = getAuctionMode();
  if (mode === AUCTION_MODES.DISABLED) {
    return (
      <Shell title={title}>
        <p className="text-secondary">IPL Auction is not available: {reason}</p>
      </Shell>
    );
  }
  return (
    <AdminGate title={title}>{children}</AdminGate>
  );
}

function AdminGate({ title, children }) {
  const identity = useAdminActor();
  if (identity.status === "loading") {
    return (
      <Shell title={title}>
        <Spinner label="Checking sign-in…" />
      </Shell>
    );
  }
  if (!identity.isAdmin) return <SignIn title={title} auth={identity.auth} />;
  return children(identity);
}

function SignIn({ title, auth }) {
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
    <Shell title={title}>
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
