// Pure, deterministic engine core (design.md §3, §8). No UI imports.
// Stylized quarterly macro model (Q3: real start, stylized dynamics). Coefficients are hand-set
// round numbers chosen for plausible direction and size, not estimates; every one lives in coefficients.ts.
import { baseline, estimate, spendLevers, taxLevers, type BudgetDraft } from './budget';
import { C, LIMITS, RULES, SCORE } from './coefficients';
import { resolveBill, resolveCrisisChoice, type Decisions } from './decisions';
import { clamp, tanhPade } from './detmath';
import { activeAt, RESOLVERS, type Modifier, type Scheduled, type Resolver } from './modifiers';
import { resolvePowerDecisions } from './powers';
import { normal } from './rng';
import { prosperity, type ScoreBreakdown } from './score';
import { isKnownSource, Ledger, type Term, type TraceKey } from './trace';
import { BN_PER_TN, BUDGET_WINDOW_YEARS, LEGACY_QUARTERS, MONTHS_PER_YEAR, PERCENT, QUARTERS_PER_YEAR, TOTAL_TURNS } from './units';
import { scheduleTurnEvents, type ActiveCrisis } from './director';

export { prosperity, type ScoreBreakdown } from './score';
export { LEGACY_QUARTERS, TOTAL_TURNS };
export type { ActiveCrisis } from './director';

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
  readonly modifiers: readonly Modifier[]; // lasting effects (events, orders, laws)
  readonly scheduled: readonly Scheduled[]; // delayed effects waiting for their turn
  readonly activeCrisis: ActiveCrisis | null;
  readonly activeOrders: readonly string[]; // signed executive orders currently in force
  readonly viewedMyths: readonly string[]; // myth cards visited by player (one-time reward)
  readonly speechCountInWindow: number; // rolling speech count for diminishing returns
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
    modifiers: [],
    scheduled: [],
    activeCrisis: null,
    activeOrders: [],
    viewedMyths: [],
    speechCountInWindow: 0,
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

export interface StepOptions {
  legacy?: boolean; // the 10-year projection: no resolvers, no executive orders (FND-06, D5)
  resolvers?: Record<string, Resolver>; // tests inject stubs; defaults to RESOLVERS
}

export function endTurn(state: GameState, decisions: Decisions = {}, opts: StepOptions = {}): GameState {
  return state.turn >= TOTAL_TURNS ? state : step(state, decisions, opts);
}

/**
 * One quarter of the model, uncapped (also used for the legacy projection). Every indicator is
 * `before + a Ledger of named terms` (FND-04); clamps and rounding are recorded as bounded residuals.
 */
