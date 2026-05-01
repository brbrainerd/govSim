/**
 * Tests for routes.ts — pure lookup functions with no side-effects.
 *
 * Covers:
 *  - urlFor: maps every ViewName to a unique path beginning with "/"
 *  - SHORTCUTS: keyboard shortcut keymap is consistent with ROUTES
 */
import { describe, it, expect } from "vitest";
import { urlFor, ROUTES, SHORTCUTS } from "./routes";
import type { ViewName } from "./routes";

// All ViewName values derived from the ROUTES table so this stays in sync
// if new routes are ever added.
const ALL_VIEWS = ROUTES.map(r => r.view) as ViewName[];

// ── urlFor ────────────────────────────────────────────────────────────────────

describe("urlFor", () => {
  it("returns a string starting with '/' for every known view", () => {
    for (const view of ALL_VIEWS) {
      expect(urlFor(view)).toMatch(/^\//);
    }
  });

  it("maps each view to a unique path", () => {
    const paths = ALL_VIEWS.map(urlFor);
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);
  });

  it("returns /dashboard as fallback for unknown views", () => {
    expect(urlFor("totally_unknown_view" as ViewName)).toBe("/dashboard");
  });

  it("maps known views to their expected paths", () => {
    expect(urlFor("start")).toBe("/start");
    expect(urlFor("dashboard")).toBe("/dashboard");
    expect(urlFor("laws")).toBe("/laws");
    expect(urlFor("propose")).toBe("/propose");
    expect(urlFor("citizens")).toBe("/citizens");
    expect(urlFor("elections")).toBe("/elections");
    expect(urlFor("regions")).toBe("/regions");
    expect(urlFor("effect")).toBe("/effect");
    expect(urlFor("settings")).toBe("/settings");
  });
});

// ── SHORTCUTS ─────────────────────────────────────────────────────────────────

describe("SHORTCUTS", () => {
  it("only contains views that exist in ROUTES", () => {
    const validViews = new Set(ALL_VIEWS);
    for (const view of Object.values(SHORTCUTS)) {
      expect(validViews.has(view)).toBe(true);
    }
  });

  it("maps the expected single-letter keys to their views", () => {
    expect(SHORTCUTS["d"]).toBe("dashboard");
    expect(SHORTCUTS["l"]).toBe("laws");
    expect(SHORTCUTS["p"]).toBe("propose");
    expect(SHORTCUTS["c"]).toBe("citizens");
    expect(SHORTCUTS["e"]).toBe("elections");
    expect(SHORTCUTS["r"]).toBe("regions");
    expect(SHORTCUTS["s"]).toBe("settings");
  });

  it("does not include 'start' (no shortcut defined for start)", () => {
    expect(Object.values(SHORTCUTS)).not.toContain("start");
  });

  it("does not include 'effect' (no shortcut defined for effect)", () => {
    expect(Object.values(SHORTCUTS)).not.toContain("effect");
  });

  it("has no duplicate shortcut keys", () => {
    const keys = Object.keys(SHORTCUTS);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it("has no duplicate target views", () => {
    const views = Object.values(SHORTCUTS);
    const unique = new Set(views);
    expect(unique.size).toBe(views.length);
  });
});
