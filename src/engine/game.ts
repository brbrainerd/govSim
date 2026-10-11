// Pure, deterministic engine core (design.md §3, §8). No UI imports.
// Stylized quarterly macro model (Q3: real start, stylized dynamics). Coefficients are hand-set
// round numbers chosen for plausible direction and size, not estimates; every one is named here.
import { baseline, estimate, taxLevers, type BudgetDraft } from './budget';
import { C } from './coefficients';
import { resolveBill, type Decisions } from './decisions';
import { clamp, tanhPade } from './detmath';
import { normal } from './rng';
import { Ledger, type Term, type TraceKey } from './trace';

export const TOTAL_TURNS = 32;

/** Real-world starting values (from data/us-2026.json via fromData). */
export interface Start {
  gdp: number; // $tn nominal, annualized
  potential: number; // % real potential growth per year
  unemployment: number; // %
  empPop: number; // %
  inflation: number; // % yoy
  fedRate: number; // %
  medianIncome: number; // $
  gini: number;
  lifeExp: number;
  debtPct: number; // debt held by public, % GDP
  deficitPct: number; // % GDP
  tariff: number; // effective rate %
  trust: number; // %
  crime: number; // violent crimes per 100k
}

export interface Econ {
  gap: number; // output gap, % of potential
  growth: number; // real GDP growth, % annualized, last quarter
  unemployment: number;
  empPop: number;
  inflation: number;
  expected: number; // inflation expectations
  fedRate: number;
  gdp: number;
  debt: number; // $tn
  realIncome: number; // median household income, start-year dollars
  gini: number;
  lifeExp: number;
  trust: number;
  crime: number;
}

export interface GameState {
  readonly seed: number;
  readonly turn: number; // 1-based
  readonly approval: number;
  readonly clout: number;
  readonly policy: BudgetDraft; // enacted budget levers
  readonly econ: Econ;
  readonly start: Start;
  readonly report: Report; // what happened last turn
}

/** One thing that happened last turn (a bill passed, failed or was rejected). */
export interface LogEntry { kind: string; id: string; detail?: string; amount?: number }

/** `luck`: raw outside shocks of the last step, in standard deviations, never dependent on decisions. */
export interface Report {
  readonly luck: { gap: number; infl: number; appr: number };
  readonly log: readonly LogEntry[];
  /** Named terms behind each indicator's change this turn (FND-04); empty before the first step. */
  readonly trace: Partial<Record<TraceKey, readonly Term[]>>;
}

export type { Decisions } from './decisions';

const tariffOf = (p: BudgetDraft) => p.tar ?? taxLevers.find((l) => l.id === 'tar')!.base;

// ---- lifecycle ----------------------------------------------------------------------------
export function newGame(seed: number, start: Start): GameState {
  return {
    seed,
    turn: 1,
    approval: 52,
    clout: 120,
    policy: baseline(),
    start,
    report: { luck: { gap: 0, infl: 0, appr: 0 }, log: [], trace: {} },
    econ: {
      gap: 0,
      growth: start.potential,
      unemployment: start.unemployment,
      empPop: start.empPop,
      inflation: start.inflation,
      expected: start.inflation,
      fedRate: start.fedRate,
      gdp: start.gdp,
      debt: (start.debtPct / 100) * start.gdp,
      realIncome: start.medianIncome,
      gini: start.gini,
      lifeExp: start.lifeExp,
      trust: start.trust,
      crime: start.crime,
    },
  };
}

export function endTurn(state: GameState, decisions: Decisions = {}): GameState {
  return state.turn >= TOTAL_TURNS ? state : step(state, decisions);
}

