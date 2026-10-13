import { describe, expect, it } from 'vitest';
import { EVIL_LEVERS_CATALOG, getEvilLever, isEvilLeverId } from './evil';
import { EVIL_LEVER_IDS } from '../engine/units';

describe('EVIL_LEVERS_CATALOG (LEVER-01, LEVER-02, LEVER-03)', () => {
  it('contains exactly the 6 defined corrupt executive levers', () => {
    expect(EVIL_LEVERS_CATALOG).toHaveLength(6);
    const ids = EVIL_LEVERS_CATALOG.map((l) => l.id);
    expect(ids).toEqual(expect.arrayContaining([...EVIL_LEVER_IDS]));
  });

  it('guarantees unique IDs and valid categories', () => {
    const ids = new Set(EVIL_LEVERS_CATALOG.map((l) => l.id));
    expect(ids.size).toBe(EVIL_LEVERS_CATALOG.length);

    for (const lever of EVIL_LEVERS_CATALOG) {
      expect(['siphon', 'suppression']).toContain(lever.category);
      expect(lever.name.length).toBeGreaterThan(0);
      expect(lever.shortTitle.length).toBeGreaterThan(0);
      expect(lever.description.length).toBeGreaterThan(0);
      expect(lever.flavorQuote.length).toBeGreaterThan(0);
      expect(lever.cloutCost).toBeGreaterThan(0);
      expect(lever.trustPenalty).toBeGreaterThan(0);
      expect(lever.approvalPenalty).toBeGreaterThan(0);
    }
  });

  it('verifies siphoning levers have positive kickback and positive heat', () => {
    const siphons = EVIL_LEVERS_CATALOG.filter((l) => l.category === 'siphon');
    expect(siphons).toHaveLength(4);
    for (const s of siphons) {
      expect(s.kickbackBn).toBeGreaterThan(0);
      expect(s.heatDelta).toBeGreaterThan(0);
    }
  });

  it('verifies suppression levers have zero kickback and negative heat delta', () => {
    const suppressions = EVIL_LEVERS_CATALOG.filter((l) => l.category === 'suppression');
    expect(suppressions).toHaveLength(2);
    for (const sup of suppressions) {
      expect(sup.kickbackBn).toBe(0);
      expect(sup.heatDelta).toBeLessThan(0);
    }
  });

  it('provides working getEvilLever and isEvilLeverId helpers', () => {
    expect(isEvilLeverId('crony_contracts')).toBe(true);
    expect(isEvilLeverId('fire_inspectors_general')).toBe(true);
    expect(isEvilLeverId('legalize_everything')).toBe(false);

    const crony = getEvilLever('crony_contracts');
    expect(crony).toBeDefined();
    expect(crony?.name).toBe('No-Bid Crony Procurement Contracts');

    const nonExistent = getEvilLever('unknown_lever');
    expect(nonExistent).toBeUndefined();
  });
});
