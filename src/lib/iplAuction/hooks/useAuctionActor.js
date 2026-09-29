import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { resolveTeamFromLabels } from "../auth/teamAuth.js";
import { ACTOR_ROLES } from "../engine/index.js";
import { useAdminAuth } from "./useAdminAuth.js";

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
 * - Appwrite mode: the team comes from the signed-in account's team label
 *   (auth/teamAuth.js), so a team only ever sees its own dashboard. `?team=` is
 *   ignored for teams; an IPL admin may use it to look at any team.
 * - Local development mode (no logins): the team comes from `?team=`.
 *
 * Returns { actor, isAdmin, teamId, status, reason, auth }. `reason` explains a
 * signed-in account with no team. Teams are view-only; the engine rejects every
 * command a TEAM actor might send.
 */
export function useTeamActor(state) {
  const auth = useAdminAuth();
  const [params] = useSearchParams();
  const requested = params.get("team");
  const teamIds = state.teamOrder;

  let teamId = null;
  let reason = null;
  if (auth.kind === "local" || auth.isAdmin) {
    teamId = requested;
  } else if (auth.user) {
    ({ teamId, reason } = resolveTeamFromLabels(auth.user.labels, teamIds));
  }

  const actor = useMemo(() => (teamId ? { role: ACTOR_ROLES.TEAM, teamId } : null), [teamId]);
  return { actor, isAdmin: auth.isAdmin, teamId, status: auth.status, reason, auth };
}
