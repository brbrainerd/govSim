// Fixture input logs and their per-turn hash chains (FND-02). This file is the cross-browser bundle
// entry (plan 01-04): browsers are compared with Node live, not with committed hashes (Pitfall 2);
// goldens are Phase 2.
import { fromPackage } from './budget';
import { enact, START } from './fixture';
import { endTurn, finalScore, newGame, TOTAL_TURNS, type Decisions, type GameState, type StepOptions } from './game';
import { stableHash } from './hash';
import type { Modifier, Resolver } from './modifiers';
import { draw } from './rng';
import { FOREVER } from './units';

/**
 * A recorded game: seed plus the Decisions made on each turn (these JSON round-trip). `setup` and
 * `resolvers` are code, used only by fixtures that exercise modifiers and scheduled items.
 */
export interface Log {
  name: string;
  seed: number;
  inputs: Record<number, Decisions>;
  setup?: (s: GameState) => GameState;
  resolvers?: StepOptions['resolvers'];
}

const fixtureMod = (o: Pick<Modifier, 'id' | 'group' | 'source' | 'channel' | 'amount' | 'tag'> & Partial<Modifier>): Modifier => ({ from: 1, until: FOREVER, ...o });
/** Ends the eo group on one side of a keyed court draw, otherwise adds a law modifier. */
const fixtureResolver: Resolver = ({ seed, turn, item }) =>
  draw(seed, 'court', turn, item.id) < 0.5
    ? { endGroups: ['eo:fixture'], log: [{ kind: 'ruling', id: 'struck' }] }
    : { add: [fixtureMod({ id: 'law:fixture#1', group: 'law:fixture', source: 'law:fixture', channel: 'potential', amount: 0.1, tag: 'law', from: turn })], log: [{ kind: 'ruling', id: 'upheld' }] };

export const LOGS: readonly Log[] = [
  { name: 'autopilot', seed: 1, inputs: {} },
  { name: 'infrastructure', seed: 7, inputs: { 1: enact(fromPackage('Infrastructure push')) } },
  { name: 'tax-cut', seed: 42, inputs: { 1: enact(fromPackage('Tax cut')) } },
  { name: 'tariffs-35', seed: 99, inputs: { 5: enact({ ...fromPackage('Keep as is'), tar: 35 }) } },
  { name: 'balance', seed: 2026, inputs: { 3: enact(fromPackage('Balance the budget')) } },
  // Negative on purpose: Session seeds are Date.now() | 0, an int32 that may be negative.
  { name: 'negative-seed', seed: -31337, inputs: {} },
  // A bill with no deals fails the House vote.
  { name: 'failing-bill', seed: 5, inputs: { 2: { bill: { budget: fromPackage('Tax cut'), deals: [] } } } },
  // 30 clout cannot pay for all three deals (45): the bill is rejected as unaffordable.
  { name: 'unaffordable-bill', seed: 6, inputs: { 1: enact(fromPackage('Tax cut')) }, setup: (s) => ({ ...s, clout: 30 }) },
  // Active eo and event modifiers plus a scheduled item resolved by a keyed draw; the legacy projection in finalScore sees them too.
  {
    name: 'modifiers', seed: 8, inputs: { 2: enact(fromPackage('Infrastructure push')) },
    setup: (s) => ({
      ...s,
      modifiers: [
        fixtureMod({ id: 'eo:fixture#1', group: 'eo:fixture', source: 'eo:fixture', channel: 'gap', amount: 0.2, tag: 'eo' }),
        fixtureMod({ id: 'event:fixture#1', group: 'event:fixture', source: 'event:fixture', channel: 'approval', amount: 0.5, tag: 'event' }),
      ],
      scheduled: [{ id: 'fixture-ruling', kind: 'fixture', due: 4, data: {} }],
    }),
    resolvers: { fixture: fixtureResolver },
  },
];

/** 31 state hashes (one per endTurn) followed by the hash of finalScore. */
export function chain(log: Log): string[] {
  let s = newGame(log.seed, START);
  if (log.setup) s = log.setup(s);
  const out: string[] = [];
  for (let t = 1; t < TOTAL_TURNS; t++) {
    s = endTurn(s, log.inputs[t], { resolvers: log.resolvers });
    out.push(stableHash(s));
  }
  out.push(stableHash(finalScore(s)));
  return out;
}

export function runFixture(): string {
  return JSON.stringify(Object.fromEntries(LOGS.map((l) => [l.name, chain(l)])));
}
