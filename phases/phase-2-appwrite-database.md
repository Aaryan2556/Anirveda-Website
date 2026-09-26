# Phase 2 — Appwrite Database & Persistence Mapping

> **Scope change (2026-09-26):** there is no in-app bidding, so the `ipl_bids` collection and `bids` mapping are **not needed**. Purchases have no `bidSeq`. See the contract changelog.

**Status:** ✅ Done (2026-09-26) · **Depends on:** Phase 1 · **Parallel with:** Phases 4, 5
**Goal:** define the Appwrite schema, write a pure, tested mapper between Appwrite documents and engine state, and add a **read-only** Appwrite adapter. Writes come in Phase 3.

## Approvals needed before starting

- [ ] A **separate development database** (ideally a separate Appwrite project) for IPL, so live MockRBI data is never touched.
- [ ] Creating collections, attributes and indexes in that dev database.
- [ ] A server API key for the setup script, kept in a local, git-ignored file (**never** a `VITE_` variable).
- [ ] Adding `node-appwrite` as a **devDependency** for the setup script (or use the Appwrite CLI instead).
- [ ] Fix K1: make `src/config/appwrite.js` tolerate missing env vars (additive; shared with MockRBI).
- [ ] Fix K2: add `.env.local` / `*.local` to `.gitignore`.

## Tasks

