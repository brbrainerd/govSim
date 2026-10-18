import { describe, expect, it } from 'vitest';
import { newGame, endTurn } from './game';
import { START } from './fixture';
import {
  computeActiveSynergies,
  computeDoctrineCounts,
  getActionDoctrineTags,
  getSynergyTier,
  resolveDoctrineSynergies,
} from './synergies';

describe('Policy Doctrine Synergy Tags & Chain-Reaction Engine (Phase 45)', () => {
  it('maps Executive Orders, Trade Agreements, Sector Tariffs, Reforms, and Evil Levers to Doctrine tags (SYN-01)', () => {
    expect(getActionDoctrineTags('eo_buy_american')).toEqual(['industrial', 'main_street']);
    expect(getActionDoctrineTags('eo_clean_fleet')).toEqual(['green', 'industrial']);
    expect(getActionDoctrineTags('eu')).toEqual(['globalist', 'green']);
    expect(getActionDoctrineTags('chips')).toEqual(['industrial', 'security']);
    expect(getActionDoctrineTags('statutory_ethics_code')).toEqual(['institutionalist']);
    expect(getActionDoctrineTags('crony_contracts')).toEqual(['shell_network', 'captured_regulators']);
  });

  it('computes 2 / 4 / 6 set thresholds across enacted perks, orders, trade pacts, and budget levers (SYN-02)', () => {
    expect(getSynergyTier(0)).toBe(0);
    expect(getSynergyTier(1)).toBe(0);
    expect(getSynergyTier(2)).toBe(2);
    expect(getSynergyTier(3)).toBe(2);
    expect(getSynergyTier(4)).toBe(4);
    expect(getSynergyTier(6)).toBe(6);

    const s0 = newGame(101, START);
    const sWithIndustrial = {
      ...s0,
      activePerks: ['tf_port_expediters', 'tf_semiconductor_fab'],
      activeOrders: ['eo_buy_american', 'eo_clean_fleet'],
    };
    const counts = computeDoctrineCounts(sWithIndustrial);
    expect(counts.industrial).toBeGreaterThanOrEqual(4);

    const families = computeActiveSynergies(sWithIndustrial, false);
    const indFam = families.find((f) => f.tag === 'industrial')!;
    expect(indFam.tier).toBe(4);
  });

  it('fires deterministic chain-reaction triggers and records causal trace terms when stacking families (SYN-02)', () => {
    const s0 = newGame(202, START);
    const s1 = endTurn(s0, {
      perk: { pickId: 'tf_port_expediters' },
      powers: { signOrders: ['eo_buy_american'] },
    });

    // Both tf_port_expediters and eo_buy_american have 'industrial' -> 2-piece Industrial chain fires!
    const synLogs = s1.report.log.filter((l) => l.kind === 'perk' && l.id.startsWith('synergy_'));
    expect(synLogs.some((l) => l.id === 'synergy_industrial')).toBe(true);
    expect(s1.report.trace.gap?.some((t) => t.source === 'synergy:doctrine')).toBe(true);
    expect(s1.report.trace.clout?.some((t) => t.source === 'clout:synergy')).toBe(true);
  });

  it('triggers Evil Mode Fixer Syndicate chain skims and heat laundering (HEIST-01)', () => {
    const s0 = newGame(303, START);
    const res = resolveDoctrineSynergies(
      s0,
      ['relic_cayman_trust', 'relic_crypto_mixer'],
      [],
      ['crony_contracts'],
      true,
    );
    expect(res.triggers.some((t) => t.tag === 'shell_network')).toBe(true);
    expect(res.passiveStashBonusBn + res.chainStashBonusBn).toBeGreaterThan(0);
  });
});
