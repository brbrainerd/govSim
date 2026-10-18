import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import CharacterPortrait from './CharacterPortrait.svelte';
import type { Look, Mood } from './Character.svelte';

const NURSE_LOOK: Look = {
  skin: 'skin-2',
  hair: 'hair-1',
  hairStyle: 'bun',
  suit: 'sky',
  outfit: 'scrubs',
};

describe('CharacterPortrait medallion component (GFX-03)', () => {
  it('renders circular medallion busts across all moods with appropriate backdrop accents', () => {
    const moods: Mood[] = ['confident', 'stressed', 'scheming', 'panicked', 'triumphant', 'facepalm'];

    for (const mood of moods) {
      const { html } = render(CharacterPortrait, {
        props: {
          look: NURSE_LOOK,
          mood,
          size: 60,
          label: `Nurse portrait (${mood})`,
          badgeText: 'RN',
          testId: `portrait-${mood}`,
        },
      });

      expect(html).toContain(`data-testid="portrait-${mood}"`);
      expect(html).toContain(`data-mood="${mood}"`);
      expect(html).toContain(`aria-label="Nurse portrait (${mood})"`);
      expect(html).toContain(`data-testid="portrait-${mood}-badge"`);
      expect(html).toContain('RN');

      if (mood === 'triumphant') {
        expect(html).toContain('data-testid="portrait-confetti"');
        expect(html).toContain('data-pose="celebrate"');
      } else if (mood === 'facepalm') {
        expect(html).toContain('data-pose="facepalm"');
        expect(html).toContain('data-testid="char-facepalm-hand"');
      } else if (mood === 'panicked') {
        expect(html).toContain('data-testid="char-panic-dread"');
      }
    }
  });
});
