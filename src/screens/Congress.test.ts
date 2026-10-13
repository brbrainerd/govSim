import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Session } from '../app/session.svelte';
import { START } from '../engine/fixture';
import Congress from './Congress.svelte';

describe('Congress screen component (REF-01, REF-04)', () => {
  it('renders Congress screen with filibuster rule button and amendment trigger', () => {
    const session = new Session(1, START, { party: 'D' });
    const { html } = render(Congress, {
      props: {
        session,
        question: 'Can you pass your bill?',
      },
    });

    expect(html).toContain('Can you pass your bill?');
    expect(html).toContain('data-testid="open-filibuster-modal"');
    expect(html).toContain('Senate Cloture: 60 votes (60-Vote Cloture)');
    expect(html).toContain('data-testid="open-amendment-modal"');
    expect(html).toContain('Article V Amendments');
    expect(html).toContain('218 needed');
    expect(html).toContain('data-testid="auto-whip-btn"');
    expect(html).toContain('Auto-whip (2 deals, 25 clout)');
  });
});
