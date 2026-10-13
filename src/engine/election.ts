// Pure, deterministic reelection engine and end-of-term legacy simulation (ELC-01..ELC-05).
// Handles 12th Amendment House contingent elections (GR-15), outcome attribution (ELC-03),
// 10-year legacy projection forward simulation (ELC-05, GR-04), and nonpartisan historian verdict tiers.

import { HOUSE_DELEGATIONS, STATE_EXPOSURES } from '../data/electoral';
import { us } from '../data/us';
import { RULES } from './coefficients';
import { finalScore, type GameState, prosperity, scoreVsAutopilot, step } from './game';
import type { ScoreBreakdown } from './score';
import {
  ELECTION_REASON_APPROVAL_DELTA,
  ELECTION_REASON_INFLATION_HIGH,
  ELECTION_REASON_INFLATION_LOW,
  ELECTION_REASON_REAL_INCOME_HIGH,
  ELECTION_REASON_UNEMPLOYMENT_LOW,
  HISTORIAN_CRISIS_LOW_THRESHOLD,
  HISTORIAN_MIXED_LOW_THRESHOLD,
  HISTORIAN_STABILITY_THRESHOLD,
  HISTORIAN_TRANSFORMATIONAL_THRESHOLD,
  LEGACY_QUARTERS,
  MAX_ELECTION_REASONS,
  PERCENT,
  QUARTERS_PER_YEAR,
  TO_WIN_CONTINGENT_STATES,
  TO_WIN_ELECTORAL_VOTES,
  TOTAL_ELECTORAL_VOTES,
  TOTAL_STATES,
} from './units';
import { calculateElectoralCollege, type ElectoralSummary, type StateVoterState } from './voters';

export interface StateRollCallItem {
  readonly code: string;
  readonly name: string;
  readonly electoralVotes: number;
  readonly winner: 'player' | 'opponent';
  readonly margin: number;
  readonly isBattleground: boolean;
}

export interface ContingentStateVote {
  readonly stateCode: string;
  readonly stateName: string;
  readonly democratSeats: number;
  readonly republicanSeats: number;
  readonly vote: 'D' | 'R' | 'split';
  readonly winner: 'player' | 'opponent' | 'split';
}

export interface ContingentElectionResult {
  readonly playerStates: number;
  readonly opponentStates: number;
  readonly splitStates: number;
  readonly winner: 'player' | 'opponent' | 'deadlock';
  readonly rollCall: readonly ContingentStateVote[];
}

export interface ElectionOutcome {
  readonly playerEV: number;
  readonly opponentEV: number;
  readonly isTie: boolean;
  readonly winner: 'player' | 'opponent';
  readonly method: 'electoral_college' | 'house_contingent';
  readonly contingentResult?: ContingentElectionResult;
  readonly rollCall: readonly StateRollCallItem[];
  readonly tippingPointState: string;
  readonly summary: ElectoralSummary;
}

export interface QuarterlyLegacyPoint {
  readonly quarter: number;
  readonly year: number;
  readonly gdpGrowth: number;
  readonly debtPct: number;
  readonly unemployment: number;
  readonly inflation: number;
  readonly prosperityIndex: number;
}

export interface TenYearLegacyTrajectory {
  readonly playerSeries: readonly QuarterlyLegacyPoint[];
  readonly autopilotSeries: readonly QuarterlyLegacyPoint[];
  readonly finalPlayerState: GameState;
  readonly finalAutopilotState: GameState;
  readonly finalPlayerScore: ScoreBreakdown;
  readonly scoreVsAutopilot: ScoreBreakdown;
}

export type HistorianVerdictTier =
  | 'Transformational'
  | 'Steward of Stability'
  | 'Mixed Legacy'
  | 'Presidency of Unresolved Crises'
  | 'Institutional Breakdown';

export interface HistorianVerdict {
  readonly tier: HistorianVerdictTier;
  readonly title: string;
  readonly summary: string;
}

/**
 * Resolves the 12th Amendment House Contingent Election when a 269-269 tie occurs (GR-15).
 * Voting is by state delegation: 1 vote per state (50 states total, 26 needed to win).
 * The District of Columbia has 0 votes under the 12th Amendment (DC excluded).
 */
export function resolveContingentElection(playerParty: 'D' | 'R'): ContingentElectionResult {
  const rollCall: ContingentStateVote[] = [];
  let playerStates = 0;
  let opponentStates = 0;
  let splitStates = 0;

  // Sourced 50 states from HOUSE_DELEGATIONS (119th Congress)
  const stateNameMap = new Map(us.states.rows.map((r) => [r.code, r.name]));
  for (const [stateCode, del] of Object.entries(HOUSE_DELEGATIONS)) {
    const stateName = stateNameMap.get(stateCode) ?? stateCode;
    let vote: 'D' | 'R' | 'split' = 'split';

    if (del.democrat > del.republican) {
      vote = 'D';
    } else if (del.republican > del.democrat) {
      vote = 'R';
    }

    let winner: 'player' | 'opponent' | 'split' = 'split';
    if (vote === playerParty) {
      winner = 'player';
      playerStates++;
    } else if (vote !== 'split') {
      winner = 'opponent';
      opponentStates++;
    } else {
      splitStates++;
    }

    rollCall.push({
      stateCode,
      stateName,
      democratSeats: del.democrat,
      republicanSeats: del.republican,
      vote,
      winner,
    });
  }

  // Sort state delegations alphabetically
  rollCall.sort((a, b) => a.stateName.localeCompare(b.stateName));

  let winner: 'player' | 'opponent' | 'deadlock' = 'deadlock';
  if (playerStates >= TO_WIN_CONTINGENT_STATES) {
    winner = 'player';
  } else if (opponentStates >= TO_WIN_CONTINGENT_STATES) {
    winner = 'opponent';
  }

  return {
    playerStates,
    opponentStates,
    splitStates,
    winner,
    rollCall,
  };
}

