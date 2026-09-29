# Phase 7 — Authentication & Permissions

> **Update (2026-09-26, Phase 3):** admin sign-in already exists — Appwrite account + label `ipladmin`, and tables only allow writes by that label (verified live). See the Phase 3 file. What remains here: team logins (optional, since teams are read-only), admin account management, production switch-over.
>
> **Scope change (2026-09-26):** team members are **view-only** (bidding is offline). The server must reject **every** command from a TEAM actor; teams only need read access to their auction.

**Status:** ✅ Done (2026-09-29) · **Depends on:** Phase 3 (Function), Phases 4 and 5 (pages use `useAuctionActor`) · **Parallel with:** Phase 6
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

**Scope actually needed (2026-09-29).** The design above predates two owner decisions: no Appwrite Function (Phase 3) and view-only teams (offline bidding). So there is no `resolveActor`, no rate limit and no `placedByUserId`: teams send no commands, and Appwrite table permissions (`read("any")`, writes only for label `ipladmin`, row security off) are the server-side guard. The engine also rejects every TEAM command. What remained, and what was done:

**Done**
- **Production gate** (`repository/mode.js`, tested in `__tests__/mode.test.js`): `resolveAuctionMode()` → `appwrite | local | disabled`. A **production build never uses the local adapter**, so the no-login local "admin" console and "Reset local data" are unreachable on the live site; without Appwrite settings the pages say the auction is unavailable. An unknown adapter name, or appwrite without a database ID, is `disabled` instead of silently local. Pages check `getAuctionMode()` before any hook.
- **Expired admin sessions:** `useAdminAuth().refresh()`; `useAuctionCommand(actor, { onUnauthorized })` calls it when Appwrite refuses a write, so an admin whose session expired lands back on the sign-in form instead of seeing repeated errors.
- **`npm run ipl:check`** (`scripts/ipl-auction/check-permissions.mjs`): the production-readiness permission check. Passes on the dev database (2026-09-29): all 5 tables have the expected permissions with row security off; an anonymous client can read every table and is refused (401) on create, real update and delete; an anonymous transaction writes nothing; the API key is in no `VITE_` variable. No leftovers (probe rows use auction ID `perm-probe` and are removed).
- Findings worth knowing: Appwrite validates the body (400) and looks up the row (404) **before** checking permissions, and answers **200 to a no-change update without checking permissions** (nothing is written). Guests can *open* a transaction (201) but cannot stage into or commit it (404). The checker accounts for all of this.

**Team identity.** `/ipl-auction/play` keeps the team picker / `?team=`. Every IPL table is publicly readable and teams can't write, so a team login would only choose which team is highlighted; it was left out on purpose (no Appwrite Teams created, no project changes). If the organisers want the auction hidden from non-participants, change `read("any")` to `read("users")` in `TABLE_PERMISSIONS`, add a team sign-in, and re-run `ipl:setup` + `ipl:check`.

**Admin accounts.** Create: Appwrite console → Auth → Users → Create user → Labels → `ipladmin`. Remove access: delete the label (or the user), then Sessions → delete all. Review the list of labelled users before the event.

## Production switch-over (owner)

1. Create the production IPL database (separate from the site database) and run `npm run ipl:setup` against it (a separate `.env.ipl.local`-style file with the production IDs).
2. `npm run ipl:check` against it: must print "All checks passed."
3. Vercel env: `VITE_IPL_AUCTION_ADAPTER=appwrite`, `VITE_IPL_AUCTION_DATABASE_ID=<prod IPL db>`, optionally `VITE_IPL_AUCTION_ID`. Never the API key.
4. Create and review admin accounts (label `ipladmin`).

Checklist status: `ALLOW_CLIENT_ACTOR` — n/a (no Function). No client write permissions — ✅ verified on dev. No secret in `VITE_` — ✅ checked by `ipl:check`. Local adapter / reset not reachable in production — ✅ `mode.js`. Admin accounts reviewed — owner, before the event.
