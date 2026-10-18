// Persistent localStorage Silver & Gold Mastery Stars per Archetype and Scenario (ARCH-02).

import { isValidArchetypeId, type ArchetypeId } from '../content/archetypes';
import { isValidScenarioId, type ScenarioId } from '../content/scenarios';
import type { SimpleStorage } from './save';

export type MasteryTier = 'none' | 'silver' | 'gold';
export type MasteryArchetypeKey = ArchetypeId | 'standard';

export const MASTERY_STORAGE_KEY = 'govsim_mastery_v1';

export interface MasteryRecord {
  readonly archetypes: Partial<Record<MasteryArchetypeKey, MasteryTier>>;
  readonly scenarios: Partial<Record<ScenarioId, MasteryTier>>;
}

export interface RunMasteryInput {
  readonly archetype?: ArchetypeId;
  readonly scenario?: ScenarioId;
  readonly isEvilMode: boolean;
  readonly convicted: boolean;
  readonly reelectionWon: boolean;
  readonly scoreVsAutopilot: number;
  readonly offshoreStashBn: number;
}

const EMPTY_MASTERY: MasteryRecord = {
  archetypes: {},
  scenarios: {},
};

function resolveStorage(custom?: SimpleStorage): SimpleStorage | null {
  if (custom) return custom;
  try {
    if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
      return localStorage;
    }
  } catch {}
  return null;
}

export function masteryRank(tier?: MasteryTier): number {
  if (tier === 'gold') return 2;
  if (tier === 'silver') return 1;
  return 0;
}

function isValidTier(v: unknown): v is MasteryTier {
  return v === 'none' || v === 'silver' || v === 'gold';
}

export function evaluateRunMastery(input: RunMasteryInput): MasteryTier {
  if (input.isEvilMode) {
    if (input.convicted) return 'none';
    if (input.offshoreStashBn >= 20) return 'gold';
    if (input.offshoreStashBn >= 5) return 'silver';
    return 'none';
  }
  if (!input.reelectionWon) return 'none';
  if (input.scoreVsAutopilot >= 5.0) return 'gold';
  if (input.scoreVsAutopilot > 0) return 'silver';
  return 'none';
}

export function loadMastery(storage?: SimpleStorage): MasteryRecord {
  try {
    const s = resolveStorage(storage);
    if (!s) return EMPTY_MASTERY;
    const raw = s.getItem(MASTERY_STORAGE_KEY);
    if (!raw) return EMPTY_MASTERY;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return EMPTY_MASTERY;

    const archetypes: Partial<Record<MasteryArchetypeKey, MasteryTier>> = {};
    if (parsed.archetypes && typeof parsed.archetypes === 'object') {
      for (const [k, v] of Object.entries(parsed.archetypes as Record<string, unknown>)) {
        if ((k === 'standard' || isValidArchetypeId(k)) && isValidTier(v) && v !== 'none') {
          archetypes[k as MasteryArchetypeKey] = v;
        }
      }
    }

    const scenarios: Partial<Record<ScenarioId, MasteryTier>> = {};
    if (parsed.scenarios && typeof parsed.scenarios === 'object') {
      for (const [k, v] of Object.entries(parsed.scenarios as Record<string, unknown>)) {
        if (isValidScenarioId(k) && isValidTier(v) && v !== 'none') {
          scenarios[k] = v;
        }
      }
    }

    return { archetypes, scenarios };
  } catch {
    return EMPTY_MASTERY;
  }
}

export function recordRunMastery(
  input: RunMasteryInput,
  storage?: SimpleStorage,
): { earnedTier: MasteryTier; record: MasteryRecord } {
  const earnedTier = evaluateRunMastery(input);
  const current = loadMastery(storage);
  if (earnedTier === 'none') {
    return { earnedTier, record: current };
  }

  const archKey: MasteryArchetypeKey = input.archetype ?? 'standard';
  const scenKey: ScenarioId = input.scenario ?? 'standard_2026';

  const prevArch = current.archetypes[archKey] ?? 'none';
  const prevScen = current.scenarios[scenKey] ?? 'none';

  const nextArch = masteryRank(earnedTier) > masteryRank(prevArch) ? earnedTier : prevArch;
  const nextScen = masteryRank(earnedTier) > masteryRank(prevScen) ? earnedTier : prevScen;

  const nextRecord: MasteryRecord = {
    archetypes: {
      ...current.archetypes,
      [archKey]: nextArch,
    },
    scenarios: {
      ...current.scenarios,
      [scenKey]: nextScen,
    },
  };

  try {
    const s = resolveStorage(storage);
    s?.setItem(MASTERY_STORAGE_KEY, JSON.stringify(nextRecord));
  } catch {}

  return { earnedTier, record: nextRecord };
}

export function formatMasteryStars(tier?: MasteryTier): string {
  if (tier === 'gold') return '★★';
  if (tier === 'silver') return '★☆';
  return '☆☆';
}

export function masteryLabel(tier?: MasteryTier): string {
  if (tier === 'gold') return 'Gold Mastery';
  if (tier === 'silver') return 'Silver Mastery';
  return 'Unmastered';
}
