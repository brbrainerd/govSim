// Pure household budget impact engine and persona catalog (HOU-01, HOU-02).
// Calculates monthly dollar impacts across 7 kitchen-table categories.

import { getStateExposure } from '../data/electoral';
import { taxLevers, type BudgetDraft } from './budget';
import { C } from './coefficients';
import { round } from './detmath';
import type { GameState } from './game';
import { getSocialLever, type SocialDraft } from './social';
import {
  BASKET_SCALE_CHILD,
  BASKET_SCALE_COUPLE,
  BASKET_SCALE_SENIOR,
  BASKET_SCALE_SINGLE,
  DEFAULT_CARBON_INTENSITY,
  DEFAULT_CLEAN_ENERGY_GROWTH,
  DEFAULT_RPP_FACTOR,
  ESSENTIALS_BASKET_BASE,
  INCOME_TIER_HIGH,
  INCOME_TIER_LOW,
  INCOME_TIER_MEDIAN,
  INCOME_TIER_SERVICE,
  INCOME_TIER_UPPER_MIDDLE,
  LOW_INCOME_BASKET_SHARE_BOOST,
  MONTHS_PER_YEAR,
  PAYROLL_TAX_CAP,
  PERCENT,
  RPP_BASE_INDEX,
  SOCIAL_INDEX_STEP,
  SOCIAL_INDEX_STEP_FINE,
  SOCIAL_PERCENT_STEP,
} from './units';

export type HouseholdComposition = 'single' | 'couple' | 'young_family' | 'senior';
export type HouseholdSector = 'manufacturing' | 'service' | 'tech' | 'fixed';

export interface HouseholdPersona {
  readonly id: string;
  readonly name: string;
  readonly locationState: string;
  readonly annualIncome: number;
  readonly composition: HouseholdComposition;
  readonly youngChildrenCount: number; // under 6 (pre-K eligible)
  readonly schoolChildrenCount: number; // K-12 (school grants eligible)
  readonly hasStudentDebt: boolean;
  readonly usesAcaMarketplace: boolean;
  readonly sector: HouseholdSector;
  readonly description: string;
}

export interface HouseholdImpactBreakdown {
  readonly wagesDelta: number; // $/mo (+ is higher wages)
  readonly groceriesDelta: number; // $/mo (+ is higher expense)
  readonly energyDelta: number; // $/mo (+ is higher utility bills)
  readonly healthcareDelta: number; // $/mo (- is savings / relief, + is higher cost)
  readonly childcareDelta: number; // $/mo (+ is childcare / school savings)
  readonly studentLoansDelta: number; // $/mo (+ is loan payment savings)
  readonly taxesDelta: number; // $/mo (+ is higher tax liability)
  readonly netMonthlyDelta: number; // $/mo total cashflow impact (+ is positive for family)
}

export const HOUSEHOLD_PRESETS: readonly HouseholdPersona[] = [
  {
    id: 'rust_belt_manufacturing',
    name: 'Rust Belt Manufacturing Family',
    locationState: 'OH',
    annualIncome: INCOME_TIER_MEDIAN,
    composition: 'young_family',
    youngChildrenCount: 1,
    schoolChildrenCount: 1,
    hasStudentDebt: false,
    usesAcaMarketplace: false,
    sector: 'manufacturing',
    description: 'Ohio dual-earner factory household sensitive to energy utility rates, tariffs, and family tax credits.',
  },
  {
    id: 'sun_belt_retiree',
    name: 'Sun Belt Retiree',
    locationState: 'FL',
    annualIncome: INCOME_TIER_LOW,
    composition: 'senior',
    youngChildrenCount: 0,
    schoolChildrenCount: 0,
    hasStudentDebt: false,
    usesAcaMarketplace: false,
    sector: 'fixed',
    description: 'Florida senior living on Social Security and Medicare, highly sensitive to prescription drug costs and grocery inflation.',
  },
  {
    id: 'suburban_educator_couple',
    name: 'Suburban Educator Couple',
    locationState: 'NC',
    annualIncome: INCOME_TIER_UPPER_MIDDLE,
    composition: 'young_family',
    youngChildrenCount: 1,
    schoolChildrenCount: 0,
    hasStudentDebt: true,
    usesAcaMarketplace: false,
    sector: 'tech',
    description: 'North Carolina couple juggling day-care costs and student loan repayments while navigating income tax brackets.',
  },
  {
    id: 'urban_service_worker',
    name: 'Urban Service Worker Family',
    locationState: 'NV',
    annualIncome: INCOME_TIER_SERVICE,
    composition: 'young_family',
    youngChildrenCount: 0,
    schoolChildrenCount: 1,
    hasStudentDebt: false,
    usesAcaMarketplace: true,
    sector: 'service',
    description: 'Nevada single parent in hospitality purchasing marketplace health coverage and stretched by grocery prices.',
  },
];

