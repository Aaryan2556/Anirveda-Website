# Phase 6 — Real-Time Synchronization

**Status:** ✅ Done (2026-09-29): transaction events and latency verified live; physical multi-device rehearsal left to the owner (Phase 8 rehearsal) · **Depends on:** Phase 3 · **Parallel with:** Phase 7
**Goal:** every connected device sees the current player, sale, purses, squads, activity and auction status within about a second, and **never shows an older state after a newer one**.

## Approvals needed

- [x] Additive change to `src/config/appwrite.js`: export the existing `client` (needed for the `Realtime` service). MockRBI is unaffected. (Done with the go-ahead to start Phase 6.)

## Design

- Subscribe to the IPL collections for the current auction (channel names come from the Phase 2 spike: `Databases` and `TablesDB` use different names).
- **Treat events as "something changed" signals, not as the state itself:**
  1. On an event for this `auctionId`, schedule a refetch (debounced ~100 ms, so a burst of writes from one command causes one refetch).
  2. After the refetch, apply the new snapshot only if it is **newer** than the current one (contract §4: `createdAt`, then `version`).
  - This means partially-applied writes, out-of-order events and duplicate events can't leave the screen inconsistent.
- **Fast path (optional, after the above works):** apply the `ipl_auctions` document payload directly for the lot fields (still version-gated), then refetch the rest.
- **Reconnects:** on reconnect or when the tab becomes visible again, always refetch. Show a small "reconnecting…" indicator when the socket is down. Polling every ~10 s stays on as a safety net.

## Files owned

`src/lib/iplAuction/repository/appwriteAdapter.js` (subscribe/refetch), `src/lib/iplAuction/repository/appwriteRealtime.js`, additive `client` export in `src/config/appwrite.js`, a connection-status hook `hooks/useConnectionStatus.js`.

## Tests

- Unit: the version gate ignores older and duplicate snapshots; the debounce collapses bursts; reconnect triggers a refetch. Use a fake subscription source.
- Manual/automated multi-device run: 1 admin + 8 team devices (or browser profiles), 50 lots. Record the worst observed delay from sale to display, and confirm the final purchases and purses are identical on every device.

## Definition of done

- [x] Automated: admin + 8 team screens on one (fake) database stay identical over 50 lots, with events delayed, duplicated, shuffled, and one screen's socket down for 10 lots (`__tests__/realtime.test.js`).
- [ ] Live: admin + team screens on different devices stay in sync during a full simulated auction.
- [ ] Killing Wi-Fi on one device for 30 s and restoring it recovers the correct state with no reload.
- [x] Worst-case delay recorded below (target under 1 s): ≈0.8–1.0 s steady, 1.6 s on a cold first read (2026-09-29).

## Handoff notes

**Done (2026-09-28)**
- `repository/appwriteRealtime.js`: channel list (every IPL table under both `databases.<db>.tables.<t>.rows` and `databases.<db>.collections.<t>.documents`), event normaliser (`toAuctionEvent` → `{ tableId, auctionId }`), and a wrapper over the SDK's `Realtime` service (SDK 21.5; `client.subscribe` is deprecated) that reports socket status via `onOpen` / `onClose`.
- `appwriteAdapter.js`:
  - Events → one debounced (100 ms) full refetch, applied only if newer. Events for another auction are ignored; when not pinned (`VITE_IPL_AUCTION_ID` unset), a *new auction row* is followed so a reset auction appears.
  - **A change signal during an in-flight read re-runs the read afterwards.** Without this, a write that lands after the read's final version check would only show at the next poll (10 s).
  - Refetch on socket reconnect, tab visible again, and the browser's `online` event; `offline` shows immediately.
  - Poll interval: 10 s with realtime, 2 s without. `VITE_IPL_AUCTION_REALTIME=off` turns realtime off (polling only), as a quick fallback on the day.
  - The socket is closed 1 s after the last listener leaves, so page changes and React StrictMode double-mounts don't reconnect.
  - New `connection` member (`{ status, lastSyncAt }`), contract §8.
- `hooks/useConnectionStatus.js` + `ConnectionIndicator` in the shared `AuctionHeader` (Live / Connecting… / Reconnecting… / Offline; hidden for the local adapter). Phase 8 restyles it.
- Tests: 159/159 (14 new in `realtime.test.js`). Build passes.

**Verified live (read-only, 2026-09-28):** an anonymous socket to the dev project accepts all 10 channels (`user: null`), so team screens need no login to listen (tables are `read("any")`).

**Verified live (2026-09-29, dev database, no-op writes):**
- A **TablesDB transaction commit emits row events**, about 1 ms after the commit returns, exactly like a plain update. Each event carries both channel names the adapter subscribes to (`databases.<db>.tables.<t>.rows` and `databases.<db>.collections.<t>.documents`), plus `tablesdb.<db>.tables.<t>.rows`. Probe: an anonymous socket, then one team row rewritten with its own name, once as a plain update and once through a transaction.
- **Refetch cost** (the real adapter, anonymous, from India to the Frankfurt endpoint): 700–860 ms steady, 1.1–1.5 s for the first two (cold connection). Event → updated screen ≈ 100 ms debounce + one refetch ≈ **0.8–1.0 s**. The read is 3 round trips (auction row → 4 parallel lists → version check). If the venue network makes this too slow, the optional fast path below is the next step.

**Live run to do**
1. `npm run dev` with `VITE_IPL_AUCTION_ADAPTER=appwrite`; admin on one device, team pages on others.
2. Header should show `● Live`. Open a lot / sell: team screens update in about a second. Note the worst delay here.
3. Turn Wi-Fi off on a team device for 30 s → `Offline` / `Reconnecting…`; turn it on → correct state without reload.

**Not done (optional):** the "fast path" (applying the auction row payload directly). The refetch is a handful of small reads; add it only if the measured delay is too high.
