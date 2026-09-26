# 00 — Integration Contract

Everything in this file is **shared between phases**. If your phase needs to change any of it, follow §10 (change process). Changing these silently is what causes integration failures.

---

## 1. Layering

```
Pages / components (JSX)          src/Pages/IPLAuction/, src/components/IPLAuction/
        │  use only ↓
Hooks                             src/lib/iplAuction/hooks/        (useAuction, useAuctionActor*)
        │  use only ↓
Repository contract               src/lib/iplAuction/repository/index.js → getAuctionRepository()
        │  implemented by ↓
Adapters                          localAdapter.js (Phase 1) · appwriteAdapter.js (Phase 2–3)
        │  call ↓
Engine (pure)                     src/lib/iplAuction/engine/  +  config.js  +  money.js
```
\* `useAuctionActor` is introduced in Phase 4/5.

Rules:
- **Business rules exist only in the engine.** Adapters, hooks and JSX never decide whether something is allowed.
- **UI previews use the engine.** To show "can this team bid?", call `reduce()` as a dry run or a function from `engine/rules.js`. Never re-implement a rule in a component.
- **Derived numbers come from selectors** (`engine/selectors.js`, `engine/rules.js`): purse, spent, squad counts, max bid. Never compute them in JSX.
- **The engine imports nothing** except its own files, `config.js` and `money.js`. No React, no Appwrite, no `Date.now()`, no storage. Relative imports keep the `.js` extension so the same files run in Node (tests, Appwrite Function) and Vite.

## 2. Engine entry point

```js
import { reduce } from "src/lib/iplAuction/engine/index.js";

reduce(state, command)
  → { ok: true,  state: nextState, events: [activityEntry] }
  → { ok: false, state /* same reference, unchanged */, error: { code, message } }
```
- Never mutates `state` (tests deep-freeze inputs to prove it).
- Branch on `error.code` (see `engine/errors.js`), never on `error.message`.
- `createInitialState({ auctionId, name, config, teams, players, at })` builds a fresh auction in `SETUP`.

## 3. Command shape

```js
{ type: COMMANDS.X, actor: { role: "ADMIN" } | { role: "TEAM", teamId }, at?: epochMs, ...payload }
```
- `at` is added by the **adapter**, not the caller (the engine never reads the clock).
- `actor` is added by the **hook/adapter from the resolved identity**. From Phase 7, the server ignores any client-supplied actor.

| Command | Payload | Who | Undoable |
|---|---|---|---|
| `UPDATE_CONFIG` | `{ config }` (full replacement) | ADMIN, SETUP only | no |
| `ADD_TEAM` | `{ team: { id, name, shortName?, logo? } }` | ADMIN, SETUP only | no |
| `ADD_PLAYER` | `{ player }` (see §5) | ADMIN, not COMPLETED | no |
| `UPDATE_PLAYER` | `{ playerId, changes }` | ADMIN; player AVAILABLE/UNSOLD/WITHDRAWN | no |
| `START_AUCTION` | — | ADMIN; ≥2 teams, ≥1 player | no |
| `PAUSE_AUCTION` / `RESUME_AUCTION` | — | ADMIN | no |
| `END_AUCTION` | — | ADMIN; no open lot | no |
| `REORDER_PLAYERS` | `{ playerOrder }` (every player id exactly once) | ADMIN; not COMPLETED | no |
| `OPEN_LOT` | `{ playerId? }`; omitted = next AVAILABLE player in `playerOrder` | ADMIN; LIVE | yes |
| `SELL_PLAYER` | `{ playerId, teamId, price }` | ADMIN; LIVE | yes |
| `MARK_UNSOLD` | — | ADMIN; LIVE | yes |
| `CANCEL_SALE` | `{ playerId }` | ADMIN; not COMPLETED. Refunds the team, player back to AVAILABLE, **clears the undo stack** | no |
| `WITHDRAW_PLAYER` / `REINSTATE_PLAYER` | `{ playerId }` | ADMIN | yes |
| `UNDO` | — | ADMIN; not COMPLETED | — |

**Auction format (since 2026-09-26):** players come up in sequence, **bidding happens offline in the room**, and the admin records the result with `SELL_PLAYER` (winning team + hammer price) or `MARK_UNSOLD`. There is no in-app bidding and **teams cannot send any command**; the TEAM actor exists for identity/read access only.

`SELL_PLAYER` must name the player on the block (`playerId`), otherwise it is rejected with `STALE_STATE`; this stops an out-of-date admin screen selling the wrong player. The price must be whole lakhs and at least the base price; there is no increment ladder. Purse, reserve, squad, overseas and role limits are still enforced.

## 4. State shape (`SCHEMA_VERSION = 2`)

```js
{
  schemaVersion, auctionId, name, createdAt, version,       // version +1 on every accepted command
  status,                                                    // SETUP | LIVE | PAUSED | COMPLETED
  config,                                                    // see config.js
  teams:   { [id]: { id, name, shortName, logo } },   teamOrder:   [id],
  players: { [id]: Player },                          playerOrder: [id],
  lot: null | { id, playerId, openedAt },
  purchases: [{ id, seq, lotId, playerId, teamId, price, at }],
  activity:  [{ seq, type, at, actor, message, playerId?, teamId?, amount?, undoneSeq? }],
  undoStack: [{ commandType, activitySeq, description, lot, purchasesLength, players }],
  counters:  { activity, purchase, lot }                     // monotonic, never reset by undo
}
```
- **Purse, spent and squad composition are not stored.** They are always derived from `purchases` (`getTeamStats`). Any stored copy (for example on an Appwrite team document) is a display cache that the engine never reads.
- **Ordering and "is newer" rule:** compare `createdAt` first (a reset creates a newer auction), then `version`.

