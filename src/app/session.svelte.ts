import { fromPackage, type BudgetDraft, type PackageName } from '../engine/budget';
import { deals, tally, voteOutcome, type DealId } from '../engine/congress';
import { endTurn, newGame, type GameState } from '../engine/game';
import type { ScreenId } from './screens';

interface Draft {
  budget: BudgetDraft;
  pack: PackageName | null;
  sentToCongress: boolean;
  deals: DealId[];
  vote: { passed: boolean; total: number; cloutBack: number } | null;
}

const freshDraft = (): Draft => ({
  budget: fromPackage('Infrastructure push'),
  pack: 'Infrastructure push',
  sentToCongress: false,
  deals: [],
  vote: null,
});

/**
 * UI-side session: snapshot history (one per turn), this turn's draft decisions, current screen.
 * Screens only edit the draft; the engine turns drafts into the next snapshot.
 * ponytail: drafts are not yet fed into endTurn; that wiring lands with the macro model.
 */
export class Session {
  history = $state.raw<GameState[]>([]);
  screen = $state<ScreenId>('oval');
  draft = $state<Draft>(freshDraft());
  current = $derived(this.history[this.history.length - 1]!);

  spent = $derived(deals.filter((d) => this.draft.deals.includes(d.id)).reduce((n, d) => n + d.cost, 0));
  clout = $derived(this.current.clout - this.spent + (this.draft.vote?.cloutBack ?? 0));
  whip = $derived(tally(this.draft.deals));

  constructor(seed: number) {
    this.history = [newGame(seed)];
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
    const next = endTurn(this.current);
    if (next === this.current) return;
    this.history = [...this.history, next];
    this.draft = freshDraft();
  }
}
