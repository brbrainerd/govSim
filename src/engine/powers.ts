// Pure logic for presidential executive powers (PWR-01..PWR-07, D5).
// Executive orders, court review, Federal Reserve interactions, bully pulpit speeches, and myth cards.
// Keyed counter-based RNG ('court', 'fed') ensures isolation from macro and crisis draws (FND-01).

import { ORDERS_CATALOG, getOrder, type CourtRiskBand, type ExecutiveOrder } from '../content/orders';
import { getMyth } from '../content/myths';
import { C } from './coefficients';
import { SENATE_CONFIRMATION, SENATE_CONFIRMATION_THRESHOLD, SENATE_SEATS } from './congress';
import type { GameState, LogEntry } from './game';
import type { Modifier, ResolverResult, Scheduled } from './modifiers';
import { draw } from './rng';
import {
  BENCH_STARTING_CONSERVATIVE,
  BENCH_STARTING_LIBERAL,
  COURT_UPHOLD_CEIL,
  COURT_UPHOLD_FLOOR,
  FOREVER,
} from './units';

export { SENATE_CONFIRMATION, SENATE_CONFIRMATION_THRESHOLD, SENATE_SEATS };

export interface PowerDecisions {
  readonly signOrders?: readonly string[];
  readonly revokeOrders?: readonly string[];
  readonly pressureFed?: boolean;
  readonly nominateFed?: 'hawk' | 'centrist' | 'dove';
  readonly nominateScotus?: { readonly name: string; readonly lean: 'liberal' | 'conservative' | 'moderate' };
  readonly speech?: { readonly audience: 'general' | 'congress' | 'business' };
  readonly viewMyth?: string;
  readonly spinMyth?: string;
}

export interface PowerDecisionsResult {
  readonly valid: boolean;
  readonly reason?: 'unaffordable' | 'invalid';
  readonly cloutSpent: number;
  readonly cloutGained: number;
  readonly cloutDelta: number;
  readonly activeOrders: readonly string[];
  readonly endGroups: readonly string[];
  readonly modifiers: readonly Modifier[];
  readonly scheduled: readonly Scheduled[];
  readonly log: readonly LogEntry[];
  readonly viewedMyths: readonly string[];
  readonly spunMyths?: readonly string[];
  readonly heatDelta?: number;
  readonly speechCountInWindow: number;
}

const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Clout cost to deliver a bully pulpit speech given prior speeches in current window (PWR-05). */
export function speechCost(speechCountInWindow: number): number {
  return Math.round(C.speechBaseCost * (1 + C.speechDiminishingFactor * speechCountInWindow));
}

/** Approval lift from a general speech with diminishing returns (PWR-05). */
export function speechApprovalGain(speechCountInWindow: number): number {
  return Math.max(0, C.speechApprovalBoost / (1 + C.speechDiminishingFactor * speechCountInWindow));
}

/** Qualitative risk thresholds against a 6-3 conservative Supreme Court. */
const COURT_UPHOLD_THRESHOLDS: Record<CourtRiskBand, number> = {
  Low: C.courtUpholdLow,
  Moderate: C.courtUpholdModerate,
  High: C.courtUpholdHigh,
};

/**
 * Returns dynamic Supreme Court uphold probability based on net justice ideological balance (REF-02).
 */
export function getCourtUpholdProbability(
  band: CourtRiskBand,
  courtComposition?: { readonly conservative: number; readonly liberal: number }
): number {
  const baseProb = COURT_UPHOLD_THRESHOLDS[band];
  const con = courtComposition?.conservative ?? BENCH_STARTING_CONSERVATIVE;
  const lib = courtComposition?.liberal ?? BENCH_STARTING_LIBERAL;
  const baselineNet = BENCH_STARTING_LIBERAL - BENCH_STARTING_CONSERVATIVE;
  const currentNet = lib - con;
  const shift = (currentNet - baselineNet) * C.courtJusticeUpholdSlope;
  return Math.max(COURT_UPHOLD_FLOOR, Math.min(COURT_UPHOLD_CEIL, baseProb + shift));
}

/** Evaluates whether an executive order faces judicial challenge via keyed draw on 'court' stream (PWR-02). */
export function evaluateCourtChallenge(seed: number, turn: number, order: ExecutiveOrder): boolean {
  const p = draw(seed, 'court', turn, `challenge:${order.id}`);
  return p < order.riskProbability;
}

