import { fleschKincaid } from 'flesch-kincaid';
import { syllable } from 'syllable';
import { describe, expect, it } from 'vitest';
import { screens } from '../app/screens';
import { MYTHS_CATALOG, getMyth } from './myths';

const BANNED_POLITICIANS = [
  'biden', 'trump', 'harris', 'obama', 'bush', 'clinton',
  'mcconnell', 'schumer', 'pelosi', 'jeffries', 'mccarthy',
];

const VALID_SCREEN_IDS = new Set(screens.map((s) => s.id));

describe('civics myth cards catalog (PWR-06, OBS-05, GR-20, GR-21, DECK-01, DECK-02, PIVOT-01)', () => {
  it('contains 12 curated myth cards across all major policy screens (DECK-01)', () => {
    expect(MYTHS_CATALOG).toHaveLength(12);
    expect(getMyth('gas_prices')).toBeDefined();
    expect(getMyth('interest_rates')).toBeDefined();
    expect(getMyth('presidential_jobs')).toBeDefined();
    expect(getMyth('rule_by_decree')).toBeDefined();
    expect(getMyth('foreign_aid_deficit')).toBeDefined();
    expect(getMyth('supply_side_taxes')).toBeDefined();
    expect(getMyth('debt_ceiling_default')).toBeDefined();
    expect(getMyth('trade_deficits')).toBeDefined();
    expect(getMyth('veto_line_item')).toBeDefined();
    expect(getMyth('popular_vote_mandate')).toBeDefined();
    expect(getMyth('immigration_crime_budget')).toBeDefined();
    expect(getMyth('scotus_instant_reversal')).toBeDefined();
  });

  it('provides getMyth lookup by id', () => {
    const myth = getMyth('gas_prices');
    expect(myth).toBeDefined();
    expect(myth?.title).toBe('Can you lower gas prices');
  });

  it('satisfies GR-20 left/right challenge balance (|left - right| <= 1)', () => {
    let leftCount = 0;
    let rightCount = 0;
    let bothCount = 0;
    for (const card of MYTHS_CATALOG) {
      if (card.challenges === 'left') leftCount++;
      if (card.challenges === 'right') rightCount++;
      if (card.challenges === 'both') bothCount++;
    }
    expect(leftCount).toBe(4);
    expect(rightCount).toBe(4);
    expect(bothCount).toBe(4);
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

  it('every myth card has a structured prediction prompt (DECK-02)', () => {
    for (const card of MYTHS_CATALOG) {
      expect(card.mirageLabel.length).toBeGreaterThanOrEqual(5);
      expect(card.predictionPrompt).toBeDefined();
      expect(card.predictionPrompt.question.length).toBeGreaterThan(10);
      expect(card.predictionPrompt.options).toHaveLength(2);
      expect([0, 1]).toContain(card.predictionPrompt.correctIndex);
      expect(card.predictionPrompt.refutation.length).toBeGreaterThan(15);
    }
  });

  it('every myth card defines actionable real lever pivots linking to valid screens (PIVOT-01)', () => {
    for (const card of MYTHS_CATALOG) {
      expect(card.realLeverActions.length).toBeGreaterThanOrEqual(2);
      for (const action of card.realLeverActions) {
        expect(action.label.length).toBeGreaterThan(2);
        expect(VALID_SCREEN_IDS.has(action.screen), `Invalid screen: "${action.screen}" in card "${card.id}"`).toBe(true);
        expect(action.actionKind).toBeDefined();
      }
    }
  });

  it('all copy passes reading grade <= 9.0 and sentences <= 20 words', () => {
    for (const card of MYTHS_CATALOG) {
      const texts = [
        card.title,
        card.mythStatement,
        card.realitySummary,
        card.mirageLabel,
        card.predictionPrompt.question,
        card.predictionPrompt.options[0],
        card.predictionPrompt.options[1],
        card.predictionPrompt.refutation,
        ...card.realLevers,
        ...card.realLeverActions.map((a) => a.label),
        ...card.realLeverActions.map((a) => a.hint ?? ''),
      ].filter((t) => t.length > 0);

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
            expect(grade, `Sentence exceeds 9.0 reading grade (${grade.toFixed(1)}): "${sentence}" in card "${card.id}"`).toBeLessThanOrEqual(9.0);
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
