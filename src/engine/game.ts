// Pure, deterministic engine core (design.md §3, §8). No UI imports.
// Stylized quarterly macro model (Q3: real start, stylized dynamics). Coefficients are hand-set
// round numbers chosen for plausible direction and size, not estimates; every one lives in coefficients.ts.
import { baseline, estimate, spendLevers, taxLevers, type BudgetDraft } from './budget';
import { C, LIMITS, RULES, SCORE } from './coefficients';
import { resolveBill, type Decisions } from './decisions';
import { clamp, tanhPade } from './detmath';
import { normal } from './rng';
import { prosperity } from './score';
import { Ledger, type Term, type TraceKey } from './trace';
import { BN_PER_TN, BUDGET_WINDOW_YEARS, LEGACY_QUARTERS, MONTHS_PER_YEAR, PERCENT, QUARTERS_PER_YEAR, TOTAL_TURNS } from './units';

export { prosperity } from './score';
export { LEGACY_QUARTERS, TOTAL_TURNS };

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

const leverBase = (id: string) => [...taxLevers, ...spendLevers].find((l) => l.id === id)!.base;
const tariffOf = (p: BudgetDraft) => p.tar ?? leverBase('tar');
/** How far a lever sits from its base (a missing lever counts as the base). */
const leverDev = (p: BudgetDraft, id: string) => (p[id] ?? leverBase(id)) - leverBase(id);

