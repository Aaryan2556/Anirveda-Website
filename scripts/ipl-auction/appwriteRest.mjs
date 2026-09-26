/**
 * Minimal Appwrite REST client for the IPL Auction dev scripts (server API key).
 * Uses Node's built-in fetch, so no extra dependency is needed.
 *
 * Credentials come from environment variables, normally loaded from the
 * git-ignored file `.env.ipl.local` via `node --env-file`. Never commit them and
 * never put the API key in a VITE_ variable.
 */

export function readScriptEnv() {
  const env = {
    endpoint: process.env.APPWRITE_ENDPOINT,
    projectId: process.env.APPWRITE_PROJECT_ID,
    apiKey: process.env.APPWRITE_API_KEY,
    databaseId: process.env.IPL_AUCTION_DATABASE_ID,
    // The existing (MockRBI) database, if known, so the scripts can refuse to touch it.
    protectedDatabaseId: process.env.VITE_APPWRITE_DATABASE_ID || process.env.PROTECTED_DATABASE_ID,
  };
  const missing = Object.entries({
    APPWRITE_ENDPOINT: env.endpoint,
    APPWRITE_PROJECT_ID: env.projectId,
    APPWRITE_API_KEY: env.apiKey,
    IPL_AUCTION_DATABASE_ID: env.databaseId,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    throw new Error(`Missing ${missing.join(", ")}. Put them in .env.ipl.local (see scripts/ipl-auction/README.md).`);
  }
  if (env.protectedDatabaseId && env.databaseId === env.protectedDatabaseId) {
    throw new Error("IPL_AUCTION_DATABASE_ID is the existing site database. Use a separate IPL dev database.");
  }
  return env;
}

export class AppwriteError extends Error {
  constructor(message, { status, type }) {
    super(message);
    this.status = status;
    this.type = type;
  }
}

/** Appwrite list queries are JSON strings passed as queries[]. */
export const query = {
  limit: (n) => JSON.stringify({ method: "limit", values: [n] }),
  cursorAfter: (id) => JSON.stringify({ method: "cursorAfter", values: [id] }),
};

export function createRestClient({ endpoint, projectId, apiKey }) {
  const base = endpoint.replace(/\/$/, "");
  return async function call(method, path, { body, queries } = {}) {
    const url = new URL(base + path);
    for (const q of queries ?? []) url.searchParams.append("queries[]", q);
    const response = await fetch(url, {
      method,
      headers: {
        "X-Appwrite-Project": projectId,
        "X-Appwrite-Key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    const json = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new AppwriteError(`${method} ${path} → ${response.status} ${json?.type ?? ""}: ${json?.message ?? text}`, {
        status: response.status,
        type: json?.type,
      });
    }
    return json;
  };
}

export const isNotFound = (error) => error instanceof AppwriteError && error.status === 404;

/** Lists every item of a paged endpoint (`key` is "rows", "columns", …). */
export async function listAll(call, path, key, pageSize = 100) {
  const items = [];
  let cursor = null;
  for (;;) {
    const queries = [query.limit(pageSize)];
    if (cursor) queries.push(query.cursorAfter(cursor));
    const page = await call("GET", path, { queries });
    const batch = page[key] ?? [];
    items.push(...batch);
    if (batch.length < pageSize) return items;
    cursor = batch[batch.length - 1].$id ?? batch[batch.length - 1].key;
  }
}
