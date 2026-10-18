// Selectable Presidential Playstyle Archetypes catalog and starting state modifiers (ARCH-01).
// All strings adhere to Flesch-Kincaid reading grade <= 9.0 and <= 20 words per sentence.

import type { GameState } from '../engine/game';
import type { DoctrineTag } from './perks';

export type ArchetypeId = 'dealmaker' | 'technocrat' | 'populist' | 'insider' | 'purist';

export interface PresidentialArchetype {
  readonly id: ArchetypeId;
  readonly name: string;
  readonly shortName: string;
  readonly icon: string;
  readonly tag: string;
  readonly summary: string;
  readonly passiveLabel: string;
  readonly evilPassiveLabel: string;
  readonly startingPerkId: string;
  readonly evilStartingPerkId: string;
  readonly startingCloutDelta: number;
  readonly startingApprovalDelta: number;
  readonly startingTrustDelta: number;
  readonly favoredDoctrine: DoctrineTag;
}

export const ARCHETYPES: readonly PresidentialArchetype[] = [
  {
    id: 'dealmaker',
    name: 'The Deal-Maker',
    shortName: 'Deal-Maker',
    icon: '🤝',
    tag: 'Floor Broker',
    summary: 'You trade favors across the aisle to pass big bills early in your term.',
    passiveLabel: '+10 Clout · Whip Liaison relic',
    evilPassiveLabel: '+10 Clout · Bagman Retainer relic',
    startingPerkId: 'tf_bipartisan_liaison',
    evilStartingPerkId: 'relic_bagman_retainer',
    startingCloutDelta: 10,
    startingApprovalDelta: 0,
    startingTrustDelta: 0,
    favoredDoctrine: 'institutionalist',
  },
  {
    id: 'technocrat',
    name: 'The Technocrat',
    shortName: 'Technocrat',
    icon: '📊',
    tag: 'Policy Planner',
    summary: 'You rely on hard data and long-term growth plans rather than flashy speeches.',
    passiveLabel: '+2 Trust, -2% Approval · Chip Fab relic',
    evilPassiveLabel: '+2 Trust, -2% Approval · Cayman Trust relic',
    startingPerkId: 'tf_semiconductor_fab',
    evilStartingPerkId: 'relic_cayman_trust',
    startingCloutDelta: 0,
    startingApprovalDelta: -2,
    startingTrustDelta: 2,
    favoredDoctrine: 'industrial',
  },
  {
    id: 'populist',
    name: 'The Populist Firebrand',
    shortName: 'Firebrand',
    icon: '📣',
    tag: 'Bully Pulpit',
    summary: 'You rally crowds on TV to pressure Congress, trading calm trust for loud momentum.',
    passiveLabel: '+3% Approval, -2 Trust · Junk Fee Strike relic',
    evilPassiveLabel: '+3% Approval, -2 Trust · Crypto Mixer relic',
    startingPerkId: 'tf_junk_fee_strike',
    evilStartingPerkId: 'relic_crypto_mixer',
    startingCloutDelta: 5,
    startingApprovalDelta: 3,
    startingTrustDelta: -2,
    favoredDoctrine: 'main_street',
  },
  {
    id: 'insider',
    name: 'The Beltway Insider',
    shortName: 'Insider',
    icon: '🏛️',
    tag: 'Whip Operator',
    summary: 'You know every committee chair in town, giving you deep clout from day one.',
    passiveLabel: '+15 Clout, -1 Trust · Cyber Shield relic',
    evilPassiveLabel: '+15 Clout, -1 Trust · Acting Directors relic',
    startingPerkId: 'tf_cyber_shield',
    evilStartingPerkId: 'relic_acting_directors',
    startingCloutDelta: 15,
    startingApprovalDelta: 0,
    startingTrustDelta: -1,
    favoredDoctrine: 'security',
  },
  {
    id: 'purist',
    name: 'The Constitutional Purist',
    shortName: 'Purist',
    icon: '⚖️',
    tag: 'Rule Guardian',
    summary: 'You guard clean governance and public trust while refusing backroom horse trades.',
    passiveLabel: '+4 Trust, -5 Clout · Inspector Hotline relic',
    evilPassiveLabel: '+4 Trust, -5 Clout · Gag Order relic',
    startingPerkId: 'tf_inspector_hotline',
    evilStartingPerkId: 'relic_inspector_gag_order',
    startingCloutDelta: -5,
    startingApprovalDelta: 1,
    startingTrustDelta: 4,
    favoredDoctrine: 'institutionalist',
  },
];

export function isValidArchetypeId(val: unknown): val is ArchetypeId {
  return typeof val === 'string' && ARCHETYPES.some((a) => a.id === val);
}

export function getArchetype(id?: ArchetypeId): PresidentialArchetype | undefined {
  if (!id) return undefined;
  return ARCHETYPES.find((a) => a.id === id);
}

/**
 * Deterministically applies a selected Presidential Playstyle Archetype's starting
 * relic and passive indicator offsets to an initial Turn 1 GameState (ARCH-01).
 * No-op when archetypeId is undefined or classicSim is enabled.
 */
export function applyArchetypeToInitialState(
  state: GameState,
  archetypeId?: ArchetypeId,
  evilMode = false,
  classicSim = false,
): GameState {
  if (!archetypeId || classicSim) return state;
  const arch = getArchetype(archetypeId);
  if (!arch) return state;

  const startingPerk = evilMode ? arch.evilStartingPerkId : arch.startingPerkId;
  const existingPerks = state.activePerks ?? [];
  const nextPerks = existingPerks.includes(startingPerk)
    ? existingPerks
    : [...existingPerks, startingPerk];

  return {
    ...state,
    clout: Math.max(0, state.clout + arch.startingCloutDelta),
    approval: Math.max(0, Math.min(100, state.approval + arch.startingApprovalDelta)),
    econ: {
      ...state.econ,
      trust: Math.max(5, Math.min(80, state.econ.trust + arch.startingTrustDelta)),
    },
    activePerks: nextPerks,
  };
}
