import { fromPackage, type BudgetDraft, type PackageName } from '../engine/budget';
import { deals, tally, voteOutcome, type DealId } from '../engine/congress';
import { endTurn, newGame, prosperity, type Decisions, type GameState, type Start } from '../engine/game';
import type { ScreenId } from './screens';

interface Draft {
  budget: BudgetDraft;
  pack: PackageName | null;
  sentToCongress: boolean;
  deals: DealId[];
  vote: { passed: boolean; total: number; cloutBack: number } | null;
}

/** A new turn's draft starts from the policy already in force. */
const freshDraft = (policy: BudgetDraft): Draft => ({
  budget: { ...policy },
  pack: null,
  sentToCongress: false,
  deals: [],
  vote: null,
});

/**
 * UI-side session: your snapshot history, an autopilot history on the same seed (design §2),
 * this turn's draft decisions and the current screen. Screens only edit the draft;
 * nextTurn turns the draft into Decisions for the pure engine.
 */
export class Session {
  history = $state.raw<GameState[]>([]);
  autopilot = $state.raw<GameState[]>([]);
  screen = $state<ScreenId>('oval');
  draft = $state<Draft>(freshDraft(fromPackage('Keep as is')));

  current = $derived(this.history[this.history.length - 1]!);
  previous = $derived(this.history[this.history.length - 2] ?? this.current);
  spent = $derived(deals.filter((d) => this.draft.deals.includes(d.id)).reduce((n, d) => n + d.cost, 0));
  clout = $derived(this.current.clout - this.spent + (this.draft.vote?.cloutBack ?? 0));
  whip = $derived(tally(this.draft.deals));
  index = $derived(prosperity(this.current).index);
  /** Headline: how much better than doing nothing (same seed, same shocks). */
  vsNothing = $derived(this.index - prosperity(this.autopilot[this.autopilot.length - 1]!).index);

  constructor(seed: number, start: Start) {
    this.history = [newGame(seed, start)];
    this.autopilot = [newGame(seed, start)];
  }

  pickPackage(p: PackageName) {
    this.draft.budget = fromPackage(p);
    this.draft.pack = p;
    this.draft.sentToCongress = false;
  }

  setLever(id: string, value: number) {
    this.draft.budget[id] = value;
    this.draft.pack = null;
    this.draft.sentToCongress = false;
  }

  makeDeal(id: DealId) {
    const d = deals.find((x) => x.id === id)!;
    if (this.draft.vote || this.draft.deals.includes(id) || this.clout < d.cost) return;
    this.draft.deals.push(id);
  }

  callVote() {
    if (this.draft.vote) return;
    const total = this.whip.total;
    this.draft.vote = { total, ...voteOutcome(total, this.spent) };
  }

  nextTurn() {
    const decisions: Decisions = { clout: this.clout - this.current.clout };
    if (this.draft.vote?.passed) decisions.budget = $state.snapshot(this.draft.budget);
    const next = endTurn(this.current, decisions);
    if (next === this.current) return;
    this.history = [...this.history, next];
    this.autopilot = [...this.autopilot, endTurn(this.autopilot[this.autopilot.length - 1]!)];
    this.draft = freshDraft(next.policy);
  }
}
