# Phase 5 — Participant Functionality

> **Scope change (2026-09-26):** bidding is offline, so participants are **view-only**. Anything below about placing bids, bid previews, outbid indicators, jump bids or bid history no longer applies. The dashboard shows: player on the block, whether the team can buy them and its max price, purse/spend/squad/role composition, up next, recent sales, all teams, activity.

**Status:** ⬜ Not started · **Depends on:** Phase 1 (and Phase 4 task A: `useAuctionActor`, `useAuctionCommand`) · **Parallel with:** Phases 2, 3, 4
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

- [ ] New selectors have tests.
- [ ] A team can follow and take part in a whole auction from one tab, including after a page refresh.
- [ ] Works on a phone-width screen (functional, not polished).
- [ ] Works with the local adapter; re-verified on the Appwrite adapter once Phase 3 is done.

## Handoff notes

_(fill in when done)_
