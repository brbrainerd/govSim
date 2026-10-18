import { fromPackage, packages, type BudgetDraft, type PackageName } from '../engine/budget';
import { findCheapestCoalition, tally, type DealId } from '../engine/congress';
import { autopilotDecisions, cloutCost, resolveBill, type CrisisDecision, type Decisions, type DynamicCrisisDelta } from '../engine/decisions';
import { endTurn, newGame, prosperity, scoreVsAutopilot, TOTAL_TURNS, type GameState, type ScoreBreakdown, type Start } from '../engine/game';
import { socialBaseline, type SocialDraft } from '../engine/social';
import type { PartyId } from '../content/parties';
import type { AdvisorPlay } from '../content/briefing';
import { getOrder } from '../content/orders';
import { C } from '../engine/coefficients';
import { speechCost, type PowerDecisions } from '../engine/powers';
import { extractElectionReasons, resolveReelection, type ElectionOutcome } from '../engine/election';
import { evaluateBadges } from '../engine/badges';
import { ELECTION_TURN_1 } from '../engine/units';
import { storeAutosave, type SaveFile } from './save';
import { type ScreenId } from './screens';
import { requestAiTurnDirector, type AiTurnPayload } from './ai-director';
import { loadAiConfig, saveAiConfig, type AiConfig } from './ai-providers';

import { FILIBUSTER_RULES_CATALOG, type FilibusterRule } from '../engine/congress';
import { REFORMS_CATALOG, type ReformId } from '../engine/reforms';
import { AMENDMENTS_CATALOG, type AmendmentId } from '../engine/amendments';
import {
  calculateHouseholdImpact,
  DEFAULT_HOUSEHOLD_PERSONA,
  type HouseholdImpactBreakdown,
  type HouseholdPersona,
} from '../engine/household';
import type { DefensePosture, ForeignPolicyDraft, ForeignPolicyState, SanctionType } from '../engine/foreign';
import {
  SECTOR_TARIFFS_CATALOG,
  TRADE_AGREEMENTS_CATALOG,
  calculateTradeBalance,
  type SectorTariffId,
  type TradeAgreementId,
  type TradeBalanceSummary,
  type TradeDraft,
  type TradeState,
} from '../engine/trade';
import { type EvilLeverId } from '../engine/units';
import { getEvilLever } from '../data/evil';
import { calculateHeatPenalties, resolveEvilLevers } from '../engine/evil';
import { getImminentDeadlines } from '../engine/deadlines';
import {
  applyScenarioStart,
  getScenario,
  type ScenarioDef,
  type ScenarioId,
} from '../content/scenarios';
import { type VocabMode } from '../content/glossary';

export type { VocabMode };

export interface StagedActionItem {
  readonly id: string;
  readonly label: string;
  readonly screen: ScreenId;
  readonly warning?: boolean;
}

/** Choices made at New Game. Kept beside the engine state, never inside it (D4). */
export interface GameOptions {
  party: PartyId;
  evilMode?: boolean;
  scenario?: ScenarioId;
  unlockAll?: boolean;
  livingWorld?: boolean;
  vocabMode?: VocabMode;
  presidentLook?: 0 | 1 | 2 | 3;
}

interface Draft {
  budget: BudgetDraft;
  social: SocialDraft;
  pack: PackageName | null;
  sentToCongress: boolean;
  deals: DealId[];
  voteCalled: boolean;
  crisisChoice: CrisisDecision | null;
  signedOrders: string[];
  revokedOrders: string[];
  fedPressure: boolean;
  speechAudience: 'general' | 'congress' | 'business' | null;
  viewMyth: string | null;
  spinMyth: string | null;
  filibusterRule: FilibusterRule | null;
  reform: ReformId | null;
  amendmentProposal: AmendmentId | null;
  amendmentCampaign: boolean;
  defensePosture: DefensePosture | null;
  foreignAssistance: number | null;
  activeSanctions: SanctionType[] | null;
  sectorTariffs: SectorTariffId[] | null;
  tradeAgreements: TradeAgreementId[] | null;
  stagedEvilLevers: EvilLeverId[];
  turnEntropy?: number | null;
  dynamicCrisisDelta?: DynamicCrisisDelta | null;
}

/** A new turn's draft starts from the policy already in force. */
const freshDraft = (policy: BudgetDraft, socialPolicy?: SocialDraft): Draft => ({
  budget: { ...policy },
  social: { ...(socialPolicy ?? socialBaseline()) },
  pack: null,
  sentToCongress: false,
  deals: [],
  voteCalled: false,
  crisisChoice: null,
  signedOrders: [],
  revokedOrders: [],
  fedPressure: false,
  speechAudience: null,
  viewMyth: null,
  spinMyth: null,
  filibusterRule: null,
  reform: null,
  amendmentProposal: null,
  amendmentCampaign: false,
  defensePosture: null,
  foreignAssistance: null,
  activeSanctions: null,
  sectorTariffs: null,
  tradeAgreements: null,
  stagedEvilLevers: [],
  turnEntropy: null,
  dynamicCrisisDelta: null,
});

/**
 * UI-side session: your snapshot history, an autopilot history on the same seed (design §2),
 * this turn's draft decisions and the current screen. Screens only edit the draft;
 * nextTurn turns the draft into Decisions for the pure engine.
 */
export class Session {
  history = $state.raw<GameState[]>([]);
  autopilot = $state.raw<GameState[]>([]);
  inputs = $state.raw<Decisions[]>([]);
  screen = $state<ScreenId>('oval');
  draft = $state<Draft>(freshDraft(fromPackage('Keep as is'), socialBaseline()));
  showingReport = $state<boolean>(false);

