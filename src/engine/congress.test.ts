import { describe, expect, it } from 'vitest';
import { fromPackage } from './budget';
import {
  calculateMidtermShift,
  calculateSenateVotes,
  deals,
  FILIBUSTER_RULES_CATALOG,
  findCheapestCoalition,
  getSenateClotureThreshold,
  groups,
  groupsFor,
  HOUSE_SEATS,
  socialWhipShift,
  tally,
  TO_PASS,
  voteOutcome,
} from './congress';
import { resolveBill } from './decisions';

describe('congressional groups and midterms', () => {
  it('conserves 435 House seats across all midterm approval levels and battleground shifts', () => {
    for (let approval = 10; approval <= 90; approval += 5) {
      for (const bgShift of [-10, -3, 0, 3, 10]) {
        const { houseShift } = calculateMidtermShift(approval, bgShift);
        const active = groupsFor(houseShift);
        const totalSeats = active.reduce((sum, g) => sum + g.seats, 0);
        expect(totalSeats).toBe(HOUSE_SEATS);
      }
    }
  });

  it('battleground margin shift mitigates or exacerbates midterm seat changes', () => {
    const base = calculateMidtermShift(45, 0);
    const withSwingAdvantage = calculateMidtermShift(45, 4.0);
    const withSwingPenalty = calculateMidtermShift(45, -4.0);

    expect(withSwingAdvantage.houseShift).toBeGreaterThan(base.houseShift);
    expect(withSwingPenalty.houseShift).toBeLessThan(base.houseShift);
    expect(withSwingAdvantage.senateShift).toBeGreaterThanOrEqual(base.senateShift);
    expect(withSwingPenalty.senateShift).toBeLessThanOrEqual(base.senateShift);
  });

  it('calculates default baseline tally correctly (203 total, 15 short)', () => {
    const res = tally([]);
    expect(res.total).toBe(203);
    expect(res.short).toBe(15);
    expect(res.byGroup.pro).toBe(95);
    expect(res.byGroup.mod).toBe(80);
    expect(res.byGroup.cen).toBe(20);
    expect(res.byGroup.con).toBe(8);
    expect(res.byGroup.fre).toBe(0);
  });

  it('deals add expected group votes and reduce shortage', () => {
    const res = tally(['mod', 'cen']);
    // mod adds +12 to mod (80 + 12 = 92)
    // cen adds +9 to cen (20 + 9 = 29)
    expect(res.byGroup.mod).toBe(92);
    expect(res.byGroup.cen).toBe(29);
    expect(res.total).toBe(203 + 12 + 9);
    expect(res.short).toBe(0);
  });
});

describe('social policy whip evaluation (SOC-01..04)', () => {
  it('evaluates ideological sensitivities across blocs', () => {
    // Highly progressive unfinanced bill
    const progDraft = { prek: 1, sdr: 20, cln: 120 };
    const progShift = socialWhipShift(progDraft);
    expect(progShift.con).toBeLessThan(0); // Conservatives strongly resist
    expect(progShift.cen).toBeLessThan(0); // Centrists resist unfinanced spending

    // Conservative bill
    const conDraft = { bdr: 120, fos: 120 };
    const conShift = socialWhipShift(conDraft);
    expect(conShift.con).toBeGreaterThan(0); // Conservatives support
    expect(conShift.pro).toBeLessThan(0); // Progressives oppose fossil expansion

    // Bipartisan compromise package: clean energy paired with fossil permitting, border paired with visas
    const compDraft = { cln: 120, fos: 120, bdr: 120, vis: 120 };
    const compShift = socialWhipShift(compDraft);
    expect(compShift.cen).toBeGreaterThan(0); // Centrists reward the compromise
    expect(compShift.con).toBeGreaterThan(0); // Conservatives gain on border & fossil
  });

  it('tally incorporates socialDraft and clamps each bloc to [0, seats]', () => {
    const unfinancedRes = tally([], 0, { prek: 1, sdr: 40, aca: 140 });
    // Without deals, heavy entitlement expansion loses votes among con/cen
    expect(unfinancedRes.total).toBeLessThan(203);

    // With deals and compromise, passes threshold
    const balancedRes = tally(['mod', 'cen'], 0, { cln: 120, fos: 120, bdr: 120, vis: 120 });
    expect(balancedRes.total).toBeGreaterThanOrEqual(TO_PASS);
    expect(balancedRes.short).toBe(0);
  });

  it('determines vote outcome and clout refunds', () => {
    expect(voteOutcome(220, 20)).toEqual({ passed: true, cloutBack: 10 });
    expect(voteOutcome(210, 20)).toEqual({ passed: false, cloutBack: 10 });
  });
});

