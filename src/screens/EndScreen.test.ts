import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { Session } from '../app/session.svelte';
import { START } from '../engine/fixture';
import { classifyHistorianVerdict, type HistorianVerdictTier } from '../engine/election';
import EndScreen from './EndScreen.svelte';

describe('EndScreen component (ELC-04, ELC-05, GR-04)', () => {
  it('renders EndScreen with headline score, 4-part layout, and historian verdict card', () => {
    const session = new Session(42, START, { party: 'D' });
    session.termEnded = true;

    const { html } = render(EndScreen, {
      props: {
        session,
        onRestart: () => {},
      },
    });

    expect(html).toContain('data-testid="end-screen"');
    expect(html).toContain('PRESIDENTIAL LEGACY REVIEW');
    expect(html).toContain('What is your lasting legacy?');
    expect(html).toContain('data-testid="headline-score"');
    expect(html).toContain('Net Prosperity Impact');
    expect(html).toContain('better than doing nothing across 10 years');
    expect(html).toContain('data-testid="historian-verdict-card"');
    expect(html).toContain('data-testid="verdict-tier"');
    expect(html).toContain('HISTORIAN ASSESSMENT');
    expect(html).toContain('data-testid="start-new-presidency-btn"');
    expect(html).toContain('START NEW PRESIDENCY');
  });

  it('renders 10-year legacy chart and table toggle button (ELC-05, Pitfall 22)', () => {
    const session = new Session(42, START, { party: 'D' });
    session.termEnded = true;

    const { html } = render(EndScreen, {
      props: {
        session,
        onRestart: () => {},
      },
    });

    expect(html).toContain('data-testid="legacy-chart"');
    expect(html).toContain('10-Year Legacy Simulation');
    expect(html).toContain('40 quarters projected forward');
    expect(html).toContain('Your Administration');
    expect(html).toContain('Doing Nothing (Autopilot)');
    expect(html).toContain('data-testid="toggle-table-btn"');
    expect(html).toContain('Show Data Table');
  });

  it('verifies all 5 historian verdict tiers render appropriate nonpartisan badges (ELC-05)', () => {
    const tiers: { score: number; expectedTier: HistorianVerdictTier }[] = [
      { score: 12.5, expectedTier: 'Transformational' },
      { score: 5.0, expectedTier: 'Steward of Stability' },
      { score: 0.5, expectedTier: 'Mixed Legacy' },
      { score: -5.0, expectedTier: 'Presidency of Unresolved Crises' },
      { score: -15.0, expectedTier: 'Institutional Breakdown' },
    ];

    for (const { score, expectedTier } of tiers) {
      const verdict = classifyHistorianVerdict({ total: score, now: score, later: score });
      expect(verdict.tier).toBe(expectedTier);
      expect(verdict.title.length).toBeGreaterThan(5);
      expect(verdict.summary.length).toBeGreaterThan(20);
    }
  });

  it('renders "Retry Turn 16" button when defeated at Turn 16', () => {
    const session = new Session(7, START, { party: 'D' });
    // Advance to turn 16
    for (let i = 1; i < 16; i++) session.nextTurn();
    session.nextTurn(); // election triggers, defeat on seed 7
    session.continueAfterElection(); // closes modal and finalizes loss

    expect(session.termEnded).toBe(true);
    expect(session.turn16Snapshot).toBeDefined();
    expect(session.reelectionWon).toBe(false);

    const { html } = render(EndScreen, {
      props: {
        session,
        onRestart: () => {},
      },
    });

    expect(html).toContain('data-testid="retry-turn16-btn"');
    expect(html).toContain('RETRY FROM TURN 16');
  });
});