  turn16Snapshot = $state.raw<GameState | null>(null);
  showingElectionNight = $state<boolean>(false);
  activeElectionOutcome = $state.raw<ElectionOutcome | null>(null);
  activeAutopilotElectionOutcome = $state.raw<ElectionOutcome | null>(null);
  electionReasons = $state.raw<readonly string[]>([]);
  reelectionWon = $state<boolean>(false);
  showingImpeachmentModal = $state<boolean>(false);
  termEnded = $state<boolean>(false);
  unlockedBadges = $state<string[]>([]);
  newlyUnlockedBadges = $state<string[]>([]);
  selectedHouseholdPersona = $state<HouseholdPersona>(DEFAULT_HOUSEHOLD_PERSONA);
  options = $state<GameOptions>({ party: 'D' });
  unlockAll = $state<boolean>(false);
  calmMode = $state<boolean>(
    typeof localStorage !== 'undefined' &&
      typeof localStorage?.getItem === 'function' &&
      localStorage.getItem('govsim_calm_mode') === 'true'
      ? true
      : typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true,
  );
  vocabMode = $state<VocabMode>(
    typeof localStorage !== 'undefined' &&
      typeof localStorage?.getItem === 'function' &&
      localStorage.getItem('govsim_vocab_mode') === 'wonk'
      ? 'wonk'
      : 'plain',
  );
  aiTurnPayload = $state<AiTurnPayload | null>(null);
  aiLoading = $state<boolean>(false);
  aiConfig = $state<AiConfig>(loadAiConfig());
  private aiRequestSeq = 0;

