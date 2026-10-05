/**
 * Add, edit and remove teams (ADD_TEAM / UPDATE_TEAM / REMOVE_TEAM). The engine
 * only allows these before the auction starts.
 */
import { useState } from "react";
import { AUCTION_STATUS, COMMANDS, getTeamsInOrder } from "../../../lib/iplAuction/engine";
import { makeId } from "../../../lib/iplAuction/repository/mockSeed";
import { Button, table } from "../ui/controls";
import { ConfirmButton, Field, TextInput } from "./fields";

const EMPTY = { name: "", shortName: "", logo: "" };

function TeamForm({ initial = EMPTY, submitLabel, onSubmit, onCancel, pending }) {
  const [draft, setDraft] = useState(initial);
  const set = (key) => (value) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    const ok = await onSubmit({ name: draft.name, shortName: draft.shortName || null, logo: draft.logo || null });
    if (ok && !onCancel) setDraft(EMPTY);
  };
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <Field label="Team name">
        <TextInput required value={draft.name} onChange={set("name")} />
      </Field>
      <Field label="Short name" hint="Up to 16; blank = first 3 letters">
        <TextInput maxLength={16} value={draft.shortName} onChange={set("shortName")} />
      </Field>
      <Field label="Logo URL" className="min-w-[14rem] flex-1">
        <TextInput value={draft.logo} onChange={set("logo")} />
      </Field>
      <Button variant="primary" type="submit" disabled={pending}>
        {submitLabel}
      </Button>
      {onCancel && <Button onClick={onCancel}>Cancel</Button>}
    </form>
  );
}

export default function TeamManager({ state, send, pending }) {
  const [editingId, setEditingId] = useState(null);
  const isSetup = state.status === AUCTION_STATUS.SETUP;
  const teams = getTeamsInOrder(state);

  const addTeam = async (fields) => {
    const result = await send(
      { type: COMMANDS.ADD_TEAM, team: { ...fields, id: makeId("team") } },
      { success: `Team ${fields.name} added.` }
    );
    return result.ok;
  };
  const updateTeam = async (teamId, changes) => {
    const result = await send({ type: COMMANDS.UPDATE_TEAM, teamId, changes }, { success: "Team updated." });
    if (result.ok) setEditingId(null);
    return result.ok;
  };

  return (
    <div className="space-y-4 text-sm">
      {!isSetup && <p className="text-xs text-slate-400">Teams are locked once the auction has started.</p>}
      <div className={table.wrap}>
        <table className={table.table}>
          <thead className={table.thead}>
            <tr>
              <th className={table.th}>Team</th>
              <th className={table.th}>Short</th>
              <th className={table.th}>Logo</th>
              <th className={table.th}>Actions</th>
            </tr>
          </thead>
          <tbody className={table.tbody}>
            {teams.map((team) =>
              editingId === team.id ? (
                <tr key={team.id}>
                  <td colSpan={4} className={table.td}>
                    <TeamForm
                      initial={{ name: team.name, shortName: team.shortName, logo: team.logo ?? "" }}
                      submitLabel="Save"
                      pending={pending}
                      onSubmit={(changes) => updateTeam(team.id, changes)}
                      onCancel={() => setEditingId(null)}
                    />
                  </td>
                </tr>
              ) : (
                <tr key={team.id}>
                  <td className={table.td}>{team.name}</td>
                  <td className={table.td}>{team.shortName}</td>
                  <td className={`${table.td} max-w-[16rem] truncate text-slate-400`}>{team.logo ?? "—"}</td>
                  <td className={`${table.td} space-x-1 whitespace-nowrap`}>
                    <Button disabled={!isSetup} onClick={() => setEditingId(team.id)}>
                      Edit
                    </Button>
                    <ConfirmButton
                      label="Remove"
                      confirmLabel={`Remove ${team.name}`}
                      disabled={!isSetup || pending}
                      onConfirm={() => send({ type: COMMANDS.REMOVE_TEAM, teamId: team.id }, { success: `${team.name} removed.` })}
                    />
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      {isSetup && (
        <div className="border-t border-slate-800 pt-3">
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">Add team</div>
          <TeamForm submitLabel="Add team" onSubmit={addTeam} pending={pending} />
        </div>
      )}
    </div>
  );
}