export function step(state: GameState, decisions: Decisions, opts: StepOptions = {}): GameState {
  const s = state.start, e = state.econ;
  const legacyRun = opts.legacy === true;

  // Due scheduled items resolve first so what they add or end acts in this same step, in (due, id) order
  // so a reordered save replays identically. An unknown kind or an overdue item fails loudly (T-1-13).
  let modifiers: readonly Modifier[] = state.modifiers;
  let scheduled: readonly Scheduled[] = state.scheduled;
  let activeOrders: readonly string[] = state.activeOrders;
  let viewedMyths: readonly string[] = state.viewedMyths;
  let speechCountInWindow: number = state.speechCountInWindow;
  const log: LogEntry[] = [];
  if (!legacyRun) {
    const registry = opts.resolvers ?? RESOLVERS;
    const overdue = state.scheduled.find((i) => i.due < state.turn);
    if (overdue) throw new Error(`scheduled item ${overdue.id} was due on turn ${overdue.due}, now turn ${state.turn}`);
    const due = state.scheduled.filter((i) => i.due === state.turn).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    for (const item of due) {
      if (!Object.hasOwn(registry, item.kind)) throw new Error(`unknown scheduled kind "${item.kind}" (item ${item.id})`);
      const out = registry[item.kind]!({ seed: state.seed, turn: state.turn, state, item });
      const ended = new Set(out.endGroups);
      modifiers = [...modifiers.map((m) => (ended.has(m.group) ? { ...m, until: state.turn - 1 } : m)), ...(out.add ?? [])];
      if (out.endGroups?.length) {
        for (const g of out.endGroups) {
          if (g.startsWith('eo:')) {
            const eoId = g.replace(/^eo:/, '');
            activeOrders = activeOrders.filter((id) => id !== eoId);
          }
        }
      }
      log.push(...(out.log ?? []));
    }
    scheduled = state.scheduled.filter((i) => i.due !== state.turn);
  }

  // Crisis choice resolution (Phase 4, EVT-02, GR-38)
  const rawCrisis: unknown = decisions !== null && typeof decisions === 'object' ? decisions.crisis : undefined;
  const cRes = !legacyRun && rawCrisis !== undefined && typeof rawCrisis === 'object' && rawCrisis !== null
    ? resolveCrisisChoice(
        state.clout,
        (rawCrisis as { crisisId?: unknown }).crisisId,
        (rawCrisis as { optionId?: unknown }).optionId,
        state.turn,
      )
    : null;
  if (cRes) {
    if (cRes.valid) {
      modifiers = [...modifiers, ...cRes.modifiers];
      scheduled = [...scheduled, ...cRes.scheduled];
      log.push({ kind: 'crisis', id: cRes.crisisId, detail: cRes.optionId, amount: cRes.cloutCost });
    } else {
      log.push({ kind: 'crisis', id: 'rejected', detail: cRes.reason });
    }
  }

  // Executive powers resolution (Phase 5, PWR-01..PWR-07)
  const rawPowers: unknown = decisions !== null && typeof decisions === 'object' ? decisions.powers : undefined;
  const pRes = !legacyRun && rawPowers !== undefined ? resolvePowerDecisions(state, rawPowers) : null;
  if (pRes) {
    if (pRes.valid) {
      if (pRes.endGroups.length > 0) {
        const ended = new Set(pRes.endGroups);
        modifiers = modifiers.map((m) => (ended.has(m.group) ? { ...m, until: state.turn - 1 } : m));
      }
      modifiers = [...modifiers, ...pRes.modifiers];
      scheduled = [...scheduled, ...pRes.scheduled];
      activeOrders = pRes.activeOrders;
      viewedMyths = pRes.viewedMyths;
      speechCountInWindow = pRes.speechCountInWindow;
      log.push(...pRes.log);
    } else {
      log.push({ kind: 'powers', id: 'rejected', detail: pRes.reason });
    }
  } else if (!legacyRun) {
    speechCountInWindow = Math.max(0, speechCountInWindow - 1);
  }

  const active = activeAt(modifiers, state.turn, legacyRun);
  for (const m of active) {
    if (!m.source.startsWith(`${m.tag}:`) || !isKnownSource(m.source)) throw new Error(`modifier ${m.id} has source "${m.source}", which must start with "${m.tag}:"`);
  }
  const mods = (channel: Modifier['channel']) => active.filter((m) => m.channel === channel);

  const zGap = normal(state.seed, 'macro', state.turn, 'gap');
  const zInfl = normal(state.seed, 'macro', state.turn, 'infl');
  const zAppr = normal(state.seed, 'macro', state.turn, 'appr');

  // The engine charges clout from the raw bill; the Session previews with the same function.
  const raw: unknown = decisions !== null && typeof decisions === 'object' ? decisions.bill : undefined;
  const r = raw === undefined ? null : resolveBill(state.clout, raw);
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
  for (const m of mods('gap')) g.add(m.source, m.amount);
  const gap = e.gap + g.sum;

  // Growth is a level: potential plus the annualized change in the gap.
  const gr = new Ledger();
  gr.add('potential:base', s.potential);
  gr.add('potential:policy', C.potentialMax * tanhPade(after.growth));
  gr.add('potential:crowding', -C.crowdOut * Math.max(0, debtPctNow - s.debtPct));
  for (const m of mods('potential')) gr.add(m.source, m.amount);
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
  for (const m of mods('inflation')) inf.add(m.source, m.amount);
  const inflation = inf.clamp(e.inflation + inf.sum, ...LIMITS.inflation.bounds);
  const ex = new Ledger();
  ex.add('prices', C.expectAdapt * (inflation - e.expected));
  for (const m of mods('expected')) ex.add(m.source, m.amount);
  const expected = e.expected + ex.sum;

  // Policy rate: round to the step first, then clamp (as before).
  const fed = new Ledger();
  fed.add('fed:neutral', C.fedSmooth * (C.neutralReal + inflation - e.fedRate));
  fed.add('fed:inflationGap', C.fedSmooth * C.taylorInfl * (inflation - C.inflTarget));
  fed.add('fed:outputGap', C.fedSmooth * C.taylorGap * gap);
  for (const m of mods('fedTarget')) fed.add(m.source, C.fedSmooth * m.amount);
  const fedRate = fed.clamp(fed.round(e.fedRate + fed.sum, C.fedStep), ...LIMITS.fedRate.bounds);

  const gdp = e.gdp * (1 + (growth + inflation) / (QUARTERS_PER_YEAR * PERCENT));
  const borrowingCost = (fedRate - s.fedRate) * C.fedPassThrough + C.termPremium * Math.max(0, debtPctNow - s.debtPct) + C.stressPremium * stress;
  const interestDrift = (borrowingCost * e.debt) / PERCENT; // $tn/yr above the starting interest bill
  const budgetDeficit = after.deficitBn / BUDGET_WINDOW_YEARS / BN_PER_TN; // $tn/yr
  const deficit = (s.deficitPct / PERCENT) * gdp + budgetDeficit + interestDrift; // $tn/yr
  const debtMods = mods('debtBn');
  const debt = e.debt + deficit / QUARTERS_PER_YEAR + debtMods.reduce((n, m) => n + m.amount / BN_PER_TN, 0);

  // Debt/GDP is traced instead of $ debt: the score and the UI read the ratio.
  const perQuarter = PERCENT / (QUARTERS_PER_YEAR * gdp); // debt/GDP pts per $tn/yr of deficit for one quarter
  const dp = new Ledger();
  dp.add('deficit:base', s.deficitPct / QUARTERS_PER_YEAR);
  dp.add('deficit:budget', budgetDeficit * perQuarter);
  dp.add('deficit:interest', interestDrift * perQuarter);
  dp.add('gdp:growth', PERCENT * e.debt * (1 / gdp - 1 / e.gdp)); // a bigger economy dilutes the old debt
  for (const m of debtMods) dp.add(m.source, (m.amount / BN_PER_TN / gdp) * PERCENT);

  const inc = new Ledger();
  inc.add('growth', (e.realIncome * (C.incomeGrowthShare * growth)) / (QUARTERS_PER_YEAR * PERCENT));
  if (enacted) inc.add('budget:family', (after.familyMonthly - before.familyMonthly) * MONTHS_PER_YEAR);
  const realIncome = inc.clamp(e.realIncome + inc.sum, s.medianIncome * LIMITS.income.bounds[0], s.medianIncome * LIMITS.income.bounds[1]);

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
  for (const m of mods('approval')) ap.add(m.source, m.amount);
  const approval = ap.round(ap.clamp(state.approval + ap.sum, ...LIMITS.approval.bounds), RULES.approvalStep.value);
  const tr = new Ledger();
  tr.add('trust:reversion', C.trustAdjust * (s.trust - e.trust));
  tr.add('trust:approval', C.trustAdjust * C.trustApproval * (approval - C.approvalNeutral));
  for (const m of mods('trust')) tr.add(m.source, m.amount);
  const trust = tr.clamp(e.trust + tr.sum, ...LIMITS.trust.bounds);

  const cl = new Ledger();
  cl.add('clout:income', Math.round(approval / C.cloutPerApproval));
  for (const m of mods('clout')) cl.add(m.source, m.amount);
  if (r?.valid) {
    cl.add('clout:deals', -r.spent);
    cl.add(r.passed ? 'clout:reward' : 'clout:refund', r.cloutBack);
  }
  if (cRes?.valid && cRes.cloutCost > 0) {
    cl.add('clout:crisis', -cRes.cloutCost);
  }
  if (pRes?.valid) {
    if (pRes.cloutSpent > 0) cl.add('clout:powers', -pRes.cloutSpent);
    if (pRes.cloutGained > 0) cl.add('clout:powers', pRes.cloutGained);
  }
  const clout = cl.clamp(state.clout + cl.sum, 0, C.cloutCap);

  if (r) log.push(r.valid ? { kind: 'bill', id: r.passed ? 'passed' : 'failed', amount: r.whip.total } : { kind: 'bill', id: 'rejected', detail: r.reason });

  const nextTurn = state.turn + 1;
  const nextEcon = { gap, growth, unemployment, empPop, inflation, expected, fedRate, gdp, debt, realIncome, gini, lifeExp, trust, crime };
  const interimState: GameState = {
    ...state,
    turn: nextTurn,
    approval,
    clout,
    policy,
    modifiers,
    scheduled,
    activeOrders,
    viewedMyths,
    speechCountInWindow,
    econ: nextEcon,
    activeCrisis: state.activeCrisis,
    report: {
      luck: { gap: zGap, infl: zInfl, appr: zAppr },
      log,
      trace: {
        gap: g.terms, growth: gr.terms, unemployment: un.terms, inflation: inf.terms, expected: ex.terms, fedRate: fed.terms,
        debtPct: dp.terms, income: inc.terms, empPop: em.terms, lifeExp: lf.terms, gini: gn.terms, crime: cr.terms,
        trust: tr.terms, approval: ap.terms, clout: cl.terms,
      },
    },
  };
  const activeCrisis = legacyRun ? null : scheduleTurnEvents(state.seed, nextTurn, interimState);

  return {
    ...interimState,
    activeCrisis,
  };
}

// ---- scoring ------------------------------------------------------------------------------
/** The country 10 years after you leave, if nobody changes your policies (design.md §2). */
export function legacy(state: GameState): GameState {
  let s = state;
  for (let i = 0; i < LEGACY_QUARTERS; i++) s = step(s, {}, { legacy: true });
  return s;
}

/** Final score: half how you leave the country, half how it holds up a decade later. */
export function finalScore(state: GameState): ScoreBreakdown {
  const now = prosperity(state).index, later = prosperity(legacy(state)).index;
  return { now, later, total: SCORE.nowWeight.value * now + (1 - SCORE.nowWeight.value) * later };
}

/** The headline score evaluates projected final score using the same formula (D11, GR-04). */
export const projectedScore = finalScore;

/** Difference against autopilot across overall total, term-end (now) and legacy (later). */
export function scoreVsAutopilot(state: GameState, autopilotState: GameState): ScoreBreakdown {
  const p = finalScore(state);
  const a = finalScore(autopilotState);
  return {
    total: p.total - a.total,
    now: p.now - a.now,
    later: p.later - a.later,
  };
}

