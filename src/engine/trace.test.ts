// FND-04: every traced change is the sum of named terms (GR-05), over many seeds, five strategies and
// the legacy path. FND-01: luck is one source id with a known size.
import { describe, expect, it } from 'vitest';
import { conservationErrors } from '../testing/conservation';
import { fromPackage, type BudgetDraft } from './budget';
import { C, LIMITS, RULES } from './coefficients';
import { enact, START } from './fixture';
import { endTurn, newGame, step, TOTAL_TURNS, type Decisions, type GameState } from './game';
import { isKnownSource, TRACE_KEYS, type TraceKey } from './trace';

const maxDeficit: BudgetDraft = { ...fromPackage('Tax cut'), def: 120, ssm: 110, mcd: 120, rds: 130, rnd: 130, oth: 120 };
/** `first` is the turn-1 Decisions; null is autopilot, 'empty' is {} every turn. */
const strategies: Record<string, Decisions | null | 'empty'> = {
  autopilot: null,
  empty: 'empty',
  sensible: enact(fromPackage('Infrastructure push')),
  maxDeficit: enact(maxDeficit),
  tariffs35: enact({ ...fromPackage('Keep as is'), tar: 35 }),
};
const SEEDS = 40;
const LEGACY_STEPS = 40;

/** Calls `visit(prev, next)` for every step of every game, and for 40 legacy steps after each. */
function sweep(visit: (prev: GameState, next: GameState, where: string) => void): void {
  for (let seed = 1; seed <= SEEDS; seed++) {
    for (const [name, first] of Object.entries(strategies)) {
      let s = newGame(seed, START);
      for (let t = 1; t < TOTAL_TURNS; t++) {
        const d = first === 'empty' ? {} : t === 1 && first ? first : undefined;
        const next = endTurn(s, d);
        visit(s, next, `seed ${seed} ${name} turn ${t}`);
        s = next;
      }
      for (let i = 0; i < LEGACY_STEPS; i++) {
        const next = step(s, {});
        visit(s, next, `seed ${seed} ${name} legacy ${i}`);
        s = next;
      }
    }
  }
}

describe('trace', () => {
  it('starts empty', () => {
    expect(newGame(1, START).report.trace).toEqual({});
  });

  it('conserves: terms add up to the change in every traced key', () => {
    sweep((prev, next, where) => expect(conservationErrors(prev, next), where).toEqual([]));
  });

  it('records the gap luck term as shockGap times the recorded shock', () => {
    sweep((_prev, next, where) => {
      const luck = next.report.trace.gap!.find((t) => t.source === 'luck');
      const want = C.shockGap * next.report.luck.gap;
      expect(luck?.amount ?? 0, where).toBeCloseTo(want, 12);
    });
  });

  it('records every one of the 15 keys on every step', () => {
    sweep((_prev, next, where) => expect(Object.keys(next.report.trace).sort(), where).toEqual([...TRACE_KEYS].sort()));
  });

  it('records inflation and approval luck as the coefficient times the recorded shock', () => {
    sweep((_prev, next, where) => {
      const amount = (key: TraceKey) => next.report.trace[key]!.find((t) => t.source === 'luck')?.amount ?? 0;
      expect(amount('inflation'), where).toBeCloseTo(C.shockInfl * next.report.luck.infl, 12);
      expect(amount('approval'), where).toBeCloseTo(C.shockApproval * next.report.luck.appr, 12);
    });
  });

  it('carries the gap luck into growth, unemployment and empPop by their equations', () => {
    sweep((_prev, next, where) => {
      const luck = (key: TraceKey) => next.report.trace[key]!.find((t) => t.source === 'luck')?.amount ?? 0;
      const g = C.shockGap * next.report.luck.gap;
      expect(luck('growth'), where).toBeCloseTo(4 * g, 12);
      expect(luck('unemployment'), where).toBeCloseTo(-C.okun * g, 12);
      expect(luck('empPop'), where).toBeCloseTo(C.okun * C.empPerU * g, 12);
    });
  });

  it('uses only named sources, with bounded clamp and rounding residuals', () => {
    const near = (a: number, b: number) => Math.abs(a - b) <= 1e-9;
    const onBound = (v: number, [lo, hi]: readonly [number, number]) => near(v, lo) || near(v, hi);
    const bounds: Partial<Record<TraceKey, readonly [number, number]>> = {
      unemployment: LIMITS.unemployment.bounds, inflation: LIMITS.inflation.bounds, fedRate: LIMITS.fedRate.bounds,
      gini: LIMITS.gini.bounds, approval: LIMITS.approval.bounds, trust: LIMITS.trust.bounds,
      income: [START.medianIncome * LIMITS.income.bounds[0], START.medianIncome * LIMITS.income.bounds[1]],
    };
    const quantum: Partial<Record<TraceKey, number>> = { fedRate: C.fedStep / 2, approval: RULES.approvalStep.value / 2 };
    const value = (s: GameState, key: TraceKey) => ({
      unemployment: s.econ.unemployment, inflation: s.econ.inflation, fedRate: s.econ.fedRate, gini: s.econ.gini,
      approval: s.approval, trust: s.econ.trust, clout: s.clout, income: s.econ.realIncome,
    })[key as 'unemployment'];
    const bad: string[] = [];
    sweep((prev, next, where) => {
      for (const key of TRACE_KEYS) {
        for (const term of next.report.trace[key]!) {
          const at = `${where} ${key} ${term.source} ${term.amount}`;
          if (['residual', 'other', 'misc'].includes(term.source)) bad.push(`${at}: catch-all source`);
          if (!isKnownSource(term.source)) bad.push(`${at}: unknown source`);
          if (term.source === 'clamp' && Math.abs(term.amount) > 1e-9) {
            // empPop is clamped by the unemployment bound; clout bounded by [0, C.cloutCap]; other keys have no clamp.
            const [k, b] = key === 'empPop' ? (['unemployment', LIMITS.unemployment.bounds] as const)
              : key === 'clout' ? (['clout', [0, C.cloutCap]] as const) : ([key, bounds[key]] as const);
            if (!b) bad.push(`${at}: key has no bound`);
            else if (!onBound(value(prev, k as TraceKey)!, b) && !onBound(value(next, k as TraceKey)!, b)) bad.push(`${at}: away from a bound`);
          }
          if (term.source === 'rounding' && !(Math.abs(term.amount) <= (quantum[key] ?? -1) + 1e-12)) bad.push(`${at}: rounding beyond half a step`);
        }
      }
    });
    expect(bad.slice(0, 10)).toEqual([]);
  });

  it('accepts social policy sources and social: prefix', () => {
    expect(isKnownSource('social:budget')).toBe(true);
    expect(isKnownSource('social:health')).toBe(true);
    expect(isKnownSource('social:aca')).toBe(true);
    expect(isKnownSource('social:pharma')).toBe(true);
    expect(isKnownSource('social:puboption')).toBe(true);
    expect(isKnownSource('social:border')).toBe(true);
    expect(isKnownSource('social:visas')).toBe(true);
    expect(isKnownSource('social:legalization')).toBe(true);
    expect(isKnownSource('social:clean_energy')).toBe(true);
    expect(isKnownSource('social:fossil_leasing')).toBe(true);
    expect(isKnownSource('social:carbon_std')).toBe(true);
    expect(isKnownSource('social:title_i')).toBe(true);
    expect(isKnownSource('social:student_debt')).toBe(true);
    expect(isKnownSource('social:prek')).toBe(true);
    expect(isKnownSource('social:custom_policy')).toBe(true);
  });
});
