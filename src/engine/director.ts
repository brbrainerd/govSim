// Pure, deterministic crisis director (design.md §3, EVT-01..03, GR-01, GR-02, GR-08).
import { C } from './coefficients';
import {
  EXOGENOUS_CRISES,
  GEOPOLITICAL_CRISES,
  getCrisis,
  type CrisisDefinition,
  type CrisisOption,
  type CrisisType,
} from './crises';
import type { GameState } from './game';
import { draw } from './rng';
import {
  GEOPOLITICAL_COUNTDOWN_TURNS,
  GEOPOLITICAL_FIRST_TURN_MIN,
  GEOPOLITICAL_MIN_SPACING,
  GEOPOLITICAL_TARGET_TERM1_MAX,
  GEOPOLITICAL_TARGET_TERM1_MIN,
  GEOPOLITICAL_TERM1_MAX_TURN,
  GEOPOLITICAL_TERM2_MAX_TURN,
  GEOPOLITICAL_TERM2_START_TURN,
  TOTAL_TURNS,
} from './units';

export interface ActiveCrisis {
  readonly id: string;
  readonly crisisId: string;
  readonly turn: number;
  readonly type: CrisisType;
  readonly name: string;
  readonly headline: string;
  readonly description: string;
  readonly explainerTitle: string;
  readonly options: readonly CrisisOption[];
  readonly isEndogenous: boolean;
  readonly isGeopolitical?: boolean;
  readonly turnsRemaining?: number;
  readonly startTurn?: number;
  readonly deadlineTurn?: number;
}

function createActiveCrisis(def: CrisisDefinition, turn: number): ActiveCrisis {
  return {
    id: `${def.id}_t${turn}`,
    crisisId: def.id,
    turn,
    type: def.type,
    name: def.name,
    headline: def.headline,
    description: def.description,
    explainerTitle: def.explainerTitle,
    options: def.options,
    isEndogenous: def.type === 'endogenous',
  };
}

export function createGeopoliticalActiveCrisis(def: CrisisDefinition, turn: number): ActiveCrisis {
  return {
    id: `${def.id}_t${turn}`,
    crisisId: def.id,
    turn,
    type: def.type,
    name: def.name,
    headline: def.headline,
    description: def.description,
    explainerTitle: def.explainerTitle,
    options: def.options,
    isEndogenous: false,
    isGeopolitical: true,
    turnsRemaining: GEOPOLITICAL_COUNTDOWN_TURNS,
    startTurn: turn,
    deadlineTurn: turn + GEOPOLITICAL_COUNTDOWN_TURNS,
  };
}

/** Pre-schedules all exogenous crisis turns and archetypes for a given seed (GR-01, GR-02, GR-08). */
export function getExogenousSchedule(seed: number): Map<number, string> {
  const firstTurn = Math.floor(
    C.crisisFirstTurnMin +
      draw(seed, 'events', 0, 'first_turn') *
        (C.crisisFirstTurnMax - C.crisisFirstTurnMin + 1),
  );

  const targetCount = Math.floor(
    C.crisisMinPerTerm +
      draw(seed, 'events', 0, 'target_count') *
        (C.crisisMaxPerTerm - C.crisisMinPerTerm + 1),
  );

  const activeTurns = new Set<number>([firstTurn]);

  const candidates: { turn: number; prio: number }[] = [];
  for (let t = C.crisisFirstTurnMin; t <= TOTAL_TURNS; t += 1) {
    if (t !== firstTurn) {
      candidates.push({ turn: t, prio: draw(seed, 'events', t, 'turn_prio') });
    }
  }
  candidates.sort((a, b) => (a.prio < b.prio ? -1 : a.prio > b.prio ? 1 : 0));

  for (const cand of candidates) {
    if (activeTurns.size >= targetCount) break;
    const t = cand.turn;
    const one = 1;
    const two = 1 + 1;
    if (activeTurns.has(t - one) && activeTurns.has(t - two)) continue;
    if (activeTurns.has(t - one) && activeTurns.has(t + one)) continue;
    if (activeTurns.has(t + one) && activeTurns.has(t + two)) continue;
    activeTurns.add(t);
  }

  const shuffled = EXOGENOUS_CRISES.map((c, i) => ({
    id: c.id,
    prio: draw(seed, 'events', 0, `arch_${i}`),
  }))
    .sort((a, b) => (a.prio < b.prio ? -1 : a.prio > b.prio ? 1 : 0))
    .map((x) => x.id);

  const sortedTurns = Array.from(activeTurns).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const schedule = new Map<number, string>();
  for (let i = 0; i < sortedTurns.length; i += 1) {
    const turn = sortedTurns[i];
    const arch = shuffled[i % shuffled.length];
    if (turn !== undefined && arch !== undefined) {
      schedule.set(turn, arch);
    }
  }
  return schedule;
}

