// Test helpers for modifier and legacy tests (plan 01-07).
import { START } from '../engine/fixture';
import { newGame, type GameState } from '../engine/game';
import type { Modifier } from '../engine/modifiers';
import { FOREVER } from '../engine/units';

export const mod = (o: Partial<Modifier> & Pick<Modifier, 'channel' | 'source'>): Modifier => ({
  id: `${o.source}#1`, group: o.source, amount: 0.5, from: 1, until: FOREVER, tag: 'event', ...o,
});
export const withMods = (seed: number, modifiers: Modifier[]): GameState => ({ ...newGame(seed, START), modifiers });
