// Lasting and delayed effects (FND-06, roadmap success criterion 2). Phases 4 and 5 add content: events,
// executive orders and laws are Modifiers; rulings and other delayed effects are Scheduled items.
// Every random outcome inside a resolver must use a keyed draw such as draw(seed, 'court', turn, item.id),
// never sequential randomness, so adding or resolving an item cannot move any other draw (FND-01).
import type { GameState, LogEntry } from './game';
import { resolveCourtRuling } from './powers';

/** Where a modifier lands: gap/inflation/expected/approval/trust/clout on their indicator, potential on growth, debtBn on debtPct, fedTarget on fedRate. */
export type Channel = 'gap' | 'inflation' | 'expected' | 'approval' | 'trust' | 'potential' | 'debtBn' | 'clout' | 'fedTarget';

export interface Modifier {
  id: string; // unique per instance, e.g. 'eo:buyAmerican#t5'
  group: string; // what a revoke or ruling ends together
  source: string; // trace source id (event:, eo: or law: family)
  channel: Channel;
  amount: number; // added to the channel in every step whose starting turn t has from <= t <= until
  from: number;
  until: number; // FOREVER, never Infinity: it must survive JSON
  tag: 'event' | 'eo' | 'law';
}

export interface Scheduled { id: string; kind: string; due: number; data: Record<string, string | number> }
export interface ResolverResult { add?: Modifier[]; endGroups?: string[]; log?: LogEntry[] }
export type Resolver = (ctx: { seed: number; turn: number; state: GameState; item: Scheduled }) => ResolverResult;

const disasterRallyResolver: Resolver = () => ({
  log: [{ kind: 'event', id: 'disaster_rally_ended', detail: 'Public approval rally from emergency disaster response has subsided.' }],
});

/** Registry of resolvers for scheduled delayed effects (EVT-06, RPT-04, PWR-02). */
export const RESOLVERS: Record<string, Resolver> = {
  disaster_rally: disasterRallyResolver,
  court_ruling: resolveCourtRuling,
};

/** The modifiers acting in the step that starts at `turn`; executive orders do not carry into the legacy projection (D5). */
export const activeAt = (mods: readonly Modifier[], turn: number, legacy: boolean): Modifier[] =>
  mods.filter((m) => m.from <= turn && turn <= m.until && !(legacy && m.tag === 'eo'));
