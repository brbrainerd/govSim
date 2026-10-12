import { describe, expect, it } from 'vitest';
import { START } from './fixture';
import { endTurn, newGame, TOTAL_TURNS } from './game';
import { getExogenousSchedule } from './director';
import { EXOGENOUS_CRISES } from './crises';

describe('crises director (EVT-01, EVT-03, GR-01, GR-02, GR-08)', () => {
  it('GR-01 & GR-02: player with no decisions matches autopilot crisis schedule across 200 seeds', () => {
    for (let seed = 1; seed <= 200; seed++) {
      let playerState = newGame(seed, START);
      let autoState = newGame(seed, START);

      for (let t = 1; t <= TOTAL_TURNS; t++) {
        const playerCrisis = playerState.activeCrisis;
        const autoCrisis = autoState.activeCrisis;

        if (playerCrisis === null) {
          expect(autoCrisis).toBeNull();
        } else {
          expect(autoCrisis).not.toBeNull();
          expect(playerCrisis.id).toBe(autoCrisis!.id);
          expect(playerCrisis.crisisId).toBe(autoCrisis!.crisisId);
          expect(playerCrisis.turn).toBe(autoCrisis!.turn);
          expect(playerCrisis.type).toBe(autoCrisis!.type);
        }

        playerState = endTurn(playerState, {});
        autoState = endTurn(autoState, {});
      }
    }
  });

  it('GR-08: pacing rules verified across 500 seeds', () => {
    const SEED_COUNT = 500;
    const archCounts: Record<string, number> = {};
    for (const c of EXOGENOUS_CRISES) archCounts[c.id] = 0;

    let minCrises = 999;
    let maxCrises = 0;

    for (let seed = 1; seed <= SEED_COUNT; seed++) {
      let state = newGame(seed, START);
      const crisisTurns: number[] = [];
      const seenArchetypesInSeed = new Set<string>();

      for (let t = 1; t <= TOTAL_TURNS; t++) {
        if (state.activeCrisis !== null) {
          crisisTurns.push(t);
          seenArchetypesInSeed.add(state.activeCrisis.crisisId);
        }
        state = endTurn(state, {});
      }

      // 1. Zero crises on turns 1 and 2
      expect(crisisTurns).not.toContain(1);
      expect(crisisTurns).not.toContain(2);

      // 2. First crisis occurs on turn 3, 4, or 5
      expect(crisisTurns.length).toBeGreaterThan(0);
      const firstCrisisTurn = crisisTurns[0]!;
      expect(firstCrisisTurn).toBeGreaterThanOrEqual(3);
      expect(firstCrisisTurn).toBeLessThanOrEqual(5);

      // 3. No 3 consecutive turns have crises
      for (let i = 0; i < crisisTurns.length - 2; i++) {
        const t1 = crisisTurns[i]!;
        const t2 = crisisTurns[i + 1]!;
        const t3 = crisisTurns[i + 2]!;
        const consecutive = t2 === t1 + 1 && t3 === t2 + 1;
        expect(consecutive).toBe(false);
      }

      // 4. Total crises falls between 4 and 9 inclusive
      const totalCrises = crisisTurns.length;
      if (totalCrises < minCrises) minCrises = totalCrises;
      if (totalCrises > maxCrises) maxCrises = totalCrises;
      expect(totalCrises).toBeGreaterThanOrEqual(4);
      expect(totalCrises).toBeLessThanOrEqual(9);

      // Record seen archetypes for distribution check
      for (const arch of seenArchetypesInSeed) {
        if (archCounts[arch] !== undefined) {
          archCounts[arch] += 1;
        }
      }
    }

    expect(minCrises).toBeGreaterThanOrEqual(4);
    expect(maxCrises).toBeLessThanOrEqual(9);

    // 5. Each archetype appears in >= 10% and <= 60% of runs
    for (const c of EXOGENOUS_CRISES) {
      const count = archCounts[c.id]!;
      const pct = count / SEED_COUNT;
      expect(pct, `archetype ${c.id} frequency ${pct}`).toBeGreaterThanOrEqual(0.1);
      expect(pct, `archetype ${c.id} frequency ${pct}`).toBeLessThanOrEqual(0.6);
    }
  });

  it('exogenous schedule is a pure function of seed', () => {
    const s1 = getExogenousSchedule(42);
    const s2 = getExogenousSchedule(42);
    expect(Array.from(s1.entries())).toEqual(Array.from(s2.entries()));
  });
});
