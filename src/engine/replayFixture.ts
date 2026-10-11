// Fixture input logs and their per-turn hash chains (FND-02). This file is the cross-browser bundle
// entry (plan 01-04): browsers are compared with Node live, not with committed hashes (Pitfall 2);
// goldens are Phase 2.
import { fromPackage } from './budget';
import { enact, START } from './fixture';
import { endTurn, finalScore, newGame, TOTAL_TURNS, type Decisions } from './game';
import { stableHash } from './hash';

/** A recorded game: seed plus the Decisions made on each turn. JSON round-trips. */
export interface Log { name: string; seed: number; inputs: Record<number, Decisions> }

export const LOGS: readonly Log[] = [
  { name: 'autopilot', seed: 1, inputs: {} },
  { name: 'infrastructure', seed: 7, inputs: { 1: enact(fromPackage('Infrastructure push')) } },
  { name: 'tax-cut', seed: 42, inputs: { 1: enact(fromPackage('Tax cut')) } },
  { name: 'tariffs-35', seed: 99, inputs: { 5: enact({ ...fromPackage('Keep as is'), tar: 35 }) } },
  { name: 'balance', seed: 2026, inputs: { 3: enact(fromPackage('Balance the budget')) } },
  // Negative on purpose: Session seeds are Date.now() | 0, an int32 that may be negative.
  { name: 'negative-seed', seed: -31337, inputs: {} },
];

/** 31 state hashes (one per endTurn) followed by the hash of finalScore. */
export function chain(log: Log): string[] {
  let s = newGame(log.seed, START);
  const out: string[] = [];
  for (let t = 1; t < TOTAL_TURNS; t++) {
    s = endTurn(s, log.inputs[t]);
    out.push(stableHash(s));
  }
  out.push(stableHash(finalScore(s)));
  return out;
}

export function runFixture(): string {
  return JSON.stringify(Object.fromEntries(LOGS.map((l) => [l.name, chain(l)])));
}
