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
}

export interface LawInfo {
  id: number;
  effect_kind: "income_tax" | "benefit" | "registration" | "audit" | "abatement" | string;
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
