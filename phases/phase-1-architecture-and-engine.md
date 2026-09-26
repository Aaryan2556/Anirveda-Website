# Phase 1 — Architecture, Engine & Local Simulation

**Status:** ✅ Done (2026-09-25)
**Goal:** a complete, tested auction engine and a local multi-tab simulation, with no Appwrite.

## Delivered

| Area | Files |
|---|---|
| Rules config + dev defaults | `src/lib/iplAuction/config.js` (`DEV_DEFAULT_CONFIG` is temporary, not the event rules) |
| Money helpers | `src/lib/iplAuction/money.js` |
| Engine | `src/lib/iplAuction/engine/{index,rules,selectors,constants,errors}.js` |
| Local adapter | `src/lib/iplAuction/repository/localAdapter.js` (localStorage + BroadcastChannel + Web Locks) |
| Seed + adapter choice | `src/lib/iplAuction/repository/{mockSeed,index}.js` |
| React binding | `src/lib/iplAuction/hooks/useAuction.js` |
| Fictional data | `src/data/iplAuction/{mockPlayers,mockTeams}.js` (30 players, 4 teams) |
| Functional pages | `src/Pages/IPLAuction/{AdminPage,PlayPage}.jsx`, `src/components/IPLAuction/DevPanels.jsx` |
| Tests | `src/lib/iplAuction/__tests__/*.test.js` (74 tests, `node:test`) |
| Existing files changed | `src/App.jsx` (2 lazy routes, skip loading screen on `/ipl-auction`), `package.json` (`test:ipl` script) |

## Rules enforced by the engine

Bid amount and increments, jump-bid setting, purse, minimum reserve, squad size, role max and role-minimum reachability, overseas limit, player status, duplicate-sale prevention, SOLD/UNSOLD, withdraw/reinstate, pause/resume, undo (last-in, first-out, bounded by `undoDepth`), admin-only commands, and teams bidding only for themselves.

## How to run locally

Because of known issue K1 (see README), the dev server needs Appwrite env vars even though IPL doesn't use Appwrite. Set placeholders on the process only (PowerShell):

```powershell
$env:VITE_APPWRITE_ENDPOINT="http://127.0.0.1:9/v1"; $env:VITE_APPWRITE_PROJECT_ID="placeholder"; npm run dev
```

1. Open `http://localhost:5173/ipl-auction/admin`.
2. Use the "Open participant tabs" links (one tab per team, `/ipl-auction/play?team=<teamId>`).
3. Start the auction, put a player up, bid from the team tabs, then SOLD / UNSOLD / Undo.
4. "Reset local data" (with confirmation) starts over in every tab.

Tests: `npm run test:ipl`. Build: `npm run build`.

## Verification performed

- 74/74 unit tests pass.
- Production build passes; IPL code is in separate lazy-loaded chunks.
- Real Chrome with admin + 2 team tabs (automated through the DevTools protocol): lot, bids, sale, purse, activity, undo and pause all synced across tabs, and two simultaneous equal bids resulted in exactly one accepted bid. No page errors.

## Handoff notes

- The local adapter is the reference implementation of the repository contract. The Appwrite adapter must pass the same behavioural expectations (see `__tests__/localAdapter.test.js`).
- Pages currently build the actor inline (`ADMIN_ACTOR` const; team from `?team=`). Phase 4/5 should move this into `useAuctionActor()` so Phase 7 changes one place.
- Known issues K1–K4 in the README came out of this phase.
