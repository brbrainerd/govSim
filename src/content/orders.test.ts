import { fleschKincaid } from 'flesch-kincaid';
import { syllable } from 'syllable';
import { describe, expect, it } from 'vitest';
import { ORDERS_CATALOG, getOrder } from './orders';

const BANNED_POLITICIANS = [
  'biden', 'trump', 'harris', 'obama', 'bush', 'clinton',
  'mcconnell', 'schumer', 'pelosi', 'jeffries', 'mccarthy',
];

describe('executive orders catalog (PWR-01, OBS-05)', () => {
  it('contains exactly 10 curated executive orders', () => {
    expect(ORDERS_CATALOG).toHaveLength(10);
  });

  it('provides getOrder lookup by id', () => {
    const order = getOrder('eo_hiring_freeze');
    expect(order).toBeDefined();
    expect(order?.name).toBe('Federal hiring freeze');
  });

  it('every order has a cited statutory basis and https citation', () => {
    for (const order of ORDERS_CATALOG) {
      expect(order.legalBasis.length).toBeGreaterThan(5);
      expect(order.citation.title.length).toBeGreaterThan(5);
      expect(order.citation.url).toMatch(/^https:\/\//);
      expect(order.effects.length).toBeGreaterThan(0);
      expect(order.cloutCost).toBeGreaterThan(0);
      expect(['Low', 'Moderate', 'High']).toContain(order.courtRisk);
      expect(order.riskProbability).toBeGreaterThan(0);
      expect(order.riskProbability).toBeLessThanOrEqual(1);
    }
  });

  it('order names have <= 6 words', () => {
    for (const order of ORDERS_CATALOG) {
      const words = order.name.trim().split(/\s+/);
      expect(words.length, `Order name "${order.name}" exceeds 6 words`).toBeLessThanOrEqual(6);
    }
  });

  it('all copy passes reading grade <= 9.0 and sentences <= 20 words', () => {
    for (const order of ORDERS_CATALOG) {
      const texts = [order.description, order.preview];
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
