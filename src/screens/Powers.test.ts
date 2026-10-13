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
    expect(html).not.toContain('data-testid="evil-levers-section"');
  });

  it('renders Corrupt Executive Levers section only in Evil Mode (LEVER-01, LEVER-02, LEVER-03)', () => {
    const evilSession = new Session(1, START, { party: 'D', evilMode: true });
    const { html } = render(Powers, {
      props: {
        session: evilSession,
        question: 'What orders will you sign?',
      },
    });

    expect(html).toContain('data-testid="evil-levers-section"');
    expect(html).toContain('Corrupt Executive Directives');
    expect(html).toContain('data-testid="evil-lever-card-crony_contracts"');
    expect(html).toContain('data-testid="evil-lever-card-auction_public_lands"');
    expect(html).toContain('data-testid="evil-lever-card-sell_tariff_exemptions"');
    expect(html).toContain('data-testid="evil-lever-card-solicit_library_donations"');
    expect(html).toContain('data-testid="evil-lever-card-fire_inspectors_general"');
    expect(html).toContain('data-testid="evil-lever-card-pressure_justice_department"');
  });

  it('supports reactive staging and unstaging of evil levers on session', () => {
    const evilSession = new Session(1, START, { party: 'D', evilMode: true });
    expect(evilSession.stagedEvilLeversCount).toBe(0);
    expect(evilSession.evilLeversCost).toBe(0);

    evilSession.toggleEvilLever('crony_contracts');
    expect(evilSession.isEvilLeverStaged('crony_contracts')).toBe(true);
    expect(evilSession.stagedEvilLeversCount).toBe(1);
    expect(evilSession.evilLeversCost).toBe(15);
    expect(evilSession.stagedEvilLeversKickbackBn).toBe(15);
    expect(evilSession.stagedEvilLeversHeatDelta).toBe(14);

    evilSession.toggleEvilLever('fire_inspectors_general');
    expect(evilSession.isEvilLeverStaged('fire_inspectors_general')).toBe(true);
    expect(evilSession.stagedEvilLeversCount).toBe(2);
    expect(evilSession.evilLeversCost).toBe(40); // 15 + 25
    expect(evilSession.stagedEvilLeversHeatDelta).toBe(-6); // 14 - 20

    evilSession.toggleEvilLever('crony_contracts');
    expect(evilSession.isEvilLeverStaged('crony_contracts')).toBe(false);
    expect(evilSession.stagedEvilLeversCount).toBe(1);
    expect(evilSession.evilLeversCost).toBe(25);
  });
});
