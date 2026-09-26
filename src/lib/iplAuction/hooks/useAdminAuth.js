import { useCallback, useEffect, useState } from "react";
import { getAdminAuth } from "../repository/index.js";

/**
 * Admin session for the admin page: { status, user, isAdmin, error, signIn, signOut }.
 * status: "loading" | "ready" | "error". Local mode is always an admin.
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
    signIn: (email, password) => load(() => auth.signIn(email, password)),
    signOut: () => load(async () => {
      await auth.signOut();
      return { user: null, isAdmin: false };
    }),
  };
}
