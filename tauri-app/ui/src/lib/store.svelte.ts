/**
 * Global reactive application state using Svelte 5 runes.
 * Import the `sim` object from anywhere — mutations auto-propagate to all
 * subscribers via Svelte's fine-grained reactivity.
 */
import type { CurrentState, LawInfo, TickRow } from "./ipc";

// ── Simulation state ─────────────────────────────────────────────────────────

export const sim = $state({
  /** Whether a scenario has been loaded and the sim is ready to step. */
  loaded: false,
  /** Name of the currently loaded scenario. */
  scenarioName: "",
  /** Current tick (updated after every step). */
  tick: 0,
  /** Full macro-resource snapshot at the current tick. */
  currentState: null as CurrentState | null,
  /** Last N metric rows, chronological. */
  metricsRows: [] as TickRow[],
  /** Active laws. */
  laws: [] as LawInfo[],
  /** True while an async IPC call is in flight. */
  loading: false,
  /** Last error message, if any. */
  error: null as string | null,
});

// ── UI state ─────────────────────────────────────────────────────────────────

export const ui = $state({
  /** Currently active view/page. */
  view: "start" as "start" | "dashboard" | "laws" | "propose" | "effect",
  /** Law ID for which we're viewing the effect window. */
  effectLawId: null as number | null,
  /** Enacted tick for the effect window query. */
  effectEnactedTick: 0,
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Set loading state and clear any previous error. */
export function beginLoad() {
  sim.loading = true;
  sim.error = null;
}

/** Clear loading state. */
export function endLoad() {
  sim.loading = false;
}

/** Record an error and clear loading state. */
export function setError(msg: string) {
  sim.error = msg;
  sim.loading = false;
}

/** Navigate to a view. */
export function navigate(view: typeof ui.view) {
  ui.view = view;
}

/** Format a number as a compact currency string. */
export function formatMoney(n: number): string {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

/** Format a fraction as a percentage string. */
export function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

/** Format a tick as "Year Y, Month M". */
export function tickToDate(tick: number): string {
  const year  = 2026 + Math.floor(tick / 360);
  const month = Math.floor((tick % 360) / 30) + 1;
  return `Y${year} M${month}`;
}
