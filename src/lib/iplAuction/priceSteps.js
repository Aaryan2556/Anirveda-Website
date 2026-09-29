/**
 * Price calculator for the admin's hammer panel: the −/+ buttons move the
 * price to the next step. This is only an input aid — the engine still accepts
 * any whole-lakh price at or above the base price (bidding happens in the room).
 *
 * Steps (whole lakhs; ₹1 Cr = 100): 20 lakhs below ₹5 Cr, then ₹1 Cr.
 * `upTo` is exclusive: at exactly ₹5 Cr the next step is already ₹1 Cr.
 */
export const PRICE_STEPS = Object.freeze([
  Object.freeze({ upTo: 500, step: 20 }),
  Object.freeze({ upTo: null, step: 100 }),
]);

/** The step used when going up from `price`. */
export function stepAt(price, steps = PRICE_STEPS) {
  return steps.find(({ upTo }) => upTo === null || price < upTo).step;
}

/**
 * Next price up: the next multiple of the current step (so prices stay on
 * round numbers: 30 → 40 → 60, 480 → 500 → 600).
 */
export function nextPrice(price, steps = PRICE_STEPS) {
  const step = stepAt(price, steps);
  return Math.floor(price / step) * step + step;
}

/**
 * Next price down: the previous round number of the step that applies just
 * below `price`, never below the base price.
 */
export function previousPrice(price, basePrice, steps = PRICE_STEPS) {
  if (price <= basePrice) return basePrice;
  const step = stepAt(price - 1, steps);
  return Math.max(basePrice, Math.ceil(price / step) * step - step);
}
