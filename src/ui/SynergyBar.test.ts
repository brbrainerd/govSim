import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Session } from '../app/session.svelte';
import { START } from '../engine/fixture';
import SynergyBar from './SynergyBar.svelte';
import Powers from '../screens/Powers.svelte';
import Trade from '../screens/Trade.svelte';

describe('SynergyBar & Doctrine Tag Badges (SYN-01, SYN-03)', () => {
  it('renders active Doctrine family chips and 2/4/6 set tier badges on SynergyBar', () => {
    const session = new Session(42, START, { party: 'D' });
    session.pickPerk(session.perkSlate[0]!.id);
    session.toggleSignOrder('eo_buy_american');
    session.toggleSignOrder('eo_clean_fleet');
    session.nextTurn();

    const { html } = render(SynergyBar, {
      props: {
        session,
      },
    });

    expect(html).toContain('data-testid="synergy-bar"');
    expect(html).toContain('data-testid="synergy-chip-industrial"');
  });

  it('surfaces Doctrine tag badges on Executive Orders and Trade cards unless Classic Sim is active', () => {
    const session = new Session(42, START, { party: 'D', unlockAll: true });
    const { html: powersHtml } = render(Powers, {
      props: {
        session,
        question: 'How do you use your powers?',
        go: () => {},
      },
    });
    expect(powersHtml).toContain('data-testid="eo-doctrine-eo_buy_american-industrial"');

    const { html: tradeHtml } = render(Trade, {
      props: {
        session,
        question: 'How do you manage trade?',
      },
    });
    expect(tradeHtml).toContain('data-testid="trade-doctrine-chips-industrial"');
    expect(tradeHtml).toContain('data-testid="trade-doctrine-eu-globalist"');
  });
});
