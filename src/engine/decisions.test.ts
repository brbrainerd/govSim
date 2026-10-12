import { describe, expect, it } from 'vitest';
import { fromPackage, spendLevers, taxLevers } from './budget';
import { C } from './coefficients';
import type { DealId } from './congress';
import { cloutCost, knownDeals, resolveBill, sanitizeBudget, type Bill } from './decisions';
import { enact, START } from './fixture';
import { endTurn, newGame } from './game';

const ALL: DealId[] = ['mod', 'cen', 'spc'];
const subsets = Array.from({ length: 8 }, (_, m) => ALL.filter((_, i) => m & (1 << i)));
const at = (clout: number) => ({ ...newGame(1, START), clout });
const LEVER_IDS = [...taxLevers, ...spendLevers].map((l) => l.id);

describe('FND-05: preview equals charge', () => {
  it('endTurn charges exactly resolveBill plus approval income, for every subset, budget and clout', () => {
    for (const deals of subsets) {
      for (const pack of ['Infrastructure push', 'Tax cut'] as const) {
        for (const c of [0, 14, 15, 44, 45, 120]) {
          const bill: Bill = { budget: fromPackage(pack), deals };
          const r = resolveBill(c, bill);
          const next = endTurn(at(c), { bill });
          expect(next.clout, `${pack} [${deals}] @${c}`).toBe(c + r.cloutDelta + Math.round(next.approval / C.cloutPerApproval));
          expect(r.valid).toBe(cloutCost(deals) <= c);
        }
      }
    }
  });

  it('affordability edges', () => {
    const bill = (deals: DealId[]): Bill => ({ budget: fromPackage('Keep as is'), deals });
    expect(resolveBill(45, bill(ALL)).valid).toBe(true);
    expect(resolveBill(44, bill(ALL)).valid).toBe(false);
    expect(resolveBill(15, bill(['cen'])).valid).toBe(true);
    expect(resolveBill(14, bill(['cen'])).valid).toBe(false);
  });

  it('an unaffordable bill changes no policy, charges nothing and is logged', () => {
    const state = at(44);
    const next = endTurn(state, enact(fromPackage('Infrastructure push')));
    expect(next.policy).toEqual(state.policy);
    expect(next.report.log).toEqual([{ kind: 'bill', id: 'rejected', detail: 'unaffordable' }]);
    expect(next.clout).toBe(44 + Math.round(next.approval / C.cloutPerApproval));
  });

  it('enact passes the House from the starting clout', () => {
    const bill = enact(fromPackage('Infrastructure push')).bill!;
    expect(resolveBill(120, bill).passed).toBe(true);
    expect(endTurn(newGame(1, START), { bill }).policy).toEqual(fromPackage('Infrastructure push'));
  });
});

describe('tampered bills never mint clout or corrupt policy', () => {
  it('charges duplicate deals once and ignores unknown ids', () => {
    expect(cloutCost(['mod', 'mod'])).toBe(20);
    expect(cloutCost(['zzz'])).toBe(0);
    expect(knownDeals(['cen', 'zzz', 'cen', 'mod'])).toEqual(['cen', 'mod']);
    const budget = fromPackage('Keep as is');
    expect(resolveBill(120, { budget, deals: ['zzz' as DealId] }).whip).toEqual(resolveBill(120, { budget, deals: [] }).whip);
  });

  it('drops __proto__ and unknown lever keys', () => {
    const evil = JSON.parse('{"__proto__": {"inc": 5}, "inc": 30, "foo": 1}') as Record<string, number>;
    const out = sanitizeBudget(evil);
    expect(Object.keys(out).sort()).toEqual([...LEVER_IDS].sort());
    expect(out.inc).toBe(30);
    expect(out).not.toHaveProperty('foo');
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    expect(({} as Record<string, number>).inc).toBeUndefined();
    const next = endTurn(at(120), { bill: { budget: evil, deals: ALL } });
    expect(Object.keys(next.policy).sort()).toEqual([...LEVER_IDS].sort());
    expect(next.policy.inc).toBe(30);
  });

  it('falls back to base for non-finite levers and clamps out-of-range ones', () => {
    const out = sanitizeBudget({ inc: NaN, bus: Infinity, inv: -Infinity, pay: '9' as unknown as number, tar: 999, def: -5, rds: 999 });
    expect(out.inc).toBe(22);
    expect(out.bus).toBe(21);
    expect(out.inv).toBe(20);
    expect(out.pay).toBe(15.3);
    expect(out.tar).toBe(40);
    expect(out.def).toBe(80);
    expect(out.rds).toBe(130);
    expect(sanitizeBudget({ inc: 999 }).inc).toBe(40);
    expect(sanitizeBudget({ inc: -5 }).inc).toBe(10);
  });

  it('does not mutate the decisions it is given', () => {
    const decisions = enact({ ...fromPackage('Tax cut'), inc: 999 });
    const frozen = structuredClone(decisions);
    endTurn(at(120), decisions);
    expect(decisions).toEqual(frozen);
  });
});

describe('malformed decisions are rejected, never thrown on (01-REVIEW WR-01)', () => {
  it('handles non-object budgets, non-array deals and non-object bills', () => {
    for (const bill of [null, 5, 'x', [], { budget: null, deals: 5 }, { budget: [], deals: [] }, { budget: {}, deals: 'mod' }]) {
      const r = resolveBill(120, bill);
      expect(r.valid, JSON.stringify(bill)).toBe(false);
      expect(r.reason).toBe('invalid');
      const next = endTurn(at(120), { bill } as never);
      expect(next.policy).toEqual(at(120).policy);
      expect(next.report.log).toEqual([{ kind: 'bill', id: 'rejected', detail: 'invalid' }]);
    }
    expect(sanitizeBudget(null)).toEqual(sanitizeBudget({}));
    expect(knownDeals('mod')).toEqual([]);
  });

  it('treats null or non-object decisions as no decisions', () => {
    for (const d of [null, 7, 'x']) expect(endTurn(at(120), d as never)).toEqual(endTurn(at(120), {}));
  });
});
