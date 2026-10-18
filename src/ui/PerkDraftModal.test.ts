import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Session } from '../app/session.svelte';
import { START } from '../engine/fixture';
import PerkDraftModal from './PerkDraftModal.svelte';
import NewGame from '../screens/NewGame.svelte';
import OvalOffice from '../screens/OvalOffice.svelte';

describe('PerkDraftModal & Classic Sim integration (PERK-01..03)', () => {
  it('renders 3-card quarterly Task Force draft slate with reroll, lock, and skip controls', () => {
    const session = new Session(42, START, { party: 'D' });
    const { html } = render(PerkDraftModal, {
      props: {
        session,
        onClose: () => {},
      },
    });

    expect(html).toContain('data-testid="perk-draft-modal"');
    expect(html).toContain('Task Force &amp; Mandate Draft');
    expect(html).toContain('data-testid="perk-reroll-btn"');
    expect(html).toContain('data-testid="perk-skip-btn"');
    for (const card of session.perkSlate) {
      expect(html).toContain(`data-testid="perk-card-${card.id}"`);
      expect(html).toContain(`data-testid="perk-pick-${card.id}"`);
      expect(html).toContain(`data-testid="perk-lock-${card.id}"`);
    }
  });

  it('shows Task Force Draft button on OvalOffice by default and hides it in Classic Sim mode', () => {
    const standardSession = new Session(42, START, { party: 'D' });
    const { html: stdHtml } = render(OvalOffice, {
      props: {
        session: standardSession,
        question: 'What is our priority?',
        go: () => {},
      },
    });
    expect(stdHtml).toContain('data-testid="open-perk-draft-btn"');

    const classicSession = new Session(42, START, { party: 'D', classicSim: true });
    const { html: classicHtml } = render(OvalOffice, {
      props: {
        session: classicSession,
        question: 'What is our priority?',
        go: () => {},
      },
    });
    expect(classicHtml).not.toContain('data-testid="open-perk-draft-btn"');
  });

  it('renders Classic Sim (No Perks) toggle on NewGame screen', () => {
    const { html } = render(NewGame, {
      props: {
        onStart: () => {},
      },
    });
    expect(html).toContain('data-testid="classic-sim-toggle"');
    expect(html).toContain('Classic Sim (No Perks)');
  });
});
