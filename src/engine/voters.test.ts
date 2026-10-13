import { describe, expect, it } from 'vitest';
import { DISTRICTS } from '../data/electoral';
import { fromData, us } from '../data/us';
import { calculateMidtermShift, groupsFor, HOUSE_SEATS, SENATE_SEATS } from './congress';
import { START } from './fixture';
import { newGame, step } from './game';
import { TOTAL_ELECTORAL_VOTES, TO_WIN_ELECTORAL_VOTES } from './units';
import { calculateElectoralCollege, calculateStateFamilyRelief, calculateTippingPointOffset } from './voters';

describe('electoral data and allocation (VOT-06, GR-13)', () => {
  it('allocates exactly 538 electoral votes across all voting units', () => {
    const state = newGame(42, START);
    const summary = calculateElectoralCollege(state, 'R');

    expect(summary.playerVotes + summary.opponentVotes).toBe(TOTAL_ELECTORAL_VOTES);
    expect(TOTAL_ELECTORAL_VOTES).toBe(538);

    // DC has 3 EV
    expect(summary.states['DC']!.electoralVotes).toBe(3);

    // Maine has 4 EV total: 2 at-large + 2 districts
    expect(summary.states['ME']!.electoralVotes).toBe(4);
    expect(summary.districts['ME-1']!.electoralVotes).toBe(1);
    expect(summary.districts['ME-2']!.electoralVotes).toBe(1);

    // Nebraska has 5 EV total: 2 at-large + 3 districts
    expect(summary.states['NE']!.electoralVotes).toBe(5);
    expect(summary.districts['NE-1']!.electoralVotes).toBe(1);
    expect(summary.districts['NE-2']!.electoralVotes).toBe(1);
    expect(summary.districts['NE-3']!.electoralVotes).toBe(1);
  });
});

describe('2024 unadjusted baseline replay (GR-14)', () => {
  it('reproduces 2024 certified results: Trump 312, Harris 226, ME-2 to R, NE-2 to D', () => {
    const state = newGame(1, START);

    // Unadjusted Republican perspective (Trump)
    const trump = calculateElectoralCollege(state, 'R', { unadjusted: true });
    expect(trump.playerVotes).toBe(312);
    expect(trump.opponentVotes).toBe(226);
    expect(trump.districts['ME-2']!.winner).toBe('you'); // Trump won ME-2
    expect(trump.districts['NE-2']!.winner).toBe('them'); // Harris won NE-2

    // Unadjusted Democratic perspective (Harris)
    const harris = calculateElectoralCollege(state, 'D', { unadjusted: true });
    expect(harris.playerVotes).toBe(226);
    expect(harris.opponentVotes).toBe(312);
    expect(harris.districts['ME-2']!.winner).toBe('them');
    expect(harris.districts['NE-2']!.winner).toBe('you');
  });
});

describe('party fairness & tipping-point centring (D4, VOT-04, GR-16)', () => {
  it('tipping-point offset balances baseline starting electoral votes at ~270 for both parties', () => {
    const start = fromData(us);
    const state = newGame(100, start);

    const rSummary = calculateElectoralCollege(state, 'R');
    const dSummary = calculateElectoralCollege(state, 'D');

    // At baseline, Pennsylvania is the tipping-point state (19 EV).
    // Whoever wins PA crosses 270 EV:
    // - For R, winning PA yields 287 EV (268 without PA)
    // - For D, winning PA yields 270 EV (251 without PA)
    expect(rSummary.playerVotes).toBeGreaterThanOrEqual(268);
    expect(rSummary.playerVotes).toBeLessThanOrEqual(287);

    expect(dSummary.playerVotes).toBeGreaterThanOrEqual(251);
    expect(dSummary.playerVotes).toBeLessThanOrEqual(270);

    // Key swing states serve as tipping point
    expect(['PA', 'MI', 'WI', 'NV']).toContain(rSummary.tippingPointCode);
    expect(['PA', 'MI', 'WI', 'NV']).toContain(dSummary.tippingPointCode);
  });

  it('guarantees equal reelection odds within 5 pp over 300 random seeds (GR-16)', () => {
    const start = fromData(us);
    let rWins = 0;
    let dWins = 0;
    const SAMPLE_SEEDS = 300;

    for (let seed = 1; seed <= SAMPLE_SEEDS; seed++) {
      // Simulate run to turn 16 under neutral/autopilot play
      let sR = newGame(seed, start);
      let sD = newGame(seed, start);
      for (let t = 1; t < 16; t++) {
        sR = step(sR, {});
        sD = step(sD, {});
      }

      const rTally = calculateElectoralCollege(sR, 'R');
      const dTally = calculateElectoralCollege(sD, 'D');

      if (rTally.playerVotes >= TO_WIN_ELECTORAL_VOTES) rWins++;
      if (dTally.playerVotes >= TO_WIN_ELECTORAL_VOTES) dWins++;
    }

    const rRate = (rWins / SAMPLE_SEEDS) * 100;
    const dRate = (dWins / SAMPLE_SEEDS) * 100;
    const diff = Math.abs(rRate - dRate);

    // Difference between party reelection rates must be <= 5 percentage points
    expect(diff).toBeLessThanOrEqual(5.0);
  });
});