  current = $derived(this.history[this.history.length - 1]!);
  previous = $derived(this.history[this.history.length - 2] ?? this.current);
  socialDraft = $derived(this.draft.social);
  householdImpact = $derived<HouseholdImpactBreakdown>(
    calculateHouseholdImpact(
      this.selectedHouseholdPersona,
      this.current,
      this.draft.budget,
      this.draft.social,
    ),
  );
  /** The raw choices the engine will receive. A bill sent to Congress, or with deals, is voted at Next turn (A8). */
  bill = $derived(
    this.draft.voteCalled || this.draft.sentToCongress || this.draft.deals.length
      ? {
          budget: $state.snapshot(this.draft.budget),
          deals: $state.snapshot(this.draft.deals),
          social: $state.snapshot(this.draft.social),
        }
      : null,
  );
  /** Preview and engine charge with the same function (FND-05). */
  preview = $derived(
    this.bill
      ? resolveBill(
          this.current.clout,
          this.bill,
          this.current.houseSeatDelta,
          this.current.senateSeatDelta ?? 0,
          this.current.filibusterRule ?? 'sixty_vote',
          this.current.approval,
          this.current.evil?.heat ?? 0,
        )
      : null,
  );
  crisisCost = $derived.by(() => {
    if (!this.draft.crisisChoice) return 0;
    const { crisisId, optionId } = this.draft.crisisChoice;
    const crisis = this.current.activeCrisis?.crisisId === crisisId
      ? this.current.activeCrisis
      : this.current.activeGeopoliticalCrises?.find((c) => c.crisisId === crisisId);
    return crisis?.options.find((o) => o.id === optionId)?.cloutCost ?? 0;
  });
  powerCost = $derived.by(() => {
    let cost = 0;
    for (const id of this.draft.signedOrders) {
      cost += getOrder(id)?.cloutCost ?? 0;
    }
    if (this.draft.fedPressure) cost += C.fedPressureCost;
    if (this.draft.speechAudience) cost += speechCost(this.current.speechCountInWindow);
    return cost;
  });
  reformCost = $derived.by(() => {
    let cost = 0;
    if (this.draft.filibusterRule && this.draft.filibusterRule !== (this.current.filibusterRule ?? 'sixty_vote')) {
      cost += FILIBUSTER_RULES_CATALOG[this.draft.filibusterRule].cloutCost;
    }
    if (this.draft.reform) {
      cost += REFORMS_CATALOG[this.draft.reform].cloutCost;
    }
    if (this.draft.amendmentProposal) {
      cost += C.amendmentProposalCloutCost;
    }
    if (this.draft.amendmentCampaign) {
      cost += C.amendmentCampaignCloutCost;
    }
    return cost;
  });
  foreignCost = $derived.by(() => {
    let cost = 0;
    if (this.draft.activeSanctions) {
      const currentSet = new Set(this.current.foreignPolicy?.activeSanctions ?? []);
      for (const s of this.draft.activeSanctions) {
        if (!currentSet.has(s)) cost += C.sanctionCloutCost;
      }
    }
    return cost;
  });
  tradeCost = $derived.by(() => {
    let cost = 0;
    if (this.draft.tradeAgreements) {
      const currentSet = new Set(this.current.trade?.agreements ?? []);
      for (const a of this.draft.tradeAgreements) {
        if (!currentSet.has(a)) {
          const def = TRADE_AGREEMENTS_CATALOG.find((p) => p.id === a);
          if (def) cost += def.cloutCost;
        }
      }
    }
    return cost;
  });
  effectiveForeignPolicy = $derived<ForeignPolicyState>({
    defensePosture: this.draft.defensePosture ?? this.current.foreignPolicy?.defensePosture ?? 'standard',
    foreignAssistance: this.draft.foreignAssistance ?? this.current.foreignPolicy?.foreignAssistance ?? 100,
    activeSanctions: this.draft.activeSanctions ?? this.current.foreignPolicy?.activeSanctions ?? [],
  });
  effectiveTrade = $derived<TradeState>({
    sectorTariffs: this.draft.sectorTariffs ?? this.current.trade?.sectorTariffs ?? [],
    agreements: this.draft.tradeAgreements ?? this.current.trade?.agreements ?? [],
  });
  tradeBalance = $derived<TradeBalanceSummary>(
    calculateTradeBalance(
      this.draft.budget.tar ?? this.current.policy.tar ?? 11,
      this.effectiveTrade,
      this.current.econ.gdp,
    ),
  );
  evilLeversCost = $derived.by(() => {
    let cost = 0;
    for (const id of this.draft.stagedEvilLevers) {
      const lever = getEvilLever(id);
      if (lever) cost += lever.cloutCost;
    }
    return cost;
  });
  evilLeversResolution = $derived.by(() => {
    return resolveEvilLevers(this.draft.stagedEvilLevers, this.current.clout);
  });
  stagedEvilLeversCount = $derived(this.draft.stagedEvilLevers.length);
  stagedEvilLeversKickbackBn = $derived(this.evilLeversResolution.stashDeltaBn);
  stagedEvilLeversHeatDelta = $derived(this.evilLeversResolution.heatDelta);
  mythReward = $derived(
    this.draft.viewMyth && !this.current.viewedMyths.includes(this.draft.viewMyth)
      ? this.draft.viewMyth.startsWith('explainer:')
        ? C.explainerRewardClout
        : C.mythRewardClout
      : 0,
  );
  dynamicCrisisCost = $derived(this.draft.dynamicCrisisDelta?.cloutCost ?? 0);
  clout = $derived(
    this.current.clout + (this.preview?.cloutDelta ?? 0) - this.crisisCost - this.powerCost - this.reformCost - this.foreignCost - this.tradeCost - this.evilLeversCost - this.dynamicCrisisCost + this.mythReward,
  );
  powers = $derived<PowerDecisions | null>(
    this.draft.signedOrders.length > 0 ||
    this.draft.revokedOrders.length > 0 ||
    this.draft.fedPressure ||
    this.draft.speechAudience !== null ||
    this.draft.viewMyth !== null ||
    this.draft.spinMyth !== null
      ? {
          ...(this.draft.signedOrders.length > 0 ? { signOrders: $state.snapshot(this.draft.signedOrders) } : {}),
          ...(this.draft.revokedOrders.length > 0 ? { revokeOrders: $state.snapshot(this.draft.revokedOrders) } : {}),
          ...(this.draft.fedPressure ? { pressureFed: true } : {}),
          ...(this.draft.speechAudience ? { speech: { audience: this.draft.speechAudience } } : {}),
          ...(this.draft.viewMyth ? { viewMyth: this.draft.viewMyth } : {}),
          ...(this.draft.spinMyth ? { spinMyth: this.draft.spinMyth } : {}),
        }
      : null,
  );
  whip = $derived(this.preview?.whip ?? tally(this.draft.deals, this.current.houseSeatDelta, this.draft.social));
  cheapestCoalition = $derived(
    findCheapestCoalition(
      this.draft.deals,
      this.current.houseSeatDelta,
      this.draft.social,
      calculateHeatPenalties(this.current.evil?.heat ?? 0).congressFrictionVotes,
    ),
  );
  vote = $derived(
    this.draft.voteCalled && this.preview
      ? { total: this.preview.whip.total, passed: this.preview.passed, cloutBack: this.preview.cloutBack }
      : null,
  );
  index = $derived(prosperity(this.current).index);
  /** Unified projected score vs autopilot (D11, GR-04). */
  score = $derived(scoreVsAutopilot(this.current, this.autopilot[this.autopilot.length - 1]!));
  /** Headline: how much better than doing nothing (same seed, same shocks). */
  vsNothing = $derived(this.score.total);
  /** The term has ended: every action is a no-op and the UI shows the term as over. */
  over = $derived(this.current.turn >= TOTAL_TURNS || this.termEnded);
  canAutoWhip = $derived(
    !this.over &&
    !this.draft.voteCalled &&
    this.cheapestCoalition.dealsToAdd.length > 0 &&
    cloutCost(this.cheapestCoalition.totalDeals) <= this.current.clout,
  );
  stagedActionsSummary = $derived.by<readonly StagedActionItem[]>(() => {
    const items: StagedActionItem[] = [];
    const budgetModified = Object.entries(this.draft.budget).some(
      ([k, v]) => v !== (this.current.policy[k] ?? v),
    );
    const baseSocial = this.current.socialPolicy ?? socialBaseline();
    const socialModified = Object.entries(this.draft.social).some(
      ([k, v]) => v !== (baseSocial[k as keyof SocialDraft] ?? v),
    );
    const hasBillQueued =
      this.draft.voteCalled || this.draft.sentToCongress || this.draft.deals.length > 0;

    if ((budgetModified || socialModified || this.draft.pack !== null) && !hasBillQueued) {
      items.push({
        id: 'budget-unsent',
        label: 'Budget draft (unsent)',
        screen: 'budget',
        warning: true,
      });
    } else if (hasBillQueued) {
      const dealSuffix =
        this.draft.deals.length > 0
          ? ` (${this.draft.deals.length} deal${this.draft.deals.length === 1 ? '' : 's'})`
          : '';
      items.push({
        id: 'bill-queued',
        label: this.draft.voteCalled ? `Bill vote called${dealSuffix}` : `Bill sent to Congress${dealSuffix}`,
        screen: 'congress',
      });
    }

    if (this.draft.crisisChoice) {
      items.push({
        id: 'crisis-choice',
        label: 'Crisis response ready',
        screen: 'oval',
      });
    }

    if (this.draft.dynamicCrisisDelta) {
      items.push({
        id: 'dynamic-crisis',
        label: 'AI Crisis action staged',
        screen: 'oval',
      });
    }

    if (this.draft.signedOrders.length > 0 || this.draft.revokedOrders.length > 0) {
      const count = this.draft.signedOrders.length + this.draft.revokedOrders.length;
      items.push({
        id: 'orders',
        label: `${count} Executive Order${count === 1 ? '' : 's'}`,
        screen: 'powers',
      });
    }

    if (this.draft.speechAudience) {
      items.push({
        id: 'speech',
        label: `Speech (${this.draft.speechAudience})`,
        screen: 'powers',
      });
    }

    if (this.draft.fedPressure) {
      items.push({
        id: 'fed',
        label: 'Pressure the Fed',
        screen: 'economy',
      });
    }

    if (this.draft.spinMyth) {
      items.push({
        id: 'spin_myth',
        label: `Spin ${this.draft.spinMyth}`,
        screen: 'powers',
      });
    }

    if (this.draft.reform) {
      items.push({
        id: 'reform',
        label: 'Institutional reform',
        screen: 'powers',
      });
    }

    if (this.draft.filibusterRule) {
      items.push({
        id: 'filibuster',
        label: 'Senate cloture change',
        screen: 'congress',
      });
    }

    if (this.draft.amendmentProposal || this.draft.amendmentCampaign) {
      items.push({
        id: 'amendment',
        label: 'Article V amendment',
        screen: 'congress',
      });
    }

    if (
      this.draft.defensePosture !== null ||
      this.draft.foreignAssistance !== null ||
      this.draft.activeSanctions !== null
    ) {
      items.push({
        id: 'foreign',
        label: 'Foreign policy shift',
        screen: 'powers',
      });
    }

    if (this.draft.sectorTariffs !== null || this.draft.tradeAgreements !== null) {
      items.push({
        id: 'trade',
        label: 'Trade & tariff action',
        screen: 'trade',
      });
    }

    if (this.draft.stagedEvilLevers.length > 0) {
      const n = this.draft.stagedEvilLevers.length;
      items.push({
        id: 'evil',
        label: `${n} Corrupt lever${n === 1 ? '' : 's'}`,
        screen: 'powers',
      });
    }

    return items;
  });
  hasUnresolvedCrisis = $derived(
    (Boolean(this.current.activeCrisis) ||
      Boolean(this.current.activeGeopoliticalCrises && this.current.activeGeopoliticalCrises.length > 0)) &&
      !this.draft.crisisChoice,
  );
  canFastForward = $derived(!this.over && !this.hasUnresolvedCrisis);
  /** Evil Mode helpers (Phase 17, EVIL-01, EVIL-02) */
  isEvilMode = $derived(Boolean(this.options.evilMode));
  presidentLook = $derived<0 | 1 | 2 | 3>(
    this.options.presidentLook === 1 || this.options.presidentLook === 2 || this.options.presidentLook === 3
      ? this.options.presidentLook
      : 0,
  );
  activeScenario = $derived<ScenarioDef>(getScenario(this.options.scenario));
  offshoreStashBn = $derived(this.current.evil?.offshoreStashBn ?? 0);
  heat = $derived(this.current.evil?.heat ?? 0);
  evilState = $derived(this.current.evil);

