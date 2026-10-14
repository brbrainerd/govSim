// Model inspector catalog & introspection helper (FND-07, MODEL-01, MODEL-02).
// Exposes simulation coefficients, bounds, equations, and citations for transparency.

import {
  COEFF,
  LIMITS,
  SCORE,
  RULES,
  type Basis,
  type Source,
} from '../engine/coefficients';
import { taxLevers, spendLevers, type Lever } from '../engine/budget';

export type ModelDomainId = 'all' | 'macro' | 'fiscal' | 'social' | 'foreign' | 'scoring' | 'evil';

export interface ModelDomain {
  id: ModelDomainId;
  label: string;
  description: string;
}

export const MODEL_DOMAINS: readonly ModelDomain[] = [
  { id: 'all', label: 'All Parameters', description: 'Complete catalog of simulation coefficients, bounds, and score weights.' },
  { id: 'macro', label: 'Macro & Fed', description: 'Growth, unemployment (Okun), inflation (Phillips), and Federal Reserve Taylor rule.' },
  { id: 'fiscal', label: 'Fiscal & Debt', description: 'Fiscal impulse multipliers, sovereign debt feedback, bond premiums, and budget levers.' },
  { id: 'social', label: 'Social & Health', description: 'Healthcare access, life expectancy, inequality (Gini), education, and crime trends.' },
  { id: 'foreign', label: 'Foreign & Trade', description: 'Tariffs, trade pacts, geopolitical chokepoints, foreign assistance, and national security.' },
  { id: 'scoring', label: 'Scoring & Rules', description: 'Prosperity index weights, presidential approval mechanics, clout rules, and elections.' },
  { id: 'evil', label: 'Evil Governance', description: 'Crony contracts, public land auctions, watchdog purges, and impeachment backlash.' },
] as const;

export interface ModelEquation {
  id: string;
  title: string;
  subtitle: string;
  formula: string;
  explanation: string;
  primaryDomain: Exclude<ModelDomainId, 'all'>;
  sources?: readonly Source[];
}

export const MODEL_EQUATIONS: readonly ModelEquation[] = [
  {
    id: 'output-gap',
    title: 'Output Gap & Fiscal Impulse',
    subtitle: 'Quarterly macroeconomic momentum',
    formula: 'gap_t = gapPersistence × gap_{t-1} + fiscalMultiplier × Δdeficit/GDP - rateDrag × (realRate - neutralReal)',
    explanation: 'Unused economic capacity drifts back toward normal. Federal deficits give a quick boost, while high interest rates cool down demand.',
    primaryDomain: 'macro',
  },
  {
    id: 'okun-law',
    title: "Okun's Law (Jobs)",
    subtitle: 'Relationship between output and unemployment',
    formula: 'Δunemployment = -okun × Δgap',
    explanation: 'When economic output falls below potential, unemployment rises. In this model, every 1% output shortfall adds 0.5 points of unemployment.',
    primaryDomain: 'macro',
    sources: [
      {
        text: "Ball, Leigh, Loungani, Okun's Law: Fit at 50? (NBER WP 18668)",
        url: 'https://www.nber.org/system/files/working_papers/w18668/w18668.pdf',
      },
    ],
  },
  {
    id: 'phillips-curve',
    title: 'Phillips Curve (Inflation)',
    subtitle: 'Price pressures and expectation anchoring',
    formula: 'inflation = expectations + phillips × gap + tariffPass × Δtariff',
    explanation: 'Inflation responds slowly to economic tightness and tariff jumps, anchored by long-term public expectations.',
    primaryDomain: 'macro',
    sources: [
      {
        text: 'Hazell, Herreno, Nakamura, Steinsson, The Slope of the Phillips Curve (NBER WP 28005)',
        url: 'https://nber.org/papers/w28005',
      },
    ],
  },
  {
    id: 'taylor-rule',
    title: 'Taylor Rule (Fed Policy Rate)',
    subtitle: 'Independent central bank reaction function',
    formula: 'targetRate = neutralReal + infl + taylorInfl × (infl - 2.0) + taylorGap × gap',
    explanation: 'The Federal Reserve adjusts interest rates in quarter-point steps to keep inflation at 2% while steadying employment.',
    primaryDomain: 'macro',
    sources: [
      {
        text: 'Taylor (1993), Discretion versus Policy Rules in Practice (equation 1)',
        url: 'https://web.stanford.edu/~johntayl/Onlinepaperscombinedbyyear/1993/Discretion_versus_Policy_Rules_in_Practice.pdf',
      },
      {
        text: 'FOMC Statement on Longer-Run Goals and Monetary Policy Strategy',
        url: 'https://www.federalreserve.gov/monetarypolicy/files/FOMC_LongerRunGoals.pdf',
      },
    ],
  },
  {
    id: 'debt-interest',
    title: 'Debt & Sovereign Borrowing Cost',
    subtitle: 'Crowding out and financial risk',
    formula: 'borrowCost = baseRate + termPremium × (debtPct - startDebtPct) + stressPremium × stressUnits',
    explanation: 'Higher sovereign debt crowds out private capital. Above 130% of GDP, bond markets demand steep crisis premiums.',
    primaryDomain: 'fiscal',
  },
  {
    id: 'prosperity-index',
    title: 'Prosperity Index & 10-Yr Legacy',
    subtitle: 'Multi-dimensional evaluation of presidential performance',
    formula: 'Score = 0.5 × Score_{termEnd} + 0.5 × Score_{10yrLegacy}',
    explanation: 'Your presidential legacy balances terminal welfare with long-term fiscal solvency across eight equalized social and economic pillars.',
    primaryDomain: 'scoring',
  },
] as const;

