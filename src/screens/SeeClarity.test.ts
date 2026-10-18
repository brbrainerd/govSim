import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'svelte/server';
import { Session } from '../app/session.svelte';
import { START } from '../engine/fixture';
import { EXOGENOUS_CRISES } from '../engine/crises';
import Economy from './Economy.svelte';
import OvalOffice from './OvalOffice.svelte';
import Voters from './Voters.svelte';
import TurnReport from '../ui/TurnReport.svelte';
import CrisisModal from '../ui/CrisisModal.svelte';
import type { ActiveCrisis } from '../engine/director';

describe('Phase 37: Kitchen-Table Clarity on Hub, Diagnostic & Crisis Screens (SEE-01..02)', () => {
  let session: Session;

  beforeEach(() => {
    session = new Session(1, START, { party: 'D' });
  });

  describe('Economy.svelte (SEE-01)', () => {
    it('renders Plain Talk indicator emojis, Big Picture Economy tab, and kitchen-table summary by default', () => {
      expect(session.vocabMode).toBe('plain');
      const { html } = render(Economy, {
        props: {
          session,
          question: 'How is the economy doing?',
          go: () => {},
        },
      });
      expect(html).toContain('📊 Big Picture Economy');
      expect(html).toContain('🏠 Your Household');
      expect(html).toContain('data-testid="economy-kitchen-table-summary"');
      expect(html).toContain('🏠 For regular people:');
      expect(html).toContain('📈 Growth');
      expect(html).toContain('👷 Jobs');
      expect(html).toContain('🛒 Prices');
      expect(html).toContain('💳 Debt');
      expect(html).toContain('🏦 Federal Reserve');
    });

    it('renders formal Macro Indicators (GDP / CPI) tab in Policy Wonk mode', () => {
      session.setVocabMode('wonk');
      const { html } = render(Economy, {
        props: {
          session,
          question: 'How is the economy doing?',
          go: () => {},
        },
      });
      expect(html).toContain('Macro Indicators (GDP / CPI)');
      expect(html).toContain('📈 Growth (Real GDP)');
      expect(html).toContain('🛒 Prices (CPI Inflation)');
    });
  });

  describe('TurnReport.svelte (SEE-01)', () => {
    it('renders Kitchen-Table takeaway and emoji indicator rows in Plain Talk mode', () => {
      session.nextTurn();
      const { html } = render(TurnReport, {
        props: {
          session,
          onClose: () => {},
        },
      });
      expect(html).toContain('data-testid="report-kitchen-table-summary"');
      expect(html).toContain('Regular families are');
      expect(html).toContain('💵');
      expect(html).toContain('🛒');
      expect(html).toContain('🗳️');
    });
  });

  describe('OvalOffice.svelte (SEE-02)', () => {
    it('renders advisor play badges with upside trade-off cues', () => {
      const { html } = render(OvalOffice, {
        props: {
          session,
          question: 'What is on the President’s desk?',
          go: () => {},
        },
      });
      expect(html).toContain('data-testid="advisor-play-badge"');
      expect(html).toContain('data-emblem="up"');
    });
  });

  describe('Voters.svelte (SEE-01)', () => {
    it('renders emoji view tabs, 270th deciding vote hint, and LOCAL FAMILY IMPACT in Plain Talk mode', () => {
      const { html } = render(Voters, {
        props: {
          session,
          question: 'Where do voters stand?',
        },
      });
      expect(html).toContain('🗺️ Map View');
      expect(html).toContain('📋 Table View');
      expect(html).toContain('👥 Coalitions');
      expect(html).toContain('(270th deciding vote)');
      expect(html).toContain('LOCAL FAMILY IMPACT');
      expect(html).toContain('(100 = average cost of living)');
    });

    it('renders concise Price parity index label in Policy Wonk mode', () => {
      session.setVocabMode('wonk');
      const { html } = render(Voters, {
        props: {
          session,
          question: 'Where do voters stand?',
        },
      });
      expect(html).not.toContain('(270th deciding vote)');
      expect(html).toContain('Price parity index:');
    });
  });

  describe('CrisisModal.svelte (SEE-02)', () => {
    it('renders TradeoffPill with upside and catch on every crisis response option', () => {
      const def = EXOGENOUS_CRISES[0]!;
      const sampleCrisis: ActiveCrisis = {
        id: `${def.id}_t1`,
        crisisId: def.id,
        turn: 1,
        type: def.type,
        name: def.name,
        headline: def.headline,
        description: def.description,
        explainerTitle: def.explainerTitle,
        options: def.options,
        isEndogenous: false,
      };
      const { html } = render(CrisisModal, {
        props: {
          crisis: sampleCrisis,
          session,
          onClose: () => {},
        },
      });
      expect(html).toContain('data-testid="tradeoff-pill"');
      expect(html).toContain('data-emblem="up"');
      expect(html).toContain('data-emblem="warn"');
    });
  });
});
