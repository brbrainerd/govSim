// Balance harness (design.md Q31): scripted strategies play full games on many seeds.
import { describe, expect, it } from 'vitest';
import committedReport from '../../balance-report.json';
import { baseline, spendLevers, taxLevers, type BudgetDraft } from './budget';
import { autopilotDecisions, type Decisions } from './decisions';
import { enact, START } from './fixture';
import { endTurn, finalScore, newGame, projectedScore, scoreVsAutopilot, TOTAL_TURNS, type GameState } from './game';
import { resolveReelection } from './election';

const base = baseline();
const strategies: Record<string, BudgetDraft | null> = {
  autopilot: null,
  sensible: { ...base, inc: 24, bus: 22, rds: 115, rnd: 110, oth: 95 },
  maxDeficit: { ...base, inc: 10, bus: 10, inv: 10, pay: 10, tar: 0, def: 120, ssm: 110, mcd: 120, rds: 130, rnd: 130, oth: 120 },
  maxAusterity: { ...base, inc: 35, bus: 30, inv: 30, def: 80, ssm: 90, mcd: 80, rds: 80, rnd: 80, oth: 80 },
  tariffEverything: { ...base, tar: 35 },
};

function run(seed: number, budget: BudgetDraft | null): GameState[] {
  const out = [newGame(seed, START)];
  for (let t = 1; t < TOTAL_TURNS; t++) out.push(endTurn(out[t - 1]!, t === 1 && budget ? enact(budget) : {}));
  return out;
}

const seeds = Array.from({ length: 40 }, (_, i) => i + 1);
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const final = (name: string) => seeds.map((sd) => run(sd, strategies[name]!).at(-1)!);
const avgIndex = (name: string) => mean(final(name).map((s) => finalScore(s).total));

function pickSensibleCrisisOption(state: GameState): Decisions {
  if (!state.activeCrisis) return {};
  const crisis = state.activeCrisis;
  const affordable = crisis.options.filter((o) => o.cloutCost <= state.clout);
  const active = affordable.filter((o) => o.cloutCost > 0 && o.cloutCost <= 25);
  const choice = active[0] ?? affordable[0];
  return choice ? { crisis: { crisisId: crisis.crisisId, optionId: choice.id } } : {};
}

