// Article V Constitutional Amendments Engine (Phase 11, REF-04)
// Models authentic 2/3 House (290), 2/3 Senate (67), and 3/4 state legislatures (38/50) ratification.
// Civic faction neutral (D4 / FND-08): zero mentions of forbidden civic group words in engine code.
// Zero bare literals (FND-07): all numbers from units.ts or coefficients.ts.

import { STATE_LEGISLATURES, getStateLegislature } from '../data/electoral';
import { C } from './coefficients';
import { HOUSE_SEATS } from './congress';
import { draw } from './rng';
import {
  AMENDMENT_ALIGNED_RATIFY_BASE_CHANCE,
  AMENDMENT_APPEAL_BALANCED_BUDGET,
  AMENDMENT_APPEAL_CAMPAIGN_FINANCE,
  AMENDMENT_APPEAL_EQUAL_RIGHTS,
  AMENDMENT_APPEAL_JUDICIAL_TERMS,
  BASE_PERCENT,
  AMENDMENT_APPROVAL_SLOPE,
  AMENDMENT_DIVIDED_APPROVAL_MIN,
  AMENDMENT_DIVIDED_RATIFY_BASE_CHANCE,
  AMENDMENT_EXPIRY_TURNS,
  AMENDMENT_HOUSE_BASE_CAMPAIGN,
  AMENDMENT_HOUSE_BASE_JUDICIAL,
  AMENDMENT_HOUSE_BASE_PARTISAN,
  AMENDMENT_HOUSE_THRESHOLD,
  AMENDMENT_OPPOSED_APPROVAL_MIN,
  AMENDMENT_OPPOSED_RATIFY_BASE_CHANCE,
  AMENDMENT_SENATE_CROSSOVER_SCALE,
  AMENDMENT_SENATE_THRESHOLD,
  AMENDMENT_STATES_TO_RATIFY,
  SENATE_BASE_SEATS,
  SENATE_TOTAL_SEATS,
} from './units';

export type AmendmentId =
  | 'amendment_judicial_terms'
  | 'amendment_campaign_finance'
  | 'amendment_equal_rights'
  | 'amendment_balanced_budget';

export interface AmendmentDefinition {
  readonly id: AmendmentId;
  readonly title: string;
  readonly shortName: string;
  readonly description: string;
  readonly houseThreshold: number;
  readonly senateThreshold: number;
  readonly statesRequired: number;
  readonly expiryTurns: number;
  readonly proposalCloutCost: number;
  readonly bipartisanAppeal: number;
  readonly effectsSummary: string;
}

