import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Session } from '../app/session.svelte';
import { START } from '../engine/fixture';
import Budget from './Budget.svelte';

describe('Budget screen component (FORPOL-01, FORPOL-03)', () => {
  it('renders Budget screen with foreign assistance slider and myth card ticket', () => {
    const session = new Session(1, START, { party: 'D' });
    const { html } = render(Budget, {
      props: {
        session,
        question: 'How should we tax and spend?',
        go: () => {},
      },
    });

    expect(html).toContain('How should we tax and spend?');
    expect(html).toContain('Foreign Assistance &amp; Aid');
    expect(html).toContain('Same as now ($45B/yr, &lt;1%)');
    expect(html).toContain('foreign-assistance-slider');
    expect(html).toContain('Myth? Cut foreign aid to balance it');
  });
});
