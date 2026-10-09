// Pure, deterministic engine core (design.md §8). No UI imports.
// ponytail: only turn/time bookkeeping so far; the macro model lands in M1.

export const TOTAL_TURNS = 32;

export interface GameState {
  readonly seed: number;
  readonly rng: number; // mulberry32 state, advanced every turn
  readonly turn: number; // 1-based
  readonly approval: number; // 0..100
  readonly clout: number;
}

/** mulberry32: returns [value in 0..1, next state]. */
export function nextRandom(state: number): [number, number] {
  const s = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}

export function newGame(seed: number): GameState {
  return { seed, rng: seed | 0, turn: 1, approval: 52, clout: 120 };
}

export function endTurn(state: GameState): GameState {
  if (state.turn >= TOTAL_TURNS) return state;
  const [r, rng] = nextRandom(state.rng);
  const drift = Math.round((r - 0.5) * 4); // placeholder until the approval model exists
  return {
    ...state,
    rng,
    turn: state.turn + 1,
    approval: Math.min(100, Math.max(0, state.approval + drift)),
    clout: state.clout + Math.round(state.approval / 10),
  };
}

const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'] as const;

const START_QUARTER = 2026 * 4 + 3; // Q4 2026: the game starts in the present (design Q19)

/** Season + year for a 1-based turn; quarters run Winter, Spring, Summer, Fall. */
export function turnLabel(turn: number): string {
  const q = START_QUARTER + turn - 1;
  return `${SEASONS[q % 4]} ${Math.floor(q / 4)}`;
}
