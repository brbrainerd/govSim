import { describe, expect, it } from 'vitest';
import { START } from './fixture';
import { finalScore, newGame, projectedScore, prosperity, scoreVsAutopilot } from './game';

describe('score', () => {
  it('computes baseline prosperity index around neutral starting score', () => {
    const s = newGame(1, START);
    const p = prosperity(s);
    expect(p.index).toBeCloseTo(53.2, 1);
    expect(Object.keys(p.parts)).toHaveLength(8);
  });

  it('evaluates identical projectedScore and finalScore', () => {
    const s = newGame(42, START);
    const f = finalScore(s);
    const p = projectedScore(s);
    expect(p.total).toBe(f.total);
    expect(p.now).toBe(f.now);
    expect(p.later).toBe(f.later);
  });

  it('returns zero score difference against identical state', () => {
    const s = newGame(99, START);
    const diff = scoreVsAutopilot(s, s);
    expect(diff.total).toBe(0);
    expect(diff.now).toBe(0);
    expect(diff.later).toBe(0);
  });
});