/**
 * Resolves the Electoral College presidential reelection at Turn 16 (ELC-01).
 * If neither candidate reaches 270 EV (269-269 tie), automatically invokes the
 * 12th Amendment House Contingent Election (GR-15).
 */
export function resolveReelection(
  gameState: GameState,
  playerParty: 'D' | 'R',
  overrideSummary?: ElectoralSummary,
): ElectionOutcome {
  const summary = overrideSummary ?? calculateElectoralCollege(gameState, playerParty);
  const playerEV = summary.playerVotes;
  const opponentEV = summary.opponentVotes;
  const isTie = playerEV === TO_WIN_ELECTORAL_VOTES - 1 && opponentEV === TO_WIN_ELECTORAL_VOTES - 1;

  // Build roll call for animated election night reveal:
  // Order: safe states first, then likely, then battlegrounds last for suspense
  const unitsList = Object.values(summary.units);
  const rollCall: StateRollCallItem[] = unitsList.map((unit) => ({
    code: unit.code,
    name: unit.name,
    electoralVotes: unit.electoralVotes,
    winner: unit.winner === 'you' ? 'player' : 'opponent',
    margin: unit.currentMargin,
    isBattleground: unit.isSwing,
  }));

  // Sort: non-battleground states first by margin magnitude, battleground states last
  rollCall.sort((a, b) => {
    if (a.isBattleground !== b.isBattleground) {
      return a.isBattleground ? 1 : -1;
    }
    return Math.abs(b.margin) - Math.abs(a.margin);
  });

  if (isTie) {
    const contingentResult = resolveContingentElection(playerParty);
    const winner = contingentResult.winner === 'player' ? 'player' : 'opponent';
    return {
      playerEV,
      opponentEV,
      isTie: true,
      winner,
      method: 'house_contingent',
      contingentResult,
      rollCall,
      tippingPointState: summary.tippingPointCode,
      summary,
    };
  }

  const winner: 'player' | 'opponent' = playerEV >= TO_WIN_ELECTORAL_VOTES ? 'player' : 'opponent';
  return {
    playerEV,
    opponentEV,
    isTie: false,
    winner,
    method: 'electoral_college',
    rollCall,
    tippingPointState: summary.tippingPointCode,
    summary,
  };
}

/**
 * Extracts the top 3 causal drivers explaining why the player won or lost reelection (ELC-03).
 */
export function extractElectionReasons(
  gameState: GameState,
  outcome: ElectionOutcome,
  _playerParty: 'D' | 'R',
): readonly string[] {
  const reasons: string[] = [];
  const won = outcome.winner === 'player';
  const approvalDelta = gameState.approval - RULES.startApproval.value;
  const inflDelta = gameState.econ.inflation - gameState.start.inflation;
  const unempDelta = gameState.econ.unemployment - gameState.start.unemployment;
  const realIncomeDelta = (gameState.econ.realIncome / gameState.start.medianIncome - 1) * PERCENT;

  // 1. National Approval & Mood
  if (won) {
    if (approvalDelta >= ELECTION_REASON_APPROVAL_DELTA) {
      reasons.push(`Strong national approval (+${approvalDelta.toFixed(1)}% vs baseline) built a resilient battleground coalition.`);
    } else {
      reasons.push('Narrow battleground holdouts preserved your Electoral College majority.');
    }
  } else {
    if (approvalDelta <= -ELECTION_REASON_APPROVAL_DELTA) {
      reasons.push(`Sagging national approval (${approvalDelta.toFixed(1)}% vs baseline) dragged swing states into the opponent column.`);
    } else {
      reasons.push('Key battleground margins slipped away despite a competitive national environment.');
    }
  }

  // 2. Cost of Living & Inflation
  if (inflDelta >= ELECTION_REASON_INFLATION_HIGH) {
    reasons.push(
      won
        ? `Surmounted voter frustration over elevated inflation (+${inflDelta.toFixed(1)} pp above start).`
        : `Persistent inflation (+${inflDelta.toFixed(1)} pp above start) alienated suburban and working-class voters.`,
    );
  } else if (inflDelta <= -ELECTION_REASON_INFLATION_LOW) {
    reasons.push(
      won
        ? `Cooling inflation (${gameState.econ.inflation.toFixed(1)}%) restored household purchasing power in crucial states.`
        : 'Disinflation alone was insufficient to overcome other voter concerns.',
    );
  }

  // 3. Jobs, Growth & Purchasing Power
  if (unempDelta <= -ELECTION_REASON_UNEMPLOYMENT_LOW || realIncomeDelta >= ELECTION_REASON_REAL_INCOME_HIGH) {
    reasons.push(
      won
        ? `Robust job market and growing real incomes (+${realIncomeDelta.toFixed(1)}%) anchored voter loyalty.`
        : `Strong employment numbers could not offset battleground tipping points.`,
    );
  } else if (unempDelta >= 1) {
    reasons.push(
      won
        ? 'Defied rising unemployment headwinds to secure reelection.'
        : `Weakening employment (${gameState.econ.unemployment.toFixed(1)}%) sparked voter backlash in industrial swing states.`,
    );
  } else {
    // Default sector trade / energy context
    reasons.push(
      won
        ? 'Targeted trade and economic policies protected vital agricultural and industrial constituencies.'
        : 'Economic headwinds in high-exposure farm and manufacturing counties decided the outcome.',
    );
  }

  return reasons.slice(0, MAX_ELECTION_REASONS);
}

