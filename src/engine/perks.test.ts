import { describe, expect, it } from 'vitest';
import { newGame, endTurn } from './game';
import { START } from './fixture';
import { rollPerkSlate, perkRerollCost, totalPerkRerollsCost } from './perks';
import {
  ALL_PERKS_CATALOG,
  STANDARD_PERKS_CATALOG,
  EVIL_HEIST_RELICS_CATALOG,
  getPerk,
} from '../content/perks';

function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length <= 3) return 1;
  const stripped = clean.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const matches = stripped.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function fleschKincaidGrade(text: string): number {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (words.length === 0 || sentences.length === 0) return 0;
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  return 0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59;
}

describe('Quarterly Mandate & Task Force RNG Draft (Phase 44)', () => {
  it('catalog contains 24 Standard perks across Tiers I-IV and 9 Evil Mode Heist Relics', () => {
    expect(STANDARD_PERKS_CATALOG.length).toBe(24);
    expect(EVIL_HEIST_RELICS_CATALOG.length).toBe(9);
    expect(ALL_PERKS_CATALOG.length).toBe(33);

    const tiers = new Set(STANDARD_PERKS_CATALOG.map((p) => p.tier));
    expect(tiers).toEqual(new Set([1, 2, 3, 4]));
  });

  it('all 33 perk descriptions have Flesch-Kincaid reading grade <= 9.0', () => {
    const violations: string[] = [];
    for (const perk of ALL_PERKS_CATALOG) {
      const grade = fleschKincaidGrade(perk.description);
      if (grade > 9.0) {
        violations.push(`${perk.id} (${grade.toFixed(2)}): "${perk.description}"`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('rolls a deterministic 3-card slate from stream 21 and changes cleanly on reroll', () => {
    const s1 = newGame(4242, START);
    const s2 = newGame(4242, START);

    const slateA = rollPerkSlate(s1.seed, s1.turn, s1.approval, 0);
    const slateB = rollPerkSlate(s2.seed, s2.turn, s2.approval, 0);
    expect(slateA.map((p) => p.id)).toEqual(slateB.map((p) => p.id));
    expect(slateA.length).toBe(3);
    expect(new Set(slateA.map((p) => p.id)).size).toBe(3);

    const reroll1 = rollPerkSlate(s1.seed, s1.turn, s1.approval, 1);
    expect(reroll1.length).toBe(3);
    expect(reroll1.map((p) => p.id)).not.toEqual(slateA.map((p) => p.id));
  });

  it('preserves a locked card in slot 0 across rerolls and into the next quarter', () => {
    const s0 = newGame(777, START);
    const initialSlate = rollPerkSlate(s0.seed, s0.turn, s0.approval, 0);
    const lockedId = initialSlate[1]!.id;

    const rerolled = rollPerkSlate(s0.seed, s0.turn, s0.approval, 1, [], lockedId);
    expect(rerolled[0]!.id).toBe(lockedId);

    // Step turn with lockedId set
    const s1 = endTurn(s0, {
      perk: { lockedId },
    });
    expect(s1.lockedPerkId).toBe(lockedId);
    const nextQuarterSlate = rollPerkSlate(s1.seed, s1.turn, s1.approval, 0, s1.activePerks ?? [], s1.lockedPerkId);
    expect(nextQuarterSlate[0]!.id).toBe(lockedId);
  });

  it('computes escalating Clout reroll costs (6, 10, 14) and deducts on endTurn', () => {
    expect(perkRerollCost(0)).toBe(6);
    expect(perkRerollCost(1)).toBe(10);
    expect(perkRerollCost(2)).toBe(14);
    expect(totalPerkRerollsCost(2)).toBe(16);
    expect(totalPerkRerollsCost(3)).toBe(30);

    const s0 = { ...newGame(999, START), clout: 40 };
    const sBase = endTurn(s0, {});
    const sRerolled = endTurn(s0, {
      perk: { rerolls: 1, skipForClout: true },
    });

    // Skip gives +10 Clout, 1 reroll costs -6 Clout => net +4 Clout compared to base
    expect(sRerolled.clout - sBase.clout).toBe(4);
    const tracedCloutDelta = (sRerolled.report.trace.clout ?? []).reduce(
      (sum, t) => sum + t.amount,
      0,
    );
    expect(tracedCloutDelta).toBeCloseTo(sRerolled.clout - s0.clout, 5);
  });

  it('drafts a Task Force card and records causal trace deltas', () => {
    let state = newGame(12345, START);
    for (let i = 0; i < 4; i++) {
      const slate = rollPerkSlate(state.seed, state.turn, state.approval, 0, state.activePerks ?? []);
      const pick = slate.find((c) => c.cloutCost <= state.clout) ?? slate[0]!;
      expect(getPerk(pick.id)).toBeDefined();
      state = endTurn(state, {
        perk: {
          pickId: pick.id,
        },
      });
      expect(state.activePerks).toContain(pick.id);
    }
    expect(state.activePerks?.length).toBe(4);
  });
});
