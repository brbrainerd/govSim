// Structural judicial and electoral reforms (REF-02, REF-03).
// Pure, deterministic resolution. Keyed counter-based RNG draws from 'reform' stream.

import { C, RULES } from './coefficients';
import { calculateSenateVotes, SENATE_CONFIRMATION_THRESHOLD } from './congress';
import type { GameState, LogEntry } from './game';
import { draw } from './rng';
import {
  BENCH_EXPANSION_SEATS,
  BENCH_STARTING_CONSERVATIVE,
  BENCH_STARTING_LIBERAL,
  MATCHING_GRANT_BN,
  RCV_GRANT_BN,
  REDISTRICTING_GRANT_BN,
  REFORM_CLOUT_ETHICS,
  REFORM_CLOUT_EXPANSION,
  REFORM_CLOUT_MATCHING,
  REFORM_CLOUT_RCV,
  REFORM_CLOUT_REDISTRICTING,
  REFORM_CLOUT_TERM_LIMITS,
  SENATE_BASE_SEATS,
} from './units';

export type JudicialReformId = 'scotus_term_limits' | 'statutory_ethics_code' | 'court_expansion';
export type ElectoralReformId = 'rcv_incentives' | 'independent_redistricting' | 'small_dollar_matching';
export type ReformId = JudicialReformId | ElectoralReformId;

export interface ReformInfo {
  readonly id: ReformId;
  readonly category: 'judicial' | 'electoral';
  readonly name: string;
  readonly summary: string;
  readonly description: string;
  readonly cloutCost: number;
  readonly outlayBn: number;
}

export const REFORMS_CATALOG: Record<ReformId, ReformInfo> = {
  scotus_term_limits: {
    id: 'scotus_term_limits',
    category: 'judicial',
    name: '18-Year Supreme Court Term Limits',
    summary: 'Regularizes Supreme Court vacancies every 2 years with 18-year active service terms.',
    description: 'Establishes statutory term limits for Supreme Court justices with senior judge transition. Faces high risk of Article III constitutional challenge before the conservative bench.',
    cloutCost: REFORM_CLOUT_TERM_LIMITS,
    outlayBn: 0,
  },
  statutory_ethics_code: {
    id: 'statutory_ethics_code',
    category: 'judicial',
    name: 'Statutory Judicial Code of Conduct',
    summary: 'Binds Supreme Court justices to enforceable disclosure, gift limits, and recusal rules.',
    description: 'Imposes binding statutory ethics oversight and financial disclosure requirements on Supreme Court justices, boosting public trust in the judiciary with minimal constitutional friction.',
    cloutCost: REFORM_CLOUT_ETHICS,
    outlayBn: 0,
  },
  court_expansion: {
    id: 'court_expansion',
    category: 'judicial',
    name: 'Judiciary Act Bench Expansion (+2 Seats)',
    summary: 'Expands the Supreme Court bench from 9 to 11 seats to restore ideological balance.',
    description: 'Enacts legislation adding two seats to the Supreme Court bench, shifting ideological composition. Requires simple majority Senate confirmation and triggers public backlash over institutional norms.',
    cloutCost: REFORM_CLOUT_EXPANSION,
    outlayBn: 0,
  },
  rcv_incentives: {
    id: 'rcv_incentives',
    category: 'electoral',
    name: 'Ranked-Choice Voting Federal Grants',
    summary: 'Provides federal grants to states transitioning to ranked-choice voting systems.',
    description: 'Funds state election administration grants to replace plurality voting with ranked-choice voting, lifting turnout and centrist coalition viability.',
    cloutCost: REFORM_CLOUT_RCV,
    outlayBn: RCV_GRANT_BN,
  },
  independent_redistricting: {
    id: 'independent_redistricting',
    category: 'electoral',
    name: 'Nonpartisan Redistricting Grants',
    summary: 'Incentivizes states to establish independent citizen redistricting commissions.',
    description: 'Provides federal matching grants to states adopting citizen redistricting commissions, breaking partisan gerrymanders and expanding competitive House districts.',
    cloutCost: REFORM_CLOUT_REDISTRICTING,
    outlayBn: REDISTRICTING_GRANT_BN,
  },
  small_dollar_matching: {
    id: 'small_dollar_matching',
    category: 'electoral',
    name: 'Small-Dollar Donor Public Matching',
    summary: 'Establishes a 6:1 federal match for small-dollar grassroots campaign contributions.',
    description: 'Creates a federal public matching system for small campaign donations up to $200, diluting mega-donor influence, lifting turnout, and restoring civic trust.',
    cloutCost: REFORM_CLOUT_MATCHING,
    outlayBn: MATCHING_GRANT_BN,
  },
};

