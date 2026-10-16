import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import TradeoffPill from './TradeoffPill.svelte';
import { Session } from '../app/session.svelte';
import { parseSave, serializeSave } from '../app/save';
import { START } from '../engine/fixture';

describe('TradeoffPill & VocabMode (VOCAB-01..03)', () => {
  it('renders compact variant with upside, catch, and plain-mode tooltip button', () => {
    const { html } = render(TradeoffPill, {
      props: {
        variant: 'compact',
        emoji: '🏥',
        upside: 'Cuts drug costs for seniors',
        catchText: 'High court strike-down risk',
        realTerm: 'Administrative Rulemaking',
        legalBasis: '42 U.S.C. § 1395',
        vocabMode: 'plain',
      },
    });

    expect(html).toContain('data-testid="tradeoff-pill"');
    expect(html).toContain('Cuts drug costs for seniors');
    expect(html).toContain('High court strike-down risk');
    expect(html).toContain('data-testid="tradeoff-wonk-tip-btn"');
    expect(html).not.toContain('data-testid="tradeoff-wonk-inline"');
  });

  it('renders compact variant with inline statutory badge when vocabMode is wonk', () => {
    const { html } = render(TradeoffPill, {
      props: {
        variant: 'compact',
        upside: 'Immediate tariff shield',
        catchText: 'Raises grocery and parts prices',
        realTerm: 'Section 301 Tariffs',
        legalBasis: 'Trade Act of 1974',
        vocabMode: 'wonk',
      },
    });

    expect(html).toContain('data-testid="tradeoff-wonk-inline"');
    expect(html).toContain('Section 301 Tariffs');
    expect(html).toContain('Trade Act of 1974');
  });

  it('renders card variant with advisor whyClick and wonk drawer in wonk mode', () => {
    const { html } = render(TradeoffPill, {
      props: {
        variant: 'card',
        emoji: '⚡',
        title: 'Clean Energy Fast-Track',
        whyClick: 'Speeds up solar and wind permits without waiting on Congress.',
        upside: 'Faster clean grid buildout',
        catchText: 'Courts can pause permits',
        realTerm: 'NEPA Categorical Exclusion',
        legalBasis: '42 U.S.C. § 4321',
        vocabMode: 'wonk',
        impactScore: 2,
      },
    });

    expect(html).toContain('data-testid="tradeoff-card"');
    expect(html).toContain('Clean Energy Fast-Track');
    expect(html).toContain('Speeds up solar and wind permits');
    expect(html).toContain('data-testid="tradeoff-wonk-drawer"');
    expect(html).toContain('NEPA Categorical Exclusion');
    expect(html).toContain('+2 Net');
  });

  it('defaults Session.vocabMode to plain, toggles to wonk, and preserves across save/load', () => {
    const session = new Session(42, START, { party: 'D' });
    expect(session.vocabMode).toBe('plain');

    session.toggleVocabMode();
    expect(session.vocabMode).toBe('wonk');
    expect(session.options.vocabMode).toBe('wonk');

    const json = serializeSave(session);
    const parsed = parseSave(json);
    const restored = Session.fromSave(parsed);
    expect(restored.vocabMode).toBe('wonk');
  });
});
