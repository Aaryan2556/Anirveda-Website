/**
 * Player profile fields shared by the admin editor, the bulk importer and the
 * exports. Descriptive only: the engine (normalizePlayer) decides what is valid.
 */

/** Statistic groups stored under `player.stats[group]`. */
export const STAT_GROUPS = Object.freeze({
  batting: Object.freeze({
    label: "Batting",
    fields: ["matches", "innings", "runs", "average", "strikeRate", "fifties", "hundreds", "highestScore"],
  }),
  bowling: Object.freeze({
    label: "Bowling",
    fields: ["matches", "innings", "wickets", "economy", "average", "strikeRate", "bestBowling"],
  }),
  keeping: Object.freeze({
    label: "Keeping",
    fields: ["catches", "stumpings"],
  }),
});

export const STAT_FIELD_LABELS = Object.freeze({
  matches: "Matches",
  innings: "Innings",
  runs: "Runs",
  average: "Average",
  strikeRate: "Strike rate",
  fifties: "50s",
  hundreds: "100s",
  highestScore: "Highest score",
  wickets: "Wickets",
  economy: "Economy",
  bestBowling: "Best bowling",
  catches: "Catches",
  stumpings: "Stumpings",
});

/** Suggested `dataSource` values. Anything else is free text naming a verified source. */
export const DATA_SOURCES = Object.freeze({
  FICTIONAL: "FICTIONAL",
  MANUAL_ENTRY: "MANUAL_ENTRY",
});

export const isFictional = (player) => player?.dataSource === DATA_SOURCES.FICTIONAL;

/**
 * Text values that look like plain numbers become numbers ("36.1" → 36.1);
 * anything else ("112*", "4/18") stays text. Empty → null.
 */
export function parseStatValue(value) {
  if (value == null) return null;
  if (typeof value === "number") return value;
  const text = String(value).trim();
  if (!text) return null;
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : text;
}

/** Drops empty values and empty groups; returns null when nothing is left. */
export function compactStats(stats) {
  if (!stats) return null;
  const result = {};
  for (const [group, values] of Object.entries(stats)) {
    if (!values || typeof values !== "object") continue;
    const kept = Object.fromEntries(
      Object.entries(values)
        .map(([key, value]) => [key, parseStatValue(value)])
        .filter(([, value]) => value !== null)
    );
    if (Object.keys(kept).length) result[group] = kept;
  }
  return Object.keys(result).length ? result : null;
}
