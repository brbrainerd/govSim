/**
 * Pure heat-map utilities for RegionsView.svelte.
 *
 * Extracted so they can be unit-tested without mounting Svelte components
 * or importing reactive stores.
 */

/**
 * Normalise `v` to [0, 1] within the range [lo, hi].
 *
 * Returns 0.5 when the column is flat (hi === lo) so the heat bar
 * stays centred rather than rendering at 0.
 *
 * The result is NOT clamped — values outside [lo, hi] (e.g. a new
 * row arriving between refreshes) will produce values outside [0, 1].
 * Callers are responsible for clamping if needed.
 */
export function normalizeInRange(v: number, lo: number, hi: number): number {
  if (hi === lo) return 0.5;
  return (v - lo) / (hi - lo);
}

/**
 * Build the inline CSS style string for a heat-bar `<div>`.
 *
 * Width encodes absolute position in the column (0=min → 100%=max).
 * Hue encodes quality: green (120°) = best, red (0°) = worst.
 * When `higherIsBetter` is false the quality mapping is inverted
 * (unemployment: low value = green).
 *
 * @param normalizedVal  Pre-normalised value in [0, 1] from `normalizeInRange`.
 * @param higherIsBetter True for approval/income/health; false for unemployment.
 */
export function makeHeatBarStyle(normalizedVal: number, higherIsBetter: boolean): string {
  const quality = higherIsBetter ? normalizedVal : 1 - normalizedVal;
  const hue     = quality * 120; // 0=red, 60=yellow, 120=green
  return `width:${(normalizedVal * 100).toFixed(1)}%; background:hsl(${hue.toFixed(0)},55%,38%); opacity:0.22`;
}
