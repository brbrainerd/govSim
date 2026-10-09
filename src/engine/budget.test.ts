import { describe, expect, it } from 'vitest';
import { baseline, describe as words, estimate, fromPackage } from './budget';
import { deals, tally, TO_PASS, voteOutcome } from './congress';

describe('budget forecast', () => {
  it('is neutral at baseline and directional otherwise', () => {
    expect(estimate(baseline())).toEqual({ deficitBn: 0, growth: 0, familyMonthly: 0 });
    expect(estimate(fromPackage('Tax cut')).deficitBn).toBeGreaterThan(0);
    expect(estimate(fromPackage('Balance the budget')).deficitBn).toBeLessThan(0);
    expect(words(estimate(fromPackage('Balance the budget'))).deficit).toMatch(/less over 10 years/);
  });
});

describe('congress', () => {
  it('starts short and can pass with deals', () => {
    expect(tally([]).total).toBe(203);
    expect(tally([]).short).toBe(15);
    const all = tally(deals.map((d) => d.id));
    expect(all.total).toBeGreaterThanOrEqual(TO_PASS);
  });

  it('rewards a pass and refunds half on a fail', () => {
    expect(voteOutcome(220, 35)).toEqual({ passed: true, cloutBack: 10 });
    expect(voteOutcome(210, 35)).toEqual({ passed: false, cloutBack: 17 });
  });
});
