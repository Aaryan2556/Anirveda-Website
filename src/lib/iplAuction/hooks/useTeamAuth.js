/**
 * React hook for the database-based team session.
 *
 * Returns { status, teamId, user, error, signIn, signOut, refresh, kind }.
 * status: "loading" | "ready" | "error"
 *
 * This is the team-facing counterpart of useAdminAuth (which is admin-only).
 * It uses the dbTeamAuth adapter created by the repository.
 */
import { useCallback, useEffect, useState } from "react";
import { getTeamAuth } from "../repository/index.js";

export function useTeamAuth(auth = getTeamAuth()) {
  const [session, setSession] = useState({ status: "loading", teamId: null, user: null, error: null });

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
    signIn: (username, password) => load(() => auth.signIn(username, password)),
    signOut: () =>
      load(async () => {
        await auth.signOut();
        return { teamId: null, user: null };
      }),
  };
}
