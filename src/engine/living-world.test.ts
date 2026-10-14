import { describe, expect, it } from 'vitest';
import { newGame, endTurn } from './game';
import { START } from './fixture';
import { parseSave, serializeSave, validateDecisions } from '../app/save';
import { isValidDynamicCrisisDelta, isValidTurnEntropy } from './decisions';
import { C } from './coefficients';
import { stableHash } from './hash';

describe('Living World Mode & Dynamic Crisis Delta (AI-01, AI-04)', () => {
  it('standard runs without turnEntropy execute identically', () => {
    const s1 = endTurn(newGame(100, START), {});
    const s2 = endTurn(newGame(100, START), {});
    expect(stableHash(s1)).toBe(stableHash(s2));
    expect(s1.report.trace.gap?.some((t) => t.source === 'event:living_world_variance')).toBeFalsy();
  });

  it('runs with turnEntropy produce emergent Living World variance', () => {
    const s1 = endTurn(newGame(100, START), { turnEntropy: 42 });
    const s2 = endTurn(newGame(100, START), { turnEntropy: 999999 });

    // Both should contain living world variance term in their gap traces
    expect(s1.report.trace.gap?.some((t) => t.source === 'event:living_world_variance')).toBe(true);
    expect(s2.report.trace.gap?.some((t) => t.source === 'event:living_world_variance')).toBe(true);

    // Different entropy seeds must produce different macro outcomes
    expect(stableHash(s1)).not.toBe(stableHash(s2));
    expect(s1.econ.gap).not.toBe(s2.econ.gap);
  });

  it('identical turnEntropy produces 100% deterministic replay', () => {
    const run1 = endTurn(newGame(12345, START), { turnEntropy: 101010 });
    const run2 = endTurn(newGame(12345, START), { turnEntropy: 101010 });
    expect(stableHash(run1)).toBe(stableHash(run2));
  });

  it('serializes and replays a Living World game with bit-identical hash verification', () => {
    const start = START;
    const seed = 54321;
    let state = newGame(seed, start);
    const inputs = [
      { turnEntropy: 11111 },
      { turnEntropy: 22222 },
      { turnEntropy: 33333 },
    ];
    for (const inp of inputs) {
      state = endTurn(state, inp);
    }

    const sessionLike = {
      current: state,
      options: { party: 'D' as const, livingWorld: true },
      inputs,
    };

    const json = serializeSave(sessionLike);
    const restored = parseSave(json);
    expect(restored.options.livingWorld).toBe(true);
    expect(restored.inputs[0]?.turnEntropy).toBe(11111);
    expect(restored.check).toBe(stableHash(state));
  });

  it('applies clamped dynamic crisis delta to output gap, inflation, approval, and trust', () => {
    const base = newGame(200, START);
    const withCrisis = endTurn(base, {
      dynamicCrisisDelta: {
        gapDelta: -0.5,
        infDelta: 0.3,
        approvalDelta: -4,
        trustDelta: -3,
      },
    });

    const withoutCrisis = endTurn(base, {});
    expect(withCrisis.econ.gap).toBeLessThan(withoutCrisis.econ.gap);
    expect(withCrisis.econ.inflation).toBeGreaterThan(withoutCrisis.econ.inflation);
    expect(withCrisis.approval).toBeLessThan(withoutCrisis.approval);
    expect(withCrisis.econ.trust).toBeLessThan(withoutCrisis.econ.trust);

    expect(withCrisis.report.trace.gap?.some((t) => t.source === 'event:ai_dynamic_crisis')).toBe(true);
    expect(withCrisis.report.trace.inflation?.some((t) => t.source === 'event:ai_dynamic_crisis')).toBe(true);
    expect(withCrisis.report.trace.approval?.some((t) => t.source === 'event:ai_dynamic_crisis')).toBe(true);
    expect(withCrisis.report.trace.trust?.some((t) => t.source === 'event:ai_dynamic_crisis')).toBe(true);
  });

  it('validates turnEntropy and dynamicCrisisDelta bounds strictly', () => {
    expect(isValidTurnEntropy(0)).toBe(true);
    expect(isValidTurnEntropy(100)).toBe(true);
    expect(isValidTurnEntropy(0x7fffffff)).toBe(true);
    expect(isValidTurnEntropy(-1)).toBe(false);
    expect(isValidTurnEntropy(0x80000000)).toBe(false);
    expect(isValidTurnEntropy(1.5)).toBe(false);
    expect(isValidTurnEntropy('42')).toBe(false);

    expect(
      isValidDynamicCrisisDelta({
        gapDelta: 0,
        infDelta: 0,
        approvalDelta: 0,
        trustDelta: 0,
      }),
    ).toBe(true);

    expect(
      isValidDynamicCrisisDelta({
        gapDelta: C.dynamicCrisisGapCap,
        infDelta: C.dynamicCrisisInfCap,
        approvalDelta: C.dynamicCrisisApprovalCap,
        trustDelta: C.dynamicCrisisTrustCap,
      }),
    ).toBe(true);

    // Over bounds
    expect(
      isValidDynamicCrisisDelta({
        gapDelta: C.dynamicCrisisGapCap + 0.1,
        infDelta: 0,
        approvalDelta: 0,
        trustDelta: 0,
      }),
    ).toBe(false);

    // Unknown property
    expect(
      isValidDynamicCrisisDelta({
        gapDelta: 0,
        infDelta: 0,
        approvalDelta: 0,
        trustDelta: 0,
        extra: 123,
      }),
    ).toBe(false);
  });

  it('validateDecisions in save parser throws on invalid entropy or out-of-bounds crisis delta', () => {
    expect(() => validateDecisions({ turnEntropy: -5 })).toThrow('turnEntropy must be an integer');
    expect(() => validateDecisions({ turnEntropy: 0x80000000 })).toThrow('turnEntropy must be an integer');
    expect(() =>
      validateDecisions({
        dynamicCrisisDelta: {
          gapDelta: 99,
          infDelta: 0,
          approvalDelta: 0,
          trustDelta: 0,
        },
      }),
    ).toThrow('dynamicCrisisDelta.gapDelta out of range');
  });
});
