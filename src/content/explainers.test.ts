import { fleschKincaid } from 'flesch-kincaid';
import { syllable } from 'syllable';
import { describe, expect, it } from 'vitest';
import { EXPLAINERS_CATALOG, getExplainer } from './explainers';

const BANNED_POLITICIANS = [
  'biden', 'trump', 'harris', 'obama', 'bush', 'clinton',
  'mcconnell', 'schumer', 'pelosi', 'jeffries', 'mccarthy',
];

describe('civic explainers catalog (LEARN-01, OBS-05, design §7c)', () => {
  it('contains 4 curated civic explainers covering Oval Office, Economy, Budget, and Trade', () => {
    expect(EXPLAINERS_CATALOG).toHaveLength(4);
    expect(EXPLAINERS_CATALOG.map((e) => e.id)).toEqual(['oval_office', 'economy', 'budget', 'trade']);
  });

  it('provides getExplainer lookup by id', () => {
    const budget = getExplainer('budget');
    expect(budget).toBeDefined();
    expect(budget?.title).toBe('How a budget becomes law');
  });

  it('every explainer has flow steps, key takeaways, and a valid citation', () => {
    for (const item of EXPLAINERS_CATALOG) {
      expect(item.title.length).toBeGreaterThan(5);
      expect(item.summary.length).toBeGreaterThan(10);
      expect(item.flowSteps.length).toBeGreaterThanOrEqual(3);
      expect(item.takeaways.length).toBeGreaterThanOrEqual(2);
      expect(item.citation.title.length).toBeGreaterThan(5);
      expect(item.citation.url).toMatch(/^https:\/\//);
    }
  });

  it('all copy passes reading grade <= 9.0 and sentences <= 20 words', () => {
    for (const item of EXPLAINERS_CATALOG) {
      const texts = [item.title, item.summary, ...item.flowSteps, ...item.takeaways];
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
