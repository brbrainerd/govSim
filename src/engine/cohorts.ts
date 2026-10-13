// Pure, deterministic model of the 6 national demographic cohorts (SOC-05).
// No UI imports. Neutral: uses player side ('D' | 'R') and player-relative metrics.
// Every constant comes from coefficients.ts or units.ts (exempt from literal scan).

import { C, RULES } from './coefficients';
import { clamp, round } from './detmath';
import type { GameState } from './game';
import { isSocialBaseline, socialDev } from './social';
import {
  BASE_PERCENT,
  COLLEGE_COHORT_SHARE,
  ENERGY_AG_COHORT_SHARE,
  HALF_DIVISOR,
  IMMIGRANT_COHORT_SHARE,
  MAX_SUPPORT_PCT,
  MIN_SUPPORT_PCT,
  SENIOR_COHORT_SHARE,
  SOCIAL_MAX_DEV,
  SOCIAL_NARROW_MAX_DEV,
  SOCIAL_PERCENT_MAX,
  WORKING_CLASS_COHORT_SHARE,
  YOUNG_FAMILY_COHORT_SHARE,
} from './units';

export type CohortId =
  | 'seniors'
  | 'working_class'
  | 'young_families'
  | 'college_educated'
  | 'immigrant'
  | 'energy_ag';

export interface DemographicCohort {
  readonly id: CohortId;
  readonly name: string;
  readonly sharePct: number; // Share of national electorate (0..100)
  readonly supportPct: number; // Current support percentage (15..85)
  readonly supportDelta: number; // Change from baseline support
  readonly topPositiveDriver?: string;
  readonly topNegativeDriver?: string;
}

export interface CohortMeta {
  readonly id: CohortId;
  readonly name: string;
  readonly sharePct: number;
  readonly description: string;
}

export const COHORTS_CATALOG: readonly CohortMeta[] = [
  {
    id: 'seniors',
    name: 'Seniors (65+)',
    sharePct: SENIOR_COHORT_SHARE,
    description: 'Older voters on fixed incomes; highly sensitive to Medicare drug pricing, healthcare costs, and inflation.',
  },
  {
    id: 'working_class',
    name: 'Working-Class & Industrial Workers',
    sharePct: WORKING_CLASS_COHORT_SHARE,
    description: 'Manufacturing, logistics, and industrial labor; sensitive to job growth, energy costs, and tariff disruptions.',
  },
  {
    id: 'young_families',
    name: 'Young Families & Parents',
    sharePct: YOUNG_FAMILY_COHORT_SHARE,
    description: 'Households with young children; sensitive to childcare, universal pre-K, public education, and consumer prices.',
  },
  {
    id: 'college_educated',
    name: 'College-Educated & Young Professionals',
    sharePct: COLLEGE_COHORT_SHARE,
    description: 'Knowledge economy workers; sensitive to student loan relief, clean energy transitions, and skilled visas.',
  },
  {
    id: 'immigrant',
    name: 'Immigrant & Border Communities',
    sharePct: IMMIGRANT_COHORT_SHARE,
    description: 'Foreign-born workforce and multi-generational communities; sensitive to legal regularization and visa access.',
  },
  {
    id: 'energy_ag',
    name: 'Energy & Agriculture Workers',
    sharePct: ENERGY_AG_COHORT_SHARE,
    description: 'Fossil fuel producers, clean energy workers, and farmers; sensitive to federal leasing, carbon caps, and retaliatory tariffs.',
  },
];

/**
 * Pure calculation of the 6 national demographic cohorts and their current standing (SOC-05).
 */
