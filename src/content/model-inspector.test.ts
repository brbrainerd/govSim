import { describe, expect, it } from 'vitest';
import {
  COEFF,
  LIMITS,
  SCORE,
  RULES,
} from '../engine/coefficients';
import {
  MODEL_DOMAINS,
  MODEL_EQUATIONS,
  getInspectorEntries,
  getInspectorSummary,
  type ModelDomainId,
} from './model-inspector';

describe('model-inspector content catalog and registry audit', () => {
  it('surfaces 100% of keys from COEFF, SCORE, LIMITS, and RULES in getInspectorEntries("all")', () => {
    const all = getInspectorEntries('all');
    const allIds = new Set(all.map((e) => e.id));

    // COEFF
    for (const key of Object.keys(COEFF)) {
      expect(allIds.has(key), `Missing COEFF key in inspector: ${key}`).toBe(true);
    }

    // SCORE
    for (const key of Object.keys(SCORE)) {
      expect(allIds.has(key), `Missing SCORE key in inspector: ${key}`).toBe(true);
    }

    // LIMITS
    for (const key of Object.keys(LIMITS)) {
      expect(allIds.has(key), `Missing LIMITS key in inspector: ${key}`).toBe(true);
    }

    // RULES
    for (const key of Object.keys(RULES)) {
      expect(allIds.has(key), `Missing RULES key in inspector: ${key}`).toBe(true);
    }

    const expectedMinCount =
      Object.keys(COEFF).length +
      Object.keys(SCORE).length +
      Object.keys(LIMITS).length +
      Object.keys(RULES).length;

    expect(all.length).toBeGreaterThanOrEqual(expectedMinCount);
  });

  it('every entry has complete metadata and valid domain classification', () => {
    const all = getInspectorEntries('all');
    const validDomains = new Set<ModelDomainId>(['macro', 'fiscal', 'social', 'foreign', 'scoring', 'evil']);

    for (const entry of all) {
      expect(entry.id, `Empty ID on entry: ${JSON.stringify(entry)}`).toBeTruthy();
      expect(entry.table, `Invalid table on entry ${entry.id}`).toMatch(/^(COEFF|SCORE|LIMITS|RULES|BUDGET)$/);
      expect(validDomains.has(entry.domain), `Invalid domain ${entry.domain} on entry ${entry.id}`).toBe(true);
      expect(entry.valueDisplay, `Empty valueDisplay on entry ${entry.id}`).toBeTruthy();
      expect(entry.rangeDisplay, `Empty rangeDisplay on entry ${entry.id}`).toBeTruthy();
      expect(entry.unit, `Empty unit on entry ${entry.id}`).toBeTruthy();
      expect(['citation', 'judgement'].includes(entry.basis), `Invalid basis ${entry.basis} on entry ${entry.id}`).toBe(true);
      expect(entry.note, `Empty note on entry ${entry.id}`).toBeTruthy();

      if (entry.sources) {
        for (const s of entry.sources) {
          expect(s.url.startsWith('https://'), `Source URL must start with https://: ${s.url}`).toBe(true);
          expect(s.text.trim().length, `Empty source text for ${s.url}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('filters accurately by domain and text search query', () => {
    const macroEntries = getInspectorEntries('macro');
    expect(macroEntries.length).toBeGreaterThan(10);
    for (const e of macroEntries) {
      expect(e.domain).toBe('macro');
    }

    const fiscalEntries = getInspectorEntries('fiscal');
    expect(fiscalEntries.length).toBeGreaterThan(10);
    for (const e of fiscalEntries) {
      expect(e.domain).toBe('fiscal');
    }

    // Search for Okun
    const okunSearch = getInspectorEntries('all', 'okun');
    expect(okunSearch.length).toBeGreaterThanOrEqual(1);
    expect(okunSearch.some((e) => e.id === 'okun')).toBe(true);

    // Search for Taylor
    const taylorSearch = getInspectorEntries('all', 'taylor');
    expect(taylorSearch.length).toBeGreaterThanOrEqual(2);

    // Search for non-existent keyword
    const emptySearch = getInspectorEntries('all', 'xyznotexistingkeyword123');
    expect(emptySearch).toHaveLength(0);
  });

  it('summary counts match inspector entries', () => {
    const summary = getInspectorSummary();
    const all = getInspectorEntries('all');

    expect(summary.totalParameters).toBe(all.length);
    expect(summary.totalCitations + summary.totalJudgement).toBe(all.length);
    expect(summary.totalCitations).toBeGreaterThan(0);

    let domainSum = 0;
    for (const d of MODEL_DOMAINS) {
      if (d.id === 'all') continue;
      domainSum += summary.domains[d.id];
    }
    expect(domainSum).toBe(all.length);
  });

  it('defines 6 core equations with valid formulas and explanations', () => {
    expect(MODEL_EQUATIONS).toHaveLength(6);
    const expectedIds = ['output-gap', 'okun-law', 'phillips-curve', 'taylor-rule', 'debt-interest', 'prosperity-index'];
    for (const id of expectedIds) {
      const eq = MODEL_EQUATIONS.find((e) => e.id === id);
      expect(eq, `Missing equation ${id}`).toBeDefined();
      expect(eq!.formula.length).toBeGreaterThan(5);
      expect(eq!.explanation.length).toBeGreaterThan(10);
    }
  });
});
