// Pure engine calculation for Security Index (Phase 15, SEC-01, SEC-02).
// Sourced arithmetic, no bare literals outside exempt files, strictly deterministic.

import { C, LIMITS } from './coefficients';
import { clamp } from './detmath';
import { FOREIGN_ASSISTANCE_BASE } from './units';
import type { ActiveCrisis } from './director';
import type { ForeignPolicyState } from './foreign';
import type { Econ, Start } from './game';

export interface SecurityBreakdown {
  readonly baseline: number;
  readonly defense: number;
  readonly alliances: number;
  readonly crises: number;
  readonly sanctions: number;
  readonly domestic: number;
  readonly total: number;
}

export interface SecurityInput {
  readonly econ: Econ;
  readonly start: Start;
  readonly foreignPolicy?: ForeignPolicyState;
  readonly activeGeopoliticalCrises?: readonly ActiveCrisis[];
}

/**
 * Pure calculation of the 0–100 Security Index (SEC-01).
 * Combines defense posture, alliance strength, crisis containment, deterrence sanctions, and domestic public safety.
 */
export function calculateSecurityBreakdown(input: SecurityInput): SecurityBreakdown {
  const [lo, hi] = LIMITS.score.bounds;
  const baseline = C.securityBaseline;

  // 1. Defense Readiness Posture
  let defense = 0;
  const posture = input.foreignPolicy?.defensePosture ?? 'standard';
  if (posture === 'surge') {
    defense = C.securityDefenseSurgeBonus;
  } else if (posture === 'peacetime') {
    defense = -C.securityDefensePeacetimePenalty;
  }

  // 2. Alliances & Foreign Assistance
  const assistance = input.foreignPolicy?.foreignAssistance ?? FOREIGN_ASSISTANCE_BASE;
  const aidDiff = assistance - FOREIGN_ASSISTANCE_BASE;
  const alliances = aidDiff === 0 ? 0 : aidDiff * C.securityForeignAidScale;

  // 3. International Crisis Containment
  const crisisCount = input.activeGeopoliticalCrises?.length ?? 0;
  const crises = crisisCount === 0 ? 0 : -crisisCount * C.securityActiveCrisisPenalty;

  // 4. Sanctions & Deterrence Credibility
  const sanctionsCount = input.foreignPolicy?.activeSanctions?.length ?? 0;
  const sanctions = sanctionsCount * C.securitySanctionBonus;

  // 5. Domestic Public Safety (Crime relative to start)
  const domestic = (1 - input.econ.crime / input.start.crime) * C.securityCrimeScale;

  const rawTotal = baseline + defense + alliances + crises + sanctions + domestic;
  const total = clamp(rawTotal, lo, hi);

  return {
    baseline,
    defense,
    alliances,
    crises,
    sanctions,
    domestic,
    total,
  };
}

/**
 * Returns the final clamped 0–100 Security Index value.
 */
export function calculateSecurityIndex(input: SecurityInput): number {
  return calculateSecurityBreakdown(input).total;
}
