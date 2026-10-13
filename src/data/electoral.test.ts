import { describe, expect, it } from 'vitest';
import { DISTRICTS, ELECTORAL_CITATIONS, getStateExposure, getStateLegislature, HOUSE_DELEGATIONS, STATE_EXPOSURES, STATE_LEGISLATURES } from './electoral';

describe('electoral data verification (VOT-06, GR-13, GR-15)', () => {
  it('has citations and retrieval metadata', () => {
    expect(ELECTORAL_CITATIONS.districts).toBeDefined();
    expect(ELECTORAL_CITATIONS.houseDelegations).toBeDefined();
    expect(ELECTORAL_CITATIONS.exposures).toBeDefined();
  });

  it('contains the 5 split congressional districts for Maine and Nebraska', () => {
    const districtIds = ['ME-1', 'ME-2', 'NE-1', 'NE-2', 'NE-3'];
    expect(Object.keys(DISTRICTS).sort()).toEqual(districtIds.sort());

    for (const id of districtIds) {
      const d = DISTRICTS[id]!;
      expect(d.electoralVotes).toBe(1);
      expect(Number.isFinite(d.margin2024)).toBe(true);
      expect(['D', 'R']).toContain(d.winner2024);
      expect(d.source.length).toBeGreaterThan(10);
      expect(d.url.startsWith('https://')).toBe(true);
    }

    // Historical margin check: ME-1 and NE-2 voted Democratic in 2024
    expect(DISTRICTS['ME-1']!.winner2024).toBe('D');
    expect(DISTRICTS['ME-1']!.margin2024).toBeLessThan(0);

    expect(DISTRICTS['NE-2']!.winner2024).toBe('D');
    expect(DISTRICTS['NE-2']!.margin2024).toBeLessThan(0);

    // ME-2, NE-1, NE-3 voted Republican
    expect(DISTRICTS['ME-2']!.winner2024).toBe('R');
    expect(DISTRICTS['ME-2']!.margin2024).toBeGreaterThan(0);

    expect(DISTRICTS['NE-1']!.winner2024).toBe('R');
    expect(DISTRICTS['NE-3']!.winner2024).toBe('R');
  });

  it('contains all 50 states for 119th House delegations summing to 435 seats', () => {
    const states = Object.keys(HOUSE_DELEGATIONS);
    expect(states.length).toBe(50);
    // DC has no voting House seats
    expect(states).not.toContain('DC');

    let totalSeats = 0;
    let totalD = 0;
    let totalR = 0;

    for (const [code, del] of Object.entries(HOUSE_DELEGATIONS)) {
      expect(del.total).toBe(del.democrat + del.republican);
      expect(del.total).toBeGreaterThanOrEqual(1);

      if (del.democrat > del.republican) {
        expect(del.majority, `${code} majority should be D`).toBe('D');
      } else if (del.republican > del.democrat) {
        expect(del.majority, `${code} majority should be R`).toBe('R');
      } else {
        expect(del.majority, `${code} majority should be split`).toBe('split');
      }

      totalSeats += del.total;
      totalD += del.democrat;
      totalR += del.republican;
    }

    expect(totalSeats).toBe(435);
    expect(totalR).toBe(220);
    expect(totalD).toBe(215);
  });

  it('contains valid economic exposures for all 50 states + DC (51 jurisdictions)', () => {
    const codes = Object.keys(STATE_EXPOSURES);
    expect(codes.length).toBe(51);
    expect(codes).toContain('DC');

    for (const [code, exp] of Object.entries(STATE_EXPOSURES)) {
      expect(exp.farm, `${code} farm`).toBeGreaterThanOrEqual(0);
      expect(exp.farm, `${code} farm`).toBeLessThanOrEqual(0.2);

      expect(exp.manufacturing, `${code} manufacturing`).toBeGreaterThanOrEqual(0);
      expect(exp.manufacturing, `${code} manufacturing`).toBeLessThanOrEqual(0.4);

      expect(exp.energy, `${code} energy`).toBeGreaterThanOrEqual(0);
      expect(exp.energy, `${code} energy`).toBeLessThanOrEqual(0.3);
    }

    // Spot-check top industry exposures
    expect(STATE_EXPOSURES['IN']!.manufacturing).toBeGreaterThan(0.2);
    expect(STATE_EXPOSURES['WY']!.energy).toBeGreaterThan(0.15);
    expect(STATE_EXPOSURES['IA']!.farm).toBeGreaterThan(0.05);
  });

  it('contains valid demographic and regional exposures for all 51 jurisdictions and district fallbacks', () => {
    const codes = Object.keys(STATE_EXPOSURES);
    const borderStates = new Set(['TX', 'CA', 'AZ', 'NM']);

    for (const code of codes) {
      const exp = STATE_EXPOSURES[code]!;
      expect(exp.seniorShare, `${code} seniorShare`).toBeGreaterThan(0.05);
      expect(exp.seniorShare, `${code} seniorShare`).toBeLessThan(0.35);

      expect(exp.uninsuredRate, `${code} uninsuredRate`).toBeGreaterThanOrEqual(0.01);
      expect(exp.uninsuredRate, `${code} uninsuredRate`).toBeLessThan(0.25);

      expect(exp.borderState, `${code} borderState`).toBe(borderStates.has(code));

      expect(exp.immigrantLaborShare, `${code} immigrantLaborShare`).toBeGreaterThanOrEqual(0.01);
      expect(exp.immigrantLaborShare, `${code} immigrantLaborShare`).toBeLessThan(0.40);

      expect(exp.cleanEnergyGrowth, `${code} cleanEnergyGrowth`).toBeGreaterThanOrEqual(0.01);
      expect(exp.cleanEnergyGrowth, `${code} cleanEnergyGrowth`).toBeLessThan(0.80);

      expect(exp.carbonIntensity, `${code} carbonIntensity`).toBeGreaterThanOrEqual(0.1);
      expect(exp.carbonIntensity, `${code} carbonIntensity`).toBeLessThan(3.0);

      expect(exp.childPovertyRate, `${code} childPovertyRate`).toBeGreaterThan(0.05);
      expect(exp.childPovertyRate, `${code} childPovertyRate`).toBeLessThan(0.35);

      expect(exp.studentDebtShare, `${code} studentDebtShare`).toBeGreaterThan(0.10);
      expect(exp.studentDebtShare, `${code} studentDebtShare`).toBeLessThan(0.35);

      expect(exp.youngFamilyShare, `${code} youngFamilyShare`).toBeGreaterThan(0.05);
      expect(exp.youngFamilyShare, `${code} youngFamilyShare`).toBeLessThan(0.20);

      expect(exp.rpp, `${code} rpp`).toBeGreaterThan(80);
      expect(exp.rpp, `${code} rpp`).toBeLessThan(125);
    }

    // Spot-check empirical anchors
    expect(STATE_EXPOSURES['FL']!.seniorShare).toBeGreaterThan(0.20);
    expect(STATE_EXPOSURES['TX']!.uninsuredRate).toBeGreaterThan(0.15);
    expect(STATE_EXPOSURES['CA']!.immigrantLaborShare).toBeGreaterThan(0.25);
    expect(STATE_EXPOSURES['IA']!.cleanEnergyGrowth).toBeGreaterThan(0.50);
    expect(STATE_EXPOSURES['WV']!.carbonIntensity).toBeGreaterThan(1.5);
    expect(STATE_EXPOSURES['MS']!.childPovertyRate).toBeGreaterThan(0.25);
    expect(STATE_EXPOSURES['CA']!.rpp).toBeGreaterThan(110);
    expect(STATE_EXPOSURES['MS']!.rpp).toBeLessThan(90);

    // Verify district fallbacks
    const districtCodes = ['ME-1', 'ME-2', 'NE-1', 'NE-2', 'NE-3'];
    for (const dId of districtCodes) {
      const exp = getStateExposure(dId);
      expect(exp).toBeDefined();
      expect(Number.isFinite(exp!.seniorShare)).toBe(true);
      expect(Number.isFinite(exp!.rpp)).toBe(true);
      expect(exp!.rpp).toBeGreaterThan(80);
    }
  });

  it('contains state legislature control for all 50 states (28 R, 20 D, 2 split)', () => {
    const states = Object.keys(STATE_LEGISLATURES);
    expect(states.length).toBe(50);
    expect(states).not.toContain('DC');

    let countR = 0;
    let countD = 0;
    let countSplit = 0;

    for (const [code, leg] of Object.entries(STATE_LEGISLATURES)) {
      expect(leg.state).toBe(code);
      expect(['D', 'R', 'split']).toContain(leg.chamberMajority);
      expect(['D', 'R', 'split']).toContain(leg.senateMajority);
      expect(['D', 'R', 'split']).toContain(leg.control);

      if (leg.control === 'R') countR++;
      else if (leg.control === 'D') countD++;
      else countSplit++;
    }

    expect(countR).toBe(28);
    expect(countD).toBe(20);
    expect(countSplit).toBe(2);

    expect(getStateLegislature('TX')!.control).toBe('R');
    expect(getStateLegislature('CA')!.control).toBe('D');
    expect(getStateLegislature('PA')!.control).toBe('split');
    expect(getStateLegislature('AK')!.control).toBe('split');
  });
});
