import { fleschKincaid } from 'flesch-kincaid';
import { syllable } from 'syllable';
import { describe, expect, it } from 'vitest';
import { BADGES, getBadge } from './badges';

const BANNED_POLITICIANS = [
  'biden', 'trump', 'harris', 'obama', 'bush', 'clinton',
  'mcconnell', 'schumer', 'pelosi', 'jeffries', 'mccarthy',
];

describe('policy milestone badges content (RPT-03, OBS-05)', () => {
  it('contains exactly 14 milestone badges', () => {
    expect(BADGES).toHaveLength(14);
  });

  it('provides getBadge lookup by id', () => {
    const b = getBadge('balanced_budget');
    expect(b).toBeDefined();
    expect(b?.title).toBe('Fiscal Discipline');
    expect(getBadge('nonexistent')).toBeUndefined();
  });

  it('spans all 5 civic categories', () => {
    const cats = new Set(BADGES.map((b) => b.category));
    expect(cats).toEqual(new Set(['fiscal', 'crises', 'powers', 'electoral', 'stewardship']));
  });

  it('all copy passes reading grade <= 9.0 and sentences <= 20 words', () => {
    for (const badge of BADGES) {
      const texts = [badge.title, badge.description, badge.criterion];
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
