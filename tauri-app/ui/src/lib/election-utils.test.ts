/**
 * Tests for election-utils.ts — pure history-extraction helpers.
 *
 * Covers:
 *  - buildElectionHistory: empty input, no elections, party change detected,
 *    re-election detected (consecutive_terms++), most-recent-first order,
 *    max-10 cap.
 *  - buildCrisisHistory: empty input, no crises, single crisis with resolved
 *    duration, still-active crisis duration, most-recent-first, max-10 cap.
 *  - buildRightsGrantedAt: no rights granted, first-set-tick recorded, later
 *    grants do not overwrite, unknown bits ignored.
 */
import { describe, it, expect } from "vitest";
import { buildElectionHistory, buildCrisisHistory, buildRightsGrantedAt } from "./election-utils";
import type { TickRow } from "./ipc";

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** Minimal TickRow with only the fields these helpers care about. */
function makeRow(overrides: Partial<TickRow> = {}): TickRow {
  return {
    tick: 0,
    population: 1000, gdp: 1e6, gini: 0.3, wealth_gini: 0.4,
    unemployment: 0.05, inflation: 0.02, approval: 0.6,
    gov_revenue: 1000, gov_expenditure: 900,
    incumbent_party: 1, election_margin: 0.1, consecutive_terms: 1,
    pollution_stock: 0, legitimacy_debt: 0, rights_granted_bits: 0,
    rights_granted_count: 0, rights_breadth: 0,
    treasury_balance: 1e5, price_level: 1, crisis_kind: 0,
    crisis_remaining_ticks: 0, mean_health: 0.7,
    mean_productivity: 0.5, mean_income: 3000, mean_wealth: 0, state_capacity_score: 1.0, approval_q1: 0.5, approval_q2: 0.5, approval_q3: 0.5, approval_q4: 0.5, approval_q5: 0.5,
    ...overrides,
  };
}

// ── buildElectionHistory ──────────────────────────────────────────────────────

describe("buildElectionHistory", () => {
  it("returns empty array for empty input", () => {
    expect(buildElectionHistory([])).toEqual([]);
  });

  it("returns empty array for a single row (no transitions possible)", () => {
    expect(buildElectionHistory([makeRow()])).toEqual([]);
  });

  it("returns empty array when no election events occur", () => {
    const rows = [
      makeRow({ tick: 1, incumbent_party: 1, consecutive_terms: 1 }),
      makeRow({ tick: 2, incumbent_party: 1, consecutive_terms: 1 }),
      makeRow({ tick: 3, incumbent_party: 1, consecutive_terms: 1 }),
    ];
    expect(buildElectionHistory(rows)).toEqual([]);
  });

  it("detects a party change as an election event", () => {
    const rows = [
      makeRow({ tick: 1, incumbent_party: 1, consecutive_terms: 1, election_margin: 0.1 }),
      makeRow({ tick: 2, incumbent_party: 2, consecutive_terms: 1, election_margin: 0.05 }),
    ];
    const history = buildElectionHistory(rows);
    expect(history).toHaveLength(1);
    expect(history[0].incumbent_party).toBe(2);
    expect(history[0].tick).toBe(2);
    expect(history[0].margin).toBeCloseTo(0.05);
  });

  it("detects a consecutive_terms increment as a re-election", () => {
    const rows = [
      makeRow({ tick: 360, incumbent_party: 1, consecutive_terms: 1 }),
      makeRow({ tick: 361, incumbent_party: 1, consecutive_terms: 2 }),
    ];
    const history = buildElectionHistory(rows);
    expect(history).toHaveLength(1);
    expect(history[0].consecutive_terms).toBe(2);
    expect(history[0].incumbent_party).toBe(1);
  });

  it("returns events in reverse chronological order (most recent first)", () => {
    const rows = [
      makeRow({ tick: 1,   incumbent_party: 1, consecutive_terms: 1 }),
      makeRow({ tick: 361, incumbent_party: 1, consecutive_terms: 2 }),
      makeRow({ tick: 721, incumbent_party: 2, consecutive_terms: 1 }),
    ];
    const history = buildElectionHistory(rows);
    expect(history).toHaveLength(2);
    expect(history[0].tick).toBe(721); // most recent first
    expect(history[1].tick).toBe(361);
  });

  it("caps output at 10 even when more than 10 elections occurred", () => {
    const rows: TickRow[] = [makeRow({ tick: 0, incumbent_party: 1, consecutive_terms: 1 })];
    for (let i = 1; i <= 15; i++) {
      rows.push(makeRow({ tick: i * 360, incumbent_party: 1, consecutive_terms: i + 1 }));
    }
    const history = buildElectionHistory(rows);
    expect(history.length).toBeLessThanOrEqual(10);
  });

  it("records the correct margin from the post-election row", () => {
    const rows = [
      makeRow({ tick: 1, incumbent_party: 1, consecutive_terms: 1, election_margin: 0.2 }),
      makeRow({ tick: 2, incumbent_party: 2, consecutive_terms: 1, election_margin: 0.07 }),
    ];
    expect(buildElectionHistory(rows)[0].margin).toBeCloseTo(0.07);
  });
});

// ── buildCrisisHistory ────────────────────────────────────────────────────────

