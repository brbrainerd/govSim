// Pure engine evaluation for policy milestone badges (RPT-03, GR-24, GR-25).
import { BADGES, BADGE_THRESHOLDS, type Badge } from '../content/badges';
import { C } from './coefficients';
import { finalScore, type GameState } from './game';
import { PERCENT } from './units';

export interface BadgeEvaluationMeta {
  readonly speechesGiven?: readonly ('general' | 'congress' | 'business')[];
  readonly passedBillsCount?: number;
  readonly scotusConfirmed?: boolean;
  readonly crisesResolvedCount?: number;
  readonly ordersSignedCount?: number;
  readonly ordersOverturnedCount?: number;
  readonly reelectionEV?: number;
  readonly score?: number;
}

/** Computes federal deficit as percentage of GDP for a given state. */
export function computeDeficitPct(state: GameState): number {
  const gdp = state.econ.gdp;
  if (gdp <= 0) return 0;
  // Baseline deficit ratio adjusted by enacted policy change
  const baselineDeficit = (state.start.deficitPct / PERCENT) * gdp;
  // Estimate borrowing drift from rate delta
  const borrowingCostDrift = ((state.econ.fedRate - state.start.fedRate) * C.fedPassThrough * state.econ.debt) / PERCENT;
  const totalDeficit = baselineDeficit + borrowingCostDrift;
  return (totalDeficit / gdp) * PERCENT;
}

/** Extracts cumulative metadata from a session history of game states. */
export function extractBadgeMeta(
  current: GameState,
  history: readonly GameState[],
  additional?: BadgeEvaluationMeta,
): BadgeEvaluationMeta {
  const allLogs = history.flatMap((s) => s.report?.log ?? []);

  const speeches = new Set<'general' | 'congress' | 'business'>(additional?.speechesGiven ?? []);
  let billsPassed = additional?.passedBillsCount ?? 0;
  let scotusConfirmed = additional?.scotusConfirmed ?? false;
  let crisesResolved = additional?.crisesResolvedCount ?? 0;
  let ordersSigned = additional?.ordersSignedCount ?? 0;
  let ordersOverturned = additional?.ordersOverturnedCount ?? 0;

  for (const log of allLogs) {
    if (log.kind === 'speech' && (log.id === 'general' || log.id === 'congress' || log.id === 'business')) {
      speeches.add(log.id);
    }
    if (log.kind === 'bill' && log.id === 'enact') {
      billsPassed += 1;
    }
    if (log.kind === 'scotus' && log.id === 'confirmed') {
      scotusConfirmed = true;
    }
    if (log.kind === 'crisis') {
      crisesResolved += 1;
    }
    if (log.kind === 'order' && log.id === 'signed') {
      ordersSigned += 1;
    }
    if (log.kind === 'court' && (log.id === 'overturned' || log.id === 'struck_down')) {
      ordersOverturned += 1;
    }
  }

  // Also include current active orders count if higher
  if (current.activeOrders.length > ordersSigned) {
    ordersSigned = current.activeOrders.length;
  }

  return {
    speechesGiven: Array.from(speeches),
    passedBillsCount: billsPassed,
    scotusConfirmed,
    crisesResolvedCount: crisesResolved,
    ordersSignedCount: ordersSigned,
    ordersOverturnedCount: ordersOverturned,
    reelectionEV: additional?.reelectionEV,
    score: additional?.score,
  };
}

/** Checks whether a specific badge's condition is met. */
export function checkBadgeUnlock(
  badgeId: string,
  state: GameState,
  history: readonly GameState[],
  meta?: BadgeEvaluationMeta,
): boolean {
  const m = extractBadgeMeta(state, history, meta);
  const debtPct = (state.econ.debt / state.econ.gdp) * PERCENT;
  const baselineDebtPct = state.start.debtPct;

  switch (badgeId) {
    case 'balanced_budget': {
      // Deficit under threshold % of GDP
      const deficit = computeDeficitPct(state);
      return deficit < BADGE_THRESHOLDS.deficitPct;
    }
    case 'full_employment': {
      // People working ratio > threshold %
      return state.econ.empPop >= BADGE_THRESHOLDS.empPopPct;
    }
    case 'inflation_tamed': {
      // Inflation in stable band
      return state.econ.inflation >= BADGE_THRESHOLDS.minInflation && state.econ.inflation <= BADGE_THRESHOLDS.maxInflation;
    }
    case 'debt_stabilized': {
      // Reduced debt share of economy by at least threshold percentage points
      return baselineDebtPct - debtPct >= BADGE_THRESHOLDS.debtReductionPp;
    }
    case 'crisis_pilot': {
      // Resolved crises threshold
      return (m.crisesResolvedCount ?? 0) >= BADGE_THRESHOLDS.crisesResolved;
    }
    case 'restrained_executive': {
      // Signed orders threshold with 0 overturned
      return (m.ordersSignedCount ?? 0) >= BADGE_THRESHOLDS.ordersSigned && (m.ordersOverturnedCount ?? 0) === 0;
    }
    case 'judicial_appointment': {
      // Appointed a confirmed Supreme Court justice
      return m.scotusConfirmed === true;
    }
    case 'bipartisan_builder': {
      // Passed bills threshold through Congress
      return (m.passedBillsCount ?? 0) >= BADGE_THRESHOLDS.billsPassed;
    }
    case 'master_orator': {
      // Spoke to all 3 audiences
      const sp = m.speechesGiven ?? [];
      return sp.includes('general') && sp.includes('congress') && sp.includes('business');
    }
    case 'electoral_mandate': {
      // Reelection EV threshold
      return (m.reelectionEV ?? 0) >= BADGE_THRESHOLDS.reelectionEV;
    }
    case 'social_trust': {
      // Social trust threshold
      return state.econ.trust >= BADGE_THRESHOLDS.socialTrustPct;
    }
    case 'transformational_legacy': {
      // Final or headline prosperity score threshold
      const score = m.score ?? finalScore(state).total;
      return score >= BADGE_THRESHOLDS.prosperityScore;
    }
    default:
      return false;
  }
}

/** Pure evaluation of all unlocked badge IDs against current state and history. */
export function evaluateBadges(
  state: GameState,
  history: readonly GameState[],
  meta?: BadgeEvaluationMeta,
): string[] {
  const m = extractBadgeMeta(state, history, meta);
  const unlocked: string[] = [];

  for (const badge of BADGES) {
    if (checkBadgeUnlock(badge.id, state, history, m)) {
      unlocked.push(badge.id);
    }
  }

  return unlocked;
}
