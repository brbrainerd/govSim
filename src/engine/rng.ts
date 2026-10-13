// Keyed counter-based RNG (D10, FND-01): every draw is a pure function of (seed, stream, turn, key[, k]).
// Stream numbers and key strings are part of the replay contract: append only, never renumber.
export const STREAM = { macro: 1, events: 2, court: 3, fed: 4, voters: 5, election: 6, reform: 7, geopolitics: 8 } as const;
export type Stream = keyof typeof STREAM;

const mix = (h: number): number => {            // murmur3 fmix32
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  return (h ^ (h >>> 16)) | 0;
};
const absorb = (h: number, w: number): number => mix(((h ^ w) + 0x9e3779b9) | 0);

export function keyHash(key: string | number): number {   // FNV-1a over UTF-16 units; ints pass through
  if (typeof key === 'number') return key | 0;
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  return h | 0;
}

/** Seed, turn and numeric keys must be integers: `|0` would silently merge 1.5 with 1 (IN-03). */
export const cell = (seed: number, stream: Stream, turn: number, key: string | number = 0): number => {
  if (!Number.isInteger(seed) || !Number.isInteger(turn) || (typeof key === 'number' && !Number.isInteger(key)))
    throw new Error(`rng: non-integer seed, turn or key (${seed}, ${turn}, ${key})`);
  return absorb(absorb(absorb(absorb(0x2545f491, seed | 0), STREAM[stream]), turn), keyHash(key));
};

export const uniformAt = (c: number, k: number): number => (mix(absorb(c, k)) >>> 0) / 4294967296; // [0, 1)

export const draw = (seed: number, stream: Stream, turn: number, key: string | number = 0, k = 0): number =>
  uniformAt(cell(seed, stream, turn, key), k);

/** Irwin-Hall(12) standard normal: mean 0, variance 1, support +-6. */
export function normal(seed: number, stream: Stream, turn: number, key: string | number): number {
  const c = cell(seed, stream, turn, key);
  let s = 0;
  for (let k = 0; k < 12; k++) s += uniformAt(c, k);   // fixed order = fixed rounding
  return s - 6;
}
