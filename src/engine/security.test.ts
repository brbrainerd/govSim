import { describe, expect, it } from 'vitest';
import { C } from './coefficients';
import { CRISIS_CATALOG } from './crises';
import { createGeopoliticalActiveCrisis, type ActiveCrisis } from './director';
import { START } from './fixture';
import { calculateSecurityBreakdown, calculateSecurityIndex } from './security';

const dummyEcon = {
  gap: 0,
  growth: 2.1,
  unemployment: 4.1,
  empPop: 60.2,
  inflation: 2.0,
  expected: 2.0,
  fedRate: 4.5,
  gdp: 28.5,
  debt: 34.0,
  realIncome: 75000,
  gini: 0.48,
  lifeExp: 78.5,
  trust: 25,
  crime: START.crime,
};

describe('Security Index Calculation (SEC-01)', () => {
  it('evaluates to exactly neutral 50.0 at baseline game start', () => {
    const startEcon = { ...dummyEcon, crime: START.crime };
    const breakdown = calculateSecurityBreakdown({
      econ: startEcon,
      start: START,
    });

    expect(breakdown.baseline).toBe(50.0);
    expect(breakdown.defense).toBe(0);
    expect(breakdown.alliances).toBe(0);
    expect(breakdown.crises).toBe(0);
    expect(breakdown.sanctions).toBe(0);
    expect(breakdown.domestic).toBe(0);
    expect(breakdown.total).toBe(50.0);
  });

  it('boosts security on forward surge and reduces on peacetime drawdown', () => {
    const surgeIndex = calculateSecurityIndex({
      econ: dummyEcon,
      start: START,
      foreignPolicy: {
        defensePosture: 'surge',
        foreignAssistance: 100,
        activeSanctions: [],
      },
    });
    expect(surgeIndex).toBe(50.0 + C.securityDefenseSurgeBonus);

    const peaceIndex = calculateSecurityIndex({
      econ: dummyEcon,
      start: START,
      foreignPolicy: {
        defensePosture: 'peacetime',
        foreignAssistance: 100,
        activeSanctions: [],
      },
    });
    expect(peaceIndex).toBe(50.0 - C.securityDefensePeacetimePenalty);
  });

  it('accounts for foreign assistance alliance strength', () => {
    const highAid = calculateSecurityIndex({
      econ: dummyEcon,
      start: START,
      foreignPolicy: {
        defensePosture: 'standard',
        foreignAssistance: 200,
        activeSanctions: [],
      },
    });
    expect(highAid).toBe(50.0 + 100 * C.securityForeignAidScale);

    const zeroAid = calculateSecurityIndex({
      econ: dummyEcon,
      start: START,
      foreignPolicy: {
        defensePosture: 'standard',
        foreignAssistance: 0,
        activeSanctions: [],
      },
    });
    expect(zeroAid).toBe(50.0 - 100 * C.securityForeignAidScale);
  });

  it('penalizes uncontained international crises', () => {
    const def = CRISIS_CATALOG.find((c) => c.id === 'oil_embargo')!;
    const dummyCrisis = createGeopoliticalActiveCrisis(def, 2);

    const crisisBreakdown = calculateSecurityBreakdown({
      econ: dummyEcon,
      start: START,
      activeGeopoliticalCrises: [dummyCrisis],
    });

    expect(crisisBreakdown.crises).toBe(-C.securityActiveCrisisPenalty);
    expect(crisisBreakdown.total).toBe(50.0 - C.securityActiveCrisisPenalty);
  });

  it('credits deterrence sanctions and domestic crime improvements', () => {
    const lowCrimeEcon = { ...dummyEcon, crime: START.crime * 0.8 }; // 20% lower crime
    const deterrenceIndex = calculateSecurityIndex({
      econ: lowCrimeEcon,
      start: START,
      foreignPolicy: {
        defensePosture: 'standard',
        foreignAssistance: 100,
        activeSanctions: ['asset_freeze', 'export_controls'],
      },
    });

    const expectedSanctions = 2 * C.securitySanctionBonus;
    const expectedDomestic = 0.2 * C.securityCrimeScale;
    expect(deterrenceIndex).toBeCloseTo(50.0 + expectedSanctions + expectedDomestic, 4);
  });

  it('clamps security index strictly within [0, 100]', () => {
    const def = CRISIS_CATALOG.find((c) => c.id === 'oil_embargo')!;
    const extremeLow = calculateSecurityIndex({
      econ: { ...dummyEcon, crime: START.crime * 5 },
      start: START,
      foreignPolicy: {
        defensePosture: 'peacetime',
        foreignAssistance: 0,
        activeSanctions: [],
      },
      activeGeopoliticalCrises: [
        createGeopoliticalActiveCrisis(def, 1),
        createGeopoliticalActiveCrisis(def, 2),
        createGeopoliticalActiveCrisis(def, 3),
        createGeopoliticalActiveCrisis(def, 4),
      ],
    });
    expect(extremeLow).toBe(0);

    const extremeHigh = calculateSecurityIndex({
      econ: { ...dummyEcon, crime: 0 },
      start: START,
      foreignPolicy: {
        defensePosture: 'surge',
        foreignAssistance: 200,
        activeSanctions: ['asset_freeze', 'export_controls', 'energy_embargo'],
      },
    });
    expect(extremeHigh).toBeLessThanOrEqual(100);
  });
});
