# Phase 6 — Real-Time Synchronization

**Status:** ⬜ Not started · **Depends on:** Phase 3 · **Parallel with:** Phase 7
**Goal:** every connected device sees the current player, bid, bidder, purses, squads, activity and auction status within about a second, and **never shows an older state after a newer one**.

## Approvals needed

- [ ] Additive change to `src/config/appwrite.js`: export the existing `client` (needed for `client.subscribe`). MockRBI is unaffected.

## Design

- Subscribe to the IPL collections for the current auction (channel names come from the Phase 2 spike: `Databases` and `TablesDB` use different names).
- **Treat events as "something changed" signals, not as the state itself:**
  1. On an event for this `auctionId`, schedule a refetch (debounced ~100 ms, so a burst of writes from one command causes one refetch).
  2. After the refetch, apply the new snapshot only if it is **newer** than the current one (contract §4: `createdAt`, then `version`).
  - This means partially-applied writes, out-of-order events and duplicate events can't leave the screen inconsistent.
- **Fast path (optional, after the above works):** apply the `ipl_auctions` document payload directly for the lot and bid fields (still version-gated), then refetch the rest.
- **Reconnects:** on reconnect or when the tab becomes visible again, always refetch. Show a small "reconnecting…" indicator when the socket is down. Polling every ~10 s stays on as a safety net.

## Files owned

`src/lib/iplAuction/repository/appwriteAdapter.js` (subscribe/refetch), `src/lib/iplAuction/repository/appwriteRealtime.js`, additive `client` export in `src/config/appwrite.js`, a connection-status hook `hooks/useConnectionStatus.js`.

## Tests

- Unit: the version gate ignores older and duplicate snapshots; the debounce collapses bursts; reconnect triggers a refetch. Use a fake subscription source.
- Manual/automated multi-device run: 1 admin + 8 team devices (or browser profiles), 50 lots. Record the worst observed delay from bid to display, and confirm the final purchases and purses are identical on every device.

## Definition of done

- [ ] Admin + team screens on different devices stay in sync during a full simulated auction.
- [ ] Killing Wi-Fi on one device for 30 s and restoring it recovers the correct state with no reload.
- [ ] Worst-case delay recorded below (target under 1 s).

## Handoff notes

_(fill in when done)_
