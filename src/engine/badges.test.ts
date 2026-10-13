import { describe, expect, it } from 'vitest';
import { BADGES } from '../content/badges';
import { checkBadgeUnlock, computeDeficitPct, evaluateBadges, extractBadgeMeta } from './badges';
import { fromData, us } from '../data/us';
import { newGame, type GameState } from './game';

describe('policy milestone badges engine (RPT-03)', () => {
  const start = fromData(us);
  const baseState = newGame(123, start);

  it('evaluates empty/default initial state with appropriate badges', () => {
    const unlocked = evaluateBadges(baseState, [baseState]);
    // Base game starts with normal economy; verify evaluateBadges returns array of valid badge IDs
    for (const id of unlocked) {
      expect(BADGES.some((b) => b.id === id)).toBe(true);
    }
  });

  it('unlocks full_employment when empPop >= 62.0%', () => {
    const modifiedState: GameState = {
      ...baseState,
      econ: { ...baseState.econ, empPop: 63.5 },
    };
    expect(checkBadgeUnlock('full_employment', modifiedState, [modifiedState])).toBe(true);

    const lowState: GameState = {
      ...baseState,
      econ: { ...baseState.econ, empPop: 58.0 },
    };
    expect(checkBadgeUnlock('full_employment', lowState, [lowState])).toBe(false);
  });

  it('unlocks inflation_tamed when inflation is between 1.5% and 2.5%', () => {
    const stable: GameState = {
      ...baseState,
      econ: { ...baseState.econ, inflation: 2.1 },
    };
    expect(checkBadgeUnlock('inflation_tamed', stable, [stable])).toBe(true);

    const high: GameState = {
      ...baseState,
      econ: { ...baseState.econ, inflation: 4.5 },
    };
    expect(checkBadgeUnlock('inflation_tamed', high, [high])).toBe(false);
  });

  it('unlocks debt_stabilized when debt share drops >= 2.0 pp', () => {
    const debtDown: GameState = {
      ...baseState,
      start: { ...baseState.start, debtPct: 100.0 },
      econ: { ...baseState.econ, debt: 24.0, gdp: 25.0 }, // 96%
    };
    expect(checkBadgeUnlock('debt_stabilized', debtDown, [debtDown])).toBe(true);
  });

  it('unlocks crisis_pilot when >= 3 crises are resolved', () => {
    const s1: GameState = {
      ...baseState,
      report: { ...baseState.report, log: [{ kind: 'crisis', id: 'c1' }, { kind: 'crisis', id: 'c2' }, { kind: 'crisis', id: 'c3' }] },
    };
    expect(checkBadgeUnlock('crisis_pilot', s1, [s1])).toBe(true);
  });

  it('unlocks restrained_executive when >= 3 orders signed with 0 overturned', () => {
    const s1: GameState = {
      ...baseState,
      activeOrders: ['o1', 'o2', 'o3'],
      report: { ...baseState.report, log: [{ kind: 'order', id: 'signed' }, { kind: 'order', id: 'signed' }, { kind: 'order', id: 'signed' }] },
    };
    expect(checkBadgeUnlock('restrained_executive', s1, [s1])).toBe(true);

    const struck: GameState = {
      ...s1,
      report: { ...baseState.report, log: [...s1.report.log, { kind: 'court', id: 'overturned' }] },
    };
    expect(checkBadgeUnlock('restrained_executive', struck, [struck])).toBe(false);
  });

  it('unlocks judicial_appointment when scotus is confirmed', () => {
    const s1: GameState = {
      ...baseState,
      report: { ...baseState.report, log: [{ kind: 'scotus', id: 'confirmed' }] },
    };
    expect(checkBadgeUnlock('judicial_appointment', s1, [s1])).toBe(true);
  });

  it('unlocks bipartisan_builder when >= 3 bills passed', () => {
    const s1: GameState = {
      ...baseState,
      report: { ...baseState.report, log: [{ kind: 'bill', id: 'enact' }, { kind: 'bill', id: 'enact' }, { kind: 'bill', id: 'enact' }] },
    };
    expect(checkBadgeUnlock('bipartisan_builder', s1, [s1])).toBe(true);
  });

  it('unlocks master_orator when all 3 audiences are addressed', () => {
    const s1: GameState = {
      ...baseState,
      report: { ...baseState.report, log: [{ kind: 'speech', id: 'general' }, { kind: 'speech', id: 'congress' }, { kind: 'speech', id: 'business' }] },
    };
    expect(checkBadgeUnlock('master_orator', s1, [s1])).toBe(true);
  });

  it('unlocks electoral_mandate when reelectionEV >= 300', () => {
    expect(checkBadgeUnlock('electoral_mandate', baseState, [baseState], { reelectionEV: 305 })).toBe(true);
    expect(checkBadgeUnlock('electoral_mandate', baseState, [baseState], { reelectionEV: 270 })).toBe(false);
  });

  it('unlocks social_trust when trust >= 25.0%', () => {
    const highTrust: GameState = {
      ...baseState,
      econ: { ...baseState.econ, trust: 26.2 },
    };
    expect(checkBadgeUnlock('social_trust', highTrust, [highTrust])).toBe(true);
  });

  it('unlocks transformational_legacy when score >= 5.0', () => {
    expect(checkBadgeUnlock('transformational_legacy', baseState, [baseState], { score: 5.4 })).toBe(true);
    expect(checkBadgeUnlock('transformational_legacy', baseState, [baseState], { score: 2.1 })).toBe(false);
  });

  it('extracts cumulative badge meta across multiple turns', () => {
    const t1: GameState = {
      ...baseState,
      turn: 1,
      report: { ...baseState.report, log: [{ kind: 'speech', id: 'general' }, { kind: 'bill', id: 'enact' }] },
    };
    const t2: GameState = {
      ...baseState,
      turn: 2,
      report: { ...baseState.report, log: [{ kind: 'speech', id: 'congress' }, { kind: 'crisis', id: 'hurricane' }] },
    };
    const meta = extractBadgeMeta(t2, [t1, t2]);
    expect(meta.speechesGiven).toEqual(['general', 'congress']);
    expect(meta.passedBillsCount).toBe(1);
    expect(meta.crisesResolvedCount).toBe(1);
  });
});
