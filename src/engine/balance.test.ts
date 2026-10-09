// Balance harness (design.md Q31): scripted strategies play full games on many seeds.
import { describe, expect, it } from 'vitest';
import { fromPackage, type BudgetDraft } from './budget';
import { endTurn, finalScore, newGame, TOTAL_TURNS, type GameState } from './game';
import { START } from './fixture';

const strategies: Record<string, BudgetDraft | null> = {
  autopilot: null,
  sensible: fromPackage('Infrastructure push'),
  maxDeficit: { ...fromPackage('Tax cut'), def: 120, ssm: 110, mcd: 120, rds: 130, rnd: 130, oth: 120 },
  austerity: fromPackage('Balance the budget'),
  tariffEverything: { ...fromPackage('Keep as is'), tar: 35 },
};

function run(seed: number, budget: BudgetDraft | null): GameState[] {
  const out = [newGame(seed, START)];
  for (let t = 1; t < TOTAL_TURNS; t++) out.push(endTurn(out[t - 1]!, t === 1 && budget ? { budget } : {}));
  return out;
}

const seeds = Array.from({ length: 40 }, (_, i) => i + 1);
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const final = (name: string) => seeds.map((sd) => run(sd, strategies[name]!).at(-1)!);
const avgIndex = (name: string) => mean(final(name).map((s) => finalScore(s).total));

describe('balance', () => {
  it('keeps every indicator in a plausible range for every strategy and seed', () => {
    for (const name of Object.keys(strategies)) {
      for (const sd of seeds) {
        for (const s of run(sd, strategies[name]!)) {
          const e = s.econ;
          expect(e.unemployment).toBeGreaterThanOrEqual(2.5);
          expect(e.unemployment).toBeLessThanOrEqual(12);
          expect(e.inflation).toBeGreaterThan(-2);
          expect(e.inflation).toBeLessThan(12);
          expect((e.debt / e.gdp) * 100).toBeLessThan(160);
          expect(s.approval).toBeGreaterThanOrEqual(5);
          expect(s.approval).toBeLessThanOrEqual(95);
        }
      }
    }
  });

  it('has the expected directions', () => {
    const debtPct = (n: string) => mean(final(n).map((s) => s.econ.debt / s.econ.gdp));
    expect(debtPct('austerity')).toBeLessThan(debtPct('autopilot'));
    expect(debtPct('maxDeficit')).toBeGreaterThan(debtPct('autopilot'));
    const peakInfl = (n: string) => mean(seeds.map((sd) => Math.max(...run(sd, strategies[n]!).map((s) => s.econ.inflation))));
    expect(peakInfl('tariffEverything')).toBeGreaterThan(peakInfl('autopilot'));
  });

  it('does not let a degenerate strategy beat sensible play', () => {
    const sensible = avgIndex('sensible');
    expect(sensible).toBeGreaterThan(avgIndex('autopilot'));
    for (const bad of ['maxDeficit', 'tariffEverything']) expect(avgIndex(bad)).toBeLessThan(sensible);
  });
});