// ---- lifecycle ----------------------------------------------------------------------------
export function newGame(seed: number, start: Start): GameState {
  return {
    seed,
    turn: 1,
    approval: RULES.startApproval.value,
    clout: RULES.startClout.value,
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
      debt: (start.debtPct / PERCENT) * start.gdp,
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

/**
 * One quarter of the model, uncapped (also used for the legacy projection). Every indicator is
 * `before + a Ledger of named terms` (FND-04); clamps and rounding are recorded as bounded residuals.
 */
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
  const fiscalImpulse = ((after.deficitBn - before.deficitBn) / BUDGET_WINDOW_YEARS / (e.gdp * BN_PER_TN)) * PERCENT; // % GDP per year
  const tariffChange = tariffOf(policy) - tariffOf(state.policy);
  const debtPctNow = (e.debt / e.gdp) * PERCENT;
  const stress = Math.max(0, debtPctNow - C.crisisAt) / C.debtStressUnit; // debt crisis: bond-market stress

  // Output gap: the one ledger growth, unemployment and employment reuse.
  const g = new Ledger();
  g.add('momentum', (C.gapPersistence - 1) * e.gap);
  g.add('budget', C.fiscalMultiplier * fiscalImpulse);
  g.add('debt:stress', -C.debtStressGap * stress);
  g.add('fed:drag', -C.rateDrag * (e.fedRate - e.inflation - C.neutralReal));
  g.add('luck', C.shockGap * zGap);
  const gap = e.gap + g.sum;

  // Growth is a level: potential plus the annualized change in the gap.
  const gr = new Ledger();
  gr.add('potential:base', s.potential);
  gr.add('potential:policy', C.potentialMax * tanhPade(after.growth));
  gr.add('potential:crowding', -C.crowdOut * Math.max(0, debtPctNow - s.debtPct));
  for (const t of g.scaled(QUARTERS_PER_YEAR).terms) gr.add(t.source, t.amount);
  const growth = gr.sum;

  // Unemployment and employment are level-defined; settleTo carries any clamp or noise as `clamp`.
  const un = g.scaled(-C.okun);
  const unemployment = un.settleTo(e.unemployment, clamp(s.unemployment - C.okun * gap, ...LIMITS.unemployment.bounds));
  const em = un.scaled(-C.empPerU);
  const empPop = em.settleTo(e.empPop, s.empPop - C.empPerU * (unemployment - s.unemployment));

  const inf = new Ledger();
  inf.add('expectations', C.expectPull * (e.expected - e.inflation));
  inf.add('demand', C.phillips * gap);
  inf.add('tariffs', C.tariffPass * tariffChange);
  inf.add('luck', C.shockInfl * zInfl);
  const inflation = inf.clamp(e.inflation + inf.sum, ...LIMITS.inflation.bounds);
  const ex = new Ledger();
  ex.add('prices', C.expectAdapt * (inflation - e.expected));
  const expected = e.expected + ex.sum;

  // Policy rate: round to the step first, then clamp (as before).
  const fed = new Ledger();
  fed.add('fed:neutral', C.fedSmooth * (C.neutralReal + inflation - e.fedRate));
  fed.add('fed:inflationGap', C.fedSmooth * C.taylorInfl * (inflation - C.inflTarget));
  fed.add('fed:outputGap', C.fedSmooth * C.taylorGap * gap);
  const fedRate = fed.clamp(fed.round(e.fedRate + fed.sum, C.fedStep), ...LIMITS.fedRate.bounds);

  const gdp = e.gdp * (1 + (growth + inflation) / (QUARTERS_PER_YEAR * PERCENT));
  const borrowingCost = (fedRate - s.fedRate) * C.fedPassThrough + C.termPremium * Math.max(0, debtPctNow - s.debtPct) + C.stressPremium * stress;
  const interestDrift = (borrowingCost * e.debt) / PERCENT; // $tn/yr above the starting interest bill
  const budgetDeficit = after.deficitBn / BUDGET_WINDOW_YEARS / BN_PER_TN; // $tn/yr
  const deficit = (s.deficitPct / PERCENT) * gdp + budgetDeficit + interestDrift; // $tn/yr
  const debt = e.debt + deficit / QUARTERS_PER_YEAR;

  // Debt/GDP is traced instead of $ debt: the score and the UI read the ratio.
  const perQuarter = PERCENT / (QUARTERS_PER_YEAR * gdp); // debt/GDP pts per $tn/yr of deficit for one quarter
  const dp = new Ledger();
  dp.add('deficit:base', s.deficitPct / QUARTERS_PER_YEAR);
  dp.add('deficit:budget', budgetDeficit * perQuarter);
  dp.add('deficit:interest', interestDrift * perQuarter);
  dp.add('gdp:growth', PERCENT * e.debt * (1 / gdp - 1 / e.gdp)); // a bigger economy dilutes the old debt

  const inc = new Ledger();
  inc.add('growth', (e.realIncome * (C.incomeGrowthShare * growth)) / (QUARTERS_PER_YEAR * PERCENT));
  if (enacted) inc.add('budget:family', (after.familyMonthly - before.familyMonthly) * MONTHS_PER_YEAR);
  const realIncome = e.realIncome + inc.sum;

  // Level effects: indicators move toward a policy-dependent target instead of drifting forever.
  // The life expectancy trend grows with state.turn, the quarters since the start (incl. the legacy projection).
  const lf = new Ledger();
  lf.add('health:trend', C.lifeAdjust * C.lifeTrend * state.turn);
  lf.add('health:spending', C.lifeAdjust * C.lifeSpending * (leverDev(policy, 'mcd') + leverDev(policy, 'ssm')));
  lf.add('health:reversion', C.lifeAdjust * (s.lifeExp - e.lifeExp));
  const lifeExp = e.lifeExp + lf.sum;
  const gn = new Ledger();
  gn.add('tax:income', -C.giniAdjust * C.giniIncomeTax * leverDev(policy, 'inc'));
  gn.add('spend:medicaid', -C.giniAdjust * C.giniMedicaid * leverDev(policy, 'mcd'));
  gn.add('gini:reversion', C.giniAdjust * (s.gini - e.gini));
  const gini = gn.clamp(e.gini + gn.sum, ...LIMITS.gini.bounds);
  const cr = new Ledger();
  cr.add('crime:jobs', e.crime * C.crimeJobs * (unemployment - s.unemployment));
  cr.add('crime:trend', -e.crime * C.crimeTrend);
  const crime = e.crime + cr.sum;

  // Approval moves toward a target built from jobs, prices and growth; clamp first, then round.
  const honeymoon = Math.max(0, C.honeymoon * (1 - (state.turn - 1) / C.honeymoonQuarters));
  const ap = new Ledger();
  ap.add('approval:reversion', C.approvalPull * (C.approvalNeutral - state.approval));
  ap.add('approval:honeymoon', C.approvalPull * honeymoon);
  ap.add('approval:jobs', -C.approvalPull * C.approvalJobs * (unemployment - s.unemployment));
  ap.add('approval:prices', -C.approvalPull * C.approvalPrices * Math.max(0, inflation - C.approvalPriceFloor));
  ap.add('approval:growth', C.approvalPull * C.approvalGrowth * (growth - s.potential));
  ap.add('luck', C.shockApproval * zAppr);
  const approval = ap.round(ap.clamp(state.approval + ap.sum, ...LIMITS.approval.bounds), 1);
  const tr = new Ledger();
  tr.add('trust:reversion', C.trustAdjust * (s.trust - e.trust));
  tr.add('trust:approval', C.trustAdjust * C.trustApproval * (approval - C.approvalNeutral));
  const trust = tr.clamp(e.trust + tr.sum, ...LIMITS.trust.bounds);

  const cl = new Ledger();
  cl.add('clout:income', Math.round(approval / C.cloutPerApproval));
  if (r?.valid) {
    cl.add('clout:deals', -r.spent);
    cl.add(r.passed ? 'clout:reward' : 'clout:refund', r.cloutBack);
  }
  const clout = cl.clamp(state.clout + cl.sum, 0, Infinity);

  const log: LogEntry[] = [];
  if (r) log.push(r.valid ? { kind: 'bill', id: r.passed ? 'passed' : 'failed', amount: r.whip.total } : { kind: 'bill', id: 'rejected', detail: 'unaffordable' });

  return {
    ...state,
    turn: state.turn + 1,
    approval,
    clout,
    policy,
    report: {
      luck: { gap: zGap, infl: zInfl, appr: zAppr },
      log,
      trace: {
        gap: g.terms, growth: gr.terms, unemployment: un.terms, inflation: inf.terms, expected: ex.terms, fedRate: fed.terms,
        debtPct: dp.terms, income: inc.terms, empPop: em.terms, lifeExp: lf.terms, gini: gn.terms, crime: cr.terms,
        trust: tr.terms, approval: ap.terms, clout: cl.terms,
      },
    },
    econ: { gap, growth, unemployment, empPop, inflation, expected, fedRate, gdp, debt, realIncome, gini, lifeExp, trust, crime },
  };
}

// ---- scoring ------------------------------------------------------------------------------
/** The country 10 years after you leave, if nobody changes your policies (design.md §2). */
export function legacy(state: GameState): GameState {
  let s = state;
  for (let i = 0; i < LEGACY_QUARTERS; i++) s = step(s, {});
  return s;
}

/** Final score: half how you leave the country, half how it holds up a decade later. */
export function finalScore(state: GameState) {
  const now = prosperity(state).index, later = prosperity(legacy(state)).index;
  return { now, later, total: SCORE.nowWeight.value * now + (1 - SCORE.nowWeight.value) * later };
}
