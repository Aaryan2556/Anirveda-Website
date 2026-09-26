/**
 * IPL Auction rule configuration.
 *
 * Every rule the engine enforces is read from an auction's `config` object —
 * nothing below is hardcoded into the engine. All money values are whole lakhs
 * (₹1 Cr = 100 lakhs).
 */

export const ROLES = Object.freeze({
  BATTER: "BATTER",
  BOWLER: "BOWLER",
  ALL_ROUNDER: "ALL_ROUNDER",
  WICKETKEEPER: "WICKETKEEPER",
});

export const ROLE_LIST = Object.freeze(Object.values(ROLES));

export const ROLE_LABELS = Object.freeze({
  BATTER: "Batter",
  BOWLER: "Bowler",
  ALL_ROUNDER: "All-rounder",
  WICKETKEEPER: "Wicketkeeper",
});

/**
 * TEMPORARY DEVELOPMENT DEFAULTS — NOT THE FINAL EVENT RULES.
 *
 * Deliberately small so the limits are actually reachable while simulating
 * locally with the 4 mock teams and 30 mock players. Replace these (or pass a
 * different config to createInitialState) once the real event rules are set.
 *
 * Shape reference:
 * - initialPurse:            purse per team, in lakhs
 * - squad.min / squad.max:   squad size limits
 * - maxOverseas:             max overseas players per team (null = no limit)
 * - roleLimits[ROLE]:        { min, max } per role (max null = no limit)
 * - minimumReserve:          when enabled, a team must keep `perSlot` lakhs for
 *                            every squad slot still needed to reach squad.min
 * - allowUnsoldRelist:       whether UNSOLD players can be put up again
 * - undoDepth:               how many actions the admin can undo
 */
export const DEV_DEFAULT_CONFIG = Object.freeze({
  initialPurse: 2500,
  squad: { min: 5, max: 8 },
  maxOverseas: 3,
  roleLimits: {
    BATTER: { min: 1, max: 4 },
    BOWLER: { min: 1, max: 4 },
    ALL_ROUNDER: { min: 0, max: 3 },
    WICKETKEEPER: { min: 1, max: 2 },
  },
  minimumReserve: { enabled: true, perSlot: 20 },
  allowUnsoldRelist: true,
  undoDepth: 50,
});

const isInt = (v, min = 0) => Number.isSafeInteger(v) && v >= min;

/** Returns a list of human-readable problems; an empty list means valid. */
export function validateConfig(config) {
  const errors = [];
  if (!config || typeof config !== "object") return ["Config must be an object."];

  if (!isInt(config.initialPurse, 1)) errors.push("initialPurse must be a positive whole number of lakhs.");

  const squad = config.squad;
  if (!squad || !isInt(squad.min) || !isInt(squad.max, 1)) {
    errors.push("squad.min and squad.max must be whole numbers (max at least 1).");
  } else if (squad.min > squad.max) {
    errors.push("squad.min cannot be greater than squad.max.");
  }

  if (config.maxOverseas !== null && !isInt(config.maxOverseas)) {
    errors.push("maxOverseas must be a whole number or null.");
  }

  const roleLimits = config.roleLimits;
  if (!roleLimits || typeof roleLimits !== "object") {
    errors.push("roleLimits must be an object.");
  } else {
    for (const key of Object.keys(roleLimits)) {
      if (!ROLE_LIST.includes(key)) errors.push(`roleLimits has unknown role "${key}".`);
    }
    let minTotal = 0;
    for (const role of ROLE_LIST) {
      const limit = roleLimits[role];
      if (!limit) {
        errors.push(`roleLimits.${role} is missing.`);
        continue;
      }
      if (!isInt(limit.min)) errors.push(`roleLimits.${role}.min must be a whole number.`);
      if (limit.max !== null && !isInt(limit.max)) errors.push(`roleLimits.${role}.max must be a whole number or null.`);
      if (isInt(limit.min) && isInt(limit.max) && limit.min > limit.max) {
        errors.push(`roleLimits.${role}.min cannot be greater than its max.`);
      }
      if (isInt(limit.min)) minTotal += limit.min;
    }
    if (squad && isInt(squad.max) && minTotal > squad.max) {
      errors.push("The role minimums add up to more than squad.max.");
    }
  }

  const reserve = config.minimumReserve;
  if (!reserve || typeof reserve.enabled !== "boolean" || !isInt(reserve.perSlot)) {
    errors.push("minimumReserve must be { enabled: boolean, perSlot: whole lakhs }.");
  } else if (reserve.enabled && squad && isInt(squad.min) && isInt(config.initialPurse)) {
    if (squad.min * reserve.perSlot > config.initialPurse) {
      errors.push("minimumReserve.perSlot × squad.min is more than the initial purse.");
    }
  }

  if (typeof config.allowUnsoldRelist !== "boolean") errors.push("allowUnsoldRelist must be true or false.");
  if (!isInt(config.undoDepth)) errors.push("undoDepth must be a whole number.");

  return errors;
}
