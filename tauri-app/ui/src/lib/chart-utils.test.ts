/**
 * Unit tests for chart-utils.ts.
 *
 * Both `toSparkPoints` and `ciBarStyle` are pure functions — no DOM,
 * no Svelte reactivity, no mocks needed.
 */
import { describe, it, expect } from "vitest";
import { toSparkPoints, ciBarStyle } from "./chart-utils";

// ─── toSparkPoints ────────────────────────────────────────────────────────────

describe("toSparkPoints", () => {
  it("returns empty string for empty array", () => {
    expect(toSparkPoints([])).toBe("");
  });

  it("returns empty string for single-point array", () => {
    expect(toSparkPoints([42])).toBe("");
  });

  it("maps two points to the extremes of the x-axis", () => {
    const result = toSparkPoints([0, 100]);
    const pairs  = result.split(" ");
    expect(pairs).toHaveLength(2);
    expect(pairs[0]).toMatch(/^0\.0,/);    // first x = 0
    expect(pairs[1]).toMatch(/^100\.0,/);  // last  x = 100
  });

  it("places min value at y=22 and max value at y=2 (inverted SVG axis)", () => {
    // data=[0, 100] → min=0 goes to y=22, max=100 goes to y=2
    const result = toSparkPoints([0, 100]);
    const [first, last] = result.split(" ").map(p => {
      const [x, y] = p.split(",").map(Number);
      return { x, y };
    });
    expect(first.y).toBeCloseTo(22, 1); // min value → bottom of chart
    expect(last.y).toBeCloseTo(2, 1);   // max value → top of chart
  });

  it("handles a flat line (all same value) without divide-by-zero", () => {
    const result = toSparkPoints([5, 5, 5]);
    // range = 0 → clamped to 1; all y should equal 22 (min=max so all are min)
    const ys = result.split(" ").map(p => parseFloat(p.split(",")[1]));
    expect(ys).toHaveLength(3);
    ys.forEach(y => expect(y).toBeCloseTo(22, 1));
  });

  it("distributes x coordinates evenly across [0, 100]", () => {
    const result = toSparkPoints([10, 20, 30, 40, 50]);
    const xs = result.split(" ").map(p => parseFloat(p.split(",")[0]));
    expect(xs[0]).toBeCloseTo(0, 1);
    expect(xs[1]).toBeCloseTo(25, 1);
    expect(xs[2]).toBeCloseTo(50, 1);
    expect(xs[3]).toBeCloseTo(75, 1);
    expect(xs[4]).toBeCloseTo(100, 1);
  });

  it("keeps y values within the [2, 22] range", () => {
    const data = [-1000, 0, 500, 1234, -500];
    const ys   = toSparkPoints(data).split(" ").map(p => parseFloat(p.split(",")[1]));
    ys.forEach(y => {
      expect(y).toBeGreaterThanOrEqual(2 - 0.01);
      expect(y).toBeLessThanOrEqual(22 + 0.01);
    });
  });

  it("handles negative values correctly", () => {
    // [-10, 0, 10]: min=-10 → y=22, max=10 → y=2, mid=0 → y=12
    const result = toSparkPoints([-10, 0, 10]);
    const points = result.split(" ").map(p => {
      const [x, y] = p.split(",").map(Number);
      return { x, y };
    });
    expect(points[0].y).toBeCloseTo(22, 1);
    expect(points[1].y).toBeCloseTo(12, 1);
    expect(points[2].y).toBeCloseTo(2, 1);
  });

  it("produces output parseable as a valid SVG polyline points string", () => {
    const result = toSparkPoints([3, 1, 4, 1, 5, 9]);
    // Each pair must be "number,number"
    const pairRe = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    result.split(" ").forEach(pair => {
      expect(pair).toMatch(pairRe);
    });
  });
});

// ─── ciBarStyle ───────────────────────────────────────────────────────────────

describe("ciBarStyle", () => {
  it("returns empty string when mean is null", () => {
    expect(ciBarStyle(null, -5, 5)).toBe("");
  });

  it("returns empty string when p5 is null", () => {
    expect(ciBarStyle(0, null, 5)).toBe("");
  });

  it("returns empty string when p95 is null", () => {
    expect(ciBarStyle(0, -5, null)).toBe("");
  });

  it("returns a string containing all three CSS custom properties", () => {
    const result = ciBarStyle(0, -10, 10);
    expect(result).toContain("--ci-left:");
    expect(result).toContain("--ci-right:");
    expect(result).toContain("--ci-mean:");
  });

  it("places a symmetric CI centred on 0 with mean at 50%", () => {
    // mean=0, p5=-10, p95=10 → range=10 → leftPct=0%, rightPct=0%, meanPct=50%
    const result = ciBarStyle(0, -10, 10);
    expect(result).toContain("--ci-left:0.0%");
    expect(result).toContain("--ci-right:0.0%");
    expect(result).toContain("--ci-mean:50.0%");
  });

  it("places a positive-only CI correctly", () => {
    // mean=5, p5=1, p95=10 → range=10 → leftPct=(1/10+1)/2*100=55%, etc.
    const result = ciBarStyle(5, 1, 10);
    const leftPct  = ((1  / 10 + 1) / 2) * 100; // 55
    const rightPct = ((10 / 10 + 1) / 2) * 100; // 100 → 0% right blank
    const meanPct  = ((5  / 10 + 1) / 2) * 100; // 75
    expect(result).toContain(`--ci-left:${leftPct.toFixed(1)}%`);
    expect(result).toContain(`--ci-right:${(100 - rightPct).toFixed(1)}%`);
    expect(result).toContain(`--ci-mean:${meanPct.toFixed(1)}%`);
  });

  it("never produces negative left or right percentages for extreme values", () => {
    // Extreme negative CI: mean=-100, p5=-200, p95=-50
    const result = ciBarStyle(-100, -200, -50);
    const leftMatch  = result.match(/--ci-left:([\d.]+)%/);
    const rightMatch = result.match(/--ci-right:([\d.]+)%/);
    expect(leftMatch).not.toBeNull();
    expect(rightMatch).not.toBeNull();
    expect(parseFloat(leftMatch![1])).toBeGreaterThanOrEqual(0);
    expect(parseFloat(rightMatch![1])).toBeGreaterThanOrEqual(0);
  });

  it("handles zero values without divide-by-zero (clamps range to 0.001)", () => {
    // mean=p5=p95=0 → range clamped to 0.001, still produces valid output
    const result = ciBarStyle(0, 0, 0);
    expect(result).toContain("--ci-left:");
    expect(result).toContain("--ci-mean:");
    expect(result).toContain("--ci-right:");
  });
});
