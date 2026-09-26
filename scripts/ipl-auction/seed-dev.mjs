/**
 * Loads a fresh auction built from the FICTIONAL mock teams and players into the
 * IPL dev database.
 *
 *   npm run ipl:seed              refuses if IPL rows already exist
 *   npm run ipl:seed -- --reset   first deletes EVERY row in the IPL tables (dev only)
 *
 * Rows are written through the same mapper the app uses (diffToWrites from an
 * empty database), so the seed always matches the schema.
 */
import { TABLES } from "../../src/lib/iplAuction/repository/appwriteSchema.js";
import { diffToWrites } from "../../src/lib/iplAuction/repository/appwriteMapper.js";
import { createMockAuctionState } from "../../src/lib/iplAuction/repository/mockSeed.js";
import { createRestClient, listAll, query, readScriptEnv } from "./appwriteRest.mjs";

const env = readScriptEnv();
const call = createRestClient(env);
const db = `/tablesdb/${encodeURIComponent(env.databaseId)}`;
const reset = process.argv.includes("--reset");
const log = (...args) => console.log(...args);

async function hasRows(tableId) {
  const { total } = await call("GET", `${db}/tables/${tableId}/rows`, { queries: [query.limit(1)] });
  return total > 0;
}

async function deleteAllRows(tableId) {
  const rows = await listAll(call, `${db}/tables/${tableId}/rows`, "rows");
  for (const row of rows) await call("DELETE", `${db}/tables/${tableId}/rows/${row.$id}`);
  log(`- deleted ${rows.length} rows from ${tableId}`);
}

log(`IPL Auction seed → project ${env.projectId} · database ${env.databaseId}`);

const tables = Object.values(TABLES);
const nonEmpty = [];
for (const tableId of tables) if (await hasRows(tableId)) nonEmpty.push(tableId);

if (nonEmpty.length && !reset) {
  log(`IPL tables already have rows (${nonEmpty.join(", ")}). Re-run with --reset to wipe them first.`);
  process.exit(1);
}
if (reset) for (const tableId of tables) await deleteAllRows(tableId);

const state = createMockAuctionState();
const writes = diffToWrites(null, state);
for (const write of writes) {
  await call("POST", `${db}/tables/${write.tableId}/rows`, {
    body: { rowId: write.rowId ?? "unique()", data: write.data },
  });
}

log(`+ wrote ${writes.length} rows: auction "${state.name}" (${state.auctionId}), ` +
  `${state.teamOrder.length} teams, ${state.playerOrder.length} players — all FICTIONAL.`);
log(`Point the app at it with VITE_IPL_AUCTION_ADAPTER=appwrite (see scripts/ipl-auction/README.md).`);