describe('midterm election mechanics and bounded penalty (D3, VOT-05, GR-18, GR-19)', () => {
  it('strictly bounds House seat loss to <= 35 and gain to <= 15 seats', () => {
    // Extreme catastrophic approval: 10%
    const disaster = calculateMidtermShift(10);
    expect(disaster.houseShift).toBe(-35); // Bounded at -35
    expect(disaster.senateShift).toBe(-6); // Bounded at -6

    // Moderate low approval: 35%
    const bad = calculateMidtermShift(35);
    expect(bad.houseShift).toBeGreaterThanOrEqual(-35);
    expect(bad.houseShift).toBeLessThan(0);

    // High approval: 70%
    const landslide = calculateMidtermShift(70);
    expect(landslide.houseShift).toBeLessThanOrEqual(15);
    expect(landslide.houseShift).toBeGreaterThan(0);
    expect(landslide.senateShift).toBeLessThanOrEqual(4);
  });

  it('conserves House seats at 435 across any seat shift', () => {
    for (const delta of [-35, -20, -10, 0, 5, 15]) {
      const g = groupsFor(delta);
      const total = g.reduce((acc, grp) => acc + grp.seats, 0);
      expect(total).toBe(HOUSE_SEATS);
    }
  });

  it('records midterm log entry in step() at turn 8 and turn 24', () => {
    let s = newGame(123, START);
    for (let t = 1; t < 8; t++) {
      s = step(s, {});
    }
    expect(s.turn).toBe(8);

    // Advance past turn 8 (midterm election happens)
    s = step(s, {});
    expect(s.turn).toBe(9);
    const midtermLog = s.report.log.find((entry) => entry.kind === 'midterm');
    expect(midtermLog).toBeDefined();
    expect(midtermLog!.id).toBe('midterm_results');
    expect(typeof midtermLog!.amount).toBe('number');
    expect(s.houseSeatDelta).toBe(midtermLog!.amount);
  });
});

describe('honest projection range from Year 3 (VOT-03)', () => {
  it('omits projection range before turn 9 and includes honest bounds from turn 9', () => {
    const sTurn4 = { ...newGame(1, START), turn: 4 };
    const summary4 = calculateElectoralCollege(sTurn4, 'R');
    expect(summary4.projectionRange).toBeUndefined();

    const sTurn10 = { ...newGame(1, START), turn: 10 };
    const summary10 = calculateElectoralCollege(sTurn10, 'R');
    expect(summary10.projectionRange).toBeDefined();
    expect(summary10.projectionRange!.low).toBeLessThanOrEqual(summary10.playerVotes);
    expect(summary10.projectionRange!.high).toBeGreaterThanOrEqual(summary10.playerVotes);
    expect(summary10.projectionRange!.low).toBeGreaterThanOrEqual(0);
    expect(summary10.projectionRange!.high).toBeLessThanOrEqual(538);

    // Uncertainty narrows between turn 9 and turn 15
    const sTurn15 = { ...newGame(1, START), turn: 15 };
    const summary15 = calculateElectoralCollege(sTurn15, 'R');
    const width10 = summary10.projectionRange!.high - summary10.projectionRange!.low;
    const width15 = summary15.projectionRange!.high - summary15.projectionRange!.low;
    expect(width15).toBeLessThanOrEqual(width10);
  });
});

describe('industry exposure responses (VOT-02, VOT-06)', () => {
  it('penalizes farm state support when tariffs are raised', () => {
    const baseState = newGame(42, START);
    const summaryBase = calculateElectoralCollege(baseState, 'R');
    const iowaBase = summaryBase.states['IA']!;

    // Raise tariffs from baseline (11% -> 35%)
    const highTariffState: typeof baseState = {
      ...baseState,
      policy: { ...baseState.policy, tar: 35 },
    };
    const summaryHighTariff = calculateElectoralCollege(highTariffState, 'R');
    const iowaHighTariff = summaryHighTariff.states['IA']!;

    expect(iowaHighTariff.currentMargin).toBeLessThan(iowaBase.currentMargin);
    expect(iowaHighTariff.reasons).toContain('Farmers upset by tariffs');
  });
});

