import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Session } from '../app/session.svelte';
import { START } from '../engine/fixture';
import Trade from './Trade.svelte';

describe('Trade screen component (TRADE-01, TRADE-02, TRADE-03)', () => {
  it('renders Trade screen with metrics strip, sector tariffs, agreements, and state exposure table', () => {
    const session = new Session(1, START, { party: 'D' });
    const { html } = render(Trade, {
      props: {
        session,
        question: 'How should America trade with the world?',
      },
    });

    // 1. Header & Question
    expect(html).toContain('How should America trade with the world?');

    // 2. Metrics strip (TRADE-03)
    expect(html).toContain('US Exports');
    expect(html).toContain('US Imports');
    expect(html).toContain('Trade Deficit');
    expect(html).toContain('Price Pass-Through');
    expect(html).toContain('Foreign Retaliation');

    // 3. Strategic sector tariffs (TRADE-01)
    expect(html).toContain('Strategic Sector Tariffs');
    expect(html).toContain('Section 301, Trade Act of 1974');
    expect(html).toContain('Section 232, Trade Expansion Act of 1962 (National Defense)');
    expect(html).toContain('Advanced Semiconductors &amp; Microelectronics');
    expect(html).toContain('Critical Minerals &amp; Rare Earth Elements');
    expect(html).toContain('Clean Energy Hardware &amp; Electric Vehicles');
    expect(html).toContain('data-testid="toggle-sector-chips"');
    expect(html).toContain('data-testid="toggle-sector-minerals"');
    expect(html).toContain('data-testid="toggle-sector-cleanEnergy"');

    // 4. Bilateral trade agreements (TRADE-02)
    expect(html).toContain('Bilateral Trade Agreements');
    expect(html).toContain('Transatlantic Trade &amp; Tech Accord');
    expect(html).toContain('Indo-Pacific Supply Chain Partnership');
    expect(html).toContain('Western Hemisphere Nearshoring Pact');
    expect(html).toContain('data-testid="toggle-agreement-eu"');
    expect(html).toContain('data-testid="toggle-agreement-indoPacific"');
    expect(html).toContain('data-testid="toggle-agreement-americas"');

    // 5. Accessible State Export Exposure Table (TRADE-03)
    expect(html).toContain('Export Exposed States and Vulnerability Levels');
    expect(html).toContain('Iowa (Soybeans &amp; Corn)');
    expect(html).toContain('Illinois (Grain &amp; Ag Machinery)');
    expect(html).toContain('Nebraska (Beef &amp; Feed)');
    expect(html).toContain('Kansas (Wheat &amp; Sorghum)');
  });

  it('updates draft tariffs and reflects active states when toggled', () => {
    const session = new Session(1, START, { party: 'D' });
    expect(session.effectiveTrade.sectorTariffs).toHaveLength(0);

    session.toggleSectorTariff('chips');
    expect(session.effectiveTrade.sectorTariffs).toContain('chips');
    expect(session.tradeBalance.sectorRevenueBn).toBeGreaterThan(0);
    expect(session.tradeBalance.pricePassThroughPct).toBeGreaterThan(0);

    const { html } = render(Trade, {
      props: {
        session,
        question: 'How should America trade with the world?',
      },
    });

    expect(html).toContain('Repeal Sector Tariff');
    expect(html).toContain('1</b> of 3 active in force');
  });

  it('handles bilateral agreement toggles and clout spend', () => {
    const session = new Session(1, START, { party: 'D' });
    const initialClout = session.clout;

    session.toggleTradeAgreement('americas'); // 15 clout
    expect(session.effectiveTrade.agreements).toContain('americas');
    expect(session.tradeCost).toBe(15);
    expect(session.clout).toBe(initialClout - 15);

    const { html } = render(Trade, {
      props: {
        session,
        question: 'How should America trade with the world?',
      },
    });

    expect(html).toContain('Withdraw Accord');
    expect(html).toContain('1</b> ratified accords');
  });
});
