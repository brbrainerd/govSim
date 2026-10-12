// Balance harness (design.md Q31): scripted strategies play full games on many seeds.
import { describe, expect, it } from 'vitest';
import committedReport from '../../balance-report.json';
import { baseline, spendLevers, taxLevers, type BudgetDraft } from './budget';
import { enact, START } from './fixture';
import { endTurn, finalScore, newGame, projectedScore, scoreVsAutopilot, TOTAL_TURNS, type GameState } from './game';

const base = baseline();
const strategies: Record<string, BudgetDraft | null> = {
  autopilot: null,
  sensible: { ...base, inc: 24, bus: 22, rds: 115, rnd: 110, oth: 95 },
  maxDeficit: { ...base, inc: 10, bus: 10, inv: 10, pay: 10, tar: 0, def: 120, ssm: 110, mcd: 120, rds: 130, rnd: 130, oth: 120 },
  maxAusterity: { ...base, inc: 35, bus: 30, inv: 30, def: 80, ssm: 90, mcd: 80, rds: 80, rnd: 80, oth: 80 },
  tariffEverything: { ...base, tar: 35 },
};

function run(seed: number, budget: BudgetDraft | null): GameState[] {
  const out = [newGame(seed, START)];
  for (let t = 1; t < TOTAL_TURNS; t++) out.push(endTurn(out[t - 1]!, t === 1 && budget ? enact(budget) : {}));
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
          expect(e.unemployment).toBeLessThanOrEqual(15);
          expect(e.inflation).toBeGreaterThan(-2.1);
          expect(e.inflation).toBeLessThan(12);
          expect(s.approval).toBeGreaterThanOrEqual(5);
          expect(s.approval).toBeLessThanOrEqual(95);
        }
      }
    }
  });

  it('has the expected directions', () => {
    const debtPct = (n: string) => mean(final(n).map((s) => s.econ.debt / s.econ.gdp));
    expect(debtPct('maxAusterity')).toBeLessThan(debtPct('autopilot'));
    expect(debtPct('maxDeficit')).toBeGreaterThan(debtPct('autopilot'));
    const peakInfl = (n: string) => mean(seeds.map((sd) => Math.max(...run(sd, strategies[n]!).map((s) => s.econ.inflation))));
    expect(peakInfl('tariffEverything')).toBeGreaterThan(peakInfl('autopilot'));
  });

  it('does not let a degenerate strategy beat sensible play', () => {
    const sensible = avgIndex('sensible');
    const auto = avgIndex('autopilot');
    const headroom = sensible - auto;
    expect(headroom).toBeGreaterThanOrEqual(2.0);
    expect(headroom).toBeLessThanOrEqual(10.0);
    for (const bad of ['maxDeficit', 'tariffEverything']) expect(avgIndex(bad)).toBeLessThan(sensible);
  });

  it('matches committed balance-report.json within tolerance (GR-35)', () => {
    const seeds100 = Array.from({ length: 100 }, (_, i) => i + 1);
    for (const strat of ['autopilot', 'sensible', 'maxDeficit', 'maxAusterity']) {
      const finalStates = seeds100.map((sd) => run(sd, strategies[strat]!).at(-1)!);
      const scores = finalStates.map((s) => finalScore(s).total);
      const liveMean = mean(scores);
      const expectedMean = committedReport.strategies[strat as keyof typeof committedReport.strategies].meanScore;
      expect(Math.abs(liveMean - expectedMean)).toBeLessThan(0.5);
    }
  });

  it('verifies that every budget lever moves the score non-trivially (GR-28, GR-36)', () => {
    const autoMean = avgIndex('autopilot');
    for (const lever of [...taxLevers, ...spendLevers]) {
      const minStates = seeds.map((sd) => run(sd, { ...base, [lever.id]: lever.min }).at(-1)!);
      const maxStates = seeds.map((sd) => run(sd, { ...base, [lever.id]: lever.max }).at(-1)!);
      const minMean = mean(minStates.map((s) => finalScore(s).total));
      const maxMean = mean(maxStates.map((s) => finalScore(s).total));
      const swing = Math.abs(maxMean - minMean);
      const maxDistFromAuto = Math.max(Math.abs(minMean - autoMean), Math.abs(maxMean - autoMean));
      expect(Math.max(swing, maxDistFromAuto)).toBeGreaterThanOrEqual(0.3);
    }
  });

  it('unifies top bar and end-screen scoring and satisfies GR-04 calibration', () => {
    // 1. One exported function defines the comparison (GR-04)
    expect(projectedScore).toBe(finalScore);

    // 2. Over benchmark strategies, headline score sign matches final score sign in >= 95% at turn 16
    let totalChecks = 0;
    let signMatches = 0;
    for (const stratName of ['sensible', 'maxDeficit', 'maxAusterity', 'tariffEverything']) {
      for (const sd of seeds) {
        const full = run(sd, strategies[stratName]!);
        const auto = run(sd, strategies['autopilot']!);
        const s16 = full[15]!;
        const auto16 = auto[15]!;
        const headline16 = scoreVsAutopilot(s16, auto16).total;

        const s32 = full.at(-1)!;
        const auto32 = auto.at(-1)!;
        const finalDiff = finalScore(s32).total - finalScore(auto32).total;

        totalChecks++;
        const s16Sign = Math.sign(Math.round(headline16 * 10) / 10);
        const finalSign = Math.sign(Math.round(finalDiff * 10) / 10);
        if (s16Sign === finalSign || s16Sign === 0 || finalSign === 0) {
          signMatches++;
        }
      }
    }
    const matchRate = signMatches / totalChecks;
    expect(matchRate).toBeGreaterThanOrEqual(0.95);

    // 3. maxDeficit must show a negative headline before turn 16 in at least 80% of seeds
    let negBefore16Count = 0;
    for (const sd of seeds) {
      const full = run(sd, strategies['maxDeficit']!);
      const auto = run(sd, strategies['autopilot']!);
      let showedNegative = false;
      for (let t = 1; t < 16; t++) {
        const diff = scoreVsAutopilot(full[t]!, auto[t]!).total;
        if (diff < -0.05) {
          showedNegative = true;
          break;
        }
      }
      if (showedNegative) negBefore16Count++;
    }
    const negRate = negBefore16Count / seeds.length;
    expect(negRate).toBeGreaterThanOrEqual(0.8);
  });
});
