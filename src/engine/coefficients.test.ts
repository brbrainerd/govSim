import { describe, expect, it } from 'vitest';
import { fromData, us } from '../data/us';
import { C, COEFF, problems, type Coeff, type Limit } from './coefficients';

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

describe('COEFF', () => {
  it('every entry is valid', () => {
    for (const [name, entry] of Object.entries(COEFF)) expect(problems(name, entry), name).toEqual([]);
  });

  it('potential growth comes from the registry into the starting data', () => {
    expect(C.potentialGrowth).toBe(1.8);
    expect(fromData(us).potential).toBe(C.potentialGrowth);
  });
});
