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
import { calculateMidtermShift, FILIBUSTER_RULES_CATALOG, type FilibusterRule } from './congress';
import {
  REFORMS_CATALOG,
  resolveElectoralReform,
  resolveJudicialReform,
  type ElectoralReformId,
  type JudicialReformId,
  type ReformId,
} from './reforms';
import {
  type ActiveAmendment,
  type AmendmentId,
  AMENDMENTS_CATALOG,
  calculateAmendmentProposalVotes,
  checkAmendmentCongressionalProposal,
  tickAmendmentRatification,
} from './amendments';
import { isKnownSource, Ledger, type Term, type TraceKey } from './trace';
import { BN_PER_TN, BUDGET_WINDOW_YEARS, LEGACY_QUARTERS, MIDTERM_TURN_1, MIDTERM_TURN_2, MONTHS_PER_YEAR, PERCENT, QUARTERS_PER_YEAR, TOTAL_TURNS } from './units';
import { scheduleTurnEvents, checkGeopoliticalEscalation, createGeopoliticalActiveCrisis, getGeopoliticalSchedule, type ActiveCrisis } from './director';
import { getCrisis, isGeopoliticalCrisis } from './crises';
import { estimateSocial, isSocialBaseline, sanitizeSocial, socialBaseline, type SocialDraft } from './social';
import { defaultForeignPolicy, resolveForeignPolicy, sanitizeForeignPolicy, type ForeignPolicyState } from './foreign';
import { defaultTradeState, resolveTrade, sanitizeTradeState, type TradeState, type TradeDraft } from './trade';

