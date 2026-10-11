// FND-01 / D2: luck is a function of (seed, turn) only, never of play.
import { describe, expect, it } from 'vitest';
import { fromPackage, type BudgetDraft } from './budget';
import { endTurn, newGame, TOTAL_TURNS, type Decisions, type GameState } from './game';
import { enact, START } from './fixture';
import { normal } from './rng';

/** 32 states; `first` is the turn-1 Decisions, null for autopilot, 'empty' for {} every turn. */
const play = (seed: number, first: Decisions | null | 'empty'): GameState[] => {
  const out = [newGame(seed, START)];
  for (let t = 1; t < TOTAL_TURNS; t++) {
    const d = first === 'empty' ? {} : t === 1 && first ? first : undefined;
    out.push(endTurn(out[t - 1]!, d));
  }
  return out;
};
const luck = (states: GameState[]) => states.map((s) => s.report.luck);

const maxDeficit: BudgetDraft = { ...fromPackage('Tax cut'), def: 120, ssm: 110, mcd: 120, rds: 130, rnd: 130, oth: 120 };
const strategies: Record<string, Decisions | null | 'empty'> = {
  autopilot: null,
  empty: 'empty',
  sensible: enact(fromPackage('Infrastructure push')),
  maxDeficit: enact(maxDeficit),
  tariffs35: enact({ ...fromPackage('Keep as is'), tar: 35 }),
};

describe('shocks', () => {
  it('gives every strategy autopilot\'s luck over seeds 1-200', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const base = luck(play(seed, null));
      for (const [name, first] of Object.entries(strategies)) expect(luck(play(seed, first)), `${name} seed ${seed}`).toEqual(base);
    }
  });

  it('carries no RNG cursor and records zero luck at the start', () => {
    const keys = Object.keys(newGame(1, START));
    expect(keys).not.toContain('rng');
    expect(keys).toContain('report');
    expect(newGame(1, START).report.luck).toEqual({ gap: 0, infl: 0, appr: 0 });
  });

  it('draws each shock as normal(seed, macro, turn, key) for the turn the step started from', () => {
    const states = play(7, null);
    for (let t = 1; t < TOTAL_TURNS; t++) {
      expect(states[t]!.report.luck).toEqual({
        gap: normal(7, 'macro', t, 'gap'), infl: normal(7, 'macro', t, 'infl'), appr: normal(7, 'macro', t, 'appr'),
      });
    }
  });

  it('survives a negative int32 seed', () => {
    const base = luck(play(-31337, null));
    for (const l of base) for (const v of Object.values(l)) expect(Number.isFinite(v)).toBe(true);
    expect(luck(play(-31337, strategies.maxDeficit!))).toEqual(base);
  });
});
