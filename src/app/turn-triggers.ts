import type { ScreenId } from './screens';
import type { Session, StagedActionItem } from './session.svelte';
import type { AdvisorPlay, Suggestion } from '../content/briefing';

export type TurnTriggerKind =
  | 'crisis'
  | 'unsent_budget'
  | 'failing_bill'
  | 'milestone'
  | 'mandate_draft'
  | 'agenda'
  | 'ready';

export interface TurnTrigger {
  readonly kind: TurnTriggerKind;
  readonly blocker: boolean;
  readonly badge: string;
  readonly label: string;
  readonly detail: string;
  readonly screen?: ScreenId;
  readonly openCrisis?: boolean;
  readonly openPerkDraft?: boolean;
  readonly play?: AdvisorPlay;
}

export interface StagedClearingInfo {
  readonly status: 'will_clear' | 'at_risk' | 'unsent';
  readonly statusBadge: string;
  readonly effectLabel: string;
}

export interface TurnChecklistItem {
  readonly id: string;
  readonly index: number;
  readonly title: string;
  readonly subtitle: string;
  readonly checked: boolean;
  readonly warning: boolean;
  readonly statusBadge: string;
  readonly screen?: ScreenId;
  readonly play?: AdvisorPlay;
  readonly openCrisis?: boolean;
  readonly mythId?: string;
}

/**
 * Computes explicit per-turn clearing status and projected outcome for any staged item (`CLEAR-02`).
 */
export function describeStagedItem(session: Session, item: StagedActionItem): StagedClearingInfo {
  if (item.id === 'budget-unsent') {
    return {
      status: 'unsent',
      statusBadge: 'DRAFT UNSENT !',
      effectLabel: 'Send to Congress on Budget screen or changes will not clear',
    };
  }
  if (item.id === 'bill-queued') {
    const passed = session.preview ? session.preview.passed : session.whip.total >= 218;
    if (passed) {
      return {
        status: 'will_clear',
        statusBadge: `PASSES (${session.whip.total}/218) ✓`,
        effectLabel: 'Enacts into law when you click Next Turn',
      };
    }
    const shortBy = Math.max(1, 218 - session.whip.total);
    return {
      status: 'at_risk',
      statusBadge: `SHORT ${shortBy} VOTES ⚠`,
      effectLabel: `${session.whip.total}/218 House votes — whip deals or bill fails`,
    };
  }
  if (item.id === 'crisis-choice' || item.id === 'dynamic-crisis') {
    return {
      status: 'will_clear',
      statusBadge: 'CLEARS THIS TURN ✓',
      effectLabel: 'Resolves crisis when quarter ends',
    };
  }
  if (item.id === 'orders') {
    return {
      status: 'will_clear',
      statusBadge: 'CLEARS THIS TURN ✓',
      effectLabel: `Takes effect immediately (−${session.powerCost} Clout)`,
    };
  }
  if (item.id === 'evil') {
    return {
      status: 'will_clear',
      statusBadge: 'CLEARS THIS TURN ✓',
      effectLabel: `+$${session.stagedEvilLeversKickbackBn.toFixed(1)}B Stash · +${Math.round(session.stagedEvilLeversHeatDelta)} Heat`,
    };
  }
  return {
    status: 'will_clear',
    statusBadge: 'CLEARS THIS TURN ✓',
    effectLabel: 'Executes at end of quarter',
  };
}

/**
 * Determines whether the Task Force / Heist Relic draft should be spotlighted on this turn.
 * Staggers drafts off Turn 1 (inauguration focus) and defers them whenever a Crisis is active
 * so single turns never stack multiple popups/triggers.
 */
export function isMandateDraftSpotlightTurn(session: Session): boolean {
  if (session.isClassicSim) return false;
  if (session.draft.perkPickId || session.draft.perkSkipForClout) return false;
  const hasGeoCrisis = Boolean(
    session.current.activeGeopoliticalCrises && session.current.activeGeopoliticalCrises.length > 0,
  );
  if (session.hasUnresolvedCrisis || hasGeoCrisis) return false;
  const turn = session.current.turn;
  return turn >= 2 && (turn % 2 === 0 || session.activePerks.length === 0);
}

