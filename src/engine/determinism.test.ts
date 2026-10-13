import { describe, expect, it } from 'vitest';
import { fromPackage } from './budget';
import { enact, START } from './fixture';
import { endTurn, newGame, TOTAL_TURNS, type Decisions } from './game';
import { stableHash } from './hash';
import { chain, LOGS, runFixture } from './replayFixture';

describe('stableHash', () => {
  it('ignores key order and -0, but not array order', () => {
    expect(stableHash({ a: 1, b: 2 })).toBe(stableHash({ b: 2, a: 1 }));
    expect(stableHash(-0)).toBe(stableHash(0));
    expect(stableHash([1, 2])).not.toBe(stableHash([2, 1]));
    expect(stableHash({ a: 1, b: undefined })).toBe(stableHash({ a: 1 }));
  });
  it('tells types and values apart', () => {
    const hs = [1, '1', true, null, [1], { 1: 1 }, 1.0000000000000002].map(stableHash);
    expect(new Set(hs).size).toBe(hs.length);
  });
  it('throws on non-finite numbers', () => {
    expect(() => stableHash({ x: NaN })).toThrow(/x/);
    expect(() => stableHash([Infinity])).toThrow(/\[0\]/);
  });
});

describe('replay', () => {
  it('runs the fixture to the same string twice', () => {
    expect(runFixture()).toBe(runFixture());
    const parsed = JSON.parse(runFixture()) as Record<string, string[]>;
    expect(Object.keys(parsed)).toEqual(LOGS.map((l) => l.name));
    for (const hashes of Object.values(parsed)) expect(hashes).toHaveLength(TOTAL_TURNS);
  });
  it('replays a JSON round-tripped input log to the same chain', () => {
    for (const log of LOGS) expect(chain({ ...log, inputs: JSON.parse(JSON.stringify(log.inputs)) })).toEqual(chain(log));
  });
});

describe('golden replays (OBS-02)', () => {
  const goldens: { name: string; seed: number; expectedHash: string; inputs: Record<number, Decisions> }[] = [
    { name: 'autopilot', seed: 1, expectedHash: '06cb9e6099be48', inputs: {} },
    { name: 'infrastructure', seed: 7, expectedHash: '0473149b8296f5', inputs: { 1: enact(fromPackage('Infrastructure push')) } },
    { name: 'tax-cut', seed: 42, expectedHash: '03b0d9141f2314', inputs: { 1: enact(fromPackage('Tax cut')) } },
    { name: 'balance-budget', seed: 2026, expectedHash: '042d40860f2d7d', inputs: { 3: enact(fromPackage('Balance the budget')) } },
    { name: 'tariffs-35', seed: 99, expectedHash: '09e65477e4a91e', inputs: { 5: enact({ ...fromPackage('Keep as is'), tar: 35 }) } },
    {
      name: 'mixed-strategy',
      seed: 123,
      expectedHash: '02c526af6c730e',
      inputs: { 2: { bill: { budget: { ...fromPackage('Keep as is'), inc: 28, bus: 25, rds: 120 }, deals: ['mod'] } } },
    },
  ];

  for (const g of goldens) {
    it(`replays golden "${g.name}" across 32 turns to exact end-state hash`, () => {
      let s = newGame(g.seed, START);
      for (let t = 1; t < TOTAL_TURNS; t++) {
        s = endTurn(s, g.inputs[t] ?? {});
      }
      expect(stableHash(s)).toBe(g.expectedHash);
    });
  }

  it('runs 8/8 determinism suite with zero drift across repeated seed replays', () => {
    const testSeeds = [1, 7, 42, 99, 123, 777, 1984, 2026];
    for (const seed of testSeeds) {
      let s1 = newGame(seed, START);
      let s2 = newGame(seed, START);
      for (let t = 1; t <= 16; t++) {
        s1 = endTurn(s1, {});
        s2 = endTurn(s2, {});
      }
      expect(stableHash(s1)).toBe(stableHash(s2));
      expect(s1.activeGeopoliticalCrises).toEqual(s2.activeGeopoliticalCrises);
      expect(s1.resolvedGeopoliticalCrises).toEqual(s2.resolvedGeopoliticalCrises);
    }
  });
});

describe('fixture coverage (FND-02)', () => {
  const play = (name: string) => {
    const log = LOGS.find((l) => l.name === name)!;
    let s = log.setup ? log.setup(newGame(log.seed, START)) : newGame(log.seed, START);
    const out = [s];
    for (let t = 1; t < TOTAL_TURNS; t++) out.push((s = endTurn(s, log.inputs[t], { resolvers: log.resolvers })));
    return out;
  };
  const logs = (name: string) => play(name).flatMap((s) => s.report.log);
  it('has a failing, an unaffordable and a resolved-by-keyed-draw case', () => {
    expect(logs('failing-bill')).toContainEqual(expect.objectContaining({ kind: 'bill', id: 'failed' }));
    expect(logs('unaffordable-bill')).toContainEqual(expect.objectContaining({ kind: 'bill', id: 'rejected' }));
    expect(logs('modifiers').filter((l) => l.kind === 'ruling')).toHaveLength(1);
    expect(play('modifiers').at(-1)!.scheduled).toEqual([]);
  });
});

describe('stableHash input guard (WR-05)', () => {
  it('rejects non-plain objects instead of hashing them as {}', () => {
    for (const v of [new Map([[1, 2]]), new Set([1]), new Date(0), { a: new Map() }]) expect(() => stableHash(v)).toThrow(/non-plain/);
    expect(stableHash(Object.create(null))).toBe(stableHash({}));
  });
});
