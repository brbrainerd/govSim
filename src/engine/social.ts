// Domestic social policy levers (Phase 9, SOC-01..04).
// Pure, deterministic model definitions for Healthcare, Immigration, Energy, and Education.
// Linear per-unit quarterly dynamics, clamped bounds, and sanitization for save logs.

import { C } from './coefficients';
import {
  SOCIAL_BINARY_BASE,
  SOCIAL_BINARY_MAX,
  SOCIAL_BINARY_STEP,
  SOCIAL_INDEX_BASE,
  SOCIAL_INDEX_MAX,
  SOCIAL_INDEX_MIN,
  SOCIAL_INDEX_STEP,
  SOCIAL_INDEX_STEP_FINE,
  SOCIAL_NARROW_MAX,
  SOCIAL_NARROW_MIN,
  SOCIAL_PERCENT_MAX,
  SOCIAL_PERCENT_MIN,
  SOCIAL_PERCENT_STEP,
} from './units';

export type SocialDomain = 'healthcare' | 'immigration' | 'energy' | 'education';

export interface SocialLever {
  readonly id: string;
  readonly domain: SocialDomain;
  readonly label: string;
  readonly base: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly deficitBn: number; // 1-year deficit change per unit, $bn (+ = more federal borrowing)
  readonly family: number; // typical monthly family financial effect, $ (+ = saves money or raises income)
  readonly note: string;
}