describe("buildCrisisHistory", () => {
  it("returns empty array for empty input", () => {
    expect(buildCrisisHistory([])).toEqual([]);
  });

  it("returns empty array when no crisis ever starts", () => {
    const rows = [
      makeRow({ tick: 1, crisis_kind: 0 }),
      makeRow({ tick: 2, crisis_kind: 0 }),
    ];
    expect(buildCrisisHistory(rows)).toEqual([]);
  });

  it("does not record a crisis that was already active in the first row", () => {
    const rows = [
      makeRow({ tick: 1, crisis_kind: 2 }),
      makeRow({ tick: 2, crisis_kind: 2 }),
    ];
    expect(buildCrisisHistory(rows)).toHaveLength(0);
  });

  it("records onset tick and resolved duration correctly", () => {
    const rows = [
      makeRow({ tick: 10, crisis_kind: 0 }),
      makeRow({ tick: 11, crisis_kind: 1 }),
      makeRow({ tick: 12, crisis_kind: 1 }),
      makeRow({ tick: 13, crisis_kind: 0 }),
    ];
    const history = buildCrisisHistory(rows);
    expect(history).toHaveLength(1);
    expect(history[0].tick).toBe(11);
    expect(history[0].kind).toBe(1);
    expect(history[0].duration).toBe(2);
  });

  it("reports last-known tick as duration for a still-active crisis", () => {
    const rows = [
      makeRow({ tick: 100, crisis_kind: 0 }),
      makeRow({ tick: 101, crisis_kind: 3 }),
      makeRow({ tick: 102, crisis_kind: 3 }),
      makeRow({ tick: 103, crisis_kind: 3 }),
    ];
    const history = buildCrisisHistory(rows);
    expect(history).toHaveLength(1);
    expect(history[0].duration).toBe(2);
  });

  it("returns events in reverse chronological order", () => {
    const rows = [
      makeRow({ tick: 1,  crisis_kind: 0 }),
      makeRow({ tick: 2,  crisis_kind: 1 }),
      makeRow({ tick: 3,  crisis_kind: 0 }),
      makeRow({ tick: 10, crisis_kind: 0 }),
      makeRow({ tick: 11, crisis_kind: 2 }),
      makeRow({ tick: 12, crisis_kind: 0 }),
    ];
    const history = buildCrisisHistory(rows);
    expect(history).toHaveLength(2);
    expect(history[0].tick).toBe(11);
    expect(history[1].tick).toBe(2);
  });

  it("caps output at 10", () => {
    const rows: TickRow[] = [];
    for (let i = 0; i < 15; i++) {
      rows.push(makeRow({ tick: i * 4,     crisis_kind: 0 }));
      rows.push(makeRow({ tick: i * 4 + 1, crisis_kind: 1 }));
      rows.push(makeRow({ tick: i * 4 + 2, crisis_kind: 0 }));
    }
    expect(buildCrisisHistory(rows).length).toBeLessThanOrEqual(10);
  });
});

// ── buildRightsGrantedAt ──────────────────────────────────────────────────────

describe("buildRightsGrantedAt", () => {
  const RIGHTS = [{ bit: 1 }, { bit: 2 }, { bit: 4 }] as const;

  it("returns empty object when no rights are ever set", () => {
    const rows = [
      makeRow({ tick: 1, rights_granted_bits: 0 }),
      makeRow({ tick: 2, rights_granted_bits: 0 }),
    ];
    expect(buildRightsGrantedAt(rows, RIGHTS)).toEqual({});
  });

  it("records the first tick at which a bit is set", () => {
    const rows = [
      makeRow({ tick: 10, rights_granted_bits: 0 }),
      makeRow({ tick: 20, rights_granted_bits: 1 }),
      makeRow({ tick: 30, rights_granted_bits: 1 }),
    ];
    const result = buildRightsGrantedAt(rows, RIGHTS);
    expect(result[1]).toBe(20);
  });

  it("does not overwrite first-seen tick with a later tick", () => {
    const rows = [
      makeRow({ tick: 5,  rights_granted_bits: 2 }),
      makeRow({ tick: 10, rights_granted_bits: 2 }),
    ];
    const result = buildRightsGrantedAt(rows, RIGHTS);
    expect(result[2]).toBe(5);
  });

  it("records multiple bits independently", () => {
    const rows = [
      makeRow({ tick: 1, rights_granted_bits: 1 }),
      makeRow({ tick: 2, rights_granted_bits: 3 }),
      makeRow({ tick: 3, rights_granted_bits: 7 }),
    ];
    const result = buildRightsGrantedAt(rows, RIGHTS);
    expect(result[1]).toBe(1);
    expect(result[2]).toBe(2);
    expect(result[4]).toBe(3);
  });

  it("ignores bits not present in the civicRights array", () => {
    const rows = [
      makeRow({ tick: 1, rights_granted_bits: 0xFF }),
    ];
    const result = buildRightsGrantedAt(rows, RIGHTS);
    expect(Object.keys(result).map(Number).sort()).toEqual([1, 2, 4]);
  });

  it("returns empty object for empty rows", () => {
    expect(buildRightsGrantedAt([], RIGHTS)).toEqual({});
  });

  it("returns empty object for empty civicRights array", () => {
    const rows = [makeRow({ tick: 1, rights_granted_bits: 0xFF })];
    expect(buildRightsGrantedAt(rows, [])).toEqual({});
  });
});
