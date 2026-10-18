import { fleschKincaid } from 'flesch-kincaid';
import { syllable } from 'syllable';
import { describe, expect, it } from 'vitest';
import { START } from '../engine/fixture';
import { newGame } from '../engine/game';
import { generateBriefing } from './briefing';
import type { ActiveCrisis } from '../engine/director';

const BANNED_POLITICIANS = [
  'biden', 'trump', 'harris', 'obama', 'bush', 'clinton',
  'mcconnell', 'schumer', 'pelosi', 'jeffries', 'mccarthy',
];

describe('dynamic briefing generator (EVT-07, OBS-05)', () => {
  it('generates active crisis briefing when a crisis is active', () => {
    const base = newGame(1, START);
    const mockCrisis: ActiveCrisis = {
      id: 'event:gulf_hurricane:t3',
      crisisId: 'gulf_hurricane',
      turn: 3,
      type: 'exogenous',
      name: 'Gulf Coast Hurricane',
      headline: 'Category 4 storm approaches Gulf refinery corridor.',
      description: 'Major storm threatens ports and energy hubs.',
      explainerTitle: 'disaster response',
      options: [],
      isEndogenous: false,
    };
    const state = { ...base, activeCrisis: mockCrisis };
    const briefing = generateBriefing({ current: state });

    expect(briefing.bubble).toContain('crisis');
    expect(briefing.thisTurn.title).toBe('Gulf Coast Hurricane');
    expect(briefing.suggestions).toHaveLength(3);
  });

  it('generates imminent deadline briefing when within 2 turns of deadline', () => {
    const base = newGame(1, START);
    // Turn 2 is 2 turns before Fall turn 4 funding deadline
    const state = { ...base, turn: 2 };
    const briefing = generateBriefing({ current: state });

    expect(briefing.bubble).toContain('deadline');
    expect(briefing.thisTurn.title).toContain('Government funding due in 2 turns');
    expect(briefing.suggestions.some((s) => s.target === 'congress')).toBe(true);
  });

  it('generates disaster recovery briefing when an approval rally modifier is active', () => {
    const base = newGame(1, START);
    const state = {
      ...base,
      modifiers: [
        {
          id: 'event:gulf_hurricane:emergency#approval#t3',
          group: 'event:gulf_hurricane',
          source: 'event:gulf_hurricane',
          channel: 'approval' as const,
          amount: 3,
          from: 3,
          until: 4,
          tag: 'event' as const,
        },
      ],
    };
    const briefing = generateBriefing({ current: state });

    expect(briefing.bubble).toContain('disaster relief');
    expect(briefing.thisTurn.title).toContain('Disaster recovery');
  });

  it('generates inflation briefing when consumer price growth is high', () => {
    const base = newGame(1, START);
    const state = {
      ...base,
      econ: { ...base.econ, inflation: 4.2 },
    };
    const briefing = generateBriefing({ current: state });

    expect(briefing.bubble).toContain('Consumer prices are high');
    expect(briefing.thisTurn.title).toBe('High living costs');
  });

  it('generates cooling job market briefing when unemployment is elevated', () => {
    const base = newGame(1, START);
    const state = {
      ...base,
      econ: { ...base.econ, unemployment: 5.2 },
    };
    const briefing = generateBriefing({ current: state });

    expect(briefing.bubble).toContain('Job growth has slowed down');
    expect(briefing.thisTurn.title).toBe('Cooling job market');
  });

  it('generates steady default briefing on initial term state', () => {
    const state = newGame(1, START);
    const briefing = generateBriefing({ current: state });

    expect(briefing.bubble).toContain('economy is steady');
    expect(briefing.thisTurn.title).toBe('Pass a federal budget');
    expect(briefing.suggestions.some((s) => s.target === 'budget')).toBe(true);
  });

  it('triggers contextual myth suggestions based on macro pain points (MYTH-02)', () => {
    const base = newGame(1, START);

    // 1. High inflation triggers gas_prices myth suggestion when unviewed
    const infState = {
      ...base,
      econ: { ...base.econ, inflation: 4.2 },
      viewedMyths: [],
    };
    const infBriefing = generateBriefing({ current: infState });
    expect(infBriefing.suggestions.some((s) => s.mythId === 'gas_prices' && s.title === 'Address gas price anger')).toBe(true);

    // 2. High interest rate triggers interest_rates myth suggestion when gas_prices viewed
    const rateState = {
      ...base,
      econ: { ...base.econ, inflation: 2.0, fedRate: 5.5 },
      viewedMyths: ['gas_prices'],
    };
    const rateBriefing = generateBriefing({ current: rateState });
    expect(rateBriefing.suggestions.some((s) => s.mythId === 'interest_rates' && s.title === 'Address Fed rate blame')).toBe(true);

    // 3. High unemployment triggers presidential_jobs when gas_prices and interest_rates viewed
    const jobsState = {
      ...base,
      econ: { ...base.econ, unemployment: 5.5 },
      viewedMyths: ['gas_prices', 'interest_rates'],
    };
    const jobsBriefing = generateBriefing({ current: jobsState });
    expect(jobsBriefing.suggestions.some((s) => s.mythId === 'presidential_jobs' && s.title === 'Address jobs claims')).toBe(true);

    // 4. High debt ratio triggers debt_ceiling_default when jobs viewed
    const debtState = {
      ...base,
      econ: { ...base.econ, debt: base.econ.gdp * 1.25 },
      viewedMyths: ['gas_prices', 'interest_rates', 'presidential_jobs'],
    };
    const debtBriefing = generateBriefing({ current: debtState });
    expect(debtBriefing.suggestions.some((s) => s.mythId === 'debt_ceiling_default' && s.title === 'Address debt limit claims')).toBe(true);
  });

  it('suppresses all myth suggestions when showMyths is false or when branch myths are already resolved', () => {
    const base = newGame(1, START);
    const scenarios = [
      { ...base, turn: 2 },
      { ...base, econ: { ...base.econ, debt: base.econ.gdp * 1.25 } },
      { ...base, econ: { ...base.econ, inflation: 4.5 } },
      { ...base, econ: { ...base.econ, unemployment: 5.5 } },
      base,
    ];

    for (const st of scenarios) {
      const hidden = generateBriefing({ current: st, showMyths: false });
      expect(hidden.suggestions.every((s) => !s.mythId)).toBe(true);
      expect(hidden.suggestions.every((s) => s.target !== null || s.openCrisis)).toBe(true);
    }

    // Also when showMyths is true, if the branch's contextual myths are already viewed/spun, it falls back to a real policy action
    const viewedInf = generateBriefing({
      current: {
        ...base,
        econ: { ...base.econ, inflation: 4.5, fedRate: 3.0 },
        viewedMyths: ['gas_prices', 'price_controls_shortages'],
      },
      showMyths: true,
    });
    expect(viewedInf.suggestions.every((s) => !s.mythId)).toBe(true);
  });

  it('passes reading grade <= 9.0 and sentence length <= 20 words for all branches', () => {
    const base = newGame(1, START);
    const mockCrisis: ActiveCrisis = {
      id: 'event:gulf_hurricane:t3',
      crisisId: 'gulf_hurricane',
      turn: 3,
      type: 'exogenous',
      name: 'Gulf Coast Hurricane',
      headline: 'Category 4 storm approaches Gulf refinery corridor.',
      description: 'Major storm threatens ports and energy hubs.',
      explainerTitle: 'disaster response',
      options: [],
      isEndogenous: false,
    };

    const scenarios = [
      { current: { ...base, activeCrisis: mockCrisis } },
      { current: { ...base, turn: 2 } }, // funding warning
      { current: { ...base, econ: { ...base.econ, debt: base.econ.gdp * 1.22 } } }, // debt warning
      {
        current: {
          ...base,
          modifiers: [
            {
              id: 'event:gulf_hurricane:emergency#approval#t3',
              group: 'event:gulf_hurricane',
              source: 'event:gulf_hurricane',
              channel: 'approval' as const,
              amount: 3,
              from: 3,
              until: 4,
              tag: 'event' as const,
            },
          ],
        },
      },
      { current: { ...base, econ: { ...base.econ, inflation: 4.2 } } },
      { current: { ...base, econ: { ...base.econ, unemployment: 5.2 } } },
      { current: base },
      { current: base, isEvilMode: true },
      { current: { ...base, evil: { heat: 40, offshoreStashBn: 5, investigationsActive: false, specialCounselAppointed: false, articlesOfImpeachmentVoted: false, convicted: false } }, isEvilMode: true },
      { current: { ...base, evil: { heat: 65, offshoreStashBn: 12, investigationsActive: true, specialCounselAppointed: true, articlesOfImpeachmentVoted: false, convicted: false } }, isEvilMode: true },
      { current: { ...base, evil: { heat: 85, offshoreStashBn: 20, investigationsActive: true, specialCounselAppointed: true, articlesOfImpeachmentVoted: true, convicted: false } }, isEvilMode: true },
    ];

    for (const ctx of scenarios) {
      const b = generateBriefing(ctx);
      const texts = [
        b.bubble,
        b.thisTurn.title,
        b.thisTurn.detail,
        ...b.suggestions.map((s) => s.title),
      ];

      for (const text of texts) {
        const sentences = text
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && /[a-zA-Z]/.test(s));

        for (const sentence of sentences) {
          const words = sentence.split(/\s+/).filter(Boolean);
          expect(words.length, `Sentence exceeds 20 words: "${sentence}"`).toBeLessThanOrEqual(20);

          if (words.length >= 5) {
            const sylCount = words.reduce((acc, w) => acc + syllable(w), 0);
            const grade = fleschKincaid({
              sentence: 1,
              word: words.length,
              syllable: sylCount,
            });
            expect(grade, `Sentence exceeds 9.0 reading grade (${grade}): "${sentence}"`).toBeLessThanOrEqual(9.0);
          }
        }

        const lower = text.toLowerCase();
        for (const pol of BANNED_POLITICIANS) {
          expect(lower).not.toContain(pol);
        }
        expect(lower).not.toContain('democrat');
        expect(lower).not.toContain('republican');
      }

      for (const s of b.suggestions) {
        if (s.target === null) {
          expect(Boolean(s.openCrisis || s.mythId), `Suggestion "${s.title}" has null target without openCrisis or mythId`).toBe(true);
        }
      }
    }
  });
});
