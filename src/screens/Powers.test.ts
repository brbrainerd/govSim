import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Session } from '../app/session.svelte';
import { START } from '../engine/fixture';
import Powers from './Powers.svelte';

describe('Powers screen component (REF-02, REF-03)', () => {
  it('renders Powers screen with judicial reform trigger, court bench, and electoral reforms card', () => {
    const session = new Session(1, START, { party: 'D' });
    const { html } = render(Powers, {
      props: {
        session,
        question: 'What orders will you sign?',
      },
    });

    expect(html).toContain('What orders will you sign?');
    expect(html).toContain('data-testid="open-judicial-reform-modal"');
    expect(html).toContain('Judicial Reforms...');
    expect(html).toContain('Supreme Court · leans 6–3');
    expect(html).toContain('data-testid="court-bench"');
    expect(html).toContain('data-testid="electoral-reforms-card"');
    expect(html).toContain('Ranked-Choice Voting Grants');
    expect(html).toContain('Independent Redistricting');
    expect(html).toContain('Small-Dollar Donor Matching');
  });
});