/** One quarter of the model, uncapped (also used for the legacy projection). */
export function step(state: GameState, decisions: Decisions): GameState {
  const s = state.start, e = state.econ;
  const zGap = normal(state.seed, 'macro', state.turn, 'gap');
  const zInfl = normal(state.seed, 'macro', state.turn, 'infl');
  const zAppr = normal(state.seed, 'macro', state.turn, 'appr');

  // The engine charges clout from the raw bill; the Session previews with the same function.
  const r = decisions.bill ? resolveBill(state.clout, decisions.bill) : null;
  const enacted = r && r.valid && r.passed ? r : null;
  const policy = enacted ? enacted.budget : state.policy;
  const before = estimate(state.policy), after = estimate(policy);
  const fiscalImpulse = ((after.deficitBn - before.deficitBn) / 10 / (e.gdp * 1000)) * 100; // % GDP per year
  const tariffChange = tariffOf(policy) - tariffOf(state.policy);
  const debtPctNow = (e.debt / e.gdp) * 100;
  const potential = s.potential + C.potentialMax * tanhPade(after.growth) - C.crowdOut * Math.max(0, debtPctNow - s.debtPct);

  const realRate = e.fedRate - e.inflation;
  const g = new Ledger();
  g.add('momentum', (C.gapPersistence - 1) * e.gap);
  g.add('budget', C.fiscalMultiplier * fiscalImpulse);
  g.add('debt:stress', -C.debtStressGap * Math.max(0, (debtPctNow - C.crisisAt) / C.debtStressUnit));
  g.add('fed:drag', -C.rateDrag * (realRate - C.neutralReal));
  g.add('luck', C.shockGap * zGap);
  const gap = e.gap + g.sum;
  const growth = potential + 4 * (gap - e.gap);
  const unemployment = clamp(s.unemployment - C.okun * gap, 2.5, 15);
  const inflation = clamp(e.inflation + C.expectPull * (e.expected - e.inflation) + C.phillips * gap
    + C.tariffPass * tariffChange + C.shockInfl * zInfl, -2, 15);
  const expected = (1 - C.expectAdapt) * e.expected + C.expectAdapt * inflation;
  const target = C.neutralReal + inflation + C.taylorInfl * (inflation - 2) + C.taylorGap * gap;
  const fedRate = clamp(Math.round((e.fedRate + C.fedSmooth * (target - e.fedRate)) * 4) / 4, 0, 10);

  const gdp = e.gdp * (1 + (growth + inflation) / 400);
  const stress = Math.max(0, debtPctNow - C.crisisAt) / 10; // debt crisis: bond-market stress
  const borrowingCost = (fedRate - s.fedRate) * 0.5 + C.termPremium * Math.max(0, debtPctNow - s.debtPct) + 1.5 * stress;
  const interestDrift = (borrowingCost * e.debt) / 100; // $tn/yr above the starting interest bill
  const deficit = (s.deficitPct / 100) * gdp + after.deficitBn / 10 / 1000 + interestDrift; // $tn/yr
  const debt = e.debt + deficit / 4;

  const realIncome = e.realIncome * (1 + (0.8 * growth) / 400) + (enacted ? (after.familyMonthly - before.familyMonthly) * 12 : 0);
  const spendDev = (k: string) => (policy[k] ?? 100) - 100;
  // Level effects: indicators move toward a policy-dependent target instead of drifting forever.
  const quarters = state.turn; // quarters since the start, incl. legacy projection
  const lifeTarget = s.lifeExp + 0.01 * quarters + 0.015 * (spendDev('mcd') + spendDev('ssm'));
  const lifeExp = e.lifeExp + 0.1 * (lifeTarget - e.lifeExp);
  const giniTarget = s.gini - 0.0015 * ((policy.inc ?? 22) - 22) - 0.0005 * spendDev('mcd');
  const gini = clamp(e.gini + 0.05 * (giniTarget - e.gini), 0.3, 0.6);
  const crime = e.crime * (1 + 0.004 * (unemployment - s.unemployment) - 0.001);

  const honeymoon = Math.max(0, C.honeymoon * (1 - (state.turn - 1) / 4));
  const approvalTarget = 50 + honeymoon - 2.5 * (unemployment - s.unemployment)
    - 2 * Math.max(0, inflation - 2.5) + 1.5 * (growth - s.potential);
  const approval = Math.round(clamp(state.approval + C.approvalPull * (approvalTarget - state.approval) + C.shockApproval * zAppr, 5, 95));
  const trust = clamp(e.trust + 0.1 * (s.trust + 0.4 * (approval - 50) - e.trust), 5, 80);

  const log: LogEntry[] = [];
  if (r) log.push(r.valid ? { kind: 'bill', id: r.passed ? 'passed' : 'failed', amount: r.whip.total } : { kind: 'bill', id: 'rejected', detail: 'unaffordable' });

  return {
    ...state,
    turn: state.turn + 1,
    approval,
    clout: Math.max(0, state.clout + (r ? r.cloutDelta : 0) + Math.round(approval / 10)),
    policy,
    report: { luck: { gap: zGap, infl: zInfl, appr: zAppr }, log, trace: { gap: g.terms } },
    econ: {
      gap, growth, unemployment, empPop: s.empPop - C.empPerU * (unemployment - s.unemployment),
      inflation, expected, fedRate, gdp, debt, realIncome, gini, lifeExp, trust, crime,
    },
  };
}

// ---- scoring ------------------------------------------------------------------------------
/** Prosperity index components (design.md §2): 50 = where you started, 0..100. */
export function prosperity(state: GameState) {
  const s = state.start, e = state.econ;
  const score = (x: number) => clamp(x, 0, 100);
  const parts = {
    income: { w: 0.25, v: score(50 + (e.realIncome / s.medianIncome - 1) * 250) },
    employment: { w: 0.15, v: score(50 + (e.empPop - s.empPop) * 16) },
    inflation: { w: 0.1, v: score(100 - 20 * Math.abs(e.inflation - 2)) },
    debt: { w: 0.15, v: score(50 - ((e.debt / e.gdp) * 100 - s.debtPct) * 1.25) },
    lifeExp: { w: 0.1, v: score(50 + (e.lifeExp - s.lifeExp) * 50) },
    inequality: { w: 0.1, v: score(50 - (e.gini - s.gini) * 2500) },
    security: { w: 0.1, v: score(50 - (e.crime / s.crime - 1) * 500) },
    trust: { w: 0.05, v: score(50 + (e.trust - s.trust) * 5) },
  };
  const index = Object.values(parts).reduce((a, p) => a + p.w * p.v, 0);
  return { index, parts };
}

export const LEGACY_QUARTERS = 40;

/** The country 10 years after you leave, if nobody changes your policies (design.md §2). */
export function legacy(state: GameState): GameState {
  let s = state;
  for (let i = 0; i < LEGACY_QUARTERS; i++) s = step(s, {});
  return s;
}

/** Final score: half how you leave the country, half how it holds up a decade later. */
export function finalScore(state: GameState) {
  const now = prosperity(state).index, later = prosperity(legacy(state)).index;
  return { now, later, total: (now + later) / 2 };
}
