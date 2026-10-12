import { fromPackage, packages, type BudgetDraft, type PackageName } from '../engine/budget';
import { tally, type DealId } from '../engine/congress';
import { autopilotDecisions, cloutCost, resolveBill, type CrisisDecision, type Decisions } from '../engine/decisions';
import { endTurn, newGame, prosperity, scoreVsAutopilot, TOTAL_TURNS, type GameState, type ScoreBreakdown, type Start } from '../engine/game';
import type { PartyId } from '../content/parties';
import { getOrder } from '../content/orders';
import { C } from '../engine/coefficients';
import { speechCost, type PowerDecisions } from '../engine/powers';
import { storeAutosave, type SaveFile } from './save';
import type { ScreenId } from './screens';

/** Choices made at New Game. Kept beside the engine state, never inside it (D4). */
export interface GameOptions {
  party: PartyId;
}

interface Draft {
  budget: BudgetDraft;
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
}

/** A new turn's draft starts from the policy already in force. */
const freshDraft = (policy: BudgetDraft): Draft => ({
  budget: { ...policy },
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
  draft = $state<Draft>(freshDraft(fromPackage('Keep as is')));
  showingReport = $state<boolean>(false);

  current = $derived(this.history[this.history.length - 1]!);
  previous = $derived(this.history[this.history.length - 2] ?? this.current);
  /** The raw choices the engine will receive. A bill sent to Congress, or with deals, is voted at Next turn (A8). */
  bill = $derived(
    this.draft.voteCalled || this.draft.sentToCongress || this.draft.deals.length
      ? { budget: $state.snapshot(this.draft.budget), deals: $state.snapshot(this.draft.deals) }
      : null,
  );
  /** Preview and engine charge with the same function (FND-05). */
  preview = $derived(this.bill ? resolveBill(this.current.clout, this.bill) : null);
  crisisCost = $derived(
    this.draft.crisisChoice && this.current.activeCrisis
      ? (this.current.activeCrisis.options.find((o) => o.id === this.draft.crisisChoice!.optionId)?.cloutCost ?? 0)
      : 0,
  );
  powerCost = $derived.by(() => {
    let cost = 0;
    for (const id of this.draft.signedOrders) {
      cost += getOrder(id)?.cloutCost ?? 0;
    }
    if (this.draft.fedPressure) cost += C.fedPressureCost;
    if (this.draft.speechAudience) cost += speechCost(this.current.speechCountInWindow);
    return cost;
  });
  mythReward = $derived(
    this.draft.viewMyth && !this.current.viewedMyths.includes(this.draft.viewMyth)
      ? C.mythRewardClout
      : 0,
  );
  clout = $derived(
    this.current.clout + (this.preview?.cloutDelta ?? 0) - this.crisisCost - this.powerCost + this.mythReward,
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
  over = $derived(this.current.turn >= TOTAL_TURNS);

  constructor(seed: number, start: Start, readonly options: GameOptions) {
    this.history = [newGame(seed, start)];
    this.autopilot = [newGame(seed, start)];
    this.inputs = [];
    storeAutosave(this);
  }

  static fromSave(save: SaveFile): Session {
    const s = new Session(save.seed, save.start, save.options);
    for (const input of save.inputs) {
      const next = endTurn(s.current, input);
      s.history = [...s.history, next];
      const autoLast = s.autopilot[s.autopilot.length - 1]!;
      s.autopilot = [...s.autopilot, endTurn(autoLast, autopilotDecisions(autoLast))];
      s.inputs = [...s.inputs, input];
      s.draft = freshDraft(next.policy);
    }
    storeAutosave(s);
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
    const crisis = this.current.activeCrisis;
    if (!crisis || crisis.crisisId !== crisisId) return;
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

  nextTurn() {
    const decisions: Decisions = {};
    if (this.bill) decisions.bill = this.bill;
    if (this.draft.crisisChoice) {
      decisions.crisis = $state.snapshot(this.draft.crisisChoice);
    }
    if (this.powers) {
      decisions.powers = $state.snapshot(this.powers);
    }
    const next = endTurn(this.current, decisions);
    if (next === this.current) return;
    this.inputs = [...this.inputs, decisions];
    this.history = [...this.history, next];
    const autoLast = this.autopilot[this.autopilot.length - 1]!;
    this.autopilot = [...this.autopilot, endTurn(autoLast, autopilotDecisions(autoLast))];
    this.draft = freshDraft(next.policy);
    this.showingReport = true;
    storeAutosave(this);
  }

  openReport() {
    if (this.current.turn > 1) this.showingReport = true;
  }

  closeReport() {
    this.showingReport = false;
  }
}
