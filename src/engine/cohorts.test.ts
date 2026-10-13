import { describe, expect, it } from 'vitest';
import { START } from './fixture';
import { newGame } from './game';
import { calculateDemographicCoalitions, COHORTS_CATALOG } from './cohorts';

describe('demographic coalitions (SOC-05)', () => {
  it('returns exactly 6 demographic cohorts matching the catalog', () => {
    const state = newGame(42, START);
    const cohorts = calculateDemographicCoalitions(state, 'D');

    expect(cohorts).toHaveLength(6);
    expect(cohorts.map((c) => c.id)).toEqual([
      'seniors',
      'working_class',
      'young_families',
      'college_educated',
      'immigrant',
      'energy_ag',
    ]);
    expect(COHORTS_CATALOG).toHaveLength(6);
  });

  it('keeps cohort support strictly within [15, 85] under extreme conditions', () => {
    const base = newGame(42, START);

    // Extreme crash
    const crash = {
      ...base,
      approval: 5,
      econ: {
        ...base.econ,
        growth: -10,
        inflation: 20,
      },
    };
    const crashCohorts = calculateDemographicCoalitions(crash, 'D');
    for (const c of crashCohorts) {
      expect(c.supportPct).toBeGreaterThanOrEqual(15);
      expect(c.supportPct).toBeLessThanOrEqual(85);
    }

    // Extreme boom
    const boom = {
      ...base,
      approval: 95,
      econ: {
        ...base.econ,
        growth: 12,
        inflation: 1.5,
      },
    };
    const boomCohorts = calculateDemographicCoalitions(boom, 'D');
    for (const c of boomCohorts) {
      expect(c.supportPct).toBeGreaterThanOrEqual(15);
      expect(c.supportPct).toBeLessThanOrEqual(85);
    }
  });

  it('seniors respond favorably to prescription drug price negotiation and ACA subsidies', () => {
    const base = newGame(42, START);
    const baseSeniors = calculateDemographicCoalitions(base, 'D').find((c) => c.id === 'seniors')!;

    const withDrugReform = {
      ...base,
      socialPolicy: {
        ...base.socialPolicy,
        drg: 100, // full prescription drug price negotiation
        aca: 140, // expanded ACA subsidies
      },
    };
    const reformedSeniors = calculateDemographicCoalitions(withDrugReform, 'D').find((c) => c.id === 'seniors')!;

    expect(reformedSeniors.supportPct).toBeGreaterThan(baseSeniors.supportPct);
    expect(reformedSeniors.topPositiveDriver).toBe('Medicare drug price negotiation');
  });

  it('working class responds to manufacturing growth, fossil leasing, and tariffs', () => {
    const base = newGame(42, START);
    const baseWorking = calculateDemographicCoalitions(base, 'D').find((c) => c.id === 'working_class')!;

    const withGrowthAndLeasing = {
      ...base,
      econ: { ...base.econ, growth: 4.5 },
      socialPolicy: {
        ...base.socialPolicy,
        fos: 120, // expanded federal oil & gas leasing
      },
    };
    const boostedWorking = calculateDemographicCoalitions(withGrowthAndLeasing, 'D').find((c) => c.id === 'working_class')!;
    expect(boostedWorking.supportPct).toBeGreaterThan(baseWorking.supportPct);
    expect(boostedWorking.topPositiveDriver).toBe('Manufacturing employment growth');

    const withCarbonPenalty = {
      ...base,
      policy: { ...base.policy, tar: 45 }, // high tariffs
      socialPolicy: {
        ...base.socialPolicy,
        crb: 80, // aggressive industrial carbon caps
      },
    };
    const penalizedWorking = calculateDemographicCoalitions(withCarbonPenalty, 'D').find((c) => c.id === 'working_class')!;
    expect(penalizedWorking.supportPct).toBeLessThan(baseWorking.supportPct);
    expect(penalizedWorking.topNegativeDriver).toBe('Carbon compliance costs');
  });

  it('young families respond to universal pre-K and Title I school funding', () => {
    const base = newGame(42, START);
    const baseFamilies = calculateDemographicCoalitions(base, 'D').find((c) => c.id === 'young_families')!;

    const withPreK = {
      ...base,
      socialPolicy: {
        ...base.socialPolicy,
        prek: 1, // universal pre-K matching enacted
        k12: 120, // increased Title I funding
      },
    };
    const boostedFamilies = calculateDemographicCoalitions(withPreK, 'D').find((c) => c.id === 'young_families')!;
    expect(boostedFamilies.supportPct).toBeGreaterThan(baseFamilies.supportPct);
    expect(boostedFamilies.topPositiveDriver).toBe('Universal pre-K childcare matching');
  });

  it('college-educated voters respond to student debt relief and clean energy', () => {
    const base = newGame(42, START);
    const baseCollege = calculateDemographicCoalitions(base, 'D').find((c) => c.id === 'college_educated')!;

    const withDebtRelief = {
      ...base,
      socialPolicy: {
        ...base.socialPolicy,
        sdr: 30, // 30% student debt relief
        cln: 140, // clean energy tax credits
      },
    };
    const boostedCollege = calculateDemographicCoalitions(withDebtRelief, 'D').find((c) => c.id === 'college_educated')!;
    expect(boostedCollege.supportPct).toBeGreaterThan(baseCollege.supportPct);
    expect(boostedCollege.topPositiveDriver).toBe('Income-driven student debt relief');
  });

  it('immigrant communities respond to legal status regularization and visas', () => {
    const base = newGame(42, START);
    const baseImm = calculateDemographicCoalitions(base, 'D').find((c) => c.id === 'immigrant')!;

    const withRegularization = {
      ...base,
      socialPolicy: {
        ...base.socialPolicy,
        reg: 1, // legal status regularization enacted
        vis: 120, // expanded work visas
      },
    };
    const boostedImm = calculateDemographicCoalitions(withRegularization, 'D').find((c) => c.id === 'immigrant')!;
    expect(boostedImm.supportPct).toBeGreaterThan(baseImm.supportPct);
    expect(boostedImm.topPositiveDriver).toBe('Worker legal status regularization');
  });

  it('energy & ag workers respond to leasing, tariffs, and carbon standards', () => {
    const base = newGame(42, START);
    const baseEnergyAg = calculateDemographicCoalitions(base, 'D').find((c) => c.id === 'energy_ag')!;

    const withLeasing = {
      ...base,
      socialPolicy: {
        ...base.socialPolicy,
        fos: 140,
      },
    };
    const boostedEnergyAg = calculateDemographicCoalitions(withLeasing, 'D').find((c) => c.id === 'energy_ag')!;
    expect(boostedEnergyAg.supportPct).toBeGreaterThan(baseEnergyAg.supportPct);
    expect(boostedEnergyAg.topPositiveDriver).toBe('Federal energy leasing velocity');

    const withTariffDisruption = {
      ...base,
      policy: {
        ...base.policy,
        tar: 50,
      },
    };
    const penalizedEnergyAg = calculateDemographicCoalitions(withTariffDisruption, 'D').find((c) => c.id === 'energy_ag')!;
    expect(penalizedEnergyAg.supportPct).toBeLessThan(baseEnergyAg.supportPct);
    expect(penalizedEnergyAg.topNegativeDriver).toBe('Retaliatory agricultural export tariffs');
  });
});
