/**
 * Tests for theme.ts — localStorage-backed preference helpers.
 *
 * Covers:
 *  - getThemeMode / getDensityMode / getCBMode: default + stored value reads.
 *  - getAutostepSpeed: default, clamping to [0.5, 30], NaN guard.
 *  - saveAutostepSpeed: persists to localStorage.
 *  - cycleTheme: dark → light → auto → dark cycle, persists on each step.
 *  - applyTheme / applyDensity / applyCB: sets data-* attributes on <html>.
 *
 * window.matchMedia is stubbed so auto-theme resolution works in jsdom.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Stub window.matchMedia before importing theme ─────────────────────────────

// jsdom does not implement matchMedia; stub it to return "prefers dark".
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: !query.includes("light"), // "prefers-color-scheme: light" → false
    media:   query,
    onchange: null,
    addEventListener:    vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent:       vi.fn(),
  })),
});

import {
  getThemeMode, getDensityMode, getCBMode,
  getAutostepSpeed, saveAutostepSpeed,
  applyTheme, applyDensity, applyCB,
  cycleTheme,
} from "./theme";

// ── Helpers ───────────────────────────────────────────────────────────────────

function clearPrefs() {
  localStorage.removeItem("ugs.theme");
  localStorage.removeItem("ugs.density");
  localStorage.removeItem("ugs.cb");
  localStorage.removeItem("ugs.autostep.speed");
}

// ── getThemeMode ─────────────────────────────────────────────────────────────

describe("getThemeMode", () => {
  beforeEach(clearPrefs);

  it("defaults to 'dark' when nothing is stored", () => {
    expect(getThemeMode()).toBe("dark");
  });

  it("returns the stored value when set", () => {
    localStorage.setItem("ugs.theme", "light");
    expect(getThemeMode()).toBe("light");
  });

  it("returns 'auto' when that was stored", () => {
    localStorage.setItem("ugs.theme", "auto");
    expect(getThemeMode()).toBe("auto");
  });
});

// ── getDensityMode ────────────────────────────────────────────────────────────

describe("getDensityMode", () => {
  beforeEach(clearPrefs);

  it("defaults to 'comfortable' when nothing is stored", () => {
    expect(getDensityMode()).toBe("comfortable");
  });

  it("returns 'compact' when that was stored", () => {
    localStorage.setItem("ugs.density", "compact");
    expect(getDensityMode()).toBe("compact");
  });

  it("returns 'spacious' when that was stored", () => {
    localStorage.setItem("ugs.density", "spacious");
    expect(getDensityMode()).toBe("spacious");
  });
});

// ── getCBMode ─────────────────────────────────────────────────────────────────

describe("getCBMode", () => {
  beforeEach(clearPrefs);

  it("defaults to 'default' when nothing is stored", () => {
    expect(getCBMode()).toBe("default");
  });

  it("returns 'safe' when that was stored", () => {
    localStorage.setItem("ugs.cb", "safe");
    expect(getCBMode()).toBe("safe");
  });
});

// ── getAutostepSpeed ──────────────────────────────────────────────────────────

describe("getAutostepSpeed", () => {
  beforeEach(clearPrefs);

  it("defaults to 2 when nothing is stored", () => {
    expect(getAutostepSpeed()).toBe(2);
  });

  it("returns the stored speed for a valid value", () => {
    localStorage.setItem("ugs.autostep.speed", "5");
    expect(getAutostepSpeed()).toBe(5);
  });

  it("clamps stored value below 0.5 up to 0.5", () => {
    localStorage.setItem("ugs.autostep.speed", "0.1");
    expect(getAutostepSpeed()).toBe(0.5);
  });

  it("clamps stored value above 30 down to 30", () => {
    localStorage.setItem("ugs.autostep.speed", "100");
    expect(getAutostepSpeed()).toBe(30);
  });

  it("returns 2 (default) when stored value is NaN", () => {
    localStorage.setItem("ugs.autostep.speed", "not-a-number");
    expect(getAutostepSpeed()).toBe(2);
  });

  it("returns 2 (default) when stored value is empty string", () => {
    localStorage.setItem("ugs.autostep.speed", "");
    expect(getAutostepSpeed()).toBe(2);
  });
});

// ── saveAutostepSpeed ─────────────────────────────────────────────────────────

describe("saveAutostepSpeed", () => {
  beforeEach(clearPrefs);

  it("persists a valid speed to localStorage", () => {
    saveAutostepSpeed(10);
    expect(localStorage.getItem("ugs.autostep.speed")).toBe("10");
  });

  it("value is readable back via getAutostepSpeed", () => {
    saveAutostepSpeed(5);
    expect(getAutostepSpeed()).toBe(5);
  });
});

// ── applyTheme ────────────────────────────────────────────────────────────────

describe("applyTheme", () => {
  beforeEach(clearPrefs);

  it("sets data-theme='dark' on <html> for 'dark' mode", () => {
    applyTheme("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("sets data-theme='light' on <html> for 'light' mode", () => {
    applyTheme("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("resolves 'auto' to 'dark' when matchMedia says dark (stubbed)", () => {
    applyTheme("auto");
    // Our stub: query.includes("light") === false → matches=true is reversed →
    // matchMedia("(prefers-color-scheme: light)").matches = false → resolves "dark"
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("persists the chosen mode (not resolved) to localStorage", () => {
    applyTheme("auto");
    expect(localStorage.getItem("ugs.theme")).toBe("auto");
  });
});

// ── applyDensity ─────────────────────────────────────────────────────────────

describe("applyDensity", () => {
  beforeEach(clearPrefs);

  it("sets data-density on <html>", () => {
    applyDensity("compact");
    expect(document.documentElement.getAttribute("data-density")).toBe("compact");
  });

  it("persists the density to localStorage", () => {
    applyDensity("spacious");
    expect(localStorage.getItem("ugs.density")).toBe("spacious");
  });
});

// ── applyCB ───────────────────────────────────────────────────────────────────

describe("applyCB", () => {
  beforeEach(clearPrefs);

  it("sets data-cb on <html>", () => {
    applyCB("safe");
    expect(document.documentElement.getAttribute("data-cb")).toBe("safe");
  });

  it("persists the palette to localStorage", () => {
    applyCB("safe");
    expect(localStorage.getItem("ugs.cb")).toBe("safe");
  });
});

// ── cycleTheme ────────────────────────────────────────────────────────────────

describe("cycleTheme", () => {
  beforeEach(clearPrefs);

  it("cycles dark → light", () => {
    localStorage.setItem("ugs.theme", "dark");
    const next = cycleTheme();
    expect(next).toBe("light");
  });

  it("cycles light → auto", () => {
    localStorage.setItem("ugs.theme", "light");
    const next = cycleTheme();
    expect(next).toBe("auto");
  });

  it("cycles auto → dark", () => {
    localStorage.setItem("ugs.theme", "auto");
    const next = cycleTheme();
    expect(next).toBe("dark");
  });

  it("persists the new mode to localStorage after cycling", () => {
    localStorage.setItem("ugs.theme", "dark");
    cycleTheme();
    expect(localStorage.getItem("ugs.theme")).toBe("light");
  });

  it("starting from empty storage (default 'dark') cycles to 'light'", () => {
    // default is 'dark', so cycle should go to 'light'
    const next = cycleTheme();
    expect(next).toBe("light");
  });
});
