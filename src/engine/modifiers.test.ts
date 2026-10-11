// FND-06 / success criterion 2: lasting effects are modifiers that show up in the trace under their own
// source name; delayed effects are scheduled items resolved by keyed draws. Neither moves a draw (FND-01).
import { describe, expect, it } from 'vitest';
import { conservationErrors } from '../testing/conservation';
import { START } from './fixture';
import { mod, withMods } from '../testing/mods';
import { endTurn, newGame, type GameState } from './game';
import { activeAt, RESOLVERS, type Channel, type Modifier } from './modifiers';
import type { TraceKey } from './trace';

/** The trace key each channel lands on (growth for potential, debtPct for debtBn, fedRate for fedTarget). */
const LANDS: Record<Channel, TraceKey> = {
  gap: 'gap', inflation: 'inflation', expected: 'expected', approval: 'approval', trust: 'trust',
  potential: 'growth', debtBn: 'debtPct', clout: 'clout', fedTarget: 'fedRate',
};
const termOf = (s: GameState, key: TraceKey, source: string) => s.report.trace[key]?.find((t) => t.source === source)?.amount;

describe('modifiers', () => {
  it('act exactly in the steps whose starting turn is in [from, until], and conserve', () => {
    let s = withMods(5, [mod({ channel: 'gap', source: 'eo:test', amount: 0.5, from: 3, tag: 'eo' })]);
    for (let t = 1; t <= 6; t++) {
      const next = endTurn(s);
      expect(termOf(next, 'gap', 'eo:test'), `turn ${t}`).toBe(t >= 3 ? 0.5 : undefined);
      expect(conservationErrors(s, next)).toEqual([]);
      s = next;
    }
  });

  it('stops after until (inclusive)', () => {
    let s = withMods(5, [mod({ channel: 'gap', source: 'event:short', from: 2, until: 3 })]);
    for (let t = 1; t <= 5; t++) {
      const next = endTurn(s);
      expect(termOf(next, 'gap', 'event:short') !== undefined, `turn ${t}`).toBe(t === 2 || t === 3);
      s = next;
    }
  });

  it.each(Object.entries(LANDS))('channel %s lands on %s under its source name', (channel, key) => {
    const source = `event:c-${channel}`;
    const s = withMods(9, [mod({ channel: channel as Channel, source, amount: 0.3 })]);
    const next = endTurn(s);
    expect(termOf(next, key, source)).toBeCloseTo(channel === 'fedTarget' ? 0.4 * 0.3 : channel === 'debtBn' ? (0.3 / 1000 / next.econ.gdp) * 100 : 0.3, 12);
    expect(conservationErrors(s, next)).toEqual([]);
  });

  it('a gap modifier reaches growth and unemployment through the shared gap ledger', () => {
    const next = endTurn(withMods(3, [mod({ channel: 'gap', source: 'event:boom', amount: 1 })]));
    expect(termOf(next, 'growth', 'event:boom')).toBe(4);
    expect(termOf(next, 'unemployment', 'event:boom')).toBeLessThan(0);
  });

  it('never changes report.luck', () => {
    let a = newGame(11, START), b = withMods(11, [mod({ channel: 'approval', source: 'event:x', amount: 2 }), mod({ channel: 'gap', source: 'eo:y', tag: 'eo' })]);
    for (let t = 1; t < 31; t++) {
      a = endTurn(a); b = endTurn(b);
      expect(b.report.luck).toEqual(a.report.luck);
    }
  });

  it('survives JSON with an until of FOREVER', () => {
    const s = endTurn(withMods(2, [mod({ channel: 'gap', source: 'law:z' })]));
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('activeAt filters by turn and drops eo only for legacy', () => {
    const ms = [mod({ channel: 'gap', source: 'eo:a', tag: 'eo' }), mod({ channel: 'gap', source: 'event:b', from: 5 })];
    expect(activeAt(ms, 4, false).map((m) => m.source)).toEqual(['eo:a']);
    expect(activeAt(ms, 5, false).map((m) => m.source)).toEqual(['eo:a', 'event:b']);
    expect(activeAt(ms, 5, true).map((m) => m.source)).toEqual(['event:b']);
  });

  it('ships with no resolvers registered in Phase 1', () => {
    expect(RESOLVERS).toEqual({});
  });
});
