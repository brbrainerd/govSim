import { describe, expect, it } from 'vitest';
import { DISTRICTS, ELECTORAL_CITATIONS, HOUSE_DELEGATIONS, STATE_EXPOSURES } from './electoral';

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
});
