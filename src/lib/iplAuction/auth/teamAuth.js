/**
 * Which team a signed-in user belongs to (Appwrite mode).
 *
 * A team account is an Appwrite user carrying the label `teamLabel(teamId)`
 * ("iplteam" + the team ID without its dashes, e.g. mock-team-1 → iplteammockteam1).
 * Labels can only be set by an admin (Appwrite console or server key), never by
 * the user, so a team cannot move itself to another team. Appwrite labels are
 * alphanumeric and at most 36 characters.
 */
export const TEAM_LABEL_PREFIX = "iplteam";
export const MAX_LABEL_LENGTH = 36;

/** The label an admin puts on a team's Appwrite account, or null if the ID can't make a valid label. */
export function teamLabel(teamId) {
  const label = `${TEAM_LABEL_PREFIX}${String(teamId).replace(/[^A-Za-z0-9]/g, "")}`;
  return label.length > TEAM_LABEL_PREFIX.length && label.length <= MAX_LABEL_LENGTH ? label : null;
}

/**
 * The team a user's labels point to among `teamIds`.
 *   → { teamId }                     exactly one team matches
 *   → { teamId: null, reason }       none, or more than one (ambiguous: refused)
 */
export function resolveTeamFromLabels(labels = [], teamIds = []) {
  const owned = new Set(labels);
  const matches = teamIds.filter((teamId) => {
    const label = teamLabel(teamId);
    return label !== null && owned.has(label);
  });
  if (matches.length === 1) return { teamId: matches[0], reason: null };
  if (matches.length > 1) return { teamId: null, reason: "This account is linked to more than one team. Ask an organiser to fix its labels." };
  return { teamId: null, reason: "This account is not linked to a team in this auction." };
}
