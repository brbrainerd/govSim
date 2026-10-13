import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fromData, us } from '../data/us';
import { scan } from '../testing/scan';
import { spendLevers, taxLevers } from './budget';
import { C, COEFF, LIMITS, problems, RULES, SCORE, type Coeff, type Limit } from './coefficients';
import { voteOutcome } from './congress';

const good: Coeff = {
  value: 1, unit: 'pts', basis: 'judgement', range: [0, 2], note: 'plausible',
};
const cite = { text: 'A paper', url: 'https://example.org/a' };

describe('registry validator', () => {
  it('accepts a valid entry, including a value on either range edge', () => {
    expect(problems('ok', good)).toEqual([]);
    expect(problems('lo', { ...good, value: 0 })).toEqual([]);
    expect(problems('hi', { ...good, value: 2 })).toEqual([]);
    expect(problems('cited', { ...good, basis: 'citation', sources: [cite] })).toEqual([]);
  });

  it('rejects each kind of bad entry with exactly one message', () => {
    const bad: [string, Coeff | Limit][] = [
      ['lo == hi', { ...good, value: 1, range: [1, 1] }],
      ['value below lo', { ...good, value: -0.1 }],
      ['value above hi', { ...good, value: 2.1 }],
      ['empty unit', { ...good, unit: '' }],
      ['empty note', { ...good, note: '' }],
      ['citation without sources', { ...good, basis: 'citation' }],
      ['http source', { ...good, basis: 'citation', sources: [{ text: 'A', url: 'http://example.org' }] }],
      ['empty source text', { ...good, basis: 'citation', sources: [{ text: '', url: 'https://example.org' }] }],
      ['limit with lo == hi', { bounds: [3, 3], unit: 'pts', basis: 'judgement', note: 'n' }],
    ];
    for (const [label, entry] of bad) expect(problems(label, entry), label).toHaveLength(1);
  });
});

describe('registry tables', () => {
  it('every entry in all four tables is valid', () => {
    for (const table of [COEFF, LIMITS, SCORE, RULES] as Record<string, Coeff | Limit>[])
      for (const [name, entry] of Object.entries(table)) expect(problems(name, entry), name).toEqual([]);
  });

  it('score weights sum to 1 and the limits and rules are present', () => {
    const w = [SCORE.incomeWeight, SCORE.employmentWeight, SCORE.inflationWeight, SCORE.debtWeight, SCORE.lifeExpWeight, SCORE.inequalityWeight, SCORE.securityWeight, SCORE.trustWeight];
    expect(Math.abs(w.reduce((a, c) => a + c.value, 0) - 1)).toBeLessThan(1e-12);
    expect(Object.keys(LIMITS).sort()).toEqual(['approval', 'fedRate', 'gini', 'heat', 'income', 'inflation', 'score', 'trust', 'unemployment']);
    expect(Object.keys(RULES).sort()).toEqual(['approvalStep', 'refundDivisor', 'startApproval', 'startClout', 'voteReward']);
  });

  it('every source link is https', () => {
    for (const table of [COEFF, LIMITS, SCORE, RULES] as Record<string, Coeff | Limit>[])
      for (const e of Object.values(table)) for (const s of e.sources ?? []) expect(s.url.startsWith('https://')).toBe(true);
  });
});

describe('COEFF', () => {

  it('potential growth comes from the registry into the starting data', () => {
    expect(C.potentialGrowth).toBe(1.8);
    expect(fromData(us).potential).toBe(C.potentialGrowth);
    expect(fromData(us).tariff).toBe(taxLevers.find((l) => l.id === 'tar')!.base); // the data and the lever base must not drift (IN-02)
  });
});

describe('budget levers', () => {
  it('every lever states a valid basis and a note', () => {
    const levers = [...taxLevers, ...spendLevers];
    expect(levers).toHaveLength(11);
    for (const l of levers) {
      expect(['citation', 'judgement'], l.id).toContain(l.basis);
      expect(l.note.trim(), l.id).not.toBe('');
    }
  });

  it('vote outcome reads its reward and refund from RULES', () => {
    expect(voteOutcome(220, 35)).toEqual({ passed: true, cloutBack: 10 });
    expect(voteOutcome(210, 35)).toEqual({ passed: false, cloutBack: 17 });
  });
});

// FND-07 / T-1-12: the engine reads every model number from the registry. Never widen this list to
// make the scan pass: register the number in coefficients.ts instead.
describe('literal scan', () => {
  const EXEMPT = new Set(['coefficients.ts', 'units.ts', 'rng.ts', 'hash.ts', 'detmath.ts', 'budget.ts', 'congress.ts', 'calendar.ts', 'fixture.ts', 'replayFixture.ts']);
  const dir = 'src/engine';
  const files = readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));

  it('can fail: a bare coefficient is reported', () => {
    expect(scan('x.ts', 'const k = 0.4 * y').literals).toHaveLength(1);
  });

  it('scans the engine files that hold the model', () => {
    for (const f of ['game.ts', 'score.ts', 'trace.ts', 'decisions.ts']) expect(files.filter((x) => !EXEMPT.has(x))).toContain(f);
  });

  it('finds no numeric literal other than 0 or 1 outside the exempt files', () => {
    const literals = files.filter((f) => !EXEMPT.has(f)).flatMap((f) => scan(join(dir, f), readFileSync(join(dir, f), 'utf8')).literals);
    expect(literals).toEqual([]);
  });
});
