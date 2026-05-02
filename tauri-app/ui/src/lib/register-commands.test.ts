/**
 * Smoke tests for registerStandardCommands().
 *
 * Verifies that calling registerStandardCommands() populates the command
 * registry with every expected command ID. Does NOT test the run() callbacks
 * (those depend on live IPC / Tauri), just that the commands are registered.
 *
 * All module-level side-effect imports are mocked so that Tauri's invoke(),
 * tinro's router, and Svelte reactive state are replaced with stubs that work
 * in the vitest jsdom environment.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Mock heavy external dependencies before importing the module under test ──

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(null),
}));

vi.mock("tinro", () => ({
  router: {
    mode:      { hash: vi.fn() },
    goto:      vi.fn(),
    subscribe:  vi.fn(() => vi.fn()),
    location:  { pathname: "/dashboard" },
  },
}));

vi.mock("./ipc", () => ({
  stepAndGetState:   vi.fn().mockResolvedValue({ tick: 0, state: null, metrics: [], laws: [] }),
  saveSimSnapshot:   vi.fn().mockResolvedValue(0),
  listLaws:          vi.fn().mockResolvedValue([]),
  enactFlatTax:      vi.fn().mockResolvedValue(1),
  enactUbi:          vi.fn().mockResolvedValue(1),
  enactAbatement:    vi.fn().mockResolvedValue(1),
  repealLaw:         vi.fn().mockResolvedValue(undefined),
  getLawDslSource:   vi.fn().mockResolvedValue(""),
  getLawEffect:      vi.fn().mockResolvedValue(null),
  runMonteCarlo:     vi.fn().mockResolvedValue(null),
}));

vi.mock("./store.svelte", () => ({
  navigate:        vi.fn(),
  exportMetricsCsv: vi.fn().mockReturnValue(true),
  sim: {
    loaded:      false,
    tick:        0,
    currentState: null,
    metricsRows: [],
    laws:        [],
  },
  ui: {
    effectLawId:    null,
    effectEnactedTick: null,
    triggerMC:      false,
    view:           "dashboard",
    filterRegionId: null,
  },
  beginLoad:  vi.fn(),
  endLoad:    vi.fn(),
  setError:   vi.fn(),
  formatMoney: vi.fn((n: number) => `$${n}`),
  pct:         vi.fn((n: number) => `${(n * 100).toFixed(1)}%`),
  tickToDate:  vi.fn(() => ""),
}));

vi.mock("./toasts.svelte", () => ({
  toast: {
    info:    vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    danger:  vi.fn(),
    error:   vi.fn(),
  },
  pushToast:   vi.fn(),
  dismissToast: vi.fn(),
  toasts:      { items: [] },
}));

vi.mock("./theme", () => ({
  cycleTheme:        vi.fn(),
  applyTheme:        vi.fn(),
  applyDensity:      vi.fn(),
  applyCB:           vi.fn(),
  getThemeMode:      vi.fn(() => "dark"),
  getDensityMode:    vi.fn(() => "comfortable"),
  getCBMode:         vi.fn(() => "default"),
  getAutostepSpeed:  vi.fn(() => 2),
  saveAutostepSpeed: vi.fn(),
}));

vi.mock("./autostep.svelte", () => ({
  toggle:    vi.fn(),
  setSpeed:  vi.fn(),
  autostep:  { running: false, elapsed: 0, speed: 2 },
  start:     vi.fn(),
  stop:      vi.fn(),
}));

// ── Import modules AFTER mocks are set up ─────────────────────────────────────

import { commands } from "./commands.svelte";
import { registerStandardCommands } from "./register-commands";

// ── Helpers ───────────────────────────────────────────────────────────────────

function ids(): string[] {
  return commands.items.map(c => c.id);
}

// Reset command registry before each test.
beforeEach(() => {
  commands.items = [];
  registerStandardCommands();
});

// ── Navigation commands ───────────────────────────────────────────────────────

describe("navigation commands", () => {
  it("registers nav.dashboard (inNav route)", () => {
    expect(ids()).toContain("nav.dashboard");
  });

  it("registers nav.laws (inNav route)", () => {
    expect(ids()).toContain("nav.laws");
  });

  it("registers nav.propose (inNav route)", () => {
    expect(ids()).toContain("nav.propose");
  });

  it("registers nav.citizens (inNav route)", () => {
    expect(ids()).toContain("nav.citizens");
  });

  it("registers nav.elections (inNav route)", () => {
    expect(ids()).toContain("nav.elections");
  });

  it("registers nav.regions (inNav route)", () => {
    expect(ids()).toContain("nav.regions");
  });

  it("registers nav.start (manual entry)", () => {
    expect(ids()).toContain("nav.start");
  });

  it("registers nav.settings (manual entry)", () => {
    expect(ids()).toContain("nav.settings");
  });

  it("registers nav.effect (manual entry)", () => {
    expect(ids()).toContain("nav.effect");
  });
});

// ── Simulation commands ───────────────────────────────────────────────────────

describe("simulation commands", () => {
  it("registers sim.step.1", () => {
    expect(ids()).toContain("sim.step.1");
  });

  it("registers sim.step.30", () => {
    expect(ids()).toContain("sim.step.30");
  });

  it("registers sim.step.360", () => {
    expect(ids()).toContain("sim.step.360");
  });

  it("registers sim.autostep.toggle", () => {
    expect(ids()).toContain("sim.autostep.toggle");
  });

  it("registers sim.monte_carlo.run", () => {
    expect(ids()).toContain("sim.monte_carlo.run");
  });

  it("registers sim.snapshot.save", () => {
    expect(ids()).toContain("sim.snapshot.save");
  });
});

// ── Settings commands ─────────────────────────────────────────────────────────

describe("settings commands", () => {
  it("registers settings.theme.cycle", () => {
    expect(ids()).toContain("settings.theme.cycle");
  });

  it("registers settings.density.compact", () => {
    expect(ids()).toContain("settings.density.compact");
  });

  it("registers settings.density.comfortable", () => {
    expect(ids()).toContain("settings.density.comfortable");
  });

  it("registers settings.density.spacious", () => {
    expect(ids()).toContain("settings.density.spacious");
  });
});

// ── Data commands ─────────────────────────────────────────────────────────────

describe("data commands", () => {
  it("registers data.export.csv", () => {
    expect(ids()).toContain("data.export.csv");
  });
});

// ── Speed preset commands ─────────────────────────────────────────────────────

describe("speed preset commands", () => {
  for (const s of [0.5, 1, 2, 5, 10, 20, 30]) {
    it(`registers sim.speed.${s}`, () => {
      expect(ids()).toContain(`sim.speed.${s}`);
    });
  }
});

// ── Global invariants ─────────────────────────────────────────────────────────

describe("invariants", () => {
  it("registers at least 27 commands total", () => {
    // 6 inNav routes + 3 manual nav + 6 sim + 4 settings + 1 data + 7 speeds = 27
    expect(commands.items.length).toBeGreaterThanOrEqual(27);
  });

  it("all registered commands have a non-empty id and label", () => {
    for (const cmd of commands.items) {
      expect(cmd.id.length).toBeGreaterThan(0);
      expect(cmd.label.length).toBeGreaterThan(0);
    }
  });

  it("all registered commands have a run function", () => {
    for (const cmd of commands.items) {
      expect(typeof cmd.run).toBe("function");
    }
  });

  it("no duplicate command ids after a single call", () => {
    const idList = ids();
    const unique = new Set(idList);
    expect(idList.length).toBe(unique.size);
  });

  it("calling registerStandardCommands twice replaces (no duplicates)", () => {
    // Second call should upsert, not append duplicates
    registerStandardCommands();
    const idList = ids();
    const unique = new Set(idList);
    expect(idList.length).toBe(unique.size);
  });
});
