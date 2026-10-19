// Pure, deterministic "Beat the Baseline" lookahead engine, 8-component gap analyzer,
// and multi-path strategic playbook recommender (Phases 57–58: BEAT-01..03, FUN-01..03).

import { fromPackage, type BudgetDraft, type PackageName } from '../engine/budget';
import { SCORE } from '../engine/coefficients';
import { findCheapestCoalition, type DealId } from '../engine/congress';
import { autopilotDecisions, type Decisions } from '../engine/decisions';
import { calculateHeatPenalties } from '../engine/evil';
import { endTurn, legacy, prosperity, scoreVsAutopilot, type GameState, type ScoreBreakdown } from '../engine/game';
import { socialBaseline, type SocialDraft } from '../engine/social';
import { PERCENT } from '../engine/units';
import type { ScreenId } from './screens';
import type { Session } from './session.svelte';

export type ProsperityComponentId =
  | 'income'
  | 'employment'
  | 'debt'
  | 'inflation'
  | 'lifeExp'
  | 'inequality'
  | 'security'
  | 'trust';

export interface BaselineFixAction {
  readonly label: string;
  readonly screen: ScreenId;
  readonly pack?: PackageName;
  readonly budgetOverrides?: Partial<Record<string, number>>;
  readonly socialOverrides?: Partial<SocialDraft>;
  readonly signOrder?: string;
  readonly autoWhip?: boolean;
}

export interface BaselineComponentGap {
  readonly id: ProsperityComponentId;
  readonly label: string;
  readonly wonkLabel: string;
  readonly icon: string;
  readonly weightPct: number;
  readonly playerBlended: number;
  readonly autoBlended: number;
  readonly weightedDelta: number;
  readonly headroomPoints: number;
  readonly status: 'beating' | 'tied' | 'trailing';
  readonly coachTip: string;
  readonly fix: BaselineFixAction;
}

export interface ProjectedQuarterPoint {
  readonly quarterOffset: number;
  readonly playerGrowth: number;
  readonly autoGrowth: number;
  readonly playerEmpPop: number;
  readonly autoEmpPop: number;
  readonly playerInflation: number;
  readonly autoInflation: number;
  readonly playerDebtPct: number;
  readonly autoDebtPct: number;
}

export interface DraftScorePreview {
  readonly hasStagedChanges: boolean;
  readonly needsCongressVote: boolean;
  /** Score delta vs doing nothing this turn if enacted (includes auto-whip if budget is unsent). */
  readonly deltaVsIdle: ScoreBreakdown;
  /** Score delta vs doing nothing if Next Turn is pressed right now without sending an unsent bill. */
  readonly queuedDeltaVsIdle: ScoreBreakdown;
  /** Headline total vs autopilot after enacting the current draft. */
  readonly projectedHeadlineTotal: number;
  /** Short badge text for UI pills (e.g. "Est. +0.8 vs. Autopilot"). */
  readonly badgeText: string;
  /** 4-quarter trajectory preview for Economy charts. */
  readonly projected4Q: readonly ProjectedQuarterPoint[];
}

export interface StrategicPlaybook {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly badge: string;
  readonly icon: string;
  readonly targetScreen: ScreenId;
  readonly estDelta: number;
  readonly estDeltaLabel: string;
  readonly upside: string;
  readonly catchText: string;
  readonly pack?: PackageName;
  readonly budgetOverrides?: Partial<Record<string, number>>;
  readonly socialOverrides?: Partial<SocialDraft>;
  readonly signOrder?: string;
  readonly autoWhip?: boolean;
}

const COMPONENT_META: Record<
  ProsperityComponentId,
  {
    label: string;
    wonkLabel: string;
    icon: string;
    weightPct: number;
    coachTip: string;
    fix: BaselineFixAction;
  }
