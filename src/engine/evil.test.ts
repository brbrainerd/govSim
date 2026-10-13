import { describe, expect, it } from 'vitest';
import { C } from './coefficients';
import {
  calculateHeatDecay,
  calculateHeatPenalties,
  defaultEvilState,
  sanitizeEvilState,
  type EvilState,
} from './evil';
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
    });

    it('calculates proportional penalties across heat spectrum', () => {
      const heat50 = calculateHeatPenalties(50);
      expect(heat50.approvalDelta).toBeCloseTo(-50 * C.heatApprovalPenalty, 6);
      expect(heat50.trustDelta).toBeCloseTo(-50 * C.heatTrustPenalty, 6);
      expect(heat50.congressFrictionVotes).toBe(Math.round(50 * C.heatCongressionalFriction));

      const heat100 = calculateHeatPenalties(MAX_HEAT);
      expect(heat100.approvalDelta).toBeCloseTo(-100 * C.heatApprovalPenalty, 6);
      expect(heat100.trustDelta).toBeCloseTo(-100 * C.heatTrustPenalty, 6);
      expect(heat100.congressFrictionVotes).toBe(Math.round(100 * C.heatCongressionalFriction));
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
});
