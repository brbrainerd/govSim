import { describe, expect, it } from 'vitest';
import { baseline } from './budget';
import { START } from './fixture';
import { newGame } from './game';
import {
  calculateHouseholdImpact,
  createCustomHousehold,
  DEFAULT_HOUSEHOLD_PERSONA,
  getHouseholdPreset,
  HOUSEHOLD_PRESETS,
  type HouseholdPersona,
} from './household';
import { socialBaseline } from './social';

describe('household impact engine (HOU-01, HOU-02)', () => {
  const game = newGame(42, START);
  const baseBudget = baseline();
  const baseSocial = socialBaseline();

  it('exposes 4 authentic preset personas covering diverse demographics and geographies', () => {
    expect(HOUSEHOLD_PRESETS).toHaveLength(4);
    const ids = HOUSEHOLD_PRESETS.map((p) => p.id);
    expect(ids).toContain('rust_belt_manufacturing');
    expect(ids).toContain('sun_belt_retiree');
    expect(ids).toContain('suburban_educator_couple');
    expect(ids).toContain('urban_service_worker');

    expect(DEFAULT_HOUSEHOLD_PERSONA.id).toBe('rust_belt_manufacturing');
    expect(getHouseholdPreset('sun_belt_retiree')).toBeDefined();
    expect(getHouseholdPreset('unknown')).toBeUndefined();
  });

  it('computes zero or near-zero net impact under baseline starting conditions', () => {
    for (const persona of HOUSEHOLD_PRESETS) {
      const impact = calculateHouseholdImpact(persona, game, baseBudget, baseSocial);
      // At baseline starting turn, policies match start and inflation is on target
      expect(impact.energyDelta).toBe(0);
      expect(impact.healthcareDelta).toBe(0);
      expect(impact.childcareDelta).toBe(0);
      expect(impact.studentLoansDelta).toBe(0);
      expect(impact.taxesDelta).toBe(0);
      expect(impact.wagesDelta).toBe(0);
      expect(impact.groceriesDelta).toBe(0);
      expect(impact.netMonthlyDelta).toBe(0);
    }
  });

  it('benefits marketplace households when ACA subsidies are expanded', () => {
    const acaExpandedSocial = { ...baseSocial, aca: baseSocial.aca! + 10 };

    const urbanService = getHouseholdPreset('urban_service_worker')!;
    const rustBelt = getHouseholdPreset('rust_belt_manufacturing')!;

    const urbanImpact = calculateHouseholdImpact(urbanService, game, baseBudget, acaExpandedSocial);
    const rustBeltImpact = calculateHouseholdImpact(rustBelt, game, baseBudget, acaExpandedSocial);

    // Urban service worker uses ACA marketplace -> receives savings (negative cost delta)
    expect(urbanImpact.healthcareDelta).toBeLessThan(0);
    expect(urbanImpact.netMonthlyDelta).toBeGreaterThan(0);

    // Rust belt worker has employer insurance (usesAcaMarketplace = false) -> 0 healthcare delta
    expect(rustBeltImpact.healthcareDelta).toBe(0);
  });

  it('delivers prescription drug savings specifically to senior households under Medicare drug negotiation', () => {
    const drugCapSocial = { ...baseSocial, drg: baseSocial.drg! + 20 };

    const retiree = getHouseholdPreset('sun_belt_retiree')!;
    const techCouple = getHouseholdPreset('suburban_educator_couple')!;

    const retireeImpact = calculateHouseholdImpact(retiree, game, baseBudget, drugCapSocial);
    const techImpact = calculateHouseholdImpact(techCouple, game, baseBudget, drugCapSocial);

    // Senior receives prescription drug savings
    expect(retireeImpact.healthcareDelta).toBeLessThan(0);
    expect(retireeImpact.netMonthlyDelta).toBeGreaterThan(0);

    // Young family has no Medicare drug savings
    expect(techImpact.healthcareDelta).toBe(0);
  });

  it('delivers student loan repayment relief only to debt-bearing households', () => {
    const sdrSocial = { ...baseSocial, sdr: baseSocial.sdr! + 30 };

    const educator = getHouseholdPreset('suburban_educator_couple')!;
    const rustBelt = getHouseholdPreset('rust_belt_manufacturing')!;

    const educatorImpact = calculateHouseholdImpact(educator, game, baseBudget, sdrSocial);
    const rustBeltImpact = calculateHouseholdImpact(rustBelt, game, baseBudget, sdrSocial);

    // Educator couple has student loans -> positive monthly cashflow relief
    expect(educatorImpact.studentLoansDelta).toBeGreaterThan(0);
    expect(educatorImpact.netMonthlyDelta).toBeGreaterThan(0);

    // Rust belt family without student debt gets 0
    expect(rustBeltImpact.studentLoansDelta).toBe(0);
  });

  it('scales childcare savings with young children under universal pre-K', () => {
    const prekSocial = { ...baseSocial, prek: baseSocial.prek! + 1 };

    const familyWithToddler = getHouseholdPreset('suburban_educator_couple')!; // 1 young kid
    const retiree = getHouseholdPreset('sun_belt_retiree')!; // 0 kids

    const familyImpact = calculateHouseholdImpact(familyWithToddler, game, baseBudget, prekSocial);
    const retireeImpact = calculateHouseholdImpact(retiree, game, baseBudget, prekSocial);

    expect(familyImpact.childcareDelta).toBeGreaterThan(0);
    expect(retireeImpact.childcareDelta).toBe(0);

    // 2 toddlers should get double the pre-K savings
    const twoToddlers = createCustomHousehold({
      locationState: 'NC',
      annualIncome: 100_000,
      composition: 'young_family',
      youngChildrenCount: 2,
    });
    const twoToddlersImpact = calculateHouseholdImpact(twoToddlers, game, baseBudget, prekSocial);
    expect(twoToddlersImpact.childcareDelta).toBe(familyImpact.childcareDelta * 2);
  });

  it('increases grocery and consumer goods costs with tariff increases', () => {
    const tariffBudget = { ...baseBudget, tar: baseBudget.tar! + 10 };

    const rustBelt = getHouseholdPreset('rust_belt_manufacturing')!;
    const impact = calculateHouseholdImpact(rustBelt, game, tariffBudget, baseSocial);

    // Tariffs increase grocery and consumer costs
    expect(impact.groceriesDelta).toBeGreaterThan(0);
    expect(impact.netMonthlyDelta).toBeLessThan(0);
  });

  it('taxes high earners more heavily and progressively than low earners on income tax increases', () => {
    const taxHikeBudget = { ...baseBudget, inc: baseBudget.inc! + 5 };

    const lowEarner = createCustomHousehold({
      locationState: 'OH',
      annualIncome: 35_000,
      composition: 'single',
    });
    const highEarner = createCustomHousehold({
      locationState: 'OH',
      annualIncome: 160_000,
      composition: 'single',
    });

    const lowImpact = calculateHouseholdImpact(lowEarner, game, taxHikeBudget, baseSocial);
    const highImpact = calculateHouseholdImpact(highEarner, game, taxHikeBudget, baseSocial);

    expect(lowImpact.taxesDelta).toBeGreaterThan(0);
    expect(highImpact.taxesDelta).toBeGreaterThan(lowImpact.taxesDelta);

    // Tax increase as share of income is higher for high earner (progressivity)
    const lowRate = (lowImpact.taxesDelta * 12) / lowEarner.annualIncome;
    const highRate = (highImpact.taxesDelta * 12) / highEarner.annualIncome;
    expect(highRate).toBeGreaterThan(lowRate);
  });

  it('handles edge case inputs robustly without NaN or infinite values', () => {
    const zeroIncome = createCustomHousehold({
      locationState: 'WY',
      annualIncome: 0,
      composition: 'single',
    });
    const ultraHighIncome = createCustomHousehold({
      locationState: 'NY',
      annualIncome: 2_000_000,
      composition: 'couple',
    });

    const zeroImpact = calculateHouseholdImpact(zeroIncome, game, baseBudget, baseSocial);
    const highImpact = calculateHouseholdImpact(ultraHighIncome, game, baseBudget, baseSocial);

    expect(Number.isFinite(zeroImpact.netMonthlyDelta)).toBe(true);
    expect(Number.isFinite(highImpact.netMonthlyDelta)).toBe(true);
    expect(zeroImpact.taxesDelta).toBe(0);
    expect(zeroImpact.wagesDelta).toBe(0);
  });

  it('guarantees deterministic bit-identical results for identical inputs', () => {
    const persona = getHouseholdPreset('rust_belt_manufacturing')!;
    const shiftedSocial = { ...baseSocial, aca: 120, prek: 1, crb: 30 };
    const shiftedBudget = { ...baseBudget, inc: 24, tar: 15 };

    const run1 = calculateHouseholdImpact(persona, game, shiftedBudget, shiftedSocial);
    const run2 = calculateHouseholdImpact(persona, game, shiftedBudget, shiftedSocial);

    expect(run1).toEqual(run2);
  });
});
