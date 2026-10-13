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
    }
  });
});
