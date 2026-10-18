// Pure deterministic Mandate & Task Force RNG draft engine (Phase 44, PERK-01).
// Uses dedicated RNG stream 21 ('perks') so drafting or rerolling never shifts any other engine stream.

import {
  ALL_PERKS_CATALOG,
  EVIL_HEIST_RELICS_CATALOG,
  getPerk,
  STANDARD_PERKS_CATALOG,
  type PerkDefinition,
  type PerkTier,
} from '../content/perks';
import { C } from './coefficients';
import type { GameState, LogEntry } from './game';
import type { Modifier } from './modifiers';
import { draw } from './rng';
import {
  FOREVER,
  PERK_MAX_REROLLS_PER_TURN,
  PERK_SLATE_SIZE,
  PERK_TIER_1,
  PERK_TIER_2,
  PERK_TIER_3,
  PERK_TIER_3_MIN_TURN,
  PERK_TIER_4,
  PERK_TIER_4_MIN_TURN,
} from './units';

export interface PerkDecision {
  pickId?: string;
  skipForClout?: boolean;
  rerolls?: number;
  lockedId?: string | null;
}

export interface PerkResolutionResult {
  valid: boolean;
  reason?: 'unaffordable' | 'invalid';
  cloutSpent: number;
  cloutGained: number;
  modifiers: readonly Modifier[];
  activePerks: readonly string[];
  lockedPerkId: string | null;
  evilStashDeltaBn: number;
  evilHeatDelta: number;
  log: readonly LogEntry[];
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

/** Cost of the next reroll within the current quarter (0-indexed reroll count). */
export function perkRerollCost(rerollIndex: number): number {
  const idx = Math.max(0, Math.trunc(rerollIndex));
  return C.perkRerollBaseCost + idx * C.perkRerollStepCost;
}

/** Total clout cost for `count` rerolls in the same turn. */
export function totalPerkRerollsCost(count: number): number {
  const n = Math.max(0, Math.min(PERK_MAX_REROLLS_PER_TURN, Math.trunc(count)));
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += perkRerollCost(i);
  }
  return total;
}

function rollCardTier(
  seed: number,
  turn: number,
  approval: number,
  rerollCount: number,
  slotIndex: number,
): PerkTier {
  const u = draw(seed, 'perks', turn, `tier_r${rerollCount}`, slotIndex);
  const canTier4 = turn >= PERK_TIER_4_MIN_TURN && approval >= C.perkTier4ApprovalFloor;
  const canTier3 = turn >= PERK_TIER_3_MIN_TURN;

  const w4 = canTier4 ? C.perkTier4Weight : 0;
  const w3 = canTier3 ? Math.min(C.perkTier2BaseWeight, turn * C.perkTier3TurnSlope) : 0;
  const w2 = C.perkTier2BaseWeight;

  if (u < w4) return PERK_TIER_4 as PerkTier;
  if (u < w4 + w3) return PERK_TIER_3 as PerkTier;
  if (u < w4 + w3 + w2) return PERK_TIER_2 as PerkTier;
  return PERK_TIER_1 as PerkTier;
}

/**
 * Deterministically rolls a 3-card Task Force / Mandate slate for (seed, turn, rerollCount).
 * If `lockedPerkId` is valid and not already enacted, it occupies slot 0 of the slate.
 */
export function rollPerkSlate(
  seed: number,
  turn: number,
  approval: number,
  rerollCount = 0,
  activePerks: readonly string[] = [],
  lockedPerkId?: string | null,
  evilMode = false,
): readonly PerkDefinition[] {
  const poolBase = evilMode ? ALL_PERKS_CATALOG : STANDARD_PERKS_CATALOG;
  const available = poolBase.filter((p) => !activePerks.includes(p.id));
  if (available.length === 0) return [];

  const chosen: PerkDefinition[] = [];
  const chosenIds = new Set<string>();

  if (lockedPerkId) {
    const lockedCard = available.find((p) => p.id === lockedPerkId);
    if (lockedCard) {
      chosen.push(lockedCard);
      chosenIds.add(lockedCard.id);
    }
  }

  for (let slot = chosen.length; slot < PERK_SLATE_SIZE; slot++) {
    const remaining = available.filter((p) => !chosenIds.has(p.id));
    if (remaining.length === 0) break;

    const targetTier = rollCardTier(seed, turn, approval, rerollCount, slot);
    // In Evil Mode, slot 0 (or slot 1 if slot 0 is locked) prioritizes Heist Relics when available
    const preferEvilSlot = evilMode && slot === (lockedPerkId ? 1 : 0);
    const evilPool = preferEvilSlot
      ? remaining.filter((p) => Boolean(p.evilOnly))
      : remaining;
    const candidateBase = evilPool.length > 0 ? evilPool : remaining;

    const tierMatches = candidateBase.filter((p) => p.tier === targetTier);
    const pool = tierMatches.length > 0 ? tierMatches : candidateBase;

    const uPick = draw(seed, 'perks', turn, `pick_r${rerollCount}_s${slot}`, slot);
    const idx = Math.min(pool.length - 1, Math.floor(uPick * pool.length));
    const card = pool[idx]!;
    chosen.push(card);
    chosenIds.add(card.id);
  }

  return chosen;
}