> = {
  income: {
    label: 'Paychecks & Income',
    wonkLabel: 'Real Median Household Income (25%)',
    icon: '💵',
    weightPct: 25,
    coachTip: 'Invest in Roads & R&D or Medicare drug negotiations to lift family paychecks.',
    fix: {
      label: 'Stage Roads & R&D Push →',
      screen: 'budget',
      pack: 'Infrastructure push',
      socialOverrides: { drg: 50, k12: 110 },
      autoWhip: true,
    },
  },
  employment: {
    label: 'Jobs & Hiring',
    wonkLabel: 'Employment-to-Population Ratio (15%)',
    icon: '👷',
    weightPct: 15,
    coachTip: 'Fund infrastructure and skilled worker visas to boost hiring above autopilot.',
    fix: {
      label: 'Boost Jobs in Budget →',
      screen: 'budget',
      pack: 'Infrastructure push',
      socialOverrides: { vis: 120 },
      autoWhip: true,
    },
  },
  debt: {
    label: 'National Debt Path',
    wonkLabel: '10-Year Debt-to-GDP Trajectory (15%)',
    icon: '💳',
    weightPct: 15,
    coachTip: 'Balance spending with tax revenue or Medicare drug savings to tame 10-year debt.',
    fix: {
      label: 'Stage Deficit Trim →',
      screen: 'budget',
      pack: 'Balance the budget',
      socialOverrides: { drg: 80 },
      autoWhip: true,
    },
  },
  inflation: {
    label: 'Store Prices',
    wonkLabel: 'CPI Distance from 2.0% Target (10%)',
    icon: '🛒',
    weightPct: 10,
    coachTip: 'Crack down on grocery monopolies or trim tariffs to cool store prices toward 2%.',
    fix: {
      label: 'Sign Antitrust Review EO →',
      screen: 'powers',
      signOrder: 'eo_antitrust_review',
    },
  },
  lifeExp: {
    label: 'Health & Lifespan',
    wonkLabel: 'Population Life Expectancy (10%)',
    icon: '🏥',
    weightPct: 10,
    coachTip: 'Expand ACA health subsidies, Medicaid, and clean energy to lengthen lifespan.',
    fix: {
      label: 'Expand Healthcare in Budget →',
      screen: 'budget',
      budgetOverrides: { mcd: 112, rnd: 108 },
      socialOverrides: { aca: 120, drg: 60 },
      autoWhip: true,
    },
  },
  inequality: {
    label: 'Fairness & Equality',
    wonkLabel: 'Gini Income Inequality Index (10%)',
    icon: '⚖️',
    weightPct: 10,
    coachTip: 'Fund Title I schools, ACA health relief, and fair tax brackets to narrow the gap.',
    fix: {
      label: 'Stage Family Fairness Plan →',
      screen: 'budget',
      budgetOverrides: { inc: 24, mcd: 110 },
      socialOverrides: { k12: 115, aca: 115, drg: 50 },
      autoWhip: true,
    },
  },
  security: {
    label: 'National Security',
    wonkLabel: 'Composite Security Readiness Index (10%)',
    icon: '🛡️',
    weightPct: 10,
    coachTip: 'Maintain defense readiness and resolve international crises swiftly.',
    fix: {
      label: 'Review Security & Orders →',
      screen: 'powers',
      signOrder: 'eo_buy_american',
    },
  },
  trust: {
    label: 'Public Trust',
    wonkLabel: 'Institutional & Civic Trust (5%)',
    icon: '🤝',
    weightPct: 5,
    coachTip: 'Sign supply-chain antitrust rules, bust civic myths, and pass bipartisan deals.',
    fix: {
      label: 'Sign Antitrust & Trust EO →',
      screen: 'powers',
      signOrder: 'eo_antitrust_review',
    },
  },
};

const COMPONENT_ORDER: readonly ProsperityComponentId[] = [
  'income',
  'employment',
  'debt',
  'inflation',
  'lifeExp',
  'inequality',
  'security',
  'trust',
];

/**
 * Computes the 8-component You vs. Autopilot breakdown (50% Now + 50% 10-Year Legacy),
 * sorted by where the player has the highest leverage to gain points against Autopilot.
 */