/** Resolver for scheduled delayed court ruling (PWR-02, FND-06, REF-02). */
export function resolveCourtRuling(ctx: {
  seed: number;
  turn: number;
  state: GameState;
  item: Scheduled;
}): ResolverResult {
  const orderId = String(ctx.item.data.orderId ?? '');
  const order = getOrder(orderId);
  const band = order?.courtRisk ?? 'Moderate';
  const con = ctx.state.courtComposition?.conservative ?? BENCH_STARTING_CONSERVATIVE;
  const lib = ctx.state.courtComposition?.liberal ?? BENCH_STARTING_LIBERAL;
  const threshold = getCourtUpholdProbability(band, ctx.state.courtComposition);

  const roll = draw(ctx.seed, 'court', ctx.turn, `ruling:${orderId}`);
  const upheld = roll < threshold;
  const benchRatio = `${con}-${lib}`;

  if (upheld) {
    return {
      log: [
        {
          kind: 'court',
          id: 'upheld',
          detail: `Supreme Court upholds ${order?.name ?? orderId} (${benchRatio}).`,
        },
      ],
      add: [
        {
          id: `event:court_upheld:${orderId}#trust#t${ctx.turn}`,
          group: `court:${orderId}`,
          source: 'event:court_uphold',
          channel: 'trust',
          amount: 1,
          from: ctx.turn,
          until: ctx.turn,
          tag: 'event',
        },
      ],
    };
  }

  // Struck down
  return {
    endGroups: [`eo:${orderId}`],
    log: [
      {
        kind: 'court',
        id: 'struck_down',
        detail: `Supreme Court strikes down ${order?.name ?? orderId} (${benchRatio}).`,
      },
    ],
    add: [
      {
        id: `event:court_struck:${orderId}#clout#t${ctx.turn}`,
        group: `court:${orderId}`,
        source: 'event:court_strike',
        channel: 'clout',
        amount: -C.courtStrikeCloutPenalty,
        from: ctx.turn,
        until: ctx.turn,
        tag: 'event',
      },
    ],
  };
}

/** Senate confirmation vote count for Fed Chair nomination (PWR-03). */
export function senateConfirmationVotes(stance: 'hawk' | 'centrist' | 'dove'): number {
  return SENATE_CONFIRMATION[stance];
}