export const DEFAULT_HOUSEHOLD_PERSONA: HouseholdPersona = HOUSEHOLD_PRESETS[0]!;

export function getHouseholdPreset(id: string): HouseholdPersona | undefined {
  return HOUSEHOLD_PRESETS.find((p) => p.id === id);
}

export function createCustomHousehold(config: {
  readonly name?: string;
  readonly locationState: string;
  readonly annualIncome: number;
  readonly composition: HouseholdComposition;
  readonly youngChildrenCount?: number;
  readonly schoolChildrenCount?: number;
  readonly hasStudentDebt?: boolean;
  readonly usesAcaMarketplace?: boolean;
  readonly sector?: HouseholdSector;
  readonly description?: string;
}): HouseholdPersona {
  return {
    id: 'custom',
    name: config.name ?? 'Custom Household',
    locationState: config.locationState,
    annualIncome: config.annualIncome,
    composition: config.composition,
    youngChildrenCount: config.youngChildrenCount ?? (config.composition === 'young_family' ? 1 : 0),
    schoolChildrenCount: config.schoolChildrenCount ?? 0,
    hasStudentDebt: config.hasStudentDebt ?? false,
    usesAcaMarketplace: config.usesAcaMarketplace ?? false,
    sector: config.sector ?? (config.composition === 'senior' ? 'fixed' : 'service'),
    description: config.description ?? `Custom household in ${config.locationState} with \$${config.annualIncome.toLocaleString()} annual income.`,
  };
}

const startIncomeTaxBase = taxLevers.find((l) => l.id === 'inc')!.base;
const startPayrollTaxBase = taxLevers.find((l) => l.id === 'pay')!.base;
const startTariffBase = taxLevers.find((l) => l.id === 'tar')!.base;

/**
 * Pure calculation of the net monthly financial impact ($/month)
 * on a specific household persona from enacted state and active draft policies.
 */
