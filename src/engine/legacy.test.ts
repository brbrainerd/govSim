// FND-06 / D5: the 10-year legacy projection drops executive orders, keeps events and the keyed macro
// shocks (A5), and never resolves scheduled items.
import { describe, expect, it } from 'vitest';
import { normal } from './rng';
import { START } from './fixture';
import { endTurn, legacy, newGame, step, TOTAL_TURNS } from './game';
import { mod, withMods } from '../testing/mods';

const toEnd = (s: ReturnType<typeof newGame>) => { for (let t = s.turn; t < TOTAL_TURNS; t++) s = endTurn(s); return s; };

describe('legacy projection', () => {
  const eo = [mod({ channel: 'gap', source: 'eo:test', amount: 0.5, tag: 'eo' })];
  const plain = newGame(4, START);

  it('ignores eo-tagged modifiers while a normal run does not', () => {
    expect(legacy(withMods(4, eo)).econ).toEqual(legacy(plain).econ);
    let a = withMods(4, eo), b = plain;
    for (let t = 1; t < TOTAL_TURNS; t++) { a = endTurn(a); b = endTurn(b); }
    expect(a.econ).not.toEqual(b.econ);
  });

  it('keeps event-tagged modifiers that are still active at turn 32', () => {
    const ev = [mod({ channel: 'gap', source: 'event:test', amount: 0.5 })];
    expect(legacy(toEnd(withMods(4, ev))).econ).not.toEqual(legacy(toEnd(plain)).econ);
  });

  it('keeps the keyed macro shocks', () => {
    const s = withMods(4, eo);
    expect(step(s, {}, { legacy: true }).report.luck).toEqual({
      gap: normal(4, 'macro', s.turn, 'gap'), infl: normal(4, 'macro', s.turn, 'infl'), appr: normal(4, 'macro', s.turn, 'appr'),
    });
  });
});