/**
 * Civ-style per-turn spotlight trigger resolver (`TRIG-01`, `TRIG-02`).
 * Surfaces at most one primary spotlight trigger per turn in strict priority order.
 */
export function resolveTurnTrigger(
  session: Session,
  suggestions: readonly Suggestion[] = [],
): TurnTrigger {
  const geoCrisis =
    session.current.activeGeopoliticalCrises && session.current.activeGeopoliticalCrises.length > 0
      ? session.current.activeGeopoliticalCrises[0]!
      : null;

  if (session.hasUnresolvedCrisis && session.current.activeCrisis) {
    return {
      kind: 'crisis',
      blocker: true,
      badge: '! CRISIS ALERT',
      label: 'Resolve Domestic Crisis',
      detail: session.current.activeCrisis.headline,
      screen: 'oval',
      openCrisis: true,
    };
  }

  if (geoCrisis && !session.draft.crisisChoice) {
    return {
      kind: 'crisis',
      blocker: true,
      badge: '! GLOBAL CRISIS',
      label: 'Respond to Geopolitical Crisis',
      detail: geoCrisis.headline,
      screen: 'oval',
      openCrisis: true,
    };
  }

  const unsentItem = session.stagedActionsSummary.find((a) => a.id === 'budget-unsent');
  if (unsentItem) {
    return {
      kind: 'unsent_budget',
      blocker: true,
      badge: '! UNSENT BILL',
      label: 'Send Budget to Congress',
      detail: 'You adjusted Budget levers, but have not sent the bill to Congress yet.',
      screen: 'budget',
    };
  }

  const billItem = session.stagedActionsSummary.find((a) => a.id === 'bill-queued');
  if (billItem && describeStagedItem(session, billItem).status === 'at_risk') {
    const needed = Math.max(1, 218 - session.whip.total);
    return {
      kind: 'failing_bill',
      blocker: true,
      badge: `⚠ SHORT ${needed} VOTES`,
      label: 'Whip Votes in Congress',
      detail: `Your queued bill has ${session.whip.total}/218 House votes and will fail without deals.`,
      screen: 'congress',
    };
  }

  const turn = session.current.turn;
  if (session.isEvilMode && (session.current.evil?.heat ?? 0) >= 80) {
    return {
      kind: 'milestone',
      blocker: false,
      badge: '⚠ IMPEACHMENT RISK',
      label: 'Purge Watchdogs or Cool Heat',
      detail: 'Heat is at 80+. A House impeachment floor vote is imminent.',
      screen: 'powers',
    };
  }

  if (turn === 8 || turn === 24) {
    return {
      kind: 'milestone',
      blocker: false,
      badge: '★ MIDTERM QUARTER',
      label: 'Midterm Elections This Quarter',
      detail: 'House and Senate seats rebalance at turn end based on Approval and Economy.',
      screen: 'voters',
    };
  }

  if (turn === 16 || turn === 32) {
    return {
      kind: 'milestone',
      blocker: false,
      badge: '★ ELECTION NIGHT',
      label: turn === 16 ? 'Reelection Vote This Quarter' : 'Final Term Legacy Verdict',
      detail: 'Check your 270 Electoral College path before ending the quarter.',
      screen: 'voters',
    };
  }

  const clearingItems = session.stagedActionsSummary.filter(
    (a) => describeStagedItem(session, a).status === 'will_clear',
  );
  if (clearingItems.length > 0) {
    return {
      kind: 'ready',
      blocker: false,
      badge: `✓ ${clearingItems.length} CLEARING`,
      label: `${clearingItems.length} Decision${clearingItems.length === 1 ? '' : 's'} Ready to Clear`,
      detail: clearingItems.map((i) => i.label).join(' · '),
      screen: clearingItems[0]!.screen,
    };
  }

  if (isMandateDraftSpotlightTurn(session)) {
    return {
      kind: 'mandate_draft',
      blocker: false,
      badge: session.isEvilMode ? '★ HEIST RELIC' : '★ TASK FORCE',
      label: session.isEvilMode ? 'Draft a Syndicate Relic' : 'Draft a Quarterly Task Force',
      detail: 'Pick 1 of 3 passive policy doctrines (or skip for +10 Clout).',
      screen: 'oval',
      openPerkDraft: true,
    };
  }

  const topSuggestion = suggestions[0];
  return {
    kind: 'agenda',
    blocker: false,
    badge: `TURN ${turn} PRIORITY`,
    label: topSuggestion?.title ?? 'Choose a Policy Move',
    detail: topSuggestion?.cta ? `Recommended: ${topSuggestion.cta}` : 'Stage a bill or executive action.',
    screen: topSuggestion?.target ?? 'budget',
    play: topSuggestion?.play,
  };
}

