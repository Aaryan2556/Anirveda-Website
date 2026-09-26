# Phase 7 — Authentication & Permissions

> **Scope change (2026-09-26):** team members are **view-only** (bidding is offline). The server must reject **every** command from a TEAM actor; teams only need read access to their auction.

**Status:** ⬜ Not started · **Depends on:** Phase 3 (Function), Phases 4 and 5 (pages use `useAuctionActor`) · **Parallel with:** Phase 6
**Goal:** real identities. Admins control the auction; team members can bid **only for their own team**. This is enforced **on the server**, not just hidden in the UI.

## Decisions needed before starting

- [ ] Login method (recommendation: Appwrite Account with email + password or email OTP; Auth0 is installed but unused and would need bridging to Appwrite permissions).
- [ ] One login per team, or several members per team (recommendation: several members, any of whom can bid).

## Approvals needed

- [ ] Creating Appwrite Teams: `ipl-admins`, plus one Appwrite Team per auction team.
- [ ] Changing collection and Function permissions in the dev project, then (separately) in production.

## Design

**Identity → actor (server side, the only trusted place)**
Replace `resolveActor` in the Function (Phase 3) with this:
1. Read the calling user from the execution headers (no user → `UNAUTHORIZED`).
2. Member of `ipl-admins` → `{ role: "ADMIN" }`.
3. Otherwise find the `ipl_teams` document whose `appwriteTeamId` the user belongs to → `{ role: "TEAM", teamId }`.
4. Ignore any `actor` sent by the client. Remove `ALLOW_CLIENT_ACTOR` from every non-dev deployment.
5. Store `placedByUserId` on bids for auditing.

The engine already rejects a team bidding for another team and non-admin control commands, so once the server resolves the actor, both checks are enforced.

**Data permissions**
- IPL collections: read by `users` (or narrower, if the organisers want auction data hidden from non-participants); **no client write permissions at all**.
- Function execute permission: `users`.
- Basic rate limit in the Function: for example at most 5 commands per user per second.

**Client**
- `useAuctionActor()` (from Phase 4) now reads the signed-in user and their memberships. `/play` no longer takes `?team=`.
- New `/ipl-auction/login` page (functional).
- Route guards: `/ipl-auction/admin` for admins only; `/ipl-auction/play` for team members. Guards are a convenience; the Function is the real protection.
- **Do not reuse the MockRBI login pattern** (hardcoded credentials, plain-text passwords, `localStorage` tokens).

## Files owned

`functions/ipl-auction-command/src/resolveActor.js`, `src/lib/iplAuction/hooks/useAuctionActor.js`, `src/Pages/IPLAuction/LoginPage.jsx`, route lines in `src/App.jsx`, permission settings in the setup script.

## Tests

- Function: unauthenticated call rejected; team member bidding for another team rejected; team member sending an admin command rejected; admin allowed; a forged `actor` in the body ignored.
- Manual: try direct database writes from the browser console with a team user's session. All must fail.

## Production readiness checklist (gate before any live use)

- [ ] `ALLOW_CLIENT_ACTOR` absent or false.
- [ ] No client write permissions on any IPL collection.
- [ ] API keys only in Function or server settings; nothing secret in `VITE_` variables.
- [ ] The local adapter and "Reset local data" are not reachable in production builds.
- [ ] Admin accounts reviewed.

## Handoff notes

_(fill in when done)_
