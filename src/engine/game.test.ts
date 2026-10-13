import { describe, expect, it } from 'vitest';
import { LIMITS, SCORE } from './coefficients';
import { endTurn, finalScore, newGame, prosperity, TOTAL_TURNS, type GameState } from './game';
import { START } from './fixture';

const play = (seed: number) => {
  const out: GameState[] = [newGame(seed, START)];
  for (let i = 1; i < TOTAL_TURNS; i++) out.push(endTurn(out[i - 1]!));
  return out;
};

describe('engine', () => {
  it('is deterministic for a seed', () => {
    expect(play(42)).toEqual(play(42));
    expect(play(42)).not.toEqual(play(43));
  });

  it('does not mutate its input and stops at the last turn', () => {
    const s = newGame(1, START);
    const frozen = structuredClone(s);
    endTurn(s);
    expect(s).toEqual(frozen);
    const last = play(1).at(-1)!;
    expect(last.turn).toBe(TOTAL_TURNS);
    expect(endTurn(last)).toBe(last);
  });

  it('scores the start at 50 on every outcome except inflation distance', () => {
    const { parts } = prosperity(newGame(1, START));
    for (const [k, p] of Object.entries(parts)) if (k !== 'inflation') expect(p.v).toBeCloseTo(50, 5);
  });

  it('weights the final score by the registry: now against ten years on', () => {
    const f = finalScore(play(3).at(-1)!);
    expect(f.total).toBe(SCORE.nowWeight.value * f.now + (1 - SCORE.nowWeight.value) * f.later);
  });
});

describe('income floor', () => {
  it('keeps median income within LIMITS.income of the start even when the economy collapses', () => {
    let s: GameState = { ...newGame(1, START), econ: { ...newGame(1, START).econ, gap: -500 } };
    for (let i = 0; i < 8; i++) s = endTurn(s);
    expect(s.econ.realIncome).toBeGreaterThanOrEqual(START.medianIncome * LIMITS.income.bounds[0] - 1e-9);
  });
});

describe('social policy integration (SOC-01..04)', () => {
  it('healthcare levers increase life expectancy and family savings', () => {
    const s0 = newGame(1, START);
    const s1 = endTurn(s0, { social: { aca: 120, pub: 1 } });
    expect(s1.econ.lifeExp).toBeGreaterThan(s0.econ.lifeExp);
    expect(s1.report.trace.lifeExp?.some((t) => t.source === 'social:health')).toBe(true);
    expect(s1.report.trace.income?.some((t) => t.source === 'social:family')).toBe(true);
    expect(s1.report.trace.debtPct?.some((t) => t.source === 'social:budget')).toBe(true);
  });

  it('immigration levers expand employment-population ratio and potential growth', () => {
    const s0 = newGame(1, START);
    const baselineNext = endTurn(s0);
    const s1 = endTurn(s0, { social: { vis: 150 } });
    expect(s1.econ.empPop).toBeGreaterThan(baselineNext.econ.empPop);
    expect(s1.report.trace.growth?.some((t) => t.source === 'social:productivity')).toBe(true);
    expect(s1.report.trace.empPop?.some((t) => t.source === 'social:labor')).toBe(true);
  });

  it('energy leasing levers reduce energy inflation pressure', () => {
    const s0 = newGame(1, START);
    const s1 = endTurn(s0, { social: { fos: 130 } });
    const energyTerm = s1.report.trace.inflation?.find((t) => t.source === 'social:energy');
    expect(energyTerm).toBeDefined();
    expect(energyTerm!.amount).toBeLessThan(0);
  });

  it('education levers boost long-term growth and parental labor participation', () => {
    const s0 = newGame(1, START);
    const baselineNext = endTurn(s0);
    const s1 = endTurn(s0, { social: { k12: 120, prek: 1 } });
    expect(s1.econ.empPop).toBeGreaterThan(baselineNext.econ.empPop);
    expect(s1.report.trace.growth?.some((t) => t.source === 'social:productivity')).toBe(true);
    expect(s1.report.trace.empPop?.some((t) => t.source === 'social:labor')).toBe(true);
  });

  it('persists enacted social policies across multiple turns and into legacy', () => {
    const s0 = newGame(1, START);
    const s1 = endTurn(s0, { social: { aca: 120, vis: 140 } });
    expect(s1.socialPolicy?.aca).toBe(120);
    expect(s1.socialPolicy?.vis).toBe(140);
    const s2 = endTurn(s1);
    expect(s2.socialPolicy?.aca).toBe(120);
    expect(s2.socialPolicy?.vis).toBe(140);
  });
});

