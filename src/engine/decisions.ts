// Decisions are raw player choices (FND-05). The engine and the UI preview call the same pure
// functions here, so the clout shown before Next turn is the clout charged at Next turn, and a
// hand-edited decision (a Phase 2 save is an input log) cannot mint clout or crash a replay:
// anything malformed is rejected, never trusted and never thrown on.

import { spendLevers, taxLevers, type BudgetDraft } from './budget';
import { C } from './coefficients';
import {
  billBipartisanAppeal,
  calculateSenateVotes,
  dealAppeal,
  deals as DEALS,
  getSenateClotureThreshold,
  tally,
  TO_PASS,
  voteOutcome,
  type DealId,
  type FilibusterRule,
} from './congress';
import { getCrisis } from './crises';
import type { Modifier, Scheduled } from './modifiers';
import type { PowerDecisions } from './powers';
import { isSocialBaseline, sanitizeSocial, type SocialDraft } from './social';
import { SENATE_BASE_SEATS, SENATE_SIMPLE_MAJORITY } from './units';

export interface Bill {
  budget: BudgetDraft;
  deals: DealId[];
  social?: SocialDraft;
}

export interface CrisisDecision {
  crisisId: string;
  optionId: string;
}

export type { PowerDecisions } from './powers';
export type { SocialDraft } from './social';

/** Phases 4/5/9/11 add keys here (crisis, powers, social, filibusterRule). There is deliberately no clout field. */
export interface Decisions {
  bill?: Bill;
  crisis?: CrisisDecision;
  powers?: PowerDecisions;
  social?: SocialDraft;
  filibusterRule?: FilibusterRule;
}

export interface CrisisChoiceResult {
  valid: boolean;
  reason?: 'unaffordable' | 'invalid';
  crisisId: string;
  optionId: string;
  cloutCost: number;
  modifiers: readonly Modifier[];
  scheduled: readonly Scheduled[];
}

export interface BillResult {
  valid: boolean;
  reason?: 'unaffordable' | 'invalid';
  budget: BudgetDraft;
  social?: SocialDraft;
  deals: DealId[];
  spent: number;
  whip: ReturnType<typeof tally>;
  senateVotes: number;
  senateThreshold: number;
  status: 'passed' | 'failed' | 'filibustered';
  passed: boolean;
  cloutBack: number;
  cloutDelta: number;
}

const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Known deal ids only, each once, in first-seen order; anything that is not an array of ids gives []. */
export function knownDeals(ids: unknown): DealId[] {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids)].filter((id): id is DealId => typeof id === 'string' && DEALS.some((d) => d.id === id));
}

export function cloutCost(ids: unknown): number {
  return knownDeals(ids).reduce((n, id) => n + DEALS.find((d) => d.id === id)!.cost, 0);
}

/**
 * Rebuilds a budget from the known lever ids only (T-1-02, T-1-05): own properties are read via
 * Object.hasOwn, the untrusted object is never spread or iterated, non-finite values fall back to
 * the lever base and the rest are clamped into the lever's range. A non-object gives the base budget.
 */
export function sanitizeBudget(d: unknown): BudgetDraft {
  const src = isRecord(d) ? d : {};
  const out: BudgetDraft = {};
  for (const l of [...taxLevers, ...spendLevers]) {
    const v: unknown = Object.hasOwn(src, l.id) ? src[l.id] : undefined;
    out[l.id] = typeof v === 'number' && Number.isFinite(v) ? Math.min(l.max, Math.max(l.min, v)) : l.base;
  }
  return out;
}

