// Pure, deterministic trade & tariffs engine (Phase 16, TRADE-01, TRADE-02, TRADE-03).
// Pure arithmetic, zero bare literals outside exempt files, strictly deterministic.

import {
  SECTOR_TARIFFS_CATALOG,
  TRADE_AGREEMENTS_CATALOG,
  TRADE_EXPOSED_STATES,
  type SectorTariffDef,
  type SectorTariffId,
  type TradeAgreementDef,
  type TradeAgreementId,
} from '../data/trade';
import { C } from './coefficients';
import {
  DEFAULT_GDP_ESTIMATE,
  DEFAULT_TARIFF_RATE,
  EXPORT_GDP_SHARE,
  IMPORT_GDP_SHARE,
  PERCENT,
  QUARTERS_PER_YEAR,
  ROUND_HUNDREDTHS,
  ROUND_TENTHS,
  TARIFF_IMPORT_ELASTICITY,
} from './units';

export {
  SECTOR_TARIFFS_CATALOG,
  TRADE_AGREEMENTS_CATALOG,
  TRADE_EXPOSED_STATES,
  type SectorTariffDef,
  type SectorTariffId,
  type TradeAgreementDef,
  type TradeAgreementId,
};

export interface TradeState {
  readonly sectorTariffs: readonly SectorTariffId[];
  readonly agreements: readonly TradeAgreementId[];
}

export function defaultTradeState(): TradeState {
  return {
    sectorTariffs: [],
    agreements: [],
  };
}

/**
 * Calculates effective foreign retaliatory tariff rate (TRADE-02).
 * Increases when baseline tariff exceeds threshold and with active sector tariffs;
 * mitigated by active bilateral trade agreements.
 */
export function calculateRetaliatoryRate(
  tariffRate: number,
  sectorTariffs: readonly SectorTariffId[] = [],
  agreements: readonly TradeAgreementId[] = [],
): number {
  const excessTariff = Math.max(0, tariffRate - C.retaliatoryTariffThreshold);
  let sectorPressure = 0;
  for (const stId of sectorTariffs) {
    const def = SECTOR_TARIFFS_CATALOG.find((s) => s.id === stId);
    if (def) sectorPressure += def.retaliatoryWeight;
  }

  const rawRetaliation = (excessTariff + sectorPressure) * C.retaliatoryTariffScale;

  let mitigation = 0;
  for (const agId of agreements) {
    const def = TRADE_AGREEMENTS_CATALOG.find((a) => a.id === agId);
    if (def) mitigation += def.retaliatoryMitigation;
  }

  return Math.max(0, Math.round((rawRetaliation - mitigation) * ROUND_TENTHS) / ROUND_TENTHS);
}

export interface TradeBalanceSummary {
  readonly baseExportsBn: number;
  readonly baseImportsBn: number;
  readonly netExportsBn: number;
  readonly tradeDeficitBn: number;
  readonly retaliatoryRatePct: number;
  readonly sectorRevenueBn: number;
  readonly pricePassThroughPct: number;
  readonly exportGrowthDragPct: number;
  readonly agExportDropPct: number;
}

/**
 * Computes national trade balances, revenues, and macro price/growth impacts (TRADE-03).
 */
export function calculateTradeBalance(
  tariffRate: number,
  tradeState: TradeState = defaultTradeState(),
  gdp: number = DEFAULT_GDP_ESTIMATE,
): TradeBalanceSummary {
  const retaliatoryRatePct = calculateRetaliatoryRate(tariffRate, tradeState.sectorTariffs, tradeState.agreements);

  // Baseline US exports ~11% GDP, imports ~14% GDP
  const nominalExports = gdp * EXPORT_GDP_SHARE;
  const nominalImports = gdp * IMPORT_GDP_SHARE;

  // Sector tariff revenue
  const sectorRevenueBn = tradeState.sectorTariffs.length * C.sectorTariffRevenue;

  // Price pass-through to consumer price index (general tariff + sector tariffs)
  const pricePassThroughPct =
    C.tariffPass * Math.max(0, tariffRate - C.retaliatoryTariffThreshold) +
    tradeState.sectorTariffs.length * C.sectorTariffPricePassThrough;

  // Macro export drag and farm drop
  const exportGrowthDragPct = retaliatoryRatePct * C.retaliatoryExportDrag;
  const agExportDropPct = retaliatoryRatePct * C.retaliatoryAgDrop;

  // Adjusted exports after agreement boost and retaliatory contraction
  let agreementExportBoost = 0;
  for (const _ of tradeState.agreements) {
    agreementExportBoost += C.tradeAgreementExportBoost;
  }
  const effectiveExports = nominalExports * (1 + (agreementExportBoost - exportGrowthDragPct) / PERCENT);
  const effectiveImports = Math.max(0, nominalImports * (1 - tariffRate * TARIFF_IMPORT_ELASTICITY));

  const netExportsBn = Math.round((effectiveExports - effectiveImports) * ROUND_TENTHS) / ROUND_TENTHS;
  const tradeDeficitBn = Math.max(0, -netExportsBn);

  return {
    baseExportsBn: Math.round(effectiveExports * ROUND_TENTHS) / ROUND_TENTHS,
    baseImportsBn: Math.round(effectiveImports * ROUND_TENTHS) / ROUND_TENTHS,
    netExportsBn,
    tradeDeficitBn,
    retaliatoryRatePct,
    sectorRevenueBn,
    pricePassThroughPct: Math.round(pricePassThroughPct * ROUND_HUNDREDTHS) / ROUND_HUNDREDTHS,
    exportGrowthDragPct: Math.round(exportGrowthDragPct * ROUND_HUNDREDTHS) / ROUND_HUNDREDTHS,
    agExportDropPct: Math.round(agExportDropPct * ROUND_TENTHS) / ROUND_TENTHS,
  };
}

