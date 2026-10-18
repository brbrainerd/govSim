import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Session } from '../app/session.svelte';
import { START } from '../engine/fixture';
import OvalOffice from './OvalOffice.svelte';

describe('OvalOffice screen component (UI-01, UI-02)', () => {
  it('renders standard Oval Office screen with prosperity index', () => {
    const session = new Session(1, START, { party: 'D' });
    const { html } = render(OvalOffice, {
      props: {
        session,
        question: 'What needs you this turn?',
        go: () => {},
      },
    });

    expect(html).toContain('What needs you this turn?');
    expect(html).toContain('How America is doing');
    expect(html).toContain('data-testid="oval-news-chyron"');
    expect(html).toContain('data-testid="oval-exec-chair"');
    expect(html).toContain('data-testid="oval-advisor-portrait"');
    expect(html).not.toContain('data-testid="evil-situation-card"');
    expect(html).not.toContain('data-testid="oval-offshore-stash"');
    expect(html).not.toContain('data-testid="oval-evil-lamp-cone"');
  });

  it('renders Evil Mode Oval Office screen with loot score, banker lamp, cash stacks, and Fixer portraits', () => {
    const session = new Session(1, START, { party: 'D', evilMode: true, presidentLook: 2 });
    const { html } = render(OvalOffice, {
      props: {
        session,
        question: 'What needs you this turn?',
        go: () => {},
      },
    });

    expect(html).toContain('What needs you this turn?');
    expect(html).toContain('How the loot is doing');
    expect(html).toContain('data-testid="oval-news-chyron"');
    expect(html).toContain('data-testid="oval-offshore-stash"');
    expect(html).toContain('Offshore Stash');
    expect(html).toContain('data-testid="evil-situation-card"');
    expect(html).toContain('KLEPTOCRATIC INTEL');
    expect(html).toContain('Investigation Heat Gauge');
    expect(html).toContain('data-testid="goto-corrupt-levers-btn"');
    expect(html).toContain('Enact Corrupt Levers');
    expect(html).toContain('data-testid="oval-exec-chair"');
    expect(html).toContain('data-testid="oval-evil-lamp-cone"');
    expect(html).toContain('data-testid="oval-evil-cash-stacks"');
    expect(html).toContain('data-pose="cash"');
    expect(html).toContain('data-testid="oval-advisor-portrait"');
    expect(html).toContain('FIXER');
  });
});
