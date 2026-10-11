// Decisions are raw player choices (FND-05). The engine and the UI preview call the same pure
// functions here, so the clout shown before Next turn is the clout charged at Next turn, and a
// hand-edited decision (a Phase 2 save is an input log) cannot mint clout.

import type { BudgetDraft } from './budget';
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

/** THE shared pure function: the engine charges with it and the Session previews with it. */
export function resolveBill(clout: number, bill: Bill): BillResult {
  const ids = knownDeals(bill.deals);
  const spent = cloutCost(ids);
  const whip = tally(ids);
  const budget = bill.budget;
  if (spent > clout) return { valid: false, reason: 'unaffordable', budget, deals: ids, spent, whip, passed: false, cloutBack: 0, cloutDelta: 0 };
  const { passed, cloutBack } = voteOutcome(whip.total, spent);
  return { valid: true, budget, deals: ids, spent, whip, passed, cloutBack, cloutDelta: cloutBack - spent };
}
