import { useCallback, useEffect, useState } from "react";
import { getAdminAuth } from "../repository/index.js";

/**
 * Appwrite sign-in session: { status, user, isAdmin, error, signIn, signOut, refresh }.
 * Used by the admin pages and, for team accounts, by the team dashboard
 * (useTeamActor reads the team label from `user.labels`).
 * status: "loading" | "ready" | "error". Local mode is always an admin.
 * `refresh()` re-reads the session (e.g. after Appwrite refused a write because it expired).
 */
export function useAdminAuth(auth = getAdminAuth()) {
  const [session, setSession] = useState({ status: "loading", user: null, isAdmin: false, error: null });

  const load = useCallback(async (action) => {
    try {
      const next = await action();
      setSession({ status: "ready", ...next, error: null });
      return next;
    } catch (error) {
      setSession((previous) => ({ ...previous, status: "error", error: error?.message ?? String(error) }));
      return null;
    }
  }, []);

  useEffect(() => {
    load(auth.getSession);
  }, [auth, load]);

  return {
    ...session,
    kind: auth.kind,
    refresh: () => load(auth.getSession),
    signIn: (email, password) => load(() => auth.signIn(email, password)),
    signOut: () => load(async () => {
      await auth.signOut();
      return { user: null, isAdmin: false };
    }),
  };
}