export function diagnoseBaselineGaps(
  state: GameState,
  autopilotState: GameState,
): readonly BaselineComponentGap[] {
  const wNow = SCORE.nowWeight.value;
  const wLater = 1 - wNow;

  const pNow = prosperity(state).parts;
  const pLater = prosperity(legacy(state)).parts;
  const aNow = prosperity(autopilotState).parts;
  const aLater = prosperity(legacy(autopilotState)).parts;

  const gaps: BaselineComponentGap[] = COMPONENT_ORDER.map((id) => {
    const meta = COMPONENT_META[id];
    const pPartNow = pNow[id];
    const pPartLater = pLater[id];
    const aPartNow = aNow[id];
    const aPartLater = aLater[id];

    const playerBlended = wNow * pPartNow.v + wLater * pPartLater.v;
    const autoBlended = wNow * aPartNow.v + wLater * aPartLater.v;
    const weight = pPartNow.w;
    const weightedDelta = Math.round(weight * (playerBlended - autoBlended) * 100) / 100;
    const headroomPoints = Math.round(weight * Math.max(0, 100 - playerBlended) * 10) / 10;

    const status: 'beating' | 'tied' | 'trailing' =
      weightedDelta >= 0.05 ? 'beating' : weightedDelta <= -0.05 ? 'trailing' : 'tied';

    return {
      id,
      label: meta.label,
      wonkLabel: meta.wonkLabel,
      icon: meta.icon,
      weightPct: meta.weightPct,
      playerBlended: Math.round(playerBlended * 10) / 10,
      autoBlended: Math.round(autoBlended * 10) / 10,
      weightedDelta,
      headroomPoints,
      status,
      coachTip: meta.coachTip,
      fix: meta.fix,
    };
  });

  // Sort so trailing / highest-headroom opportunities appear first
  return [...gaps].sort((a, b) => {
    if (a.weightedDelta !== b.weightedDelta) {
      return a.weightedDelta - b.weightedDelta;
    }
    return b.headroomPoints - a.headroomPoints;
  });
}

function buildPreviewDecisions(session: Session, forcePassBill: boolean): {
  decisions: Decisions;
  hasStagedChanges: boolean;
  needsCongressVote: boolean;
} {
  const state = session.current;
  const draft = session.draft;

  const budgetModified = Object.entries(draft.budget).some(
    ([k, v]) => v !== (state.policy[k] ?? v),
  );
  const baseSocial = state.socialPolicy ?? socialBaseline();
  const socialModified = Object.entries(draft.social).some(
    ([k, v]) => v !== (baseSocial[k as keyof SocialDraft] ?? v),
  );
  const hasBillChanges = budgetModified || socialModified || draft.pack !== null;
  const hasBillQueued = draft.voteCalled || draft.sentToCongress || draft.deals.length > 0;
  const billCurrentlyPasses = hasBillQueued && Boolean(session.preview?.passed);

  const decisions: Decisions = {};
  if (forcePassBill && (hasBillChanges || hasBillQueued) && !billCurrentlyPasses) {
    const heatFriction = calculateHeatPenalties(state.evil?.heat ?? 0).congressFrictionVotes;
    const coalition = findCheapestCoalition(
      draft.deals,
      state.houseSeatDelta,
      draft.social,
      heatFriction,
    );
    decisions.bill = {
      budget: { ...draft.budget },
      deals: [...coalition.totalDeals],
      social: { ...draft.social },
    };
  } else if (hasBillQueued && session.bill) {
    decisions.bill = session.bill;
  }

  if (draft.crisisChoice) {
    if (state.activeGeopoliticalCrises?.some((c) => c.crisisId === draft.crisisChoice?.crisisId)) {
      decisions.geopoliticalCrisis = { ...draft.crisisChoice };
    } else {
      decisions.crisis = { ...draft.crisisChoice };
    }
  }
  if (session.powers) {
    decisions.powers = {
      ...(draft.signedOrders.length > 0 ? { signOrders: [...draft.signedOrders] } : {}),
      ...(draft.revokedOrders.length > 0 ? { revokeOrders: [...draft.revokedOrders] } : {}),
      ...(draft.fedPressure ? { pressureFed: true } : {}),
      ...(draft.speechAudience ? { speech: { audience: draft.speechAudience } } : {}),
      ...(draft.viewMyth ? { viewMyth: draft.viewMyth } : {}),
      ...(draft.spinMyth ? { spinMyth: draft.spinMyth } : {}),
    };
  }
  if (draft.filibusterRule) decisions.filibusterRule = draft.filibusterRule;
  if (draft.reform) decisions.reform = draft.reform;
  if (draft.amendmentProposal) decisions.amendmentProposal = draft.amendmentProposal;
  if (draft.amendmentCampaign) decisions.amendmentCampaign = true;
  if (
    draft.defensePosture !== null ||
    draft.foreignAssistance !== null ||
    draft.activeSanctions !== null
  ) {
    decisions.foreignPolicy = {
      ...(draft.defensePosture !== null ? { defensePosture: draft.defensePosture } : {}),
      ...(draft.foreignAssistance !== null ? { foreignAssistance: draft.foreignAssistance } : {}),
      ...(draft.activeSanctions !== null ? { activeSanctions: [...draft.activeSanctions] } : {}),
    };
  }
  if (draft.sectorTariffs !== null || draft.tradeAgreements !== null) {
    decisions.trade = {
      ...(draft.sectorTariffs !== null ? { sectorTariffs: [...draft.sectorTariffs] } : {}),
      ...(draft.tradeAgreements !== null ? { agreements: [...draft.tradeAgreements] } : {}),
    };
  }
  if (draft.stagedEvilLevers.length > 0) {
    decisions.evil = {
      enactedLevers: [...draft.stagedEvilLevers],
    };
  }
  if (
    !session.isClassicSim &&
    (draft.perkPickId !== null ||
      draft.perkSkipForClout ||
      draft.perkRerolls > 0 ||
      draft.perkLockedId !== undefined)
  ) {
    decisions.perk = {
      ...(draft.perkPickId ? { pickId: draft.perkPickId } : {}),
      ...(draft.perkSkipForClout ? { skipForClout: true } : {}),
      ...(draft.perkRerolls > 0 ? { rerolls: draft.perkRerolls } : {}),
      ...(draft.perkLockedId !== undefined ? { lockedId: draft.perkLockedId } : {}),
    };
  }
  if (draft.dynamicCrisisDelta) {
    decisions.dynamicCrisisDelta = { ...draft.dynamicCrisisDelta };
  }
  if (draft.turnEntropy != null) {
    decisions.turnEntropy = draft.turnEntropy;
  }
  decisions.presidentialSide = (session.options.party === 'R' ? 'R' : 'D') as 'D' | 'R';

  const hasOtherChanges =
    Boolean(decisions.crisis) ||
    Boolean(decisions.geopoliticalCrisis) ||
    Boolean(decisions.powers) ||
    Boolean(decisions.filibusterRule) ||
    Boolean(decisions.reform) ||
    Boolean(decisions.amendmentProposal) ||
    Boolean(decisions.amendmentCampaign) ||
    Boolean(decisions.foreignPolicy) ||
    Boolean(decisions.trade) ||
    Boolean(decisions.evil) ||
    Boolean(decisions.perk) ||
    Boolean(decisions.dynamicCrisisDelta);

  const hasStagedChanges = hasBillChanges || hasBillQueued || hasOtherChanges;
  const needsCongressVote = (hasBillChanges || hasBillQueued) && !billCurrentlyPasses;

  return { decisions, hasStagedChanges, needsCongressVote };
}

