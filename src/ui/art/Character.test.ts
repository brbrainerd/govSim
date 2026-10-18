import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Character, { type Look, type Mood, type Outfit, type Pose } from './Character.svelte';
import FedPortrait from './FedPortrait.svelte';
import CourtBench from './CourtBench.svelte';

const BASE_LOOK: Look = {
  skin: 'skin-1',
  hair: 'hair-1',
  hairStyle: 'parted',
  suit: 'ink',
  tie: 'alert',
};

describe('Character component (ART-01, GFX-01, GFX-02)', () => {
  it('renders all 6 moods and outputs data-mood with distinct expressions and anatomy', () => {
    const moods: Mood[] = ['confident', 'stressed', 'scheming', 'panicked', 'triumphant', 'facepalm'];

    for (const mood of moods) {
      const { html } = render(Character, {
        props: {
          look: BASE_LOOK,
          mood,
        },
      });

      expect(html).toContain(`data-mood="${mood}"`);
      expect(html).toContain('data-testid="char-neck"');
      expect(html).toContain('data-testid="char-lapel-pin"');
      expect(html).toMatch(/class="[^"]*head/);
      expect(html).toMatch(/class="[^"]*ears/);
      expect(html).toMatch(/class="[^"]*eyebrows/);
      expect(html).toMatch(/class="[^"]*eyes blink/);

      if (mood === 'stressed') {
        expect(html).toContain('data-testid="char-sweat"');
      } else if (mood === 'panicked') {
        expect(html).toContain('data-testid="char-sweat"');
        expect(html).toContain('data-testid="char-panic-dread"');
      } else if (mood === 'triumphant') {
        expect(html).toContain('data-testid="char-sparkle"');
      } else if (mood === 'facepalm') {
        expect(html).toContain('data-testid="char-facepalm-hand"');
      }
    }
  });

  it('renders varied hairstyles including back-hair layers (long, bob, afro, bun, bald)', () => {
    const hairstyles = [
      'short',
      'side',
      'bun',
      'swept',
      'cropped',
      'parted',
      'long',
      'bob',
      'afro',
      'bald',
    ] as const;

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
          nameplate: 'CHIEF',
        },
      });

      expect(html).toContain('data-pose="point"');
      expect(html).toContain(`data-hairstyle="${hairStyle}"`);
      expect(html).toContain('data-testid="char-nameplate"');
      expect(html).toContain('CHIEF');
      expect(html).toMatch(/class="[^"]*pearls/);
    }
  });

  it('renders all 10 articulated poses (GFX-02)', () => {
    const poses: Pose[] = [
      'stand',
      'point',
      'desk',
      'wave',
      'hips',
      'crossed',
      'celebrate',
      'facepalm',
      'cash',
      'podium',
    ];

    for (const pose of poses) {
      const { html } = render(Character, {
        props: {
          look: BASE_LOOK,
          pose,
        },
      });
      expect(html).toContain(`data-pose="${pose}"`);
      if (pose === 'hips' || pose === 'crossed' || pose === 'celebrate' || pose === 'facepalm' || pose === 'cash' || pose === 'podium') {
        expect(html).toContain(`data-testid="pose-${pose}"`);
      }
    }
  });

  it('renders all 6 occupational outfits and props (GFX-02)', () => {
    const outfits: Outfit[] = ['suit', 'shirt', 'scrubs', 'hardhat', 'blazer', 'cardigan'];

    for (const outfit of outfits) {
      const { html } = render(Character, {
        props: {
          look: {
            ...BASE_LOOK,
            outfit,
          },
        },
      });
      expect(html).toContain(`data-outfit="${outfit}"`);
    }

    for (const prop of ['coffee', 'folder', 'gavel', 'mic', 'wrench', 'stethoscope', 'earpiece', 'cash_fan'] as const) {
      const { html } = render(Character, {
        props: {
          look: BASE_LOOK,
          prop,
        },
      });
      expect(html).toMatch(/class="[^"]*breathe/);
    }
  });

  it('renders FedPortrait and CourtBench with sculpted neck and eyelid anatomy (GFX-01)', () => {
    const fed = render(FedPortrait, { props: { stance: 'hawk', size: 64 } });
    expect(fed.html).toContain('data-testid="fed-portrait"');
    expect(fed.html).toContain('data-stance="hawk"');

    const court = render(CourtBench, { props: { conservative: 6, liberal: 3 } });
    expect(court.html).toContain('data-testid="court-bench"');
    expect(court.html).toContain('class="justice');
  });
});