export interface InspectorEntry {
  id: string;
  table: 'COEFF' | 'SCORE' | 'LIMITS' | 'RULES' | 'BUDGET';
  domain: Exclude<ModelDomainId, 'all'>;
  label: string;
  valueDisplay: string;
  rangeDisplay: string;
  unit: string;
  basis: Basis;
  note: string;
  sources?: readonly Source[];
  rawLo?: number;
  rawHi?: number;
  rawValue?: number;
}

const DOMAIN_MAP: Record<string, Exclude<ModelDomainId, 'all'>> = {
  // LIMITS
  unemployment: 'macro',
  inflation: 'macro',
  fedRate: 'macro',
  gini: 'social',
  approval: 'scoring',
  income: 'macro',
  trust: 'social',
  score: 'scoring',
  heat: 'evil',

  // RULES
  startApproval: 'scoring',
  startClout: 'scoring',
  voteReward: 'scoring',
  refundDivisor: 'scoring',
  approvalStep: 'scoring',

  // COEFF - Macro
  potentialGrowth: 'macro',
  gapPersistence: 'macro',
  rateDrag: 'macro',
  neutralReal: 'macro',
  okun: 'macro',
  empPerU: 'macro',
  phillips: 'macro',
  expectPull: 'macro',
  expectAdapt: 'macro',
  taylorInfl: 'macro',
  taylorGap: 'macro',
  fedSmooth: 'macro',
  potentialMax: 'macro',
  shockGap: 'macro',
  shockInfl: 'macro',
  inflTarget: 'macro',
  fedStep: 'macro',
  fedPassThrough: 'macro',
  incomeGrowthShare: 'macro',
  oilReserveRelief: 'macro',
  oilNeglectSpike: 'macro',
  unrestNeglectGrowthHit: 'macro',
  disasterPotentialBoost: 'macro',
  marketPanicTariffDrag: 'macro',
  fedPressureCredibilityHit: 'macro',
  fedRatePressureRelief: 'macro',
  speechBusinessGapBoost: 'macro',
  fedPressureLingeringTurns: 'macro',
  fedChairHawkInflationCut: 'macro',
  fedChairDoveGapBoost: 'macro',
  fossilPermittingEnergyRelief: 'macro',

  // COEFF - Fiscal
  fiscalMultiplier: 'fiscal',
  crowdOut: 'fiscal',
  crisisAt: 'fiscal',
  termPremium: 'fiscal',
  debtStressGap: 'fiscal',
  debtStressUnit: 'fiscal',
  stressPremium: 'fiscal',
  disasterAidSpend: 'fiscal',
  disasterReconSpend: 'fiscal',
  oilTransitSpend: 'fiscal',
  debtStressThreshold: 'fiscal',
  debtLimitRiskThreshold: 'fiscal',
  fossilPermittingRevenue: 'fiscal',
  amendmentBalancedBudgetBondYieldReduction: 'fiscal',
  householdTaxProgressivityLow: 'fiscal',
  householdTaxProgressivityMedian: 'fiscal',
  householdTaxProgressivityUpper: 'fiscal',
  householdTaxProgressivityHigh: 'fiscal',

  // COEFF - Social
  lifeTrend: 'social',
  lifeSpending: 'social',
  lifeAdjust: 'social',
  giniIncomeTax: 'social',
  giniMedicaid: 'social',
  giniAdjust: 'social',
  crimeJobs: 'social',
  crimeTrend: 'social',
  trustAdjust: 'social',
  trustApproval: 'social',
  disasterNeglectTrustHit: 'social',
  epidemicMobilizeSpend: 'social',
  epidemicTargetedSpend: 'social',
  epidemicNeglectLifeHit: 'social',
  scotusSwiftTrustGain: 'social',
  scotusDelayTrustHit: 'social',
  unrestPackageSpend: 'social',
  unrestSurgeTrustHit: 'social',
  unrestGiniThreshold: 'social',
  courtUpholdLow: 'social',
  courtUpholdModerate: 'social',
  courtUpholdHigh: 'social',
  courtReviewDelayTurns: 'social',
  voterAcaSensitivity: 'social',
  voterDrugPriceSensitivity: 'social',
  voterPublicOptionSensitivity: 'social',
  voterBorderSecuritySensitivity: 'social',
  voterVisaLaborSensitivity: 'social',
  voterRegularizationSensitivity: 'social',
  voterCleanEnergySensitivity: 'social',
  voterFossilPermittingSensitivity: 'social',
  voterCarbonStandardPenalty: 'social',
  voterTitleIEducationSensitivity: 'social',
  voterStudentDebtSensitivity: 'social',
  voterUniversalPreKSensitivity: 'social',
  voterFamilyReliefElasticity: 'social',
  acaSubsidyDeficit: 'social',
  acaCoverageGain: 'social',
  drugNegotiationSavings: 'social',
  drugFamilySavings: 'social',
  publicOptionDeficit: 'social',
  publicOptionPremiumRelief: 'social',
  borderSecurityCost: 'social',
  visaLaborExpansion: 'social',
  visaPotentialGrowth: 'social',
  regularizationWageGain: 'social',
  regularizationPayrollBoost: 'social',
  cleanEnergyCreditCost: 'social',
  carbonStandardCost: 'social',
  titleIFundingCost: 'social',
  titleIProductivityGain: 'social',
  studentDebtReliefCost: 'social',
  studentDebtMonthlyRelief: 'social',
  universalPreKCost: 'social',
  universalPreKEmpPop: 'social',
  acaFamilyRelief: 'social',
  visaDeficitSavings: 'social',
  visaFamilyBenefit: 'social',
  regularizationFamilyRelief: 'social',
  cleanEnergyFamilyRelief: 'social',
  fossilPermittingFamilyRelief: 'social',
  titleIFamilyRelief: 'social',
  universalPreKFamilyRelief: 'social',
  filibusterTalkingApprovalSlope: 'social',
  filibusterTalkingMinThreshold: 'social',
  filibusterNuclearTrustPenalty: 'social',
  filibusterNuclearApprovalPenalty: 'social',
  filibusterFiftyFiveTrustPenalty: 'social',
  filibusterTalkingTrustPenalty: 'social',
  courtTermLimitChallengeRisk: 'social',
  courtEthicsTrustGain: 'social',
  courtExpansionTrustPenalty: 'social',
  courtJusticeUpholdSlope: 'social',
  rcvTurnoutBonus: 'social',
  rcvCentristBonus: 'social',
  rcvTrustGain: 'social',
  independentRedistrictingCompetitiveDistricts: 'social',
  smallDollarMatchingTurnoutBonus: 'social',
  smallDollarMatchingTrustGain: 'social',
  amendmentJudicialTrustGain: 'social',
  amendmentCampaignFinanceTrustGain: 'social',
  amendmentEraGrowthBonus: 'social',
  amendmentEraGiniReduction: 'social',
  amendmentEraTrustGain: 'social',
  householdWageGrowthFactor: 'social',
  householdCarbonUtilityRate: 'social',
  householdCleanEnergyUtilitySavings: 'social',
  householdFossilPermittingSavings: 'social',
  householdAcaSubsidyRelief: 'social',
  householdDrugPriceSeniorSavings: 'social',
  householdPublicOptionRelief: 'social',
  householdUniversalPreKRelief: 'social',
  householdTitleIEducationRelief: 'social',
  householdStudentDebtRelief: 'social',
  securityCrimeScale: 'social',

  // COEFF - Foreign
  tariffPass: 'foreign',
  voterFarmTariffSensitivity: 'foreign',
  crisisCloutDiplomatic: 'foreign',
  crisisCloutMilitary: 'foreign',
  oilEmbargoInflation: 'foreign',
  oilEmbargoSprRelief: 'foreign',
  straitBlockadeExportHit: 'foreign',
  straitEscortCostBn: 'foreign',
  debtContagionGdpHit: 'foreign',
  debtContagionBailoutBn: 'foreign',
  borderClashDefenseSpendBn: 'foreign',
  borderClashDiplomaticRally: 'foreign',
  geopoliticalEscalationPenalty: 'foreign',
  geopoliticalEscalationTrust: 'foreign',
  defenseSurgeCostBn: 'foreign',
  defensePeacetimeSavingsBn: 'foreign',
  foreignAssistancePerPoint: 'foreign',
  sanctionAssetFreezeInflation: 'foreign',
  sanctionAssetFreezeOutput: 'foreign',
  sanctionExportControlsInflation: 'foreign',
  sanctionExportControlsOutput: 'foreign',
  sanctionEnergyEmbargoInflation: 'foreign',
  sanctionEnergyEmbargoOutput: 'foreign',
  sanctionCloutCost: 'foreign',
  securityBaseline: 'foreign',
  securityDefenseSurgeBonus: 'foreign',
  securityDefensePeacetimePenalty: 'foreign',
  securityForeignAidScale: 'foreign',
  securityActiveCrisisPenalty: 'foreign',
  securitySanctionBonus: 'foreign',
  geopoliticalEnergyInflation: 'foreign',
  geopoliticalShippingInflation: 'foreign',
  geopoliticalSupplyOutputDrag: 'foreign',
  sectorTariffRevenue: 'foreign',
  sectorTariffPricePassThrough: 'foreign',
  tradeAgreementExportBoost: 'foreign',
  retaliatoryTariffThreshold: 'foreign',
  retaliatoryTariffScale: 'foreign',
  retaliatoryExportDrag: 'foreign',
  retaliatoryAgDrop: 'foreign',
  retaliatoryVoterSwing: 'foreign',
  retaliatoryAgWeight: 'foreign',
  retaliatoryMfgWeight: 'foreign',
  householdTariffPassthrough: 'foreign',

  // COEFF - Scoring
  approvalPull: 'scoring',
  honeymoon: 'scoring',
  shockApproval: 'scoring',
  honeymoonQuarters: 'scoring',
  approvalNeutral: 'scoring',
  approvalJobs: 'scoring',
  approvalPrices: 'scoring',
  approvalPriceFloor: 'scoring',
  approvalGrowth: 'scoring',
  cloutPerApproval: 'scoring',
  crisisCloutLow: 'scoring',
  crisisCloutMedium: 'scoring',
  crisisCloutHigh: 'scoring',
  crisisMinPerTerm: 'scoring',
  crisisMaxPerTerm: 'scoring',
  crisisFirstTurnMin: 'scoring',
  crisisFirstTurnMax: 'scoring',
  crisisCooldown: 'scoring',
  disasterRallyApproval: 'scoring',
  disasterRallyDuration: 'scoring',
  disasterNeglectApprovalHit: 'scoring',
  scotusBoldApprovalRally: 'scoring',
  unrestApprovalThreshold: 'scoring',
  crisisPoolSize: 'scoring',
  deadlineWarningTurns: 'scoring',
  cloutCap: 'scoring',
  speechBaseCost: 'scoring',
  speechApprovalBoost: 'scoring',
  mythRewardClout: 'scoring',
  explainerRewardClout: 'scoring',
  speechDiminishingFactor: 'scoring',
  courtStrikeCloutPenalty: 'scoring',
  fedPressureCost: 'scoring',
  voterApprovalElasticity: 'scoring',
  voterMfgGrowthSensitivity: 'scoring',
  voterEnergyInflationSensitivity: 'scoring',
  voterStateVolatility: 'scoring',
  midtermHistoricalPenalty: 'scoring',
  midtermApprovalSlope: 'scoring',
  midtermMaxHouseLoss: 'scoring',
  midtermMaxHouseGain: 'scoring',
  midtermMaxSenateLoss: 'scoring',
  midtermMaxSenateGain: 'scoring',
  projectionZScore: 'scoring',
  projectionVolatilityQuarterly: 'scoring',
  swingThreshold: 'scoring',
  tossupThreshold: 'scoring',
  likelyThreshold: 'scoring',
  safeThreshold: 'scoring',
  filibusterNuclearCloutCost: 'scoring',
  filibusterFiftyFiveCloutCost: 'scoring',
  filibusterTalkingCloutCost: 'scoring',
  smallDollarMatchingApprovalGain: 'scoring',
  amendmentProposalCloutCost: 'scoring',
  amendmentCampaignCloutCost: 'scoring',

  // COEFF - Evil
  heatDecayQuarterly: 'evil',
  heatApprovalPenalty: 'evil',
  heatTrustPenalty: 'evil',
  heatCongressionalFriction: 'evil',
  heatSenateFriction: 'evil',
  evilCronyKickbackBn: 'evil',
  evilCronyHeatDelta: 'evil',
  evilCronyCloutCost: 'evil',
  evilCronyTrustCost: 'evil',
  evilCronyApprovalCost: 'evil',
  evilCronyBudgetCostBn: 'evil',
  evilLandKickbackBn: 'evil',
  evilLandHeatDelta: 'evil',
  evilLandCloutCost: 'evil',
  evilLandTrustCost: 'evil',
  evilLandApprovalCost: 'evil',
  evilTariffKickbackBn: 'evil',
  evilTariffHeatDelta: 'evil',
  evilTariffCloutCost: 'evil',
  evilTariffTrustCost: 'evil',
  evilTariffApprovalCost: 'evil',
  evilLibraryKickbackBn: 'evil',
  evilLibraryHeatDelta: 'evil',
  evilLibraryCloutCost: 'evil',
  evilLibraryTrustCost: 'evil',
  evilLibraryApprovalCost: 'evil',
  evilFireIgHeatSuppression: 'evil',
  evilFireIgCloutCost: 'evil',
  evilFireIgTrustCost: 'evil',
  evilFireIgApprovalCost: 'evil',
  evilDojHeatSuppression: 'evil',
  evilDojCloutCost: 'evil',
  evilDojTrustCost: 'evil',
  evilDojApprovalCost: 'evil',
  specialCounselCloutDrain: 'evil',
  subpoenaCloutDrain: 'evil',
  impeachmentHouseHeatSlope: 'evil',
  impeachmentHouseApprovalSlope: 'evil',
  convictionSenateHeatSlope: 'evil',
  convictionSenateApprovalSlope: 'evil',
};

