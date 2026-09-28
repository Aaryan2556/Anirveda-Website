# Phase 5 — Participant Functionality

> **Scope change (2026-09-26):** bidding is offline, so participants are **view-only**. Anything below about placing bids, bid previews, outbid indicators, jump bids or bid history no longer applies. The dashboard shows: player on the block, whether the team can buy them and its max price, purse/spend/squad/role composition, up next, recent sales, all teams, activity.

**Status:** ✅ Done locally (2026-09-28) · **Depends on:** Phase 1 (and Phase 4 task A: `useAuctionActor`, `useAuctionCommand`) · **Parallel with:** Phases 2, 3, 4
**Goal:** everything a team needs during the auction, functional-only, built against the repository contract.

## Already available from Phase 1

View current player, current bid and bidder; place the next valid bid with a live "why you can't bid" preview; my purse, max bid and squad; all teams table; bid history for the current lot; activity log.

## Tasks

1. Switch `PlayPage.jsx` to `useAuctionActor()` and `useAuctionCommand()` (Phase 4 task A). If Phase 4 hasn't done it yet, do task A here and tell Phase 4.
2. **New selectors** (in `engine/selectors.js`, with tests):
   - `getMarket(state, { status, role, overseas })`: player pool with filters (upcoming, sold, unsold, withdrawn).
   - `getTeamPurchaseHistory(state, teamId)` and `getLotHistory(state)` (past lots with winner, price and bid count).
   - `getRoleNeeds(state, teamId)`: how many of each role the team still needs to meet the minimums, plus slots left.
3. **Participant features:**
   - Market view: browse the player pool, see who's coming up, sold prices.
   - "Needs" panel from `getRoleNeeds` (helps teams plan).
   - Past lots and full bid history.
   - Other teams' squads.
   - Outbid indicator: when the team was the highest bidder and no longer is, show it clearly (derive by comparing the previous and current snapshot in a hook, not in the engine).
   - Jump-bid input, shown only when `config.allowJumpBids` is on (already supported by the engine).
4. **Stale-bid safety:** disable the bid button while a bid is pending, and re-run the preview on every new snapshot (already the case; keep it).

## Rules
- Participants never see admin controls, and the page must not import admin components.
- Every "can I bid?" answer comes from `reduce()` dry-run or `rules.js`, never a hand-written check.

## Files owned

`src/Pages/IPLAuction/PlayPage.jsx`, `src/components/IPLAuction/play/*`, new selectors in `engine/selectors.js` (through the contract change process).

## Definition of done

- [x] New selectors have tests.
- [x] A team can follow a whole auction from one tab, including after a page refresh (view-only: there is nothing to "take part in" since bidding is offline).
- [x] Works on a phone-width screen (functional, not polished) — checked at 390 px, no page-level horizontal scroll.
- [x] Works with the local adapter. Appwrite: the page only reads (`getSnapshot`/`subscribe`), which Phase 2 verified live; a browser run in Appwrite mode is still to do alongside the Phase 3/4 admin check.

## Handoff notes

**Done (2026-09-28)**

- **Hooks (task 1):** the page uses `useTeamActor()` (done in Phase 4). It does not use `useAuctionCommand`: teams send no commands, and the page imports nothing from `components/IPLAuction/admin/`.
- **Selectors (task 2), in `engine/selectors.js`, tests in `__tests__/participantSelectors.test.js`:**
  - `getMarket(state, { status, role, overseas, query })` → `[{ player, position, team }]`.
  - `getTeamPurchaseHistory(state, teamId)` → the team's purchases, oldest first, with players.
  - `getRoleNeeds(state, teamId)` → `{ slotsLeft, squadShort, overseasLeft, roles: { ROLE: { have, min, max, need, full } } }`.
  - `getLotHistory(state)` → every lot rebuilt from the activity log: result `SOLD / UNSOLD / WITHDRAWN / OPEN`, team, price. Undone actions are ignored (an undone sale re-opens the lot); a sale later reversed by `CANCEL_SALE` stays with `cancelled: true`. No bid counts: bidding is offline.
- **Dashboard (task 3)**, `components/IPLAuction/play/`, in tabs (`?tab=` kept next to `?team=`, survives refresh):
  - **Live:** latest-sale banner ("You bought …" for your team), player on the block with "you can pay up to …" or why you can't buy (engine `validateSale`), purse / spent / max price / squad / overseas, **still-needed** panel from `getRoleNeeds`, squad in the order bought, up next.
  - **Market:** whole pool with status / role / overseas / name filters, sold team and price, and **Can buy** (engine check at base price) for players still to come; tap a name for the full profile.
  - **Teams:** all-teams table plus every team's squad (yours first).
  - **History:** every lot with its outcome (cancelled sales marked), full activity log.
- Items dropped by the offline format: outbid indicator, jump bids, bid history, stale-bid button handling.

**Verification:** `npm run test:ipl` 145/145 (9 new). `npm run build` passes. Browser run (local mode, headless Chrome): admin tab + a 390 px team tab in the same browser; the team tab updated without reload when the admin opened a lot, sold to the team ("You bought …"), marked unsold, sold to another team and cancelled a sale; market filters, can-buy column, player details, teams and history all correct; reload kept team, tab and data; no page-level horizontal scroll on any tab; no console errors.

**Left**
- Appwrite-mode browser run (read-only; polling every 2 s until Phase 6 adds realtime).
- Anyone can open any team's dashboard via `?team=` until Phase 7 (all auction data is public-read anyway).
