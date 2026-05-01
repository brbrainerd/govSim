/**
 * Tests for command-palette fuzzy search.
 *
 * The scoring rules in commands.svelte.ts: substring in label > word-prefix
 * > substring in id. We test the relative ordering, not absolute scores.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { commands, registerCommand, searchCommands } from "./commands.svelte";

beforeEach(() => {
  commands.items = [];
  registerCommand({ id: "nav.dashboard",       label: "Go to Dashboard",                         run: () => {} });
  registerCommand({ id: "nav.laws",            label: "Go to Active Laws",                       run: () => {} });
  registerCommand({ id: "nav.regions",         label: "Go to Regions",                           run: () => {} });
  registerCommand({ id: "sim.step.30",         label: "Step +30 ticks",                          run: () => {} });
  registerCommand({ id: "sim.step.360",        label: "Step +1 year",                            run: () => {} });
  registerCommand({ id: "sim.monte_carlo.run", label: "Run Monte Carlo analysis on selected law", run: () => {} });
  registerCommand({ id: "sim.snapshot.save",   label: "Save snapshot (counterfactual fork point)", run: () => {} });
  registerCommand({ id: "settings.theme.cycle", label: "Cycle theme",                            run: () => {} });
  registerCommand({ id: "data.export.csv",      label: "Export metrics to CSV",                   run: () => {} });
  registerCommand({ id: "sim.speed.10",         label: "Set autostep speed: 10×",                 run: () => {} });
});

describe("searchCommands", () => {
  it("returns all commands when query is empty", () => {
    expect(searchCommands("").length).toBe(10);
    expect(searchCommands("   ").length).toBe(10);
  });

  it("matches substrings in label", () => {
    const results = searchCommands("dashboard");
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("nav.dashboard");
  });

  it("matches case-insensitively", () => {
    expect(searchCommands("DASHBOARD")[0].id).toBe("nav.dashboard");
    expect(searchCommands("DASHboard")[0].id).toBe("nav.dashboard");
  });

  it("ranks word-prefix matches above plain substrings", () => {
    // "step" appears as a word in "Step +30 ticks" and in "Step +1 year".
    // Should return both, sorted by score.
    const r = searchCommands("step");
    expect(r.length).toBeGreaterThanOrEqual(2);
    expect(r[0].id).toMatch(/^sim\.step\./);
  });

  it("falls back to id substring matches", () => {
    const r = searchCommands("settings");
    expect(r.find(c => c.id === "settings.theme.cycle")).toBeDefined();
  });

  it("returns empty array for no matches", () => {
    expect(searchCommands("zzzzz")).toEqual([]);
  });

  it("registerCommand replaces existing command with same id", () => {
    registerCommand({ id: "nav.dashboard", label: "Renamed", run: () => {} });
    const r = searchCommands("renamed");
    expect(r.length).toBe(1);
    expect(commands.items.filter(c => c.id === "nav.dashboard").length).toBe(1);
  });

  it("finds sim.monte_carlo.run by label substring 'monte'", () => {
    const r = searchCommands("monte");
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0].id).toBe("sim.monte_carlo.run");
  });

  it("finds sim.snapshot.save by label substring 'snapshot'", () => {
    const r = searchCommands("snapshot");
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0].id).toBe("sim.snapshot.save");
  });

  it("finds nav.regions by label substring 'region'", () => {
    const r = searchCommands("region");
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0].id).toBe("nav.regions");
  });

  it("id-based search finds sim commands via 'monte_carlo'", () => {
    const r = searchCommands("monte_carlo");
    expect(r.find(c => c.id === "sim.monte_carlo.run")).toBeDefined();
  });

  it("finds data.export.csv by label substring 'export'", () => {
    const r = searchCommands("export");
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0].id).toBe("data.export.csv");
  });

  it("finds sim.speed.10 by label substring 'autostep speed'", () => {
    const r = searchCommands("autostep speed");
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r.find(c => c.id === "sim.speed.10")).toBeDefined();
  });
});
