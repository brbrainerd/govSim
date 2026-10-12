// FND-06 / success criterion 2: lasting effects are modifiers that show up in the trace under their own
// source name; delayed effects are scheduled items resolved by keyed draws. Neither moves a draw (FND-01).
import { describe, expect, it } from 'vitest';
import { conservationErrors } from '../testing/conservation';
import { START } from './fixture';
import { mod, withMods } from '../testing/mods';
import { endTurn, newGame, type GameState, type StepOptions } from './game';
import { activeAt, RESOLVERS, type Channel, type Resolver, type Scheduled } from './modifiers';
import { draw } from './rng';
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
    const s = endTurn(withMods(2, [mod({ channel: 'gap', source: 'law:z', tag: 'law' })]));
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('activeAt filters by turn and drops eo only for legacy', () => {
    const ms = [mod({ channel: 'gap', source: 'eo:a', tag: 'eo' }), mod({ channel: 'gap', source: 'event:b', from: 5 })];
    expect(activeAt(ms, 4, false).map((m) => m.source)).toEqual(['eo:a']);
    expect(activeAt(ms, 5, false).map((m) => m.source)).toEqual(['eo:a', 'event:b']);
    expect(activeAt(ms, 5, true).map((m) => m.source)).toEqual(['event:b']);
  });

  it('registers Phase 4 and Phase 5 resolvers', () => {
    expect(Object.keys(RESOLVERS)).toEqual(['disaster_rally', 'court_ruling']);
  });
});

describe('scheduled items', () => {
  const item: Scheduled = { id: 's1', kind: 'test', due: 5, data: {} };
  const addApproval: Resolver = ({ turn, item: i }) => ({
    add: [mod({ channel: 'approval', source: 'event:test', amount: 2, from: turn, until: turn + 2 })],
    log: [{ kind: 'test', id: i.id }],
  });
  const at3 = (extra: Partial<GameState> = {}): GameState => { let s = newGame(8, START); while (s.turn < 3) s = endTurn(s); return { ...s, ...extra }; };

  it('resolves in the step starting at the due turn, never earlier, and leaves state.scheduled', () => {
    const opts: StepOptions = { resolvers: { test: addApproval } };
    let s = at3({ scheduled: [item] });
    for (const turn of [3, 4, 5, 6]) {
      const next = endTurn(s, {}, opts);
      expect(termOf(next, 'approval', 'event:test') !== undefined, `step at ${turn}`).toBe(turn >= 5);
      expect(next.report.log.some((l) => l.kind === 'test')).toBe(turn === 5);
      expect(next.scheduled).toEqual(turn >= 5 ? [] : [item]);
      expect(conservationErrors(s, next)).toEqual([]);
      s = next;
    }
  });

  it('endGroups stops the whole group from the resolving step on', () => {
    const end: Resolver = () => ({ endGroups: ['eo:x'] });
    let s = at3({ scheduled: [item], modifiers: [mod({ channel: 'gap', source: 'eo:x', group: 'eo:x', tag: 'eo' }), mod({ id: 'b', channel: 'gap', source: 'eo:x', group: 'eo:x', tag: 'eo' })] });
    for (const turn of [3, 4, 5, 6]) {
      s = endTurn(s, {}, { resolvers: { test: end } });
      expect(termOf(s, 'gap', 'eo:x') !== undefined, `step at ${turn}`).toBe(turn < 5);
    }
    expect(s.modifiers.every((m) => m.until === 4)).toBe(true);
  });

  it('never changes report.luck, and keyed draws replay identically', () => {
    const coin: Resolver = ({ seed, turn, item: i }) => ({ add: draw(seed, 'court', turn, i.id) < 0.5 ? [mod({ channel: 'gap', source: 'event:coin' })] : [] });
    const opts = { resolvers: { test: coin } };
    const run = (scheduled: Scheduled[]) => { let s = at3({ scheduled }); const out = [s]; while (s.turn < 12) out.push((s = endTurn(s, {}, opts))); return out; };
    const [a, b, none] = [run([item]), run([item]), run([])];
    expect(a).toEqual(b);
    expect(a.map((s) => s.report.luck)).toEqual(none.map((s) => s.report.luck));
  });

  it('throws naming an unknown kind (also not an inherited property)', () => {
    expect(() => endTurn(at3({ scheduled: [{ ...item, due: 3, kind: 'nope' }] }), {}, { resolvers: {} })).toThrow(/nope/);
    expect(() => endTurn(at3({ scheduled: [{ ...item, due: 3, kind: 'constructor' }] }), {}, { resolvers: {} })).toThrow(/constructor/);
  });
});

describe('review fixes (01-REVIEW WR-04, WR-09)', () => {
  const at3 = (extra: Partial<GameState> = {}): GameState => { let s = newGame(8, START); while (s.turn < 3) s = endTurn(s); return { ...s, ...extra }; };

  it('resolves due items in id order whatever their array order', () => {
    const order: string[] = [];
    const rec: Resolver = ({ item: i }) => { order.push(i.id); return {}; };
    const a: Scheduled = { id: 'a', kind: 'rec', due: 3, data: {} }, b: Scheduled = { ...a, id: 'b' };
    endTurn(at3({ scheduled: [b, a] }), {}, { resolvers: { rec } });
    expect(order).toEqual(['a', 'b']);
  });

  it('throws on an overdue item instead of stranding it', () => {
    expect(() => endTurn(at3({ scheduled: [{ id: 'late', kind: 'rec', due: 2, data: {} }] }), {}, { resolvers: { rec: () => ({}) } })).toThrow(/late/);
  });

  it('rejects a modifier whose source is reserved or does not match its tag', () => {
    for (const source of ['luck', 'clamp', 'budget', 'eo:x'])
      expect(() => endTurn(withMods(1, [mod({ channel: 'gap', source })])), source).toThrow(/must start with "event:"/);
  });
});
