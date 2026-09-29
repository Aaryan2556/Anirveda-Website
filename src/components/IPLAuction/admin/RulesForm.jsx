/**
 * Structured editor for the auction rules (UPDATE_CONFIG, before the start only).
 * Problems come from config.js → validateConfig, the same check the engine runs.
 */
import { useEffect, useMemo, useState } from "react";
import { DEV_DEFAULT_CONFIG, ROLE_LABELS, ROLE_LIST, validateConfig } from "../../../lib/iplAuction/config";
import { AUCTION_STATUS, COMMANDS } from "../../../lib/iplAuction/engine";
import { formatLakhs } from "../../../lib/iplAuction/money";
import { Button, table } from "../ui/controls";
import { Checkbox, Field, NumberInput, Select, toNumberOrNull } from "./fields";

/** Named rule sets. Add the real event preset here once the organisers confirm it. */
const PRESETS = {
  dev: { label: "Development defaults (not the event rules)", config: DEV_DEFAULT_CONFIG },
};

const text = (value) => (value == null ? "" : String(value));

function toDraft(config) {
  return {
    initialPurse: text(config.initialPurse),
    squadMin: text(config.squad.min),
    squadMax: text(config.squad.max),
    maxOverseas: text(config.maxOverseas),
    roles: Object.fromEntries(
      ROLE_LIST.map((role) => [role, { min: text(config.roleLimits[role]?.min), max: text(config.roleLimits[role]?.max) }])
    ),
    reserveEnabled: config.minimumReserve.enabled,
    reservePerSlot: text(config.minimumReserve.perSlot),
    allowUnsoldRelist: config.allowUnsoldRelist,
    undoDepth: text(config.undoDepth),
  };
}

/** Blank "max" fields mean "no limit" (null); blank required fields stay invalid for validateConfig to report. */
function fromDraft(draft) {
  return {
    initialPurse: toNumberOrNull(draft.initialPurse),
    squad: { min: toNumberOrNull(draft.squadMin), max: toNumberOrNull(draft.squadMax) },
    maxOverseas: toNumberOrNull(draft.maxOverseas),
    roleLimits: Object.fromEntries(
      ROLE_LIST.map((role) => [role, { min: toNumberOrNull(draft.roles[role].min), max: toNumberOrNull(draft.roles[role].max) }])
    ),
    minimumReserve: { enabled: draft.reserveEnabled, perSlot: toNumberOrNull(draft.reservePerSlot) },
    allowUnsoldRelist: draft.allowUnsoldRelist,
    undoDepth: toNumberOrNull(draft.undoDepth),
  };
}

export default function RulesForm({ state, send, pending }) {
  const isSetup = state.status === AUCTION_STATUS.SETUP;
  const [draft, setDraft] = useState(() => toDraft(state.config));
  // Reset only when the saved rules change (every Appwrite read parses a new config object).
  const savedConfig = JSON.stringify(state.config);
  useEffect(() => setDraft(toDraft(JSON.parse(savedConfig))), [savedConfig]);

  const set = (key) => (value) => setDraft((current) => ({ ...current, [key]: value }));
  const setRole = (role, bound) => (value) =>
    setDraft((current) => ({ ...current, roles: { ...current.roles, [role]: { ...current.roles[role], [bound]: value } } }));

  const config = useMemo(() => fromDraft(draft), [draft]);
  const problems = useMemo(() => validateConfig(config), [config]);
  const changed = JSON.stringify(config) !== savedConfig;

  const apply = () => send({ type: COMMANDS.UPDATE_CONFIG, config }, { success: "Rules updated." });

  return (
    <div className="space-y-4 text-sm">
      <p className="text-xs text-slate-400">
        {isSetup ? "Editable until the auction starts." : "Locked: the auction has started."} Money is in whole lakhs
        (₹1 Cr = 100). Leave a maximum blank for no limit.
      </p>

      <fieldset disabled={!isSetup} className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <Field label="Purse per team (lakhs)" hint={formatLakhs(Number(draft.initialPurse) || null)}>
            <NumberInput min={1} value={draft.initialPurse} onChange={set("initialPurse")} />
          </Field>
          <Field label="Squad minimum">
            <NumberInput min={0} value={draft.squadMin} onChange={set("squadMin")} />
          </Field>
          <Field label="Squad maximum">
            <NumberInput min={1} value={draft.squadMax} onChange={set("squadMax")} />
          </Field>
          <Field label="Max overseas" hint="Blank = no limit">
            <NumberInput min={0} value={draft.maxOverseas} onChange={set("maxOverseas")} />
          </Field>
        </div>

        <table className={table.table}>
          <thead className={table.thead}>
            <tr>
              <th className={table.th}>Role</th>
              <th className={table.th}>Minimum</th>
              <th className={table.th}>Maximum</th>
            </tr>
          </thead>
          <tbody className={table.tbody}>
            {ROLE_LIST.map((role) => (
              <tr key={role}>
                <td className={table.td}>{ROLE_LABELS[role]}</td>
                <td className={table.td}>
                  <NumberInput min={0} value={draft.roles[role].min} onChange={setRole(role, "min")} aria-label={`${ROLE_LABELS[role]} minimum`} />
                </td>
                <td className={table.td}>
                  <NumberInput min={0} value={draft.roles[role].max} onChange={setRole(role, "max")} aria-label={`${ROLE_LABELS[role]} maximum`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-wrap items-end gap-4">
          <Checkbox checked={draft.reserveEnabled} onChange={set("reserveEnabled")} label="Minimum reserve" />
          <Field label="Reserve per open slot (lakhs)" hint="Kept back for each slot still needed to reach the squad minimum">
            <NumberInput min={0} value={draft.reservePerSlot} onChange={set("reservePerSlot")} disabled={!draft.reserveEnabled} />
          </Field>
          <Checkbox checked={draft.allowUnsoldRelist} onChange={set("allowUnsoldRelist")} label="Unsold players can be put up again" />
          <Field label="Undo depth">
            <NumberInput min={0} value={draft.undoDepth} onChange={set("undoDepth")} />
          </Field>
        </div>
      </fieldset>

      {problems.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 text-xs text-red-300">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      {isSetup && (
        <div className="flex flex-wrap items-end gap-2">
          <Button variant="primary" disabled={!changed || problems.length > 0 || pending} onClick={apply}>
            Apply rules
          </Button>
          <Button disabled={!changed} onClick={() => setDraft(toDraft(state.config))}>
            Discard changes
          </Button>
          <Field label="Load preset">
            <Select
              value=""
              onChange={(key) => key && setDraft(toDraft(PRESETS[key].config))}
              options={[{ value: "", label: "Choose…" }, ...Object.entries(PRESETS).map(([value, { label }]) => ({ value, label }))]}
            />
          </Field>
        </div>
      )}
    </div>
  );
}
