import { C } from '../engine/coefficients';
import type { Start } from '../engine/game';
import raw from '../../data/us-2026.json';
import type { Sourced, USData } from './schema';

export const us = raw as unknown as USData;

/** Read a sourced number; a missing value is a data bug, so fail loudly. */
function num(field: string, s: Sourced): number {
  if (typeof s?.value !== 'number' || !Number.isFinite(s.value)) throw new Error(`data/us-2026.json: ${field} has no value`);
  return s.value;
}

/** Map the sourced data file onto the engine's starting values. */
export function fromData(d: USData): Start {
  const e = d.economy, f = d.fiscal;
  const gdp = num('economy.gdpNominal', e.gdpNominal);
  return {
    gdp,
    potential: C.potentialGrowth,
    unemployment: num('economy.unemployment', e.unemployment),
    empPop: num('economy.employmentPopRatio', e.employmentPopRatio),
    inflation: num('economy.cpiInflation', e.cpiInflation),
    fedRate: num('economy.fedFundsUpper', e.fedFundsUpper),
    medianIncome: num('economy.medianHouseholdIncome', e.medianHouseholdIncome),
    gini: num('economy.gini', e.gini),
    lifeExp: num('economy.lifeExpectancy', e.lifeExpectancy),
    debtPct: num('fiscal.debtHeldByPublicPctGdp', f.debtHeldByPublicPctGdp),
    deficitPct: (num('fiscal.deficit', f.deficit) / gdp) * 100,
    tariff: num('taxes.effectiveTariffRate', d.taxes.effectiveTariffRate),
    trust: num('society.trustInGovernment', d.society.trustInGovernment),
    crime: num('society.violentCrimeRate', d.society.violentCrimeRate),
  };
}
