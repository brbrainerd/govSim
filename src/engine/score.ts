// Prosperity index (design.md §2) on the registry's SCORE weights and scales (FND-07).
// Type-only import of GameState keeps this free of a runtime cycle: game.ts re-exports prosperity
// and owns legacy/finalScore, because legacy calls step.
import { C, LIMITS, SCORE } from './coefficients';
import { clamp } from './detmath';
import type { GameState } from './game';
import { calculateSecurityIndex } from './security';
import { PERCENT } from './units';

/** Prosperity index components: SCORE.neutral = where you started, 0..100. */
export function prosperity(state: GameState) {
  const s = state.start, e = state.econ;
  const [lo, hi] = LIMITS.score.bounds;
  const score = (x: number) => clamp(x, lo, hi);
  const mid = SCORE.neutral.value;
  const parts = {
    income: { w: SCORE.incomeWeight.value, v: score(mid + (e.realIncome / s.medianIncome - 1) * SCORE.incomeScale.value) },
    employment: { w: SCORE.employmentWeight.value, v: score(mid + (e.empPop - s.empPop) * SCORE.employmentScale.value) },
    inflation: { w: SCORE.inflationWeight.value, v: score(hi - SCORE.inflationScale.value * Math.abs(e.inflation - C.inflTarget)) },
    debt: { w: SCORE.debtWeight.value, v: score(mid - ((e.debt / e.gdp) * PERCENT - s.debtPct) * SCORE.debtScale.value) },
    lifeExp: { w: SCORE.lifeExpWeight.value, v: score(mid + (e.lifeExp - s.lifeExp) * SCORE.lifeExpScale.value) },
    inequality: { w: SCORE.inequalityWeight.value, v: score(mid - (e.gini - s.gini) * SCORE.inequalityScale.value) },
    security: { w: SCORE.securityWeight.value, v: calculateSecurityIndex(state) },
    trust: { w: SCORE.trustWeight.value, v: score(mid + (e.trust - s.trust) * SCORE.trustScale.value) },
  };
  const index = Object.values(parts).reduce((a, p) => a + p.w * p.v, 0);
  return { index, parts };
}

export interface ScoreBreakdown {
  now: number;
  later: number;
  total: number;
}