## 5. Player shape

```js
{ id, name, role, isOverseas, basePrice,            // required
  nationality, age, battingStyle, bowlingStyle, image,
  stats: { batting?, bowling?, keeping? }, recentPerformance: [string],
  dataSource,                                        // "FICTIONAL" | "MANUAL_ENTRY" | (Phase 4) verified source
  status, soldTo, soldPrice }                        // owned by the engine; cannot be edited directly
```
Roles: `BATTER | BOWLER | ALL_ROUNDER | WICKETKEEPER` (`config.js → ROLES`). Player statuses: `AVAILABLE | ON_BLOCK | SOLD | UNSOLD | WITHDRAWN`.

**Data honesty:** any record with `dataSource: "FICTIONAL"` must be labelled as fictional wherever it is shown. Never present invented statistics as real.

## 6. Money

- Every amount is **whole lakhs** (`Number.isSafeInteger`). ₹1 Cr = 100 lakhs.
- Use `formatLakhs()` for display only; never parse a formatted string back into a number.
- Appwrite attributes that hold money are **integer** attributes.

## 7. IDs

- Must be valid **Appwrite document IDs**: at most 36 characters, only `a-z A-Z 0-9 . - _`, and not starting with a special character.
- Players and teams: the engine ID **is** the Appwrite `$id`.
- Purchases and activity: Appwrite `$id` = `ID.unique()`; the engine's sequence number is stored in a `seq` attribute with a unique index `(auctionId, seq)`.
- ⚠️ `makeId()` in `repository/mockSeed.js` currently breaks the 36-character rule (known issue K3). Fix it at the start of Phase 2.

## 8. Repository contract

Every adapter exports an object with:

| Member | Contract |
|---|---|
| `getSnapshot()` | Returns the current state. **Same reference until it changes** (required by `useSyncExternalStore`). |
| `subscribe(listener)` | Calls `listener()` after every change; returns an unsubscribe function. |
| `dispatch(command)` | Adds `at` and runs the command against the **latest authoritative** state. Resolves to the engine result shape in §2. Never throws for rule violations. Network or server failures resolve to `{ ok: false, error: { code: "NETWORK_ERROR" \| "SERVER_ERROR", message } }`. |
| `reset()` | **Development only.** The Appwrite adapter may not implement it. |
| `destroy()` | Releases channels, subscriptions and timers. |

`getAuctionRepository()` in `repository/index.js` is the **only** place that chooses an adapter.

## 9. Folder ownership

| Path | Owner | Others may |
|---|---|---|
| `src/lib/iplAuction/engine/`, `config.js`, `money.js` | Engine (any phase via §10) | read only |
| `src/lib/iplAuction/repository/localAdapter.js` | Phase 1 | read only |
| `src/lib/iplAuction/repository/appwrite*.js` | Phases 2, 3, 6 | read only |
| `src/lib/iplAuction/hooks/` | Phases 4, 5, 7 | add hooks |
| `functions/ipl-auction-command/` | Phases 3, 7 | read only |
| `src/Pages/IPLAuction/`, `src/components/IPLAuction/` | Phases 4, 5 (functional), 8 (final) | — |
| `src/config/appwrite.js` | **Shared with MockRBI**: only additive changes, with approval | — |
| `src/App.jsx` | Shared with the whole site: only IPL route lines | — |
| `src/data/iplAuction/` | Fictional data only | — |

## 10. Change process for anything in this file

1. Write the change in the changelog below (what changes, why, which phases are affected).
2. Engine change: add or adjust tests first; `npm run test:ipl` must pass.
3. State shape change: bump `SCHEMA_VERSION` in `engine/index.js`, update the Appwrite mapper (Phase 2+) and say how existing data migrates. The local adapter already discards stored state with a different schema version.
4. New command: add it to `COMMANDS`, write the handler, add tests, list it in §3, and decide whether it is undoable.
5. Tell whoever owns the affected phases.

## Changelog

| Date | Change | Affects |
|---|---|---|
| 2026-09-25 | Contract created from the Phase 1 implementation. | all |
| 2026-09-26 | **Offline bidding.** Removed `PLACE_BID`, `bids`, lot bid fields, `bidIncrements`, `allowJumpBids` and the bid-ladder helpers. `SELL_PLAYER` now takes `{ playerId, teamId, price }`. Added `REORDER_PLAYERS`, `CANCEL_SALE`, `OPEN_LOT` without `playerId` (next in sequence), and selectors `getUpcomingPlayers`, `getNextPlayerInSequence`, `getRecentSales`. Teams are view-only. `SCHEMA_VERSION` 1 → 2 (local data is discarded and reseeded). | 2 (no `ipl_bids` collection), 3, 4, 5 (view-only dashboard), 6, 7 (teams need read access only) |