export const socialLevers: readonly SocialLever[] = [
  // Healthcare (SOC-01)
  {
    id: 'aca', domain: 'healthcare', label: 'ACA Health Subsidies',
    base: SOCIAL_INDEX_BASE, min: SOCIAL_INDEX_MIN, max: SOCIAL_INDEX_MAX, step: SOCIAL_INDEX_STEP_FINE,
    deficitBn: C.acaSubsidyDeficit, family: C.acaFamilyRelief,
    note: 'Subsidies for health insurance exchange coverage, reducing the uninsured rate.',
  },
  {
    id: 'drg', domain: 'healthcare', label: 'Medicare Drug Negotiations',
    base: SOCIAL_PERCENT_MIN, min: SOCIAL_PERCENT_MIN, max: SOCIAL_PERCENT_MAX, step: SOCIAL_PERCENT_STEP,
    deficitBn: -C.drugNegotiationSavings, family: C.drugFamilySavings,
    note: 'Statutory authority to negotiate maximum prices for top Medicare pharmaceuticals.',
  },
  {
    id: 'pub', domain: 'healthcare', label: 'Public Option Insurance',
    base: SOCIAL_BINARY_BASE, min: SOCIAL_BINARY_BASE, max: SOCIAL_BINARY_MAX, step: SOCIAL_BINARY_STEP,
    deficitBn: C.publicOptionDeficit, family: C.publicOptionPremiumRelief,
    note: 'Government-sponsored coverage option competing alongside private plans on ACA exchanges.',
  },

  // Immigration (SOC-02)
  {
    id: 'bdr', domain: 'immigration', label: 'Border Security & Enforcement',
    base: SOCIAL_INDEX_BASE, min: SOCIAL_NARROW_MIN, max: SOCIAL_NARROW_MAX, step: SOCIAL_INDEX_STEP_FINE,
    deficitBn: C.borderSecurityCost, family: 0,
    note: 'Personnel, surveillance technology, and infrastructure at international border ports.',
  },
  {
    id: 'vis', domain: 'immigration', label: 'High-Skilled & Worker Visas',
    base: SOCIAL_INDEX_BASE, min: SOCIAL_INDEX_MIN, max: SOCIAL_INDEX_MAX, step: SOCIAL_INDEX_STEP,
    deficitBn: -C.visaDeficitSavings, family: C.visaFamilyBenefit,
    note: 'Annual statutory cap for H-1B, agricultural, and permanent employment-based visas.',
  },
  {
    id: 'reg', domain: 'immigration', label: 'Worker Status Regularization',
    base: SOCIAL_BINARY_BASE, min: SOCIAL_BINARY_BASE, max: SOCIAL_BINARY_MAX, step: SOCIAL_BINARY_STEP,
    deficitBn: -C.regularizationPayrollBoost, family: C.regularizationFamilyRelief,
    note: 'Path to formal work authorization and legal status for undocumented workers.',
  },

  // Energy & Climate (SOC-03)
  {
    id: 'cln', domain: 'energy', label: 'Clean Energy Tax Credits',
    base: SOCIAL_INDEX_BASE, min: SOCIAL_INDEX_MIN, max: SOCIAL_INDEX_MAX, step: SOCIAL_INDEX_STEP,
    deficitBn: C.cleanEnergyCreditCost, family: C.cleanEnergyFamilyRelief,
    note: 'Production and investment tax credits for renewable power generation and grid battery storage.',
  },
  {
    id: 'fos', domain: 'energy', label: 'Federal Leasing & Permitting',
    base: SOCIAL_INDEX_BASE, min: SOCIAL_INDEX_MIN, max: SOCIAL_INDEX_MAX, step: SOCIAL_INDEX_STEP,
    deficitBn: -C.fossilPermittingRevenue, family: C.fossilPermittingFamilyRelief,
    note: 'Pace of oil, gas, and mineral leasing and environmental permit processing on federal public lands.',
  },
  {
    id: 'crb', domain: 'energy', label: 'Carbon Emission Standards',
    base: SOCIAL_PERCENT_MIN, min: SOCIAL_PERCENT_MIN, max: SOCIAL_PERCENT_MAX, step: SOCIAL_PERCENT_STEP,
    deficitBn: C.carbonStandardCost, family: -C.carbonStandardCost,
    note: 'Emissions intensity benchmarks on power generation and heavy industrial facilities.',
  },

  // Education (SOC-04)
  {
    id: 'k12', domain: 'education', label: 'Title I K-12 School Grants',
    base: SOCIAL_INDEX_BASE, min: SOCIAL_NARROW_MIN, max: SOCIAL_NARROW_MAX, step: SOCIAL_INDEX_STEP_FINE,
    deficitBn: C.titleIFundingCost, family: C.titleIFamilyRelief,
    note: 'Federal formula grants targeted toward elementary and secondary schools serving low-income families.',
  },
  {
    id: 'sdr', domain: 'education', label: 'Income-Driven Student Debt Relief',
    base: SOCIAL_PERCENT_MIN, min: SOCIAL_PERCENT_MIN, max: SOCIAL_PERCENT_MAX, step: SOCIAL_PERCENT_STEP,
    deficitBn: C.studentDebtReliefCost, family: C.studentDebtMonthlyRelief,
    note: 'Repayment caps and selective cancellation relief for federal student loan borrowers.',
  },
  {
    id: 'prek', domain: 'education', label: 'Universal Pre-K Matching',
    base: SOCIAL_BINARY_BASE, min: SOCIAL_BINARY_BASE, max: SOCIAL_BINARY_MAX, step: SOCIAL_BINARY_STEP,
    deficitBn: C.universalPreKCost, family: C.universalPreKFamilyRelief,
    note: 'Federal-state matching grants to provide tuition-free early education for 3- and 4-year-olds.',
  },
];

export type SocialDraft = Record<string, number>;

const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Baseline social policy with each lever at its default value. */
export function socialBaseline(): SocialDraft {
  const out: SocialDraft = {};
  for (const l of socialLevers) {
    out[l.id] = l.base;
  }
  return out;
}

/**
 * Sanitizes untrusted social draft data from player inputs or save files.
 * Properties are checked via Object.hasOwn, non-finite values revert to base,
 * and numbers are strictly clamped to their allowed min/max range.
 */
export function sanitizeSocial(d: unknown): SocialDraft {
  const src = isRecord(d) ? d : {};
  const out: SocialDraft = {};
  for (const l of socialLevers) {
    const v: unknown = Object.hasOwn(src, l.id) ? src[l.id] : undefined;
    out[l.id] = typeof v === 'number' && Number.isFinite(v) ? Math.min(l.max, Math.max(l.min, v)) : l.base;
  }
  return out;
}

/** Looks up a social lever definition by its ID. */
export function getSocialLever(id: string): SocialLever | undefined {
  return socialLevers.find((l) => l.id === id);
}
