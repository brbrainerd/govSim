import { fleschKincaid } from 'flesch-kincaid';
import { syllable } from 'syllable';
import { describe, expect, it } from 'vitest';
import { MYTHS_CATALOG, getMyth } from './myths';

const BANNED_POLITICIANS = [
  'biden', 'trump', 'harris', 'obama', 'bush', 'clinton',
  'mcconnell', 'schumer', 'pelosi', 'jeffries', 'mccarthy',
];

describe('civics myth cards catalog (PWR-06, OBS-05, GR-20, GR-21)', () => {
  it('contains 8 curated myth cards including tax, debt ceiling, and trade myths (LEARN-02)', () => {
    expect(MYTHS_CATALOG).toHaveLength(8);
    expect(getMyth('supply_side_taxes')).toBeDefined();
    expect(getMyth('debt_ceiling_default')).toBeDefined();
    expect(getMyth('trade_deficits')).toBeDefined();
  });

  it('provides getMyth lookup by id', () => {
    const myth = getMyth('gas_prices');
    expect(myth).toBeDefined();
    expect(myth?.title).toBe('Can you lower gas prices');
  });

  it('satisfies GR-20 left/right challenge balance (|left - right| <= 1)', () => {
    let leftCount = 0;
    let rightCount = 0;
    for (const card of MYTHS_CATALOG) {
      if (card.challenges === 'left') leftCount++;
      if (card.challenges === 'right') rightCount++;
    }
    expect(Math.abs(leftCount - rightCount)).toBeLessThanOrEqual(1);
  });

  it('every myth card has valid citations and institutional focus', () => {
    for (const card of MYTHS_CATALOG) {
      expect(card.title.length).toBeGreaterThan(3);
      expect(card.mythStatement.length).toBeGreaterThan(5);
      expect(card.realitySummary.length).toBeGreaterThan(10);
      expect(card.flowSteps.length).toBeGreaterThanOrEqual(3);
      expect(card.realLevers.length).toBeGreaterThanOrEqual(2);
      expect(['institution', 'mechanism']).toContain(card.target);
      expect(card.citation.title.length).toBeGreaterThan(5);
      expect(card.citation.url).toMatch(/^https:\/\//);
    }
  });

  it('all copy passes reading grade <= 9.0 and sentences <= 20 words', () => {
    for (const card of MYTHS_CATALOG) {
      const texts = [card.title, card.mythStatement, card.realitySummary, ...card.realLevers];
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
