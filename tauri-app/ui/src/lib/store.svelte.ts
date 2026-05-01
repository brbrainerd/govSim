/**
 * Global reactive application state using Svelte 5 runes.
 * Import the `sim` object from anywhere — mutations auto-propagate to all
 * subscribers via Svelte's fine-grained reactivity.
 */
import { router } from "tinro";
import type { CurrentState, LawInfo, TickRow } from "./ipc";
import { ROUTES, urlFor, type ViewName } from "./routes";

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
  view: "start" as "start" | "dashboard" | "laws" | "propose" | "effect" | "citizens" | "elections" | "regions" | "settings",
  /** Law ID for which we're viewing the effect window. */
  effectLawId: null as number | null,
  /** Enacted tick for the effect window query. */
  effectEnactedTick: 0,
  /**
   * When true, LawEffect.svelte will auto-trigger fetchMonteCarlo() on mount
   * and immediately reset the flag. Set by the `sim.monte_carlo.run` palette command.
   */
  triggerMC: false,
  /**
   * When set, CitizenView filters its distribution data to this region.
   * Set by clicking a row in RegionsView; cleared by the filter pill in CitizenView.
   */
  filterRegionId: null as number | null,
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

/** Tracked current router path; kept in sync via router.subscribe(). */
let currentPath = "/start";

/** Navigate to a view (also pushes a URL hash so back/forward + deep links work). */
export function navigate(view: typeof ui.view) {
  ui.view = view;
  const path = urlFor(view as ViewName);
  if (typeof window !== "undefined" && currentPath !== path) {
    router.goto(path);
  }
}

/** Initialise routing: derive view from URL on load, subscribe to back/forward. */
export function initRouting() {
  if (typeof window === "undefined") return;
  router.mode.hash();
  // Map current URL → view on startup.
  const startPath = window.location.hash.replace(/^#/, "") || "/start";
  const initial = ROUTES.find(r => r.path === startPath)?.view ?? "start";
  ui.view = initial;
  currentPath = startPath;
  // Subscribe to subsequent URL changes (back/forward, manual hash edits).
  router.subscribe(loc => {
    currentPath = loc.path;
    const route = ROUTES.find(r => r.path === loc.path);
    if (route && route.view !== ui.view) ui.view = route.view;
  });
}

/**
 * Download `sim.metricsRows` as a UTF-8 CSV file.
 * Returns false (with no side-effects) if there are no rows yet.
 */
export function exportMetricsCsv(): boolean {
  const rows = sim.metricsRows;
  if (rows.length === 0) return false;
  const headers = Object.keys(rows[0]) as (keyof typeof rows[0])[];
  const csv = [
    headers.join(","),
    ...rows.map(r => headers.map(h => String(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `ugs-metrics-tick${sim.tick}.csv`; a.click();
  URL.revokeObjectURL(url);
  return true;
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
