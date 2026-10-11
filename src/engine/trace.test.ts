// FND-04: every traced change is the sum of named terms (GR-05), over many seeds, five strategies and
// the legacy path. FND-01: luck is one source id with a known size.
import { describe, expect, it } from 'vitest';
import { conservationErrors } from '../testing/conservation';
import { fromPackage, type BudgetDraft } from './budget';
import { C } from './coefficients';
import { enact, START } from './fixture';
import { endTurn, newGame, step, TOTAL_TURNS, type Decisions, type GameState } from './game';

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
});
