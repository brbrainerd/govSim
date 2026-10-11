import { describe, expect, it } from 'vitest';
import { MIDTERM_TURNS, REELECTION_TURN, realQuarterLabel, termLabel, termParts } from './calendar';

describe('term calendar (D1)', () => {
  it('labels turns as Year N · Season, turn 1 = Year 1 Winter', () => {
    const want: [number, string][] = [
      [1, 'Year 1 · Winter'], [4, 'Year 1 · Fall'], [5, 'Year 2 · Winter'], [8, 'Year 2 · Fall'],
      [16, 'Year 4 · Fall'], [17, 'Year 5 · Winter'], [24, 'Year 6 · Fall'], [32, 'Year 8 · Fall'],
    ];
    for (const [t, label] of want) expect(termLabel(t)).toBe(label);
  });

  it('puts every election on a Fall turn', () => {
    expect(MIDTERM_TURNS).toEqual([8, 24]);
    expect(REELECTION_TURN).toBe(16);
    for (const t of [...MIDTERM_TURNS, REELECTION_TURN, 32]) expect(termParts(t).season).toBe('Fall');
    expect([8, 16, 24].map((t) => termParts(t).year)).toEqual([2, 4, 6]);
  });

  it('keeps the real calendar for the tooltip: turn 1 = Fall 2026', () => {
    const want: [number, string][] = [[1, 'Fall 2026'], [2, 'Winter 2027'], [8, 'Summer 2028'], [16, 'Summer 2030'], [32, 'Summer 2034']];
    for (const [t, label] of want) expect(realQuarterLabel(t)).toBe(label);
  });
});
