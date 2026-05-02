/**
 * Pure data-processing helpers for ElectionView.svelte.
 *
 * Extracted so they can be unit-tested without mounting Svelte components
 * or importing reactive stores.
 */
import type { TickRow } from "./ipc";

export interface ElectionRecord {
  tick:             number;
  incumbent_party:  number;
  margin:           number;
  consecutive_terms: number;
}

export interface CrisisRecord {
  tick:     number;
  kind:     number;
  /** Ticks from onset until crisis_kind returns to 0 (or last known row). */
  duration: number;
}

/**
 * Scan a metric ring-buffer and return the most-recent 10 election events
 * in reverse chronological order.
 *
 * An election is detected when `incumbent_party` changes between consecutive
 * rows OR when `consecutive_terms` increases (re-election of the same party).
 */
export function buildElectionHistory(rows: TickRow[]): ElectionRecord[] {
  const records: ElectionRecord[] = [];
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const curr = rows[i];
    if (
      prev.incumbent_party   !== curr.incumbent_party ||
      prev.consecutive_terms !== curr.consecutive_terms
    ) {
      records.push({
        tick:              curr.tick,
        incumbent_party:   curr.incumbent_party,
        margin:            curr.election_margin,
        consecutive_terms: curr.consecutive_terms,
      });
    }
  }
  return records.slice(-10).reverse();
}

/**
 * Scan a metric ring-buffer and return the most-recent 10 crisis events
 * in reverse chronological order, each annotated with its approximate
 * duration (ticks from onset until crisis_kind first returns to 0).
 */
export function buildCrisisHistory(rows: TickRow[]): CrisisRecord[] {
  const records: CrisisRecord[] = [];
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const curr = rows[i];
    if (prev.crisis_kind === 0 && curr.crisis_kind !== 0) {
      let endTick = curr.tick;
      for (let j = i + 1; j < rows.length; j++) {
        if (rows[j].crisis_kind === 0) { endTick = rows[j].tick; break; }
        endTick = rows[j].tick;
      }
      records.push({ tick: curr.tick, kind: curr.crisis_kind, duration: endTick - curr.tick });
    }
  }
  return records.slice(-10).reverse();
}

/**
 * Scan a metric ring-buffer and return a mapping from civic-right bit to the
 * first tick at which that bit was set in `rights_granted_bits`.
 *
 * Only bits present in `civicRights` are reported.
 */
export function buildRightsGrantedAt(
  rows: TickRow[],
  civicRights: ReadonlyArray<{ bit: number }>,
): Record<number, number> {
  const result: Record<number, number> = {};
  for (const row of rows) {
    for (const r of civicRights) {
      if (!(r.bit in result) && (row.rights_granted_bits & r.bit) !== 0) {
        result[r.bit] = row.tick;
      }
    }
  }
  return result;
}
