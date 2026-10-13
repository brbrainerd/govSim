import { describe, expect, it } from 'vitest';
import { START } from './fixture';
import { endTurn, newGame, TOTAL_TURNS } from './game';
import { getExogenousSchedule } from './director';
import {
  CRISIS_CATALOG,
  EXOGENOUS_CRISES,
  GEOPOLITICAL_CRISES,
  getCrisis,
  isGeopoliticalCrisis,
  type CrisisOption,
} from './crises';

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

  it('GR-09: crisis options have valid structure and no option Pareto-dominates another', () => {
    for (const crisis of CRISIS_CATALOG) {
      expect(crisis.options.length).toBeGreaterThanOrEqual(3);
      const autopilotOptions = crisis.options.filter((o) => o.autopilot);
      expect(autopilotOptions).toHaveLength(1);

      // Verify at least one status quo/zero-cost option
      const freeOptions = crisis.options.filter((o) => o.cloutCost === 0);
      expect(freeOptions.length).toBeGreaterThanOrEqual(1);

      // Helper to evaluate channel impact (positive is good, negative is bad)
      const getEffect = (opt: CrisisOption, channel: string): number => {
        const eff = opt.effects.find((e) => e.channel === channel);
        if (!eff) return 0;
        // For inflation and debtBn, higher numbers are worse
        if (channel === 'inflation' || channel === 'debtBn') return -eff.amount;
        return eff.amount;
      };

      const allChannels = Array.from(
        new Set(crisis.options.flatMap((o) => o.effects.map((e) => e.channel))),
      );

      // Pairwise non-domination check
      for (const a of crisis.options) {
        for (const b of crisis.options) {
          if (a.id === b.id) continue;

          const cheaperOrEqual = a.cloutCost <= b.cloutCost;
          const channelsAtLeastAsGood = allChannels.every((ch) => getEffect(a, ch) >= getEffect(b, ch));
          const strictlyBetter =
            a.cloutCost < b.cloutCost ||
            allChannels.some((ch) => getEffect(a, ch) > getEffect(b, ch));

          const aDominatesB = cheaperOrEqual && channelsAtLeastAsGood && strictlyBetter;
          expect(
            aDominatesB,
            `In crisis ${crisis.id}, option ${a.id} must not Pareto-dominate option ${b.id}`,
          ).toBe(false);
        }
      }
    }
  });

  it('CRISIS-01 & CRISIS-02: geopolitical crisis catalog integrity and precedent citations', () => {
    expect(GEOPOLITICAL_CRISES).toHaveLength(4);

    const expectedIds = ['oil_embargo', 'strait_blockade', 'debt_contagion', 'border_clashes'];
    for (const id of expectedIds) {
      expect(isGeopoliticalCrisis(id)).toBe(true);
      const def = getCrisis(id);
      expect(def).toBeDefined();
      expect(def!.category).toBe('geopolitical');
      expect(def!.options).toHaveLength(3);

      const auto = def!.options.filter((o) => o.autopilot);
      expect(auto).toHaveLength(1);

      const free = def!.options.filter((o) => o.cloutCost === 0);
      expect(free.length).toBeGreaterThanOrEqual(1);

      for (const opt of def!.options) {
        expect(opt.precedent).toBeDefined();
        expect(opt.precedent!.citation.length).toBeGreaterThan(5);
        expect(opt.precedent!.summary.length).toBeGreaterThan(10);
        expect(opt.effects.length).toBeGreaterThan(0);
      }
    }

    expect(isGeopoliticalCrisis('hurricane')).toBe(false);
    expect(isGeopoliticalCrisis('market_panic')).toBe(false);
  });
});
