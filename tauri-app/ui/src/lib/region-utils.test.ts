/**
 * Tests for region-utils.ts — pure heat-bar helpers.
 *
 * Covers:
 *  - normalizeInRange: flat column (hi===lo) → 0.5, min→0, max→1,
 *    midpoint, out-of-range passthrough, negative ranges.
 *  - makeHeatBarStyle: higherIsBetter=true/false hue poles, CSS format,
 *    width encoding, extreme values (0 and 1).
 */
import { describe, it, expect } from "vitest";
import { normalizeInRange, makeHeatBarStyle } from "./region-utils";

// ── normalizeInRange ──────────────────────────────────────────────────────────

describe("normalizeInRange", () => {
  it("returns 0.5 when hi === lo (flat column)", () => {
    expect(normalizeInRange(5, 5, 5)).toBe(0.5);
    expect(normalizeInRange(0, 0, 0)).toBe(0.5);
  });

  it("returns 0 for the minimum value", () => {
    expect(normalizeInRange(0, 0, 10)).toBe(0);
    expect(normalizeInRange(3, 3, 7)).toBe(0);
  });

  it("returns 1 for the maximum value", () => {
    expect(normalizeInRange(10, 0, 10)).toBe(1);
    expect(normalizeInRange(7, 3, 7)).toBe(1);
  });

  it("returns 0.5 for the exact midpoint", () => {
    expect(normalizeInRange(5, 0, 10)).toBeCloseTo(0.5, 10);
    expect(normalizeInRange(50, 0, 100)).toBeCloseTo(0.5, 10);
  });

  it("handles negative ranges correctly", () => {
    // range [-10, 10]: midpoint 0 → 0.5, -10 → 0, 10 → 1
    expect(normalizeInRange(-10, -10, 10)).toBeCloseTo(0.0, 10);
    expect(normalizeInRange(0,   -10, 10)).toBeCloseTo(0.5, 10);
    expect(normalizeInRange(10,  -10, 10)).toBeCloseTo(1.0, 10);
  });

  it("does not clamp — values outside [lo, hi] produce results outside [0,1]", () => {
    // 15 in range [0, 10] → 1.5 (not clamped)
    expect(normalizeInRange(15, 0, 10)).toBeCloseTo(1.5, 10);
    // -5 in range [0, 10] → -0.5
    expect(normalizeInRange(-5, 0, 10)).toBeCloseTo(-0.5, 10);
  });

  it("handles a non-zero lo correctly", () => {
    // range [100, 200]: value 150 → 0.5
    expect(normalizeInRange(150, 100, 200)).toBeCloseTo(0.5, 10);
    expect(normalizeInRange(100, 100, 200)).toBeCloseTo(0.0, 10);
    expect(normalizeInRange(200, 100, 200)).toBeCloseTo(1.0, 10);
  });
});

// ── makeHeatBarStyle ──────────────────────────────────────────────────────────

describe("makeHeatBarStyle", () => {
  it("returns a non-empty CSS string", () => {
    expect(makeHeatBarStyle(0.5, true).length).toBeGreaterThan(0);
  });

  it("contains width, background and opacity properties", () => {
    const s = makeHeatBarStyle(0.5, true);
    expect(s).toContain("width:");
    expect(s).toContain("background:");
    expect(s).toContain("opacity:");
  });

  it("encodes width as a percentage of normalizedVal", () => {
    // normalizedVal=0.75 → width: 75.0%
    expect(makeHeatBarStyle(0.75, true)).toContain("width:75.0%");
  });

  it("width is 0.0% for normalizedVal=0", () => {
    expect(makeHeatBarStyle(0, true)).toContain("width:0.0%");
  });

  it("width is 100.0% for normalizedVal=1", () => {
    expect(makeHeatBarStyle(1, true)).toContain("width:100.0%");
  });

  it("higherIsBetter=true: normalizedVal=1 → green hue (120)", () => {
    // quality=1 → hue=120
    const s = makeHeatBarStyle(1, true);
    expect(s).toContain("hsl(120,");
  });

  it("higherIsBetter=true: normalizedVal=0 → red hue (0)", () => {
    // quality=0 → hue=0
    const s = makeHeatBarStyle(0, true);
    expect(s).toContain("hsl(0,");
  });

  it("higherIsBetter=false: normalizedVal=0 → green hue (120) — low unemployment is good", () => {
    // quality = 1 - 0 = 1 → hue=120
    const s = makeHeatBarStyle(0, false);
    expect(s).toContain("hsl(120,");
  });

  it("higherIsBetter=false: normalizedVal=1 → red hue (0) — high unemployment is bad", () => {
    // quality = 1 - 1 = 0 → hue=0
    const s = makeHeatBarStyle(1, false);
    expect(s).toContain("hsl(0,");
  });

  it("midpoint gives yellow hue (~60) for higherIsBetter=true", () => {
    // normalizedVal=0.5, higherIsBetter=true → quality=0.5 → hue=60
    const s = makeHeatBarStyle(0.5, true);
    expect(s).toContain("hsl(60,");
  });

  it("always ends with opacity:0.22", () => {
    for (const v of [0, 0.25, 0.5, 0.75, 1]) {
      const s = makeHeatBarStyle(v, true);
      expect(s).toMatch(/opacity:0\.22$/);
    }
  });
});