/** THE shared pure function: the engine charges with it and the Session previews with it. */
export function resolveBill(
  clout: number,
  bill: unknown,
  houseDelta = 0,
  senateDelta = 0,
  filibusterRule: FilibusterRule = 'sixty_vote',
  approval = C.approvalNeutral,
): BillResult {
  const b = isRecord(bill) ? bill : {};
  const ids = knownDeals(b.deals);
  const spent = cloutCost(ids);
  const budget = sanitizeBudget(b.budget);
  const social = Object.hasOwn(b, 'social') && b.social !== undefined ? sanitizeSocial(b.social) : undefined;
  const whip = tally(ids, houseDelta, social);

  const isSubstantive = Boolean(social && !isSocialBaseline(social));
  const senateThreshold = isSubstantive ? getSenateClotureThreshold(filibusterRule, approval) : SENATE_SIMPLE_MAJORITY;
  const appeal = billBipartisanAppeal(ids, social);
  const playerSenateSeats = SENATE_BASE_SEATS + senateDelta;
  const senateVotes = calculateSenateVotes(playerSenateSeats, approval, appeal);

  const housePassed = whip.total >= TO_PASS;
  const senatePassed = senateVotes >= senateThreshold;

  let status: 'passed' | 'failed' | 'filibustered' = 'failed';
  let passed = false;
  if (housePassed && senatePassed) {
    status = 'passed';
    passed = true;
  } else if (housePassed && !senatePassed) {
    status = 'filibustered';
    passed = false;
  } else {
    status = 'failed';
    passed = false;
  }

  const { cloutBack } = voteOutcome(passed ? TO_PASS : 0, spent);
  const rejected = (reason: 'unaffordable' | 'invalid'): BillResult =>
    ({ valid: false, reason, budget, social, deals: ids, spent, whip, senateVotes, senateThreshold, status: 'failed', passed: false, cloutBack: 0, cloutDelta: 0 });
  if (!isRecord(bill) || !isRecord(bill.budget) || !Array.isArray(bill.deals)) return rejected('invalid');
  if (spent > clout) return rejected('unaffordable');

  return { valid: true, budget, social, deals: ids, spent, whip, senateVotes, senateThreshold, status, passed, cloutBack, cloutDelta: cloutBack - spent };
}

export function resolveCrisisChoice(
  clout: number,
  crisisId: unknown,
  optionId: unknown,
  turn: number,
): CrisisChoiceResult {
  const rejected = (reason: 'unaffordable' | 'invalid'): CrisisChoiceResult => ({
    valid: false,
    reason,
    crisisId: typeof crisisId === 'string' ? crisisId : '',
    optionId: typeof optionId === 'string' ? optionId : '',
    cloutCost: 0,
    modifiers: [],
    scheduled: [],
  });

  if (typeof crisisId !== 'string' || typeof optionId !== 'string') return rejected('invalid');
  const def = getCrisis(crisisId);
  if (!def) return rejected('invalid');
  const opt = def.options.find((o) => o.id === optionId);
  if (!opt) return rejected('invalid');
  if (opt.cloutCost > clout) return rejected('unaffordable');

  const modifiers: Modifier[] = opt.effects.map((eff) => ({
    id: `event:${crisisId}:${optionId}#${eff.channel}#t${turn}`,
    group: `event:${crisisId}`,
    source: `event:${crisisId}`,
    channel: eff.channel,
    amount: eff.amount,
    from: turn,
    until: turn,
    tag: 'event',
  }));

  const scheduled: Scheduled[] = [];
  if (opt.scheduledKind) {
    const quarters = typeof opt.scheduledData?.quarters === 'number' ? opt.scheduledData.quarters : 1;
    scheduled.push({
      id: `event:${crisisId}:scheduled#t${turn + 1}`,
      kind: opt.scheduledKind,
      due: turn + quarters,
      data: opt.scheduledData ?? {},
    });
  }

  return {
    valid: true,
    crisisId,
    optionId,
    cloutCost: opt.cloutCost,
    modifiers,
    scheduled,
  };
}

export function autopilotDecisions(state: {
  readonly activeCrisis: {
    readonly crisisId: string;
    readonly options: readonly { readonly id: string; readonly autopilot?: boolean }[];
  } | null;
}): Decisions {
  if (!state.activeCrisis) return {};
  const opt = state.activeCrisis.options.find((o) => o.autopilot);
  return opt ? { crisis: { crisisId: state.activeCrisis.crisisId, optionId: opt.id } } : {};
}

