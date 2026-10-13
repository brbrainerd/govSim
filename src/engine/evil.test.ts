import { describe, expect, it } from 'vitest';
import { baseline } from './budget';
import { C } from './coefficients';
import { resolveBill } from './decisions';
import {
  calculateHeatDecay,
  calculateHeatPenalties,
  defaultEvilState,
  resolveEvilLevers,
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

      // Siphon funds and add heat to trigger Special Counsel (>60 heat)
      state = endTurn(state, { evil: { siphonBn: 15.0, heatDelta: 65 } });
      expect(state.evil?.offshoreStashBn).toBe(15.0);
      expect(state.evil?.heat).toBe(65);
      expect(state.evil?.specialCounselAppointed).toBe(true);
      expect(state.evil?.articlesOfImpeachmentVoted).toBe(false);
      expect(state.report.log.some((l) => l.id === 'special_counsel_appointed')).toBe(true);

      // Heat penalties reflected in approval and trust trace, and special counsel clout drain
      expect(state.report.trace.approval?.some((t) => t.source === 'approval:evil')).toBe(true);
      expect(state.report.trace.trust?.some((t) => t.source === 'trust:evil')).toBe(true);
      expect(state.report.trace.clout?.some((t) => t.source === 'clout:special_counsel')).toBe(true);

      // Escalate heat to impeachment threshold (>80 heat)
      state = endTurn(state, { evil: { heatDelta: 20 } });
      expect(state.evil?.articlesOfImpeachmentVoted).toBe(true);
      expect(state.report.log.some((l) => l.id === 'articles_of_impeachment')).toBe(true);

      // Escalate to conviction (>90 heat)
      state = endTurn(state, { evil: { heatDelta: 15 } });
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

  describe('resolveEvilLevers (LEVER-01, LEVER-02, LEVER-03)', () => {
    it('returns empty result when no levers are requested', () => {
      const res = resolveEvilLevers([], 100);
      expect(res.cloutCost).toBe(0);
      expect(res.stashDeltaBn).toBe(0);
      expect(res.heatDelta).toBe(0);
      expect(res.enactedLevers).toEqual([]);
      expect(res.logEntries).toEqual([]);

      const resUndef = resolveEvilLevers(undefined, 100);
      expect(resUndef.cloutCost).toBe(0);
      expect(resUndef.enactedLevers).toEqual([]);
    });

    it('resolves siphoning levers with correct kickbacks, heat, and costs', () => {
      const res = resolveEvilLevers(['crony_contracts', 'sell_tariff_exemptions'], 100);
      expect(res.cloutCost).toBe(C.evilCronyCloutCost + C.evilTariffCloutCost);
      expect(res.stashDeltaBn).toBe(C.evilCronyKickbackBn + C.evilTariffKickbackBn);
      expect(res.heatDelta).toBe(C.evilCronyHeatDelta + C.evilTariffHeatDelta);
      expect(res.approvalDelta).toBe(-(C.evilCronyApprovalCost + C.evilTariffApprovalCost));
      expect(res.trustDelta).toBe(-(C.evilCronyTrustCost + C.evilTariffTrustCost));
      expect(res.enactedLevers).toEqual(['crony_contracts', 'sell_tariff_exemptions']);
      expect(res.logEntries).toHaveLength(2);
    });

    it('resolves suppression levers with negative heat and zero stash kickback', () => {
      const res = resolveEvilLevers(['fire_inspectors_general'], 50);
      expect(res.cloutCost).toBe(C.evilFireIgCloutCost);
      expect(res.stashDeltaBn).toBe(0);
      expect(res.heatDelta).toBe(-C.evilFireIgHeatSuppression);
      expect(res.trustDelta).toBe(-C.evilFireIgTrustCost);
      expect(res.enactedLevers).toEqual(['fire_inspectors_general']);
    });

    it('enforces clout limits and skips unaffordable levers', () => {
      // Clout is 20: crony_contracts costs 15 (affordable, leaving 5). auction_public_lands costs 20 (unaffordable, skipped).
      const res = resolveEvilLevers(['crony_contracts', 'auction_public_lands'], 20);
      expect(res.enactedLevers).toEqual(['crony_contracts']);
      expect(res.cloutCost).toBe(C.evilCronyCloutCost);
      expect(res.stashDeltaBn).toBe(C.evilCronyKickbackBn);
      expect(res.logEntries.some((l) => l.id === 'auction_public_lands_unaffordable')).toBe(true);
    });

    it('deduplicates duplicate lever requests', () => {
      const res = resolveEvilLevers(['crony_contracts', 'crony_contracts'], 100);
      expect(res.enactedLevers).toEqual(['crony_contracts']);
      expect(res.cloutCost).toBe(C.evilCronyCloutCost);
    });
  });

  describe('Corrupt Executive Levers Game Loop Integration (LEVER-01, LEVER-02, LEVER-03)', () => {
    it('enacts corrupt actions in step(), siphons stash, and charges clout', () => {
      let state = newGame(1, START);
      const initialClout = state.clout;

      state = endTurn(state, {
        evil: {
          enactedLevers: ['crony_contracts', 'auction_public_lands'],
        },
      });

      // Verify offshore stash accumulated kickbacks ($15B + $25B = $40B)
      expect(state.evil?.offshoreStashBn).toBe(40);

      // Verify heat generated (+14 + +22 = 36)
      expect(state.evil?.heat).toBe(36);

      // Verify clout ledger term recorded
      const cloutEvilTerm = state.report.trace.clout?.find((t) => t.source === 'clout:evil_levers');
      expect(cloutEvilTerm).toBeDefined();
      expect(cloutEvilTerm?.amount).toBe(-(C.evilCronyCloutCost + C.evilLandCloutCost));

      // Verify approval and trust traces recorded
      expect(state.report.trace.approval?.some((t) => t.source === 'approval:evil_levers')).toBe(true);
      expect(state.report.trace.trust?.some((t) => t.source === 'trust:evil_levers')).toBe(true);

      // Now enact watchdog suppression on turn 2
      const heatBeforeSuppression = state.evil?.heat ?? 0;
      state = endTurn(state, {
        evil: {
          enactedLevers: ['fire_inspectors_general'],
        },
      });

      // Heat decayed naturally (-3) and suppressed (-20)
      const expectedHeat = Math.max(0, heatBeforeSuppression - C.heatDecayQuarterly - C.evilFireIgHeatSuppression);
      expect(state.evil?.heat).toBeCloseTo(expectedHeat, 4);
    });
  });
});