/**
 * Pure deterministic lookahead comparing the player's current staged draft against doing nothing.
 */
export function previewDraftVsBaseline(session: Session): DraftScorePreview {
  const state = session.current;
  const autoState = session.autopilot[session.autopilot.length - 1] ?? state;

  const { decisions: enactedDecisions, hasStagedChanges, needsCongressVote } = buildPreviewDecisions(
    session,
    true,
  );
  const { decisions: queuedDecisions } = buildPreviewDecisions(session, false);

  const autoDecisions: Decisions = {
    ...autopilotDecisions(autoState),
    ...(enactedDecisions.turnEntropy !== undefined
      ? { turnEntropy: enactedDecisions.turnEntropy }
      : {}),
  };
  const idlePlayerDecisions: Decisions = {
    ...autopilotDecisions(state),
    presidentialSide: enactedDecisions.presidentialSide,
    ...(enactedDecisions.turnEntropy !== undefined
      ? { turnEntropy: enactedDecisions.turnEntropy }
      : {}),
  };

  const autoNext = endTurn(autoState, autoDecisions);
  const idlePlayerNext = endTurn(state, idlePlayerDecisions);
  const enactedPlayerNext = hasStagedChanges ? endTurn(state, enactedDecisions) : idlePlayerNext;
  const queuedPlayerNext = hasStagedChanges ? endTurn(state, queuedDecisions) : idlePlayerNext;

  const idleScore = scoreVsAutopilot(idlePlayerNext, autoNext);
  const enactedScore = scoreVsAutopilot(enactedPlayerNext, autoNext);
  const queuedScore = scoreVsAutopilot(queuedPlayerNext, autoNext);

  const deltaVsIdle: ScoreBreakdown = {
    total: Math.round((enactedScore.total - idleScore.total) * 10) / 10,
    now: Math.round((enactedScore.now - idleScore.now) * 10) / 10,
    later: Math.round((enactedScore.later - idleScore.later) * 10) / 10,
  };
  const queuedDeltaVsIdle: ScoreBreakdown = {
    total: Math.round((queuedScore.total - idleScore.total) * 10) / 10,
    now: Math.round((queuedScore.now - idleScore.now) * 10) / 10,
    later: Math.round((queuedScore.later - idleScore.later) * 10) / 10,
  };

  // Compute shock-isolated 4-quarter trajectory for Economy screen chart preview
  const baseGrowth = state.econ.growth;
  const baseEmpPop = state.econ.empPop;
  const baseInflation = state.econ.inflation;
  const baseDebtPct = (state.econ.debt / state.econ.gdp) * PERCENT;

  const projected4Q: ProjectedQuarterPoint[] = [
    {
      quarterOffset: 0,
      playerGrowth: baseGrowth,
      autoGrowth: baseGrowth,
      playerEmpPop: baseEmpPop,
      autoEmpPop: baseEmpPop,
      playerInflation: baseInflation,
      autoInflation: baseInflation,
      playerDebtPct: baseDebtPct,
      autoDebtPct: baseDebtPct,
    },
  ];

  let pSim = enactedPlayerNext;
  if (!hasStagedChanges && session.history.length <= 1) {
    const recBudget = fromPackage('Infrastructure push');
    const heatFriction = calculateHeatPenalties(state.evil?.heat ?? 0).congressFrictionVotes;
    const coalition = findCheapestCoalition([], state.houseSeatDelta, state.socialPolicy, heatFriction);
    pSim = endTurn(state, {
      ...autopilotDecisions(state),
      bill: { budget: recBudget, deals: [...coalition.totalDeals] },
      powers: { signOrders: ['eo_antitrust_review'] },
    });
  }
  let aSim = autoNext;
  for (let q = 1; q <= 4; q++) {
    if (q > 1) {
      pSim = endTurn(pSim, autopilotDecisions(pSim));
      aSim = endTurn(aSim, autopilotDecisions(aSim));
    }
    // Isolate policy divergence from random quarterly shock noise
    const dGrowth = pSim.econ.growth - aSim.econ.growth;
    const dEmp = pSim.econ.empPop - aSim.econ.empPop;
    const dInf = pSim.econ.inflation - aSim.econ.inflation;
    const pDebtPct = (pSim.econ.debt / pSim.econ.gdp) * PERCENT;
    const aDebtPct = (aSim.econ.debt / aSim.econ.gdp) * PERCENT;
    const dDebt = pDebtPct - aDebtPct;

    const autoTrendGrowth = baseGrowth - 0.08 * q;
    const autoTrendEmp = baseEmpPop - 0.05 * q;
    const autoTrendInf = baseInflation + 0.06 * q;
    const autoTrendDebt = baseDebtPct + 0.45 * q;

    projected4Q.push({
      quarterOffset: q,
      playerGrowth: autoTrendGrowth + dGrowth,
      autoGrowth: autoTrendGrowth,
      playerEmpPop: autoTrendEmp + dEmp,
      autoEmpPop: autoTrendEmp,
      playerInflation: autoTrendInf + dInf,
      autoInflation: autoTrendInf,
      playerDebtPct: autoTrendDebt + dDebt,
      autoDebtPct: autoTrendDebt,
    });
  }

  const sign = deltaVsIdle.total >= 0 ? '+' : '−';
  const absVal = Math.abs(deltaVsIdle.total).toFixed(1);
  const badgeText = !hasStagedChanges
    ? 'No draft staged (+0.0 vs. Autopilot)'
    : needsCongressVote
      ? `Est. ${sign}${absVal} vs. Autopilot (pass in Congress)`
      : `Est. ${sign}${absVal} vs. Autopilot`;

  return {
    hasStagedChanges,
    needsCongressVote,
    deltaVsIdle,
    queuedDeltaVsIdle,
    projectedHeadlineTotal: Math.round(enactedScore.total * 10) / 10,
    badgeText,
    projected4Q,
  };
}

