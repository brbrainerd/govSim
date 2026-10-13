import { describe, expect, it } from 'vitest';
import { fromData, us } from '../data/us';
import {
  classifyHistorianVerdict,
  extractElectionReasons,
  resolveContingentElection,
  resolveReelection,
  simulateTenYearLegacy,
} from './election';
import { newGame, step } from './game';
import {
  LEGACY_QUARTERS,
  TO_WIN_CONTINGENT_STATES,
  TO_WIN_ELECTORAL_VOTES,
  TOTAL_ELECTORAL_VOTES,
  TOTAL_STATES,
} from './units';
import { calculateElectoralCollege, type ElectoralSummary, type StateVoterState } from './voters';

describe('election engine (ELC-01..ELC-05, GR-15, GR-04)', () => {
  const game = newGame(42, fromData(us));

  it('resolves standard Electoral College election (ELC-01)', () => {
    const outcomeD = resolveReelection(game, 'D');
    expect(outcomeD.playerEV + outcomeD.opponentEV).toBe(TOTAL_ELECTORAL_VOTES);
    expect(outcomeD.method).toBe('electoral_college');
    expect(outcomeD.isTie).toBe(false);
    expect(['player', 'opponent']).toContain(outcomeD.winner);
    expect(outcomeD.rollCall.length).toBe(56); // 50 states + DC + 5 districts

    // Safe states appear before battleground states in roll call for dramatic pacing
    const firstItem = outcomeD.rollCall[0]!;
    const lastItem = outcomeD.rollCall[outcomeD.rollCall.length - 1]!;
    expect(firstItem.isBattleground).toBe(false);
    expect(lastItem.isBattleground).toBe(true);
  });

  it('resolves 12th Amendment House contingent election on a 269-269 tie (GR-15)', () => {
    // 1. Direct unit test of resolveContingentElection
    const resD = resolveContingentElection('D');
    const resR = resolveContingentElection('R');

    expect(resD.rollCall.length).toBe(TOTAL_STATES); // Exactly 50 states
    expect(resR.rollCall.length).toBe(TOTAL_STATES);

    // Verify DC is excluded per 12th Amendment
    expect(resD.rollCall.some((s) => s.stateCode === 'DC')).toBe(false);

    // Total state votes equal 50
    expect(resD.playerStates + resD.opponentStates + resD.splitStates).toBe(TOTAL_STATES);
    expect(resR.playerStates + resR.opponentStates + resR.splitStates).toBe(TOTAL_STATES);

    // D and R perspectives are mirrors of each other
    expect(resD.playerStates).toBe(resR.opponentStates);
    expect(resD.opponentStates).toBe(resR.playerStates);
    expect(resD.splitStates).toBe(resR.splitStates);

    // 26 states needed to win
    if (resD.playerStates >= TO_WIN_CONTINGENT_STATES) {
      expect(resD.winner).toBe('player');
    } else if (resD.opponentStates >= TO_WIN_CONTINGENT_STATES) {
      expect(resD.winner).toBe('opponent');
    } else {
      expect(resD.winner).toBe('deadlock');
    }

    // 2. Integration test via resolveReelection with mock tie fixture (GR-15)
    const baseSummary = calculateElectoralCollege(game, 'D');
    const tieSummary: ElectoralSummary = {
      ...baseSummary,
      playerVotes: 269,
      opponentVotes: 269,
      tossupVotes: 0,
    };

    const tieOutcome = resolveReelection(game, 'D', tieSummary);
    expect(tieOutcome.isTie).toBe(true);
    expect(tieOutcome.playerEV).toBe(269);
    expect(tieOutcome.opponentEV).toBe(269);
    expect(tieOutcome.method).toBe('house_contingent');
    expect(tieOutcome.contingentResult).toBeDefined();
    expect(tieOutcome.contingentResult!.rollCall.length).toBe(TOTAL_STATES);
    expect(['player', 'opponent', 'deadlock']).toContain(tieOutcome.winner);
  });

  it('extracts top causal reasons explaining why the player won or lost (ELC-03)', () => {
    const outcome = resolveReelection(game, 'D');
    const reasons = extractElectionReasons(game, outcome, 'D');

    expect(reasons.length).toBeGreaterThanOrEqual(1);
    expect(reasons.length).toBeLessThanOrEqual(3);
    for (const r of reasons) {
      expect(typeof r).toBe('string');
      expect(r.length).toBeGreaterThan(15);
    }
  });

  it('simulates 10-year legacy projection forward with 40 quarterly points (ELC-05, GR-04)', () => {
    const autopilot = newGame(42, fromData(us));
    const legacy = simulateTenYearLegacy(game, autopilot);

    expect(legacy.playerSeries.length).toBe(LEGACY_QUARTERS);
    expect(legacy.autopilotSeries.length).toBe(LEGACY_QUARTERS);

    const firstPt = legacy.playerSeries[0]!;
    const lastPt = legacy.playerSeries[LEGACY_QUARTERS - 1]!;
    expect(firstPt.quarter).toBe(1);
    expect(firstPt.year).toBe(1);
    expect(lastPt.quarter).toBe(40);
    expect(lastPt.year).toBe(10);

    // Verify all metrics are finite and bounded
    for (const pt of legacy.playerSeries) {
      expect(Number.isFinite(pt.gdpGrowth)).toBe(true);
      expect(Number.isFinite(pt.debtPct)).toBe(true);
      expect(Number.isFinite(pt.unemployment)).toBe(true);
      expect(Number.isFinite(pt.inflation)).toBe(true);
      expect(Number.isFinite(pt.prosperityIndex)).toBe(true);
    }

    // Verify scoring consistency with finalScore and scoreVsAutopilot (GR-04)
    expect(Number.isFinite(legacy.finalPlayerScore.total)).toBe(true);
    expect(Number.isFinite(legacy.scoreVsAutopilot.total)).toBe(true);
    expect(legacy.scoreVsAutopilot.total).toBeCloseTo(0, 5); // Identical initial game states
  });

  it('classifies nonpartisan historian verdict tiers across all boundaries (ELC-05)', () => {
    expect(classifyHistorianVerdict(12.5).tier).toBe('Transformational');
    expect(classifyHistorianVerdict(10.0).tier).toBe('Transformational');
    expect(classifyHistorianVerdict(5.2).tier).toBe('Steward of Stability');
    expect(classifyHistorianVerdict(3.0).tier).toBe('Steward of Stability');
    expect(classifyHistorianVerdict(1.0).tier).toBe('Mixed Legacy');
    expect(classifyHistorianVerdict(0.0).tier).toBe('Mixed Legacy');
    expect(classifyHistorianVerdict(-2.5).tier).toBe('Mixed Legacy');
    expect(classifyHistorianVerdict(-3.5).tier).toBe('Presidency of Unresolved Crises');
    expect(classifyHistorianVerdict(-9.9).tier).toBe('Presidency of Unresolved Crises');
    expect(classifyHistorianVerdict(-10.1).tier).toBe('Institutional Breakdown');
    expect(classifyHistorianVerdict(-15.0).tier).toBe('Institutional Breakdown');

    // Summaries exist and are objective/nonpartisan
    for (const delta of [11.0, 4.0, 0.0, -5.0, -12.0]) {
      const verdict = classifyHistorianVerdict(delta);
      expect(verdict.title.length).toBeGreaterThan(5);
      expect(verdict.summary.length).toBeGreaterThan(30);
    }
  });
});
