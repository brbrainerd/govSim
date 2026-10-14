import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Character, { type Look, type Mood } from './Character.svelte';

const BASE_LOOK: Look = {
  skin: 'skin-1',
  hair: 'hair-1',
  hairStyle: 'parted',
  suit: 'ink',
  tie: 'alert',
};

describe('Character component (ART-01)', () => {
  it('renders all 5 moods and outputs data-mood with distinct expressions', () => {
    const moods: Mood[] = ['confident', 'stressed', 'scheming', 'panicked', 'triumphant'];

    for (const mood of moods) {
      const { html } = render(Character, {
        props: {
          look: BASE_LOOK,
          mood,
        },
      });

      expect(html).toContain(`data-mood="${mood}"`);
      expect(html).toMatch(/class="[^"]*head/);
      expect(html).toMatch(/class="[^"]*ears/);
      expect(html).toMatch(/class="[^"]*eyebrows/);
      expect(html).toMatch(/class="[^"]*eyes blink/);

      if (mood === 'stressed') {
        expect(html).toContain('data-testid="char-sweat"');
      } else if (mood === 'panicked') {
        expect(html).toContain('data-testid="char-sweat"');
      } else if (mood === 'triumphant') {
        expect(html).toContain('data-testid="char-sparkle"');
      }
    }
  });

  it('renders varied hairstyles and accessories cleanly', () => {
    const hairstyles = ['short', 'side', 'bun', 'swept', 'cropped', 'parted'] as const;

    for (const hairStyle of hairstyles) {
      const { html } = render(Character, {
        props: {
          look: {
            ...BASE_LOOK,
            hairStyle,
            glasses: true,
            pearls: true,
          },
          pose: 'point',
          prop: 'clipboard',
        },
      });

      expect(html).toContain('data-pose="point"');
      expect(html).toMatch(/class="[^"]*pearls/);
    }
  });

  it('renders props: coffee, folder, gavel, mic', () => {
    for (const prop of ['coffee', 'folder', 'gavel', 'mic'] as const) {
      const { html } = render(Character, {
        props: {
          look: BASE_LOOK,
          prop,
        },
      });
      expect(html).toMatch(/class="[^"]*breathe/);
    }
  });
});