/** Resolves all presidential power decisions cleanly and deterministically (PWR-01..PWR-07). */
export function resolvePowerDecisions(state: GameState, powersInput: unknown): PowerDecisionsResult {
  const rejected = (reason: 'unaffordable' | 'invalid'): PowerDecisionsResult => ({
    valid: false,
    reason,
    cloutSpent: 0,
    cloutGained: 0,
    cloutDelta: 0,
    activeOrders: state.activeOrders,
    endGroups: [],
    modifiers: [],
    scheduled: [],
    log: [],
    viewedMyths: state.viewedMyths,
    speechCountInWindow: state.speechCountInWindow,
  });

  if (powersInput === undefined || powersInput === null) {
    // No-op decisions
    return {
      valid: true,
      cloutSpent: 0,
      cloutGained: 0,
      cloutDelta: 0,
      activeOrders: state.activeOrders,
      endGroups: [],
      modifiers: [],
      scheduled: [],
      log: [],
      viewedMyths: state.viewedMyths,
      speechCountInWindow: Math.max(0, state.speechCountInWindow - 1),
    };
  }

  if (!isRecord(powersInput)) return rejected('invalid');

  let cloutSpent = 0;
  let cloutGained = 0;
  const newModifiers: Modifier[] = [];
  const newScheduled: Scheduled[] = [];
  const endGroups: string[] = [];
  const log: LogEntry[] = [];
  let nextActiveOrders = [...state.activeOrders];
  let nextViewedMyths = [...state.viewedMyths];
  let nextSpunMyths = state.spunMyths ? [...state.spunMyths] : [];
  let mythHeatDelta = 0;
  let nextSpeechCount = state.speechCountInWindow;

  // 1. One-time myth card or civic explainer reward (PWR-06, LEARN-01, Pitfall 17)
  const mythId = typeof powersInput.viewMyth === 'string' ? powersInput.viewMyth : undefined;
  if (mythId && !nextViewedMyths.includes(mythId)) {
    nextViewedMyths = [...nextViewedMyths, mythId];
    const isExplainer = mythId.startsWith('explainer:');
    const reward = isExplainer ? C.explainerRewardClout : C.mythRewardClout;
    cloutGained += reward;
    log.push({
      kind: 'myth',
      id: mythId,
      amount: reward,
      detail: isExplainer ? 'Civic explainer curiosity bonus' : 'Civics insight bonus',
    });
  }

  // 1b. Spin myth on national television (SPIN-01)
  const spinId = typeof powersInput.spinMyth === 'string' ? powersInput.spinMyth : undefined;
  if (spinId && !nextViewedMyths.includes(spinId) && !nextSpunMyths.includes(spinId)) {
    const myth = getMyth(spinId);
    if (myth) {
      nextViewedMyths = [...nextViewedMyths, spinId];
      nextSpunMyths = [...nextSpunMyths, spinId];
      mythHeatDelta += C.mythSpinHeatDelta;

      // Short-term 1-turn approval rally
      newModifiers.push({
        id: `event:myth_spin#approval#t${state.turn}`,
        group: `myth_spin:${spinId}`,
        source: 'event:myth_spin',
        channel: 'approval',
        amount: C.mythSpinApprovalBoost,
        from: state.turn,
        until: state.turn,
        tag: 'event',
      });

      // Lasting public institutional trust penalty
      newModifiers.push({
        id: `event:myth_spin#trust#t${state.turn}`,
        group: `myth_spin:${spinId}`,
        source: 'event:myth_spin',
        channel: 'trust',
        amount: C.mythSpinTrustPenalty,
        from: state.turn,
        until: FOREVER,
        tag: 'event',
      });

      log.push({
        kind: 'myth',
        id: spinId,
        amount: 0,
        detail: 'Spun populist civics claim on television',
      });
    }
  }

  // 2. Sign executive orders (PWR-01, PWR-02)
  const signList = Array.isArray(powersInput.signOrders)
    ? powersInput.signOrders.filter((id): id is string => typeof id === 'string')
    : [];

  for (const id of signList) {
    const order = getOrder(id);
    if (!order) return rejected('invalid');
    if (nextActiveOrders.includes(id)) continue; // already active

    cloutSpent += order.cloutCost;
    nextActiveOrders.push(id);

    // Add lasting EO modifiers (tagged 'eo', dropped in legacy D5)
    for (const eff of order.effects) {
      newModifiers.push({
        id: `eo:${id}:${eff.channel}#t${state.turn}`,
        group: `eo:${id}`,
        source: `eo:${id}`,
        channel: eff.channel,
        amount: eff.amount,
        from: state.turn,
        until: FOREVER,
        tag: 'eo',
      });
    }

    log.push({ kind: 'order', id: 'signed', detail: order.name, amount: order.cloutCost });

    // Check judicial review challenge
    if (evaluateCourtChallenge(state.seed, state.turn, order)) {
      newScheduled.push({
        id: `court:${id}#t${state.turn}`,
        kind: 'court_ruling',
        due: state.turn + C.courtReviewDelayTurns,
        data: { orderId: id },
      });
      log.push({ kind: 'court', id: 'challenged', detail: `${order.name} challenged in federal court.` });
    }
  }

  // 3. Revoke executive orders (PWR-01)
  const revokeList = Array.isArray(powersInput.revokeOrders)
    ? powersInput.revokeOrders.filter((id): id is string => typeof id === 'string')
    : [];

  for (const id of revokeList) {
    if (!nextActiveOrders.includes(id)) continue;
    nextActiveOrders = nextActiveOrders.filter((o) => o !== id);
    endGroups.push(`eo:${id}`);
    const order = getOrder(id);
    log.push({ kind: 'order', id: 'revoked', detail: order?.name ?? id });
  }

  // 4. Bully pulpit speech (PWR-05)
  if (isRecord(powersInput.speech) && typeof powersInput.speech.audience === 'string') {
    const audience = powersInput.speech.audience;
    if (['general', 'congress', 'business'].includes(audience)) {
      const cost = speechCost(nextSpeechCount);
      cloutSpent += cost;

      if (audience === 'general') {
        const gain = speechApprovalGain(nextSpeechCount);
        newModifiers.push({
          id: `event:speech_general#approval#t${state.turn}`,
          group: 'speech',
          source: 'event:speech',
          channel: 'approval',
          amount: gain,
          from: state.turn,
          until: state.turn,
          tag: 'event',
        });
      } else if (audience === 'congress') {
        newModifiers.push({
          id: `event:speech_congress#trust#t${state.turn}`,
          group: 'speech',
          source: 'event:speech',
          channel: 'trust',
          amount: 1,
          from: state.turn,
          until: state.turn,
          tag: 'event',
        });
      } else if (audience === 'business') {
        newModifiers.push({
          id: `event:speech_business#gap#t${state.turn}`,
          group: 'speech',
          source: 'event:speech',
          channel: 'gap',
          amount: C.speechBusinessGapBoost,
          from: state.turn,
          until: state.turn,
          tag: 'event',
        });
      }

      nextSpeechCount += 1;
      log.push({ kind: 'speech', id: audience, amount: cost, detail: `Address to ${audience} audience` });
    } else {
      return rejected('invalid');
    }
  } else {
    // Window decay if no speech delivered
    nextSpeechCount = Math.max(0, nextSpeechCount - 1);
  }

  // 5. Federal Reserve pressure (PWR-03)
  if (powersInput.pressureFed === true) {
    const cost = C.fedPressureCost;
    cloutSpent += cost;

    // Rate reduction relief
    newModifiers.push({
      id: `event:fed_pressure#rate#t${state.turn}`,
      group: 'fed_pressure',
      source: 'event:fed_pressure',
      channel: 'fedTarget',
      amount: -C.fedRatePressureRelief,
      from: state.turn,
      until: state.turn,
      tag: 'event',
    });

    // Credibility loss raises inflation expectations
    newModifiers.push({
      id: `event:fed_credibility#infl#t${state.turn}`,
      group: 'fed_credibility',
      source: 'event:fed_credibility',
      channel: 'expected',
      amount: C.fedPressureCredibilityHit,
      from: state.turn,
      until: state.turn + C.fedPressureLingeringTurns,
      tag: 'event',
    });

    log.push({ kind: 'fed', id: 'pressured', amount: cost, detail: 'Publicly pressured Federal Reserve for rate cut' });
  }

  // 6. Federal Reserve chair nomination (PWR-03)
  if (typeof powersInput.nominateFed === 'string') {
    const stance = powersInput.nominateFed;
    if (['hawk', 'centrist', 'dove'].includes(stance)) {
      const votes = senateConfirmationVotes(stance as 'hawk' | 'centrist' | 'dove');
      const confirmed = votes >= SENATE_CONFIRMATION_THRESHOLD;

      if (confirmed) {
        log.push({ kind: 'fed', id: 'confirmed', detail: `Nominated ${stance} Fed Chair confirmed (${votes}-${SENATE_SEATS - votes})` });
        if (stance === 'hawk') {
          newModifiers.push({
            id: `event:fed_chair#hawk#t${state.turn}`,
            group: 'fed_chair',
            source: 'event:fed_chair',
            channel: 'inflation',
            amount: -C.fedChairHawkInflationCut,
            from: state.turn,
            until: FOREVER,
            tag: 'event',
          });
        } else if (stance === 'dove') {
          newModifiers.push({
            id: `event:fed_chair#dove#t${state.turn}`,
            group: 'fed_chair',
            source: 'event:fed_chair',
            channel: 'gap',
            amount: C.fedChairDoveGapBoost,
            from: state.turn,
            until: FOREVER,
            tag: 'event',
          });
        }
      } else {
        log.push({ kind: 'fed', id: 'rejected', detail: `Nominated ${stance} Fed Chair rejected by Senate (${votes}-${SENATE_SEATS - votes})` });
      }
    } else {
      return rejected('invalid');
    }
  }

  // Check clout affordability
  if (cloutSpent > state.clout) {
    return rejected('unaffordable');
  }

  return {
    valid: true,
    cloutSpent,
    cloutGained,
    cloutDelta: cloutGained - cloutSpent,
    activeOrders: nextActiveOrders,
    endGroups,
    modifiers: newModifiers,
    scheduled: newScheduled,
    log,
    viewedMyths: nextViewedMyths,
    ...(nextSpunMyths.length > 0 ? { spunMyths: nextSpunMyths } : {}),
    ...(mythHeatDelta > 0 ? { heatDelta: mythHeatDelta } : {}),
    speechCountInWindow: nextSpeechCount,
  };
}