export function calculateHouseholdImpact(
  persona: HouseholdPersona,
  macroState: GameState,
  draftBudget?: BudgetDraft,
  draftSocial?: SocialDraft
): HouseholdImpactBreakdown {
  const exp = getStateExposure(persona.locationState);
  const rppFactor = exp ? (exp.rpp ?? RPP_BASE_INDEX) / RPP_BASE_INDEX : DEFAULT_RPP_FACTOR;
  const carbonIntensity = exp?.carbonIntensity ?? DEFAULT_CARBON_INTENSITY;
  const cleanEnergyGrowth = exp?.cleanEnergyGrowth ?? DEFAULT_CLEAN_ENERGY_GROWTH;

  // 1. Wages Delta ($/mo)
  let wagesDelta = 0;
  if (persona.sector !== 'fixed' && macroState.start.medianIncome > 0) {
    const monthlyWage = persona.annualIncome / MONTHS_PER_YEAR;
    const realIncomeMultiple = macroState.econ.realIncome / macroState.start.medianIncome;
    const realWageGrowth = (realIncomeMultiple - 1.0) * C.householdWageGrowthFactor;
    wagesDelta = round(monthlyWage * realWageGrowth);
  }

  // 2. Groceries & Essentials Delta ($/mo)
  let baseBasket = ESSENTIALS_BASKET_BASE;
  if (persona.annualIncome <= INCOME_TIER_LOW) {
    baseBasket = baseBasket * (1.0 + LOW_INCOME_BASKET_SHARE_BOOST);
  }
  baseBasket = baseBasket * rppFactor;

  let compScale = BASKET_SCALE_COUPLE;
  if (persona.composition === 'single') {
    compScale = BASKET_SCALE_SINGLE;
  } else if (persona.composition === 'senior') {
    compScale = BASKET_SCALE_SENIOR;
  } else if (persona.composition === 'young_family') {
    compScale = BASKET_SCALE_COUPLE + BASKET_SCALE_CHILD * (persona.youngChildrenCount + persona.schoolChildrenCount);
  }
  const scaledBasket = baseBasket * compScale;

  const inflationDev = (macroState.econ.inflation - macroState.start.inflation) / PERCENT;
  const inflationCost = scaledBasket * inflationDev;

  const effectiveTariff = draftBudget?.tar !== undefined ? draftBudget.tar : (macroState.policy.tar ?? startTariffBase);
  const tariffDev = effectiveTariff - startTariffBase;
  const tariffCost = tariffDev * C.householdTariffPassthrough;
  const groceriesDelta = round(inflationCost + tariffCost);

  // Helper for social policy deviations
  const getSocialDev = (id: string): number => {
    const lever = getSocialLever(id);
    if (!lever) return 0;
    const val = draftSocial?.[id] ?? macroState.socialPolicy?.[id] ?? lever.base;
    return val - lever.base;
  };

  // 3. Energy Utilities Delta ($/mo)
  const crbDev = getSocialDev('crb') / SOCIAL_PERCENT_STEP;
  const crbCost = crbDev * C.householdCarbonUtilityRate * carbonIntensity;

  const clnDev = getSocialDev('cln') / SOCIAL_INDEX_STEP;
  const clnSavings = clnDev * C.householdCleanEnergyUtilitySavings * cleanEnergyGrowth;

  const fosDev = getSocialDev('fos') / SOCIAL_INDEX_STEP;
  const fosSavings = fosDev * C.householdFossilPermittingSavings;
  const energyDelta = round(crbCost - clnSavings - fosSavings);

  // 4. Healthcare Costs Delta ($/mo, negative is savings)
  let acaSavings = 0;
  if (persona.usesAcaMarketplace) {
    const acaDev = getSocialDev('aca') / SOCIAL_INDEX_STEP_FINE;
    acaSavings = acaDev * C.householdAcaSubsidyRelief;
  }

  let drugSavings = 0;
  if (persona.composition === 'senior') {
    const drgDev = getSocialDev('drg') / SOCIAL_PERCENT_STEP;
    drugSavings = drgDev * C.householdDrugPriceSeniorSavings;
  }

  let pubSavings = 0;
  if (persona.usesAcaMarketplace) {
    const pubDev = getSocialDev('pub');
    pubSavings = pubDev * C.householdPublicOptionRelief;
  }
  const healthcareDelta = round(-(acaSavings + drugSavings + pubSavings));

  // 5. Childcare & Education Savings Delta ($/mo, positive is savings)
  let prekSavings = 0;
  if (persona.youngChildrenCount > 0) {
    const prekDev = getSocialDev('prek');
    prekSavings = prekDev * C.householdUniversalPreKRelief * persona.youngChildrenCount;
  }

  let k12Savings = 0;
  if (persona.schoolChildrenCount > 0) {
    const k12Dev = getSocialDev('k12') / SOCIAL_INDEX_STEP_FINE;
    k12Savings = k12Dev * C.householdTitleIEducationRelief * persona.schoolChildrenCount;
  }
  const childcareDelta = round(prekSavings + k12Savings);

  // 6. Student Loans Repayment Delta ($/mo, positive is savings)
  let studentLoansDelta = 0;
  if (persona.hasStudentDebt) {
    const sdrDev = getSocialDev('sdr') / SOCIAL_PERCENT_STEP;
    studentLoansDelta = round(sdrDev * C.householdStudentDebtRelief);
  }

  // 7. Taxes Delta ($/mo, positive is higher taxes)
  const effectiveIncRate = draftBudget?.inc !== undefined ? draftBudget.inc : (macroState.policy.inc ?? startIncomeTaxBase);
  const incDev = effectiveIncRate - startIncomeTaxBase;

  const effectivePayRate = draftBudget?.pay !== undefined ? draftBudget.pay : (macroState.policy.pay ?? startPayrollTaxBase);
  const payDev = effectivePayRate - startPayrollTaxBase;

  let progressivity = C.householdTaxProgressivityMedian;
  if (persona.annualIncome <= INCOME_TIER_LOW) {
    progressivity = C.householdTaxProgressivityLow;
  } else if (persona.annualIncome <= INCOME_TIER_MEDIAN) {
    progressivity = C.householdTaxProgressivityMedian;
  } else if (persona.annualIncome <= INCOME_TIER_UPPER_MIDDLE) {
    progressivity = C.householdTaxProgressivityUpper;
  } else {
    progressivity = C.householdTaxProgressivityHigh;
  }

  const monthlyWage = persona.annualIncome / MONTHS_PER_YEAR;
  const incomeTaxImpact = monthlyWage * (incDev / PERCENT) * progressivity;

  const monthlyPayrollCap = PAYROLL_TAX_CAP / MONTHS_PER_YEAR;
  const subjectPayrollWage = monthlyWage > monthlyPayrollCap ? monthlyPayrollCap : monthlyWage;
  const payrollTaxImpact = persona.composition === 'senior' ? 0 : subjectPayrollWage * (payDev / PERCENT);
  const taxesDelta = round(incomeTaxImpact + payrollTaxImpact);

  // Net Monthly Cashflow Delta ($/mo)
  const netMonthlyDelta =
    wagesDelta -
    groceriesDelta -
    energyDelta -
    healthcareDelta +
    childcareDelta +
    studentLoansDelta -
    taxesDelta;

  return {
    wagesDelta,
    groceriesDelta,
    energyDelta,
    healthcareDelta,
    childcareDelta,
    studentLoansDelta,
    taxesDelta,
    netMonthlyDelta,
  };
}
