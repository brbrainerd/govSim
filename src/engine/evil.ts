// Pure Evil Mode engine module (EVIL-01, EVIL-02, EVIL-03)
// Governs offshore stash tracking, heat meter dynamics, and institutional/voter friction.

import { C } from './coefficients';
import { MAX_HEAT, MIN_HEAT, type EvilLeverId } from './units';
import { getEvilLever, isEvilLeverId } from '../data/evil';

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
  readonly senateFrictionVotes: number;
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
    senateFrictionVotes: Math.round(clampedHeat * C.heatSenateFriction),
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

export interface EvilLeversResult {
  readonly cloutCost: number;
  readonly stashDeltaBn: number;
  readonly heatDelta: number;
  readonly approvalDelta: number;
  readonly trustDelta: number;
  readonly budgetDeltaBn: number;
  readonly enactedLevers: readonly EvilLeverId[];
  readonly logEntries: readonly { kind: string; id: string; detail: string; amount?: number }[];
}

/**
 * Resolves enacted corrupt executive levers, checking clout affordability and accumulating
 * stash kickbacks, heat changes, trust/approval fallout, and logging entries.
 */
export function resolveEvilLevers(
  requestedLevers: readonly EvilLeverId[] | undefined,
  availableClout: number,
): EvilLeversResult {
  if (!requestedLevers || requestedLevers.length === 0) {
    return {
      cloutCost: 0,
      stashDeltaBn: 0,
      heatDelta: 0,
      approvalDelta: 0,
      trustDelta: 0,
      budgetDeltaBn: 0,
      enactedLevers: [],
      logEntries: [],
    };
  }

  const seen = new Set<EvilLeverId>();
  let remainingClout = Math.max(0, availableClout);
  let cloutCost = 0;
  let stashDeltaBn = 0;
  let heatDelta = 0;
  let approvalDelta = 0;
  let trustDelta = 0;
  let budgetDeltaBn = 0;
  const enactedLevers: EvilLeverId[] = [];
  const logEntries: { kind: string; id: string; detail: string; amount?: number }[] = [];

  for (const id of requestedLevers) {
    if (!isEvilLeverId(id) || seen.has(id)) continue;
    seen.add(id);

    const lever = getEvilLever(id);
    if (!lever) continue;

    if (remainingClout >= lever.cloutCost) {
      remainingClout -= lever.cloutCost;
      cloutCost += lever.cloutCost;
      stashDeltaBn += lever.kickbackBn;
      heatDelta += lever.heatDelta;
      approvalDelta -= lever.approvalPenalty;
      trustDelta -= lever.trustPenalty;
      budgetDeltaBn += lever.budgetCostBn ?? 0;
      enactedLevers.push(lever.id);

      logEntries.push({
        kind: 'evil',
        id: lever.id,
        detail: lever.name,
        amount: lever.kickbackBn > 0 ? lever.kickbackBn : undefined,
      });
    } else {
      logEntries.push({
        kind: 'evil',
        id: `${lever.id}_unaffordable`,
        detail: `Insufficient clout for ${lever.name}`,
      });
    }
  }

  return {
    cloutCost,
    stashDeltaBn,
    heatDelta,
    approvalDelta,
    trustDelta,
    budgetDeltaBn,
    enactedLevers,
    logEntries,
  };
}

