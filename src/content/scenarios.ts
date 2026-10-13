// Curated starting scenarios catalog and deterministic Start overrides (SCEN-01, SCEN-02).
// All strings adhere to reading grade <= 9.0 and <= 20 words per sentence.

import type { Start } from '../engine/game';

export type ScenarioId =
  | 'standard_2026'
  | 'stagflation_shock'
  | 'debt_brinkmanship'
  | 'global_trade_war';

export interface ScenarioDef {
  readonly id: ScenarioId;
  readonly name: string;
  readonly tag: string;
  readonly summary: string;
  readonly briefing: string;
  readonly startOverrides: Partial<Start>;
}

export const SCENARIOS: readonly ScenarioDef[] = [
  {
    id: 'standard_2026',
    name: '2026 Standard Baseline',
    tag: 'Normal',
    summary: 'Steady growth and mild price rises give you room to lead.',
    briefing: 'Steady growth gives you room to pass a first-year budget.',
    startOverrides: {},
  },
  {
    id: 'stagflation_shock',
    name: '70s Stagflation Shock',
    tag: 'Hard',
    summary: 'High store prices and job losses squeeze homes from day one.',
    briefing: 'High prices and weak hiring squeeze families on day one.',
    startOverrides: {
      inflation: 6.2,
      unemployment: 6.4,
      fedRate: 5.5,
      trust: 32,
    },
  },
  {
    id: 'debt_brinkmanship',
    name: 'Debt Ceiling Brinkmanship',
    tag: 'Hard',
    summary: 'Public debt nears the legal cap while loan costs stay high.',
    briefing: 'Public debt is near the cap and loan costs are high.',
    startOverrides: {
      debtPct: 128,
      deficitPct: 7.8,
      fedRate: 4.9,
      trust: 34,
    },
  },
  {
    id: 'global_trade_war',
    name: 'Global Trade War',
    tag: 'Challenge',
    summary: 'Steep border taxes slow down trade and push up store prices.',
    briefing: 'Border taxes are raising store prices and slowing down trade.',
    startOverrides: {
      tariff: 24,
      inflation: 4.6,
      unemployment: 5.1,
      trust: 35,
    },
  },
];

export function isValidScenarioId(val: unknown): val is ScenarioId {
  return typeof val === 'string' && SCENARIOS.some((s) => s.id === val);
}

export function getScenario(id?: ScenarioId): ScenarioDef {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0]!;
}

/**
 * Deterministically merges scenario overrides onto a baseline Start object (SCEN-01).
 * Idempotent when called again on an already-overridden Start.
 */
export function applyScenarioStart(start: Start, id?: ScenarioId): Start {
  const scen = getScenario(id);
  if (Object.keys(scen.startOverrides).length === 0) return start;
  return {
    ...start,
    ...scen.startOverrides,
  };
}
