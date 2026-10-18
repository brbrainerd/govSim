import { describe, expect, it } from 'vitest';
import { fleschKincaid } from 'flesch-kincaid';
import { syllable } from 'syllable';
import {
  ARCHETYPES,
  applyArchetypeToInitialState,
  getArchetype,
  isValidArchetypeId,
} from './archetypes';
import { getPerk } from './perks';
import { fromData, us } from '../data/us';
import { newGame } from '../engine/game';
import { Session } from '../app/session.svelte';
import { parseSave, serializeSave } from '../app/save';
import { decodeRunCode, encodeRunCode } from '../app/share';

function readingGrade(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const syl = words.reduce((acc, w) => acc + Math.max(1, syllable(w)), 0);
  return fleschKincaid({
    sentence: Math.max(1, sentences.length),
    word: Math.max(1, words.length),
    syllable: Math.max(1, syl),
  });
}

describe('Presidential Playstyle Archetypes (ARCH-01)', () => {
  it('defines all 5 archetypes with valid starting perks and reading grade <= 9.0', () => {
    expect(ARCHETYPES).toHaveLength(5);
    const ids = ARCHETYPES.map((a) => a.id);
    expect(ids).toEqual(['dealmaker', 'technocrat', 'populist', 'insider', 'purist']);

    for (const arch of ARCHETYPES) {
      expect(isValidArchetypeId(arch.id)).toBe(true);
      expect(getArchetype(arch.id)?.name).toBe(arch.name);
      expect(getPerk(arch.startingPerkId)).toBeDefined();
      expect(getPerk(arch.evilStartingPerkId)).toBeDefined();
      expect(readingGrade(arch.summary)).toBeLessThanOrEqual(9.0);
    }
  });

  it('applies starting relic, modifiers, and indicator deltas unless classicSim is enabled', () => {
    const base = newGame(42, fromData(us));
    const dealmakerState = applyArchetypeToInitialState(base, 'dealmaker', false, false);
    expect(dealmakerState.clout).toBe(base.clout + 10);
    expect(dealmakerState.activePerks).toContain('tf_bipartisan_liaison');
    expect(dealmakerState.modifiers.some((m) => m.source === 'perk:tf_bipartisan_liaison')).toBe(true);

    const evilDealmaker = applyArchetypeToInitialState(base, 'dealmaker', true, false);
    expect(evilDealmaker.activePerks).toContain('relic_bagman_retainer');
    expect(evilDealmaker.modifiers.some((m) => m.source === 'perk:relic_bagman_retainer')).toBe(true);

    const classicState = applyArchetypeToInitialState(base, 'dealmaker', false, true);
    expect(classicState.clout).toBe(base.clout);
    expect(classicState.activePerks ?? []).toHaveLength(0);
  });

  it('persists archetype, presidentLook, and showMyths across SaveFile and URL run share encoding', async () => {
    const session = new Session(
      1234,
      fromData(us),
      { party: 'D', archetype: 'technocrat', presidentLook: 2, showMyths: false },
      { skipAutosave: true },
    );
    expect(session.activeArchetype?.id).toBe('technocrat');
    expect(session.activePerks).toContain('tf_semiconductor_fab');

    session.nextTurn();
    const json = serializeSave(session);
    const parsed = parseSave(json);
    expect(parsed.options.archetype).toBe('technocrat');
    expect(parsed.options.presidentLook).toBe(2);
    expect(parsed.options.showMyths).toBe(false);

    const code = await encodeRunCode(session);
    const decoded = await decodeRunCode(code);
    expect(decoded?.archetype).toBe('technocrat');
    expect(decoded?.presidentLook).toBe(2);
    expect(decoded?.showMyths).toBe(false);

    const replayed = Session.fromRun(decoded!, fromData(us));
    expect(replayed.options.presidentLook).toBe(2);
    expect(replayed.options.showMyths).toBe(false);
  });
});