function formatLabel(id: string): string {
  // Convert camelCase to title words
  const spaced = id.replace(/([A-Z])/g, ' $1').replace(/([0-9]+)/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function buildCoeffEntry(
  id: string,
  coeff: { value: number; unit: string; basis: Basis; range: readonly [number, number]; note: string; sources?: readonly Source[] },
  table: 'COEFF' | 'SCORE' | 'RULES',
): InspectorEntry {
  const domain = table === 'SCORE' ? 'scoring' : (DOMAIN_MAP[id] ?? 'macro');
  return {
    id,
    table,
    domain,
    label: formatLabel(id),
    valueDisplay: `${coeff.value}`,
    rangeDisplay: `[${coeff.range[0]}, ${coeff.range[1]}]`,
    unit: coeff.unit,
    basis: coeff.basis,
    note: coeff.note,
    sources: coeff.sources,
    rawLo: coeff.range[0],
    rawHi: coeff.range[1],
    rawValue: coeff.value,
  };
}

function buildLimitEntry(
  id: string,
  limit: { bounds: readonly [number, number]; unit: string; basis: Basis; note: string; sources?: readonly Source[] },
): InspectorEntry {
  const domain = DOMAIN_MAP[id] ?? 'macro';
  return {
    id,
    table: 'LIMITS',
    domain,
    label: formatLabel(id),
    valueDisplay: `[${limit.bounds[0]}, ${limit.bounds[1]}]`,
    rangeDisplay: `[${limit.bounds[0]}, ${limit.bounds[1]}]`,
    unit: limit.unit,
    basis: limit.basis,
    note: limit.note,
    sources: limit.sources,
    rawLo: limit.bounds[0],
    rawHi: limit.bounds[1],
  };
}

function buildLeverEntry(lever: Lever, type: 'tax' | 'spend'): InspectorEntry {
  return {
    id: `budget_${lever.id}`,
    table: 'BUDGET',
    domain: 'fiscal',
    label: `${lever.label} (${type === 'tax' ? 'Tax' : 'Spending'})`,
    valueDisplay: `${lever.base}`,
    rangeDisplay: `[${lever.min}, ${lever.max}]`,
    unit: type === 'tax' ? '% statutory rate' : '% baseline spend',
    basis: lever.basis,
    note: `${lever.note} (10-yr deficit impact: $${lever.deficitBn}bn, family impact: $${lever.family}/mo).`,
    rawLo: lever.min,
    rawHi: lever.max,
    rawValue: lever.base,
  };
}

let cachedEntries: InspectorEntry[] | null = null;

function getAllEntries(): InspectorEntry[] {
  if (cachedEntries) return cachedEntries;

  const entries: InspectorEntry[] = [];

  // 1. COEFF
  for (const [id, coeff] of Object.entries(COEFF)) {
    entries.push(buildCoeffEntry(id, coeff, 'COEFF'));
  }

  // 2. SCORE
  for (const [id, coeff] of Object.entries(SCORE)) {
    entries.push(buildCoeffEntry(id, coeff, 'SCORE'));
  }

  // 3. LIMITS
  for (const [id, limit] of Object.entries(LIMITS)) {
    entries.push(buildLimitEntry(id, limit));
  }

  // 4. RULES
  for (const [id, coeff] of Object.entries(RULES)) {
    entries.push(buildCoeffEntry(id, coeff, 'RULES'));
  }

  // 5. BUDGET LEVERS
  for (const lever of taxLevers) {
    entries.push(buildLeverEntry(lever, 'tax'));
  }
  for (const lever of spendLevers) {
    entries.push(buildLeverEntry(lever, 'spend'));
  }

  cachedEntries = entries;
  return entries;
}

export function getInspectorEntries(domain?: ModelDomainId, query?: string): InspectorEntry[] {
  let list = getAllEntries();

  if (domain && domain !== 'all') {
    list = list.filter((e) => e.domain === domain);
  }

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter((e) =>
      e.id.toLowerCase().includes(q) ||
      e.label.toLowerCase().includes(q) ||
      e.note.toLowerCase().includes(q) ||
      e.unit.toLowerCase().includes(q) ||
      e.table.toLowerCase().includes(q) ||
      (e.sources && e.sources.some((s) => s.text.toLowerCase().includes(q) || s.url.toLowerCase().includes(q))),
    );
  }

  return list;
}

export function getInspectorSummary(): {
  totalParameters: number;
  totalCitations: number;
  totalJudgement: number;
  domains: Record<ModelDomainId, number>;
} {
  const all = getAllEntries();
  const domains: Record<ModelDomainId, number> = {
    all: all.length,
    macro: 0,
    fiscal: 0,
    social: 0,
    foreign: 0,
    scoring: 0,
    evil: 0,
  };

  let totalCitations = 0;
  let totalJudgement = 0;

  for (const entry of all) {
    domains[entry.domain] = (domains[entry.domain] || 0) + 1;
    if (entry.basis === 'citation') {
      totalCitations += 1;
    } else {
      totalJudgement += 1;
    }
  }

  return {
    totalParameters: all.length,
    totalCitations,
    totalJudgement,
    domains,
  };
}
