/**
 * Tests for store.svelte.ts utility functions.
 *
 * Covers:
 *  - exportMetricsCsv: CSV generation, download trigger, early-return on empty.
 *  - navigate: view switching, router.goto routing, path deduplication.
 *  - initRouting: hash-based startup view, router.subscribe wiring.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mocks (hoisted before imports by vitest) ─────────────────────────────────

vi.mock("tinro", () => ({
  router: {
    goto:      vi.fn(),
    mode:      { hash: vi.fn() },
    subscribe: vi.fn(),
  },
}));

// ── Imports (after vi.mock declarations) ─────────────────────────────────────

import { router }                                             from "tinro";
import { sim, ui, navigate, initRouting, exportMetricsCsv }  from "./store.svelte";

// ── exportMetricsCsv ─────────────────────────────────────────────────────────

describe("exportMetricsCsv", () => {
  beforeEach(() => {
    sim.metricsRows = [];
    sim.tick        = 0;
    // jsdom does not implement URL.createObjectURL — supply stubs.
    URL.createObjectURL = vi.fn(() => "blob:mock");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when metricsRows is empty", () => {
    expect(exportMetricsCsv()).toBe(false);
  });

  it("does not touch URL.createObjectURL when there are no rows", () => {
    exportMetricsCsv();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("returns true when metricsRows has at least one row", () => {
    sim.metricsRows = [{ tick: 1, approval: 0.5 } as any];
    expect(exportMetricsCsv()).toBe(true);
  });

  it("calls URL.createObjectURL with a Blob when rows are present", () => {
    sim.metricsRows = [{ tick: 1, approval: 0.72 } as any];
    exportMetricsCsv();
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    const arg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg).toBeInstanceOf(Blob);
  });

  it("calls URL.revokeObjectURL with the generated object URL", () => {
    sim.metricsRows = [{ tick: 1, approval: 0.5 } as any];
    exportMetricsCsv();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });

  it("triggers anchor.click() to initiate the download", () => {
    sim.metricsRows = [{ tick: 1, approval: 0.5 } as any];
    exportMetricsCsv();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
  });

  it("sets anchor download filename containing the current tick number", () => {
    sim.tick        = 42;
    sim.metricsRows = [{ tick: 42, approval: 0.7 } as any];
    let capturedAnchor: HTMLAnchorElement | null = null;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      capturedAnchor = this;
    });
    exportMetricsCsv();
    expect(capturedAnchor).not.toBeNull();
    expect(capturedAnchor!.download).toContain("42");
  });

  it("CSV Blob has text/csv content type", () => {
    sim.metricsRows = [{ tick: 1, approval: 0.5 } as any];
    let capturedBlob: Blob | null = null;
    (URL.createObjectURL as ReturnType<typeof vi.fn>).mockImplementation((b: Blob) => {
      capturedBlob = b;
      return "blob:mock";
    });
    exportMetricsCsv();
    expect(capturedBlob).not.toBeNull();
    expect(capturedBlob!.type).toContain("text/csv");
  });
});

// ── navigate ─────────────────────────────────────────────────────────────────

describe("navigate", () => {
  beforeEach(() => {
    ui.view = "start";
    vi.clearAllMocks();
  });

  it("sets ui.view to the target view", () => {
    navigate("dashboard");
    expect(ui.view).toBe("dashboard");
  });

  it("calls router.goto with /dashboard for 'dashboard'", () => {
    navigate("dashboard");
    expect(router.goto).toHaveBeenCalledWith("/dashboard");
  });

  it("calls router.goto with /laws for 'laws'", () => {
    navigate("laws");
    expect(router.goto).toHaveBeenCalledWith("/laws");
  });

  it("calls router.goto with /citizens for 'citizens'", () => {
    navigate("citizens");
    expect(router.goto).toHaveBeenCalledWith("/citizens");
  });

  it("calls router.goto with /regions for 'regions'", () => {
    navigate("regions");
    expect(router.goto).toHaveBeenCalledWith("/regions");
  });

  it("skips router.goto when navigating to the already-current path", () => {
    // Module initialises currentPath = "/start"; urlFor("start") = "/start" → no-op.
    navigate("start");
    expect(router.goto).not.toHaveBeenCalled();
  });

  it("still sets ui.view even when router.goto is skipped", () => {
    navigate("start");
    expect(ui.view).toBe("start");
  });
});

// ── initRouting ──────────────────────────────────────────────────────────────

describe("initRouting", () => {
  beforeEach(() => {
    ui.view              = "start";
    window.location.hash = "";
    vi.clearAllMocks();
  });

  it("calls router.mode.hash() to enable hash-based routing", () => {
    initRouting();
    expect(router.mode.hash).toHaveBeenCalled();
  });

  it("registers a router.subscribe callback", () => {
    initRouting();
    expect(router.subscribe).toHaveBeenCalledOnce();
  });

  it("sets ui.view from the current hash on startup (#/laws → 'laws')", () => {
    window.location.hash = "#/laws";
    initRouting();
    expect(ui.view).toBe("laws");
  });

  it("sets ui.view from the current hash on startup (#/dashboard → 'dashboard')", () => {
    window.location.hash = "#/dashboard";
    initRouting();
    expect(ui.view).toBe("dashboard");
  });

  it("defaults ui.view to 'start' when no hash is present", () => {
    window.location.hash = "";
    initRouting();
    expect(ui.view).toBe("start");
  });

  it("defaults ui.view to 'start' for an unrecognised hash path", () => {
    window.location.hash = "#/totally-unknown";
    initRouting();
    expect(ui.view).toBe("start");
  });

  it("updates ui.view when the subscribe callback fires with a recognised path", () => {
    initRouting();
    const cb = vi.mocked(router.subscribe).mock.calls[0][0] as (
      loc: { path: string },
    ) => void;
    cb({ path: "/citizens" });
    expect(ui.view).toBe("citizens");
  });

  it("does not change ui.view when subscriber fires with an unknown path", () => {
    initRouting();
    ui.view = "laws"; // set explicitly after initRouting resets it
    const cb = vi.mocked(router.subscribe).mock.calls[0][0] as (
      loc: { path: string },
    ) => void;
    cb({ path: "/nonexistent" });
    expect(ui.view).toBe("laws");
  });
});
