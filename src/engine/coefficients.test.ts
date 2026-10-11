import { describe, expect, it } from 'vitest';
import { fromData, us } from '../data/us';
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

// Names and values game.ts uses today (22 existing, then the inline literals); plan 01-06 swaps it onto the registry.
const GAME_VALUES: Record<string, number> = {
  gapPersistence: 0.85, fiscalMultiplier: 0.6, rateDrag: 0.15, neutralReal: 1.0, okun: 0.5, empPerU: 0.6, phillips: 0.15,
  expectPull: 0.25, expectAdapt: 0.1, tariffPass: 0.1, taylorInfl: 0.5, taylorGap: 0.5, fedSmooth: 0.4, potentialMax: 0.25,
  crowdOut: 0.012, crisisAt: 130, termPremium: 0.02, approvalPull: 0.35, honeymoon: 8, shockGap: 0.3, shockInfl: 0.12, shockApproval: 1.0,
  inflTarget: 2, fedStep: 0.25, debtStressGap: 0.4, debtStressUnit: 10, fedPassThrough: 0.5, stressPremium: 1.5, incomeGrowthShare: 0.8,
  lifeTrend: 0.01, lifeSpending: 0.015, lifeAdjust: 0.1, giniIncomeTax: 0.0015, giniMedicaid: 0.0005, giniAdjust: 0.05,
  crimeJobs: 0.004, crimeTrend: 0.001, honeymoonQuarters: 4, approvalNeutral: 50, approvalJobs: 2.5, approvalPrices: 2,
  approvalPriceFloor: 2.5, approvalGrowth: 1.5, trustAdjust: 0.1, trustApproval: 0.4, cloutPerApproval: 10,
};

describe('registry tables', () => {
  it('every entry in all four tables is valid', () => {
    for (const table of [COEFF, LIMITS, SCORE, RULES] as Record<string, Coeff | Limit>[])
      for (const [name, entry] of Object.entries(table)) expect(problems(name, entry), name).toEqual([]);
  });

  it('COEFF carries every name game.ts uses, with identical values', () => {
    for (const [name, value] of Object.entries(GAME_VALUES)) expect(C[name as keyof typeof C], name).toBe(value);
  });

  it('score weights sum to 1 and the limits and rules are present', () => {
    const w = [SCORE.incomeWeight, SCORE.employmentWeight, SCORE.inflationWeight, SCORE.debtWeight, SCORE.lifeExpWeight, SCORE.inequalityWeight, SCORE.securityWeight, SCORE.trustWeight];
    expect(Math.abs(w.reduce((a, c) => a + c.value, 0) - 1)).toBeLessThan(1e-12);
    expect(Object.keys(LIMITS).sort()).toEqual(['approval', 'fedRate', 'gini', 'inflation', 'score', 'trust', 'unemployment']);
    expect(Object.keys(RULES).sort()).toEqual(['refundDivisor', 'startApproval', 'startClout', 'voteReward']);
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
