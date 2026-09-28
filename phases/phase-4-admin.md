# Phase 4 — Admin Functionality

> **Scope change (2026-09-26):** bidding is offline. The admin records each result with SOLD (team + price, live rule check) or UNSOLD, moves through the sequence with **Next player**, reorders the sequence, and fixes older mistakes with **Cancel sale**. Bid-on-behalf, stale-bid guard, increment slabs and jump bids no longer exist.

**Status:** ✅ Done locally (2026-09-28); Appwrite browser re-check pending · **Depends on:** Phase 1 · **Parallel with:** Phases 2, 3, 5
**Goal:** complete the admin feature set. Build it **against the local adapter**; it must keep working unchanged on the Appwrite adapter once Phase 3 lands. The UI stays functional-only (Phase 8 does the design).

## Already available from Phase 1

Start / pause / resume / end, put up player, bid on a team's behalf, SOLD (stale-bid guard), UNSOLD, withdraw / reinstate, undo, add player (basic), edit rules as JSON before start, activity and bid history.

## Tasks

### A. Shared groundwork (do first; Phase 5 needs it too)
1. Create `src/lib/iplAuction/hooks/useAuctionActor.js`: returns `{ actor, isAdmin, teamId, status }`. Phase 4/5 implementation: admin on `/admin`, team from `?team=` on `/play`. Replace the inline `ADMIN_ACTOR` / URL logic in both pages with it. **Phase 7 changes only this hook.**
2. Create `src/lib/iplAuction/hooks/useAuctionCommand.js`: wraps `dispatch`, adds the actor, and exposes `{ send, pending, lastError }`. This gives one consistent place for toasts and error messages.

### B. New engine commands (each: handler + constants + tests + contract §3 update)
| Command | Rules |
|---|---|
| `REMOVE_PLAYER { playerId }` | SETUP only; not on block, not sold. |
| `UPDATE_TEAM { teamId, changes }` / `REMOVE_TEAM { teamId }` | SETUP only. |
| `VOID_PURCHASE { purchaseId, returnTo: "AVAILABLE" \| "UNSOLD" }` | Corrects an **older** sale that undo can't reach. Refunds by removing the purchase. Rejected if a lot is open. Logged in activity; clears the undo stack (explain why in code). |
| `SET_PLAYER_ORDER { playerIds }` (optional) | Controls the order players are put up. |

### C. Admin features (functional UI)
- Player editor using `UPDATE_PLAYER` (fields from contract §5; status fields not editable).
- **Bulk import** of players from JSON or CSV, validated through `ADD_PLAYER` one row at a time with a per-row error report. The import must require a `dataSource`; fictional rows are labelled.
- Structured rules form instead of raw JSON: purse, squad min/max, overseas, per-role min/max, reserve, increment slabs, jump bids, relist. Show `validateConfig` errors inline.
- Team management (add / edit / remove before start).
- Purchase history table and **auction summary** (per team: squad, spend, role mix), with a CSV/JSON export for the organisers.
- "Next player" helper: put up the next AVAILABLE player in `playerOrder`.

### D. Real event rules
Once the organisers confirm the rules, put them in a named preset (for example `EVENT_2026_CONFIG` in `config.js`). Keep `DEV_DEFAULT_CONFIG` for development.

## Out of scope here
Login and route protection (Phase 7), live sync across devices (Phase 6), player images in Appwrite Storage (Phase 8 decides presentation; the upload flow can start here once Phase 2 is ready, **with approval** for a storage bucket).

## Files owned

`src/Pages/IPLAuction/AdminPage.jsx` (and sub-components under `src/components/IPLAuction/admin/`), `src/lib/iplAuction/hooks/*`, engine additions listed in B (through the contract change process).

## Definition of done

- [x] Every command in B has tests for its allowed case and each rejection.
- [x] An organiser can set up a full auction (rules, teams, 30+ players via import) and run it to the end without touching JSON.
- [x] The admin page contains no business rules. Grep the page for `purse -`, `>= squad` and similar: none should be there.
- [x] Works with the local adapter (browser run, see below). Appwrite: parity tests pass against the fake TablesDB; **a live browser run still needs an admin account** (same step as Phase 3).

## Handoff notes

**Done (2026-09-28)**

- **A. Hooks.** `hooks/useAuctionActor.js` exports `useAdminActor()` (admin page; wraps `useAdminAuth`) and `useTeamActor()` (team page; `?team=`). Two hooks instead of one `useAuctionActor()` so no hook is called conditionally; Phase 7 still only edits this file. `hooks/useAuctionCommand.js` → `{ send, pending, lastError }` with toasts. Both pages use them.
- **B. Engine.** `UPDATE_TEAM`, `REMOVE_TEAM`, `REMOVE_PLAYER` (all SETUP only; `REMOVE_PLAYER` clears undo, see the handler comment). `VOID_PURCHASE` and `SET_PLAYER_ORDER` were already covered by `CANCEL_SALE` and `REORDER_PLAYERS` from the offline-bidding change, so they were not added. The engine now enforces the Appwrite text limits and the age/stats/recentPerformance shapes (`TEXT_LIMITS`), so an over-long imported value is a clear `INVALID_INPUT` in both adapters instead of an Appwrite 400. New selector `getAuctionSummary`.
- **C. Admin UI** (`components/IPLAuction/admin/`), in tabs on `/ipl-auction/admin` (`?tab=` survives refresh):
  - Run auction: controls (End auction now asks for confirmation), SOLD/UNSOLD with the engine dry-run preview.
  - Players: sequence with search/filter, reorder, put up, withdraw/reinstate, **Edit** (full profile incl. stats and data source), **Remove** (setup only), cancel sale; add player; **bulk import** (CSV or JSON, paste or file; "Check rows" dry-runs every row through `ADD_PLAYER` and shows per-row errors and duplicate-name warnings; import then sends valid rows one at a time and stops at the first failure). A data source is required per row or as a default.
  - Teams: add / edit / remove (setup only).
  - Rules: structured form, inline `validateConfig` problems, preset loader (dev defaults only for now).
  - Summary & export: per-team spend / purse / squad / roles / minimums, squads, purchase history with cancel, CSV (purchases) and JSON (summary) downloads.
- Stats labels on the player card say "(fictional)" only for FICTIONAL players; other players show their source.
- Pure helpers with tests: `io/playerImport.js`, `io/auctionExport.js`, `playerFields.js`.

**Verification:** `npm run test:ipl` 136/136 (25 new: each new command and rejection, validation limits, summary, import parsing/planning, exports, Appwrite parity for setup deletes, transaction-limit failure). `npm run build` passes. Browser run in local mode (headless Chrome): add/edit/remove team, invalid rule shown and Apply disabled, apply rules, add + edit player, import 3 rows (1 rejected with reason, 2 imported), remove player, start, next player, SOLD, UNSOLD, both downloads, team page — **no console errors**.

**Left / known issues**

- D. Real event rules: waiting for the organisers; add the preset to `PRESETS` in `RulesForm.jsx` (or a named config in `config.js`).
- K7 (README): removing/moving a player near the top of a 100+ player list exceeds one Appwrite transaction and is refused (nothing written). Fix before loading a large real pool.
- Import in Appwrite mode is one transaction per player (about one full read + commit each), so 100 rows takes a while; progress is shown.
- If an import stops midway and is re-checked, already-imported rows show as duplicate-name warnings (not errors); remove them from the text before importing again.
- `data/ipl-auction/howstat-ipl-players.csv` (untracked) has real-player career totals but no roles or base prices, so it can't be imported as-is, and its source/licence must be checked before use.
