/**
 * Bulk player import (CSV or JSON) for the admin page.
 *
 *   parsePlayerImport(text)                         -> { rows, error }
 *   planPlayerImport(state, rows, { dataSource, makeId }) -> [{ line, name, command?, error?, warnings }]
 *
 * Parsing only turns text into player-shaped objects. Whether a row is VALID is
 * decided by the engine: planPlayerImport dry-runs one ADD_PLAYER per row, in
 * order, against a working copy of the state, so the admin sees every row's
 * result before anything is saved. The page then dispatches the planned
 * commands one at a time (each still re-validated by the adapter).
 *
 * Data honesty: every row needs a `dataSource` (from the row or the default the
 * admin picks). Fictional rows are labelled FICTIONAL wherever they are shown.
 */
import { ROLES } from "../config.js";
import { ACTOR_ROLES, COMMANDS, reduce } from "../engine/index.js";
import { STAT_GROUPS, compactStats } from "../playerFields.js";

const ROLE_ALIASES = {
  batter: ROLES.BATTER,
  batsman: ROLES.BATTER,
  bat: ROLES.BATTER,
  bowler: ROLES.BOWLER,
  bowl: ROLES.BOWLER,
  allrounder: ROLES.ALL_ROUNDER,
  ar: ROLES.ALL_ROUNDER,
  wicketkeeper: ROLES.WICKETKEEPER,
  keeper: ROLES.WICKETKEEPER,
  wk: ROLES.WICKETKEEPER,
  wicketkeeperbatter: ROLES.WICKETKEEPER,
};

/** Canonical column name for each accepted header (compared without case, spaces, "_" or "-"). */
const COLUMN_ALIASES = {
  name: "name",
  playername: "name",
  role: "role",
  baseprice: "basePrice",
  base: "basePrice",
  basepricelakhs: "basePrice",
  isoverseas: "isOverseas",
  overseas: "isOverseas",
  nationality: "nationality",
  country: "nationality",
  age: "age",
  battingstyle: "battingStyle",
  bowlingstyle: "bowlingStyle",
  image: "image",
  imageurl: "image",
  datasource: "dataSource",
  source: "dataSource",
  recentperformance: "recentPerformance",
  recent: "recentPerformance",
};

const squash = (text) => String(text).toLowerCase().replace(/[\s_-]/g, "");

function toRole(value) {
  if (value == null) return value;
  const text = String(value).trim();
  if (Object.values(ROLES).includes(text)) return text;
  return ROLE_ALIASES[squash(text)] ?? text;
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  const text = squash(value ?? "");
  if (["true", "yes", "y", "1", "overseas"].includes(text)) return true;
  if (["false", "no", "n", "0", ""].includes(text)) return false;
  return value; // left as-is so the engine reports it
}

/** Whole numbers stay numbers; anything else is passed through for the engine to reject. */
function toInteger(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return value;
  const text = String(value).trim().replace(/,/g, "");
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : text;
}

function toList(value) {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value.map(String);
  return String(value).split(/[|;]/).map((entry) => entry.trim()).filter(Boolean);
}

/** Converts one loose record (a CSV row or JSON object) into ADD_PLAYER input, minus the id. */
function toPlayerInput(record) {
  const fields = {};
  const stats = {};
  for (const [key, value] of Object.entries(record)) {
    const dot = key.indexOf(".");
    if (dot > 0) {
      const group = key.slice(0, dot).trim().toLowerCase();
      if (STAT_GROUPS[group]) {
        (stats[group] ??= {})[key.slice(dot + 1).trim()] = value;
        continue;
      }
    }
    if (key === "stats" && value && typeof value === "object") {
      for (const [group, values] of Object.entries(value)) stats[group] = { ...stats[group], ...values };
      continue;
    }
    const column = COLUMN_ALIASES[squash(key)];
    if (column) fields[column] = value;
  }
  const text = (value) => (value == null || String(value).trim() === "" ? null : String(value).trim());
  return {
    name: text(fields.name) ?? "",
    role: toRole(fields.role),
    basePrice: toInteger(fields.basePrice),
    isOverseas: toBoolean(fields.isOverseas),
    nationality: text(fields.nationality),
    battingStyle: text(fields.battingStyle),
    bowlingStyle: text(fields.bowlingStyle),
    image: text(fields.image),
    dataSource: text(fields.dataSource),
    recentPerformance: toList(fields.recentPerformance),
    stats: compactStats(stats),
  };
}

/** RFC 4180-style CSV: quoted fields, "" escapes, commas and newlines inside quotes. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field.trim().toLowerCase() === "null" ? "" : field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field.trim().toLowerCase() === "null" ? "" : field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length) {
    row.push(field.trim().toLowerCase() === "null" ? "" : field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

/**
 * Parses CSV (header row required) or JSON (an array of players, or
 * { players: [...] }). Returns rows of { line, input } where `line` is the
 * 1-based source line (CSV) or item number (JSON), or a top-level `error`.
 */
export function parsePlayerImport(text) {
  const source = String(text ?? "").replace(/^﻿/, "").trim();
  if (!source) return { rows: [], error: "Nothing to import." };

  if (source.startsWith("[") || source.startsWith("{")) {
    let data;
    try {
      data = JSON.parse(source);
    } catch (error) {
      return { rows: [], error: `Invalid JSON: ${error.message}` };
    }
    const list = Array.isArray(data) ? data : data?.players;
    if (!Array.isArray(list)) return { rows: [], error: "JSON must be an array of players or { players: [...] }." };
    return {
      rows: list.map((record, index) => ({
        line: index + 1,
        input: record && typeof record === "object" ? toPlayerInput(record) : null,
      })),
      error: null,
    };
  }

  const [header, ...body] = parseCsv(source);
  const columns = header.map((name) => name.trim());
  if (!columns.some((name) => COLUMN_ALIASES[squash(name)] === "name")) {
    return { rows: [], error: 'CSV needs a header row with at least a "name" column.' };
  }
  return {
    rows: body.map((cells, index) => ({
      line: index + 2,
      input: toPlayerInput(Object.fromEntries(columns.map((name, i) => [name, cells[i] ?? ""]))),
    })),
    error: null,
  };
}

/**
 * Dry-runs every row through the engine (ADD_PLAYER, in order) and returns the
 * plan: rows with a ready `command`, or an `error`. `dataSource` fills rows that
 * have none; a row with neither is rejected. Warnings flag likely duplicates by
 * name (same name already in the pool or earlier in the file) without blocking.
 */
export function planPlayerImport(state, rows, { dataSource = null, makeId }) {
  const admin = { role: ACTOR_ROLES.ADMIN };
  const seenNames = new Set(Object.values(state.players).map((player) => player.name.trim().toLowerCase()));
  let working = state;
  return rows.map(({ line, input }) => {
    const name = input?.name ?? "";
    const warnings = [];
    if (!input) return { line, name, error: "Row is not an object.", warnings };
    const source = input.dataSource ?? dataSource;

    const key = name.trim().toLowerCase();
    if (key && seenNames.has(key)) warnings.push("A player with this name already exists.");

    const command = { type: COMMANDS.ADD_PLAYER, player: { ...input, id: makeId("player"), dataSource: source } };
    const result = reduce(working, { ...command, actor: admin });
    if (!result.ok) return { line, name, error: result.error.message, warnings };
    working = result.state;
    if (key) seenNames.add(key);
    return { line, name, command, warnings };
  });
}
