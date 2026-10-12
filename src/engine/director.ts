// Pure, deterministic crisis director (design.md §3, EVT-01..03, GR-01, GR-02, GR-08).
import { C } from './coefficients';
import { EXOGENOUS_CRISES, getCrisis, type CrisisDefinition, type CrisisOption, type CrisisType } from './crises';
import type { GameState } from './game';
import { draw } from './rng';
import { TOTAL_TURNS } from './units';

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
