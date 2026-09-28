/**
 * Bulk import of players from CSV or JSON. Step 1 checks every row through the
 * engine (nothing saved); step 2 adds the valid rows one ADD_PLAYER at a time.
 */
import { useMemo, useRef, useState } from "react";
import { parsePlayerImport, planPlayerImport } from "../../../lib/iplAuction/io/playerImport";
import { DATA_SOURCES } from "../../../lib/iplAuction/playerFields";
import { makeId } from "../../../lib/iplAuction/repository/mockSeed";
import { Button } from "../DevPanels";
import { Field, Select, TextInput, inputClass } from "./fields";

const NO_DEFAULT = "";
const OTHER_SOURCE = "__other__";
const DEFAULT_SOURCE_OPTIONS = [
  { value: NO_DEFAULT, label: "None: every row must name its source" },
  { value: DATA_SOURCES.FICTIONAL, label: "FICTIONAL (labelled as fictional)" },
  { value: DATA_SOURCES.MANUAL_ENTRY, label: "MANUAL_ENTRY" },
  { value: OTHER_SOURCE, label: "Other verified source…" },
];

const EXAMPLE = [
  "name,role,basePrice,isOverseas,nationality,age,battingStyle,bowlingStyle,dataSource,batting.runs,batting.average,bowling.wickets,recentPerformance",
  "Example Fictional Player,BATTER,50,no,India,24,Right-hand bat,,FICTIONAL,812,31.2,,45 (30)|12 (9)",
].join("\n");

export default function PlayerImport({ state, send, pending }) {
  const [text, setText] = useState("");
  const [sourceChoice, setSourceChoice] = useState(NO_DEFAULT);
  const [sourceText, setSourceText] = useState("");
  const [plan, setPlan] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [progress, setProgress] = useState(null);
  const fileInput = useRef(null);

  const defaultSource = sourceChoice === OTHER_SOURCE ? sourceText.trim() || null : sourceChoice || null;
  const valid = useMemo(() => plan?.filter((row) => row.command) ?? [], [plan]);

  const check = () => {
    const { rows, error } = parsePlayerImport(text);
    setParseError(error);
    setPlan(error ? null : planPlayerImport(state, rows, { dataSource: defaultSource, makeId }));
    setProgress(null);
  };

  const loadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setText(await file.text());
    setPlan(null);
    event.target.value = "";
  };

  /** Sends the planned rows in order. Stops at the first failure so nothing is skipped silently. */
  const importValid = async () => {
    let added = 0;
    for (const row of valid) {
      setProgress({ done: added, total: valid.length, failed: null });
      const result = await send(row.command, { quiet: true });
      if (!result.ok) {
        setProgress({ done: added, total: valid.length, failed: { line: row.line, message: result.error.message } });
        return;
      }
      added += 1;
    }
    setProgress({ done: added, total: valid.length, failed: null });
    setPlan(null);
    setText("");
  };

  const importing = progress && !progress.failed && progress.done < progress.total;

  return (
    <div className="grid gap-3 text-sm">
      <p className="text-xs text-white/60">
        Paste CSV (with a header row) or JSON, or load a file. Columns: <code>name, role, basePrice</code> (lakhs),{" "}
        <code>isOverseas</code>, and optionally <code>nationality, age, battingStyle, bowlingStyle, image, dataSource,
        recentPerformance</code> (separate entries with <code>|</code>) and stats such as <code>batting.runs</code>,{" "}
        <code>bowling.wickets</code>, <code>keeping.catches</code>. Roles: batter, bowler, all-rounder, wicketkeeper (or wk).
      </p>
      <p className="text-xs text-yellow-200/80">
        Every player needs a data source. Only import real statistics from a source you have checked, and mark
        invented data FICTIONAL.
      </p>
      <textarea
        className={`${inputClass} h-40 font-mono text-xs`}
        value={text}
        placeholder={EXAMPLE}
        onChange={(e) => {
          setText(e.target.value);
          setPlan(null);
        }}
      />
      <div className="flex flex-wrap items-end gap-3">
        <input ref={fileInput} type="file" accept=".csv,.json,text/csv,application/json" className="hidden" onChange={loadFile} />
        <Button onClick={() => fileInput.current?.click()}>Load file…</Button>
        <Field label="Default data source (rows without one)">
          <Select value={sourceChoice} onChange={(value) => { setSourceChoice(value); setPlan(null); }} options={DEFAULT_SOURCE_OPTIONS} />
        </Field>
        {sourceChoice === OTHER_SOURCE && (
          <Field label="Source name">
            <TextInput maxLength={32} value={sourceText} onChange={(value) => { setSourceText(value); setPlan(null); }} />
          </Field>
        )}
        <Button variant="primary" disabled={!text.trim() || importing} onClick={check}>
          Check rows
        </Button>
      </div>

      {parseError && <p className="text-red-300">{parseError}</p>}

      {plan && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              {valid.length} of {plan.length} rows ready
              {plan.length - valid.length > 0 && <span className="text-red-300"> · {plan.length - valid.length} with errors (skipped)</span>}
            </span>
            <Button variant="primary" disabled={!valid.length || pending || importing} onClick={importValid}>
              Import {valid.length} player{valid.length === 1 ? "" : "s"}
            </Button>
          </div>
          <div className="max-h-72 overflow-auto border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-black text-white/50">
                <tr>
                  <th className="px-2 py-1">Line</th>
                  <th className="px-2">Name</th>
                  <th className="px-2">Role</th>
                  <th className="px-2">Base</th>
                  <th className="px-2">Source</th>
                  <th className="px-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {plan.map((row) => (
                  <tr key={row.line} className="border-t border-white/10">
                    <td className="px-2 py-1">{row.line}</td>
                    <td className="px-2">{row.name || "—"}</td>
                    <td className="px-2">{row.command?.player.role ?? ""}</td>
                    <td className="px-2">{row.command?.player.basePrice ?? ""}</td>
                    <td className="px-2">{row.command?.player.dataSource ?? ""}</td>
                    <td className="px-2">
                      {row.error ? <span className="text-red-300">{row.error}</span> : <span className="text-green-300">OK</span>}
                      {row.warnings.map((warning) => (
                        <span key={warning} className="ml-2 text-yellow-200">⚠ {warning}</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {progress && (
        <p className={progress.failed ? "text-red-300" : "text-white/70"}>
          Imported {progress.done} of {progress.total}.
          {progress.failed && ` Stopped at line ${progress.failed.line}: ${progress.failed.message} Fix it and check again; rows already imported stay.`}
        </p>
      )}
    </div>
  );
}