/**
 * Builds the 3-row checklist for the `★ PENDING & CLEARING THIS TURN ★` stacked index card
 * modeled on `.design-targets/uikit.png` and `hub2.png`.
 */
export function buildTurnChecklist(
  session: Session,
  suggestions: readonly Suggestion[],
): readonly TurnChecklistItem[] {
  const rows: TurnChecklistItem[] = [];
  const staged: readonly StagedActionItem[] = session.stagedActionsSummary;

  // 1. Unresolved Domestic or Geopolitical Crisis takes Slot #1
  const geoCrisis =
    session.current.activeGeopoliticalCrises && session.current.activeGeopoliticalCrises.length > 0
      ? session.current.activeGeopoliticalCrises[0]!
      : null;

  if (session.hasUnresolvedCrisis && session.current.activeCrisis) {
    rows.push({
      id: 'crisis-pending',
      index: rows.length + 1,
      title: session.current.activeCrisis.headline,
      subtitle: 'Unresolved Crisis · Choose response before quarter ends',
      checked: false,
      warning: true,
      statusBadge: 'NEEDS DECISION !',
      screen: 'oval',
      openCrisis: true,
    });
  } else if (geoCrisis && !session.draft.crisisChoice) {
    rows.push({
      id: 'geo-crisis-pending',
      index: rows.length + 1,
      title: geoCrisis.headline,
      subtitle: 'International Crisis · Choose diplomatic or military response',
      checked: false,
      warning: true,
      statusBadge: 'NEEDS DECISION !',
      screen: 'oval',
      openCrisis: true,
    });
  }

  // 2. Queued / Staged Actions for This Turn (shows exact clearing status!)
  for (const item of staged) {
    if (rows.length >= 3) break;
    const info = describeStagedItem(session, item);
    const isWarning = info.status !== 'will_clear';
    rows.push({
      id: `staged-${item.id}`,
      index: rows.length + 1,
      title: item.label,
      subtitle: info.effectLabel,
      checked: !isWarning,
      warning: isWarning,
      statusBadge: info.statusBadge,
      screen: item.screen,
    });
  }

  // 3. Fill remaining slots (up to 3) with Advisor Recommended Plays for this turn
  for (const s of suggestions) {
    if (rows.length >= 3) break;
    if (s.target && staged.some((st) => st.screen === s.target)) continue;
    rows.push({
      id: `sug-${rows.length + 1}-${s.title}`,
      index: rows.length + 1,
      title: s.title,
      subtitle: s.play?.pack
        ? `1-Click Play: ${s.play.pack}`
        : s.play?.autoWhip
          ? '1-Click Play: Auto-whip 218 votes'
          : `Recommended: ${s.cta}`,
      checked: false,
      warning: false,
      statusBadge: s.play ? 'STAGE PLAY +' : s.cta.toUpperCase(),
      screen: s.target ?? undefined,
      play: s.play,
      openCrisis: s.openCrisis,
      mythId: s.mythId,
    });
  }

  return rows;
}