export { prosperity, type ScoreBreakdown } from './score';
export { LEGACY_QUARTERS, TOTAL_TURNS };
export type { ActiveCrisis } from './director';
export type { SocialDraft } from './social';
export type { ForeignPolicyState } from './foreign';
export type { TradeState } from './trade';

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
  readonly socialPolicy?: SocialDraft; // enacted social policy levers (Phase 9)
  readonly econ: Econ;
  readonly start: Start;
  readonly report: Report; // what happened last turn
  readonly modifiers: readonly Modifier[]; // lasting effects (events, orders, laws)
  readonly scheduled: readonly Scheduled[]; // delayed effects waiting for their turn
  readonly activeCrisis: ActiveCrisis | null;
  readonly activeOrders: readonly string[]; // signed executive orders currently in force
  readonly viewedMyths: readonly string[]; // myth cards visited by player (one-time reward)
  readonly speechCountInWindow: number; // rolling speech count for diminishing returns
  readonly houseSeatDelta: number; // net seat change from midterms (default 0)
  readonly senateSeatDelta?: number; // net Senate seat change from midterms (default 0)
  readonly filibusterRule?: FilibusterRule; // active Senate filibuster rule (default sixty_vote)
  readonly activeReforms?: readonly string[]; // IDs of enacted structural reforms
  readonly courtComposition?: { readonly conservative: number; readonly liberal: number }; // Supreme Court bench composition
  readonly activeAmendment?: ActiveAmendment; // active Article V constitutional amendment proposal
  readonly ratifiedAmendments?: readonly AmendmentId[]; // permanently ratified Article V constitutional amendments
  readonly activeGeopoliticalCrises?: readonly ActiveCrisis[]; // active multi-turn geopolitical crises (CRISIS-01)
  readonly resolvedGeopoliticalCrises?: readonly string[]; // resolved geopolitical crisis IDs
  readonly foreignPolicy?: ForeignPolicyState; // defense posture, foreign assistance, targeted sanctions (Phase 14, FORPOL-01, FORPOL-02)
  readonly trade?: TradeState; // strategic sector tariffs and bilateral trade agreements (Phase 16, TRADE-01, TRADE-02)
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
    houseSeatDelta: 0,
    activeGeopoliticalCrises: [],
    resolvedGeopoliticalCrises: [],
    foreignPolicy: defaultForeignPolicy(),
    trade: defaultTradeState(),
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
  autopilot?: boolean;
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

  // Geopolitical crisis resolution & advancement (Phase 13, CRISIS-01, CRISIS-02, CRISIS-03)
  let activeGeoCrises: ActiveCrisis[] = state.activeGeopoliticalCrises ? [...state.activeGeopoliticalCrises] : [];
  let resolvedGeoCrises: string[] = state.resolvedGeopoliticalCrises ? [...state.resolvedGeopoliticalCrises] : [];
  let geoEscalationApprovalPenalty = 0;
  let geoEscalationTrustPenalty = 0;

  let rawGeoCrisis: { crisisId?: unknown; optionId?: unknown } | undefined = undefined;
  if (decisions !== null && typeof decisions === 'object') {
    if (decisions.geopoliticalCrisis) {
      rawGeoCrisis = decisions.geopoliticalCrisis;
    } else if (decisions.crisis && isGeopoliticalCrisis(String(decisions.crisis.crisisId))) {
      rawGeoCrisis = decisions.crisis;
    }
  }
  if (!rawGeoCrisis && opts.autopilot && activeGeoCrises.length > 0) {
    const firstActive = activeGeoCrises[0];
    if (firstActive) {
      const autoOpt = firstActive.options.find((o) => o.autopilot);
      if (autoOpt) {
        rawGeoCrisis = { crisisId: firstActive.crisisId, optionId: autoOpt.id };
      }
    }
  }

  const geoRes = !legacyRun && rawGeoCrisis !== undefined && typeof rawGeoCrisis === 'object' && rawGeoCrisis !== null
    ? resolveCrisisChoice(
        state.clout - (cRes?.valid ? cRes.cloutCost : 0),
        rawGeoCrisis.crisisId,
        rawGeoCrisis.optionId,
        state.turn,
      )
    : null;

  if (geoRes) {
    if (geoRes.valid) {
      modifiers = [...modifiers, ...geoRes.modifiers];
      scheduled = [...scheduled, ...geoRes.scheduled];
      activeGeoCrises = activeGeoCrises.filter((c) => c.crisisId !== geoRes.crisisId);
      if (!resolvedGeoCrises.includes(geoRes.crisisId)) {
        resolvedGeoCrises.push(geoRes.crisisId);
      }
      log.push({ kind: 'crisis', id: geoRes.crisisId, detail: geoRes.optionId, amount: geoRes.cloutCost });
    } else {
      log.push({ kind: 'crisis', id: 'rejected', detail: geoRes.reason });
    }
  }

  if (!legacyRun) {
    const remainingGeo: ActiveCrisis[] = [];
    for (const crisis of activeGeoCrises) {
      const remainingTurns = (crisis.turnsRemaining ?? 1) - 1;
      const isEscalated = remainingTurns <= 0 || checkGeopoliticalEscalation(crisis, state.turn);
      if (isEscalated) {
        geoEscalationApprovalPenalty += C.geopoliticalEscalationPenalty;
        geoEscalationTrustPenalty += C.geopoliticalEscalationTrust;
        log.push({
          kind: 'geopolitical_escalation',
          id: crisis.crisisId,
          detail: 'countdown_expired',
          amount: C.geopoliticalEscalationPenalty,
        });
        if (!resolvedGeoCrises.includes(crisis.crisisId)) {
          resolvedGeoCrises.push(crisis.crisisId);
        }
      } else {
        remainingGeo.push({
          ...crisis,
          turnsRemaining: remainingTurns,
        });
      }
    }
    activeGeoCrises = remainingGeo;
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

  // Filibuster rule reform resolution (Phase 11, REF-01)
  const rawFilibuster: unknown = decisions !== null && typeof decisions === 'object' ? (decisions as { filibusterRule?: unknown }).filibusterRule : undefined;
  let nextFilibusterRule = state.filibusterRule;
  let filibusterCost = 0;
  let filibusterTrustPenalty = 0;
  let filibusterApprovalPenalty = 0;
  let filibusterLog: LogEntry | null = null;
  if (!legacyRun && typeof rawFilibuster === 'string' && Object.hasOwn(FILIBUSTER_RULES_CATALOG, rawFilibuster)) {
    const targetRule = rawFilibuster as FilibusterRule;
    const currentRule = state.filibusterRule ?? 'sixty_vote';
    if (targetRule !== currentRule) {
      const cost = FILIBUSTER_RULES_CATALOG[targetRule].cloutCost;
      if (state.clout >= cost) {
        filibusterCost = cost;
        if (targetRule === 'talking_filibuster') {
          filibusterTrustPenalty = C.filibusterTalkingTrustPenalty;
        } else if (targetRule === 'fifty_five_vote') {
          filibusterTrustPenalty = C.filibusterFiftyFiveTrustPenalty;
        } else if (targetRule === 'simple_majority') {
          filibusterTrustPenalty = C.filibusterNuclearTrustPenalty;
          filibusterApprovalPenalty = C.filibusterNuclearApprovalPenalty;
        }
        nextFilibusterRule = targetRule;
        filibusterLog = { kind: 'reform', id: 'filibuster_rule', detail: targetRule, amount: cost };
      } else {
        filibusterLog = { kind: 'reform', id: 'rejected', detail: 'unaffordable' };
      }
    }
  }

  // Structural judicial and electoral reforms (Phase 11, REF-02, REF-03)
  const rawReform: unknown = decisions !== null && typeof decisions === 'object' ? (decisions as { reform?: unknown }).reform : undefined;
  let nextActiveReforms = state.activeReforms ? [...state.activeReforms] : undefined;
  let nextCourtComposition = state.courtComposition;
  let reformResult: ReturnType<typeof resolveJudicialReform> | null = null;
  if (!legacyRun && typeof rawReform === 'string' && Object.hasOwn(REFORMS_CATALOG, rawReform)) {
    const reformId = rawReform as ReformId;
    const cat = REFORMS_CATALOG[reformId].category;
    if (cat === 'judicial') {
      reformResult = resolveJudicialReform(state, reformId as JudicialReformId, state.seed);
    } else if (cat === 'electoral') {
      reformResult = resolveElectoralReform(state, reformId as ElectoralReformId);
    }
    if (reformResult) {
      if (reformResult.valid && reformResult.status === 'enacted') {
        if (!nextActiveReforms) nextActiveReforms = [];
        nextActiveReforms.push(reformId);
        if (reformResult.courtShift) {
          nextCourtComposition = reformResult.courtShift;
        }
      }
    }
  }

  // Article V Constitutional Amendments (Phase 11, REF-04)
  let nextActiveAmendment = state.activeAmendment;
  let nextRatifiedAmendments = state.ratifiedAmendments ? [...state.ratifiedAmendments] : undefined;
  let amendmentCloutCost = 0;
  let amendmentTrustGain = 0;

  const rawProposal: unknown = decisions !== null && typeof decisions === 'object' ? (decisions as { amendmentProposal?: unknown }).amendmentProposal : undefined;
  const rawCampaign: unknown = decisions !== null && typeof decisions === 'object' ? (decisions as { amendmentCampaign?: unknown }).amendmentCampaign : undefined;
  const presidentialSide = (decisions !== null && typeof decisions === 'object' ? (decisions as { presidentialSide?: unknown }).presidentialSide : undefined) as 'D' | 'R' | undefined;

  if (!legacyRun) {
    if (typeof rawProposal === 'string' && Object.hasOwn(AMENDMENTS_CATALOG, rawProposal)) {
      const amendmentId = rawProposal as AmendmentId;
      if (!nextActiveAmendment || nextActiveAmendment.isRatified || nextActiveAmendment.isExpired) {
        const cost = C.amendmentProposalCloutCost;
        if (state.clout >= cost) {
          const { houseVotes, senateVotes } = calculateAmendmentProposalVotes(
            amendmentId,
            state.houseSeatDelta,
            state.senateSeatDelta ?? 0,
            state.approval,
          );
          const proposalCheck = checkAmendmentCongressionalProposal(amendmentId, houseVotes, senateVotes);
          if (proposalCheck.proposed) {
            amendmentCloutCost += cost;
            nextActiveAmendment = {
              id: amendmentId,
              proposedTurn: state.turn,
              ratifiedStates: [],
              isRatified: false,
              isExpired: false,
            };
            log.push({ kind: 'amendment', id: 'proposed', detail: amendmentId, amount: cost });
          } else {
            log.push({ kind: 'amendment', id: 'failed_congress', detail: proposalCheck.reason });
          }
        } else {
          log.push({ kind: 'amendment', id: 'rejected', detail: 'unaffordable' });
        }
      }
    }

    let campaigned = false;
    if (nextActiveAmendment && !nextActiveAmendment.isRatified && !nextActiveAmendment.isExpired && rawCampaign === true) {
      const campCost = C.amendmentCampaignCloutCost;
      if (state.clout >= amendmentCloutCost + campCost) {
        amendmentCloutCost += campCost;
        campaigned = true;
        log.push({ kind: 'amendment', id: 'campaign', detail: nextActiveAmendment.id, amount: campCost });
      }
    }

    if (nextActiveAmendment && !nextActiveAmendment.isRatified && !nextActiveAmendment.isExpired) {
      const wasRatified = nextActiveAmendment.isRatified;
      nextActiveAmendment = tickAmendmentRatification(
        nextActiveAmendment,
        state.turn,
        state.approval,
        state.seed,
        presidentialSide,
        campaigned,
      );

      if (nextActiveAmendment.isRatified && !wasRatified) {
        if (!nextRatifiedAmendments) nextRatifiedAmendments = [];
        nextRatifiedAmendments.push(nextActiveAmendment.id);
        log.push({ kind: 'amendment', id: 'ratified', detail: nextActiveAmendment.id });
        if (nextActiveAmendment.id === 'amendment_judicial_terms') {
          amendmentTrustGain += C.amendmentJudicialTrustGain;
        } else if (nextActiveAmendment.id === 'amendment_campaign_finance') {
          amendmentTrustGain += C.amendmentCampaignFinanceTrustGain;
        } else if (nextActiveAmendment.id === 'amendment_equal_rights') {
          amendmentTrustGain += C.amendmentEraTrustGain;
        }
      } else if (nextActiveAmendment.isExpired) {
        log.push({ kind: 'amendment', id: 'expired', detail: nextActiveAmendment.id });
      }
    }
  }

  // Foreign policy and sanctions resolution (Phase 14, FORPOL-01, FORPOL-02)
  const rawForeign: unknown = decisions !== null && typeof decisions === 'object' ? (decisions as { foreignPolicy?: unknown }).foreignPolicy : undefined;
  const currentForeign = state.foreignPolicy ?? defaultForeignPolicy();
  const availableCloutForForeign = state.clout - (pRes?.valid ? pRes.cloutSpent : 0) - filibusterCost - (reformResult ? reformResult.cloutCost : 0) - amendmentCloutCost;
  const forRes = !legacyRun
    ? resolveForeignPolicy(currentForeign, sanitizeForeignPolicy(rawForeign), Math.max(0, availableCloutForForeign))
    : null;
  const nextForeignPolicy = forRes
    ? { defensePosture: forRes.defensePosture, foreignAssistance: forRes.foreignAssistance, activeSanctions: forRes.activeSanctions }
    : currentForeign;

  if (forRes) {
    if (forRes.defensePosture !== currentForeign.defensePosture) {
      log.push({ kind: 'forpol', id: 'defense_posture', detail: forRes.defensePosture });
    }
    if (forRes.foreignAssistance !== currentForeign.foreignAssistance) {
      log.push({ kind: 'forpol', id: 'foreign_assistance', amount: forRes.foreignAssistance });
    }
    for (const s of forRes.activeSanctions) {
      if (!currentForeign.activeSanctions.includes(s)) {
        log.push({ kind: 'forpol', id: 'sanctions_enacted', detail: s });
      }
    }
    for (const s of currentForeign.activeSanctions) {
      if (!forRes.activeSanctions.includes(s)) {
        log.push({ kind: 'forpol', id: 'sanctions_lifted', detail: s });
      }
    }
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
  const activeRule = nextFilibusterRule ?? state.filibusterRule ?? 'sixty_vote';
  const reformCloutCost = reformResult?.cloutCost ?? 0;
  const r = raw === undefined ? null : resolveBill(state.clout - filibusterCost - reformCloutCost - amendmentCloutCost, raw, state.houseSeatDelta, state.senateSeatDelta ?? 0, activeRule, state.approval);
  const enacted = r && r.valid && r.passed ? r : null;
  const policy = enacted ? enacted.budget : state.policy;
  const before = estimate(state.policy), after = estimate(policy);

  const rawSocial = enacted !== null && (enacted as { social?: SocialDraft }).social !== undefined
    ? (enacted as { social?: SocialDraft }).social
    : raw === undefined && decisions !== null && typeof decisions === 'object' && (decisions as { social?: SocialDraft }).social !== undefined
      ? (decisions as { social?: SocialDraft }).social
      : undefined;
  const currentSocial = state.socialPolicy ?? socialBaseline();
  const nextSocial = rawSocial !== undefined ? sanitizeSocial(rawSocial) : currentSocial;
  const beforeSocial = estimateSocial(currentSocial);
  const afterSocial = estimateSocial(nextSocial);
  const socialPolicy = isSocialBaseline(nextSocial) ? undefined : nextSocial;

  // Trade agreements and strategic sector tariffs (Phase 16, TRADE-01, TRADE-02)
  const rawTrade: unknown = decisions !== null && typeof decisions === 'object' ? (decisions as { trade?: unknown }).trade : undefined;
  const currentTrade = state.trade ?? defaultTradeState();
  const availableCloutForTrade = availableCloutForForeign - (forRes ? forRes.cloutSpent : 0);
  const currentTariffRate = tariffOf(policy);
  const tradeRes = !legacyRun
    ? resolveTrade(currentTrade, sanitizeTradeState(rawTrade), Math.max(0, availableCloutForTrade), currentTariffRate)
    : null;
  const nextTrade = tradeRes
    ? { sectorTariffs: tradeRes.sectorTariffs, agreements: tradeRes.agreements }
    : currentTrade;

  if (tradeRes) {
    for (const st of tradeRes.sectorTariffs) {
      if (!currentTrade.sectorTariffs.includes(st)) {
        log.push({ kind: 'trade', id: 'sector_tariff_enacted', detail: st });
      }
    }
    for (const st of currentTrade.sectorTariffs) {
      if (!tradeRes.sectorTariffs.includes(st)) {
        log.push({ kind: 'trade', id: 'sector_tariff_lifted', detail: st });
      }
    }
    for (const ag of tradeRes.agreements) {
      if (!currentTrade.agreements.includes(ag)) {
        log.push({ kind: 'trade', id: 'agreement_ratified', detail: ag });
      }
    }
  }

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
  if (forRes && forRes.quarterlyGapDelta !== 0) g.add('forpol:sanctions', forRes.quarterlyGapDelta);
  if (tradeRes && tradeRes.retaliatoryExportDrag !== 0) g.add('trade:retaliation', -tradeRes.retaliatoryExportDrag);
  if (tradeRes && tradeRes.tradeAgreementExportBoost !== 0) g.add('trade:pacts', tradeRes.tradeAgreementExportBoost);
  if (!legacyRun) {
    for (const crisis of activeGeoCrises) {
      if (crisis.crisisId === 'oil_embargo' || crisis.crisisId === 'shipping_blockade') {
        g.add('geopolitical:supply', -C.geopoliticalSupplyOutputDrag);
      } else if (crisis.crisisId === 'debt_contagion') {
        g.add('geopolitical:supply', -C.debtContagionGdpHit);
      }
    }
  }
  const gap = e.gap + g.sum;

  // Growth is a level: potential plus the annualized change in the gap.
  const gr = new Ledger();
  gr.add('potential:base', s.potential);
  gr.add('potential:policy', C.potentialMax * tanhPade(after.growth));
  gr.add('potential:crowding', -C.crowdOut * Math.max(0, debtPctNow - s.debtPct));
  if (afterSocial.potentialGrowth !== 0) gr.add('social:productivity', afterSocial.potentialGrowth);
  for (const m of mods('potential')) gr.add(m.source, m.amount);
  for (const t of g.scaled(QUARTERS_PER_YEAR).terms) gr.add(t.source, t.amount);
  const growth = gr.sum;

  // Unemployment and employment are level-defined; settleTo carries any clamp or noise as `clamp`.
  const un = g.scaled(-C.okun);
  const unemployment = un.settleTo(e.unemployment, clamp(s.unemployment - C.okun * gap, ...LIMITS.unemployment.bounds));
  const em = un.scaled(-C.empPerU);
  const socialLaborDelta = afterSocial.empPopBonus - beforeSocial.empPopBonus;
  if (socialLaborDelta !== 0) em.add('social:labor', socialLaborDelta);
  const empPop = em.settleTo(e.empPop, s.empPop - C.empPerU * (unemployment - s.unemployment) + afterSocial.empPopBonus);

  const inf = new Ledger();
  inf.add('expectations', C.expectPull * (e.expected - e.inflation));
  inf.add('demand', C.phillips * gap);
  inf.add('tariffs', C.tariffPass * tariffChange);
  const energyReliefDelta = afterSocial.energyInflationRelief - beforeSocial.energyInflationRelief;
  if (energyReliefDelta !== 0) inf.add('social:energy', -energyReliefDelta);
  inf.add('luck', C.shockInfl * zInfl);
  for (const m of mods('inflation')) inf.add(m.source, m.amount);
  if (forRes && forRes.quarterlyInflationDelta !== 0) inf.add('forpol:sanctions', forRes.quarterlyInflationDelta);
  if (tradeRes && tradeRes.quarterlyInflationDelta !== 0) inf.add('trade:sectors', tradeRes.quarterlyInflationDelta);
  if (!legacyRun) {
    for (const crisis of activeGeoCrises) {
      if (crisis.crisisId === 'oil_embargo') {
        inf.add('geopolitical:energy', C.geopoliticalEnergyInflation);
      } else if (crisis.crisisId === 'shipping_blockade') {
        inf.add('geopolitical:shipping', C.geopoliticalShippingInflation);
      }
    }
  }
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
  const socialDeficit = afterSocial.deficitBn / BN_PER_TN; // $tn/yr
  const foreignDeficit = forRes ? (forRes.quarterlyDeficitDeltaBn * QUARTERS_PER_YEAR) / BN_PER_TN : 0; // $tn/yr
  const tradeDeficit = tradeRes ? (tradeRes.quarterlyDeficitDeltaBn * QUARTERS_PER_YEAR) / BN_PER_TN : 0; // $tn/yr
  const deficit = (s.deficitPct / PERCENT) * gdp + budgetDeficit + socialDeficit + foreignDeficit + tradeDeficit + interestDrift; // $tn/yr
  const debtMods = mods('debtBn');
  const debt = e.debt + deficit / QUARTERS_PER_YEAR + debtMods.reduce((n, m) => n + m.amount / BN_PER_TN, 0);

  // Debt/GDP is traced instead of $ debt: the score and the UI read the ratio.
  const perQuarter = PERCENT / (QUARTERS_PER_YEAR * gdp); // debt/GDP pts per $tn/yr of deficit for one quarter
  const dp = new Ledger();
  dp.add('deficit:base', s.deficitPct / QUARTERS_PER_YEAR);
  dp.add('deficit:budget', budgetDeficit * perQuarter);
  if (socialDeficit !== 0) dp.add('social:budget', socialDeficit * perQuarter);
  if (foreignDeficit !== 0) dp.add('forpol:budget', foreignDeficit * perQuarter);
  if (tradeDeficit !== 0) dp.add('trade:budget', tradeDeficit * perQuarter);
  dp.add('deficit:interest', interestDrift * perQuarter);
  dp.add('gdp:growth', PERCENT * e.debt * (1 / gdp - 1 / e.gdp)); // a bigger economy dilutes the old debt
  for (const m of debtMods) dp.add(m.source, (m.amount / BN_PER_TN / gdp) * PERCENT);

  const inc = new Ledger();
  inc.add('growth', (e.realIncome * (C.incomeGrowthShare * growth)) / (QUARTERS_PER_YEAR * PERCENT));
  if (enacted) inc.add('budget:family', (after.familyMonthly - before.familyMonthly) * MONTHS_PER_YEAR);
  const socialFamilyDelta = (afterSocial.familyMonthly - beforeSocial.familyMonthly) * MONTHS_PER_YEAR;
  if (socialFamilyDelta !== 0) inc.add('social:family', socialFamilyDelta);
  const realIncome = inc.clamp(e.realIncome + inc.sum, s.medianIncome * LIMITS.income.bounds[0], s.medianIncome * LIMITS.income.bounds[1]);

  // Level effects: indicators move toward a policy-dependent target instead of drifting forever.
  // The life expectancy trend grows with state.turn, the quarters since the start (incl. the legacy projection).
  const lf = new Ledger();
  lf.add('health:trend', C.lifeAdjust * C.lifeTrend * state.turn);
  lf.add('health:spending', C.lifeAdjust * C.lifeSpending * (leverDev(policy, 'mcd') + leverDev(policy, 'ssm')));
  lf.add('health:reversion', C.lifeAdjust * (s.lifeExp - e.lifeExp));
  if (afterSocial.lifeExpBonus !== 0) lf.add('social:health', C.lifeAdjust * afterSocial.lifeExpBonus);
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
  if (filibusterApprovalPenalty > 0) ap.add('approval:reform', -filibusterApprovalPenalty);
  if (reformResult && reformResult.approvalDelta !== 0) ap.add('approval:reform', reformResult.approvalDelta);
  if (geoEscalationApprovalPenalty > 0) ap.add('event:geopolitical_escalation', -geoEscalationApprovalPenalty);
  const approval = ap.round(ap.clamp(state.approval + ap.sum, ...LIMITS.approval.bounds), RULES.approvalStep.value);
  const tr = new Ledger();
  tr.add('trust:reversion', C.trustAdjust * (s.trust - e.trust));
  tr.add('trust:approval', C.trustAdjust * C.trustApproval * (approval - C.approvalNeutral));
  for (const m of mods('trust')) tr.add(m.source, m.amount);
  if (filibusterTrustPenalty > 0) tr.add('trust:reform', -filibusterTrustPenalty);
  if (reformResult && reformResult.trustDelta !== 0) tr.add('trust:reform', reformResult.trustDelta);
  if (amendmentTrustGain > 0) tr.add('trust:reform', amendmentTrustGain);
  if (geoEscalationTrustPenalty > 0) tr.add('event:geopolitical_escalation', -geoEscalationTrustPenalty);
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
  if (geoRes?.valid && geoRes.cloutCost > 0) {
    cl.add('clout:crisis', -geoRes.cloutCost);
  }
  if (pRes?.valid) {
    if (pRes.cloutSpent > 0) cl.add('clout:powers', -pRes.cloutSpent);
    if (pRes.cloutGained > 0) cl.add('clout:powers', pRes.cloutGained);
  }
  if (forRes && forRes.cloutSpent > 0) cl.add('clout:powers', -forRes.cloutSpent);
  if (tradeRes && tradeRes.cloutSpent > 0) cl.add('clout:powers', -tradeRes.cloutSpent);
  if (filibusterCost > 0) cl.add('clout:reform', -filibusterCost);
  if (reformResult && reformResult.cloutCost > 0) cl.add('clout:reform', -reformResult.cloutCost);
  if (amendmentCloutCost > 0) cl.add('clout:reform', -amendmentCloutCost);
  const clout = cl.clamp(state.clout + cl.sum, 0, C.cloutCap);

  if (filibusterLog) log.push(filibusterLog);
  if (reformResult) log.push(...reformResult.log);
  if (r) log.push(r.valid ? { kind: 'bill', id: r.status, amount: r.whip.total } : { kind: 'bill', id: 'rejected', detail: r.reason });

  let nextHouseSeatDelta = state.houseSeatDelta ?? 0;
  let nextSenateSeatDelta = state.senateSeatDelta;
  if (!legacyRun && (state.turn === MIDTERM_TURN_1 || state.turn === MIDTERM_TURN_2)) {
    const midterm = calculateMidtermShift(approval);
    nextHouseSeatDelta = midterm.houseShift;
    nextSenateSeatDelta = midterm.senateShift;
    const houseWord = midterm.houseShift >= 0 ? `+${midterm.houseShift}` : `${midterm.houseShift}`;
    const senateWord = midterm.senateShift >= 0 ? `+${midterm.senateShift}` : `${midterm.senateShift}`;
    log.push({
      kind: 'midterm',
      id: 'midterm_results',
      detail: `${houseWord} House seats, ${senateWord} Senate seats`,
      amount: midterm.houseShift,
    });
  }

  const nextTurn = state.turn + 1;
  if (!legacyRun) {
    const geoSchedule = getGeopoliticalSchedule(state.seed);
    const nextGeoId = geoSchedule.get(nextTurn);
    if (nextGeoId && !resolvedGeoCrises.includes(nextGeoId) && !activeGeoCrises.some((c) => c.crisisId === nextGeoId)) {
      const def = getCrisis(nextGeoId);
      if (def) {
        activeGeoCrises.push(createGeopoliticalActiveCrisis(def, nextTurn));
      }
    }
  }

  const nextEcon = { gap, growth, unemployment, empPop, inflation, expected, fedRate, gdp, debt, realIncome, gini, lifeExp, trust, crime };
  const interimState: GameState = {
    ...state,
    turn: nextTurn,
    approval,
    clout,
    policy,
    socialPolicy,
    modifiers,
    scheduled,
    activeOrders,
    viewedMyths,
    speechCountInWindow,
    houseSeatDelta: nextHouseSeatDelta,
    activeGeopoliticalCrises: activeGeoCrises,
    resolvedGeopoliticalCrises: resolvedGeoCrises,
    foreignPolicy: nextForeignPolicy,
    trade: nextTrade,
    ...(state.senateSeatDelta !== undefined || state.filibusterRule !== undefined || nextFilibusterRule !== undefined ? { senateSeatDelta: nextSenateSeatDelta ?? 0 } : {}),
    ...(nextFilibusterRule !== undefined && nextFilibusterRule !== 'sixty_vote' ? { filibusterRule: nextFilibusterRule } : {}),
    ...(nextActiveReforms && nextActiveReforms.length > 0 ? { activeReforms: nextActiveReforms } : {}),
    ...(nextCourtComposition ? { courtComposition: nextCourtComposition } : {}),
    ...(nextActiveAmendment ? { activeAmendment: nextActiveAmendment } : {}),
    ...(nextRatifiedAmendments && nextRatifiedAmendments.length > 0 ? { ratifiedAmendments: nextRatifiedAmendments } : {}),
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

