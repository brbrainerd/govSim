import { describe, expect, it } from 'vitest';
import { attributeTerms, extractTurnAttributions, formatValueWithUnit } from './attribution';
import { baseline } from '../engine/budget';
import { enact, START } from '../engine/fixture';
import { endTurn, newGame } from '../engine/game';

describe('attribution', () => {
  it('formats values with units accurately', () => {
    expect(formatValueWithUnit('income', 78200)).toBe('$78,200');
    expect(formatValueWithUnit('inflation', 2.45)).toBe('2.5%');
    expect(formatValueWithUnit('lifeExp', 78.4)).toBe('78.4 yrs');
    expect(formatValueWithUnit('gini', 0.4851)).toBe('0.485');
  });

  it('identifies dominant cause when one term exceeds threshold', () => {
    const terms = [
      { source: 'budget', amount: 1.2 },
      { source: 'momentum', amount: 0.1 },
      { source: 'rounding', amount: 0.0001 },
    ];
    const res = attributeTerms(terms, 1.3);
    expect(res.direction).toBe('up');
    expect(res.topCauseId).toBe('budget');
    expect(res.topCauseText).toBe('Enacted budget changes');
  });

  it('attributes to Several small factors when terms are evenly split', () => {
    const terms = [
      { source: 'budget', amount: 0.2 },
      { source: 'momentum', amount: 0.2 },
      { source: 'luck', amount: 0.2 },
    ];
    const res = attributeTerms(terms, 0.6);
    expect(res.topCauseText).toBe('Several small factors');
  });

  it('extracts all 10 turn attributions from real game turn', () => {
    const s1 = newGame(1, START);
    const draft = { ...baseline(), rds: 120, rnd: 110 };
    const s2 = endTurn(s1, enact(draft));

    const attributions = extractTurnAttributions(s2, s1);
    expect(attributions.indicators).toHaveLength(8);
    expect(attributions.approval.name).toBe('Voter Support');
    expect(attributions.clout.name).toBe('Political Capital');

    for (const ind of attributions.indicators) {
      expect(ind.name).toBeTruthy();
      expect(ind.formattedValue).toBeTruthy();
      expect(['up', 'down', 'flat']).toContain(ind.direction);
      expect(ind.topCauseText).toBeTruthy();
    }
  });
});
