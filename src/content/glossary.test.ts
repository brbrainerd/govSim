import { describe, expect, it } from 'vitest';
import {
  GLOSSARY_CATALOG,
  getGlossaryTerm,
  termLabelForMode,
  termTooltipForMode,
} from './glossary';

describe('Civics Glossary & Progressive Disclosure catalog (VOCAB-02)', () => {
  it('contains 12 complete glossary entries with plain and wonk labels', () => {
    expect(GLOSSARY_CATALOG).toHaveLength(12);
    for (const entry of GLOSSARY_CATALOG) {
      expect(entry.emoji.length).toBeGreaterThan(0);
      expect(entry.plainLabel.split(/\s+/).length).toBeLessThanOrEqual(5);
      expect(entry.wonkLabel.length).toBeGreaterThan(3);
      expect(entry.plainHint.length).toBeGreaterThan(15);
      expect(entry.realTermNote).toMatch(/^Real term:/);
    }
  });

  it('returns plain vs wonk labels and progressive disclosure tooltips by mode', () => {
    const cloture = getGlossaryTerm('cloture');
    expect(cloture.plainLabel).toBe('Senate Vote Hurdle');
    expect(termLabelForMode('cloture', 'plain')).toBe('Senate Vote Hurdle');
    expect(termLabelForMode('cloture', 'wonk')).toBe('Senate Cloture & Filibuster');
    expect(termLabelForMode('cloture', 'plain', true)).toBe('🛑 Senate Vote Hurdle');

    const plainTip = termTooltipForMode('cloture', 'plain');
    expect(plainTip).toContain('60 out of 100 Senate votes');
    expect(plainTip).toContain('Real term: Senate cloture');

    const wonkTip = termTooltipForMode('cloture', 'wonk');
    expect(wonkTip).toContain('Senate Vote Hurdle:');
  });
});