/** Validates and sanitizes a raw trade state. */
export function sanitizeTradeState(raw: unknown): TradeState {
  if (!raw || typeof raw !== 'object') return defaultTradeState();
  const r = raw as Partial<TradeState>;
  const validSectorIds = new Set(SECTOR_TARIFFS_CATALOG.map((s) => s.id));
  const validAgreementIds = new Set(TRADE_AGREEMENTS_CATALOG.map((a) => a.id));

  const sectorTariffs = Array.isArray(r.sectorTariffs)
    ? (r.sectorTariffs.filter((id): id is SectorTariffId => validSectorIds.has(id as SectorTariffId)) as SectorTariffId[])
    : [];
  const agreements = Array.isArray(r.agreements)
    ? (r.agreements.filter((id): id is TradeAgreementId => validAgreementIds.has(id as TradeAgreementId)) as TradeAgreementId[])
    : [];

  return {
    sectorTariffs,
    agreements,
  };
}

export interface TradeDraft {
  readonly sectorTariffs?: readonly SectorTariffId[];
  readonly agreements?: readonly TradeAgreementId[];
}

export interface TradeResult {
  readonly sectorTariffs: readonly SectorTariffId[];
  readonly agreements: readonly TradeAgreementId[];
  readonly quarterlyDeficitDeltaBn: number; // customs revenues reduce deficit (negative deltaBn)
  readonly quarterlyInflationDelta: number; // added to inflation this quarter
  readonly retaliatoryExportDrag: number; // quarterly growth drag (positive number, subtracted from growth)
  readonly tradeAgreementExportBoost: number; // quarterly growth boost (positive number, added to growth)
  readonly retaliatoryRate: number;
  readonly cloutSpent: number;
}

/**
 * Pure resolution of player trade choices (TRADE-01, TRADE-02).
 * Enforces clout costs on new bilateral agreements, calculates customs revenues,
 * price pass-through, and reciprocal foreign retaliation.
 */
export function resolveTrade(
  current: TradeState,
  draft?: TradeDraft,
  availableClout: number = 0,
  tariffRate: number = DEFAULT_TARIFF_RATE,
): TradeResult {
  const sanitized = sanitizeTradeState(draft);
  const requestedSectors = sanitized.sectorTariffs ?? current.sectorTariffs;
  const requestedAgreements = sanitized.agreements ?? current.agreements;

  // New trade agreements require clout
  const currentAgreements = new Set(current.agreements);
  const newlyEnacted = requestedAgreements.filter((a) => !currentAgreements.has(a));
  let totalCloutCost = 0;
  for (const a of newlyEnacted) {
    const def = TRADE_AGREEMENTS_CATALOG.find((p) => p.id === a);
    if (def) totalCloutCost += def.cloutCost;
  }

  let agreements = requestedAgreements;
  let cloutSpent = 0;
  if (totalCloutCost <= availableClout) {
    cloutSpent = totalCloutCost;
  } else {
    agreements = current.agreements;
  }

  const sectorTariffs = requestedSectors;

  // 1. Customs revenues: each active sector tariff generates C.sectorTariffRevenue ($B/yr)
  const annualSectorRevenueBn = sectorTariffs.length * C.sectorTariffRevenue;
  // Revenue reduces deficit, so delta is negative
  const quarterlyDeficitDeltaBn = -annualSectorRevenueBn / QUARTERS_PER_YEAR;

  // 2. Inflation impact: price pass-through from sector tariffs
  const quarterlyInflationDelta = sectorTariffs.length * C.sectorTariffPricePassThrough;

  // 3. Retaliatory foreign tariffs and growth drag
  const retaliatoryRate = calculateRetaliatoryRate(tariffRate, sectorTariffs, agreements);
  const retaliatoryExportDrag = retaliatoryRate * C.retaliatoryExportDrag;

  // 4. Trade agreement export boost
  let tradeAgreementExportBoost = 0;
  for (const _ of agreements) {
    tradeAgreementExportBoost += C.tradeAgreementExportBoost;
  }

  return {
    sectorTariffs,
    agreements,
    quarterlyDeficitDeltaBn,
    quarterlyInflationDelta,
    retaliatoryExportDrag,
    tradeAgreementExportBoost,
    retaliatoryRate,
    cloutSpent,
  };
}
