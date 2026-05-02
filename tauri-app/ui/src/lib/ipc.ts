/**
 * Typed wrappers around Tauri invoke() for every Rust IPC command.
 * All functions return typed promises; errors are surfaced as thrown strings.
 */
import { invoke } from "@tauri-apps/api/core";

// ── Rust-mirrored types ──────────────────────────────────────────────────────

export interface TickRow {
  tick: number;
  population: number;
  gdp: number;
  gini: number;
  wealth_gini: number;
  unemployment: number;
  inflation: number;
  approval: number;
  gov_revenue: number;
  gov_expenditure: number;
  incumbent_party: number;
  election_margin: number;
  consecutive_terms: number;
  pollution_stock: number;
  legitimacy_debt: number;
  rights_granted_bits: number;
  treasury_balance: number;
  price_level: number;
  crisis_kind: number;
  crisis_remaining_ticks: number;
  mean_health: number;
  mean_productivity: number;
  mean_income: number;
}

export interface CurrentState {
  tick: number;
  approval: number;
  population: number;
  gdp: number;
  gini: number;
  wealth_gini: number;
  unemployment: number;
  inflation: number;
  gov_revenue: number;
  gov_expenditure: number;
  treasury_balance: number;
  price_level: number;
  pollution_stock: number;
  legitimacy_debt: number;
  rights_granted_bits: number;
  crisis_kind: number;
  crisis_remaining_ticks: number;
  incumbent_party: number;
  election_margin: number;
  consecutive_terms: number;
  last_election_tick: number;
  /** Fixed election cycle length in ticks (always 360 = 1 simulated year). */
  election_cycle: number;
}

export interface LawInfo {
  id: number;
  effect_kind: "income_tax" | "benefit" | "registration" | "audit" | "abatement" | string;
  /** Human-readable name (e.g. "Income Tax", "Abatement"). */
  label: string;
  /** Key parameter string, e.g. "25.0%", "$500/mo", "0.50 PU · $10000/PU". Null for unsupported types. */
  magnitude: string | null;
  cadence: string;
  enacted_tick: number;
  repealed: boolean;
}

export interface WindowSummaryDto {
  from_tick: number;
  to_tick: number;
  n_rows: number;
  mean_approval: number;
  mean_unemployment: number;
  mean_gdp: number;
  mean_pollution: number;
  mean_legitimacy: number;
  mean_treasury: number;
  min_approval: number;
  max_approval: number;
  min_gdp: number;
  max_gdp: number;
}

export interface LawEffectDto {
  pre: WindowSummaryDto;
  post: WindowSummaryDto;
  delta_approval: number;
  delta_unemployment: number;
  delta_gdp: number;
  delta_pollution: number;
  delta_legitimacy: number;
  delta_treasury: number;
}

// ── Crisis kind helpers ──────────────────────────────────────────────────────

export const CRISIS_LABELS: Record<number, string> = {
  0: "None", 1: "War", 2: "Pandemic", 3: "Recession", 4: "Natural Disaster",
};

export const PARTY_LABELS: Record<number, string> = {
  0: "—", 1: "Progressive", 2: "Conservative",
};

/**
 * Mirrors `CivicRights` bitflags from `simulator-core/src/resources.rs`.
 * Ordered by bit position (LSB first = bit 0 first).
 * Use `decodeCivicRights(bits)` to turn a packed u32 into human-readable entries.
 */
export const CIVIC_RIGHTS: ReadonlyArray<{ bit: number; label: string; description: string }> = [
  { bit: 1 << 0, label: "Universal Suffrage",   description: "All adult citizens may vote." },
  { bit: 1 << 1, label: "Racial Equality",       description: "Equal protection regardless of race." },
  { bit: 1 << 2, label: "Gender Equality",       description: "Equal rights regardless of gender." },
  { bit: 1 << 3, label: "LGBTQ+ Protections",   description: "Legal recognition and anti-discrimination." },
  { bit: 1 << 4, label: "Religious Freedom",     description: "Freedom of religion and conscience." },
  { bit: 1 << 5, label: "Labor Rights",          description: "Right to organize, collective bargaining." },
  { bit: 1 << 6, label: "Due Process",           description: "Fair trial and legal representation." },
  { bit: 1 << 7, label: "Free Speech",           description: "Freedom of expression and press." },
  { bit: 1 << 8, label: "Abolition of Slavery",  description: "Prohibition of forced servitude." },
];

