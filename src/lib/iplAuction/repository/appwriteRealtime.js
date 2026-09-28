/**
 * Appwrite Realtime source for the IPL Auction (Phase 6).
 *
 * The adapter treats realtime events only as "something changed" signals and
 * refetches the whole auction, so this file does not interpret payloads beyond
 * saying which auction a row belongs to.
 *
 * A realtime source is `{ subscribe(channels, onEvent, onStatus) → unsubscribe }`:
 * - onEvent({ tableId, auctionId, events }) for every row change on `channels`;
 * - onStatus("connecting" | "open" | "closed") whenever the socket changes state
 *   (the SDK reconnects on its own; "open" after "closed" means reconnected).
 * Tests inject a fake source with the same shape.
 */
import { TABLES } from "./appwriteSchema.js";

const ALL_TABLES = Object.values(TABLES);

/**
 * Channels for every IPL table. TablesDB rows are announced on the `tables…rows`
 * channel; the legacy `collections…documents` name is kept as a fallback because
 * the server version decides which one fires. Duplicate events are harmless: they
 * only schedule the same (debounced) refetch.
 */
export function realtimeChannels(databaseId) {
  return ALL_TABLES.flatMap((tableId) => [
    `databases.${databaseId}.tables.${tableId}.rows`,
    `databases.${databaseId}.collections.${tableId}.documents`,
  ]);
}

/** Which IPL table a channel list refers to (null if none). */
function tableFromChannels(channels = []) {
  for (const channel of channels) {
    const match = /^databases\.[^.]+\.(?:tables|collections)\.([^.]+)\./.exec(channel);
    if (match && ALL_TABLES.includes(match[1])) return match[1];
  }
  return null;
}

/** Normalises an SDK event into what the adapter needs. */
export function toAuctionEvent(message) {
  const tableId = tableFromChannels(message?.channels);
  const payload = message?.payload ?? {};
  const auctionId = tableId === TABLES.AUCTIONS ? payload.$id ?? null : payload.auctionId ?? null;
  return { tableId, auctionId, events: message?.events ?? [] };
}

/**
 * Wraps the SDK's `Realtime` service. Its onOpen/onClose callbacks cannot be
 * removed, so they are registered once and fanned out to current subscribers.
 */
export function createAppwriteRealtimeSource({ realtime, onError = (error) => console.warn("[IPL Auction] Realtime:", error) }) {
  const statusListeners = new Set();
  const emit = (status) => statusListeners.forEach((listener) => listener(status));
  realtime.onOpen(() => emit("open"));
  realtime.onClose(() => emit("closed"));

  return {
    subscribe(channels, onEvent, onStatus = () => {}) {
      let closed = false;
      let subscription = null;
      statusListeners.add(onStatus);
      onStatus("connecting");

      realtime
        .subscribe(channels, (message) => {
          if (!closed) onEvent(toAuctionEvent(message));
        })
        .then((sub) => {
          subscription = sub;
          if (closed) sub.close().catch(() => {});
        })
        .catch((error) => {
          // The SDK keeps retrying on its own; polling covers the gap meanwhile.
          onError(error);
          if (!closed) onStatus("closed");
        });

      return () => {
        closed = true;
        statusListeners.delete(onStatus);
        subscription?.close().catch(() => {});
      };
    },
  };
}
