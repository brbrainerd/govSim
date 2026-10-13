// Pure Evil Mode engine module (EVIL-01, EVIL-02, EVIL-03)
// Governs offshore stash tracking, heat meter dynamics, and institutional/voter friction.

import { C } from './coefficients';
import {
  HEAT_IMPEACHMENT_THRESHOLD,
  HOUSE_OPPOSITION_BASE_SEATS,
  HOUSE_TOTAL_SEATS,
  IMPEACHMENT_APPROVAL_THRESHOLD,
  MAX_HEAT,
  MIN_HEAT,
  SENATE_BASE_SEATS,
  SENATE_CRITICAL_HEAT_THRESHOLD,
  SENATE_TOTAL_SEATS,
  type EvilLeverId,
} from './units';
import { getEvilLever, isEvilLeverId } from '../data/evil';

export interface EvilState {
  readonly offshoreStashBn: number;
  readonly heat: number;
  readonly investigationsActive: boolean;
  readonly specialCounselAppointed: boolean;
  readonly articlesOfImpeachmentVoted: boolean;
  readonly convicted: boolean;
  readonly houseImpeachmentVotes?: number;
  readonly senateConvictionVotes?: number;
  readonly termEnded?: boolean;
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
 * Calculates deterministic House of Representatives vote tally on Articles of Impeachment.
 * Requires 218 votes to adopt. Opposition base votes are adjusted by net midterm seat change,
 * plus defection votes driven by heat above threshold and low approval.
 */
export function calculateHouseImpeachmentVote(
  houseSeatDelta: number = 0,
  heat: number = 0,
  approval: number = C.approvalNeutral,
): number {
  const safeHeat = Math.max(MIN_HEAT, Math.min(MAX_HEAT, Number.isFinite(heat) ? heat : MIN_HEAT));
  const safeApproval = Number.isFinite(approval) ? approval : C.approvalNeutral;
  const safeDelta = Number.isFinite(houseSeatDelta) ? houseSeatDelta : 0;

  const baseOppositionVotes = HOUSE_OPPOSITION_BASE_SEATS - safeDelta;
  const heatDefections = Math.max(0, safeHeat - HEAT_IMPEACHMENT_THRESHOLD) * C.impeachmentHouseHeatSlope;
  const approvalDefections = Math.max(0, IMPEACHMENT_APPROVAL_THRESHOLD - safeApproval) * C.impeachmentHouseApprovalSlope;

  const totalVotes = Math.round(baseOppositionVotes + heatDefections + approvalDefections);
  return Math.max(0, Math.min(HOUSE_TOTAL_SEATS, totalVotes));
}

/**
 * Calculates deterministic Senate conviction trial vote tally.
 * Requires 67 votes (two-thirds supermajority of 100 seats) to convict and remove from office.
 * Opposition base senators are adjusted by net midterm Senate seat change, plus crossover
 * defectors driven by critical heat above 85 and low public approval.
 */
export function calculateSenateTrialVote(
  senateSeatDelta: number = 0,
  heat: number = 0,
  approval: number = C.approvalNeutral,
): number {
  const safeHeat = Math.max(MIN_HEAT, Math.min(MAX_HEAT, Number.isFinite(heat) ? heat : MIN_HEAT));
  const safeApproval = Number.isFinite(approval) ? approval : C.approvalNeutral;
  const safeDelta = Number.isFinite(senateSeatDelta) ? senateSeatDelta : 0;

  const baseOppositionVotes = SENATE_BASE_SEATS - safeDelta;
  const heatCrossovers = Math.max(0, safeHeat - SENATE_CRITICAL_HEAT_THRESHOLD) * C.convictionSenateHeatSlope;
  const approvalCrossovers = Math.max(0, IMPEACHMENT_APPROVAL_THRESHOLD - safeApproval) * C.convictionSenateApprovalSlope;

  const totalVotes = Math.round(baseOppositionVotes + heatCrossovers + approvalCrossovers);
  return Math.max(0, Math.min(SENATE_TOTAL_SEATS, totalVotes));
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
  const houseVotes = typeof r.houseImpeachmentVotes === 'number' && Number.isFinite(r.houseImpeachmentVotes)
    ? Math.max(0, Math.min(HOUSE_TOTAL_SEATS, Math.round(r.houseImpeachmentVotes)))
    : undefined;
  const senateVotes = typeof r.senateConvictionVotes === 'number' && Number.isFinite(r.senateConvictionVotes)
    ? Math.max(0, Math.min(SENATE_TOTAL_SEATS, Math.round(r.senateConvictionVotes)))
    : undefined;

  const state: EvilState = {
    offshoreStashBn: stash,
    heat,
    investigationsActive: Boolean(r.investigationsActive),
    specialCounselAppointed: Boolean(r.specialCounselAppointed),
    articlesOfImpeachmentVoted: Boolean(r.articlesOfImpeachmentVoted),
    convicted: Boolean(r.convicted),
    ...(r.termEnded !== undefined ? { termEnded: Boolean(r.termEnded) } : {}),
    ...(houseVotes !== undefined ? { houseImpeachmentVotes: houseVotes } : {}),
    ...(senateVotes !== undefined ? { senateConvictionVotes: senateVotes } : {}),
  };
  return state;
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

