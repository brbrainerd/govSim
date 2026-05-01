/**
 * Pure chart-math utilities shared across components.
 *
 * Extracted so they can be unit-tested without mounting Svelte components
 * or importing reactive stores.
 */

/**
 * Convert a numeric array to an SVG polyline `points` string.
 *
 * Normalises values into the vertical range [2, 22] inside a 100×24 viewBox
 * so the line never clips the edge. Returns an empty string when data has
 * fewer than 2 points.
 *
 * @param data  Array of numeric data points (at least 2 for a line).
 * @returns     Space-separated "x,y" pairs suitable for `<polyline points=…>`.
 */
export function toSparkPoints(data: number[]): string {
  if (!data || data.length < 2) return "";
  const min   = Math.min(...data);
  const max   = Math.max(...data);
  const range = max - min || 1;          // avoid divide-by-zero for flat lines
  const n     = data.length;
  return data
    .map((v, i) => {
      const x = (i / (n - 1)) * 100;
      // Invert y: SVG y=0 is at the top, but high values should appear high.
      const y = 22 - ((v - min) / range) * 20;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/**
 * Build the CSS custom-property string that positions a confidence-interval
 * bar inside a `.ci-bar` element.
 *
 * The bar uses a fixed 200-unit internal coordinate space centred on 0:
 *   - `--ci-left`  : left edge of the CI range as a percentage of the bar
 *   - `--ci-right` : right blank space (100% − right edge)
 *   - `--ci-mean`  : position of the mean marker
 *
 * Returns an empty string when any argument is null.
 */
export function ciBarStyle(
  mean: number | null,
  p5:   number | null,
  p95:  number | null,
): string {
  if (mean === null || p5 === null || p95 === null) return "";
  const range     = Math.max(Math.abs(p5), Math.abs(p95), 0.001);
  const leftPct   = ((p5  / range + 1) / 2) * 100;
  const rightPct  = ((p95 / range + 1) / 2) * 100;
  const meanPct   = ((mean / range + 1) / 2) * 100;
  return `--ci-left:${leftPct.toFixed(1)}%;--ci-right:${(100 - rightPct).toFixed(1)}%;--ci-mean:${meanPct.toFixed(1)}%`;
}