/** Decode a packed `rights_granted_bits` integer into granted/withheld right entries. */
export function decodeCivicRights(bits: number): Array<{ label: string; description: string; granted: boolean }> {
  return CIVIC_RIGHTS.map(r => ({ label: r.label, description: r.description, granted: (bits & r.bit) !== 0 }));
}

// ── Command wrappers ─────────────────────────────────────────────────────────

/** Load a scenario by name (looks up `scenarios/<name>.yaml`). */
export async function loadScenario(name: string): Promise<string> {
  return invoke<string>("load_scenario", { name });
}

/** Advance the simulation by `ticks` steps. Returns the new tick number. */
export async function stepSim(ticks: number = 1): Promise<number> {
  return invoke<number>("step_sim", { ticks });
}

/** Returns the current tick number. */
export async function getTick(): Promise<number> {
  return invoke<number>("get_tick");
}

/** Returns the last `n` metric rows (chronological order). */
export async function getMetricsRows(n: number = 360): Promise<TickRow[]> {
  return invoke<TickRow[]>("get_metrics_rows", { n });
}

/** Returns a full snapshot of all macro resources at the current tick. */
export async function getCurrentState(): Promise<CurrentState> {
  return invoke<CurrentState>("get_current_state");
}

/** Returns currently active laws. */
export async function listLaws(): Promise<LawInfo[]> {
  return invoke<LawInfo[]>("list_laws");
}

/** Returns the original DSL source of a law (or null if not preserved). */
export async function getLawDslSource(law_id: number): Promise<string | null> {
  return invoke<string | null>("get_law_dsl_source", { lawId: law_id });
}

/** Enact a flat income tax at the given rate [0, 1]. Returns the new law ID. */
export async function enactFlatTax(rate: number): Promise<number> {
  return invoke<number>("enact_flat_tax", { params: { rate } });
}

/** Enact a UBI benefit of `monthly_amount` per citizen. Returns the new law ID. */
export async function enactUbi(monthly_amount: number): Promise<number> {
  return invoke<number>("enact_ubi", { params: { monthly_amount } });
}

/** Enact an environmental abatement law. Returns the new law ID. */
export async function enactAbatement(
  pollution_reduction_pu: number,
  cost_per_pu: number
): Promise<number> {
  return invoke<number>("enact_abatement", {
    params: { pollution_reduction_pu, cost_per_pu },
  });
}

/** Repeal a law by its numeric ID. */
export async function repealLaw(law_id: number): Promise<void> {
  return invoke<void>("repeal_law", { lawId: law_id });
}

/**
 * Compute a before/after DiD window centred on `enacted_tick`.
 * `window_ticks` is how many ticks to look back (pre) and forward (post).
 */
export async function getLawEffect(
  enacted_tick: number,
  window_ticks: number = 30
): Promise<LawEffectDto> {
  return invoke<LawEffectDto>("get_law_effect", { enactedTick: enacted_tick, windowTicks: window_ticks });
}

/** Export the metric ring-buffer to a Parquet file at `path`. */
export async function exportMetricsParquet(path: string): Promise<void> {
  return invoke<void>("export_metrics_parquet", { path });
}

/** Health check. */
export async function ping(): Promise<string> {
  return invoke<string>("ping");
}

// ── Counterfactual / Monte Carlo ─────────────────────────────────────────────

export interface CausalEstimateDto {
  enacted_tick: number;
  window_ticks: number;
  did_approval: number | null;
  did_gdp: number | null;
  did_pollution: number | null;
  did_unemployment: number | null;
  did_legitimacy: number | null;
  did_treasury: number | null;
  treatment_post_approval: number;
  treatment_post_gdp: number;
}

