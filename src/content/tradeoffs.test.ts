import { describe, expect, it } from 'vitest';
import { packages, spendLevers, taxLevers } from '../engine/budget';
import { deals, FILIBUSTER_RULES_CATALOG } from '../engine/congress';
import { CRISIS_CATALOG } from '../engine/crises';
import { SANCTIONS_CATALOG } from '../engine/foreign';
import { REFORMS_CATALOG } from '../engine/reforms';
import { AMENDMENTS_CATALOG } from '../engine/amendments';
import {
  AMENDMENT_TRADEOFFS,
  BUDGET_LEVER_TRADEOFFS,
  BUDGET_PACKAGE_TRADEOFFS,
  DEAL_TRADEOFFS,
  describeCrisisOptionTradeoff,
  FILIBUSTER_TRADEOFFS,
  getBudgetLeverTradeoff,
  REFORM_TRADEOFFS,
  SANCTION_TRADEOFFS,
} from './tradeoffs';
import { whyTextForMode } from './text/why';

describe('Tradeoffs & Plain-Talk Catalogs (COPY-01..03)', () => {
  it('covers every budget lever and package with emoji, whyClick, upside, and catchText', () => {
    for (const lever of [...taxLevers, ...spendLevers]) {
      const meta = BUDGET_LEVER_TRADEOFFS[lever.id];
      expect(meta, `Missing budget lever tradeoff: ${lever.id}`).toBeDefined();
      expect(meta?.emoji.length).toBeGreaterThan(0);
      expect(meta?.whyClick.length).toBeGreaterThan(10);

      const raised = getBudgetLeverTradeoff(lever.id, lever.base + 1, lever.base);
      expect(raised.impactScore).toBe(1);
      expect(raised.upside).toBe(meta?.raiseUpside);

      const cut = getBudgetLeverTradeoff(lever.id, lever.base - 1, lever.base);
      expect(cut.impactScore).toBe(-1);
      expect(cut.upside).toBe(meta?.cutUpside);
    }

    for (const pkg of Object.keys(packages) as (keyof typeof packages)[]) {
      const meta = BUDGET_PACKAGE_TRADEOFFS[pkg];
      expect(meta, `Missing package tradeoff: ${pkg}`).toBeDefined();
      expect(meta.upside.length).toBeGreaterThan(5);
      expect(meta.catchText.length).toBeGreaterThan(5);
    }
  });

  it('covers every sanction, deal, filibuster rule, reform, and amendment', () => {
    for (const s of SANCTIONS_CATALOG) {
      expect(SANCTION_TRADEOFFS[s.id]).toBeDefined();
    }
    for (const d of deals) {
      expect(DEAL_TRADEOFFS[d.id]).toBeDefined();
    }
    for (const r of Object.keys(FILIBUSTER_RULES_CATALOG) as (keyof typeof FILIBUSTER_RULES_CATALOG)[]) {
      expect(FILIBUSTER_TRADEOFFS[r]).toBeDefined();
    }
    for (const r of Object.keys(REFORMS_CATALOG) as (keyof typeof REFORMS_CATALOG)[]) {
      expect(REFORM_TRADEOFFS[r]).toBeDefined();
    }
    for (const a of Object.keys(AMENDMENTS_CATALOG) as (keyof typeof AMENDMENTS_CATALOG)[]) {
      expect(AMENDMENT_TRADEOFFS[a]).toBeDefined();
    }
  });

  it('produces non-empty upside and catchText for every crisis option in CRISIS_CATALOG', () => {
    for (const crisis of CRISIS_CATALOG) {
      for (const opt of crisis.options) {
        const res = describeCrisisOptionTradeoff(opt.effects, opt.cloutCost, crisis.category === 'geopolitical');
        expect(res.upside.length).toBeGreaterThan(5);
        expect(res.catchText.length).toBeGreaterThan(5);
        expect(res.whyClick.length).toBeGreaterThan(10);
      }
    }
  });

  it('whyTextForMode switches between Plain Talk and Policy Wonk labels', () => {
    expect(whyTextForMode('fed:inflationGap', 'plain')).toBe('Fed fighting inflation');
    expect(whyTextForMode('fed:inflationGap', 'wonk')).toContain('Taylor Rule');
  });
});
