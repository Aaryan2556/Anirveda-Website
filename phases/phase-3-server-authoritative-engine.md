# Phase 3 — Server-Authoritative Engine (Appwrite Function)

> **Scope change (2026-09-26):** only the admin sends commands (bidding is offline). Replace the `PLACE_BID` concurrency test with: two parallel `SELL_PLAYER` for the same lot → exactly one accepted.

**Status:** ⬜ Not started · **Depends on:** Phase 2 · **Parallel with:** Phases 4, 5
**Goal:** every change to an auction goes through **one Appwrite Function** that runs the same `reduce()` as the browser, against the latest stored state, and writes the result. Clients never write to the auction collections directly.

## Approvals needed before starting

- [ ] Creating and deploying an Appwrite Function in the **dev** project (Node runtime).
- [ ] A Function-scoped API key (database read/write on the IPL dev database only).

## Design

```
Browser ── functions.createExecution("ipl-auction-command", { auctionId, command }) ──▶ Function
Function:
  1. actor = resolveActor(request)            ← pluggable; see "Actor resolution"
  2. state = documentsToState(load(auctionId))
  3. result = reduce(state, { ...command, actor, at: Date.now() })
  4. if !result.ok → return result.error
  5. claim: create ipl_activity { auctionId, seq: state.counters.activity + 1, ... }
       └─ unique (auctionId, seq) conflict → another command won → go back to step 2 (max 3 retries)
  6. apply diffToWrites(state, result.state)  (inside a transaction if the Phase 2 spike found them)
  7. return { ok: true, version: result.state.version }
```

- **Step 5 is the concurrency guard.** Two bids racing for the same auction both compute the same next activity `seq`; the unique index lets exactly one through, and the other retries against fresh state (where it will usually fail with `BID_TOO_LOW`, which is correct).
- **Partial-write safety.** If transactions are not available: the claimed activity document stores the full write list (`writes` JSON). Writes are idempotent (fixed IDs, `seq`-based). A `REPAIR` step at the start of each execution re-applies the writes of the latest activity if the auction's `version` is behind it.
- The unique `(auctionId, playerId)` index on `ipl_purchases` is a second, independent guard against selling a player twice.

## Sharing the engine with the Function

- Engine files already use Node-compatible ESM imports with `.js` extensions and have no dependencies.
- `scripts/ipl-auction/sync-engine.mjs` copies `src/lib/iplAuction/{engine/,config.js,money.js}` into `functions/ipl-auction-command/src/shared/` before each deploy.
- A test compares file hashes so the copy can never silently drift from the source.

## Actor resolution (pluggable)

`functions/ipl-auction-command/src/resolveActor.js` exports `resolveActor(request) → actor | error`.

- **Phase 3 (dev only):** if Function env `ALLOW_CLIENT_ACTOR === "true"`, accept `command.actor` from the body. **Must be off in any non-dev deployment.**
- **Phase 7:** replaced by a resolver that reads the Appwrite user from the execution headers and checks team memberships. Nothing else in the Function changes.

## Client side

- `appwriteAdapter.dispatch(command)` calls the Function and returns the engine-shaped result. Network and Function failures map to `NETWORK_ERROR` / `SERVER_ERROR` (contract §8).
- After a successful dispatch, the adapter refetches state (Phase 6 replaces this with realtime).
- `getAuctionRepository()` picks the Appwrite adapter only when a dev flag is set; the local adapter stays the default until Phase 7 ships.

## Files owned

`functions/ipl-auction-command/**`, `scripts/ipl-auction/sync-engine.mjs`, `src/lib/iplAuction/repository/appwriteAdapter.js` (dispatch), `repository/index.js` (adapter selection only), new tests.

## Tests

- Function handler unit tests run in Node with an **in-memory fake database** that enforces the unique indexes. They cover: accepted command, rejected command (nothing written), conflict and retry, partial-write repair, and a double sale blocked by the index.
- Concurrency test: 20 parallel `PLACE_BID` executions at the same amount → exactly one accepted.
- Parity test: replay the same command list through the local adapter and the Function handler, then compare final states.

## Definition of done

- [ ] All Phase 1 behaviours work end-to-end against the dev Appwrite database.
- [ ] The concurrency and parity tests above pass.
- [ ] Measured bid latency (click → confirmed) recorded below; target under 1 s on campus Wi-Fi.
- [ ] `ALLOW_CLIENT_ACTOR` documented as dev-only; the production checklist in Phase 7 depends on it.

## Handoff notes

_(fill in when done)_