export const AMENDMENTS_CATALOG: Readonly<Record<AmendmentId, AmendmentDefinition>> = {
  amendment_judicial_terms: {
    id: 'amendment_judicial_terms',
    title: 'Judicial Tenure & Supreme Court Term Limits Amendment',
    shortName: 'Judicial Terms',
    description: 'Establishes 18-year staggered term limits for Supreme Court justices, eliminating life tenure disputes.',
    houseThreshold: AMENDMENT_HOUSE_THRESHOLD,
    senateThreshold: AMENDMENT_SENATE_THRESHOLD,
    statesRequired: AMENDMENT_STATES_TO_RATIFY,
    expiryTurns: AMENDMENT_EXPIRY_TURNS,
    proposalCloutCost: C.amendmentProposalCloutCost,
    bipartisanAppeal: AMENDMENT_APPEAL_JUDICIAL_TERMS,
    effectsSummary: 'Permanently immunizes judicial term limits against Article III legal challenges and restores judicial trust.',
  },
  amendment_campaign_finance: {
    id: 'amendment_campaign_finance',
    title: 'Democracy For All & Campaign Finance Amendment',
    shortName: 'Campaign Finance',
    description: 'Clarifies that money is not speech, granting Congress and state legislatures power to limit political expenditures.',
    houseThreshold: AMENDMENT_HOUSE_THRESHOLD,
    senateThreshold: AMENDMENT_SENATE_THRESHOLD,
    statesRequired: AMENDMENT_STATES_TO_RATIFY,
    expiryTurns: AMENDMENT_EXPIRY_TURNS,
    proposalCloutCost: C.amendmentProposalCloutCost,
    bipartisanAppeal: AMENDMENT_APPEAL_CAMPAIGN_FINANCE,
    effectsSummary: 'Overturns Citizens United, sharply raises civic trust, and curbs mega-donor spending.',
  },
  amendment_equal_rights: {
    id: 'amendment_equal_rights',
    title: 'Equal Rights Amendment',
    shortName: 'Equal Rights',
    description: 'Guarantees equality of rights under the law shall not be denied or abridged by the United States or any State on account of sex.',
    houseThreshold: AMENDMENT_HOUSE_THRESHOLD,
    senateThreshold: AMENDMENT_SENATE_THRESHOLD,
    statesRequired: AMENDMENT_STATES_TO_RATIFY,
    expiryTurns: AMENDMENT_EXPIRY_TURNS,
    proposalCloutCost: C.amendmentProposalCloutCost,
    bipartisanAppeal: AMENDMENT_APPEAL_EQUAL_RIGHTS,
    effectsSummary: 'Permanently secures civil rights, closes gender wage gap indicators, and expands economic participation.',
  },
  amendment_balanced_budget: {
    id: 'amendment_balanced_budget',
    title: 'Fiscal Responsibility & Balanced Budget Amendment',
    shortName: 'Balanced Budget',
    description: 'Requires total federal outlays not to exceed total receipts for each fiscal year, except in declared wars or emergencies.',
    houseThreshold: AMENDMENT_HOUSE_THRESHOLD,
    senateThreshold: AMENDMENT_SENATE_THRESHOLD,
    statesRequired: AMENDMENT_STATES_TO_RATIFY,
    expiryTurns: AMENDMENT_EXPIRY_TURNS,
    proposalCloutCost: C.amendmentProposalCloutCost,
    bipartisanAppeal: AMENDMENT_APPEAL_BALANCED_BUDGET,
    effectsSummary: 'Enforces hard structural deficit limits and reduces national debt risk premium on sovereign yields.',
  },
};

export interface ActiveAmendment {
  readonly id: AmendmentId;
  readonly proposedTurn: number;
  readonly ratifiedStates: readonly string[];
  readonly isRatified: boolean;
  readonly isExpired: boolean;
}

export interface ProposalCheckResult {
  readonly proposed: boolean;
  readonly reason?: string;
}

/**
 * Calculates estimated House and Senate votes for proposing an Article V amendment.
 */
export function calculateAmendmentProposalVotes(
  amendmentId: AmendmentId,
  houseSeatDelta = 0,
  senateSeatDelta = 0,
  approval = BASE_PERCENT,
): { houseVotes: number; senateVotes: number } {
  const def = AMENDMENTS_CATALOG[amendmentId];
  const appeal = def?.bipartisanAppeal ?? 0;

  // Senate votes calculated using supermajority super-thresholds
  const playerSenateSeats = SENATE_BASE_SEATS + senateSeatDelta;
  const approvalBonus = Math.round((approval - BASE_PERCENT) * AMENDMENT_APPROVAL_SLOPE);
  const crossoverVotes = Math.round(appeal * AMENDMENT_SENATE_CROSSOVER_SCALE);
  const senateVotes = Math.max(0, Math.min(SENATE_TOTAL_SEATS, playerSenateSeats + approvalBonus + crossoverVotes));

  // House votes
  let baseHouse = AMENDMENT_HOUSE_BASE_PARTISAN;
  if (amendmentId === 'amendment_judicial_terms') {
    baseHouse = AMENDMENT_HOUSE_BASE_JUDICIAL;
  } else if (amendmentId === 'amendment_campaign_finance') {
    baseHouse = AMENDMENT_HOUSE_BASE_CAMPAIGN;
  }

  const swing = Math.round((approval - BASE_PERCENT) * AMENDMENT_APPROVAL_SLOPE);
  const houseVotes = Math.max(0, Math.min(HOUSE_SEATS, baseHouse + swing + houseSeatDelta));

  return { houseVotes, senateVotes };
}

/**
 * Checks whether an Article V amendment meets the dual 2/3 Congressional proposal hurdle:
 * 290 votes in the House and 67 votes in the Senate.
 */
