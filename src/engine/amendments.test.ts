import { describe, expect, it } from 'vitest';
import {
  AMENDMENTS_CATALOG,
  calculateAmendmentProposalVotes,
  checkAmendmentCongressionalProposal,
  getLegislatureAlignment,
  tickAmendmentRatification,
  type ActiveAmendment,
  type AmendmentId,
} from './amendments';
import { C } from './coefficients';
import { START } from './fixture';
import { newGame, step } from './game';
import {
  AMENDMENT_EXPIRY_TURNS,
  AMENDMENT_HOUSE_THRESHOLD,
  AMENDMENT_SENATE_THRESHOLD,
  AMENDMENT_STATES_TO_RATIFY,
} from './units';

describe('Article V constitutional amendments (REF-04)', () => {
  it('catalog defines all four candidate amendments with authentic constitutional thresholds', () => {
    const ids: AmendmentId[] = [
      'amendment_judicial_terms',
      'amendment_campaign_finance',
      'amendment_equal_rights',
      'amendment_balanced_budget',
    ];

    for (const id of ids) {
      const def = AMENDMENTS_CATALOG[id];
      expect(def).toBeDefined();
      expect(def.houseThreshold).toBe(AMENDMENT_HOUSE_THRESHOLD); // 290
      expect(def.senateThreshold).toBe(AMENDMENT_SENATE_THRESHOLD); // 67
      expect(def.statesRequired).toBe(AMENDMENT_STATES_TO_RATIFY); // 38
      expect(def.expiryTurns).toBe(AMENDMENT_EXPIRY_TURNS); // 28
      expect(def.proposalCloutCost).toBe(C.amendmentProposalCloutCost);
      expect(def.title.length).toBeGreaterThan(10);
      expect(def.effectsSummary.length).toBeGreaterThan(10);
    }
  });

  it('enforces dual 2/3 Congressional supermajorities for amendment proposal', () => {
    // Both meet threshold
    const pass = checkAmendmentCongressionalProposal('amendment_judicial_terms', 290, 67);
    expect(pass.proposed).toBe(true);
    expect(pass.reason).toBeUndefined();

    // House shortfall (289 < 290)
    const failHouse = checkAmendmentCongressionalProposal('amendment_judicial_terms', 289, 67);
    expect(failHouse.proposed).toBe(false);
    expect(failHouse.reason).toContain('House vote');

    // Senate shortfall (66 < 67)
    const failSenate = checkAmendmentCongressionalProposal('amendment_judicial_terms', 290, 66);
    expect(failSenate.proposed).toBe(false);
    expect(failSenate.reason).toContain('Senate vote');

    // Both shortfall
    const failBoth = checkAmendmentCongressionalProposal('amendment_judicial_terms', 218, 51);
    expect(failBoth.proposed).toBe(false);
  });

  it('calculates expected Congressional proposal votes based on appeal, approval, and seats', () => {
    // Judicial terms has broad bipartisan appeal (0.8)
    const judVotes = calculateAmendmentProposalVotes('amendment_judicial_terms', 0, 0, 50);
    expect(judVotes.houseVotes).toBeGreaterThanOrEqual(290);
    expect(judVotes.senateVotes).toBeGreaterThanOrEqual(60);

    // High presidential approval swings additional votes
    const highApprVotes = calculateAmendmentProposalVotes('amendment_judicial_terms', 5, 2, 70);
    expect(highApprVotes.houseVotes).toBeGreaterThan(judVotes.houseVotes);
    expect(highApprVotes.senateVotes).toBeGreaterThanOrEqual(67);
  });

  it('evaluates state legislature alignment across reform domains', () => {
    // Balanced budget: aligned in R states, opposed in D states, divided in split
    expect(getLegislatureAlignment('amendment_balanced_budget', 'TX')).toBe('aligned');
    expect(getLegislatureAlignment('amendment_balanced_budget', 'CA')).toBe('opposed');
    expect(getLegislatureAlignment('amendment_balanced_budget', 'PA')).toBe('divided');

    // Equal rights: aligned in D states, opposed in R states, divided in split
    expect(getLegislatureAlignment('amendment_equal_rights', 'CA')).toBe('aligned');
    expect(getLegislatureAlignment('amendment_equal_rights', 'TX')).toBe('opposed');
    expect(getLegislatureAlignment('amendment_equal_rights', 'PA')).toBe('divided');

    // Broad reform (Judicial terms): aligned if matching administration side
    expect(getLegislatureAlignment('amendment_judicial_terms', 'CA', 'D')).toBe('aligned');
    expect(getLegislatureAlignment('amendment_judicial_terms', 'TX', 'D')).toBe('divided');
    expect(getLegislatureAlignment('amendment_judicial_terms', 'TX', 'R')).toBe('aligned');
    expect(getLegislatureAlignment('amendment_judicial_terms', 'PA', 'D')).toBe('divided');
  });

  it('advances ratification turn-by-turn with isolated reform RNG stream', () => {
    const active: ActiveAmendment = {
      id: 'amendment_judicial_terms',
      proposedTurn: 1,
      ratifiedStates: [],
      isRatified: false,
      isExpired: false,
    };

    const next1 = tickAmendmentRatification(active, 1, 50, 42, 'D');
    expect(next1.ratifiedStates.length).toBeGreaterThan(0);
    expect(next1.isRatified).toBe(false);
    expect(next1.isExpired).toBe(false);

    // Ratifications accumulate monotonically
    const next2 = tickAmendmentRatification(next1, 2, 50, 42, 'D');
    expect(next2.ratifiedStates.length).toBeGreaterThanOrEqual(next1.ratifiedStates.length);
    for (const st of next1.ratifiedStates) {
      expect(next2.ratifiedStates).toContain(st);
    }
  });

  it('campaigning increases ratification speed across divided legislatures', () => {
    const active: ActiveAmendment = {
      id: 'amendment_campaign_finance',
      proposedTurn: 1,
      ratifiedStates: [],
      isRatified: false,
      isExpired: false,
    };

    // Low approval without campaign
    const uncampaigned = tickAmendmentRatification(active, 1, 45, 12345, 'D', false);
    // Low approval with active campaign clout investment
    const campaigned = tickAmendmentRatification(active, 1, 45, 12345, 'D', true);

    expect(campaigned.ratifiedStates.length).toBeGreaterThanOrEqual(uncampaigned.ratifiedStates.length);
  });

  it('ratifies permanently upon reaching 38 states (3/4 of 50)', () => {
    // Generate an amendment that already has 37 ratified states
    const allStates = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR',
    ];
    expect(allStates.length).toBe(37);

    const active37: ActiveAmendment = {
      id: 'amendment_judicial_terms',
      proposedTurn: 1,
      ratifiedStates: allStates,
      isRatified: false,
      isExpired: false,
    };

    // High approval and campaigned ensures additional ratifications
    const next = tickAmendmentRatification(active37, 2, 70, 999, 'D', true);
    expect(next.ratifiedStates.length).toBeGreaterThanOrEqual(38);
    expect(next.isRatified).toBe(true);
    expect(next.isExpired).toBe(false);
  });

  it('expires after 28 turns (7 years) if failing to reach 38 states', () => {
    const active: ActiveAmendment = {
      id: 'amendment_equal_rights',
      proposedTurn: 1,
      ratifiedStates: ['CA', 'NY', 'MA'],
      isRatified: false,
      isExpired: false,
    };

    // Advance to turn 29 (turn - proposedTurn >= 28)
    const expired = tickAmendmentRatification(active, 29, 40, 101, 'D', false);
    expect(expired.isExpired).toBe(true);
    expect(expired.isRatified).toBe(false);
  });

  it('integrates cleanly into step() decisions, clout economy, and trust gains', () => {
    const s0 = newGame(42, START);
    expect(s0.activeAmendment).toBeUndefined();
    expect(s0.ratifiedAmendments).toBeUndefined();

    // High approval state to ensure proposal passes Congress
    const highApprovalState = {
      ...s0,
      approval: 65,
      clout: 80,
    };

    // Propose judicial terms amendment
    const s1 = step(highApprovalState, {
      amendmentProposal: 'amendment_judicial_terms',
      presidentialSide: 'D',
    });

    expect(s1.activeAmendment).toBeDefined();
    expect(s1.activeAmendment!.id).toBe('amendment_judicial_terms');
    expect(s1.clout).toBeLessThan(highApprovalState.clout); // 50 clout spent
    expect(s1.report.log.some((l) => l.kind === 'amendment' && l.id === 'proposed')).toBe(true);

    // Step with campaign clout investment
    const s2 = step(s1, {
      amendmentCampaign: true,
      presidentialSide: 'D',
    });
    expect(s2.report.log.some((l) => l.kind === 'amendment' && l.id === 'campaign')).toBe(true);
    expect(s2.activeAmendment!.ratifiedStates.length).toBeGreaterThan(0);
  });
});