interface CandidatePlaybookSpec {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly badge: string;
  readonly icon: string;
  readonly targetScreen: ScreenId;
  readonly upside: string;
  readonly catchText: string;
  readonly pack?: PackageName;
  readonly budgetOverrides?: Partial<Record<string, number>>;
  readonly socialOverrides?: Partial<SocialDraft>;
  readonly signOrder?: string;
  readonly autoWhip?: boolean;
  readonly isAvailable: (state: GameState) => boolean;
}

const CANDIDATE_PLAYBOOKS: readonly CandidatePlaybookSpec[] = [
  {
    id: 'infra_rnd_boom',
    title: 'Roads, Bridges & R&D Boom',
    subtitle: 'Build highways, labs, and high-skill jobs across all 50 states.',
    badge: 'GROWTH & JOBS',
    icon: '🏗️',
    targetScreen: 'budget',
    upside: 'Lifts Jobs (15%) & 10-Yr Paychecks (25%)',
    catchText: 'Needs 218 House votes in Congress',
    pack: 'Infrastructure push',
    budgetOverrides: { rds: 118, rnd: 112 },
    socialOverrides: { vis: 115, drg: 40 },
    autoWhip: true,
    isAvailable: (state) => (state.policy.rds ?? 100) < 115 || (state.policy.rnd ?? 100) < 108,
  },
  {
    id: 'kitchen_table_compact',
    title: 'Kitchen-Table & Drug Price Relief',
    subtitle: 'Negotiate Medicare drug prices, boost Title I schools, and expand health aid.',
    badge: 'FAMILY RELIEF',
    icon: '🏥',
    targetScreen: 'budget',
    upside: 'Boosts Lifespan (10%), Equality (10%) & Debt (15%)',
    catchText: 'Requires coalition deal with Moderates',
    budgetOverrides: { mcd: 110, rnd: 106, oth: 96 },
    socialOverrides: { drg: 80, aca: 120, k12: 115 },
    autoWhip: true,
    isAvailable: (state) => (state.socialPolicy?.drg ?? 0) < 60 || (state.socialPolicy?.aca ?? 100) < 115,
  },
  {
    id: 'antitrust_price_cooler',
    title: 'Crack Down on Price-Fixing & Monopolies',
    subtitle: 'Sign the Supply-Chain Antitrust Executive Order — no Congress vote required.',
    badge: 'FAST EO WIN',
    icon: '🛒',
    targetScreen: 'powers',
    upside: 'Cools Store Prices (10%) & lifts Public Trust (5%)',
    catchText: 'Costs 20 Clout (no Congress vote needed)',
    signOrder: 'eo_antitrust_review',
    isAvailable: (state) => !state.activeOrders.includes('eo_antitrust_review') && state.clout >= 20,
  },
  {
    id: 'fiscal_hawk_compact',
    title: 'Deficit Hawk & Tariff Relief',
    subtitle: 'Trim borrowing, lower import tariffs, and lock in 10-year debt stability.',
    badge: 'DEBT & PRICES',
    icon: '⚖️',
    targetScreen: 'budget',
    upside: 'Big gain on 10-Yr Debt Path (15%) & Prices (10%)',
    catchText: 'Slower short-term government spending',
    pack: 'Balance the budget',
    budgetOverrides: { tar: 7, rds: 108, rnd: 106 },
    socialOverrides: { drg: 80 },
    autoWhip: true,
    isAvailable: (state) => (state.policy.tar ?? 11) > 8 || (state.policy.inc ?? 22) < 24,
  },
  {
    id: 'buy_american_surge',
    title: 'Buy American & Energy Permitting Blitz',
    subtitle: 'Sign domestic factory procurement and speed up energy permits.',
    badge: 'EXECUTIVE ACTION',
    icon: '🏭',
    targetScreen: 'powers',
    upside: 'Lifts long-run Growth Speed (+0.1% potential)',
    catchText: 'Costs 15 Clout · Low court risk',
    signOrder: 'eo_buy_american',
    isAvailable: (state) => !state.activeOrders.includes('eo_buy_american') && state.clout >= 15,
  },
  {
    id: 'clean_grid_innovation',
    title: 'Clean Energy & Workforce Pact',
    subtitle: 'Expand clean grid credits, worker regularization, and research labs.',
    badge: '10-YR LEGACY',
    icon: '⚡',
    targetScreen: 'budget',
    upside: 'Compounds 10-Year Legacy Income & Lifespan',
    catchText: 'Requires House coalition whip',
    budgetOverrides: { rnd: 118, rds: 112, tar: 9 },
    socialOverrides: { cln: 125, vis: 120, reg: 1, drg: 60 },
    autoWhip: true,
    isAvailable: (state) => (state.socialPolicy?.cln ?? 100) < 120,
  },
];

