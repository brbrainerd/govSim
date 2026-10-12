import { fleschKincaid } from 'flesch-kincaid';
import { syllable } from 'syllable';
import { describe, expect, it } from 'vitest';
import { baseline } from '../../engine/budget';
import { enact, START } from '../../engine/fixture';
import { endTurn, newGame } from '../../engine/game';
import { SOURCES } from '../../engine/trace';
import { formatLuckText, WHY_COPY, whyText } from './why';

const BANNED_POLITICIANS = [
  'biden', 'trump', 'harris', 'obama', 'bush', 'clinton',
  'mcconnell', 'schumer', 'pelosi', 'jeffries', 'mccarthy',
];

describe('why copy dictionary (GR-06, GR-07, OBS-05)', () => {
  it('covers all registered engine source IDs in SOURCES (drift guard)', () => {
    for (const sourceId of Object.keys(SOURCES)) {
      expect(WHY_COPY).toHaveProperty(sourceId);
      expect(WHY_COPY[sourceId]!.length).toBeGreaterThan(0);
    }
  });

  it('covers every trace source emitted during active turns', () => {
    let s = newGame(7, START);
    const draft = { ...baseline(), inc: 24, rds: 120, tar: 10 };
    for (let t = 1; t <= 10; t++) {
      s = endTurn(s, t === 1 ? enact(draft) : {});
      for (const [_channel, terms] of Object.entries(s.report.trace)) {
        if (!terms) continue;
        for (const term of terms) {
          const text = whyText(term.source);
          expect(text).toBeTruthy();
          expect(text).not.toBe('');
        }
      }
    }
  });

  it('passes reading grade <= 9.0 and <= 20 words across all why copy', () => {
    for (const [key, text] of Object.entries(WHY_COPY)) {
      const words = text.trim().split(/\s+/);
      expect(words.length, `key ${key} exceeded 20 words`).toBeLessThanOrEqual(20);

      if (words.length >= 5) {
        const syllables = syllable(text);
        const grade = fleschKincaid({
          sentence: 1,
          word: words.length,
          syllable: syllables,
        });
        expect(grade, `key ${key} exceeded grade 9.0 (was ${grade})`).toBeLessThanOrEqual(9.0);
      }
    }
  });

  it('contains no partisan names or living politicians', () => {
    for (const [key, text] of Object.entries(WHY_COPY)) {
      const lower = text.toLowerCase();
      for (const pol of BANNED_POLITICIANS) {
        expect(lower).not.toContain(pol);
      }
      expect(lower).not.toContain('democrat');
      expect(lower).not.toContain('republican');
    }
  });

  it('formats luck text with valid civics summaries', () => {
    expect(formatLuckText({ gap: 0, infl: 0, appr: 0 })).toContain('Normal conditions');
    expect(formatLuckText({ gap: 1.5, infl: 0, appr: 0 })).toContain('surprise growth burst');
    expect(formatLuckText({ gap: -1.5, infl: 2.0, appr: 0 })).toContain('unexpected price spike');
  });
});
