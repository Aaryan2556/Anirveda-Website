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
import { useAdminActor } from "../../../lib/iplAuction/hooks/useAuctionActor";
import { AUCTION_MODES, getAuctionMode } from "../../../lib/iplAuction/repository";
import { Button, Page, PageHeader, Panel, SignInPanel, Spinner } from "../ui/controls";

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
        <p className="text-slate-400">IPL Auction is not available: {reason}</p>
      </Shell>
    );
  }
  return <AdminGate title={title}>{children}</AdminGate>;
}

function AdminGate({ title, children }) {
  const identity = useAdminActor();
  const { auth } = identity;
  if (identity.status === "loading") {
    return (
      <Shell title={title}>
        <Spinner label="Checking sign-in…" />
      </Shell>
    );
  }
  if (identity.isAdmin) return children(identity);
  return (
    <Shell title={title}>
      {auth.user ? (
        <Panel title="Not an admin">
          <p className="mb-4 text-sm text-slate-400">
            Signed in as <strong className="text-slate-100">{auth.user.email}</strong>, but this account is not an IPL
            Auction admin.
          </p>
          <Button onClick={auth.signOut}>Sign out</Button>
        </Panel>
      ) : (
        <SignInPanel title="Admin login" auth={auth} />
      )}
    </Shell>
  );
}
