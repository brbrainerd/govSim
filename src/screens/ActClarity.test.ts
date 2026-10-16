import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Session } from '../app/session.svelte';
import { START } from '../engine/fixture';
import Budget from './Budget.svelte';
import Powers from './Powers.svelte';
import Trade from './Trade.svelte';
import Congress from './Congress.svelte';
import FilibusterModal from '../ui/FilibusterModal.svelte';
import JudicialReformModal from '../ui/JudicialReformModal.svelte';
import AmendmentModal from '../ui/AmendmentModal.svelte';

describe('Act screens trade-off clarity & vocabMode (Phase 36, UI-CLARITY-01..03)', () => {
  it('Budget.svelte renders lever emojis and live TradeoffPill card (UI-CLARITY-01)', () => {
    const session = new Session(1, START, { party: 'D' });
    const { html: plainHtml } = render(Budget, {
      props: {
        session,
        question: 'How should we tax and spend?',
        go: () => {},
      },
    });

    expect(plainHtml).toContain('data-testid="budget-tradeoff-card"');
    expect(plainHtml).toContain('data-testid="tradeoff-card"');
    expect(plainHtml).toContain('🧾');
    expect(plainHtml).toContain('👍 Upside');
    expect(plainHtml).toContain('⚠️ The Catch');

    session.setVocabMode('wonk');
    const { html: wonkHtml } = render(Budget, {
      props: {
        session,
        question: 'How should we tax and spend?',
        go: () => {},
      },
    });
    expect(wonkHtml).toContain('Individual Income Tax Effective Rate');
    expect(wonkHtml).toContain('data-testid="tradeoff-wonk-drawer"');
  });

  it('Powers.svelte and Trade.svelte render emojis, Why click notes, and TradeoffPills (UI-CLARITY-02)', () => {
    const session = new Session(1, START, { party: 'D' });
    const { html: powersHtml } = render(Powers, {
      props: {
        session,
        question: 'What can you do without Congress?',
      },
    });
    expect(powersHtml).toContain('data-testid="powers-preview-card"');
    expect(powersHtml).toContain('data-testid="powers-why-click"');
    expect(powersHtml).toContain('data-testid="tradeoff-pill"');
    expect(powersHtml).toContain('SOLO PRESIDENTIAL ACTIONS');

    const { html: tradeHtml } = render(Trade, {
      props: {
        session,
        question: 'How should America trade with the world?',
      },
    });
    expect(tradeHtml).toContain('Store price impact on families');
    expect(tradeHtml).toContain('💡 Why click:');
    expect(tradeHtml).toContain('data-testid="tradeoff-pill"');

    session.setVocabMode('wonk');
    const { html: tradeWonkHtml } = render(Trade, {
      props: {
        session,
        question: 'How should America trade with the world?',
      },
    });
    expect(tradeWonkHtml).toContain('CPI consumer inflation');
    expect(tradeWonkHtml).toContain('data-testid="tradeoff-wonk-inline"');
  });

  it('Congress.svelte and structural reform modals render trade-offs and advisor notes (UI-CLARITY-03)', () => {
    const session = new Session(1, START, { party: 'D' });
    const { html: congressHtml } = render(Congress, {
      props: {
        session,
        question: 'Can you pass your bill?',
      },
    });
    expect(congressHtml).toContain('data-testid="deal-card-mod"');
    expect(congressHtml).toContain('+12 House votes');

    const { html: filHtml } = render(FilibusterModal, {
      props: { session, onClose: () => {} },
    });
    expect(filHtml).toContain('💡 Why click:');
    expect(filHtml).toContain('data-testid="tradeoff-pill"');

    const { html: judHtml } = render(JudicialReformModal, {
      props: { session, onClose: () => {} },
    });
    expect(judHtml).toContain('💡 Why click:');
    expect(judHtml).toContain('data-testid="tradeoff-pill"');

    const { html: amdHtml } = render(AmendmentModal, {
      props: { session, onClose: () => {} },
    });
    expect(amdHtml).toContain('💡 Why click:');
    expect(amdHtml).toContain('data-testid="tradeoff-pill"');
  });
});
