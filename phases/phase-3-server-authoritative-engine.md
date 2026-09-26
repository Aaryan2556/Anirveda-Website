# Phase 3 — Authoritative Writes (admin client + Appwrite transactions)

**Status:** ✅ Code done and verified against real Appwrite (2026-09-26); browser run needs an admin account · **Depends on:** Phase 2
**Goal:** every change to an auction is validated by the engine against the **latest stored state** and saved **atomically**; only admins can write, enforced by Appwrite.

## Decision (2026-09-26): no Appwrite Function

Bidding is offline, so **only admins send commands**. The owner chose the simpler design:

```
Admin browser  ── dispatch(command) ──▶ appwriteAdapter
  1. latest  = read the auction from Appwrite (consistent read)
  2. result  = reduce(latest, { ...command, at: now() })        ← same engine as everywhere
  3. if !result.ok → return the engine error (nothing written)
  4. writes  = diffToWrites(latest, result.state)                 ← always includes 1 new activity row
  5. one TablesDB transaction: stage all writes → commit (rollback on any error)
       └─ 409 (someone committed first) → back to step 1 (max 3 attempts) → STALE_STATE
```

- **Who can write:** table permissions are `read("any")` + `create/update/delete("label:ipladmin")`, row security off. Appwrite rejects writes from anyone without the label — verified live: anonymous create/update → `401 user_unauthorized`.
- **Concurrency guard:** each accepted command adds exactly one activity row, and `(auctionId, seq)` is unique. Two admins acting on the same state produce the same `seq`; Appwrite commits one and rejects the other with `409 transaction_conflict`; the loser re-runs against the new state (e.g. a second SOLD becomes `NO_ACTIVE_LOT`).
- **Atomicity:** verified live: a transaction containing one conflicting create writes **nothing**.
- **Second guard against double sales:** purchase row ID = player ID.
- **Trade-off (accepted):** rule checks run in the admin's browser. A malicious *admin* could bypass them; teams cannot.

## Gotcha found while verifying (important for anyone writing to Appwrite here)

Inside **transaction operations**, Appwrite does **not** expand the `"unique()"` row-ID placeholder — it stores the literal text as the ID. Always generate IDs client-side (`ID.unique()` from the SDK does). The adapter now requires an `ID` generator, and the test fake rejects `"unique()"` inside transactions.

## Admin sign-in (pulled forward from Phase 7)

- `src/lib/iplAuction/auth/adminAuth.js`: `createAppwriteAdminAuth({ account })` (email + password session; admin = user has label `ipladmin`) and `createLocalAdminAuth()` (local mode, no login).
- `src/lib/iplAuction/hooks/useAdminAuth.js` + `repository/index.js → getAdminAuth()`.
- `/ipl-auction/admin` shows a sign-in form in Appwrite mode; signed-in non-admins see "not an IPL admin". The UI check is convenience only — permissions are the real guard.
- Team pages stay public and read-only.

### Creating an admin (Appwrite console)

1. **Auth → Users → Create user** (email + password).
2. Open the user → **Labels** → add `ipladmin` → Update.
3. Sign in at `/ipl-auction/admin` (with `VITE_IPL_AUCTION_ADAPTER=appwrite`).

## Files

`repository/appwriteAdapter.js` (dispatch + commit), `repository/appwriteSchema.js` (`ADMIN_LABEL`, `TABLE_PERMISSIONS`), `repository/index.js`, `auth/adminAuth.js`, `hooks/useAdminAuth.js`, `Pages/IPLAuction/AdminPage.jsx` (sign-in gate), `components/IPLAuction/DevPanels.jsx` (banner shows the mode), `scripts/ipl-auction/setup-appwrite.mjs` (enforces table permissions), tests `__tests__/fakeTablesDB.js`, `appwriteAdapter.test.js`, `adminAuth.test.js`.

## Verification performed

- `npm run test:ipl`: **111/111**. New: commit of accepted commands; engine rejection writes nothing; TEAM actor rejected before any request; no-permission → `UNAUTHORIZED` + rollback; dispatch uses latest stored state; **two admin tabs selling the same lot → exactly one purchase**; repeated conflicts → `STALE_STATE`; network failure → `NETWORK_ERROR`; **parity** — 13 commands through the Appwrite adapter and the local adapter give identical final states; admin-auth logic.
- Live Appwrite (dev project `6a6712190021f81a8a96`): permissions applied by `npm run ipl:setup`; transaction probes (stale writer → 409, all-or-nothing) and anonymous write probes (401) as above. Probe rows removed.
- `npm run build` passes.

## Definition of done

- [x] Writes validated by the engine against the latest stored state, committed atomically.
- [x] Only admins can write (enforced by Appwrite, verified live).
- [x] Concurrency (double SOLD) and parity tests pass.
- [ ] Owner creates an admin account and runs a lot end-to-end in the browser (steps above). Record click → confirmed latency below (target < 1 s).

## Handoff notes

- Realtime (Phase 6) replaces polling; after a successful dispatch the adapter already updates its own snapshot immediately.
- Phase 7 is now smaller: admin identity exists. Remaining: decide whether team pages should require login at all (they are read-only), managing admin accounts, and production switch-over.
- A transaction is limited to 100 operations per command (`MAX_OPERATIONS_PER_COMMAND`); normal commands use 2–5.
