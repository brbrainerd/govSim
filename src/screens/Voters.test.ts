import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Session } from '../app/session.svelte';
import { START } from '../engine/fixture';
import Voters from './Voters.svelte';

describe('Voters screen component (VOT-01..VOT-03)', () => {
  it('renders initial map view with 270 bar and tipping-point indicator', () => {
    const session = new Session(1, START, { party: 'D' });
    const { html } = render(Voters, {
      props: {
        session,
        question: 'Who supports you?',
      },
    });

    expect(html).toContain('Who supports you?');
    expect(html).toContain('data-testid="voters-screen"');
    expect(html).toContain('data-testid="us-map"');
    expect(html).toContain('data-testid="ec-bar"');
    expect(html).toContain('data-testid="state-inspector"');
    expect(html).toContain('270 TO WIN');
    expect(html).toContain('Tipping Point:');
  });

  it('renders state inspector with support metric, delta, and causal reasons (VOT-02)', () => {
    const session = new Session(1, START, { party: 'D' });
    const { html } = render(Voters, {
      props: {
        session,
        question: 'Who supports you?',
      },
    });

    // Inspector card shows support metric, local family impact, and reasons list
    expect(html).toContain('inspector-card');
    expect(html).toContain('data-testid="voters-state-portrait"');
    expect(html).toContain('support-pct');
    expect(html).toContain('data-testid="local-family-impact"');
    expect(html).toContain('LOCAL FAMILY IMPACT');
    expect(html).toContain('Price parity index:');
    expect(html).toContain('WHY VOTERS FEEL THIS WAY');
    expect(html).toContain('reason-item');
  });

  it('renders sortable table fallback and coalitions view switcher (VOT-01, SOC-05)', () => {
    const session = new Session(1, START, { party: 'D' });
    const { html } = render(Voters, {
      props: {
        session,
        question: 'Who supports you?',
      },
    });

    // Has Map View, Table View, and Coalitions switcher buttons
    expect(html).toContain('Map View');
    expect(html).toContain('Table View');
    expect(html).toContain('Coalitions');
  });

  it('renders honest projection whiskers in Year 3+ (turn >= 9) (VOT-03)', () => {
    const session = new Session(1, START, { party: 'D' });
    // Advance session to turn 9 (Year 3 Spring)
    for (let t = 1; t <= 9; t++) {
      session.nextTurn();
    }
    expect(session.current.turn).toBe(10);

    const { html } = render(Voters, {
      props: {
        session,
        question: 'Who supports you?',
      },
    });

    // Must render projection whiskers
    expect(html).toContain('Honest Model Range:');
    expect(html).toContain('whisker-range');
    expect(html).toContain('EV');
  });
});