export interface ReformResolutionResult {
  readonly valid: boolean;
  readonly reason?: 'unaffordable' | 'already_enacted' | 'senate_failed' | 'invalid';
  readonly reformId: ReformId;
  readonly cloutCost: number;
  readonly outlayBn: number;
  readonly trustDelta: number;
  readonly approvalDelta: number;
  readonly courtShift?: { readonly conservative: number; readonly liberal: number };
  readonly competitiveSeatsBonus: number;
  readonly turnoutBonus: number;
  readonly status: 'enacted' | 'struck_down' | 'rejected';
  readonly log: readonly LogEntry[];
}

export function resolveJudicialReform(
  state: GameState,
  reformId: JudicialReformId,
  seed: number,
): ReformResolutionResult {
  const info = REFORMS_CATALOG[reformId];
  if (!info) {
    return {
      valid: false,
      reason: 'invalid',
      reformId,
      cloutCost: 0,
      outlayBn: 0,
      trustDelta: 0,
      approvalDelta: 0,
      competitiveSeatsBonus: 0,
      turnoutBonus: 0,
      status: 'rejected',
      log: [{ kind: 'reform', id: 'rejected', detail: 'invalid' }],
    };
  }

  if (state.activeReforms?.includes(reformId)) {
    return {
      valid: false,
      reason: 'already_enacted',
      reformId,
      cloutCost: 0,
      outlayBn: 0,
      trustDelta: 0,
      approvalDelta: 0,
      competitiveSeatsBonus: 0,
      turnoutBonus: 0,
      status: 'rejected',
      log: [{ kind: 'reform', id: 'rejected', detail: 'already_enacted' }],
    };
  }

  if (state.clout < info.cloutCost) {
    return {
      valid: false,
      reason: 'unaffordable',
      reformId,
      cloutCost: 0,
      outlayBn: 0,
      trustDelta: 0,
      approvalDelta: 0,
      competitiveSeatsBonus: 0,
      turnoutBonus: 0,
      status: 'rejected',
      log: [{ kind: 'reform', id: 'rejected', detail: 'unaffordable' }],
    };
  }

  if (reformId === 'statutory_ethics_code') {
    return {
      valid: true,
      reformId,
      cloutCost: info.cloutCost,
      outlayBn: 0,
      trustDelta: C.courtEthicsTrustGain,
      approvalDelta: 0,
      competitiveSeatsBonus: 0,
      turnoutBonus: 0,
      status: 'enacted',
      log: [
        {
          kind: 'reform',
          id: reformId,
          detail: 'Statutory judicial ethics code enacted.',
          amount: info.cloutCost,
        },
      ],
    };
  }

  if (reformId === 'court_expansion') {
    // Requires Senate confirmation under simple majority (51 votes)
    const playerSenateSeats = SENATE_BASE_SEATS + (state.senateSeatDelta ?? 0);
    const votes = calculateSenateVotes(playerSenateSeats, state.approval, 0);
    if (votes < SENATE_CONFIRMATION_THRESHOLD) {
      return {
        valid: false,
        reason: 'senate_failed',
        reformId,
        cloutCost: Math.floor(info.cloutCost / RULES.refundDivisor.value),
        outlayBn: 0,
        trustDelta: 0,
        approvalDelta: 0,
        competitiveSeatsBonus: 0,
        turnoutBonus: 0,
        status: 'rejected',
        log: [
          {
            kind: 'reform',
            id: 'court_expansion_failed',
            detail: `Bench expansion failed Senate confirmation (${votes} of 51 votes).`,
            amount: votes,
          },
        ],
      };
    }

    const currentCon = state.courtComposition?.conservative ?? BENCH_STARTING_CONSERVATIVE;
    const currentLib = state.courtComposition?.liberal ?? BENCH_STARTING_LIBERAL;
    const courtShift = {
      conservative: currentCon,
      liberal: currentLib + BENCH_EXPANSION_SEATS,
    };

    return {
      valid: true,
      reformId,
      cloutCost: info.cloutCost,
      outlayBn: 0,
      trustDelta: -C.courtExpansionTrustPenalty,
      approvalDelta: 0,
      courtShift,
      competitiveSeatsBonus: 0,
      turnoutBonus: 0,
      status: 'enacted',
      log: [
        {
          kind: 'reform',
          id: reformId,
          detail: `Supreme Court bench expanded to 11 justices (${courtShift.conservative}-${courtShift.liberal}).`,
          amount: info.cloutCost,
        },
      ],
    };
  }

  // scotus_term_limits
  // Draws strictly from isolated 'reform' stream
  const roll = draw(seed, 'reform', state.turn, 'scotus_term_limits_challenge');
  const struckDown = roll < C.courtTermLimitChallengeRisk;

  if (struckDown) {
    return {
      valid: true,
      reformId,
      cloutCost: info.cloutCost,
      outlayBn: 0,
      trustDelta: 0,
      approvalDelta: 0,
      competitiveSeatsBonus: 0,
      turnoutBonus: 0,
      status: 'struck_down',
      log: [
        {
          kind: 'reform',
          id: 'scotus_term_limits_struck_down',
          detail: 'Supreme Court strikes down statutory term limits under Article III (6-3).',
          amount: info.cloutCost,
        },
      ],
    };
  }

  return {
    valid: true,
    reformId,
    cloutCost: info.cloutCost,
    outlayBn: 0,
    trustDelta: 1,
    approvalDelta: 0,
    competitiveSeatsBonus: 0,
    turnoutBonus: 0,
    status: 'enacted',
    log: [
      {
        kind: 'reform',
        id: reformId,
        detail: 'Supreme Court upholds statutory 18-year term limits.',
        amount: info.cloutCost,
      },
    ],
  };
}

