/**
 * Creates the IPL Auction schema (database, tables, columns, indexes) in the
 * Appwrite database named by IPL_AUCTION_DATABASE_ID.
 *
 *   npm run ipl:setup            (reads .env.ipl.local)
 *
 * Safe to run repeatedly: it creates what is missing, brings table permissions
 * in line with the schema, and reports any existing column or index that
 * differs (columns and indexes are never altered or deleted). Refuses to run
 * against the existing site database.
 */
import { SCHEMA, TABLE_PERMISSIONS } from "../../src/lib/iplAuction/repository/appwriteSchema.js";
import { createRestClient, isNotFound, query, readScriptEnv } from "./appwriteRest.mjs";

const COLUMN_WAIT_MS = 1000;
const COLUMN_WAIT_ATTEMPTS = 60;

const env = readScriptEnv();
const call = createRestClient(env);
const db = `/tablesdb/${encodeURIComponent(env.databaseId)}`;
const log = (...args) => console.log(...args);
const warnings = [];

/**
 * Text columns: servers from 1.9 use sized varchar / text types; older ones only
 * have "string". Try the new type, fall back to "string" if the route is missing.
 */
function textColumnRoute(size) {
  if (size <= 1000) return { type: "varchar", body: { size } };
  if (size <= 16000) return { type: "text", body: {} };
  return { type: "mediumtext", body: {} };
}

async function createColumn(tablePath, column) {
  const { key, type, required } = column;
  if (type === "string") {
    const route = textColumnRoute(column.size);
    try {
      return await call("POST", `${tablePath}/columns/${route.type}`, { body: { key, required, ...route.body } });
    } catch (error) {
      if (!isNotFound(error) || error.type !== "general_route_not_found") throw error;
      return call("POST", `${tablePath}/columns/string`, { body: { key, size: column.size, required } });
    }
  }
  if (type === "integer") {
    return call("POST", `${tablePath}/columns/integer`, { body: { key, required, min: column.min, max: column.max } });
  }
  if (type === "boolean") return call("POST", `${tablePath}/columns/boolean`, { body: { key, required } });
  if (type === "enum") {
    return call("POST", `${tablePath}/columns/enum`, { body: { key, required, elements: column.elements } });
  }
  throw new Error(`Unsupported column type ${type}`);
}

function describeMismatch(existing, column) {
  const problems = [];
  if (existing.required !== column.required) problems.push(`required ${existing.required} ≠ ${column.required}`);
  if (column.type === "enum" && JSON.stringify(existing.elements) !== JSON.stringify(column.elements)) {
    problems.push(`elements ${JSON.stringify(existing.elements)} ≠ ${JSON.stringify(column.elements)}`);
  }
  if (column.type === "integer" && existing.type !== "integer") problems.push(`type ${existing.type} ≠ integer`);
  if (column.type === "boolean" && existing.type !== "boolean") problems.push(`type ${existing.type} ≠ boolean`);
  return problems;
}

async function listColumns(tablePath) {
  const { columns } = await call("GET", `${tablePath}/columns`, { queries: [query.limit(100)] });
  return columns;
}

async function waitForColumns(tablePath) {
  for (let attempt = 0; attempt < COLUMN_WAIT_ATTEMPTS; attempt += 1) {
    const columns = await listColumns(tablePath);
    const failed = columns.filter((c) => c.status === "failed");
    if (failed.length) throw new Error(`Columns failed: ${failed.map((c) => `${c.key} (${c.error})`).join(", ")}`);
    if (columns.every((c) => c.status === "available")) return;
    await new Promise((resolve) => setTimeout(resolve, COLUMN_WAIT_MS));
  }
  throw new Error(`Timed out waiting for columns of ${tablePath} to become available.`);
}

async function ensureDatabase() {
  try {
    await call("GET", db);
    log(`✓ database ${env.databaseId} exists`);
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await call("POST", "/tablesdb", { body: { databaseId: env.databaseId, name: "IPL Auction (dev)" } });
    log(`+ created database ${env.databaseId}`);
  }
}

async function ensureTable(table) {
  const tablePath = `${db}/tables/${table.id}`;
  try {
    const existingTable = await call("GET", tablePath);
    log(`✓ table ${table.id}`);
    const current = [...(existingTable.$permissions ?? [])].sort();
    if (JSON.stringify(current) !== JSON.stringify([...TABLE_PERMISSIONS].sort()) || existingTable.rowSecurity) {
      await call("PUT", tablePath, {
        body: { name: existingTable.name, permissions: TABLE_PERMISSIONS, rowSecurity: false, enabled: true },
      });
      log(`  ~ permissions set to ${TABLE_PERMISSIONS.join(", ")}`);
    }
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await call("POST", `${db}/tables`, {
      body: { tableId: table.id, name: table.name, permissions: TABLE_PERMISSIONS, rowSecurity: false },
    });
    log(`+ created table ${table.id}`);
  }

  const existing = new Map((await listColumns(tablePath)).map((c) => [c.key, c]));
  for (const column of table.columns) {
    const found = existing.get(column.key);
    if (!found) {
      await createColumn(tablePath, column);
      log(`  + column ${column.key} (${column.type})`);
    } else {
      const problems = describeMismatch(found, column);
      if (problems.length) warnings.push(`${table.id}.${column.key}: ${problems.join("; ")}`);
    }
  }
  await waitForColumns(tablePath);

  const { indexes } = await call("GET", `${tablePath}/indexes`, { queries: [query.limit(100)] });
  const existingIndexes = new Map(indexes.map((i) => [i.key, i]));
  for (const index of table.indexes) {
    const found = existingIndexes.get(index.key);
    if (!found) {
      await call("POST", `${tablePath}/indexes`, { body: index });
      log(`  + index ${index.key} (${index.type}: ${index.columns.join(", ")})`);
    } else if (found.type !== index.type || JSON.stringify(found.columns) !== JSON.stringify(index.columns)) {
      warnings.push(`${table.id} index ${index.key}: exists as ${found.type}(${found.columns}) — expected ${index.type}(${index.columns})`);
    }
  }
}

log(`IPL Auction schema → ${env.endpoint} · project ${env.projectId} · database ${env.databaseId}`);
await ensureDatabase();
for (const table of SCHEMA) await ensureTable(table);

if (warnings.length) {
  log("\n⚠ Existing items differ from the schema (not changed automatically):");
  for (const warning of warnings) log(`  - ${warning}`);
  process.exitCode = 1;
} else {
  log("\nSchema is up to date.");
}
