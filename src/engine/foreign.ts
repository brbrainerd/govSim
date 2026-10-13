// Pure engine logic for foreign policy, defense readiness, and targeted sanctions (Phase 14, FORPOL-01, FORPOL-02).
// Sourced arithmetic, no bare literals outside exempt files, strictly deterministic.

import { C } from './coefficients';
import {
  FOREIGN_ASSISTANCE_BASE,
  FOREIGN_ASSISTANCE_MAX,
  FOREIGN_ASSISTANCE_MIN,
  FOREIGN_ASSISTANCE_STEP,
  QUARTERS_PER_YEAR,
} from './units';

export type DefensePosture = 'peacetime' | 'standard' | 'surge';
export type SanctionType = 'asset_freeze' | 'export_controls' | 'energy_embargo';

export interface SanctionDefinition {
  readonly id: SanctionType;
  readonly name: string;
  readonly description: string;
  readonly legalBasis: string;
  readonly cloutCost: number;
  readonly inflationImpact: number; // percentage points inflation increase
  readonly gapImpact: number; // percentage points output gap drag (negative)
  readonly citation: {
    readonly title: string;
    readonly url: string;
    readonly confirmed: boolean;
  };
}

export const SANCTIONS_CATALOG: readonly SanctionDefinition[] = [
  {
    id: 'asset_freeze',
    name: 'Targeted Financial Asset Freezes',
    description: 'Freezes foreign sovereign and oligarch banking assets in domestic financial clearing institutions.',
    legalBasis: 'International Emergency Economic Powers Act (IEEPA), 50 U.S.C. § 1701',
    cloutCost: C.sanctionCloutCost,
    inflationImpact: C.sanctionAssetFreezeInflation,
    gapImpact: -C.sanctionAssetFreezeOutput,
    citation: {
      title: 'U.S. Department of the Treasury Office of Foreign Assets Control (OFAC) Overview',
      url: 'https://home.treasury.gov/policy-issues/financial-sanctions/sanctions-programs-and-country-information',
      confirmed: false,
    },
  },
  {
    id: 'export_controls',
    name: 'Advanced Technology & Defense Export Restrictions',
    description: 'Prohibits the export of domestic semiconductor tooling, aerospace avionics, and dual-use equipment.',
    legalBasis: 'Export Control Reform Act of 2018 (ECRA), 50 U.S.C. § 4811',
    cloutCost: C.sanctionCloutCost,
    inflationImpact: C.sanctionExportControlsInflation,
    gapImpact: -C.sanctionExportControlsOutput,
    citation: {
      title: 'CRS U.S. Export Controls and the Export Control Reform Act (R46814)',
      url: 'https://crsreports.congress.gov/product/pdf/R/R46814',
      confirmed: false,
    },
  },
  {
    id: 'energy_embargo',
    name: 'Maritime Energy Shipping & Secondary Sanctions',
    description: 'Imposes secondary sanctions on foreign vessels and insurers transporting sanctioned crude and petroleum products.',
    legalBasis: "Countering America's Adversaries Through Sanctions Act (CAATSA), 22 U.S.C. § 9401",
    cloutCost: C.sanctionCloutCost,
    inflationImpact: C.sanctionEnergyEmbargoInflation,
    gapImpact: -C.sanctionEnergyEmbargoOutput,
    citation: {
      title: 'CRS Sanctions: CAATSA and Executive Authority (IF10779)',
      url: 'https://crsreports.congress.gov/product/pdf/IF/IF10779',
      confirmed: false,
    },
  },
] as const;

export function getSanction(id: SanctionType): SanctionDefinition | undefined {
  return SANCTIONS_CATALOG.find((s) => s.id === id);
}

export interface ForeignPolicyDraft {
  readonly defensePosture?: DefensePosture;
  readonly foreignAssistance?: number;
  readonly activeSanctions?: readonly SanctionType[];
}

export interface ForeignPolicyState {
  readonly defensePosture: DefensePosture;
  readonly foreignAssistance: number;
  readonly activeSanctions: readonly SanctionType[];
}

