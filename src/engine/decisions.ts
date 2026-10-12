// Decisions are raw player choices (FND-05). The engine and the UI preview call the same pure
// functions here, so the clout shown before Next turn is the clout charged at Next turn, and a
// hand-edited decision (a Phase 2 save is an input log) cannot mint clout or crash a replay:
// anything malformed is rejected, never trusted and never thrown on.

import { spendLevers, taxLevers, type BudgetDraft } from './budget';
import { deals as DEALS, tally, voteOutcome, type DealId } from './congress';
import { getCrisis } from './crises';
import type { Modifier, Scheduled } from './modifiers';

export interface Bill { budget: BudgetDraft; deals: DealId[] }

export interface CrisisDecision {
  crisisId: string;
  optionId: string;
}

/** Phases 4/5 add keys here (crisis, orders, fed, speech). There is deliberately no clout field. */
export interface Decisions {
  bill?: Bill;
  crisis?: CrisisDecision;
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
  deals: DealId[];
  spent: number;
  whip: ReturnType<typeof tally>;
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
export function resolveBill(clout: number, bill: unknown): BillResult {
  const b = isRecord(bill) ? bill : {};
  const ids = knownDeals(b.deals);
  const spent = cloutCost(ids);
  const whip = tally(ids);
  const budget = sanitizeBudget(b.budget);
  const rejected = (reason: 'unaffordable' | 'invalid'): BillResult =>
    ({ valid: false, reason, budget, deals: ids, spent, whip, passed: false, cloutBack: 0, cloutDelta: 0 });
  if (!isRecord(bill) || !isRecord(bill.budget) || !Array.isArray(bill.deals)) return rejected('invalid');
  if (spent > clout) return rejected('unaffordable');
  const { passed, cloutBack } = voteOutcome(whip.total, spent);
  return { valid: true, budget, deals: ids, spent, whip, passed, cloutBack, cloutDelta: cloutBack - spent };
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

