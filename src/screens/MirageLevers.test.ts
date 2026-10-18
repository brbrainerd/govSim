import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Session } from '../app/session.svelte';
import { START } from '../engine/fixture';
import Congress from './Congress.svelte';
import Economy from './Economy.svelte';
import Budget from './Budget.svelte';
import Powers from './Powers.svelte';
import Trade from './Trade.svelte';
import Voters from './Voters.svelte';

describe('Mirage Levers across policy screens (MYTH-01)', () => {
  const setupSession = () => new Session(1, START, { party: 'D' });

  it('renders Congress mirage lever for line-item veto', () => {
    const session = setupSession();
    const { html } = render(Congress, {
      props: {
        session,
        question: 'Can you pass your bill?',
        onOpenMyth: () => {},
      },
    });

    expect(html).toContain('data-testid="mirage-lever-congress"');
    expect(html).toContain('Line-Item Veto Waste Lines');
  });

  it('renders Economy mirage lever for Fed rate order', () => {
    const session = setupSession();
    const { html } = render(Economy, {
      props: {
        session,
        question: 'How is the economy doing?',
        go: () => {},
        onOpenMyth: () => {},
      },
    });

    expect(html).toContain('data-testid="mirage-lever-economy"');
    expect(html).toContain('Order 2% Fed Rate Cut');
  });

  it('renders Budget mirage lever for zeroing out foreign aid', () => {
    const session = setupSession();
    const { html } = render(Budget, {
      props: {
        session,
        question: 'What is your budget plan?',
        go: () => {},
        onOpenMyth: () => {},
      },
    });

    expect(html).toContain('data-testid="mirage-lever-budget"');
    expect(html).toContain('Zero Out Foreign Aid');
  });

  it('renders Powers mirage lever for rewriting law by decree', () => {
    const session = setupSession();
    const { html } = render(Powers, {
      props: {
        session,
        question: 'What executive actions will you take?',
        go: () => {},
        onOpenMyth: () => {},
      },
    });

    expect(html).toContain('data-testid="mirage-lever-powers"');
    expect(html).toContain('Rewrite Law by Decree');
  });

  it('renders Trade mirage lever for billing foreign nations', () => {
    const session = setupSession();
    const { html } = render(Trade, {
      props: {
        session,
        question: 'How will you balance global trade?',
        go: () => {},
        onOpenMyth: () => {},
      },
    });

    expect(html).toContain('data-testid="mirage-lever-trade"');
    expect(html).toContain('Bill Foreign Nations for Tariffs');
  });

  it('renders Voters mirage lever for claiming national mandate decree', () => {
    const session = setupSession();
    const { html } = render(Voters, {
      props: {
        session,
        question: 'How do voters feel about your administration?',
        go: () => {},
        onOpenMyth: () => {},
      },
    });

    expect(html).toContain('data-testid="mirage-lever-voters"');
    expect(html).toContain('Claim National Mandate Decree');
  });

  it('hides all mirage levers and myth chips when showMyths is false or when the myth is resolved', () => {
    const hiddenSession = new Session(1, START, { party: 'D', showMyths: false });
    const econHidden = render(Economy, {
      props: {
        session: hiddenSession,
        question: 'How is the economy doing?',
        go: () => {},
        onOpenMyth: () => {},
      },
    }).html;
    expect(econHidden).not.toContain('data-testid="mirage-lever-economy"');
    expect(econHidden).not.toContain('Myth? Lower taxes boost growth?');

    const resolvedSession = setupSession();
    resolvedSession.viewMythCard('interest_rates');
    const econResolved = render(Economy, {
      props: {
        session: resolvedSession,
        question: 'How is the economy doing?',
        go: () => {},
        onOpenMyth: () => {},
      },
    }).html;
    expect(econResolved).not.toContain('data-testid="mirage-lever-economy"');
  });
});
