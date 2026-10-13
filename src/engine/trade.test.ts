import { describe, expect, it } from 'vitest';
import {
  calculateRetaliatoryRate,
  calculateTradeBalance,
  defaultTradeState,
  sanitizeTradeState,
  SECTOR_TARIFFS_CATALOG,
  TRADE_AGREEMENTS_CATALOG,
  TRADE_EXPOSED_STATES,
} from './trade';

describe('trade engine (TRADE-01, TRADE-02)', () => {
  it('initializes with default empty trade state', () => {
    const s = defaultTradeState();
    expect(s.sectorTariffs).toEqual([]);
    expect(s.agreements).toEqual([]);
  });

  it('validates catalogs and statutory authorities', () => {
    expect(SECTOR_TARIFFS_CATALOG).toHaveLength(3);
    for (const sector of SECTOR_TARIFFS_CATALOG) {
      expect(sector.ratePct).toBeGreaterThan(0);
      expect(sector.statutoryBasis.length).toBeGreaterThan(5);
      expect(sector.description.length).toBeGreaterThan(10);
    }

    expect(TRADE_AGREEMENTS_CATALOG).toHaveLength(3);
    for (const pact of TRADE_AGREEMENTS_CATALOG) {
      expect(pact.cloutCost).toBeGreaterThanOrEqual(15);
      expect(pact.retaliatoryMitigation).toBeGreaterThan(0);
      expect(pact.statutoryBasis.length).toBeGreaterThan(5);
    }

    expect(TRADE_EXPOSED_STATES.length).toBeGreaterThanOrEqual(10);
  });

  it('calculates zero retaliatory tariffs under baseline tariff and no sector tariffs', () => {
    const rate = calculateRetaliatoryRate(11, [], []);
    expect(rate).toBe(0);
  });

  it('escalates retaliatory foreign tariffs above threshold and with sector tariffs', () => {
    // Tariff at 25% (threshold is 15%, so 10% excess * 0.65 = 6.5%)
    const rate1 = calculateRetaliatoryRate(25, [], []);
    expect(rate1).toBeCloseTo(6.5, 1);

    // Adding strategic chips and clean energy sector tariffs increases pressure
    const rate2 = calculateRetaliatoryRate(25, ['chips', 'cleanEnergy'], []);
    expect(rate2).toBeGreaterThan(rate1);
  });

  it('mitigates foreign retaliation through bilateral trade pacts', () => {
    const rawRate = calculateRetaliatoryRate(30, ['chips'], []);
    const mitigatedRate = calculateRetaliatoryRate(30, ['chips'], ['eu', 'indoPacific']);

    expect(mitigatedRate).toBeLessThan(rawRate);
  });

  it('computes realistic trade balances, customs revenues, and consumer pass-through', () => {
    const balance = calculateTradeBalance(20, {
      sectorTariffs: ['chips', 'minerals'],
      agreements: ['indoPacific'],
    });

    expect(balance.baseExportsBn).toBeGreaterThan(2000);
    expect(balance.baseImportsBn).toBeGreaterThan(2500);
    expect(balance.tradeDeficitBn).toBeGreaterThan(0);
    expect(balance.sectorRevenueBn).toBe(40); // 2 sector tariffs * 20Bn
    expect(balance.pricePassThroughPct).toBeGreaterThan(0);
    expect(balance.exportGrowthDragPct).toBeGreaterThanOrEqual(0);
  });

  it('sanitizes malformed and invalid trade states', () => {
    const sanitized = sanitizeTradeState({
      sectorTariffs: ['chips', 'bogus_sector' as any],
      agreements: ['eu', 'fake_pact' as any],
    });

    expect(sanitized.sectorTariffs).toEqual(['chips']);
    expect(sanitized.agreements).toEqual(['eu']);
  });
});
