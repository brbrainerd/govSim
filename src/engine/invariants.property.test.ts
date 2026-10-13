// Property-based testing of engine invariants across random seeds and decision sequences (OBS-03).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { conservationErrors } from '../testing/conservation';
import { spendLevers, taxLevers, type BudgetDraft } from './budget';
import { LIMITS } from './coefficients';
import { deals as DEALS, type DealId } from './congress';
import { START } from './fixture';
import { endTurn, newGame, type Decisions, type GameState } from './game';
import { stableHash } from './hash';
import { socialLevers, type SocialDraft } from './social';

const allLevers = [...taxLevers, ...spendLevers];
const dealIds = DEALS.map((d) => d.id as DealId);

// Arbitrary budget generator picking values within valid lever ranges
const arbBudget = fc.record(
  Object.fromEntries(
    allLevers.map((l) => [
      l.id,
      fc.float({ min: l.min, max: l.max, noNaN: true }),
    ]),
  ),
) as fc.Arbitrary<BudgetDraft>;

// Arbitrary social policy generator picking values within valid lever ranges
const arbSocial = fc.record(
  Object.fromEntries(
    socialLevers.map((l) => [
      l.id,
      fc.float({ min: l.min, max: l.max, noNaN: true }),
    ]),
  ),
) as fc.Arbitrary<SocialDraft>;

// Arbitrary deals generator picking a unique subset of known deals
const arbDeals = fc.subarray(dealIds);

// Arbitrary single-turn Decisions generator
const arbDecisions: fc.Arbitrary<Decisions> = fc.oneof(
  fc.constant({}),
  fc.record({
    bill: fc.record({
      budget: arbBudget,
      deals: arbDeals,
    }),
  }),
  fc.record({
    social: arbSocial,
  }),
  fc.record({
    bill: fc.record({
      budget: arbBudget,
      deals: arbDeals,
    }),
    social: arbSocial,
  }),
);

describe('engine invariants property tests (OBS-03)', () => {
  it('preserves finiteness, bounds, conservation, and determinism over 1000 randomized games', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.array(arbDecisions, { minLength: 1, maxLength: 32 }),
        (seed, decisionSeq) => {
          let s: GameState = newGame(seed, START);

          for (let turn = 1; turn <= decisionSeq.length; turn++) {
            const decision = decisionSeq[turn - 1]!;
            const before = s;
            const next = endTurn(before, decision);

            // 1. Finiteness of all numerical fields
            expect(Number.isFinite(next.approval)).toBe(true);
            expect(Number.isFinite(next.clout)).toBe(true);
            for (const [k, v] of Object.entries(next.econ)) {
              expect(Number.isFinite(v), `econ.${k} must be finite`).toBe(true);
            }
            expect(Number.isFinite(next.report.luck.gap)).toBe(true);
            expect(Number.isFinite(next.report.luck.infl)).toBe(true);
            expect(Number.isFinite(next.report.luck.appr)).toBe(true);

            // 2. Hard limits and clamp bounds
            expect(next.approval).toBeGreaterThanOrEqual(LIMITS.approval.bounds[0]);
            expect(next.approval).toBeLessThanOrEqual(LIMITS.approval.bounds[1]);

            expect(next.econ.unemployment).toBeGreaterThanOrEqual(LIMITS.unemployment.bounds[0]);
            expect(next.econ.unemployment).toBeLessThanOrEqual(LIMITS.unemployment.bounds[1]);

            expect(next.econ.inflation).toBeGreaterThanOrEqual(LIMITS.inflation.bounds[0]);
            expect(next.econ.inflation).toBeLessThanOrEqual(LIMITS.inflation.bounds[1]);

            expect(next.econ.fedRate).toBeGreaterThanOrEqual(LIMITS.fedRate.bounds[0]);
            expect(next.econ.fedRate).toBeLessThanOrEqual(LIMITS.fedRate.bounds[1]);

            expect(next.econ.gini).toBeGreaterThanOrEqual(LIMITS.gini.bounds[0]);
            expect(next.econ.gini).toBeLessThanOrEqual(LIMITS.gini.bounds[1]);

            expect(next.econ.trust).toBeGreaterThanOrEqual(LIMITS.trust.bounds[0]);
            expect(next.econ.trust).toBeLessThanOrEqual(LIMITS.trust.bounds[1]);

            expect(next.econ.realIncome).toBeGreaterThanOrEqual(START.medianIncome * LIMITS.income.bounds[0]);
            expect(next.econ.realIncome).toBeLessThanOrEqual(START.medianIncome * LIMITS.income.bounds[1]);

            // 3. Conservation holds on every step
            const errors = conservationErrors(before, next);
            expect(errors).toEqual([]);

            // 4. Determinism: repeating the step on cloned state yields identical hash
            const clonedBefore: GameState = JSON.parse(JSON.stringify(before));
            const replayed = endTurn(clonedBefore, decision);
            expect(stableHash(replayed)).toBe(stableHash(next));

            s = next;
          }
        },
      ),
      { numRuns: 1000 },
    );
  });
});
