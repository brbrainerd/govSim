import { describe, expect, it } from 'vitest';
import {
  calculateMidtermShift,
  deals,
  groups,
  groupsFor,
  HOUSE_SEATS,
  socialWhipShift,
  tally,
  TO_PASS,
  voteOutcome,
} from './congress';

describe('congressional groups and midterms', () => {
  it('conserves 435 House seats across all midterm approval levels', () => {
    for (let approval = 10; approval <= 90; approval += 5) {
      const { houseShift } = calculateMidtermShift(approval);
      const active = groupsFor(houseShift);
      const totalSeats = active.reduce((sum, g) => sum + g.seats, 0);
      expect(totalSeats).toBe(HOUSE_SEATS);
    }
  });

  it('calculates default baseline tally correctly (203 total, 15 short)', () => {
    const res = tally([]);
    expect(res.total).toBe(203);
    expect(res.short).toBe(15);
    expect(res.byGroup.pro).toBe(95);
    expect(res.byGroup.mod).toBe(80);
    expect(res.byGroup.cen).toBe(20);
    expect(res.byGroup.con).toBe(8);
    expect(res.byGroup.fre).toBe(0);
  });

  it('deals add expected group votes and reduce shortage', () => {
    const res = tally(['mod', 'cen']);
    // mod adds +12 to mod (80 + 12 = 92)
    // cen adds +9 to cen (20 + 9 = 29)
    expect(res.byGroup.mod).toBe(92);
    expect(res.byGroup.cen).toBe(29);
    expect(res.total).toBe(203 + 12 + 9);
    expect(res.short).toBe(0);
  });
});

describe('social policy whip evaluation (SOC-01..04)', () => {
  it('evaluates ideological sensitivities across blocs', () => {
    // Highly progressive unfinanced bill
    const progDraft = { prek: 1, sdr: 20, cln: 120 };
    const progShift = socialWhipShift(progDraft);
    expect(progShift.con).toBeLessThan(0); // Conservatives strongly resist
    expect(progShift.cen).toBeLessThan(0); // Centrists resist unfinanced spending

    // Conservative bill
    const conDraft = { bdr: 120, fos: 120 };
    const conShift = socialWhipShift(conDraft);
    expect(conShift.con).toBeGreaterThan(0); // Conservatives support
    expect(conShift.pro).toBeLessThan(0); // Progressives oppose fossil expansion

    // Bipartisan compromise package: clean energy paired with fossil permitting, border paired with visas
    const compDraft = { cln: 120, fos: 120, bdr: 120, vis: 120 };
    const compShift = socialWhipShift(compDraft);
    expect(compShift.cen).toBeGreaterThan(0); // Centrists reward the compromise
    expect(compShift.con).toBeGreaterThan(0); // Conservatives gain on border & fossil
  });

  it('tally incorporates socialDraft and clamps each bloc to [0, seats]', () => {
    const unfinancedRes = tally([], 0, { prek: 1, sdr: 40, aca: 140 });
    // Without deals, heavy entitlement expansion loses votes among con/cen
    expect(unfinancedRes.total).toBeLessThan(203);

    // With deals and compromise, passes threshold
    const balancedRes = tally(['mod', 'cen'], 0, { cln: 120, fos: 120, bdr: 120, vis: 120 });
    expect(balancedRes.total).toBeGreaterThanOrEqual(TO_PASS);
    expect(balancedRes.short).toBe(0);
  });

  it('determines vote outcome and clout refunds', () => {
    expect(voteOutcome(220, 20)).toEqual({ passed: true, cloutBack: 10 });
    expect(voteOutcome(210, 20)).toEqual({ passed: false, cloutBack: 10 });
  });
});