/** Resolves a player's quarterly Task Force draft decision (pick, skip for clout, rerolls, lock). */
export function resolvePerkDecision(
  state: GameState,
  rawPerk: unknown,
  availableClout: number,
  evilMode = false,
): PerkResolutionResult {
  const currentActive = state.activePerks ? [...state.activePerks] : [];
  const currentLocked = state.lockedPerkId ?? null;

  const fail = (reason: 'unaffordable' | 'invalid'): PerkResolutionResult => ({
    valid: false,
    reason,
    cloutSpent: 0,
    cloutGained: 0,
    modifiers: [],
    activePerks: currentActive,
    lockedPerkId: currentLocked,
    evilStashDeltaBn: 0,
    evilHeatDelta: 0,
    log: [],
  });

  if (!isRecord(rawPerk)) return fail('invalid');

  const rerolls =
    rawPerk.rerolls !== undefined
      ? typeof rawPerk.rerolls === 'number' &&
        Number.isInteger(rawPerk.rerolls) &&
        rawPerk.rerolls >= 0 &&
        rawPerk.rerolls <= PERK_MAX_REROLLS_PER_TURN
        ? rawPerk.rerolls
        : -1
      : 0;
  if (rerolls < 0) return fail('invalid');

  const pickId = typeof rawPerk.pickId === 'string' && rawPerk.pickId.length > 0 ? rawPerk.pickId : undefined;
  const skipForClout = rawPerk.skipForClout === true;
  if (pickId && skipForClout) return fail('invalid');

  let nextLocked: string | null = currentLocked;
  if (rawPerk.lockedId === null) {
    nextLocked = null;
  } else if (typeof rawPerk.lockedId === 'string') {
    const lockCard = getPerk(rawPerk.lockedId);
    if (!lockCard || currentActive.includes(lockCard.id)) return fail('invalid');
    if (lockCard.evilOnly && !evilMode) return fail('invalid');
    nextLocked = lockCard.id;
  }

  const rerollCloutCost = totalPerkRerollsCost(rerolls);
  let pickCloutCost = 0;
  let pickedDef: PerkDefinition | undefined;

  if (pickId) {
    pickedDef = getPerk(pickId);
    if (!pickedDef) return fail('invalid');
    if (currentActive.includes(pickId)) return fail('invalid');
    if (pickedDef.evilOnly && !evilMode) return fail('invalid');
    pickCloutCost = pickedDef.cloutCost;
  }

  const totalCost = rerollCloutCost + pickCloutCost;
  if (totalCost > availableClout) return fail('unaffordable');

  const cloutGained = skipForClout ? C.perkSkipCloutBonus : 0;
  const modifiers: Modifier[] = [];
  const log: LogEntry[] = [];
  const nextActive = [...currentActive];
  let evilStashDeltaBn = 0;
  let evilHeatDelta = 0;

  if (pickedDef) {
    nextActive.push(pickedDef.id);
    if (nextLocked === pickedDef.id) {
      nextLocked = null;
    }
    for (const eff of pickedDef.effects) {
      modifiers.push({
        id: `perk:${pickedDef.id}#${eff.channel}#t${state.turn}`,
        group: `perk:${pickedDef.id}`,
        source: `perk:${pickedDef.id}`,
        channel: eff.channel,
        amount: eff.amount,
        from: state.turn,
        until: FOREVER,
        tag: 'perk',
      });
    }
    if (pickedDef.evilStashBonusBn) {
      evilStashDeltaBn += pickedDef.evilStashBonusBn;
    }
    if (pickedDef.evilHeatDelta) {
      evilHeatDelta += pickedDef.evilHeatDelta;
    }
    log.push({
      kind: 'perk',
      id: pickedDef.id,
      detail: pickedDef.name,
      amount: totalCost,
    });
  } else if (skipForClout) {
    log.push({
      kind: 'perk',
      id: 'skipped',
      detail: 'Skipped Task Force draft to conserve political capital',
      amount: cloutGained - rerollCloutCost,
    });
  } else if (rerolls > 0) {
    log.push({
      kind: 'perk',
      id: 'rerolled',
      detail: `Rerolled Task Force slate (${rerolls}x)`,
      amount: rerollCloutCost,
    });
  }

  return {
    valid: true,
    cloutSpent: totalCost,
    cloutGained,
    modifiers,
    activePerks: nextActive,
    lockedPerkId: nextLocked,
    evilStashDeltaBn,
    evilHeatDelta,
    log,
  };
}

export { EVIL_HEIST_RELICS_CATALOG, STANDARD_PERKS_CATALOG };