describe('Senate filibuster reform & cloture rules (REF-01)', () => {
  it('exposes all 4 filibuster rules in catalog with valid thresholds and costs', () => {
    expect(FILIBUSTER_RULES_CATALOG.sixty_vote.threshold).toBe(60);
    expect(FILIBUSTER_RULES_CATALOG.sixty_vote.cloutCost).toBe(0);

    expect(FILIBUSTER_RULES_CATALOG.talking_filibuster.threshold).toBe('dynamic');
    expect(FILIBUSTER_RULES_CATALOG.talking_filibuster.cloutCost).toBe(15);

    expect(FILIBUSTER_RULES_CATALOG.fifty_five_vote.threshold).toBe(55);
    expect(FILIBUSTER_RULES_CATALOG.fifty_five_vote.cloutCost).toBe(20);

    expect(FILIBUSTER_RULES_CATALOG.simple_majority.threshold).toBe(51);
    expect(FILIBUSTER_RULES_CATALOG.simple_majority.cloutCost).toBe(35);
  });

  it('evaluates static cloture thresholds for sixty_vote, fifty_five_vote, simple_majority', () => {
    for (const app of [30, 50, 70, 90]) {
      expect(getSenateClotureThreshold('sixty_vote', app)).toBe(60);
      expect(getSenateClotureThreshold('fifty_five_vote', app)).toBe(55);
      expect(getSenateClotureThreshold('simple_majority', app)).toBe(51);
    }
  });

  it('dynamically scales talking filibuster threshold with presidential approval', () => {
    // At neutral approval (50), required cloture is 60
    expect(getSenateClotureThreshold('talking_filibuster', 50)).toBe(60);
    // Low approval does not raise cloture beyond 60
    expect(getSenateClotureThreshold('talking_filibuster', 35)).toBe(60);
    // At 60% approval, 60 - round(10 * 0.4) = 56
    expect(getSenateClotureThreshold('talking_filibuster', 60)).toBe(56);
    // At 70% approval, 60 - round(20 * 0.4) = 52
    expect(getSenateClotureThreshold('talking_filibuster', 70)).toBe(52);
    // High approval floors at simple majority (51)
    expect(getSenateClotureThreshold('talking_filibuster', 80)).toBe(51);
  });

  it('calculates Senate votes with approval bonuses and deal appeal', () => {
    // 50 base seats, neutral approval, no appeal
    expect(calculateSenateVotes(50, 50, 0)).toBe(50);
    // Approval bonus at 70% approval (+3)
    expect(calculateSenateVotes(50, 70, 0)).toBe(53);
    // Approval penalty at 35% approval (-2)
    expect(calculateSenateVotes(50, 35, 0)).toBe(48);
    // Crossover votes from deal appeal (appeal = 10 -> +5 votes)
    expect(calculateSenateVotes(50, 50, 10)).toBe(55);
    // Clamping to [0, 100]
    expect(calculateSenateVotes(98, 80, 10)).toBe(100);
    expect(calculateSenateVotes(2, 20, 0)).toBe(0);
  });

  it('evaluates bicameral passage: reconciliation passes at 51 while substantive bills hit filibuster', () => {
    const budget = { ...fromPackage('Keep as is') };
    const deals = ['mod', 'cen']; // Passes House (224 votes) and adds deal appeal (14 -> +7 Senate crossover)

    // 1. Pure budget reconciliation bill with sixty_vote rule: requires 51 Senate votes -> PASSES (57 >= 51)
    const pureBudget = resolveBill(120, { budget, deals }, 0, 0, 'sixty_vote', 50);
    expect(pureBudget.valid).toBe(true);
    expect(pureBudget.whip.total).toBeGreaterThanOrEqual(TO_PASS);
    expect(pureBudget.senateVotes).toBe(57);
    expect(pureBudget.senateThreshold).toBe(51);
    expect(pureBudget.status).toBe('passed');
    expect(pureBudget.passed).toBe(true);

    // 2. Substantive bill (with social reform): requires 60 Senate votes under sixty_vote -> FILIBUSTERED (57 < 60)
    const substantiveDraft = { prek: 1 };
    const substantive60 = resolveBill(120, { budget, deals, social: substantiveDraft }, 0, 0, 'sixty_vote', 50);
    expect(substantive60.valid).toBe(true);
    expect(substantive60.whip.total).toBeGreaterThanOrEqual(TO_PASS);
    expect(substantive60.senateVotes).toBe(57);
    expect(substantive60.senateThreshold).toBe(60);
    expect(substantive60.status).toBe('filibustered');
    expect(substantive60.passed).toBe(false);
    expect(substantive60.cloutBack).toBe(Math.floor(substantive60.spent / 2)); // Clout refund on filibuster failure

    // 3. Substantive bill under fifty_five_vote rule -> PASSES (57 >= 55)
    const substantive55 = resolveBill(120, { budget, deals, social: substantiveDraft }, 0, 0, 'fifty_five_vote', 50);
    expect(substantive55.senateThreshold).toBe(55);
    expect(substantive55.status).toBe('passed');
    expect(substantive55.passed).toBe(true);

    // 4. Substantive bill under talking_filibuster with 65% approval -> threshold 54 -> PASSES (59 >= 54)
    const substantiveTalking = resolveBill(120, { budget, deals, social: substantiveDraft }, 0, 0, 'talking_filibuster', 65);
    expect(substantiveTalking.senateThreshold).toBe(54);
    expect(substantiveTalking.senateVotes).toBe(59); // 50 + 2 (approval bonus) + 7 (crossover)
    expect(substantiveTalking.status).toBe('passed');
    expect(substantiveTalking.passed).toBe(true);

    // 5. Substantive bill under simple_majority (nuclear option) -> threshold 51 -> PASSES (57 >= 51)
    const substantiveNuclear = resolveBill(120, { budget, deals, social: substantiveDraft }, 0, 0, 'simple_majority', 50);
    expect(substantiveNuclear.senateThreshold).toBe(51);
    expect(substantiveNuclear.status).toBe('passed');
    expect(substantiveNuclear.passed).toBe(true);

    // 6. Substantive bill with full deal package (all 3 deals -> 20 appeal -> 10 crossover -> 60 votes) passes even sixty_vote
    const allDeals = ['mod', 'cen', 'spc'];
    const broadBipartisan = resolveBill(120, { budget, deals: allDeals, social: substantiveDraft }, 0, 0, 'sixty_vote', 50);
    expect(broadBipartisan.senateVotes).toBe(60);
    expect(broadBipartisan.status).toBe('passed');
    expect(broadBipartisan.passed).toBe(true);
  });

  it('finds the cheapest coalition of deals to reach 218 House votes (ADVISOR-02)', () => {
    // Baseline tally([]) has 203 votes (15 short of 218).
    // mod (+12 -> 215, 20 clout) + spc (+6 -> 221, 10 clout) = 30 clout for 221 votes,
    // whereas cen (+9 -> 212, 15 clout) + spc (+6 -> 218, 10 clout) = 25 clout for 218 votes!
    const cheapest = findCheapestCoalition([], 0);
    expect(cheapest.reachable).toBe(true);
    expect(cheapest.dealsToAdd).toEqual(['cen', 'spc']);
    expect(cheapest.additionalCost).toBe(25);
    expect(cheapest.projectedVotes).toBeGreaterThanOrEqual(TO_PASS);

    // If 'mod' is already staged (215 votes, 3 short), cheapest remaining deal is 'spc' (10 clout)
    const afterMod = findCheapestCoalition(['mod'], 0);
    expect(afterMod.reachable).toBe(true);
    expect(afterMod.dealsToAdd).toEqual(['spc']);
    expect(afterMod.additionalCost).toBe(10);
    expect(afterMod.projectedVotes).toBeGreaterThanOrEqual(TO_PASS);
  });
});

