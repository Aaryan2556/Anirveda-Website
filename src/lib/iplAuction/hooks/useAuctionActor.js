import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ACTOR_ROLES } from "../engine/index.js";
import { useAdminAuth } from "./useAdminAuth.js";
import { useTeamAuth } from "./useTeamAuth.js";

/**
 * Who is acting on an auction page. Both hooks return the same shape:
 *
 *   { actor, isAdmin, teamId, status }
 *
 * `actor` is what commands are sent as (null = may not send commands). Pages
 * never build actors themselves, so Phase 7 (real identities) only changes this
 * file. The UI result is a convenience: Appwrite permissions are the real guard.
 */

const ADMIN_ACTOR = Object.freeze({ role: ACTOR_ROLES.ADMIN });

/** Admin page: an admin actor once the signed-in user is an IPL admin (always, in local mode). */
export function useAdminActor() {
  const auth = useAdminAuth();
  return {
    actor: auth.isAdmin ? ADMIN_ACTOR : null,
    isAdmin: auth.isAdmin,
    teamId: null,
    status: auth.status,
    auth,
  };
}

/**
 * Team dashboard: which single team this viewer is.
 *
 * - Appwrite mode: the team is identified by the DB-based team auth session
 *   (auth/dbTeamAuth.js). The team signed in using username + password and
 *   their teamId is stored in localStorage.
 * - Local development mode (no logins): the team comes from `?team=`.
 *
 * Returns { actor, isAdmin, teamId, status, reason, auth }.
 */
export function useTeamActor(state) {
  const adminAuth = useAdminAuth();
  const teamAuth = useTeamAuth();
  const [params] = useSearchParams();
  const requested = params.get("team");

  let teamId = null;
  let reason = null;
  let auth = teamAuth;

  if (adminAuth.kind === "local") {
    // Local dev mode: no login needed; team comes from ?team= query param.
    teamId = requested;
    auth = adminAuth; // expose signOut etc. from a compatible shape
  } else if (adminAuth.isAdmin) {
    // Admin is viewing a team dashboard (for debugging); use ?team= param.
    teamId = requested;
    auth = adminAuth;
  } else if (teamAuth.teamId) {
    // Normal team login via DB auth.
    teamId = teamAuth.teamId;
    // Verify the teamId actually exists in the current auction state.
    if (teamId && state.teamOrder.length > 0 && !state.teams[teamId]) {
      reason = "This account is not linked to a team in this auction.";
      teamId = null;
    }
  } else if (teamAuth.status === "ready" && !teamAuth.teamId) {
    reason = "Please sign in with your team credentials.";
  }

  const actor = useMemo(() => (teamId ? { role: ACTOR_ROLES.TEAM, teamId } : null), [teamId]);
  return { actor, isAdmin: adminAuth.isAdmin, teamId, status: teamAuth.status, reason, auth };
}
