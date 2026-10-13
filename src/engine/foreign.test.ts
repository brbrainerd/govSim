import { describe, expect, it } from 'vitest';
import { C } from './coefficients';
import {
  defaultForeignPolicy,
  getSanction,
  resolveForeignPolicy,
  SANCTIONS_CATALOG,
  sanitizeForeignPolicy,
  type ForeignPolicyDraft,
  type ForeignPolicyState,
} from './foreign';
import { newGame, step } from './game';
import { fromData, us } from '../data/us';
import { QUARTERS_PER_YEAR } from './units';

describe('foreign policy & targeted sanctions engine (Phase 14, FORPOL-01, FORPOL-02)', () => {
  it('SANCTIONS_CATALOG has 3 curated sanctions with legal bases and citations', () => {
    expect(SANCTIONS_CATALOG).toHaveLength(3);
    for (const sanction of SANCTIONS_CATALOG) {
      expect(sanction.name.length).toBeGreaterThan(5);
      expect(sanction.description.length).toBeGreaterThan(10);
      expect(sanction.legalBasis.length).toBeGreaterThan(5);
      expect(sanction.cloutCost).toBe(C.sanctionCloutCost);
      expect(sanction.inflationImpact).toBeGreaterThan(0);
      expect(sanction.gapImpact).toBeLessThan(0);
      expect(sanction.citation.url).toMatch(/^https:\/\//);
      expect(getSanction(sanction.id)).toBeDefined();
    }
  });

  it('sanitizeForeignPolicy clamps bounds and filters invalid types', () => {
    expect(sanitizeForeignPolicy(null)).toEqual({});
    expect(sanitizeForeignPolicy('invalid')).toEqual({});
    expect(sanitizeForeignPolicy({ defensePosture: 'invalid_posture' })).toEqual({
      defensePosture: undefined,
      foreignAssistance: undefined,
      activeSanctions: undefined,
    });

    const sanitized = sanitizeForeignPolicy({
      defensePosture: 'surge',
      foreignAssistance: 999, // above max 200
      activeSanctions: ['asset_freeze', 'invalid_sanction'],
    });

    expect(sanitized.defensePosture).toBe('surge');
    expect(sanitized.foreignAssistance).toBe(200);
    expect(sanitized.activeSanctions).toEqual(['asset_freeze']);
  });

  it('default foreign policy produces zero macro shocks', () => {
    const state = defaultForeignPolicy();
    const res = resolveForeignPolicy(state, {}, 100);
    expect(res.defensePosture).toBe('standard');
    expect(res.foreignAssistance).toBe(100);
    expect(res.activeSanctions).toEqual([]);
    expect(res.quarterlyDeficitDeltaBn).toBe(0);
    expect(res.quarterlyInflationDelta).toBe(0);
    expect(res.quarterlyGapDelta).toBe(0);
    expect(res.cloutSpent).toBe(0);
  });

  it('defense posture adjustments calculate correct quarterly deficit shifts', () => {
    const base = defaultForeignPolicy();

    // Surge: +$35B/yr = +$8.75B/quarter
    const surgeRes = resolveForeignPolicy(base, { defensePosture: 'surge' }, 100);
    expect(surgeRes.quarterlyDeficitDeltaBn).toBe(C.defenseSurgeCostBn / QUARTERS_PER_YEAR);

    // Peacetime: -$25B/yr = -$6.25B/quarter
    const peaceRes = resolveForeignPolicy(base, { defensePosture: 'peacetime' }, 100);
    expect(peaceRes.quarterlyDeficitDeltaBn).toBe(-C.defensePeacetimeSavingsBn / QUARTERS_PER_YEAR);
  });

  it('cutting foreign assistance to 0 saves ~$45B/year ($11.25B/quarter)', () => {
    const base = defaultForeignPolicy();
    // Foreign assistance cut from 100 to 0 (deviation -100)
    const cutRes = resolveForeignPolicy(base, { foreignAssistance: 0 }, 100);
    expect(cutRes.quarterlyDeficitDeltaBn).toBe((-100 * C.foreignAssistancePerPoint) / QUARTERS_PER_YEAR);
    expect(cutRes.quarterlyDeficitDeltaBn).toBeCloseTo(-11.25, 2);
  });

  it('enacting sanctions consumes clout and checks affordability', () => {
    const base = defaultForeignPolicy();

    // Player with 5 clout cannot afford 10 clout asset freeze
    const poorRes = resolveForeignPolicy(base, { activeSanctions: ['asset_freeze'] }, 5);
    expect(poorRes.activeSanctions).toEqual([]);
    expect(poorRes.cloutSpent).toBe(0);

    // Player with 20 clout can afford 2 sanctions (2 * 10 = 20)
    const richRes = resolveForeignPolicy(base, { activeSanctions: ['asset_freeze', 'export_controls'] }, 20);
    expect(richRes.activeSanctions).toEqual(['asset_freeze', 'export_controls']);
    expect(richRes.cloutSpent).toBe(20);
    expect(richRes.quarterlyInflationDelta).toBeCloseTo(C.sanctionAssetFreezeInflation + C.sanctionExportControlsInflation, 4);
    expect(richRes.quarterlyGapDelta).toBeCloseTo(-C.sanctionAssetFreezeOutput - C.sanctionExportControlsOutput, 4);
  });

  it('step() integrates foreign policy into macro ledgers, trace, and logs', () => {
    const start = fromData(us);
    let s = newGame(42, start);
    expect(s.foreignPolicy).toEqual(defaultForeignPolicy());

    // Turn 1: Surge defense posture and enact asset freeze
    s = step(s, {
      foreignPolicy: {
        defensePosture: 'surge',
        foreignAssistance: 80,
        activeSanctions: ['asset_freeze'],
      },
    });

    expect(s.foreignPolicy?.defensePosture).toBe('surge');
    expect(s.foreignPolicy?.foreignAssistance).toBe(80);
    expect(s.foreignPolicy?.activeSanctions).toEqual(['asset_freeze']);

    // Verify trace logs for forpol:budget and forpol:sanctions
    const dpTrace = s.report.trace.debtPct?.find((t) => t.source === 'forpol:budget');
    expect(dpTrace).toBeDefined();

    const gapTrace = s.report.trace.gap?.find((t) => t.source === 'forpol:sanctions');
    expect(gapTrace).toBeDefined();

    const inflTrace = s.report.trace.inflation?.find((t) => t.source === 'forpol:sanctions');
    expect(inflTrace).toBeDefined();

    // Verify event logs
    const postureLog = s.report.log.find((l) => l.kind === 'forpol' && l.id === 'defense_posture');
    expect(postureLog?.detail).toBe('surge');

    const assistanceLog = s.report.log.find((l) => l.kind === 'forpol' && l.id === 'foreign_assistance');
    expect(assistanceLog?.amount).toBe(80);

    const sanctionLog = s.report.log.find((l) => l.kind === 'forpol' && l.id === 'sanctions_enacted');
    expect(sanctionLog?.detail).toBe('asset_freeze');
  });
});
