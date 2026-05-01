/**
 * Tests for the autostep module.
 *
 * Verifies that:
 *  1. start/stop/toggle/setSpeed state transitions are correct.
 *  2. After a successful IPC tick, sim.{tick,currentState,metricsRows,laws}
 *     are mapped from the StepResultDto and autostep.elapsed increments.
 *  3. IPC errors cause autostep to stop and surface a toast.
 *
 * Strategy: mock ./ipc and ./toasts.svelte so no real Tauri bridge is needed,
 * then drive the interval with vi.useFakeTimers() / advanceTimersByTimeAsync.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mocks (hoisted before imports by vitest) ──────────────────────────────────

// store.svelte imports tinro (Svelte 4 router) whose pre-compiled dist bundle
// references svelte/internal which no longer exists in Svelte 5.
// Mock the whole module so the test environment never loads it.
vi.mock("tinro", () => ({
  router: { goto: vi.fn(), mode: { hash: vi.fn() }, subscribe: vi.fn() },
}));

vi.mock("./ipc", () => ({
  stepAndGetState: vi.fn(),
}));

vi.mock("./toasts.svelte", () => ({
  toast: { error: vi.fn(), warning: vi.fn(), info: vi.fn(), success: vi.fn(), danger: vi.fn() },
}));

// ── Imports (after vi.mock declarations) ─────────────────────────────────────
import { stepAndGetState }                   from "./ipc";
import type { StepResultDto }               from "./ipc";
import { toast }                            from "./toasts.svelte";
import { autostep, start, stop, toggle, setSpeed } from "./autostep.svelte";
import { sim }                              from "./store.svelte";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal valid StepResultDto for mapping assertions. */
function makeResult(tick = 99): StepResultDto {
  return {
    tick,
    state:   { approval: 0.72, gdp: 5_000_000 } as any,
    metrics: [{ tick, approval: 0.72 } as any],
    laws:    [{ id: 7, name: "Test Law" } as any],
  };
}

/** Advance fake timers past one interval period (speed=2 → period=500 ms). */
async function fireOneTick() {
  await vi.advanceTimersByTimeAsync(600);
}

// ── Test suites ───────────────────────────────────────────────────────────────

describe("state transitions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset module-level autostep state and sim
    stop();
    autostep.elapsed = 0;
    autostep.speed   = 2;
    sim.loaded = false;
    sim.tick   = 0;
    vi.clearAllMocks();
  });

  afterEach(() => {
    stop();
    vi.useRealTimers();
  });

  it("start() does nothing when sim is not loaded", () => {
    sim.loaded = false;
    start();
    expect(autostep.running).toBe(false);
    expect(toast.warning).toHaveBeenCalled();
  });

  it("start() sets running=true and resets elapsed when loaded", () => {
    sim.loaded = true;
    autostep.elapsed = 5;
    start();
    expect(autostep.running).toBe(true);
    expect(autostep.elapsed).toBe(0);
  });

  it("start() is idempotent — calling twice keeps running=true", () => {
    sim.loaded = true;
    start();
    start(); // should be a no-op
    expect(autostep.running).toBe(true);
  });

  it("stop() sets running=false", () => {
    sim.loaded = true;
    start();
    stop();
    expect(autostep.running).toBe(false);
  });

  it("toggle() starts when currently stopped", () => {
    sim.loaded = true;
    expect(autostep.running).toBe(false);
    toggle();
    expect(autostep.running).toBe(true);
  });

  it("toggle() stops when currently running", () => {
    sim.loaded = true;
    start();
    toggle();
    expect(autostep.running).toBe(false);
  });
});

