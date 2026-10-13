// Pure, deterministic trade & tariffs engine (Phase 16, TRADE-01, TRADE-02, TRADE-03).
// Pure arithmetic, zero bare literals outside exempt files, strictly deterministic.

import { C } from './coefficients';
import { clamp } from './detmath';

export type SectorTariffId = 'chips' | 'minerals' | 'cleanEnergy';
export type TradeAgreementId = 'eu' | 'indoPacific' | 'americas';

export interface SectorTariffDef {
  readonly id: SectorTariffId;
  readonly name: string;
  readonly ratePct: number;
  readonly statutoryBasis: string;
  readonly description: string;
  readonly domesticBenefit: string;
  readonly consumerImpact: string;
  readonly retaliatoryWeight: number;
}

export interface TradeAgreementDef {
  readonly id: TradeAgreementId;
  readonly name: string;
  readonly partnerBloc: string;
  readonly cloutCost: number;
  readonly statutoryBasis: string;
  readonly description: string;
  readonly economicBenefit: string;
  readonly retaliatoryMitigation: number;
}

export const SECTOR_TARIFFS_CATALOG: readonly SectorTariffDef[] = [
  {
    id: 'chips',
    name: 'Advanced Semiconductors & Microelectronics',
    ratePct: 25,
    statutoryBasis: 'Section 301, Trade Act of 1974',
    description: 'Targeted 25% tariff on foreign semiconductor components and microelectronics.',
    domesticBenefit: 'Incentivizes domestic fabrication capacity and protects semiconductor IP.',
    consumerImpact: 'Increases commercial electronics and automotive input component costs.',
    retaliatoryWeight: 1.5,
  },
  {
    id: 'minerals',
    name: 'Critical Minerals & Rare Earth Elements',
    ratePct: 15,
    statutoryBasis: 'Section 232, Trade Expansion Act of 1962 (National Defense)',
    description: '15% tariff on unrefined and processed foreign critical rare earth minerals.',
    domesticBenefit: 'Reduces strategic defense dependency on adversarial supply monopolies.',
    consumerImpact: 'Raises battery, defense procurement, and magnet assembly costs.',
    retaliatoryWeight: 1.0,
  },
  {
    id: 'cleanEnergy',
    name: 'Clean Energy Hardware & Electric Vehicles',
    ratePct: 25,
    statutoryBasis: 'Section 301, Trade Act of 1974',
    description: '25% tariff on imported foreign photovoltaic panels, battery cells, and electric vehicles.',
    domesticBenefit: 'Shields domestic clean technology factories from state-subsidized foreign dumping.',
    consumerImpact: 'Increases consumer purchase prices for solar installations and electric cars.',
    retaliatoryWeight: 1.5,
  },
] as const;

export const TRADE_AGREEMENTS_CATALOG: readonly TradeAgreementDef[] = [
  {
    id: 'eu',
    name: 'Transatlantic Trade & Tech Accord',
    partnerBloc: 'European Union (27 nations)',
    cloutCost: 25,
    statutoryBasis: 'Bilateral Executive Trade Agreement (Trade Act of 1974)',
    description: 'Comprehensive regulatory alignment and tariff elimination on industrial and tech goods.',
    economicBenefit: 'Expands US aerospace, pharmaceutical, and technology export markets.',
    retaliatoryMitigation: 4.0,
  },
  {
    id: 'indoPacific',
    name: 'Indo-Pacific Supply Chain Partnership',
    partnerBloc: 'Japan, South Korea, Australia, ASEAN',
    cloutCost: 20,
    statutoryBasis: 'Bilateral Framework Executive Agreement',
    description: 'Nearshore supply chain security treaty with preferred customs clearance.',
    economicBenefit: 'Secures semiconductor inputs and unlocks agricultural export markets.',
    retaliatoryMitigation: 3.5,
  },
  {
    id: 'americas',
    name: 'Western Hemisphere Nearshoring Pact',
    partnerBloc: 'USMCA+, Latin American Economic Forum',
    cloutCost: 15,
    statutoryBasis: 'Regional Trade Protocol',
    description: 'Duty-free nearshoring corridors for manufacturing and agricultural trade.',
    economicBenefit: 'Lowers food and raw materials import costs; boosts machinery exports.',
    retaliatoryMitigation: 2.5,
  },
] as const;

/** High trade-exposure states vulnerable to agricultural and manufacturing retaliatory tariffs (TRADE-02). */
export const TRADE_EXPOSED_STATES = [
  { state: 'IA', sector: 'agriculture', sharePct: 28, label: 'Iowa (Soybeans & Corn)' },
  { state: 'IL', sector: 'agriculture', sharePct: 24, label: 'Illinois (Grain & Ag Machinery)' },
  { state: 'NE', sector: 'agriculture', sharePct: 26, label: 'Nebraska (Beef & Feed)' },
  { state: 'KS', sector: 'agriculture', sharePct: 22, label: 'Kansas (Wheat & Sorghum)' },
  { state: 'MN', sector: 'agriculture', sharePct: 19, label: 'Minnesota (Pork & Ag)' },
  { state: 'MI', sector: 'manufacturing', sharePct: 25, label: 'Michigan (Automotive & Parts)' },
  { state: 'OH', sector: 'manufacturing', sharePct: 21, label: 'Ohio (Machinery & Steel)' },
  { state: 'PA', sector: 'manufacturing', sharePct: 18, label: 'Pennsylvania (Industrial Equipment)' },
  { state: 'WI', sector: 'manufacturing', sharePct: 20, label: 'Wisconsin (Engines & Dairy)' },
  { state: 'IN', sector: 'manufacturing', sharePct: 23, label: 'Indiana (Transportation & Auto)' },
] as const;

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

  return Math.max(0, Math.round((rawRetaliation - mitigation) * 10) / 10);
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
  gdp: number = 28000,
): TradeBalanceSummary {
  const retaliatoryRatePct = calculateRetaliatoryRate(tariffRate, tradeState.sectorTariffs, tradeState.agreements);

  // Baseline US exports ~11% GDP, imports ~14% GDP
  const nominalExports = gdp * 0.11;
  const nominalImports = gdp * 0.14;

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
  const effectiveExports = nominalExports * (1 + (agreementExportBoost - exportGrowthDragPct) / 100);
  const effectiveImports = Math.max(0, nominalImports * (1 - tariffRate * 0.005));

  const netExportsBn = Math.round((effectiveExports - effectiveImports) * 10) / 10;
  const tradeDeficitBn = Math.max(0, -netExportsBn);

  return {
    baseExportsBn: Math.round(effectiveExports * 10) / 10,
    baseImportsBn: Math.round(effectiveImports * 10) / 10,
    netExportsBn,
    tradeDeficitBn,
    retaliatoryRatePct,
    sectorRevenueBn,
    pricePassThroughPct: Math.round(pricePassThroughPct * 100) / 100,
    exportGrowthDragPct: Math.round(exportGrowthDragPct * 100) / 100,
    agExportDropPct: Math.round(agExportDropPct * 10) / 10,
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
