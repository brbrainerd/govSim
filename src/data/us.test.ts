import { describe, expect, it } from 'vitest';
import { endTurn, newGame, TOTAL_TURNS } from '../engine/game';
import { fromData, us } from './us';

describe('real starting data', () => {
  it('maps every engine input to a finite number and covers 538 electoral votes', () => {
    for (const [k, v] of Object.entries(fromData(us))) expect(Number.isFinite(v), k).toBe(true);
    expect(us.states.rows).toHaveLength(51);
    expect(us.states.rows.reduce((n, r) => n + r.electoralVotes, 0)).toBe(538);
    const h = us.politics.house.value;
    expect(h.republican + h.democrat + h.independent + h.vacant).toBe(435);
  });

  it('stays plausible on autopilot from the real start', () => {
    for (let seed = 1; seed <= 20; seed++) {
      let s = newGame(seed, fromData(us));
      for (let t = 1; t < TOTAL_TURNS; t++) {
        s = endTurn(s);
        expect(s.econ.unemployment).toBeLessThan(10);
        expect(s.econ.inflation).toBeLessThan(8);
        expect((s.econ.debt / s.econ.gdp) * 100).toBeLessThan(140);
      }
    }
  });
});