export interface ForeignPolicyResult {
  readonly defensePosture: DefensePosture;
  readonly foreignAssistance: number;
  readonly activeSanctions: readonly SanctionType[];
  readonly quarterlyDeficitDeltaBn: number; // added to debtBn this quarter
  readonly quarterlyInflationDelta: number; // added to inflation this quarter
  readonly quarterlyGapDelta: number; // added to gap this quarter
  readonly cloutSpent: number; // spent this turn
}

export function defaultForeignPolicy(): ForeignPolicyState {
  return {
    defensePosture: 'standard',
    foreignAssistance: FOREIGN_ASSISTANCE_BASE,
    activeSanctions: [],
  };
}

export function sanitizeForeignPolicy(draft?: unknown): ForeignPolicyDraft {
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) {
    return {};
  }
  const record = draft as Record<string, unknown>;
  const posture: DefensePosture | undefined =
    record.defensePosture === 'peacetime' ||
    record.defensePosture === 'standard' ||
    record.defensePosture === 'surge'
      ? record.defensePosture
      : undefined;

  let assistance: number | undefined;
  if (typeof record.foreignAssistance === 'number' && Number.isFinite(record.foreignAssistance)) {
    const clamped = Math.max(FOREIGN_ASSISTANCE_MIN, Math.min(FOREIGN_ASSISTANCE_MAX, record.foreignAssistance));
    assistance = Math.round(clamped / FOREIGN_ASSISTANCE_STEP) * FOREIGN_ASSISTANCE_STEP;
  }

  let sanctions: SanctionType[] | undefined;
  if (Array.isArray(record.activeSanctions)) {
    const validIds = new Set<SanctionType>(['asset_freeze', 'export_controls', 'energy_embargo']);
    sanctions = record.activeSanctions.filter((s): s is SanctionType => validIds.has(s));
  }

  return {
    defensePosture: posture,
    foreignAssistance: assistance,
    activeSanctions: sanctions,
  };
}

export function resolveForeignPolicy(
  current: ForeignPolicyState,
  draft?: ForeignPolicyDraft,
  availableClout: number = 0,
): ForeignPolicyResult {
  const sanitized = sanitizeForeignPolicy(draft);
  const defensePosture = sanitized.defensePosture ?? current.defensePosture;
  const foreignAssistance = sanitized.foreignAssistance ?? current.foreignAssistance;
  const requestedSanctions = sanitized.activeSanctions ?? current.activeSanctions;

  // New sanctions require clout to enact
  const currentSet = new Set(current.activeSanctions);
  const newlyEnacted = requestedSanctions.filter((s) => !currentSet.has(s));
  const totalCloutRequired = newlyEnacted.length * C.sanctionCloutCost;

  let activeSanctions = requestedSanctions;
  let cloutSpent = 0;
  if (totalCloutRequired <= availableClout) {
    cloutSpent = totalCloutRequired;
  } else {
    // If unaffordable, retain previous sanctions
    activeSanctions = current.activeSanctions;
  }

  // 1. Defense Posture annual deficit impact
  let annualDefenseDeltaBn = 0;
  if (defensePosture === 'surge') {
    annualDefenseDeltaBn = C.defenseSurgeCostBn;
  } else if (defensePosture === 'peacetime') {
    annualDefenseDeltaBn = -C.defensePeacetimeSavingsBn;
  }

  // 2. Foreign Assistance annual deficit impact
  const assistanceDev = foreignAssistance - FOREIGN_ASSISTANCE_BASE;
  const annualAssistanceDeltaBn = assistanceDev * C.foreignAssistancePerPoint;

  // Quarterly deficit delta = (defense + assistance) / 4
  const quarterlyDeficitDeltaBn = (annualDefenseDeltaBn + annualAssistanceDeltaBn) / QUARTERS_PER_YEAR;

  // 3. Sanctions Macro Fallout
  let quarterlyInflationDelta = 0;
  let quarterlyGapDelta = 0;

  for (const s of activeSanctions) {
    const def = getSanction(s);
    if (def) {
      quarterlyInflationDelta += def.inflationImpact;
      quarterlyGapDelta += def.gapImpact;
    }
  }

  return {
    defensePosture,
    foreignAssistance,
    activeSanctions,
    quarterlyDeficitDeltaBn,
    quarterlyInflationDelta,
    quarterlyGapDelta,
    cloutSpent,
  };
}