/**
 * Evaluates whether an exogenous or endogenous crisis fires on this turn.
 * Exogenous events follow the pre-scheduled calendar derived purely from the seed.
 * Endogenous events trigger on quiet turns when state thresholds are breached.
 */
export function scheduleTurnEvents(seed: number, turn: number, state: GameState): ActiveCrisis | null {
  if (turn < C.crisisFirstTurnMin) {
    return null;
  }

  const exoSchedule = getExogenousSchedule(seed);
  const exoId = exoSchedule.get(turn);
  if (exoId) {
    const def = getCrisis(exoId);
    if (!def) throw new Error(`Unknown crisis archetype in schedule: ${exoId}`);
    return createActiveCrisis(def, turn);
  }

  // Check endogenous crisis triggers only if previous turn did not have an active crisis
  if (state.activeCrisis === null) {
    if (state.econ.debt / state.econ.gdp > C.debtStressThreshold) {
      const def = getCrisis('debt_crisis');
      if (def) return createActiveCrisis(def, turn);
    }
    if (state.econ.gini > C.unrestGiniThreshold || state.approval < C.unrestApprovalThreshold) {
      const def = getCrisis('civil_unrest');
      if (def) return createActiveCrisis(def, turn);
    }
  }

  return null;
}

/** Pre-schedules all geopolitical crisis turns and archetypes for a given seed (CRISIS-01, CRISIS-03). */
export function getGeopoliticalSchedule(seed: number): Map<number, string> {
  const one = 1;
  const two = 1 + 1;
  const half = one / two;
  const countTerm1 =
    GEOPOLITICAL_TARGET_TERM1_MIN +
    (draw(seed, 'geopolitics', 0, 'count_term1') > half ? one : 0);

  const candidatesTerm1: { turn: number; prio: number }[] = [];
  for (let t = GEOPOLITICAL_FIRST_TURN_MIN; t <= GEOPOLITICAL_TERM1_MAX_TURN; t += one) {
    candidatesTerm1.push({ turn: t, prio: draw(seed, 'geopolitics', t, 'prio_term1') });
  }
  candidatesTerm1.sort((a, b) => (a.prio < b.prio ? -one : a.prio > b.prio ? one : 0));

  const activeTurnsTerm1 = new Set<number>();
  for (const c of candidatesTerm1) {
    if (activeTurnsTerm1.size >= countTerm1) break;
    const t = c.turn;
    let conflict = false;
    for (let s = one; s <= GEOPOLITICAL_MIN_SPACING; s += one) {
      if (activeTurnsTerm1.has(t - s) || activeTurnsTerm1.has(t + s)) {
        conflict = true;
        break;
      }
    }
    if (!conflict) {
      activeTurnsTerm1.add(t);
    }
  }

  const countTerm2 =
    GEOPOLITICAL_TARGET_TERM1_MIN +
    (draw(seed, 'geopolitics', 0, 'count_term2') > half ? one : 0);

  const candidatesTerm2: { turn: number; prio: number }[] = [];
  for (let t = GEOPOLITICAL_TERM2_START_TURN; t <= GEOPOLITICAL_TERM2_MAX_TURN; t += one) {
    candidatesTerm2.push({ turn: t, prio: draw(seed, 'geopolitics', t, 'prio_term2') });
  }
  candidatesTerm2.sort((a, b) => (a.prio < b.prio ? -one : a.prio > b.prio ? one : 0));

  const activeTurnsTerm2 = new Set<number>();
  for (const c of candidatesTerm2) {
    if (activeTurnsTerm2.size >= countTerm2) break;
    const t = c.turn;
    let conflict = false;
    for (let s = one; s <= GEOPOLITICAL_MIN_SPACING; s += one) {
      if (activeTurnsTerm2.has(t - s) || activeTurnsTerm2.has(t + s)) {
        conflict = true;
        break;
      }
    }
    if (!conflict) {
      activeTurnsTerm2.add(t);
    }
  }

  const allTurns = Array.from(activeTurnsTerm1).concat(Array.from(activeTurnsTerm2)).sort((a, b) => (a < b ? -one : a > b ? one : 0));

  const shuffled = GEOPOLITICAL_CRISES.map((c, i) => ({
    id: c.id,
    prio: draw(seed, 'geopolitics', 0, `geo_arch_${i}`),
  }))
    .sort((a, b) => (a.prio < b.prio ? -one : a.prio > b.prio ? one : 0))
    .map((x) => x.id);

  const schedule = new Map<number, string>();
  for (let i = 0; i < allTurns.length; i += one) {
    const turn = allTurns[i];
    const arch = shuffled[i % shuffled.length];
    if (turn !== undefined && arch !== undefined) {
      schedule.set(turn, arch);
    }
  }
  return schedule;
}

export function checkGeopoliticalEscalation(activeCrisis: ActiveCrisis, currentTurn: number): boolean {
  if (!activeCrisis.isGeopolitical || activeCrisis.deadlineTurn === undefined) {
    return false;
  }
  return currentTurn > activeCrisis.deadlineTurn;
}