export function checkAmendmentCongressionalProposal(
  amendmentId: AmendmentId,
  houseVotes: number,
  senateVotes: number,
): ProposalCheckResult {
  const def = AMENDMENTS_CATALOG[amendmentId];
  if (!def) {
    return { proposed: false, reason: 'Unknown amendment identifier.' };
  }
  if (houseVotes < AMENDMENT_HOUSE_THRESHOLD) {
    return {
      proposed: false,
      reason: `House vote (${houseVotes}) fell short of the 2/3 supermajority threshold (${AMENDMENT_HOUSE_THRESHOLD}).`,
    };
  }
  if (senateVotes < AMENDMENT_SENATE_THRESHOLD) {
    return {
      proposed: false,
      reason: `Senate vote (${senateVotes}) fell short of the 2/3 supermajority threshold (${AMENDMENT_SENATE_THRESHOLD}).`,
    };
  }
  return { proposed: true };
}

/**
 * Evaluates the legislative alignment ('aligned' | 'divided' | 'opposed') for a state legislature
 * considering the amendment's ideological orientation and state legislature control.
 */
export function getLegislatureAlignment(
  amendmentId: AmendmentId,
  stateCode: string,
  presidentialSide?: 'D' | 'R',
): 'aligned' | 'divided' | 'opposed' {
  const leg = getStateLegislature(stateCode);
  if (!leg) return 'divided';

  if (leg.control === 'split') {
    return 'divided';
  }

  // Domain-specific legislative alignment
  if (amendmentId === 'amendment_balanced_budget') {
    return leg.control === 'R' ? 'aligned' : 'opposed';
  }
  if (amendmentId === 'amendment_equal_rights') {
    return leg.control === 'D' ? 'aligned' : 'opposed';
  }

  // Broad reform amendments (Judicial Terms & Campaign Finance):
  // Aligned if matching presidential administration orientation, divided otherwise.
  const side = presidentialSide ?? 'D';
  return leg.control === side ? 'aligned' : 'divided';
}

/**
 * Advances ratification turn-by-turn across state legislatures using the isolated 'reform' stream.
 * 38 of 50 state ratifications are required to codify the amendment into the Constitution.
 */
export function tickAmendmentRatification(
  active: ActiveAmendment,
  currentTurn: number,
  approval: number,
  seed: number,
  presidentialSide?: 'D' | 'R',
  campaigned?: boolean,
): ActiveAmendment {
  if (active.isRatified || active.isExpired) {
    return active;
  }

  const ratifiedSet = new Set(active.ratifiedStates);
  const candidateStates = Object.keys(STATE_LEGISLATURES).sort();

  for (const stateCode of candidateStates) {
    if (ratifiedSet.has(stateCode)) continue;

    const alignment = getLegislatureAlignment(active.id, stateCode, presidentialSide);
    const roll = draw(seed, 'reform', currentTurn, stateCode);

    let ratifiesThisTurn = false;

    if (alignment === 'aligned') {
      ratifiesThisTurn = roll < AMENDMENT_ALIGNED_RATIFY_BASE_CHANCE;
    } else if (alignment === 'divided') {
      const passesThreshold = approval >= AMENDMENT_DIVIDED_APPROVAL_MIN || Boolean(campaigned);
      if (passesThreshold && roll < AMENDMENT_DIVIDED_RATIFY_BASE_CHANCE) {
        ratifiesThisTurn = true;
      }
    } else {
      // Opposed alignment
      const passesThreshold = approval >= AMENDMENT_OPPOSED_APPROVAL_MIN;
      if (passesThreshold && (Boolean(campaigned) || roll < AMENDMENT_OPPOSED_RATIFY_BASE_CHANCE)) {
        ratifiesThisTurn = true;
      }
    }

    if (ratifiesThisTurn) {
      ratifiedSet.add(stateCode);
    }
  }

  const updatedRatifiedStates = Array.from(ratifiedSet).sort();
  const isRatified = updatedRatifiedStates.length >= AMENDMENT_STATES_TO_RATIFY;
  const turnsElapsed = currentTurn - active.proposedTurn;
  const isExpired = !isRatified && turnsElapsed >= AMENDMENT_EXPIRY_TURNS;

  return {
    id: active.id,
    proposedTurn: active.proposedTurn,
    ratifiedStates: updatedRatifiedStates,
    isRatified,
    isExpired,
  };
}
