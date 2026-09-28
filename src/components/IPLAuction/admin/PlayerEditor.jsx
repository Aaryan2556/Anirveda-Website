/**
 * Add or edit one player's profile (ADD_PLAYER / UPDATE_PLAYER). The engine
 * validates everything; status, soldTo and soldPrice are never editable here.
 */
import { useState } from "react";
import { ROLE_LABELS, ROLE_LIST } from "../../../lib/iplAuction/config";
import { COMMANDS } from "../../../lib/iplAuction/engine";
import { DATA_SOURCES, STAT_FIELD_LABELS, STAT_GROUPS, compactStats } from "../../../lib/iplAuction/playerFields";
import { makeId } from "../../../lib/iplAuction/repository/mockSeed";
import { Button } from "../DevPanels";
import { Checkbox, Field, NumberInput, Select, TextInput, inputClass, toNumberOrNull } from "./fields";

const ROLE_OPTIONS = ROLE_LIST.map((role) => ({ value: role, label: ROLE_LABELS[role] }));
const OTHER_SOURCE = "__other__";
const SOURCE_OPTIONS = [
  { value: DATA_SOURCES.MANUAL_ENTRY, label: "Manual entry" },
  { value: DATA_SOURCES.FICTIONAL, label: "Fictional (labelled as such)" },
  { value: OTHER_SOURCE, label: "Other verified source…" },
];

function toDraft(player) {
  const knownSource = Object.values(DATA_SOURCES).includes(player?.dataSource);
  return {
    name: player?.name ?? "",
    role: player?.role ?? ROLE_LIST[0],
    basePrice: player ? String(player.basePrice) : "20",
    isOverseas: player?.isOverseas ?? false,
    nationality: player?.nationality ?? "",
    age: player?.age == null ? "" : String(player.age),
    battingStyle: player?.battingStyle ?? "",
    bowlingStyle: player?.bowlingStyle ?? "",
    image: player?.image ?? "",
    sourceChoice: !player ? DATA_SOURCES.MANUAL_ENTRY : knownSource ? player.dataSource : OTHER_SOURCE,
    sourceText: knownSource ? "" : player?.dataSource ?? "",
    recentPerformance: (player?.recentPerformance ?? []).join("\n"),
    stats: Object.fromEntries(
      Object.entries(STAT_GROUPS).map(([group, { fields }]) => [
        group,
        Object.fromEntries(fields.map((field) => [field, player?.stats?.[group]?.[field] ?? ""])),
      ])
    ),
  };
}

function fromDraft(draft) {
  return {
    name: draft.name,
    role: draft.role,
    basePrice: toNumberOrNull(draft.basePrice),
    isOverseas: draft.isOverseas,
    nationality: draft.nationality || null,
    age: toNumberOrNull(draft.age),
    battingStyle: draft.battingStyle || null,
    bowlingStyle: draft.bowlingStyle || null,
    image: draft.image || null,
    dataSource: draft.sourceChoice === OTHER_SOURCE ? draft.sourceText : draft.sourceChoice,
    recentPerformance: draft.recentPerformance.split("\n").map((line) => line.trim()).filter(Boolean),
    stats: compactStats(draft.stats),
  };
}

/** `player` null = add a new player to the end of the sequence. */
export default function PlayerEditor({ player, send, pending, onDone }) {
  const [draft, setDraft] = useState(() => toDraft(player));
  const set = (key) => (value) => setDraft((current) => ({ ...current, [key]: value }));
  const setStat = (group, field) => (value) =>
    setDraft((current) => ({
      ...current,
      stats: { ...current.stats, [group]: { ...current.stats[group], [field]: value } },
    }));

  const submit = async (event) => {
    event.preventDefault();
    const fields = fromDraft(draft);
    const result = player
      ? await send({ type: COMMANDS.UPDATE_PLAYER, playerId: player.id, changes: fields }, { success: `${fields.name} updated.` })
      : await send(
        { type: COMMANDS.ADD_PLAYER, player: { ...fields, id: makeId("player") } },
        { success: `${fields.name} added to the end of the sequence.` }
      );
    if (result.ok) {
      if (!player) setDraft(toDraft(null));
      onDone?.();
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="flex flex-wrap gap-3">
        <Field label="Name" className="min-w-[14rem] flex-1">
          <TextInput required value={draft.name} onChange={set("name")} />
        </Field>
        <Field label="Role">
          <Select value={draft.role} onChange={set("role")} options={ROLE_OPTIONS} />
        </Field>
        <Field label="Base price (lakhs)" hint="₹1 Cr = 100">
          <NumberInput required min={1} value={draft.basePrice} onChange={set("basePrice")} />
        </Field>
        <Field label="Overseas">
          <Checkbox checked={draft.isOverseas} onChange={set("isOverseas")} label="Overseas player" />
        </Field>
      </div>

      <div className="flex flex-wrap gap-3">
        <Field label="Nationality">
          <TextInput value={draft.nationality} onChange={set("nationality")} />
        </Field>
        <Field label="Age">
          <NumberInput min={0} value={draft.age} onChange={set("age")} />
        </Field>
        <Field label="Batting style">
          <TextInput value={draft.battingStyle} onChange={set("battingStyle")} placeholder="Right-hand bat" />
        </Field>
        <Field label="Bowling style">
          <TextInput value={draft.bowlingStyle} onChange={set("bowlingStyle")} placeholder="Right-arm fast" />
        </Field>
        <Field label="Image URL" className="min-w-[14rem] flex-1">
          <TextInput value={draft.image} onChange={set("image")} />
        </Field>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Data source" hint="Never enter invented statistics as real data.">
          <Select value={draft.sourceChoice} onChange={set("sourceChoice")} options={SOURCE_OPTIONS} />
        </Field>
        {draft.sourceChoice === OTHER_SOURCE && (
          <Field label="Source name">
            <TextInput required maxLength={32} value={draft.sourceText} onChange={set("sourceText")} placeholder="e.g. ESPNcricinfo" />
          </Field>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {Object.entries(STAT_GROUPS).map(([group, { label, fields }]) => (
          <fieldset key={group} className="border border-white/10 p-2">
            <legend className="px-1 text-xs text-white/60">{label} statistics</legend>
            <div className="grid grid-cols-2 gap-2">
              {fields.map((field) => (
                <Field key={field} label={STAT_FIELD_LABELS[field]}>
                  <TextInput className={`${inputClass} w-full`} value={draft.stats[group][field]} onChange={setStat(group, field)} />
                </Field>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <Field label="Recent performance (one entry per line)">
        <textarea
          className={`${inputClass} h-20 font-mono`}
          value={draft.recentPerformance}
          onChange={(e) => set("recentPerformance")(e.target.value)}
          placeholder={"64 (41)\n2/24 (4)"}
        />
      </Field>

      <div className="flex gap-2">
        <Button variant="primary" type="submit" disabled={pending}>
          {player ? "Save changes" : "Add player"}
        </Button>
        {onDone && <Button onClick={onDone}>Cancel</Button>}
      </div>
    </form>
  );
}
