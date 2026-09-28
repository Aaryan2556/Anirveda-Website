import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
 * Team dashboard: the team comes from `?team=` (no team login yet, see Phase 7).
 * Teams are view-only, so this actor identifies the viewer; the engine rejects
 * every command it might send.
 */
export function useTeamActor() {
  const [params, setParams] = useSearchParams();
  const teamId = params.get("team");
  const setTeamId = useCallback((id) => setParams({ team: id }), [setParams]);
  const actor = useMemo(() => (teamId ? { role: ACTOR_ROLES.TEAM, teamId } : null), [teamId]);
  return { actor, isAdmin: false, teamId, status: "ready", setTeamId };
}
