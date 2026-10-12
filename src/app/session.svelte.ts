import { fromPackage, packages, type BudgetDraft, type PackageName } from '../engine/budget';
import { tally, type DealId } from '../engine/congress';
import { cloutCost, resolveBill, type Decisions } from '../engine/decisions';
import { endTurn, newGame, prosperity, TOTAL_TURNS, type GameState, type Start } from '../engine/game';
import type { PartyId } from '../content/parties';
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
}

/** A new turn's draft starts from the policy already in force. */
const freshDraft = (policy: BudgetDraft): Draft => ({
  budget: { ...policy },
  pack: null,
  sentToCongress: false,
  deals: [],
  voteCalled: false,
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
  clout = $derived(this.current.clout + (this.preview?.cloutDelta ?? 0));
  whip = $derived(this.preview?.whip ?? tally([]));
  vote = $derived(
    this.draft.voteCalled && this.preview
      ? { total: this.preview.whip.total, passed: this.preview.passed, cloutBack: this.preview.cloutBack }
      : null,
  );
  index = $derived(prosperity(this.current).index);
  /** Headline: how much better than doing nothing (same seed, same shocks). */
  vsNothing = $derived(this.index - prosperity(this.autopilot[this.autopilot.length - 1]!).index);
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
      s.autopilot = [...s.autopilot, endTurn(s.autopilot[s.autopilot.length - 1]!)];
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

  nextTurn() {
    const decisions: Decisions = this.bill ? { bill: this.bill } : {};
    const next = endTurn(this.current, decisions);
    if (next === this.current) return;
    this.inputs = [...this.inputs, decisions];
    this.history = [...this.history, next];
    this.autopilot = [...this.autopilot, endTurn(this.autopilot[this.autopilot.length - 1]!)];
    this.draft = freshDraft(next.policy);
    storeAutosave(this);
  }
}
