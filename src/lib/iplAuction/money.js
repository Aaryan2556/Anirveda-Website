/**
 * All auction money is stored and calculated as WHOLE LAKHS.
 * ₹1 Cr = 100 lakhs. Never store rupees or fractional crores.
 */
export const LAKHS_PER_CRORE = 100;

export function isWholeLakhs(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

/** Display helper only — never feed the result back into calculations. */
export function formatLakhs(lakhs) {
  if (lakhs == null) return "—";
  if (Math.abs(lakhs) >= LAKHS_PER_CRORE) {
    const crores = lakhs / LAKHS_PER_CRORE;
    const text = Number.isInteger(crores) ? String(crores) : crores.toFixed(2).replace(/0$/, "");
    return `₹${text} Cr`;
  }
  return `₹${lakhs} L`;
}
