/**
 * TeamCredentials — sets username + password on each team row directly via
 * Appwrite TablesDB transaction (bypassing the auction engine, since credentials
 * are not part of the auction state and the engine strips unknown fields).
 *
 * Only shown to admins inside the Teams tab of the admin console.
 */
import { useState } from "react";
import toast from "react-hot-toast";
import { IPL_AUCTION_DATABASE_ID, tablesDB } from "../../../config/appwrite";
import { TABLES } from "../../../lib/iplAuction/repository/appwriteSchema";
import { getTeamsInOrder } from "../../../lib/iplAuction/engine";
import { inputClass, table, Button } from "../ui/controls";

/** Sanitise username the same way dbTeamAuth does. */
function sanitizeUsername(raw) {
  return String(raw).toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function writeCredentials(teamId, username, password) {
  const transaction = await tablesDB.createTransaction();
  const transactionId = transaction.$id;
  try {
    await tablesDB.createOperations({
      transactionId,
      operations: [
        {
          action: "update",
          databaseId: IPL_AUCTION_DATABASE_ID,
          tableId: TABLES.TEAMS,
          rowId: teamId,
          data: { username, password },
        },
      ],
    });
    await tablesDB.updateTransaction({ transactionId, commit: true });
  } catch (err) {
    await tablesDB.updateTransaction({ transactionId, rollback: true }).catch(() => {});
    throw err;
  }
}

function CredRow({ team }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const u = sanitizeUsername(username);
    if (!u) { toast.error("Username cannot be empty."); return; }
    if (!password) { toast.error("Password cannot be empty."); return; }
    setSaving(true);
    try {
      await writeCredentials(team.id, u, password);
      toast.success(`Credentials set for ${team.name}. Username: ${u}`);
      setUsername("");
      setPassword("");
    } catch (err) {
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td className={table.td}>{team.name}</td>
      <td className={table.td}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. mumbaiindians"
          className={`${inputClass} w-40`}
          autoComplete="off"
        />
      </td>
      <td className={table.td}>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          className={`${inputClass} w-36`}
          autoComplete="off"
        />
      </td>
      <td className={table.td}>
        <Button size="sm" variant="primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Set"}
        </Button>
      </td>
    </tr>
  );
}

export default function TeamCredentials({ state }) {
  const teams = getTeamsInOrder(state);
  if (!teams.length) return <p className="text-xs text-slate-400">No teams yet. Add teams first.</p>;

  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-xs text-slate-300">
        <strong className="font-mono uppercase tracking-wider text-gold">Team login credentials.</strong>{" "}
        Set a username and password for each team. Teams sign in at{" "}
        <span className="font-mono text-slate-100">/ipl-auction/play</span> using these.
        Usernames are lowercased and stripped of spaces/symbols automatically.
        Use simple, memorable passwords — not personal ones.
      </div>
      <div className={table.wrap}>
        <table className={table.table}>
          <thead className={table.thead}>
            <tr>
              <th className={table.th}>Team</th>
              <th className={table.th}>Username (they type this)</th>
              <th className={table.th}>Password</th>
              <th className={table.th}>Save</th>
            </tr>
          </thead>
          <tbody className={table.tbody}>
            {teams.map((team) => (
              <CredRow key={team.id} team={team} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
