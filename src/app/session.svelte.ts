import { fromPackage, packages, type BudgetDraft, type PackageName } from '../engine/budget';
import { tally, type DealId } from '../engine/congress';
import { autopilotDecisions, cloutCost, resolveBill, type CrisisDecision, type Decisions } from '../engine/decisions';
import { endTurn, newGame, prosperity, scoreVsAutopilot, TOTAL_TURNS, type GameState, type ScoreBreakdown, type Start } from '../engine/game';
import { socialBaseline, type SocialDraft } from '../engine/social';
import type { PartyId } from '../content/parties';
import { getOrder } from '../content/orders';
import { C } from '../engine/coefficients';
import { speechCost, type PowerDecisions } from '../engine/powers';
import { extractElectionReasons, resolveReelection, type ElectionOutcome } from '../engine/election';
import { evaluateBadges } from '../engine/badges';
import { ELECTION_TURN_1 } from '../engine/units';
import { storeAutosave, type SaveFile } from './save';
import type { ScreenId } from './screens';

import { FILIBUSTER_RULES_CATALOG, type FilibusterRule } from '../engine/congress';
import { REFORMS_CATALOG, type ReformId } from '../engine/reforms';
import { AMENDMENTS_CATALOG, type AmendmentId } from '../engine/amendments';
import {
  calculateHouseholdImpact,
  DEFAULT_HOUSEHOLD_PERSONA,
  type HouseholdImpactBreakdown,
  type HouseholdPersona,
} from '../engine/household';

/** Choices made at New Game. Kept beside the engine state, never inside it (D4). */
export interface GameOptions {
  party: PartyId;
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
  filibusterRule: FilibusterRule | null;
  reform: ReformId | null;
  amendmentProposal: AmendmentId | null;
  amendmentCampaign: boolean;
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
  filibusterRule: null,
  reform: null,
  amendmentProposal: null,
  amendmentCampaign: false,
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
  termEnded = $state<boolean>(false);
  unlockedBadges = $state<string[]>([]);
  newlyUnlockedBadges = $state<string[]>([]);
  selectedHouseholdPersona = $state<HouseholdPersona>(DEFAULT_HOUSEHOLD_PERSONA);

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
  mythReward = $derived(
    this.draft.viewMyth && !this.current.viewedMyths.includes(this.draft.viewMyth)
      ? C.mythRewardClout
      : 0,
  );
  clout = $derived(
    this.current.clout + (this.preview?.cloutDelta ?? 0) - this.crisisCost - this.powerCost - this.reformCost + this.mythReward,
  );
  powers = $derived<PowerDecisions | null>(
    this.draft.signedOrders.length > 0 ||
    this.draft.revokedOrders.length > 0 ||
    this.draft.fedPressure ||
    this.draft.speechAudience !== null ||
    this.draft.viewMyth !== null
      ? {
          ...(this.draft.signedOrders.length > 0 ? { signOrders: $state.snapshot(this.draft.signedOrders) } : {}),
          ...(this.draft.revokedOrders.length > 0 ? { revokeOrders: $state.snapshot(this.draft.revokedOrders) } : {}),
          ...(this.draft.fedPressure ? { pressureFed: true } : {}),
          ...(this.draft.speechAudience ? { speech: { audience: this.draft.speechAudience } } : {}),
          ...(this.draft.viewMyth ? { viewMyth: this.draft.viewMyth } : {}),
        }
      : null,
  );
  whip = $derived(this.preview?.whip ?? tally([]));
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

  constructor(seed: number, start: Start, readonly options: GameOptions) {
    this.history = [newGame(seed, start)];
    this.autopilot = [newGame(seed, start)];
    this.inputs = [];
    this.unlockedBadges = evaluateBadges(this.current, this.history);
    storeAutosave(this);
  }

  static fromSave(save: SaveFile): Session {
    const s = new Session(save.seed, save.start, save.options);
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
      s.autopilot = [...s.autopilot, endTurn(autoLast, autopilotDecisions(autoLast))];
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
      if (next.turn >= TOTAL_TURNS) {
        s.termEnded = true;
      }
    }
    storeAutosave(s);
    return s;
  }

  static fromRun(run: { seed: number; party: 'D' | 'R'; inputs: readonly Decisions[] }, start: Start): Session {
    const s = new Session(run.seed, start, { party: run.party });
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
      s.autopilot = [...s.autopilot, endTurn(autoLast, autopilotDecisions(autoLast))];
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
      if (next.turn >= TOTAL_TURNS) {
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
    }
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
    this.autopilot = [...this.autopilot, endTurn(autoLast, autopilotDecisions(autoLast))];
    this.draft = freshDraft(next.policy, next.socialPolicy);

    if (next.turn === 16 && !this.turn16Snapshot) {
      this.turn16Snapshot = next;
    }

    if (next.turn >= TOTAL_TURNS) {
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

    if (this.showingElectionNight) {
      this.showingReport = false;
    } else {
      this.showingReport = true;
    }
    storeAutosave(this);
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