/**
 * Simulates the 10 years (40 quarters) following presidential exit with policies held constant
 * and automatic stabilizers operating (ELC-05, GR-04).
 */
export function simulateTenYearLegacy(
  exitState: GameState,
  autopilotState: GameState,
): TenYearLegacyTrajectory {
  let player = exitState;
  let auto = autopilotState;

  const playerSeries: QuarterlyLegacyPoint[] = [];
  const autopilotSeries: QuarterlyLegacyPoint[] = [];

  for (let i = 0; i < LEGACY_QUARTERS; i++) {
    player = step(player, {}, { legacy: true });
    auto = step(auto, {}, { legacy: true });

    const q = i + 1;
    const yr = Math.floor(i / QUARTERS_PER_YEAR) + 1;

    playerSeries.push({
      quarter: q,
      year: yr,
      gdpGrowth: player.econ.growth,
      debtPct: (player.econ.debt / player.econ.gdp) * PERCENT,
      unemployment: player.econ.unemployment,
      inflation: player.econ.inflation,
      prosperityIndex: prosperity(player).index,
    });

    autopilotSeries.push({
      quarter: q,
      year: yr,
      gdpGrowth: auto.econ.growth,
      debtPct: (auto.econ.debt / auto.econ.gdp) * PERCENT,
      unemployment: auto.econ.unemployment,
      inflation: auto.econ.inflation,
      prosperityIndex: prosperity(auto).index,
    });
  }

  const finalPlayerScore = finalScore(exitState);
  const diff = scoreVsAutopilot(exitState, autopilotState);

  return {
    playerSeries,
    autopilotSeries,
    finalPlayerState: player,
    finalAutopilotState: auto,
    finalPlayerScore,
    scoreVsAutopilot: diff,
  };
}

/**
 * Classifies the 10-year presidential record into 5 nonpartisan historian verdict tiers (ELC-05).
 * Based strictly on objective outcome bands, never on ideology.
 */
export function classifyHistorianVerdict(scoreVsAutopilotTotal: number): HistorianVerdict {
  if (scoreVsAutopilotTotal >= HISTORIAN_TRANSFORMATIONAL_THRESHOLD) {
    return {
      tier: 'Transformational',
      title: 'Transformational Presidency',
      summary:
        'Historians place your administration among the most consequential in modern history, noting an enduring, generational expansion of national prosperity, economic resilience, and institutional stability.',
    };
  }

  if (scoreVsAutopilotTotal >= HISTORIAN_STABILITY_THRESHOLD) {
    return {
      tier: 'Steward of Stability',
      title: 'Steward of Stability',
      summary:
        'A disciplined, highly effective administration that maintained macroeconomic balance, navigated crises responsibly, and left the nation noticeably more prosperous than default autopilot governance.',
    };
  }

  if (scoreVsAutopilotTotal >= HISTORIAN_MIXED_LOW_THRESHOLD) {
    return {
      tier: 'Mixed Legacy',
      title: 'Mixed Legacy',
      summary:
        'A tenure marked by genuine policy accomplishments offset by lingering structural challenges, broadly matching what a caretaker administration would have produced over the same period.',
    };
  }

  if (scoreVsAutopilotTotal >= HISTORIAN_CRISIS_LOW_THRESHOLD) {
    return {
      tier: 'Presidency of Unresolved Crises',
      title: 'Presidency of Unresolved Crises',
      summary:
        'Severe economic volatility, persistent inflation, or escalating debt distress eroded public confidence, leaving successor administrations with burdensome fiscal and social imbalances.',
    };
  }

  return {
    tier: 'Institutional Breakdown',
    title: 'Institutional Breakdown',
    summary:
      'Ranked among the most troubled tenures in American history, characterized by compounding fiscal contraction, heightened institutional strain, and diminished long-term prosperity.',
  };
}
