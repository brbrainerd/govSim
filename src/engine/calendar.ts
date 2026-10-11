// Term-relative calendar (D1). The visible label is the player's term; the real quarter is tooltip-only.
// Phases 6 and 7 read the election turns from here.

export const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'] as const;
export type Season = (typeof SEASONS)[number];

export const MIDTERM_TURNS = [8, 24] as const; // Year 2 Fall, Year 6 Fall
export const REELECTION_TURN = 16; // Year 4 Fall

/** Turn 1 = Year 1 Winter; four turns a year. */
export function termParts(turn: number): { year: number; season: Season } {
  const i = turn - 1;
  return { year: Math.floor(i / 4) + 1, season: SEASONS[((i % 4) + 4) % 4]! };
}

export const termLabel = (turn: number): string => {
  const p = termParts(turn);
  return `Year ${p.year} · ${p.season}`;
};

const START_QUARTER = 2026 * 4 + 3; // Q4 2026 data start (design Q19)

/** The real calendar quarter the same turn would fall in; used only in the tooltip. */
export const realQuarterLabel = (turn: number): string => {
  const q = START_QUARTER + turn - 1;
  return `${SEASONS[q % 4]} ${Math.floor(q / 4)}`;
};
