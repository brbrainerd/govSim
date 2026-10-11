// Conservation check shared by the trace tests and (plan 01-07) the modifier tests (FND-04):
// every traced key's terms sum to the key's change over the step (to its value, for level keys).
import type { GameState } from '../engine/game';
import { LEVEL_KEYS, TRACE_KEYS, type TraceKey } from '../engine/trace';

export const VALUE: Record<TraceKey, (s: GameState) => number> = {
  gap: (s) => s.econ.gap,
  growth: (s) => s.econ.growth,
  unemployment: (s) => s.econ.unemployment,
  inflation: (s) => s.econ.inflation,
  expected: (s) => s.econ.expected,
  fedRate: (s) => s.econ.fedRate,
  debtPct: (s) => (s.econ.debt / s.econ.gdp) * 100,
  income: (s) => s.econ.realIncome,
  empPop: (s) => s.econ.empPop,
  lifeExp: (s) => s.econ.lifeExp,
  gini: (s) => s.econ.gini,
  crime: (s) => s.econ.crime,
  trust: (s) => s.econ.trust,
  approval: (s) => s.approval,
  clout: (s) => s.clout,
};

/** One readable message per traced key whose terms do not add up; [] when the step conserves. */
export function conservationErrors(before: GameState, after: GameState, tol = 1e-9): string[] {
  const errors: string[] = [];
  for (const key of TRACE_KEYS) {
    const terms = after.report.trace[key];
    if (!terms) continue;
    const sum = terms.reduce((a, t) => a + t.amount, 0);
    const level = LEVEL_KEYS.has(key);
    const want = level ? VALUE[key](after) : VALUE[key](after) - VALUE[key](before);
    if (!(Math.abs(sum - want) <= tol)) {
      errors.push(`turn ${before.turn} ${key}: terms sum to ${sum} but the ${level ? 'value' : 'change'} is ${want} (${terms.map((t) => `${t.source} ${t.amount}`).join(', ')})`);
    }
  }
  return errors;
}
