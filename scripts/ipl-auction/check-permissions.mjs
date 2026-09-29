/**
 * Phase 7 permission check for the IPL database. Leaves nothing behind: probes
 * use throwaway rows under a fake auction ID ("perm-probe"), made and removed
 * with the server key; real auction rows are never written.
 *
 *   npm run ipl:check
 *
 * 1. With the server key: every IPL table has exactly TABLE_PERMISSIONS, row
 *    security off, and is enabled.
 * 2. Without any key or session (what a team screen or a stranger has): reads
 *    work; creating, changing and deleting rows, directly or in a transaction,
 *    are refused.
 * 3. No VITE_ variable holds the server API key.
 *
 * Exits with code 1 if anything fails. Run it against the dev database now and
 * against the production database before the event.
 */
import { SCHEMA, TABLE_PERMISSIONS } from "../../src/lib/iplAuction/repository/appwriteSchema.js";
import { createRestClient, query, readScriptEnv } from "./appwriteRest.mjs";

const env = readScriptEnv();
const call = createRestClient(env);
const db = `/tablesdb/${encodeURIComponent(env.databaseId)}`;
const base = env.endpoint.replace(/\/$/, "");
const failures = [];
const pass = (message) => console.log(`  ✓ ${message}`);
const fail = (message) => {
  failures.push(message);
  console.log(`  ✗ ${message}`);
};

/** A request with only the project header: no API key, no session. */
async function anonymous(method, path, body) {
  const response = await fetch(base + path, {
    method,
    headers: { "X-Appwrite-Project": env.projectId, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  await response.text();
  return response.status;
}

async function anonymousJson(method, path, body) {
  const response = await fetch(base + path, {
    method,
    headers: { "X-Appwrite-Project": env.projectId, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

const refused = (status) => status === 401 || status === 403;

/**
 * A schema-valid row that belongs to no real auction (auctionId "perm-probe";
 * an auction probe row is dated 0 so it is never the newest). Appwrite checks
 * the body and the row's existence before permissions, so probes must be valid.
 */
const PROBE_AUCTION_ID = "perm-probe";
function probeData(table) {
  const data = {};
  for (const column of table.columns) {
    if (!column.required) continue;
    if (column.type === "integer") data[column.key] = column.key === "createdAtMs" ? 0 : Math.max(column.min ?? 0, 1);
    else if (column.type === "boolean") data[column.key] = false;
    else if (column.type === "enum") data[column.key] = column.elements[0];
    else data[column.key] = column.key === "auctionId" ? PROBE_AUCTION_ID : "probe";
  }
  return data;
}
const probeId = (tag) => `perm-probe-${tag}-${Date.now().toString(36)}`;

console.log(`IPL Auction permission check → project ${env.projectId} · database ${env.databaseId}\n`);

console.log("Table settings");
const expected = JSON.stringify([...TABLE_PERMISSIONS].sort());
for (const { id: tableId } of SCHEMA) {
  const table = await call("GET", `${db}/tables/${tableId}`);
  const actual = JSON.stringify([...(table.$permissions ?? [])].sort());
  if (actual !== expected) fail(`${tableId}: permissions are ${actual}, expected ${expected} (run npm run ipl:setup)`);
  else if (table.rowSecurity) fail(`${tableId}: row security is on; rows could carry their own write permissions`);
  else if (!table.enabled) fail(`${tableId}: table is disabled`);
  else pass(`${tableId}: read any, write only label ipladmin, row security off`);
}

console.log("\nAnonymous client (no key, no session)");
for (const table of SCHEMA) {
  const tableId = table.id;
  const rowsPath = `${db}/tables/${tableId}/rows`;
  const data = probeData(table);

  const readStatus = await anonymous("GET", `${rowsPath}?queries[]=${encodeURIComponent(query.limit(1))}`);
  if (readStatus === 200) pass(`${tableId}: read allowed`);
  else fail(`${tableId}: read returned ${readStatus}; team screens need read access`);

  const createId = probeId("c");
  const createStatus = await anonymous("POST", rowsPath, { rowId: createId, data });
  if (refused(createStatus)) pass(`${tableId}: create refused (${createStatus})`);
  else {
    fail(`${tableId}: create returned ${createStatus}`);
    if (createStatus < 300) await call("DELETE", `${rowsPath}/${createId}`).catch(() => {});
  }

  // A throwaway row made with the server key, so update/delete reach the permission check.
  // The update must really change a value: Appwrite answers 200 to a no-change update
  // without checking permissions (and without writing anything).
  const targetId = probeId("t");
  await call("POST", rowsPath, { body: { rowId: targetId, data } });
  try {
    const changeKey = Object.keys(data).find((key) => data[key] === "probe");
    const updateStatus = await anonymous("PATCH", `${rowsPath}/${targetId}`, { data: { [changeKey]: "changed" } });
    const stored = await call("GET", `${rowsPath}/${targetId}`);
    if (refused(updateStatus) && stored[changeKey] === "probe") pass(`${tableId}: update refused (${updateStatus})`);
    else fail(`${tableId}: update returned ${updateStatus}; stored ${changeKey} is now "${stored[changeKey]}"`);

    const deleteStatus = await anonymous("DELETE", `${rowsPath}/${targetId}`);
    if (refused(deleteStatus)) pass(`${tableId}: delete refused (${deleteStatus})`);
    else fail(`${tableId}: delete returned ${deleteStatus}`);
  } finally {
    await call("DELETE", `${rowsPath}/${targetId}`).catch(() => {});
  }
}

// The app writes through transactions, so check that path too. Appwrite lets a guest
// open a transaction, but it must not be able to stage into it or commit a write.
{
  const table = SCHEMA.find(({ id }) => id !== "ipl_auctions");
  const rowsPath = `${db}/tables/${table.id}/rows`;
  const rowId = probeId("x");
  const transaction = await anonymousJson("POST", "/tablesdb/transactions", { ttl: 60 });
  if (transaction.$id) {
    const path = `/tablesdb/transactions/${transaction.$id}`;
    await anonymous("POST", `${path}/operations`, {
      operations: [{ action: "create", databaseId: env.databaseId, tableId: table.id, rowId, data: probeData(table) }],
    });
    const commitStatus = await anonymous("PATCH", path, { commit: true });
    if (commitStatus >= 300) await anonymous("PATCH", path, { rollback: true });
  }
  const written = await call("GET", `${rowsPath}/${rowId}`).then(() => true, () => false);
  if (written) {
    fail(`transactions: an anonymous transaction created ${table.id}/${rowId}`);
    await call("DELETE", `${rowsPath}/${rowId}`).catch(() => {});
  } else pass("transactions: an anonymous transaction cannot write");
}

console.log("\nSecrets");
const leaked = Object.entries(process.env).filter(([key, value]) => key.startsWith("VITE_") && value && value === env.apiKey);
if (leaked.length) fail(`the server API key is in ${leaked.map(([key]) => key).join(", ")}; VITE_ values are shipped to every browser`);
else pass("the server API key is not in any VITE_ variable");

console.log(failures.length ? `\n${failures.length} check(s) FAILED.` : "\nAll checks passed.");
process.exit(failures.length ? 1 : 0);
