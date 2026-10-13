import { describe, expect, it } from 'vitest';
import { C } from './coefficients';
import { START } from './fixture';
import { endTurn, newGame } from './game';
import {
  REFORMS_CATALOG,
  resolveElectoralReform,
  resolveJudicialReform,
  type ElectoralReformId,
  type JudicialReformId,
} from './reforms';

describe('structural reforms catalog and rules (REF-02, REF-03)', () => {
  it('exposes all judicial and electoral reforms with correct metadata', () => {
    // Judicial
    expect(REFORMS_CATALOG.scotus_term_limits.category).toBe('judicial');
    expect(REFORMS_CATALOG.scotus_term_limits.cloutCost).toBe(25);

    expect(REFORMS_CATALOG.statutory_ethics_code.category).toBe('judicial');
    expect(REFORMS_CATALOG.statutory_ethics_code.cloutCost).toBe(20);

    expect(REFORMS_CATALOG.court_expansion.category).toBe('judicial');
    expect(REFORMS_CATALOG.court_expansion.cloutCost).toBe(40);

    // Electoral
    expect(REFORMS_CATALOG.rcv_incentives.category).toBe('electoral');
    expect(REFORMS_CATALOG.rcv_incentives.cloutCost).toBe(15);
    expect(REFORMS_CATALOG.rcv_incentives.outlayBn).toBe(2.5);

    expect(REFORMS_CATALOG.independent_redistricting.category).toBe('electoral');
    expect(REFORMS_CATALOG.independent_redistricting.cloutCost).toBe(20);
    expect(REFORMS_CATALOG.independent_redistricting.outlayBn).toBe(0.5);

    expect(REFORMS_CATALOG.small_dollar_matching.category).toBe('electoral');
    expect(REFORMS_CATALOG.small_dollar_matching.cloutCost).toBe(25);
    expect(REFORMS_CATALOG.small_dollar_matching.outlayBn).toBe(4.5);
  });
});

describe('judicial reform resolution (REF-02)', () => {
  it('enacts statutory ethics code with +3 trust gain and zero constitutional friction', () => {
    const state = newGame(1, START);
    const res = resolveJudicialReform(state, 'statutory_ethics_code', 1);

    expect(res.valid).toBe(true);
    expect(res.status).toBe('enacted');
    expect(res.cloutCost).toBe(20);
    expect(res.trustDelta).toBe(C.courtEthicsTrustGain);
  });

  it('enacts bench expansion when Senate confirmation passes, shifting court composition', () => {
    // High approval ensures Senate confirmation passes
    const state = { ...newGame(1, START), approval: 60 };
    const res = resolveJudicialReform(state, 'court_expansion', 1);

    expect(res.valid).toBe(true);
    expect(res.status).toBe('enacted');
    expect(res.cloutCost).toBe(40);
    expect(res.trustDelta).toBe(-C.courtExpansionTrustPenalty);
    expect(res.courtShift).toEqual({ conservative: 6, liberal: 5 });
  });

  it('rejects bench expansion and refunds half clout if Senate confirmation fails', () => {
    // Low approval and negative seat delta causes confirmation to fail (< 51)
    const state = { ...newGame(1, START), approval: 30, senateSeatDelta: -4 };
    const res = resolveJudicialReform(state, 'court_expansion', 1);

    expect(res.valid).toBe(false);
    expect(res.status).toBe('rejected');
    expect(res.reason).toBe('senate_failed');
    expect(res.cloutCost).toBe(20); // 40 / 2
  });

  it('resolves Article III challenge for statutory term limits via reform stream', () => {
    const state = newGame(1, START);
    // Find seeds that produce struck down vs upheld
    let struckCount = 0;
    let upheldCount = 0;

    for (let s = 1; s <= 20; s++) {
      const res = resolveJudicialReform(state, 'scotus_term_limits', s);
      if (res.status === 'struck_down') struckCount++;
      if (res.status === 'enacted') upheldCount++;
    }

    // Over 20 seeds with 65% risk, expect both outcomes
    expect(struckCount).toBeGreaterThan(0);
    expect(upheldCount).toBeGreaterThan(0);
  });

  it('rejects judicial reforms when player lacks sufficient clout or already enacted', () => {
    const lowCloutState = { ...newGame(1, START), clout: 5 };
    const res = resolveJudicialReform(lowCloutState, 'statutory_ethics_code', 1);
    expect(res.valid).toBe(false);
    expect(res.reason).toBe('unaffordable');

    const alreadyState = { ...newGame(1, START), activeReforms: ['statutory_ethics_code'] };
    const res2 = resolveJudicialReform(alreadyState, 'statutory_ethics_code', 1);
    expect(res2.valid).toBe(false);
    expect(res2.reason).toBe('already_enacted');
  });
});

describe('electoral reform resolution (REF-03)', () => {
  it('enacts ranked-choice voting grants with turnout and centrist bonuses', () => {
    const state = newGame(1, START);
    const res = resolveElectoralReform(state, 'rcv_incentives');

    expect(res.valid).toBe(true);
    expect(res.status).toBe('enacted');
    expect(res.cloutCost).toBe(15);
    expect(res.outlayBn).toBe(2.5);
    expect(res.turnoutBonus).toBe(C.rcvTurnoutBonus);
    expect(res.trustDelta).toBe(C.rcvTrustGain);
  });

  it('enacts independent redistricting with competitive district expansion', () => {
    const state = newGame(1, START);
    const res = resolveElectoralReform(state, 'independent_redistricting');

    expect(res.valid).toBe(true);
    expect(res.status).toBe('enacted');
    expect(res.cloutCost).toBe(20);
    expect(res.outlayBn).toBe(0.5);
    expect(res.competitiveSeatsBonus).toBe(C.independentRedistrictingCompetitiveDistricts);
  });

  it('enacts small-dollar matching with turnout, trust, and approval lifts', () => {
    const state = newGame(1, START);
    const res = resolveElectoralReform(state, 'small_dollar_matching');

    expect(res.valid).toBe(true);
    expect(res.status).toBe('enacted');
    expect(res.cloutCost).toBe(25);
    expect(res.outlayBn).toBe(4.5);
    expect(res.turnoutBonus).toBe(C.smallDollarMatchingTurnoutBonus);
    expect(res.trustDelta).toBe(C.smallDollarMatchingTrustGain);
    expect(res.approvalDelta).toBe(C.smallDollarMatchingApprovalGain);
  });
});

describe('game turn integration of reforms (REF-02, REF-03)', () => {
  it('enacts reforms across game turns, updating activeReforms and courtComposition', () => {
    let state = newGame(42, START);

    // Turn 1: Enact statutory ethics code
    state = endTurn(state, {
      reform: 'statutory_ethics_code',
    });
    expect(state.activeReforms).toContain('statutory_ethics_code');

    // Turn 2: Enact bench expansion
    state = endTurn(state, {
      reform: 'court_expansion',
    });
    expect(state.activeReforms).toContain('court_expansion');
    expect(state.courtComposition).toEqual({ conservative: 6, liberal: 5 });
  });
});