1. **Prerequisites:** fix K1, K2 and K3 (Appwrite-compatible `makeId`, ≤36 chars).
2. **Spike (half a day, write findings under Handoff notes):** for `appwrite@21.5.0` and the project's server version, confirm:
   - whether to use the `Databases` (collections/documents) or `TablesDB` (tables/rows) API;
   - whether **database transactions** are available (this decides Phase 3's write strategy);
   - realtime channel names for the chosen API;
   - attribute size limits for the JSON string fields below.
3. **Schema-as-code:** `scripts/ipl-auction/setup-appwrite.mjs`. It must be safe to run twice (create only what's missing) and must refuse to run without an explicit database ID. Note: `appwrite.json` is git-ignored in this repo, so keep the schema in the script.
4. **Mapper (pure, tested):** `src/lib/iplAuction/repository/appwriteMapper.js`
   - `stateToDocuments(state) → { auction, teams, players, bids, purchases, activity }` (used by the seed script)
   - `documentsToState({ auction, teams, players, bids, purchases, activity }) → engine state`
   - `diffToWrites(prevState, nextState) → [{ op: "create" | "update" | "delete", collection, id, data }]`
   - Round-trip test: `documentsToState(stateToDocuments(s))` deep-equals `s` for states produced by a full simulated auction (reuse fixtures from `__tests__/fixtures.js`).
5. **Read-only adapter:** `src/lib/iplAuction/repository/appwriteAdapter.js`: `getSnapshot`, `subscribe` (polling for now; realtime is Phase 6), `dispatch` returns `{ ok: false, error: { code: "NOT_IMPLEMENTED" } }` until Phase 3.
6. **Seed script:** load the fictional mock data into the dev database (`scripts/ipl-auction/seed-dev.mjs`).
7. **Config:** add IPL IDs to `src/config/appwrite.js` **additively** (for example `IPL_DATABASE_ID` from `VITE_IPL_AUCTION_DATABASE_ID`). Collection IDs are fixed constants in code, not env vars.

## Schema (proposal; confirm during the spike)

All money fields are **integer** (whole lakhs). Timestamps from the engine are stored as integer epoch ms (`atMs`), separate from Appwrite's own `$createdAt`.

**`ipl_auctions`** (one document per auction; `$id` = engine `auctionId`)
`name` string · `status` enum(SETUP, LIVE, PAUSED, COMPLETED) · `schemaVersion` int · `version` int · `createdAtMs` int · `config` string (JSON) · `counters` string (JSON) · `undoStack` string (JSON, bounded by `undoDepth`) · lot fields: `lotId` string?, `lotPlayerId` string?, `lotOpenedAtMs` int?, `currentBid` int?, `currentBidderId` string?, `lastBidSeq` int?, `lotBidCount` int?

**`ipl_teams`** (`$id` = engine team id)
`auctionId` · `name` · `shortName` · `logo` string? · `appwriteTeamId` string? (Phase 7) · optional display cache written by the Function only: `purse`, `spent`, `squadCount`, `overseasCount` (int)
Index: `auctionId`.

**`ipl_players`** (`$id` = engine player id)
`auctionId` · `name` · `role` enum · `isOverseas` bool · `basePrice` int · `nationality`? · `age` int? · `battingStyle`? · `bowlingStyle`? · `image` string? · `stats` string (JSON) · `recentPerformance` string (JSON) · `dataSource` string · `status` enum · `soldTo` string? · `soldPrice` int? · `order` int (keeps `playerOrder`)
Indexes: `auctionId`; `(auctionId, status)`.

**`ipl_bids`** (`$id` = `ID.unique()`)
`auctionId` · `seq` int · `lotId` · `playerId` · `teamId` · `amount` int · `atMs` int · `placedByUserId` string? (Phase 7)
Indexes: **unique `(auctionId, seq)`**; `(auctionId, lotId)`.

**`ipl_purchases`** (`$id` = `ID.unique()`)
`auctionId` · `seq` int · `lotId` · `playerId` · `teamId` · `price` int · `bidSeq` int · `atMs` int
Indexes: **unique `(auctionId, playerId)`** (the database itself blocks a double sale); **unique `(auctionId, seq)`**.

**`ipl_activity`** (`$id` = `ID.unique()`)
`auctionId` · `seq` int · `type` · `atMs` int · `actorRole` · `actorTeamId`? · `playerId`? · `teamId`? · `amount` int? · `undoneSeq` int? · `message` string
Indexes: **unique `(auctionId, seq)`** (Phase 3 uses this as the per-auction write lock); `(auctionId, seq desc)`.

**Permissions (target):** collections readable by signed-in users (Phase 7 narrows this); **no client create/update/delete**. Until Phase 3, only the setup and seed scripts write, using the API key.

**Undo mapping:** undo shrinks `bids` and `purchases` in the engine state, which `diffToWrites` turns into **deletes** of those documents. Activity is never deleted.

## Files owned

`scripts/ipl-auction/*`, `src/lib/iplAuction/repository/appwriteMapper.js`, `appwriteAdapter.js`, new tests under `src/lib/iplAuction/__tests__/`, additive lines in `src/config/appwrite.js`, `.gitignore` (K2 line only).

## Definition of done

- [ ] Spike findings recorded below.
- [ ] Setup script creates the full schema in the dev database; running it twice changes nothing.
- [ ] Mapper round-trip and diff tests pass.
- [ ] Read-only adapter shows a seeded dev auction on `/ipl-auction/admin` when the adapter is switched on through a **dev-only** flag (the local adapter stays the default).
- [ ] Live database, MockRBI collections and `.env` untouched.

## Handoff notes

### What was built (branch `feat/ipl-auction-phase-2`)

| Piece | File |
|---|---|
| Schema as code (TablesDB) | `src/lib/iplAuction/repository/appwriteSchema.js` |
| Pure mapper: `stateToRows`, `rowsToState`, `diffToWrites` | `src/lib/iplAuction/repository/appwriteMapper.js` |
| Read-only adapter (polling, consistent reads, never goes backwards) | `src/lib/iplAuction/repository/appwriteAdapter.js` |
| Dev-only adapter switch `VITE_IPL_AUCTION_ADAPTER=appwrite` | `src/lib/iplAuction/repository/index.js` |
| Setup + seed scripts (REST via built-in `fetch`, **no new dependency**) | `scripts/ipl-auction/` (`npm run ipl:setup`, `npm run ipl:seed`) |
| Credentials template (placeholders only) | `.env.ipl.example` → copy to git-ignored `.env.ipl.local` |
| K1 / K2 / K3 fixes | `src/config/appwrite.js`, `.gitignore`, `repository/mockSeed.js` |

Schema differences from the proposal above: no `ipl_bids`; no lot bid fields on the auction row; purchases have no `bidSeq` and use the **player ID as row ID**; teams and players have an `order` column. Tables are readable by anyone (`read("any")`) with **no client writes**; Phase 7 narrows reads.

### Spike findings

- **API:** use **TablesDB** (tables / rows / columns). `appwrite@21.5.0` has it, and it is where new features land. MockRBI keeps using `Databases`; both work side by side.
- **Transactions: available.** The SDK has `createTransaction` / `createOperations` and Appwrite Cloud supports them. `diffToWrites` already returns operations in the transaction shape, so Phase 3 can commit a whole command atomically.
- **Column types:** server 1.9 deprecates `string` in favour of `varchar` / `text` / `mediumtext` / `longtext`. The setup script tries the new types and falls back to `string` on older servers (both paths tested against a fake server).
- **Large integers:** epoch-ms columns are created with an explicit `max` of `Number.MAX_SAFE_INTEGER` so they are 64-bit.
- **Realtime channels** (Phase 6): `databases.<db>.tables.<table>.rows` style channels for TablesDB — confirm against the live server in Phase 6.
- **Not verified yet (needs the real server):** exact Cloud server version, and text-column size limits in practice. The first `npm run ipl:setup` run will show both.

### Verification performed

- `npm run test:ipl`: **99/99** pass (new: mapper round-trips for fresh, busy and mock auctions; every mapped row checked against the schema's columns, types, sizes and required flags; step-by-step `diffToWrites` replay reproduces the engine state; adapter paging, torn-read retry, never-backwards, error handling, read-only dispatch; `makeId` validity).
- Scripts run against a local fake Appwrite REST server: refuse without credentials; refuse when pointed at the protected site database; setup twice = no changes; seed refuses a second time; `--reset` wipes and reseeds; legacy `string` fallback works.
- `npm run build` passes. Headless Chrome: `/ipl-auction/admin`, `/ipl-auction/play` and `/` render **with no Appwrite env vars** (K1 fixed).

### Verified against real Appwrite (2026-09-26)

- The IPL dev database lives in its **own Appwrite project** (`6a6712190021f81a8a96`), separate from the live site's project, so live data cannot be affected.
- `npm run ipl:setup` → "Schema is up to date" (all 5 tables present); `npm run ipl:seed` loaded the fictional auction (4 teams, 29 players); a second seed correctly refused.
- Anonymous read through the real `appwrite` SDK and `appwriteAdapter.js` (no API key) returned the full auction: public read works, mapping is correct.
- `npm run dev` with `.env.local` (`VITE_IPL_AUCTION_ADAPTER=appwrite`): `/ipl-auction/admin` and `/ipl-auction/play` render the Appwrite auction in Chrome (no "Reset local data" button, confirming the Appwrite adapter is active); localhost CORS works.

### Recommendation for Phase 3

With offline bidding, **only admins write**. That opens a simpler option than an Appwrite Function: the admin's browser runs the engine and commits `diffToWrites(...)` in **one TablesDB transaction**, while table permissions allow writes only to an admin team/label. Teams still cannot write anything (enforced by Appwrite, not the UI), and the unique `(auctionId, seq)` activity index rejects a write based on a stale state. Trade-off: rule enforcement then trusts the admin's client — acceptable if admins are trusted organisers. Decide at the start of Phase 3.
