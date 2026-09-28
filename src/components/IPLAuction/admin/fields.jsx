/**
 * Plain form controls for the functional admin console (final design is Phase 8).
 */
import { useState } from "react";
import { Button } from "../DevPanels";

export const inputClass = "border border-white/30 bg-black px-2 py-1 text-sm disabled:opacity-50";

export function Field({ label, hint, error, children, className = "" }) {
  return (
    <label className={`grid gap-1 text-xs ${className}`}>
      <span className="text-white/70">{label}</span>
      {children}
      {hint && !error && <span className="text-white/40">{hint}</span>}
      {error && <span className="text-red-300">{error}</span>}
    </label>
  );
}

export function TextInput({ value, onChange, ...props }) {
  return <input className={inputClass} value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...props} />;
}

/** Keeps the raw text so partial input ("", "-") can be typed; callers convert on submit. */
export function NumberInput({ value, onChange, ...props }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      className={`${inputClass} w-28`}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
  );
}

export function Select({ value, onChange, options, ...props }) {
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({ checked, onChange, label, ...props }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} {...props} />
      {label}
    </label>
  );
}

/** "" → null, "12" → 12, anything else → the raw text (so the engine can reject it with a message). */
export function toNumberOrNull(text) {
  if (text === "" || text == null) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : text;
}

/** Two-step confirm for destructive actions. */
export function ConfirmButton({ label, confirmLabel, onConfirm, disabled }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button variant="danger" disabled={disabled} onClick={() => setAsking(true)}>
        {label}
      </Button>
    );
  }
  return (
    <>
      <Button
        variant="danger"
        disabled={disabled}
        onClick={async () => {
          await onConfirm();
          setAsking(false);
        }}
      >
        {confirmLabel}
      </Button>
      <Button onClick={() => setAsking(false)}>Keep</Button>
    </>
  );
}