/**
 * Evaluates candidate strategic playbooks against the current state and returns 3 distinct,
 * high-impact playbooks with live-computed `Est. +X.X vs. Autopilot` score deltas.
 */
export function getStrategicPlaybooks(session: Session): readonly StrategicPlaybook[] {
  const state = session.current;
  const autoState = session.autopilot[session.autopilot.length - 1] ?? state;
  const autoNext = endTurn(autoState, autopilotDecisions(autoState));
  const idleNext = endTurn(state, autopilotDecisions(state));
  const idleScore = scoreVsAutopilot(idleNext, autoNext);

  const heatFriction = calculateHeatPenalties(state.evil?.heat ?? 0).congressFrictionVotes;

  const available = CANDIDATE_PLAYBOOKS.filter((spec) => spec.isAvailable(state));
  const pool = available.length >= 3 ? available : CANDIDATE_PLAYBOOKS;

  const scored: StrategicPlaybook[] = pool.map((spec) => {
    const testDecisions: Decisions = {};
    if (spec.pack || spec.budgetOverrides || spec.socialOverrides) {
      const baseBudget: BudgetDraft = spec.pack
        ? fromPackage(spec.pack)
        : { ...state.policy };
      const mergedBudget: BudgetDraft = { ...baseBudget };
      if (spec.budgetOverrides) {
        for (const [k, v] of Object.entries(spec.budgetOverrides)) {
          if (typeof v === 'number') mergedBudget[k] = v;
        }
      }
      const mergedSocial: SocialDraft = { ...(state.socialPolicy ?? socialBaseline()) };
      if (spec.socialOverrides) {
        for (const [k, v] of Object.entries(spec.socialOverrides)) {
          if (typeof v === 'number') mergedSocial[k as keyof SocialDraft] = v;
        }
      }
      const coalition = findCheapestCoalition(
        [],
        state.houseSeatDelta,
        mergedSocial,
        heatFriction,
      );
      testDecisions.bill = {
        budget: mergedBudget,
        deals: [...coalition.totalDeals] as DealId[],
        social: mergedSocial,
      };
    }
    if (spec.signOrder && !state.activeOrders.includes(spec.signOrder)) {
      testDecisions.powers = {
        signOrders: [spec.signOrder],
      };
    }

    const simNext = endTurn(state, testDecisions);
    const simScore = scoreVsAutopilot(simNext, autoNext);
    const rawDelta = Math.max(0.2, Math.round((simScore.total - idleScore.total) * 10) / 10);

    return {
      id: spec.id,
      title: spec.title,
      subtitle: spec.subtitle,
      badge: spec.badge,
      icon: spec.icon,
      targetScreen: spec.targetScreen,
      estDelta: rawDelta,
      estDeltaLabel: `Est. +${rawDelta.toFixed(1)} vs. Autopilot`,
      upside: spec.upside,
      catchText: spec.catchText,
      ...(spec.pack ? { pack: spec.pack } : {}),
      ...(spec.budgetOverrides ? { budgetOverrides: spec.budgetOverrides } : {}),
      ...(spec.socialOverrides ? { socialOverrides: spec.socialOverrides } : {}),
      ...(spec.signOrder ? { signOrder: spec.signOrder } : {}),
      ...(spec.autoWhip ? { autoWhip: spec.autoWhip } : {}),
    };
  });

  // Rotate selection deterministically by turn while keeping diversity across screens/categories
  const offset = (state.turn - 1) % Math.max(1, scored.length);
  const rotated = [...scored.slice(offset), ...scored.slice(0, offset)];
  return rotated.slice(0, 3);
}
