import { describe, expect, it } from 'vitest';
import { endTurn, newGame, TOTAL_TURNS, turnLabel, type GameState } from './game';

const play = (seed: number) => {
  const out: GameState[] = [newGame(seed)];
  for (let i = 1; i < TOTAL_TURNS; i++) out.push(endTurn(out[i - 1]!));
  return out;
};

describe('engine', () => {
  it('is deterministic for a seed', () => {
    expect(play(42)).toEqual(play(42));
    expect(play(42)).not.toEqual(play(43));
  });

  it('does not mutate its input and stops at the last turn', () => {
    const s = newGame(1);
    const frozen = structuredClone(s);
    endTurn(s);
    expect(s).toEqual(frozen);
    const last = play(1).at(-1)!;
    expect(last.turn).toBe(TOTAL_TURNS);
    expect(endTurn(last)).toBe(last);
  });

  it('starts in the present and labels quarters', () => {
    expect(turnLabel(1)).toBe('Fall 2026');
    expect(turnLabel(2)).toBe('Winter 2027');
    expect(turnLabel(32)).toBe('Summer 2034');
  });
});