describe("setSpeed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stop();
    autostep.speed = 2;
  });

  afterEach(() => {
    stop();
    vi.useRealTimers();
  });

  it("clamps to minimum 0.5", () => {
    setSpeed(0);
    expect(autostep.speed).toBe(0.5);
    setSpeed(-10);
    expect(autostep.speed).toBe(0.5);
  });

  it("clamps to maximum 30", () => {
    setSpeed(100);
    expect(autostep.speed).toBe(30);
  });

  it("accepts valid values within range", () => {
    setSpeed(5);
    expect(autostep.speed).toBe(5);
    setSpeed(0.5);
    expect(autostep.speed).toBe(0.5);
    setSpeed(30);
    expect(autostep.speed).toBe(30);
  });

  it("persists speed to localStorage under 'ugs.autostep.speed'", () => {
    setSpeed(10);
    expect(localStorage.getItem("ugs.autostep.speed")).toBe("10");
    setSpeed(0.5);
    expect(localStorage.getItem("ugs.autostep.speed")).toBe("0.5");
  });

  it("clamps before persisting — stored value reflects clamped speed", () => {
    setSpeed(999);
    expect(localStorage.getItem("ugs.autostep.speed")).toBe("30");
    setSpeed(-5);
    expect(localStorage.getItem("ugs.autostep.speed")).toBe("0.5");
  });
});

describe("tick → sim mapping", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stop();
    autostep.elapsed = 0;
    autostep.speed   = 2; // period = 500 ms
    sim.loaded  = true;
    sim.tick    = 0;
    sim.currentState = null;
    sim.metricsRows  = [];
    sim.laws         = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    stop();
    vi.useRealTimers();
  });

  it("maps tick from StepResultDto to sim.tick", async () => {
    vi.mocked(stepAndGetState).mockResolvedValue(makeResult(42));
    start();
    await fireOneTick();
    expect(sim.tick).toBe(42);
  });

  it("maps state from StepResultDto to sim.currentState", async () => {
    const result = makeResult(10);
    vi.mocked(stepAndGetState).mockResolvedValue(result);
    start();
    await fireOneTick();
    // $state wraps assigned objects in reactive proxies, so use deep equality.
    expect(sim.currentState).toStrictEqual(result.state);
  });

  it("maps metrics from StepResultDto to sim.metricsRows", async () => {
    const result = makeResult(10);
    vi.mocked(stepAndGetState).mockResolvedValue(result);
    start();
    await fireOneTick();
    expect(sim.metricsRows).toStrictEqual(result.metrics);
  });

  it("maps laws from StepResultDto to sim.laws", async () => {
    const result = makeResult(10);
    vi.mocked(stepAndGetState).mockResolvedValue(result);
    start();
    await fireOneTick();
    expect(sim.laws).toStrictEqual(result.laws);
  });

  it("increments autostep.elapsed by 1 per successful tick", async () => {
    vi.mocked(stepAndGetState).mockResolvedValue(makeResult(1));
    start();
    await fireOneTick();
    expect(autostep.elapsed).toBe(1);
  });

  it("calls stepAndGetState with (1, 360)", async () => {
    vi.mocked(stepAndGetState).mockResolvedValue(makeResult(1));
    start();
    await fireOneTick();
    expect(stepAndGetState).toHaveBeenCalledWith(1, 360);
  });

  it("accumulates elapsed across multiple ticks", async () => {
    vi.mocked(stepAndGetState).mockResolvedValue(makeResult(5));
    start();
    await vi.advanceTimersByTimeAsync(1700); // 3 intervals at 500 ms each
    expect(autostep.elapsed).toBe(3);
  });
});

describe("error handling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stop();
    autostep.speed = 2;
    sim.loaded = true;
    vi.clearAllMocks();
  });

  afterEach(() => {
    stop();
    vi.useRealTimers();
  });

  it("stops autostep on IPC failure", async () => {
    vi.mocked(stepAndGetState).mockRejectedValue(new Error("connection lost"));
    start();
    await fireOneTick();
    expect(autostep.running).toBe(false);
  });

  it("shows toast.error on IPC failure", async () => {
    vi.mocked(stepAndGetState).mockRejectedValue(new Error("timeout"));
    start();
    await fireOneTick();
    expect(toast.error).toHaveBeenCalled();
  });

  it("stops autostep when sim becomes unloaded mid-run", async () => {
    vi.mocked(stepAndGetState).mockResolvedValue(makeResult(1));
    start();
    await fireOneTick();
    // Simulate scenario being unloaded
    sim.loaded = false;
    await vi.advanceTimersByTimeAsync(600);
    expect(autostep.running).toBe(false);
  });
});