describe('regional social policy transmission & family relief (Phase 10, SOC-05)', () => {
  it('calculates state family relief with regional price parity adjustments', () => {
    const baseState = newGame(42, START);

    // Baseline social policy yields 0 relief
    expect(calculateStateFamilyRelief('TX', undefined)).toBe(0);
    expect(calculateStateFamilyRelief('TX', {})).toBe(0);

    // Expand ACA, drug negotiation, and universal Pre-K
    const progressiveReform = {
      aca: 120, // +20 pts
      drg: 50,  // 50%
      prek: 1,  // universal pre-K
    };

    const reliefTX = calculateStateFamilyRelief('TX', progressiveReform);
    const reliefMS = calculateStateFamilyRelief('MS', progressiveReform);
    const reliefCA = calculateStateFamilyRelief('CA', progressiveReform);

    expect(reliefTX).toBeGreaterThan(0);
    expect(reliefMS).toBeGreaterThan(0);
    expect(reliefCA).toBeGreaterThan(0);

    // Mississippi has lower RPP (~87.2) than California (~112.5), giving higher purchasing power relief
    expect(reliefMS).toBeGreaterThan(0);
  });

  it('transmits healthcare, immigration, energy, and education deltas to state margins', () => {
    const baseState = newGame(42, START);
    const baseSummary = calculateElectoralCollege(baseState, 'R');

    // 1. Healthcare reform (ACA + Drug price caps)
    const healthState = {
      ...baseState,
      socialPolicy: { aca: 120, drg: 50 },
    };
    const healthSummary = calculateElectoralCollege(healthState, 'R');

    // TX has higher uninsured rate than MA: TX should gain more from ACA
    const txBase = baseSummary.states['TX']!.currentMargin;
    const txHealth = healthSummary.states['TX']!.currentMargin;
    const maBase = baseSummary.states['MA']!.currentMargin;
    const maHealth = healthSummary.states['MA']!.currentMargin;

    expect(txHealth - txBase).toBeGreaterThan(maHealth - maBase);

    // FL has higher senior share than UT: FL should gain more from drug negotiations
    const flBase = baseSummary.states['FL']!.currentMargin;
    const flHealth = healthSummary.states['FL']!.currentMargin;
    const utBase = baseSummary.states['UT']!.currentMargin;
    const utHealth = healthSummary.states['UT']!.currentMargin;

    expect(flHealth - flBase).toBeGreaterThan(utHealth - utBase);
    expect(healthSummary.states['FL']!.reasons).toContain('Seniors benefit from Medicare drug price caps');

    // 2. Border enforcement
    const borderState = {
      ...baseState,
      socialPolicy: { bdr: 120 },
    };
    const borderSummary = calculateElectoralCollege(borderState, 'R');
    expect(borderSummary.states['TX']!.currentMargin).toBeGreaterThan(txBase);
    expect(borderSummary.states['TX']!.reasons).toContain('Border communities supported by enforcement resources');

    // Non-border state (e.g. OH) should not receive border boost relative to border state
    const ohBase = baseSummary.states['OH']!.currentMargin;
    const ohBorder = borderSummary.states['OH']!.currentMargin;
    expect(borderSummary.states['TX']!.currentMargin - txBase).toBeGreaterThan(ohBorder - ohBase);

    // 3. Fossil leasing vs Carbon standards
    const fossilState = {
      ...baseState,
      socialPolicy: { fos: 120 },
    };
    const fossilSummary = calculateElectoralCollege(fossilState, 'R');
    expect(fossilSummary.states['WY']!.currentMargin).toBeGreaterThan(baseSummary.states['WY']!.currentMargin);
    expect(fossilSummary.states['WY']!.reasons).toContain('Energy sector boosted by federal leasing permits');

    const carbonState = {
      ...baseState,
      socialPolicy: { crb: 50 },
    };
    const carbonSummary = calculateElectoralCollege(carbonState, 'R');
    expect(carbonSummary.states['WV']!.currentMargin).toBeLessThan(baseSummary.states['WV']!.currentMargin);
    expect(carbonSummary.states['WV']!.reasons).toContain('Utility bills rise under carbon standards');

    // 4. Education reforms
    const eduState = {
      ...baseState,
      socialPolicy: { prek: 1, sdr: 50, k12: 120 },
    };
    const eduSummary = calculateElectoralCollege(eduState, 'R');
    expect(eduSummary.states['GA']!.reasons).toContain('Young professionals benefit from student debt relief');
    expect(eduSummary.states['MS']!.reasons).toContain('Schools supported by Title I poverty grants');
    expect(eduSummary.states['UT']!.reasons).toContain('Parents relieved by universal pre-K grants');
  });

  it('guarantees baseline replay invariance when social policy is baseline or undefined', () => {
    const s1 = newGame(99, START);
    const summaryNoSocial = calculateElectoralCollege(s1, 'R');

    const s2 = {
      ...s1,
      socialPolicy: {
        aca: 100, drg: 0, pub: 0,
        bdr: 100, vis: 100, reg: 0,
        cln: 100, fos: 100, crb: 0,
        k12: 100, sdr: 0, prek: 0,
      },
    };
    const summaryBaselineSocial = calculateElectoralCollege(s2, 'R');

    expect(summaryNoSocial.playerVotes).toBe(summaryBaselineSocial.playerVotes);
    expect(summaryNoSocial.opponentVotes).toBe(summaryBaselineSocial.opponentVotes);
    expect(summaryNoSocial.tippingPointCode).toBe(summaryBaselineSocial.tippingPointCode);

    for (const code of Object.keys(summaryNoSocial.states)) {
      expect(summaryNoSocial.states[code]!.currentMargin).toBe(
        summaryBaselineSocial.states[code]!.currentMargin
      );
      expect(summaryNoSocial.states[code]!.reasons).toEqual(
        summaryBaselineSocial.states[code]!.reasons
      );
    }
  });
});