describe('balance', () => {
  it('keeps every indicator in a plausible range for every strategy and seed', () => {
    for (const name of Object.keys(strategies)) {
      for (const sd of seeds) {
        for (const s of run(sd, strategies[name]!)) {
          const e = s.econ;
          expect(e.unemployment).toBeGreaterThanOrEqual(2.5);
          expect(e.unemployment).toBeLessThanOrEqual(15);
          expect(e.inflation).toBeGreaterThan(-2.1);
          expect(e.inflation).toBeLessThan(12);
          expect(s.approval).toBeGreaterThanOrEqual(5);
          expect(s.approval).toBeLessThanOrEqual(95);
        }
      }
    }
  });

  it('has the expected directions', () => {
    const debtPct = (n: string) => mean(final(n).map((s) => s.econ.debt / s.econ.gdp));
    expect(debtPct('maxAusterity')).toBeLessThan(debtPct('autopilot'));
    expect(debtPct('maxDeficit')).toBeGreaterThan(debtPct('autopilot'));
    const peakInfl = (n: string) => mean(seeds.map((sd) => Math.max(...run(sd, strategies[n]!).map((s) => s.econ.inflation))));
    expect(peakInfl('tariffEverything')).toBeGreaterThan(peakInfl('autopilot'));
  });

  it('does not let a degenerate strategy beat sensible play', () => {
    const sensible = avgIndex('sensible');
    const auto = avgIndex('autopilot');
    const headroom = sensible - auto;
    expect(headroom).toBeGreaterThanOrEqual(2.0);
    expect(headroom).toBeLessThanOrEqual(10.0);
    for (const bad of ['maxDeficit', 'tariffEverything']) expect(avgIndex(bad)).toBeLessThan(sensible);
  });

  it('matches committed balance-report.json within tolerance (GR-35)', () => {
    const seeds100 = Array.from({ length: 100 }, (_, i) => i + 1);
    for (const strat of ['autopilot', 'sensible', 'maxDeficit', 'maxAusterity']) {
      const finalStates = seeds100.map((sd) => run(sd, strategies[strat]!).at(-1)!);
      const scores = finalStates.map((s) => finalScore(s).total);
      const liveMean = mean(scores);
      const expectedMean = committedReport.strategies[strat as keyof typeof committedReport.strategies].meanScore;
      expect(Math.abs(liveMean - expectedMean)).toBeLessThan(0.5);
    }
  });

  it('verifies that every budget lever moves the score non-trivially (GR-28, GR-36)', () => {
    const autoMean = avgIndex('autopilot');
    for (const lever of [...taxLevers, ...spendLevers]) {
      const minStates = seeds.map((sd) => run(sd, { ...base, [lever.id]: lever.min }).at(-1)!);
      const maxStates = seeds.map((sd) => run(sd, { ...base, [lever.id]: lever.max }).at(-1)!);
      const minMean = mean(minStates.map((s) => finalScore(s).total));
      const maxMean = mean(maxStates.map((s) => finalScore(s).total));
      const swing = Math.abs(maxMean - minMean);
      const maxDistFromAuto = Math.max(Math.abs(minMean - autoMean), Math.abs(maxMean - autoMean));
      expect(Math.max(swing, maxDistFromAuto)).toBeGreaterThanOrEqual(0.3);
    }
  });

  it('unifies top bar and end-screen scoring and satisfies GR-04 calibration', () => {
    // 1. One exported function defines the comparison (GR-04)
    expect(projectedScore).toBe(finalScore);

    // 2. Over benchmark strategies, headline score sign matches final score sign in >= 95% at turn 16
    let totalChecks = 0;
    let signMatches = 0;
    for (const stratName of ['sensible', 'maxDeficit', 'maxAusterity', 'tariffEverything']) {
      for (const sd of seeds) {
        const full = run(sd, strategies[stratName]!);
        const auto = run(sd, strategies['autopilot']!);
        const s16 = full[15]!;
        const auto16 = auto[15]!;
        const headline16 = scoreVsAutopilot(s16, auto16).total;

        const s32 = full.at(-1)!;
        const auto32 = auto.at(-1)!;
        const finalDiff = finalScore(s32).total - finalScore(auto32).total;

        totalChecks++;
        const s16Sign = Math.sign(Math.round(headline16 * 10) / 10);
        const finalSign = Math.sign(Math.round(finalDiff * 10) / 10);
        if (s16Sign === finalSign || s16Sign === 0 || finalSign === 0) {
          signMatches++;
        }
      }
    }
    const matchRate = signMatches / totalChecks;
    expect(matchRate).toBeGreaterThanOrEqual(0.95);

    // 3. maxDeficit must show a negative headline before turn 16 in at least 80% of seeds
    let negBefore16Count = 0;
    for (const sd of seeds) {
      const full = run(sd, strategies['maxDeficit']!);
      const auto = run(sd, strategies['autopilot']!);
      let showedNegative = false;
      for (let t = 1; t < 16; t++) {
        const diff = scoreVsAutopilot(full[t]!, auto[t]!).total;
        if (diff < -0.05) {
          showedNegative = true;
          break;
        }
      }
      if (showedNegative) negBefore16Count++;
    }
    const negRate = negBefore16Count / seeds.length;
    expect(negRate).toBeGreaterThanOrEqual(0.8);
  });

  it('verifies crisis balance calibration (GR-10, GR-12)', () => {
    const seeds100 = Array.from({ length: 100 }, (_, i) => i + 1);

    function runSensibleWithCrises(seed: number): GameState {
      let s = newGame(seed, START);
      for (let t = 1; t < TOTAL_TURNS; t++) {
        const dec: Decisions = t === 1 ? enact(strategies.sensible!) : {};
        if (s.activeCrisis) {
          const cDec = pickSensibleCrisisOption(s);
          if (cDec.crisis) dec.crisis = cDec.crisis;
        }
        s = endTurn(s, dec);
      }
      return s;
    }

    function runAutopilotWithCrises(seed: number): GameState {
      let s = newGame(seed, START);
      for (let t = 1; t < TOTAL_TURNS; t++) {
        s = endTurn(s, autopilotDecisions(s));
      }
      return s;
    }

    function runBadWithCrises(seed: number, budget: BudgetDraft): GameState {
      let s = newGame(seed, START);
      for (let t = 1; t < TOTAL_TURNS; t++) {
        const dec: Decisions = t === 1 ? enact(budget) : autopilotDecisions(s);
        s = endTurn(s, dec);
      }
      return s;
    }

    let sensibleWins = 0;
    const diffs: number[] = [];
    const autoTotals: number[] = [];
    const maxDefTotals: number[] = [];
    const tariffTotals: number[] = [];

    for (const seed of seeds100) {
      const sensibleState = runSensibleWithCrises(seed);
      const autoState = runAutopilotWithCrises(seed);
      const maxDefState = runBadWithCrises(seed, strategies.maxDeficit!);
      const tariffState = runBadWithCrises(seed, strategies.tariffEverything!);

      const sensScore = finalScore(sensibleState).total;
      const autoScore = finalScore(autoState).total;
      const maxDefScore = finalScore(maxDefState).total;
      const tariffScore = finalScore(tariffState).total;

      const diff = sensScore - autoScore;
      diffs.push(diff);
      if (diff > 0) sensibleWins++;

      autoTotals.push(autoScore);
      maxDefTotals.push(maxDefScore);
      tariffTotals.push(tariffScore);
    }

    const meanDiff = mean(diffs);
    expect(meanDiff).toBeGreaterThanOrEqual(2.0);
    expect(meanDiff).toBeLessThanOrEqual(10.0);

    const winRate = sensibleWins / seeds100.length;
    expect(winRate).toBeGreaterThanOrEqual(0.75);

    expect(mean(autoTotals)).toBeGreaterThan(mean(maxDefTotals));
    expect(mean(autoTotals)).toBeGreaterThan(mean(tariffTotals));
  });

  it('confirms speech spamming and clout hoarding do not beat sensible play (GR-10, GR-11)', () => {
    const sensibleScores: number[] = [];
    const speechSpamScores: number[] = [];
    const hoardingScores: number[] = [];

    for (const sd of seeds) {
      const sensFinal = run(sd, strategies.sensible!).at(-1)!;
      sensibleScores.push(finalScore(sensFinal).total);

      let sSpam = newGame(sd, START);
      for (let t = 1; t < TOTAL_TURNS; t++) {
        sSpam = endTurn(sSpam, { powers: { speech: { audience: 'general' } } });
      }
      speechSpamScores.push(finalScore(sSpam).total);

      const hoardFinal = run(sd, null).at(-1)!;
      hoardingScores.push(finalScore(hoardFinal).total);
    }

    const sensMean = mean(sensibleScores);
    const speechMean = mean(speechSpamScores);
    const hoardMean = mean(hoardingScores);

    expect(sensMean).toBeGreaterThan(speechMean);
    expect(sensMean).toBeGreaterThan(hoardMean);
  });

  it('validates training (seeds 1-40) and validation (seeds 41-80) sets against degenerate bots and reelection calibration (GR-10, GR-11, GR-15)', () => {
    const trainingSeeds = Array.from({ length: 40 }, (_, i) => i + 1);
    const validationSeeds = Array.from({ length: 40 }, (_, i) => i + 41);

    function runHoard(seed: number): GameState[] {
      const out = [newGame(seed, START)];
      for (let t = 1; t < TOTAL_TURNS; t++) {
        out.push(endTurn(out[t - 1]!, {}));
      }
      return out;
    }

    function runSpam(seed: number): GameState[] {
      const out = [newGame(seed, START)];
      for (let t = 1; t < TOTAL_TURNS; t++) {
        const dec: Decisions = {
          powers: {
            speech: { audience: 'general' },
            pressureFed: true,
            signOrders: t === 1 ? ['eo-infrastructure-fast-track'] : undefined,
          },
        };
        if (t === 1) {
          dec.bill = enact(strategies.maxDeficit!).bill;
        }
        out.push(endTurn(out[t - 1]!, dec));
      }
      return out;
    }

    function runSensible(seed: number): GameState[] {
      let s = newGame(seed, START);
      const out = [s];
      for (let t = 1; t < TOTAL_TURNS; t++) {
        const dec: Decisions = t === 1 ? enact(strategies.sensible!) : {};
        if (s.activeCrisis) {
          const cDec = pickSensibleCrisisOption(s);
          if (cDec.crisis) dec.crisis = cDec.crisis;
        }
        if (s.clout >= 35 && s.speechCountInWindow === 0) {
          dec.powers = { speech: { audience: 'general' } };
        }
        s = endTurn(s, dec);
        out.push(s);
      }
      return out;
    }

    for (const [setName, seedGroup] of [
      ['training', trainingSeeds],
      ['validation', validationSeeds],
    ] as const) {
      const sensFinals = seedGroup.map((sd) => runSensible(sd).at(-1)!);
      const autoFinals = seedGroup.map((sd) => run(sd, null).at(-1)!);
      const hoardFinals = seedGroup.map((sd) => runHoard(sd).at(-1)!);
      const spamFinals = seedGroup.map((sd) => runSpam(sd).at(-1)!);

      const sensScores = sensFinals.map((s) => finalScore(s).total);
      const autoScores = autoFinals.map((s) => finalScore(s).total);
      const hoardScores = hoardFinals.map((s) => finalScore(s).total);
      const spamScores = spamFinals.map((s) => finalScore(s).total);

      const sensMean = mean(sensScores);
      const autoMean = mean(autoScores);
      const hoardMean = mean(hoardScores);
      const spamMean = mean(spamScores);

      const headroom = sensMean - autoMean;
      expect(headroom, `${setName} sensible headroom`).toBeGreaterThanOrEqual(2.0);
      expect(headroom, `${setName} sensible headroom`).toBeLessThanOrEqual(10.0);

      expect(sensMean, `${setName} beats hoard`).toBeGreaterThan(hoardMean);
      expect(sensMean, `${setName} beats spam`).toBeGreaterThan(spamMean);

      // Reelection rate check at Turn 16
      const s16List = seedGroup.map((sd) => runSensible(sd)[15]!);
      const winsD = s16List.filter((s) => resolveReelection(s, 'D').winner === 'player').length;
      const rateD = winsD / seedGroup.length;
      expect(rateD, `${setName} D reelection rate`).toBeGreaterThanOrEqual(0.40);
      expect(rateD, `${setName} D reelection rate`).toBeLessThanOrEqual(0.85);
    }
  });
});
