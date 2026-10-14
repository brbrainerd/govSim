import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Hemicycle from './Hemicycle.svelte';
import { tally } from '../engine/congress';

describe('Hemicycle component (JUICE-01)', () => {
  it('renders hemicycle with baseline seats and counts', () => {
    const whip = tally([]);
    const { html } = render(Hemicycle, {
      props: {
        whip,
        deals: [],
        houseSeatDelta: 0,
        passed: false,
      },
    });

    expect(html).toContain('votes yes');
    expect(html).toContain('218 needed');
    // Baseline seats do not have seat-deal class
    expect(html).not.toMatch(/class="[^"]*seat-deal/);
  });

  it('renders flipped seats with seat-deal class when deals are enacted', () => {
    const whipWithDeals = tally(['cen', 'spc']);
    const { html } = render(Hemicycle, {
      props: {
        whip: whipWithDeals,
        deals: ['cen', 'spc'],
        houseSeatDelta: 0,
        passed: false,
      },
    });

    expect(html).toMatch(/class="[^"]*seat-deal/);
  });
});
