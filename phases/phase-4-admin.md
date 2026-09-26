# Phase 4 — Admin Functionality

> **Scope change (2026-09-26):** bidding is offline. The admin records each result with SOLD (team + price, live rule check) or UNSOLD, moves through the sequence with **Next player**, reorders the sequence, and fixes older mistakes with **Cancel sale**. Bid-on-behalf, stale-bid guard, increment slabs and jump bids no longer exist.

**Status:** ⬜ Not started · **Depends on:** Phase 1 · **Parallel with:** Phases 2, 3, 5
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

- [ ] Every command in B has tests for its allowed case and each rejection.
- [ ] An organiser can set up a full auction (rules, teams, 30+ players via import) and run it to the end without touching JSON.
- [ ] The admin page contains no business rules. Grep the page for `purse -`, `>= squad` and similar: none should be there.
- [ ] Works with the local adapter; re-verified on the Appwrite adapter once Phase 3 is done.

## Handoff notes

_(fill in when done)_
