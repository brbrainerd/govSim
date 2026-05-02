/**
 * Tests for formatting helpers in store.svelte.ts.
 *
 * These functions get called all over the dashboard — regressions here
 * would silently distort every chart label.
 */
import { describe, it, expect, vi } from "vitest";

// store.svelte imports tinro (Svelte 4 router) whose pre-compiled dist bundle
// references svelte/internal which no longer exists in Svelte 5.
// Mock the whole module so the test environment never loads it.
vi.mock("tinro", () => ({
  router: { goto: vi.fn(), mode: { hash: vi.fn() }, subscribe: vi.fn() },
}));

import { formatMoney, pct, tickToDate } from "./store.svelte";

describe("formatMoney", () => {
  it("formats sub-thousands as plain dollars", () => {
    expect(formatMoney(0)).toBe("$0");
    expect(formatMoney(1)).toBe("$1");
    expect(formatMoney(999)).toBe("$999");
  });

  it("formats thousands with K suffix", () => {
    expect(formatMoney(1000)).toBe("$1.0K");
    expect(formatMoney(12500)).toBe("$12.5K");
    expect(formatMoney(999999)).toBe("$1000.0K");
  });

  it("formats millions with M suffix", () => {
    expect(formatMoney(1_000_000)).toBe("$1.0M");
    expect(formatMoney(7_500_000)).toBe("$7.5M");
  });

  it("formats billions with B suffix", () => {
    expect(formatMoney(1e9)).toBe("$1.0B");
    expect(formatMoney(2.5e9)).toBe("$2.5B");
  });

  it("handles negatives by magnitude", () => {
    expect(formatMoney(-1500)).toBe("-$1.5K");
    expect(formatMoney(-2e6)).toBe("-$2.0M");
  });

  it("handles negative billions", () => {
    expect(formatMoney(-1e9)).toBe("-$1.0B");
    expect(formatMoney(-3.75e9)).toBe("-$3.8B");
  });

  it("sub-1000 values use integer formatting", () => {
    expect(formatMoney(0.4)).toBe("$0");
    expect(formatMoney(0.5)).toBe("$1"); // JS rounds 0.5 up with toFixed(0)
    expect(formatMoney(999.4)).toBe("$999");
  });

  it("negative sub-1000 places sign before $", () => {
    expect(formatMoney(-500)).toBe("-$500");
    expect(formatMoney(-1)).toBe("-$1");
  });

  it("boundary: 999_999 formats as K (rounds to 1000.0K, not M)", () => {
    // 999999 / 1000 = 999.999, toFixed(1) → "1000.0"
    expect(formatMoney(999_999)).toBe("$1000.0K");
  });

  it("boundary: 999_999_999 formats as M (rounds to 1000.0M, not B)", () => {
    // 999_999_999 / 1e6 = 999.999999, toFixed(1) → "1000.0"
    expect(formatMoney(999_999_999)).toBe("$1000.0M");
  });

  it("exact tier boundaries", () => {
    expect(formatMoney(1_000)).toBe("$1.0K");
    expect(formatMoney(1_000_000)).toBe("$1.0M");
    expect(formatMoney(1_000_000_000)).toBe("$1.0B");
  });
});

describe("pct", () => {
  it("converts fraction to percentage with 1 decimal", () => {
    expect(pct(0)).toBe("0.0%");
    expect(pct(0.5)).toBe("50.0%");
    expect(pct(1)).toBe("100.0%");
    expect(pct(0.123456)).toBe("12.3%");
  });

  it("handles negatives", () => {
    expect(pct(-0.05)).toBe("-5.0%");
  });
});

describe("tickToDate", () => {
  it("starts at year 2026 month 1 at tick 0", () => {
    expect(tickToDate(0)).toBe("Y2026 M1");
  });

  it("rolls month every 30 ticks", () => {
    expect(tickToDate(30)).toBe("Y2026 M2");
    expect(tickToDate(60)).toBe("Y2026 M3");
    expect(tickToDate(330)).toBe("Y2026 M12");
  });

  it("rolls year every 360 ticks", () => {
    expect(tickToDate(360)).toBe("Y2027 M1");
    expect(tickToDate(720)).toBe("Y2028 M1");
  });

  it("handles mid-year ticks correctly", () => {
    expect(tickToDate(180)).toBe("Y2026 M7");   // exactly 6 months in
    expect(tickToDate(181)).toBe("Y2026 M7");   // still month 7 (doesn't tick until +30)
    expect(tickToDate(209)).toBe("Y2026 M7");   // last tick of month 7
    expect(tickToDate(210)).toBe("Y2026 M8");   // first tick of month 8
  });

  it("handles large tick values spanning multiple decades", () => {
    // 10 years = 3600 ticks → Y2036 M1
    expect(tickToDate(3600)).toBe("Y2036 M1");
    // 50 years = 18000 ticks → Y2076 M1
    expect(tickToDate(18000)).toBe("Y2076 M1");
  });

  it("tick 359 is the last tick of the first year", () => {
    expect(tickToDate(359)).toBe("Y2026 M12");
  });

  it("tick 1 is still month 1 (30-tick months, not 1-tick months)", () => {
    expect(tickToDate(1)).toBe("Y2026 M1");
    expect(tickToDate(29)).toBe("Y2026 M1");
  });
});