export function calculateDemographicCoalitions(
  state: GameState,
  side: 'D' | 'R'
): readonly DemographicCohort[] {
  const approvalDelta = state.approval - RULES.startApproval.value;
  const natBaseSupport = clamp(
    BASE_PERCENT + (approvalDelta * C.voterApprovalElasticity) / HALF_DIVISOR,
    MIN_SUPPORT_PCT,
    MAX_SUPPORT_PCT
  );

  const tariffDev = (state.policy.tar ?? state.start.tariff) - state.start.tariff;
  const growthDev = state.econ.growth - state.start.potential;
  const inflDev = state.econ.inflation - state.start.inflation;
  const draft = state.socialPolicy;
  const hasSocial = draft && !isSocialBaseline(draft);

  return COHORTS_CATALOG.map((meta) => {
    let delta = 0;
    let positiveDriver: string | undefined = undefined;
    let negativeDriver: string | undefined = undefined;

    switch (meta.id) {
      case 'seniors': {
        const drug = hasSocial
          ? (socialDev(draft, 'drg') / SOCIAL_PERCENT_MAX) * C.voterDrugPriceSensitivity * HALF_DIVISOR
          : 0;
        const aca = hasSocial
          ? (socialDev(draft, 'aca') / SOCIAL_MAX_DEV) * C.voterAcaSensitivity
          : 0;
        const infl = -inflDev * C.voterEnergyInflationSensitivity;
        delta = drug + aca + infl;
        if (drug > 0) positiveDriver = 'Medicare drug price negotiation';
        else if (aca > 0) positiveDriver = 'Expanded healthcare subsidies';
        if (infl < 0) negativeDriver = 'High consumer price inflation';
        break;
      }

      case 'working_class': {
        const mfg = growthDev * C.voterMfgGrowthSensitivity;
        const fos = hasSocial
          ? (socialDev(draft, 'fos') / SOCIAL_MAX_DEV) * C.voterFossilPermittingSensitivity
          : 0;
        const crb = hasSocial
          ? -(socialDev(draft, 'crb') / SOCIAL_PERCENT_MAX) * C.voterCarbonStandardPenalty
          : 0;
        const tar = -tariffDev * C.voterFarmTariffSensitivity;
        delta = mfg + fos + crb + tar;
        if (mfg > 0) positiveDriver = 'Manufacturing employment growth';
        else if (fos > 0) positiveDriver = 'Federal energy leasing expansion';
        if (crb < 0) negativeDriver = 'Carbon compliance costs';
        else if (tar < 0) negativeDriver = 'Trade and tariff disruption';
        break;
      }

      case 'young_families': {
        const prek = hasSocial
          ? socialDev(draft, 'prek') * C.voterUniversalPreKSensitivity * HALF_DIVISOR
          : 0;
        const k12 = hasSocial
          ? (socialDev(draft, 'k12') / SOCIAL_NARROW_MAX_DEV) * C.voterTitleIEducationSensitivity
          : 0;
        const infl = -inflDev * C.voterEnergyInflationSensitivity * HALF_DIVISOR;
        delta = prek + k12 + infl;
        if (prek > 0) positiveDriver = 'Universal pre-K childcare matching';
        else if (k12 > 0) positiveDriver = 'Title I K-12 school funding';
        if (infl < 0) negativeDriver = 'Rising household expenses';
        break;
      }

      case 'college_educated': {
        const sdr = hasSocial
          ? (socialDev(draft, 'sdr') / SOCIAL_PERCENT_MAX) * C.voterStudentDebtSensitivity * HALF_DIVISOR
          : 0;
        const cln = hasSocial
          ? (socialDev(draft, 'cln') / SOCIAL_MAX_DEV) * C.voterCleanEnergySensitivity * HALF_DIVISOR
          : 0;
        const vis = hasSocial
          ? (socialDev(draft, 'vis') / SOCIAL_MAX_DEV) * C.voterVisaLaborSensitivity
          : 0;
        delta = sdr + cln + vis;
        if (sdr > 0) positiveDriver = 'Income-driven student debt relief';
        else if (cln > 0) positiveDriver = 'Clean energy tax credits';
        else if (vis > 0) positiveDriver = 'Skilled worker visa expansion';
        if (growthDev < 0) negativeDriver = 'Economic slowdown';
        break;
      }

      case 'immigrant': {
        const reg = hasSocial
          ? socialDev(draft, 'reg') * C.voterRegularizationSensitivity * HALF_DIVISOR
          : 0;
        const vis = hasSocial
          ? (socialDev(draft, 'vis') / SOCIAL_MAX_DEV) * C.voterVisaLaborSensitivity * HALF_DIVISOR
          : 0;
        delta = reg + vis;
        if (reg > 0) positiveDriver = 'Worker legal status regularization';
        else if (vis > 0) positiveDriver = 'Legal visa program expansion';
        break;
      }

      case 'energy_ag': {
        const fos = hasSocial
          ? (socialDev(draft, 'fos') / SOCIAL_MAX_DEV) * C.voterFossilPermittingSensitivity * HALF_DIVISOR
          : 0;
        const cln = hasSocial
          ? (socialDev(draft, 'cln') / SOCIAL_MAX_DEV) * C.voterCleanEnergySensitivity
          : 0;
        const tar = -tariffDev * C.voterFarmTariffSensitivity * HALF_DIVISOR;
        const crb = hasSocial
          ? -(socialDev(draft, 'crb') / SOCIAL_PERCENT_MAX) * C.voterCarbonStandardPenalty * HALF_DIVISOR
          : 0;
        delta = fos + cln + tar + crb;
        if (fos > 0) positiveDriver = 'Federal energy leasing velocity';
        else if (cln > 0) positiveDriver = 'Rural clean energy investment';
        if (tar < 0) negativeDriver = 'Retaliatory agricultural export tariffs';
        else if (crb < 0) negativeDriver = 'Industrial carbon emission caps';
        break;
      }
    }

    const supportPct = clamp(
      round(natBaseSupport + delta),
      MIN_SUPPORT_PCT,
      MAX_SUPPORT_PCT
    );
    const supportDelta = supportPct - BASE_PERCENT;

    return {
      id: meta.id,
      name: meta.name,
      sharePct: meta.sharePct,
      supportPct,
      supportDelta,
      topPositiveDriver: positiveDriver,
      topNegativeDriver: negativeDriver,
    };
  });
}