  toggleEvilLever(id: EvilLeverId): void {
    const current = this.draft.stagedEvilLevers;
    if (current.includes(id)) {
      this.draft.stagedEvilLevers = current.filter((l) => l !== id);
    } else {
      this.draft.stagedEvilLevers = [...current, id];
    }
  }

  isEvilLeverStaged(id: EvilLeverId): boolean {
    return this.draft.stagedEvilLevers.includes(id);
  }

  constructor(seed: number, start: Start, options: GameOptions, initOpts?: { skipAutosave?: boolean }) {
    if (options.vocabMode === 'plain' || options.vocabMode === 'wonk') {
      this.vocabMode = options.vocabMode;
      if (!initOpts?.skipAutosave && typeof localStorage !== 'undefined' && typeof localStorage?.setItem === 'function') {
        localStorage.setItem('govsim_vocab_mode', this.vocabMode);
      }
    }
    this.options = { ...options, vocabMode: this.vocabMode };
    this.unlockAll = Boolean(options.unlockAll);
    const effectiveStart = applyScenarioStart(start, options.scenario);
    const initial = newGame(seed, effectiveStart);
    this.history = [initial];
    this.autopilot = [newGame(seed, effectiveStart)];
    this.draft = freshDraft(initial.policy, initial.socialPolicy);
    this.inputs = [];
    this.unlockedBadges = evaluateBadges(this.current, this.history);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.calm = this.calmMode ? 'true' : 'false';
      document.documentElement.dataset.vocab = this.vocabMode;
    }
    if (!initOpts?.skipAutosave) {
      storeAutosave(this);
    }
    if (loadAiConfig().provider !== 'off') {
      this.refreshAiDirector();
    }
  }

  static fromSave(save: SaveFile): Session {
    const s = new Session(save.seed, save.start, save.options, { skipAutosave: true });
    for (const input of save.inputs) {
      if (s.current.turn === 16) {
        s.turn16Snapshot = s.current;
        const party = (s.options.party === 'R' ? 'R' : 'D') as 'D' | 'R';
        const outcome = resolveReelection(s.current, party);
        const autoOutcome = resolveReelection(s.autopilot[s.autopilot.length - 1]!, party);
        const reasons = extractElectionReasons(s.current, outcome, party);
        s.activeElectionOutcome = outcome;
        s.activeAutopilotElectionOutcome = autoOutcome;
        s.electionReasons = reasons;
        s.reelectionWon = outcome.winner === 'player';
      }
      const next = endTurn(s.current, input);
      s.history = [...s.history, next];
      const autoLast = s.autopilot[s.autopilot.length - 1]!;
      const autoDecisions = {
        ...autopilotDecisions(autoLast),
        ...(input.turnEntropy !== undefined ? { turnEntropy: input.turnEntropy } : {}),
      };
      s.autopilot = [...s.autopilot, endTurn(autoLast, autoDecisions)];
      s.inputs = [...s.inputs, input];
      s.draft = freshDraft(next.policy, next.socialPolicy);
      const meta = {
        reelectionEV: s.activeElectionOutcome?.playerEV,
        score: s.score.total,
      };
      for (const id of evaluateBadges(next, s.history, meta)) {
        if (!s.unlockedBadges.includes(id)) {
          s.unlockedBadges.push(id);
        }
      }
      if (
        next.turn >= TOTAL_TURNS ||
        Boolean(next.evil?.convicted) ||
        (s.activeElectionOutcome !== null && !s.reelectionWon)
      ) {
        s.termEnded = true;
      }
    }
    storeAutosave(s);
    return s;
  }

  static fromRun(
    run: {
      seed: number;
      party: 'D' | 'R';
      scenario?: ScenarioId;
      evilMode?: boolean;
      unlockAll?: boolean;
      livingWorld?: boolean;
      inputs: readonly Decisions[];
    },
    start: Start,
  ): Session {
    const s = new Session(
      run.seed,
      start,
      {
        party: run.party,
        scenario: run.scenario,
        ...(run.evilMode ? { evilMode: true } : {}),
        ...(run.unlockAll ? { unlockAll: true } : {}),
        ...(run.livingWorld ? { livingWorld: true } : {}),
      },
      { skipAutosave: true },
    );
    for (const input of run.inputs) {
      if (s.current.turn === 16) {
        s.turn16Snapshot = s.current;
        const party = (s.options.party === 'R' ? 'R' : 'D') as 'D' | 'R';
        const outcome = resolveReelection(s.current, party);
        const autoOutcome = resolveReelection(s.autopilot[s.autopilot.length - 1]!, party);
        const reasons = extractElectionReasons(s.current, outcome, party);
        s.activeElectionOutcome = outcome;
        s.activeAutopilotElectionOutcome = autoOutcome;
        s.electionReasons = reasons;
        s.reelectionWon = outcome.winner === 'player';
      }
      const next = endTurn(s.current, input);
      s.history = [...s.history, next];
      const autoLast = s.autopilot[s.autopilot.length - 1]!;
      const autoDecisions = {
        ...autopilotDecisions(autoLast),
        ...(input.turnEntropy !== undefined ? { turnEntropy: input.turnEntropy } : {}),
      };
      s.autopilot = [...s.autopilot, endTurn(autoLast, autoDecisions)];
      s.inputs = [...s.inputs, input];
      s.draft = freshDraft(next.policy, next.socialPolicy);
      const meta = {
        reelectionEV: s.activeElectionOutcome?.playerEV,
        score: s.score.total,
      };
      for (const id of evaluateBadges(next, s.history, meta)) {
        if (!s.unlockedBadges.includes(id)) {
          s.unlockedBadges.push(id);
        }
      }
      if (
        next.turn >= TOTAL_TURNS ||
        Boolean(next.evil?.convicted) ||
        (s.activeElectionOutcome !== null && !s.reelectionWon)
      ) {
        s.termEnded = true;
      }
    }
    return s;
  }

  /** A package changes only its own levers; "Keep as is" keeps the policy in force. */
  pickPackage(p: PackageName) {
    if (this.over) return;
    this.draft.budget = { ...this.current.policy, ...packages[p] };
    this.draft.pack = p;
    this.draft.sentToCongress = false;
  }

  setLever(id: string, value: number) {
    if (this.over) return;
    this.draft.budget[id] = value;
    this.draft.pack = null;
    this.draft.sentToCongress = false;
  }

  setSocialLever(id: string, value: number) {
    if (this.over) return;
    this.draft.social[id] = value;
    this.draft.sentToCongress = false;
  }

  resetSocialDraft() {
    if (this.over) return;
    this.draft.social = { ...(this.current.socialPolicy ?? socialBaseline()) };
    this.draft.sentToCongress = false;
  }

  enactSocial() {
    if (this.over) return;
    this.draft.sentToCongress = true;
    this.draft.voteCalled = true;
  }

  /** Affordability uses the engine's cost function against the clout you started the turn with. */
  canDeal(id: DealId) {
    return !this.over && !this.draft.voteCalled && !this.draft.deals.includes(id) && cloutCost([...this.draft.deals, id]) <= this.current.clout;
  }

  makeDeal(id: DealId) {
    if (this.canDeal(id)) this.draft.deals.push(id);
  }

  autoWhipCoalition() {
    if (!this.canAutoWhip) return;
    for (const id of this.cheapestCoalition.dealsToAdd) {
      if (!this.draft.deals.includes(id)) {
        this.draft.deals.push(id);
      }
    }
  }

  applyAdvisorPlay(play: AdvisorPlay) {
    if (this.over) return;
    if (play.pack) {
      this.pickPackage(play.pack);
    }
    if (play.sendToCongress || play.autoWhip) {
      this.sendToCongress();
    }
    if (play.autoWhip) {
      this.autoWhipCoalition();
    }
  }

  sendToCongress() {
    if (!this.over) this.draft.sentToCongress = true;
  }

  callVote() {
    if (!this.over) this.draft.voteCalled = true;
  }

  selectCrisisOption(crisisId: string, optionId: string) {
    if (this.over) return;
    const crisis = this.current.activeCrisis?.crisisId === crisisId
      ? this.current.activeCrisis
      : this.current.activeGeopoliticalCrises?.find((c) => c.crisisId === crisisId);
    if (!crisis) return;
    const opt = crisis.options.find((o) => o.id === optionId);
    if (!opt) return;
    if (opt.cloutCost > this.current.clout) return;
    this.draft.crisisChoice = { crisisId, optionId };
  }

  toggleSignOrder(orderId: string) {
    if (this.over) return;
    if (this.current.activeOrders.includes(orderId)) {
      if (this.draft.revokedOrders.includes(orderId)) {
        this.draft.revokedOrders = this.draft.revokedOrders.filter((id) => id !== orderId);
      } else {
        this.draft.revokedOrders = [...this.draft.revokedOrders, orderId];
      }
    } else {
      if (this.draft.signedOrders.includes(orderId)) {
        this.draft.signedOrders = this.draft.signedOrders.filter((id) => id !== orderId);
      } else {
        this.draft.signedOrders = [...this.draft.signedOrders, orderId];
      }
    }
  }

  setFedPressure(val: boolean) {
    if (this.over) return;
    this.draft.fedPressure = val;
  }

  setSpeech(audience: 'general' | 'congress' | 'business' | null) {
    if (this.over) return;
    this.draft.speechAudience = audience;
  }

  viewMythCard(id: string) {
    if (this.over) return;
    if (!this.current.viewedMyths.includes(id)) {
      this.draft.viewMyth = id;
      if (this.draft.spinMyth === id) {
        this.draft.spinMyth = null;
      }
    }
  }

  spinMythCard(id: string) {
    if (this.over) return;
    if (!this.current.viewedMyths.includes(id)) {
      this.draft.spinMyth = id;
      if (this.draft.viewMyth === id) {
        this.draft.viewMyth = null;
      }
    }
  }

  hasSpunMyth(id: string): boolean {
    return (this.current.spunMyths ?? []).includes(id) || this.draft.spinMyth === id;
  }

  viewExplainer(id: string) {
    this.viewMythCard(`explainer:${id}`);
  }

  hasViewedExplainer(id: string): boolean {
    const key = `explainer:${id}`;
    return this.current.viewedMyths.includes(key) || this.draft.viewMyth === key;
  }

  toggleCalmMode(): void {
    this.calmMode = !this.calmMode;
    if (typeof localStorage !== 'undefined' && typeof localStorage?.setItem === 'function') {
      localStorage.setItem('govsim_calm_mode', this.calmMode ? 'true' : 'false');
    }
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.calm = this.calmMode ? 'true' : 'false';
    }
  }

  toggleVocabMode(): void {
    this.setVocabMode(this.vocabMode === 'plain' ? 'wonk' : 'plain');
  }

  setVocabMode(mode: VocabMode): void {
    this.vocabMode = mode;
    this.options = { ...this.options, vocabMode: mode };
    if (typeof localStorage !== 'undefined' && typeof localStorage?.setItem === 'function') {
      localStorage.setItem('govsim_vocab_mode', mode);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.vocab = mode;
    }
    storeAutosave(this);
  }

  unlockAllScreens(): void {
    this.unlockAll = true;
    this.options = { ...this.options, unlockAll: true };
    storeAutosave(this);
  }

  setFilibusterRule(rule: FilibusterRule) {
    if (this.over) return;
    this.draft.filibusterRule = rule;
  }

  enactReform(reformId: ReformId) {
    if (this.over) return;
    this.draft.reform = reformId;
  }

  proposeAmendment(amendmentId: AmendmentId) {
    if (this.over) return;
    this.draft.amendmentProposal = amendmentId;
  }

  toggleAmendmentCampaign() {
    if (this.over) return;
    this.draft.amendmentCampaign = !this.draft.amendmentCampaign;
  }

  setDefensePosture(posture: DefensePosture) {
    if (this.over) return;
    this.draft.defensePosture = posture;
  }

  setForeignAssistance(level: number) {
    if (this.over) return;
    this.draft.foreignAssistance = level;
  }

  toggleSanction(sanction: SanctionType) {
    if (this.over) return;
    const currentList = this.draft.activeSanctions ?? [...(this.current.foreignPolicy?.activeSanctions ?? [])];
    if (currentList.includes(sanction)) {
      this.draft.activeSanctions = currentList.filter((s) => s !== sanction);
    } else {
      this.draft.activeSanctions = [...currentList, sanction];
    }
  }

  toggleSectorTariff(id: SectorTariffId) {
    if (this.over) return;
    const currentList = this.draft.sectorTariffs ?? [...(this.current.trade?.sectorTariffs ?? [])];
    if (currentList.includes(id)) {
      this.draft.sectorTariffs = currentList.filter((s) => s !== id);
    } else {
      this.draft.sectorTariffs = [...currentList, id];
    }
  }

  toggleTradeAgreement(id: TradeAgreementId) {
    if (this.over) return;
    const currentList = this.draft.tradeAgreements ?? [...(this.current.trade?.agreements ?? [])];
    if (currentList.includes(id)) {
      this.draft.tradeAgreements = currentList.filter((a) => a !== id);
    } else {
      const def = TRADE_AGREEMENTS_CATALOG.find((p) => p.id === id);
      const cost = def ? def.cloutCost : 0;
      if (this.clout >= cost) {
        this.draft.tradeAgreements = [...currentList, id];
      }
    }
  }

  setTurnEntropy(entropy: number | null) {
    if (this.over) return;
    this.draft.turnEntropy = entropy;
  }

  setDynamicCrisisDelta(delta: DynamicCrisisDelta | null) {
    if (this.over) return;
    this.draft.dynamicCrisisDelta = delta;
  }

  stageDynamicCrisisOption(delta: DynamicCrisisDelta) {
    if (this.over) return;
    this.draft.dynamicCrisisDelta = delta;
  }

  updateAiConfig(config: AiConfig) {
    saveAiConfig(config);
    this.aiConfig = config;
    this.refreshAiDirector();
  }

  async refreshAiDirector(): Promise<void> {
    const seq = ++this.aiRequestSeq;
    if (this.aiConfig.provider === 'off') {
      this.aiTurnPayload = null;
      this.aiLoading = false;
      return;
    }
    const expectedTurn = this.current.turn;
    this.aiLoading = true;
    try {
      const payload = await requestAiTurnDirector(this);
      if (this.aiRequestSeq === seq && this.current.turn === expectedTurn) {
        this.aiTurnPayload = payload;
      }
    } catch {
      if (this.aiRequestSeq === seq && this.current.turn === expectedTurn) {
        this.aiTurnPayload = null;
      }
    } finally {
      if (this.aiRequestSeq === seq) {
        this.aiLoading = false;
      }
    }
  }

  nextTurn() {
    if (this.termEnded || this.over) return;

    const decisions: Decisions = {};
    if (this.bill) decisions.bill = this.bill;
    if (this.draft.crisisChoice) {
      const choice = $state.snapshot(this.draft.crisisChoice);
      if (this.current.activeGeopoliticalCrises?.some((c) => c.crisisId === choice.crisisId)) {
        decisions.geopoliticalCrisis = choice;
      } else {
        decisions.crisis = choice;
      }
    }
    if (this.powers) {
      decisions.powers = $state.snapshot(this.powers);
    }
    if (this.draft.filibusterRule) {
      decisions.filibusterRule = this.draft.filibusterRule;
    }
    if (this.draft.reform) {
      decisions.reform = this.draft.reform;
    }
    if (this.draft.amendmentProposal) {
      decisions.amendmentProposal = this.draft.amendmentProposal;
    }
    if (this.draft.amendmentCampaign) {
      decisions.amendmentCampaign = true;
    }
    const foreignPolicy: ForeignPolicyDraft | undefined =
      this.draft.defensePosture !== null ||
      this.draft.foreignAssistance !== null ||
      this.draft.activeSanctions !== null
        ? {
            ...(this.draft.defensePosture !== null ? { defensePosture: this.draft.defensePosture } : {}),
            ...(this.draft.foreignAssistance !== null ? { foreignAssistance: this.draft.foreignAssistance } : {}),
            ...(this.draft.activeSanctions !== null ? { activeSanctions: $state.snapshot(this.draft.activeSanctions) } : {}),
          }
        : undefined;
    if (foreignPolicy) {
      decisions.foreignPolicy = foreignPolicy;
    }
    const tradeDraft: TradeDraft | undefined =
      this.draft.sectorTariffs !== null || this.draft.tradeAgreements !== null
        ? {
            ...(this.draft.sectorTariffs !== null ? { sectorTariffs: $state.snapshot(this.draft.sectorTariffs) } : {}),
            ...(this.draft.tradeAgreements !== null ? { agreements: $state.snapshot(this.draft.tradeAgreements) } : {}),
          }
        : undefined;
    if (tradeDraft) {
      decisions.trade = tradeDraft;
    }
    if (this.draft.stagedEvilLevers.length > 0) {
      decisions.evil = {
        enactedLevers: $state.snapshot(this.draft.stagedEvilLevers),
      };
    }
    if (this.draft.dynamicCrisisDelta) {
      decisions.dynamicCrisisDelta = $state.snapshot(this.draft.dynamicCrisisDelta);
    }
    if (this.draft.turnEntropy != null) {
      decisions.turnEntropy = this.draft.turnEntropy;
    } else if (this.options.livingWorld) {
      let entropy: number;
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        entropy = (crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) & 0x7fffffff;
      } else {
        entropy = Math.floor(Math.random() * 0x80000000) & 0x7fffffff;
      }
      decisions.turnEntropy = entropy;
    }
    decisions.presidentialSide = (this.options.party === 'R' ? 'R' : 'D') as 'D' | 'R';

    if (this.current.turn === 16) {
      if (!this.turn16Snapshot) {
        this.turn16Snapshot = this.current;
      }
      const party = (this.options.party === 'R' ? 'R' : 'D') as 'D' | 'R';
      const outcome = resolveReelection(this.current, party);
      const autoOutcome = resolveReelection(this.autopilot[this.autopilot.length - 1]!, party);
      const reasons = extractElectionReasons(this.current, outcome, party);

      this.activeElectionOutcome = outcome;
      this.activeAutopilotElectionOutcome = autoOutcome;
      this.electionReasons = reasons;
      this.reelectionWon = outcome.winner === 'player';
      this.showingElectionNight = true;
    }

    const next = endTurn(this.current, decisions);
    if (next === this.current) return;
    this.inputs = [...this.inputs, decisions];
    this.history = [...this.history, next];
    const autoLast = this.autopilot[this.autopilot.length - 1]!;
    const autoDecisions = {
      ...autopilotDecisions(autoLast),
      ...(decisions.turnEntropy !== undefined ? { turnEntropy: decisions.turnEntropy } : {}),
    };
    this.autopilot = [...this.autopilot, endTurn(autoLast, autoDecisions)];
    this.draft = freshDraft(next.policy, next.socialPolicy);

    if (next.turn === 16 && !this.turn16Snapshot) {
      this.turn16Snapshot = next;
    }

    const hasImpeachmentEvent = next.report.log.some(
      (l) => l.id === 'articles_of_impeachment' || l.id === 'convicted' || l.id === 'impeachment_acquitted'
    );
    if (hasImpeachmentEvent) {
      this.showingImpeachmentModal = true;
    }

    if (next.turn >= TOTAL_TURNS || Boolean(next.evil?.convicted)) {
      this.termEnded = true;
    }

    const meta = {
      reelectionEV: this.activeElectionOutcome?.playerEV,
      score: this.score.total,
    };
    const newlyEvaluated = evaluateBadges(next, this.history, meta);
    const existing = new Set(this.unlockedBadges);
    const brandNew: string[] = [];
    for (const id of newlyEvaluated) {
      if (!existing.has(id)) {
        existing.add(id);
        brandNew.push(id);
      }
    }
    this.newlyUnlockedBadges = brandNew;
    this.unlockedBadges = Array.from(existing);

    if (this.showingElectionNight || this.showingImpeachmentModal) {
      this.showingReport = false;
    } else {
      this.showingReport = true;
    }
    storeAutosave(this);
    this.refreshAiDirector();
  }

  /**
   * Advances quiet quarters until an active crisis, critical congressional deadline (<= 1 turn left),
   * midterm/reelection turn, impeachment event, or term end arrives (PACE-02).
   * Returns the number of turns advanced.
   */
  fastForwardToNextEvent(): number {
    if (!this.canFastForward) return 0;
    const maxSteps = 8;
    let steps = 0;

    while (steps < maxSteps && !this.over && !this.showingElectionNight && !this.showingImpeachmentModal) {
      const prevTurn = this.current.turn;
      this.nextTurn();
      if (this.current.turn === prevTurn) break;
      steps += 1;

      const hasCrisis =
        Boolean(this.current.activeCrisis) ||
        Boolean(this.current.activeGeopoliticalCrises && this.current.activeGeopoliticalCrises.length > 0);
      const hasCriticalDeadline = getImminentDeadlines(this.current.turn, this.current).some(
        (d) => d.turnsRemaining <= 1,
      );
      const isLandmarkTurn =
        this.current.turn === 8 ||
        this.current.turn === 9 ||
        this.current.turn === 16 ||
        this.current.turn === 17 ||
        this.current.turn === 24 ||
        this.current.turn === 25;

      if (
        hasCrisis ||
        hasCriticalDeadline ||
        isLandmarkTurn ||
        this.showingElectionNight ||
        this.showingImpeachmentModal ||
        this.over
      ) {
        if (hasCrisis && !this.showingElectionNight && !this.showingImpeachmentModal) {
          this.showingReport = false;
        }
        break;
      }

      this.showingReport = false;
    }

    return steps;
  }

  dismissImpeachmentModal() {
    this.showingImpeachmentModal = false;
  }

  continueAfterElection() {
    this.showingElectionNight = false;
    if (!this.reelectionWon) {
      this.termEnded = true;
      this.showingReport = false;
      if (this.history.length > 16) {
        this.history = this.history.slice(0, 16);
        this.inputs = this.inputs.slice(0, 15);
      }
      storeAutosave(this);
    } else {
      this.showingReport = true;
    }
  }

  retryTurn16() {
    if (!this.turn16Snapshot) return;
    const targetTurn = 16;
    const idx = this.history.findIndex((s) => s.turn === targetTurn);
    if (idx >= 0) {
      this.history = this.history.slice(0, idx + 1);
      this.inputs = this.inputs.slice(0, idx);
      this.autopilot = this.autopilot.slice(0, idx + 1);
    } else {
      this.history = [...this.history.slice(0, 15), this.turn16Snapshot];
      this.inputs = this.inputs.slice(0, 15);
      this.autopilot = this.autopilot.slice(0, 16);
    }
    this.draft = freshDraft(this.current.policy, this.current.socialPolicy);
    this.screen = 'oval';
    this.termEnded = false;
    this.showingElectionNight = false;
    this.showingReport = false;
    this.reelectionWon = false;
    this.activeElectionOutcome = null;
    this.activeAutopilotElectionOutcome = null;
    const cumulative = new Set<string>();
    for (const state of this.history) {
      for (const b of evaluateBadges(state, this.history.slice(0, state.turn))) {
        cumulative.add(b);
      }
    }
    this.unlockedBadges = Array.from(cumulative);
    this.newlyUnlockedBadges = [];
    storeAutosave(this);
  }

  openReport() {
    if (this.current.turn > 1) this.showingReport = true;
  }

  closeReport() {
    this.showingReport = false;
  }

  resetDraft() {
    this.draft = freshDraft(this.current.policy, this.current.socialPolicy);
  }

  setHouseholdPersona(persona: HouseholdPersona): void {
    this.selectedHouseholdPersona = persona;
  }
}
