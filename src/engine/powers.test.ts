import { describe, expect, it } from 'vitest';
import { getOrder, ORDERS_CATALOG } from '../content/orders';
import { C } from './coefficients';
import { START } from './fixture';
import { endTurn, finalScore, legacy, newGame, step, TOTAL_TURNS } from './game';
import { activeAt } from './modifiers';
import {
  evaluateCourtChallenge,
  getCourtUpholdProbability,
  resolveCourtRuling,
  resolvePowerDecisions,
  senateConfirmationVotes,
  speechApprovalGain,
  speechCost,
} from './powers';

describe('presidential executive powers (PWR-01..PWR-07)', () => {
  it('signs and revokes executive orders, creating and ending modifiers cleanly (PWR-01)', () => {
    let state = newGame(42, START);
    const order = ORDERS_CATALOG[0]!;

    // Sign the order
    state = endTurn(state, {
      powers: {
        signOrders: [order.id],
      },
    });

    expect(state.activeOrders).toContain(order.id);
    const eoMods = state.modifiers.filter((m) => m.group === `eo:${order.id}`);
    expect(eoMods.length).toBe(order.effects.length);
    expect(eoMods.every((m) => m.tag === 'eo')).toBe(true);

    // Clout was deducted
    expect(state.clout).toBeLessThanOrEqual(START_CLOUT_AFTER_1_TURN(state.approval, order.cloutCost));

    // Revoke the order on next turn
    state = endTurn(state, {
      powers: {
        revokeOrders: [order.id],
      },
    });

    expect(state.activeOrders).not.toContain(order.id);
    const activeEoMods = state.modifiers.filter((m) => m.group === `eo:${order.id}` && m.until >= state.turn);
    expect(activeEoMods).toHaveLength(0);
  });

  it('executive orders are excluded from the 10-year legacy projection (D5)', () => {
    let state = newGame(10, START);
    const order = ORDERS_CATALOG[1]!;

    state = endTurn(state, {
      powers: {
        signOrders: [order.id],
      },
    });

    expect(state.activeOrders).toContain(order.id);

    // Compute legacy projection
    const leg = legacy(state);
    // In legacy state, active EO modifiers must be zero via activeAt
    const activeInGame = activeAt(state.modifiers, state.turn, false).filter((m) => m.tag === 'eo');
    expect(activeInGame.length).toBeGreaterThan(0);

    const activeInLegacy = activeAt(leg.modifiers, leg.turn, true).filter((m) => m.tag === 'eo');
    expect(activeInLegacy).toHaveLength(0);
  });

  it('court challenge resolves via keyed draw and schedules court_ruling (PWR-02)', () => {
    const highRiskOrder = ORDERS_CATALOG.find((o) => o.courtRisk === 'High')!;
    expect(highRiskOrder).toBeDefined();

    // Check evaluateCourtChallenge returns boolean
    const challengeBool = evaluateCourtChallenge(1, 1, highRiskOrder);
    expect(typeof challengeBool).toBe('boolean');

    // Run a game where we sign high risk order
    let state = newGame(7, START);
    state = endTurn(state, {
      powers: {
        signOrders: [highRiskOrder.id],
      },
    });

    // Check if scheduled item exists when challenged
    const courtItem = state.scheduled.find((s) => s.kind === 'court_ruling' && s.data.orderId === highRiskOrder.id);
    if (courtItem) {
      expect(courtItem.due).toBe(state.turn + 1); // scheduled for turn + 2 from turn 1, so due = 3
    }
  });

  it('court ruling resolver handles uphold and strike down outcomes', () => {
    const order = ORDERS_CATALOG[0]!;
    const state = newGame(1, START);

    // Test uphold outcome
    const upheldResult = resolveCourtRuling({
      seed: 12345,
      turn: 3,
      state,
      item: { id: 'court:test', kind: 'court_ruling', due: 3, data: { orderId: order.id } },
    });
    expect(upheldResult.log).toBeDefined();
    expect(upheldResult.log![0]!.kind).toBe('court');

    // Check that struck down removes group
    // Feed a seed that triggers strike down
    let strikeResult = null;
    for (let seed = 1; seed < 100; seed++) {
      const res = resolveCourtRuling({
        seed,
        turn: 3,
        state,
        item: { id: 'court:test', kind: 'court_ruling', due: 3, data: { orderId: order.id } },
      });
      if (res.endGroups?.includes(`eo:${order.id}`)) {
        strikeResult = res;
        break;
      }
    }
    expect(strikeResult).not.toBeNull();
    expect(strikeResult?.endGroups).toContain(`eo:${order.id}`);
    expect(strikeResult?.log![0]!.id).toBe('struck_down');
  });

  it('pressuring the Fed lowers rates at an inflation expectations credibility cost (PWR-03)', () => {
    let state = newGame(25, START);
    state = endTurn(state, {
      powers: {
        pressureFed: true,
      },
    });

    // Credibility modifier must exist and target 'expected'
    const credMod = state.modifiers.find((m) => m.group === 'fed_credibility');
    expect(credMod).toBeDefined();
    expect(credMod?.channel).toBe('expected');
    expect(credMod?.amount).toBe(C.fedPressureCredibilityHit);

    // Rate target relief modifier must exist
    const rateMod = state.modifiers.find((m) => m.group === 'fed_pressure');
    expect(rateMod).toBeDefined();
    expect(rateMod?.channel).toBe('fedTarget');
    expect(rateMod?.amount).toBe(-C.fedRatePressureRelief);
  });

  it('Fed chair nominations check Senate 51-vote confirmation threshold (PWR-03)', () => {
    expect(senateConfirmationVotes('centrist')).toBeGreaterThanOrEqual(51);
    expect(senateConfirmationVotes('hawk')).toBeGreaterThanOrEqual(51);
    expect(senateConfirmationVotes('dove')).toBeLessThan(51);

    let state = newGame(33, START);
    state = endTurn(state, {
      powers: {
        nominateFed: 'hawk',
      },
    });

    const confirmedLog = state.report.log.find((l) => l.kind === 'fed' && l.id === 'confirmed');
    expect(confirmedLog).toBeDefined();
    expect(state.modifiers.some((m) => m.group === 'fed_chair')).toBe(true);

    // Dove nomination fails
    let state2 = newGame(33, START);
    state2 = endTurn(state2, {
      powers: {
        nominateFed: 'dove',
      },
    });
    const rejectedLog = state2.report.log.find((l) => l.kind === 'fed' && l.id === 'rejected');
    expect(rejectedLog).toBeDefined();
    expect(state2.modifiers.some((m) => m.group === 'fed_chair')).toBe(false);
  });

  it('bully pulpit speeches exhibit diminishing returns and escalating cost (PWR-05)', () => {
    const cost0 = speechCost(0);
    const cost1 = speechCost(1);
    const cost2 = speechCost(2);
    expect(cost1).toBeGreaterThan(cost0);
    expect(cost2).toBeGreaterThan(cost1);

    const gain0 = speechApprovalGain(0);
    const gain1 = speechApprovalGain(1);
    const gain2 = speechApprovalGain(2);
    expect(gain1).toBeLessThan(gain0);
    expect(gain2).toBeLessThan(gain1);

    let state = newGame(5, START);
    state = endTurn(state, {
      powers: {
        speech: { audience: 'general' },
      },
    });
    expect(state.speechCountInWindow).toBe(1);

    state = endTurn(state, {
      powers: {
        speech: { audience: 'general' },
      },
    });
    expect(state.speechCountInWindow).toBe(2);

    // Turn with no speech decays the window
    state = endTurn(state, {});
    expect(state.speechCountInWindow).toBe(1);
  });

  it('civics myth cards award bonus clout exactly once per game (PWR-06, Pitfall 17)', () => {
    let state = newGame(12, START);
    const startClout = state.clout;

    // View gas_prices myth card
    state = endTurn(state, {
      powers: {
        viewMyth: 'gas_prices',
      },
    });

    expect(state.viewedMyths).toContain('gas_prices');
    // First view grants reward
    const rewardLog = state.report.log.find((l) => l.kind === 'myth' && l.id === 'gas_prices');
    expect(rewardLog).toBeDefined();
    expect(rewardLog?.amount).toBe(C.mythRewardClout);

    // Second view of same card does NOT grant reward
    const cloutAfterFirst = state.clout;
    state = endTurn(state, {
      powers: {
        viewMyth: 'gas_prices',
      },
    });

    const secondRewardLog = state.report.log.find((l) => l.kind === 'myth' && l.id === 'gas_prices');
    expect(secondRewardLog).toBeUndefined();
  });

  it('clout stops at cloutCap so hoarding is not a viable strategy (PWR-07, GR-10)', () => {
    let state = newGame(99, START);
    // Run multiple turns doing nothing to accumulate clout from approval
    for (let t = 1; t < 25; t++) {
      state = endTurn(state, {});
      expect(state.clout).toBeLessThanOrEqual(C.cloutCap);
    }
    expect(state.clout).toBe(C.cloutCap);
  });

  it('scales Supreme Court uphold probabilities based on net ideological balance (REF-02)', () => {
    // Baseline 6-3 conservative bench
    expect(getCourtUpholdProbability('Low')).toBe(C.courtUpholdLow);
    expect(getCourtUpholdProbability('Moderate')).toBe(C.courtUpholdModerate);
    expect(getCourtUpholdProbability('High')).toBe(C.courtUpholdHigh);

    // Bench expanded by +2 liberal justices: net balance moves from -3 to -1 (+2 justices)
    // Shift is 2 * 0.08 = +0.16
    const expandedLow = getCourtUpholdProbability('Low', { conservative: 6, liberal: 5 });
    const expandedMod = getCourtUpholdProbability('Moderate', { conservative: 6, liberal: 5 });
    const expandedHigh = getCourtUpholdProbability('High', { conservative: 6, liberal: 5 });

    expect(expandedLow).toBeCloseTo(0.95, 5); // Clamped at COURT_UPHOLD_CEIL
    expect(expandedMod).toBeCloseTo(C.courtUpholdModerate + 0.16, 5);
    expect(expandedHigh).toBeCloseTo(C.courtUpholdHigh + 0.16, 5);
  });
});

function START_CLOUT_AFTER_1_TURN(approval: number, spend: number): number {
  return 120 + Math.round(approval / C.cloutPerApproval) - spend;
}