export interface MonteCarloSummaryDto {
  n_runs: number;
  mean_did_approval:     number | null;
  std_did_approval:      number | null;
  p5_did_approval:       number | null;
  p95_did_approval:      number | null;
  mean_did_gdp:          number | null;
  std_did_gdp:           number | null;
  p5_did_gdp:            number | null;
  p95_did_gdp:           number | null;
  mean_did_pollution:    number | null;
  std_did_pollution:     number | null;
  p5_did_pollution:      number | null;
  p95_did_pollution:     number | null;
  mean_did_unemployment: number | null;
  std_did_unemployment:  number | null;
  p5_did_unemployment:   number | null;
  p95_did_unemployment:  number | null;
  mean_did_legitimacy:   number | null;
  std_did_legitimacy:    number | null;
  p5_did_legitimacy:     number | null;
  p95_did_legitimacy:    number | null;
  mean_did_treasury:     number | null;
  std_did_treasury:      number | null;
  p5_did_treasury:       number | null;
  p95_did_treasury:      number | null;
}

/**
 * Save the current sim state as the counterfactual fork point.
 * Returns the tick at which the snapshot was taken.
 * Call this BEFORE enacting a law you wish to analyse.
 */
export async function saveSimSnapshot(): Promise<number> {
  return invoke<number>("save_sim_snapshot");
}

/**
 * Single-run counterfactual DiD: forks from the saved snapshot, enacts
 * the specified law in the treatment arm, steps both by `window_ticks`,
 * and returns one DiD estimate.
 */
export async function getCounterfactualDiff(
  law_id: number,
  window_ticks: number = 30
): Promise<CausalEstimateDto> {
  return invoke<CausalEstimateDto>("get_counterfactual_diff", {
    lawId: law_id,
    windowTicks: window_ticks,
  });
}

// ── Citizen distribution ─────────────────────────────────────────────────────

export interface HistogramDto {
  edges: number[];
  counts: number[];
  min: number;
  max: number;
  mean: number;
  n: number;
}

export interface CitizenDistributionDto {
  income: HistogramDto;
  wealth: HistogramDto;
  health: HistogramDto;
  productivity: HistogramDto;
  n_citizens: number;
}

/** Returns histograms of citizen-level income, wealth, health, and productivity. */
export async function getCitizenDistribution(regionId?: number): Promise<CitizenDistributionDto> {
  return invoke<CitizenDistributionDto>("get_citizen_distribution", {
    regionId: regionId ?? null,
  });
}

// ── Citizen scatter ──────────────────────────────────────────────────────────

/**
 * Returns up to `maxPoints` correlated citizen tuples [income, wealth, health, productivity].
 * Sampled uniformly when the world has more citizens than requested.
 */
export async function getCitizenScatter(maxPoints: number = 500, regionId?: number): Promise<[number, number, number, number][]> {
  return invoke<[number, number, number, number][]>("get_citizen_scatter", {
    maxPoints,
    regionId: regionId ?? null,
  });
}

// ── Batched step ─────────────────────────────────────────────────────────────

/**
 * Advance the sim by `ticks` and return tick + full state snapshot in one call.
 * Replaces four separate round-trips used by autostep, cutting IPC overhead ~75%.
 */
export interface StepResultDto {
  tick:    number;
  state:   CurrentState;
  metrics: TickRow[];
  laws:    LawInfo[];
}

export async function stepAndGetState(
  ticks:         number = 1,
  metricsWindow: number = 360,
): Promise<StepResultDto> {
  return invoke<StepResultDto>("step_and_get_state", { ticks, metricsWindow });
}

/**
 * Monte Carlo counterfactual: runs `n_runs` forked simulations and
 * returns mean/std/P5/P95 of the DiD distribution.
 */
export async function runMonteCarlo(
  law_id: number,
  window_ticks: number = 30,
  n_runs: number = 20
): Promise<MonteCarloSummaryDto> {
  return invoke<MonteCarloSummaryDto>("run_monte_carlo", {
    lawId: law_id,
    windowTicks: window_ticks,
    nRuns: n_runs,
  });
}

// ── Region stats ─────────────────────────────────────────────────────────────

export interface RegionStatsDto {
  region_id:         number;
  population:        number;
  mean_approval:     number;
  mean_income:       number;
  unemployment_rate: number;
  mean_health:       number;
}

/** Returns per-region aggregate stats computed on demand from citizen components. */
export async function getRegionStats(): Promise<RegionStatsDto[]> {
  return invoke<RegionStatsDto[]>("get_region_stats");
}