export function resolveElectoralReform(
  state: GameState,
  reformId: ElectoralReformId,
): ReformResolutionResult {
  const info = REFORMS_CATALOG[reformId];
  if (!info) {
    return {
      valid: false,
      reason: 'invalid',
      reformId,
      cloutCost: 0,
      outlayBn: 0,
      trustDelta: 0,
      approvalDelta: 0,
      competitiveSeatsBonus: 0,
      turnoutBonus: 0,
      status: 'rejected',
      log: [{ kind: 'reform', id: 'rejected', detail: 'invalid' }],
    };
  }

  if (state.activeReforms?.includes(reformId)) {
    return {
      valid: false,
      reason: 'already_enacted',
      reformId,
      cloutCost: 0,
      outlayBn: 0,
      trustDelta: 0,
      approvalDelta: 0,
      competitiveSeatsBonus: 0,
      turnoutBonus: 0,
      status: 'rejected',
      log: [{ kind: 'reform', id: 'rejected', detail: 'already_enacted' }],
    };
  }

  if (state.clout < info.cloutCost) {
    return {
      valid: false,
      reason: 'unaffordable',
      reformId,
      cloutCost: 0,
      outlayBn: 0,
      trustDelta: 0,
      approvalDelta: 0,
      competitiveSeatsBonus: 0,
      turnoutBonus: 0,
      status: 'rejected',
      log: [{ kind: 'reform', id: 'rejected', detail: 'unaffordable' }],
    };
  }

  if (reformId === 'rcv_incentives') {
    return {
      valid: true,
      reformId,
      cloutCost: info.cloutCost,
      outlayBn: info.outlayBn,
      trustDelta: C.rcvTrustGain,
      approvalDelta: 0,
      competitiveSeatsBonus: 0,
      turnoutBonus: C.rcvTurnoutBonus,
      status: 'enacted',
      log: [
        {
          kind: 'reform',
          id: reformId,
          detail: 'Ranked-choice voting federal grant program established.',
          amount: info.cloutCost,
        },
      ],
    };
  }

  if (reformId === 'independent_redistricting') {
    return {
      valid: true,
      reformId,
      cloutCost: info.cloutCost,
      outlayBn: info.outlayBn,
      trustDelta: 1,
      approvalDelta: 0,
      competitiveSeatsBonus: C.independentRedistrictingCompetitiveDistricts,
      turnoutBonus: 0,
      status: 'enacted',
      log: [
        {
          kind: 'reform',
          id: reformId,
          detail: 'Independent redistricting commission incentive grants enacted.',
          amount: info.cloutCost,
        },
      ],
    };
  }

  // small_dollar_matching
  return {
    valid: true,
    reformId,
    cloutCost: info.cloutCost,
    outlayBn: info.outlayBn,
    trustDelta: C.smallDollarMatchingTrustGain,
    approvalDelta: C.smallDollarMatchingApprovalGain,
    competitiveSeatsBonus: 0,
    turnoutBonus: C.smallDollarMatchingTurnoutBonus,
    status: 'enacted',
    log: [
      {
        kind: 'reform',
        id: reformId,
        detail: 'Small-dollar public matching funds established for grassroots campaigns.',
        amount: info.cloutCost,
      },
    ],
  };
}
