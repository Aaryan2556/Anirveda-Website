/**
 * Local (browser-only) auction repository.
 *
 * Repository contract — every adapter (this one, and the future Appwrite one)
 * exposes the same shape so pages and hooks never know which is in use:
 *
 *   getSnapshot(): AuctionState            current state (stable reference between changes)
 *   subscribe(listener): () => void        called after every state change
 *   dispatch(command): Promise<Result>     runs the command; resolves to the engine result
 *   reset(): Promise<void>                 replaces the auction with a fresh seed
 *   destroy(): void                        releases channels/listeners
 *
 * How this adapter keeps several tabs consistent:
 * - localStorage holds the authoritative state for this browser.
 * - Commands run inside a Web Lock, so only one tab at a time reads → reduces → writes.
 *   (This mirrors what a server will do later: serialize commands against the latest state.)
 * - After a write, the new state is broadcast over BroadcastChannel to the other tabs.
 */
import { SCHEMA_VERSION, reduce } from "../engine/index.js";

export const LOCAL_STORAGE_KEY = "iplAuction.local.v1";

/** True when `candidate` is a later state than `current` (a newer reset, or a higher version). */
function isNewer(candidate, current) {
  if (!current) return true;
  if (candidate.createdAt !== current.createdAt) return candidate.createdAt > current.createdAt;
  if (candidate.auctionId !== current.auctionId) return true;
  return candidate.version > current.version;
}

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Serializes calls across tabs with Web Locks when available, and within this tab always. */
function createExclusiveRunner(locks, name) {
  let tail = Promise.resolve();
  return (fn) => {
    const run = locks?.request ? () => locks.request(name, () => fn()) : () => fn();
    const result = tail.then(run, run);
    tail = result.catch(() => {});
    return result;
  };
}

export function createLocalRepository({
  createSeedState,
  storage = defaultStorage(),
  storageKey = LOCAL_STORAGE_KEY,
  channelName = storageKey,
  BroadcastChannelImpl = globalThis.BroadcastChannel,
  locks = globalThis.navigator?.locks,
  now = () => Date.now(),
}) {
  if (typeof createSeedState !== "function") throw new Error("createLocalRepository: createSeedState is required.");

  const listeners = new Set();
  const channel = BroadcastChannelImpl ? new BroadcastChannelImpl(channelName) : null;
  const runExclusive = createExclusiveRunner(locks, storageKey);

  function readStored() {
    try {
      const raw = storage?.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.schemaVersion === SCHEMA_VERSION ? parsed : null;
    } catch {
      return null;
    }
  }

  function writeStored(next) {
    try {
      storage?.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Storage full or blocked: the in-memory state and broadcast still work for this session.
    }
  }

  function setState(next) {
    state = next;
    listeners.forEach((listener) => listener());
  }

  function publish(next) {
    writeStored(next);
    setState(next);
    channel?.postMessage({ type: "STATE", state: next });
  }

  let state = readStored();
  if (!state) {
    state = createSeedState();
    writeStored(state);
  }

  if (channel) {
    channel.onmessage = (event) => {
      const message = event.data;
      if (message?.type === "STATE" && message.state && isNewer(message.state, state)) setState(message.state);
    };
  }

  return {
    getSnapshot: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    dispatch(command) {
      return runExclusive(() => {
        // Inside the lock, storage is the source of truth (another tab may have just written).
        const latest = readStored() ?? state;
        if (latest !== state && isNewer(latest, state)) setState(latest);
        const result = reduce(latest, { ...command, at: command.at ?? now() });
        if (result.ok) publish(result.state);
        return result;
      });
    },

    reset() {
      return runExclusive(() => {
        publish(createSeedState());
      });
    },

    destroy() {
      listeners.clear();
      channel?.close();
    },
  };
}
