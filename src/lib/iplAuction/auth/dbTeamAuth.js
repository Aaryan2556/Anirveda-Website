/**
 * Database-based team authentication for IPL Auction.
 *
 * Instead of Appwrite user accounts, teams log in using a username + password
 * stored directly on their row in the ipl_teams table. This avoids the need to
 * manually create Appwrite Auth accounts for every team.
 *
 * Shape (same as adminAuth.js):
 *   kind                          "dbTeam"
 *   getSession()  -> { teamId, user }
 *   signIn(username, password) -> { teamId, user }
 *   signOut()
 *
 * Session is persisted in localStorage under IPL_TEAM_SESSION_KEY so the team
 * stays logged in across page refreshes.
 */
import { TABLES } from "../repository/appwriteSchema.js";

const IPL_TEAM_SESSION_KEY = "ipl-auction-team-session";

/**
 * Sanitises a raw username the same way SignInPanel does, so the admin only
 * needs to store the friendly form in the DB (e.g. "Mumbai Indians") and the
 * lookup still works.
 */
function sanitizeUsername(raw) {
  return String(raw).toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * @param {{ tablesDB, Query, databaseId, auctionId }} opts
 *   `auctionId` may be null (we'll search any team row with matching username).
 */
export function createDbTeamAuth({ tablesDB, Query, databaseId }) {
  async function fetchTeamByUsername(username) {
    const sanitized = sanitizeUsername(username);
    const { rows } = await tablesDB.listRows({
      databaseId,
      tableId: TABLES.TEAMS,
      queries: [Query.equal("username", sanitized), Query.limit(1)],
    });
    return rows[0] ?? null;
  }

  function loadSession() {
    try {
      const raw = sessionStorage.getItem(IPL_TEAM_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveSession(session) {
    if (session) {
      sessionStorage.setItem(IPL_TEAM_SESSION_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(IPL_TEAM_SESSION_KEY);
    }
  }

  function makeUser(row) {
    return { id: row.$id, name: row.name, teamId: row.$id };
  }

  async function getSession() {
    const stored = loadSession();
    if (!stored) return { teamId: null, user: null };
    // Verify the team still exists and the device ID matches the one in DB
    try {
      const row = await tablesDB.getRow({ databaseId, tableId: TABLES.TEAMS, rowId: stored.teamId });
      
      // Enforce single active device: if the DB has a different device ID, log this device out.
      if (row.activeDeviceId && stored.deviceId && row.activeDeviceId !== stored.deviceId) {
        saveSession(null);
        return { teamId: null, user: null };
      }

      const user = makeUser(row);
      return { teamId: row.$id, user };
    } catch {
      // Row gone or network error – clear stale session
      saveSession(null);
      return { teamId: null, user: null };
    }
  }

  async function signIn(username, password) {
    const row = await fetchTeamByUsername(username);
    if (!row) throw new Error("Username not found. Check with your organiser.");
    if (!row.password) throw new Error("No password has been set for this team. Ask an organiser to set one.");
    // Plain-text comparison — this is a local event system, not a public product.
    const storedPassword = String(row.password);
    const givenPassword = String(password);
    if (storedPassword !== givenPassword) throw new Error("Incorrect password.");
    
    // Generate a unique device ID for this login session
    const deviceId = Math.random().toString(36).substring(2, 15);
    
    // Update the active device ID in the database to lock out other devices
    try {
      await tablesDB.updateRow({ 
        databaseId, 
        tableId: TABLES.TEAMS, 
        rowId: row.$id, 
        data: { activeDeviceId: deviceId } 
      });
    } catch (e) {
      console.warn("Could not update activeDeviceId", e);
    }

    const user = makeUser(row);
    saveSession({ teamId: row.$id, user, deviceId });
    return { teamId: row.$id, user };
  }

  async function signOut() {
    const stored = loadSession();
    if (stored && stored.teamId) {
      try {
        await tablesDB.updateRow({
          databaseId,
          tableId: TABLES.TEAMS,
          rowId: stored.teamId,
          data: { activeDeviceId: null }
        });
      } catch (e) {
        // ignore
      }
    }
    saveSession(null);
  }

  return { kind: "dbTeam", getSession, signIn, signOut };
}
