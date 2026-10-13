// Pure Evil Mode engine module (EVIL-01, EVIL-02, EVIL-03)
// Governs offshore stash tracking, heat meter dynamics, and institutional/voter friction.

import { C } from './coefficients';
import { MAX_HEAT, MIN_HEAT } from './units';

export interface EvilState {
  readonly offshoreStashBn: number;
  readonly heat: number;
  readonly investigationsActive: boolean;
  readonly specialCounselAppointed: boolean;
  readonly articlesOfImpeachmentVoted: boolean;
  readonly convicted: boolean;
}

export type EvilDraft = Partial<EvilState>;

export interface HeatPenalties {
  readonly approvalDelta: number;
  readonly trustDelta: number;
  readonly congressFrictionVotes: number;
}

/** Default clean state for Evil Mode when initialized or reset. */
export function defaultEvilState(): EvilState {
  return {
    offshoreStashBn: 0,
    heat: 0,
    investigationsActive: false,
    specialCounselAppointed: false,
    articlesOfImpeachmentVoted: false,
    convicted: false,
  };
}

/**
 * Calculates quarterly natural decay for accumulated heat, clamped to [MIN_HEAT, MAX_HEAT].
 */
export function calculateHeatDecay(currentHeat: number, decayRate: number = C.heatDecayQuarterly): number {
  if (!Number.isFinite(currentHeat)) return MIN_HEAT;
  const decayed = currentHeat - decayRate;
  if (decayed < MIN_HEAT) return MIN_HEAT;
  if (decayed > MAX_HEAT) return MAX_HEAT;
  return decayed;
}

/**
 * Calculates escalating institutional and voter penalties based on current heat level.
 */
export function calculateHeatPenalties(heat: number): HeatPenalties {
  const clampedHeat = Math.max(MIN_HEAT, Math.min(MAX_HEAT, Number.isFinite(heat) ? heat : MIN_HEAT));
  return {
    approvalDelta: clampedHeat === 0 ? 0 : -clampedHeat * C.heatApprovalPenalty,
    trustDelta: clampedHeat === 0 ? 0 : -clampedHeat * C.heatTrustPenalty,
    congressFrictionVotes: Math.round(clampedHeat * C.heatCongressionalFriction),
  };
}

/**
 * Sanitizes untrusted or serialized EvilState data, guaranteeing type safety and valid bounds.
 */
export function sanitizeEvilState(raw: unknown): EvilState {
  if (!raw || typeof raw !== 'object') {
    return defaultEvilState();
  }
  const r = raw as Partial<EvilState>;
  const stash = typeof r.offshoreStashBn === 'number' && Number.isFinite(r.offshoreStashBn) && r.offshoreStashBn >= 0
    ? r.offshoreStashBn
    : 0;
  const rawHeat = typeof r.heat === 'number' && Number.isFinite(r.heat) ? r.heat : 0;
  const heat = Math.max(MIN_HEAT, Math.min(MAX_HEAT, rawHeat));
  return {
    offshoreStashBn: stash,
    heat,
    investigationsActive: Boolean(r.investigationsActive),
    specialCounselAppointed: Boolean(r.specialCounselAppointed),
    articlesOfImpeachmentVoted: Boolean(r.articlesOfImpeachmentVoted),
    convicted: Boolean(r.convicted),
  };
}
