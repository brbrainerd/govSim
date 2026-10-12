import { describe, expect, it } from 'vitest';
import { endTurn, newGame, TOTAL_TURNS, type GameState } from './game';
import { START } from './fixture';
import { tanhPade } from './detmath';
import { cell, draw, keyHash, normal, uniformAt } from './rng';

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const variance = (xs: number[]) => { const m = mean(xs); return mean(xs.map((x) => (x - m) * (x - m))); };
const corr = (a: number[], b: number[]) => {
  const ma = mean(a), mb = mean(b);
  return mean(a.map((x, i) => (x - ma) * (b[i]! - mb))) / Math.sqrt(variance(a) * variance(b));
};
const N = 100_000;
const KNOWN = { draw1: 0.38435966800898314, draw2: 0.9752591925207525, normal: -0.12047750316560268, keyHash: 1209475535 };

describe('rng', () => {
  // KNOWN_ANSWERS: changing these numbers is a deliberate replay-contract bump (Phase 2 owns the
  // version number), never a casual update.
  it('matches known answers', () => {
    expect(draw(1, 'macro', 1, 'gap')).toBe(KNOWN.draw1);
    expect(draw(-31337, 'events', 7, 'x', 3)).toBe(KNOWN.draw2);
    expect(normal(42, 'macro', 5, 'infl')).toBe(KNOWN.normal);
    expect(keyHash('gap')).toBe(KNOWN.keyHash);
  });

  it('draws uniforms in [0, 1) with mean 1/2, variance 1/12 and no lag-1 correlation', () => {
    const u = Array.from({ length: N }, (_, i) => draw(1, 'events', i, 'u'));
    for (const x of u) { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1); }
    expect(Math.abs(mean(u) - 0.5)).toBeLessThan(0.01);
    expect(Math.abs(variance(u) - 1 / 12)).toBeLessThan(0.002);
    expect(Math.abs(corr(u.slice(1), u.slice(0, -1)))).toBeLessThan(0.01);
  });

  it('draws standard normals within +-6', () => {
    const z = Array.from({ length: N }, (_, i) => normal(2, 'macro', i, 'z'));
    expect(Math.abs(mean(z))).toBeLessThan(0.02);
    expect(Math.abs(variance(z) - 1)).toBeLessThan(0.03);
    for (const x of z) { expect(x).toBeGreaterThanOrEqual(-6); expect(x).toBeLessThanOrEqual(6); }
  });

  it('keeps sibling keys of one cell uncorrelated', () => {
    const a = Array.from({ length: N }, (_, i) => draw(3, 'macro', i, 'gap'));
    const b = Array.from({ length: N }, (_, i) => draw(3, 'macro', i, 'infl'));
    expect(Math.abs(corr(a, b))).toBeLessThan(0.01);
    const c = Array.from({ length: N }, (_, i) => uniformAt(cell(3, 'macro', i, 'gap'), 1));
    expect(Math.abs(corr(a, c))).toBeLessThan(0.01);
  });

  it('is stateless: extra draws between turns leave every state deep-equal', () => {
    const play = (extra: boolean) => {
      const out: GameState[] = [newGame(9, START)];
      for (let t = 1; t < TOTAL_TURNS; t++) {
        if (extra) { draw(9, 'events', t, 'x'); normal(9, 'court', t, 'y'); }
        out.push(endTurn(out[t - 1]!));
      }
      return out;
    };
    expect(play(true)).toEqual(play(false));
  });
});

describe('detmath', () => {
  const grid = Array.from({ length: 801 }, (_, i) => -4 + i * 0.01);
  it('tanhPade is odd, monotone, close to tanh and saturates', () => {
    for (const x of grid) {
      expect(tanhPade(-x)).toBe(-tanhPade(x));
      expect(Math.abs(tanhPade(x) - Math.tanh(x))).toBeLessThan(0.024);
    }
    for (let i = 1; i < grid.length; i++) expect(tanhPade(grid[i]!)).toBeGreaterThanOrEqual(tanhPade(grid[i - 1]!));
    expect(tanhPade(3)).toBe(1);
    expect(tanhPade(-3.5)).toBe(-1);
  });
});

describe('rng input guard (IN-03)', () => {
  it('rejects non-integer seeds, turns and numeric keys', () => {
    expect(() => cell(1.5, 'macro', 1)).toThrow(/non-integer/);
    expect(() => cell(1, 'macro', 1.5)).toThrow(/non-integer/);
    expect(() => cell(1, 'macro', 1, 0.5)).toThrow(/non-integer/);
    expect(() => cell(1, 'macro', 1, 'k')).not.toThrow();
  });
});
