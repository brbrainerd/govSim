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

  it('renders Foreign Policy & National Security card with defense posture and sanctions (FORPOL-01, FORPOL-02)', () => {
    const session = new Session(1, START, { party: 'D' });
    const { html } = render(Powers, {
      props: {
        session,
        question: 'What orders will you sign?',
      },
    });

    expect(html).toContain('data-testid="foreign-policy-section"');
    expect(html).toContain('Defense Posture &amp; Targeted Sanctions');
    expect(html).toContain('data-testid="defense-posture-selector"');
    expect(html).toContain('Peacetime Drawdown');
    expect(html).toContain('Standard Readiness');
    expect(html).toContain('Forward Surge');
    expect(html).toContain('data-testid="targeted-sanctions-list"');
    expect(html).toContain('Targeted Financial Asset Freezes');
    expect(html).toContain('Advanced Technology &amp; Defense Export Restrictions');
    expect(html).toContain('Maritime Energy Shipping &amp; Secondary Sanctions');
    expect(html).toContain('Myth? Does foreign aid cause the deficit');
  });
});
