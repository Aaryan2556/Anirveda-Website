# Phase 2 — Appwrite Database & Persistence Mapping

> **Scope change (2026-09-26):** there is no in-app bidding, so the `ipl_bids` collection and `bids` mapping are **not needed**. Purchases have no `bidSeq`. See the contract changelog.

**Status:** ⬜ Not started · **Depends on:** Phase 1 · **Parallel with:** Phases 4, 5
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

_(fill in when done)_
