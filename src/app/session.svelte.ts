import { endTurn, newGame, type GameState } from '../engine/game';
import type { ScreenId } from './screens';

/** UI-side session: snapshot history (one per turn) + current screen. One-way: screens never mutate state. */
export class Session {
  history = $state.raw<GameState[]>([]);
  screen = $state<ScreenId>('oval');
  current = $derived(this.history[this.history.length - 1]!);

  constructor(seed: number) {
    this.history = [newGame(seed)];
  }

  nextTurn() {
    const next = endTurn(this.current);
    if (next !== this.current) this.history = [...this.history, next];
  }
}
