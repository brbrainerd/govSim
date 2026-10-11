// Decisions are raw player choices (FND-05). The engine and the UI preview call the same pure
// functions here, so the clout shown before Next turn is the clout charged at Next turn, and a
// hand-edited decision (a Phase 2 save is an input log) cannot mint clout.

import { spendLevers, taxLevers, type BudgetDraft } from './budget';
import { deals as DEALS, tally, voteOutcome, type DealId } from './congress';

export interface Bill { budget: BudgetDraft; deals: DealId[] }
/** Phases 4/5 add keys here (crisis, orders, fed, speech). There is deliberately no clout field. */
export interface Decisions { bill?: Bill }

export interface BillResult {
  valid: boolean;
  reason?: 'unaffordable';
  budget: BudgetDraft;
  deals: DealId[];
  spent: number;
  whip: ReturnType<typeof tally>;
  passed: boolean;
  cloutBack: number;
  cloutDelta: number;
}

/** Known deal ids only, each once, in first-seen order. */
export function knownDeals(ids: readonly string[]): DealId[] {
  return [...new Set(ids)].filter((id): id is DealId => DEALS.some((d) => d.id === id));
}

export function cloutCost(ids: readonly string[]): number {
  return knownDeals(ids).reduce((n, id) => n + DEALS.find((d) => d.id === id)!.cost, 0);
}

/**
 * Rebuilds a budget from the known lever ids only (T-1-02, T-1-05): own properties are read via
 * Object.hasOwn, the untrusted object is never spread or iterated, non-finite values fall back to
 * the lever base and the rest are clamped into the lever's range.
 */
export function sanitizeBudget(d: BudgetDraft): BudgetDraft {
  const out: BudgetDraft = {};
  for (const l of [...taxLevers, ...spendLevers]) {
    const v: unknown = Object.hasOwn(d, l.id) ? d[l.id] : undefined;
    out[l.id] = typeof v === 'number' && Number.isFinite(v) ? Math.min(l.max, Math.max(l.min, v)) : l.base;
  }
  return out;
}

/** THE shared pure function: the engine charges with it and the Session previews with it. */
export function resolveBill(clout: number, bill: Bill): BillResult {
  const ids = knownDeals(bill.deals);
  const spent = cloutCost(ids);
  const whip = tally(ids);
  const budget = sanitizeBudget(bill.budget);
  if (spent > clout) return { valid: false, reason: 'unaffordable', budget, deals: ids, spent, whip, passed: false, cloutBack: 0, cloutDelta: 0 };
  const { passed, cloutBack } = voteOutcome(whip.total, spent);
  return { valid: true, budget, deals: ids, spent, whip, passed, cloutBack, cloutDelta: cloutBack - spent };
}
