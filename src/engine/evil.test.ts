import { describe, expect, it } from 'vitest';
import { baseline } from './budget';
import { C } from './coefficients';
import { resolveBill } from './decisions';
import {
  calculateHeatDecay,
  calculateHeatPenalties,
  defaultEvilState,
  sanitizeEvilState,
  type EvilState,
} from './evil';
import { START } from './fixture';
import { endTurn, newGame } from './game';
import { MAX_HEAT, MIN_HEAT } from './units';

describe('Evil Mode Engine (EVIL-01, EVIL-02, EVIL-03)', () => {
  describe('defaultEvilState', () => {
    it('initializes clean zeroed state', () => {
      const state = defaultEvilState();
      expect(state.offshoreStashBn).toBe(0);
      expect(state.heat).toBe(0);
      expect(state.investigationsActive).toBe(false);
      expect(state.specialCounselAppointed).toBe(false);
      expect(state.articlesOfImpeachmentVoted).toBe(false);
      expect(state.convicted).toBe(false);
    });
  });

  describe('calculateHeatDecay', () => {
    it('decays heat by the quarterly natural rate', () => {
      const initial = 40;
      const decayed = calculateHeatDecay(initial);
      expect(decayed).toBeCloseTo(initial - C.heatDecayQuarterly, 6);
    });

    it('clamps at MIN_HEAT (0)', () => {
      expect(calculateHeatDecay(1)).toBe(MIN_HEAT);
      expect(calculateHeatDecay(0)).toBe(MIN_HEAT);
      expect(calculateHeatDecay(-10)).toBe(MIN_HEAT);
    });

    it('clamps at MAX_HEAT (100) if initial is above', () => {
      expect(calculateHeatDecay(120, 1)).toBe(MAX_HEAT);
    });

    it('handles non-finite values safely', () => {
      expect(calculateHeatDecay(NaN)).toBe(MIN_HEAT);
      expect(calculateHeatDecay(Infinity)).toBe(MIN_HEAT);
    });

    it('accepts custom decay rate', () => {
      expect(calculateHeatDecay(50, 10)).toBe(40);
    });
  });

  describe('calculateHeatPenalties', () => {
    it('returns zero penalties at zero heat', () => {
      const penalties = calculateHeatPenalties(0);
      expect(penalties.approvalDelta).toBe(0);
      expect(penalties.trustDelta).toBe(0);
      expect(penalties.congressFrictionVotes).toBe(0);
      expect(penalties.senateFrictionVotes).toBe(0);
    });

    it('calculates proportional penalties across heat spectrum', () => {
      const heat50 = calculateHeatPenalties(50);
      expect(heat50.approvalDelta).toBeCloseTo(-50 * C.heatApprovalPenalty, 6);
      expect(heat50.trustDelta).toBeCloseTo(-50 * C.heatTrustPenalty, 6);
      expect(heat50.congressFrictionVotes).toBe(Math.round(50 * C.heatCongressionalFriction));
      expect(heat50.senateFrictionVotes).toBe(Math.round(50 * C.heatSenateFriction));

      const heat100 = calculateHeatPenalties(MAX_HEAT);
      expect(heat100.approvalDelta).toBeCloseTo(-100 * C.heatApprovalPenalty, 6);
      expect(heat100.trustDelta).toBeCloseTo(-100 * C.heatTrustPenalty, 6);
      expect(heat100.congressFrictionVotes).toBe(Math.round(100 * C.heatCongressionalFriction));
      expect(heat100.senateFrictionVotes).toBe(Math.round(100 * C.heatSenateFriction));
    });

    it('safely clamps out-of-bounds or non-finite heat', () => {
      const negative = calculateHeatPenalties(-20);
      expect(negative.approvalDelta).toBe(0);

      const overflow = calculateHeatPenalties(150);
      expect(overflow.approvalDelta).toBeCloseTo(-100 * C.heatApprovalPenalty, 6);

      const nan = calculateHeatPenalties(NaN);
      expect(nan.approvalDelta).toBe(0);
    });
  });

  describe('sanitizeEvilState', () => {
    it('returns default state for null or non-object inputs', () => {
      expect(sanitizeEvilState(null)).toEqual(defaultEvilState());
      expect(sanitizeEvilState(undefined)).toEqual(defaultEvilState());
      expect(sanitizeEvilState('malformed')).toEqual(defaultEvilState());
      expect(sanitizeEvilState(42)).toEqual(defaultEvilState());
    });

    it('sanitizes partial or dirty values', () => {
      const dirty = {
        offshoreStashBn: -5,
        heat: 150,
        investigationsActive: 1,
        specialCounselAppointed: 'yes',
      };
      const clean = sanitizeEvilState(dirty);
      expect(clean.offshoreStashBn).toBe(0);
      expect(clean.heat).toBe(MAX_HEAT);
      expect(clean.investigationsActive).toBe(true);
      expect(clean.specialCounselAppointed).toBe(true);
      expect(clean.articlesOfImpeachmentVoted).toBe(false);
      expect(clean.convicted).toBe(false);
    });

    it('preserves valid state intact', () => {
      const valid: EvilState = {
        offshoreStashBn: 12.5,
        heat: 45,
        investigationsActive: true,
        specialCounselAppointed: false,
        articlesOfImpeachmentVoted: false,
        convicted: false,
      };
      expect(sanitizeEvilState(valid)).toEqual(valid);
    });
  });

  describe('Game loop integration & friction (EVIL-02, EVIL-03)', () => {
    it('initializes game with zero heat and stash', () => {
      const state = newGame(1, START);
      expect(state.evil).toBeDefined();
      expect(state.evil?.heat).toBe(0);
      expect(state.evil?.offshoreStashBn).toBe(0);
    });

    it('accumulates stash and heat via decisions, and triggers institutional thresholds', () => {
      let state = newGame(1, START);

      // Siphon funds and add heat
      state = endTurn(state, { evil: { siphonBn: 15.0, heatDelta: 55 } });
      expect(state.evil?.offshoreStashBn).toBe(15.0);
      expect(state.evil?.heat).toBe(55);
      expect(state.evil?.specialCounselAppointed).toBe(true);
      expect(state.evil?.articlesOfImpeachmentVoted).toBe(false);
      expect(state.report.log.some((l) => l.id === 'special_counsel_appointed')).toBe(true);

      // Heat penalties reflected in approval and trust trace
      expect(state.report.trace.approval?.some((t) => t.source === 'approval:evil')).toBe(true);
      expect(state.report.trace.trust?.some((t) => t.source === 'trust:evil')).toBe(true);

      // Escalate heat to impeachment threshold
      state = endTurn(state, { evil: { heatDelta: 25 } });
      expect(state.evil?.articlesOfImpeachmentVoted).toBe(true);
      expect(state.report.log.some((l) => l.id === 'articles_of_impeachment')).toBe(true);

      // Escalate to conviction
      state = endTurn(state, { evil: { heatDelta: 20 } });
      expect(state.evil?.convicted).toBe(true);
      expect(state.report.log.some((l) => l.id === 'convicted')).toBe(true);
    });

    it('applies natural heat decay over peaceful quarters', () => {
      let state = newGame(1, START);
      state = endTurn(state, { evil: { heatDelta: 30 } });
      const heatT1 = state.evil?.heat ?? 0;
      expect(heatT1).toBe(30);

      // Turn with no corrupt actions: natural decay applies
      state = endTurn(state, {});
      expect(state.evil?.heat).toBeCloseTo(heatT1 - C.heatDecayQuarterly, 6);
    });

    it('applies legislative friction to House and Senate votes at high heat', () => {
      const budget = baseline();
      const deals = ['mod' as const, 'cen' as const];

      // At zero heat: bill passes (203 + 12 + 9 = 224 >= 218)
      const cleanBill = resolveBill(120, { budget, deals }, 0, 0, 'sixty_vote', 50, 0);
      expect(cleanBill.passed).toBe(true);
      expect(cleanBill.status).toBe('passed');

      // At high heat (80): legislative friction (8 votes) pulls House below 218 (224 - 8 = 216)
      const hotBill = resolveBill(120, { budget, deals }, 0, 0, 'sixty_vote', 50, 80);
      expect(hotBill.passed).toBe(false);
      expect(hotBill.status).toBe('failed');
      expect(hotBill.senateVotes).toBeLessThan(cleanBill.senateVotes);
    });
  });
});
