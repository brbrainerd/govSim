/**
 * Tests for ipc.ts helpers.
 *
 * Covers:
 *  - decodeCivicRights: bitmask → labelled array mapping
 *  - CIVIC_RIGHTS: structural invariants (9 entries, unique bits, unique labels)
 *  - invoke wrappers: correct command name + argument shape passed to Tauri invoke
 *
 * No Tauri bridge or tinro import — ipc.ts only imports from @tauri-apps/api/core
 * which is mocked below.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";

// @tauri-apps/api/core is only available inside a real Tauri window.
// Stub invoke so the module loads cleanly in Node.
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import {
  CIVIC_RIGHTS, decodeCivicRights,
  loadScenario, stepSim, getTick, getMetricsRows, getCurrentState, listLaws,
  getLawDslSource, enactFlatTax, enactUbi, enactAbatement, repealLaw,
  getLawEffect, exportMetricsParquet, ping, stepAndGetState,
  grantCivicRight, revokeCivicRight,
  saveSimSnapshot, getCounterfactualDiff, runMonteCarlo,
  getCitizenDistribution, getCitizenScatter,
  getRegionStats,
} from "./ipc";

const mockedInvoke = vi.mocked(invoke);

// ── CIVIC_RIGHTS structural invariants ────────────────────────────────────────

describe("CIVIC_RIGHTS", () => {
  it("contains exactly 9 entries (one per CivicRights flag in Rust)", () => {
    expect(CIVIC_RIGHTS).toHaveLength(9);
  });

  it("all bits are distinct powers of two", () => {
    const bits = CIVIC_RIGHTS.map(r => r.bit);
    const uniqueBits = new Set(bits);
    expect(uniqueBits.size).toBe(9);
    bits.forEach(b => {
      // A power of two has exactly one set bit: b & (b-1) === 0 and b > 0
      expect(b).toBeGreaterThan(0);
      expect(b & (b - 1)).toBe(0);
    });
  });

  it("all labels are non-empty and unique", () => {
    const labels = CIVIC_RIGHTS.map(r => r.label);
    const unique  = new Set(labels);
    expect(unique.size).toBe(9);
    labels.forEach(l => expect(l.length).toBeGreaterThan(0));
  });

  it("all descriptions are non-empty strings", () => {
    CIVIC_RIGHTS.forEach(r => {
      expect(typeof r.description).toBe("string");
      expect(r.description.length).toBeGreaterThan(0);
    });
  });

  it("bits cover the range 1<<0 through 1<<8", () => {
    const bits = new Set(CIVIC_RIGHTS.map(r => r.bit));
    for (let i = 0; i <= 8; i++) {
      expect(bits.has(1 << i)).toBe(true);
    }
  });
});

// ── decodeCivicRights ─────────────────────────────────────────────────────────

describe("decodeCivicRights", () => {
  it("returns an array of length 9 for any input", () => {
    expect(decodeCivicRights(0)).toHaveLength(9);
    expect(decodeCivicRights(0b111111111)).toHaveLength(9);
    expect(decodeCivicRights(0xFFFF)).toHaveLength(9);
  });

  it("all rights are withheld when bits = 0", () => {
    const result = decodeCivicRights(0);
    expect(result.every(r => !r.granted)).toBe(true);
  });

  it("all rights are granted when all 9 bits are set", () => {
    const allBits = CIVIC_RIGHTS.reduce((acc, r) => acc | r.bit, 0);
    const result  = decodeCivicRights(allBits);
    expect(result.every(r => r.granted)).toBe(true);
  });

  it("correctly grants only Universal Suffrage (bit 0)", () => {
    const result = decodeCivicRights(1 << 0);
    const suffrage = result.find(r => r.label === "Universal Suffrage");
    expect(suffrage?.granted).toBe(true);
    // All other rights must be withheld
    result.filter(r => r.label !== "Universal Suffrage").forEach(r => {
      expect(r.granted).toBe(false);
    });
  });

  it("correctly grants only Free Speech (bit 7)", () => {
    const result    = decodeCivicRights(1 << 7);
    const freeSpeech = result.find(r => r.label === "Free Speech");
    expect(freeSpeech?.granted).toBe(true);
    result.filter(r => r.label !== "Free Speech").forEach(r => {
      expect(r.granted).toBe(false);
    });
  });

  it("correctly grants only Abolition of Slavery (bit 8)", () => {
    const result    = decodeCivicRights(1 << 8);
    const abolition = result.find(r => r.label === "Abolition of Slavery");
    expect(abolition?.granted).toBe(true);
    result.filter(r => r.label !== "Abolition of Slavery").forEach(r => {
      expect(r.granted).toBe(false);
    });
  });

  it("granted count matches popcount of the bits argument", () => {
    // 0b000001101 = bits 0 + 2 + 3 → 3 rights granted
    const bits    = (1 << 0) | (1 << 2) | (1 << 3);
    const granted = decodeCivicRights(bits).filter(r => r.granted).length;
    expect(granted).toBe(3);
  });

  it("output preserves CIVIC_RIGHTS label order", () => {
    const result = decodeCivicRights(0);
    const labels = result.map(r => r.label);
    expect(labels).toEqual(CIVIC_RIGHTS.map(r => r.label));
  });

  it("extra high bits beyond bit 8 are ignored (no phantom rights)", () => {
    // Set bits 0-8 plus bits 9-15 — should still show exactly 9 granted
    const allValidBits = CIVIC_RIGHTS.reduce((acc, r) => acc | r.bit, 0);
    const withJunk     = allValidBits | (1 << 9) | (1 << 15);
    const result       = decodeCivicRights(withJunk);
    expect(result).toHaveLength(9);
    expect(result.every(r => r.granted)).toBe(true);
  });
});

// ── invoke wrapper tests ──────────────────────────────────────────────────────
//
// Each wrapper must pass the exact Tauri command name and parameter object.
// We verify both so a rename or typo in ipc.ts fails a test immediately.

describe("grantCivicRight", () => {
  beforeEach(() => { mockedInvoke.mockResolvedValue(7); });

  it("calls invoke with command 'grant_civic_right'", async () => {
    await grantCivicRight(1);
    expect(mockedInvoke).toHaveBeenCalledWith("grant_civic_right", { bit: 1 });
  });

  it("passes the bit value through to invoke", async () => {
    await grantCivicRight(1 << 5);
    expect(mockedInvoke).toHaveBeenCalledWith("grant_civic_right", { bit: 32 });
  });

  it("resolves to the value returned by invoke", async () => {
    mockedInvoke.mockResolvedValue(255);
    const result = await grantCivicRight(1 << 0);
    expect(result).toBe(255);
  });
});

describe("revokeCivicRight", () => {
  beforeEach(() => { mockedInvoke.mockResolvedValue([3, 0.5]); });

  it("calls invoke with command 'revoke_civic_right'", async () => {
    await revokeCivicRight(1);
    expect(mockedInvoke).toHaveBeenCalledWith("revoke_civic_right", { bit: 1 });
  });

  it("passes the bit value through to invoke", async () => {
    await revokeCivicRight(1 << 4);
    expect(mockedInvoke).toHaveBeenCalledWith("revoke_civic_right", { bit: 16 });
  });

  it("resolves to the [newBits, debtDelta] tuple returned by invoke", async () => {
    mockedInvoke.mockResolvedValue([6, 0.5]);
    const result = await revokeCivicRight(1);
    expect(result).toEqual([6, 0.5]);
  });

  it("resolves to [bits, 0] when revoking a never-granted right", async () => {
    mockedInvoke.mockResolvedValue([0, 0]);
    const result = await revokeCivicRight(1 << 8);
    expect(result).toEqual([0, 0]);
  });
});

describe("saveSimSnapshot", () => {
  beforeEach(() => { mockedInvoke.mockResolvedValue(42); });

  it("calls invoke with command 'save_sim_snapshot' and no extra args", async () => {
    await saveSimSnapshot();
    expect(mockedInvoke).toHaveBeenCalledWith("save_sim_snapshot");
  });

  it("resolves to the tick number returned by invoke", async () => {
    mockedInvoke.mockResolvedValue(180);
    const tick = await saveSimSnapshot();
    expect(tick).toBe(180);
  });
});

describe("getCounterfactualDiff", () => {
  const fakeEstimate = {
    enacted_tick: 30, window_ticks: 30,
    did_approval: 0.02, did_gdp: 500, did_pollution: -0.1,
    did_unemployment: -0.01, did_legitimacy: 0.0, did_treasury: 1000,
    treatment_post_approval: 0.65, treatment_post_gdp: 5e6,
  };

  beforeEach(() => { mockedInvoke.mockResolvedValue(fakeEstimate); });

  it("calls invoke with 'get_counterfactual_diff' and correct args", async () => {
    await getCounterfactualDiff(7, 30);
    expect(mockedInvoke).toHaveBeenCalledWith("get_counterfactual_diff", {
      lawId: 7, windowTicks: 30,
    });
  });

  it("uses default windowTicks=30 when not supplied", async () => {
    await getCounterfactualDiff(7);
    expect(mockedInvoke).toHaveBeenCalledWith("get_counterfactual_diff", {
      lawId: 7, windowTicks: 30,
    });
  });

  it("resolves to the CausalEstimateDto returned by invoke", async () => {
    const result = await getCounterfactualDiff(7);
    expect(result).toEqual(fakeEstimate);
  });
});

describe("runMonteCarlo", () => {
  const fakeSummary = {
    n_runs: 20,
    mean_did_approval: 0.01, std_did_approval: 0.002,
    p5_did_approval: -0.01, p95_did_approval: 0.03,
    mean_did_gdp: 200,       std_did_gdp: 50,
    p5_did_gdp: 100,         p95_did_gdp: 300,
    mean_did_pollution: null, std_did_pollution: null,
    p5_did_pollution: null,   p95_did_pollution: null,
    mean_did_unemployment: -0.005, std_did_unemployment: 0.001,
    p5_did_unemployment: -0.01,    p95_did_unemployment: 0.0,
    mean_did_legitimacy: 0.0, std_did_legitimacy: 0.0,
    p5_did_legitimacy: 0.0,   p95_did_legitimacy: 0.0,
    mean_did_treasury: 500,   std_did_treasury: 100,
    p5_did_treasury: 300,     p95_did_treasury: 700,
  };

  beforeEach(() => { mockedInvoke.mockResolvedValue(fakeSummary); });

  it("calls invoke with 'run_monte_carlo' and correct args", async () => {
    await runMonteCarlo(3, 30, 20);
    expect(mockedInvoke).toHaveBeenCalledWith("run_monte_carlo", {
      lawId: 3, windowTicks: 30, nRuns: 20,
    });
  });

  it("uses defaults windowTicks=30, nRuns=20 when not supplied", async () => {
    await runMonteCarlo(3);
    expect(mockedInvoke).toHaveBeenCalledWith("run_monte_carlo", {
      lawId: 3, windowTicks: 30, nRuns: 20,
    });
  });

  it("resolves to the MonteCarloSummaryDto returned by invoke", async () => {
    const result = await runMonteCarlo(3);
    expect(result).toEqual(fakeSummary);
  });

  it("passes custom nRuns through to invoke", async () => {
    await runMonteCarlo(5, 60, 50);
    expect(mockedInvoke).toHaveBeenCalledWith("run_monte_carlo", {
      lawId: 5, windowTicks: 60, nRuns: 50,
    });
  });
});

describe("getCitizenDistribution", () => {
  const fakeDistribution = {
    income: { edges: [0, 1000], counts: [100], min: 0, max: 1000, mean: 500, n: 100 },
    wealth: { edges: [0, 5000], counts: [100], min: 0, max: 5000, mean: 2500, n: 100 },
    health: { edges: [0, 1], counts: [100], min: 0, max: 1, mean: 0.7, n: 100 },
    productivity: { edges: [0, 1], counts: [100], min: 0, max: 1, mean: 0.6, n: 100 },
    n_citizens: 100,
  };

  beforeEach(() => { mockedInvoke.mockResolvedValue(fakeDistribution); });

  it("calls invoke with 'get_citizen_distribution' and regionId=null by default", async () => {
    await getCitizenDistribution();
    expect(mockedInvoke).toHaveBeenCalledWith("get_citizen_distribution", { regionId: null });
  });

  it("passes regionId when supplied", async () => {
    await getCitizenDistribution(2);
    expect(mockedInvoke).toHaveBeenCalledWith("get_citizen_distribution", { regionId: 2 });
  });

  it("resolves to the CitizenDistributionDto returned by invoke", async () => {
    const result = await getCitizenDistribution();
    expect(result).toEqual(fakeDistribution);
  });
});

describe("getCitizenScatter", () => {
  const fakePoints: [number, number, number, number][] = [[500, 2000, 0.7, 0.6]];

  beforeEach(() => { mockedInvoke.mockResolvedValue(fakePoints); });

  it("calls invoke with 'get_citizen_scatter' and correct defaults", async () => {
    await getCitizenScatter();
    expect(mockedInvoke).toHaveBeenCalledWith("get_citizen_scatter", {
      maxPoints: 500, regionId: null,
    });
  });

  it("passes custom maxPoints and regionId", async () => {
    await getCitizenScatter(200, 3);
    expect(mockedInvoke).toHaveBeenCalledWith("get_citizen_scatter", {
      maxPoints: 200, regionId: 3,
    });
  });

  it("resolves to the scatter point array returned by invoke", async () => {
    const result = await getCitizenScatter();
    expect(result).toEqual(fakePoints);
  });
});

describe("getRegionStats", () => {
  const fakeStats = [
    { region_id: 0, population: 1000, mean_approval: 0.6,
      mean_income: 3000, unemployment_rate: 0.05, mean_health: 0.7 },
  ];

  beforeEach(() => { mockedInvoke.mockResolvedValue(fakeStats); });

  it("calls invoke with 'get_region_stats' and no extra args", async () => {
    await getRegionStats();
    expect(mockedInvoke).toHaveBeenCalledWith("get_region_stats");
  });

  it("resolves to the RegionStatsDto array returned by invoke", async () => {
    const result = await getRegionStats();
    expect(result).toEqual(fakeStats);
  });
});

// ── Remaining simple invoke wrappers ─────────────────────────────────────────

describe("loadScenario", () => {
  beforeEach(() => { mockedInvoke.mockResolvedValue("modern_democracy"); });

  it("calls invoke with 'load_scenario' and { name }", async () => {
    await loadScenario("modern_democracy");
    expect(mockedInvoke).toHaveBeenCalledWith("load_scenario", { name: "modern_democracy" });
  });

  it("resolves to the scenario name returned by invoke", async () => {
    const result = await loadScenario("modern_democracy");
    expect(result).toBe("modern_democracy");
  });
});

describe("stepSim", () => {
  beforeEach(() => { mockedInvoke.mockResolvedValue(42); });

  it("calls invoke with 'step_sim' and { ticks }", async () => {
    await stepSim(30);
    expect(mockedInvoke).toHaveBeenCalledWith("step_sim", { ticks: 30 });
  });

  it("uses default ticks=1 when not supplied", async () => {
    await stepSim();
    expect(mockedInvoke).toHaveBeenCalledWith("step_sim", { ticks: 1 });
  });
});

describe("getTick", () => {
  it("calls invoke with 'get_tick' and no args", async () => {
    mockedInvoke.mockResolvedValue(100);
    await getTick();
    expect(mockedInvoke).toHaveBeenCalledWith("get_tick");
  });
});

describe("getMetricsRows", () => {
  beforeEach(() => { mockedInvoke.mockResolvedValue([]); });

  it("calls invoke with 'get_metrics_rows' and { n }", async () => {
    await getMetricsRows(360);
    expect(mockedInvoke).toHaveBeenCalledWith("get_metrics_rows", { n: 360 });
  });

  it("uses default n=360 when not supplied", async () => {
    await getMetricsRows();
    expect(mockedInvoke).toHaveBeenCalledWith("get_metrics_rows", { n: 360 });
  });
});

describe("getCurrentState", () => {
  it("calls invoke with 'get_current_state' and no args", async () => {
    mockedInvoke.mockResolvedValue({});
    await getCurrentState();
    expect(mockedInvoke).toHaveBeenCalledWith("get_current_state");
  });
});

describe("listLaws", () => {
  it("calls invoke with 'list_laws' and no args", async () => {
    mockedInvoke.mockResolvedValue([]);
    await listLaws();
    expect(mockedInvoke).toHaveBeenCalledWith("list_laws");
  });
});

describe("getLawDslSource", () => {
  it("calls invoke with 'get_law_dsl_source' and { lawId } (snake → camelCase)", async () => {
    mockedInvoke.mockResolvedValue("scope taxpayer {}");
    await getLawDslSource(7);
    expect(mockedInvoke).toHaveBeenCalledWith("get_law_dsl_source", { lawId: 7 });
  });

  it("resolves to null when invoke returns null", async () => {
    mockedInvoke.mockResolvedValue(null);
    const result = await getLawDslSource(99);
    expect(result).toBeNull();
  });
});

describe("enactFlatTax", () => {
  beforeEach(() => { mockedInvoke.mockResolvedValue(1); });

  it("calls invoke with 'enact_flat_tax' and { params: { rate } }", async () => {
    await enactFlatTax(0.25);
    expect(mockedInvoke).toHaveBeenCalledWith("enact_flat_tax", { params: { rate: 0.25 } });
  });

  it("resolves to the law ID returned by invoke", async () => {
    mockedInvoke.mockResolvedValue(3);
    expect(await enactFlatTax(0.1)).toBe(3);
  });
});

describe("enactUbi", () => {
  beforeEach(() => { mockedInvoke.mockResolvedValue(2); });

  it("calls invoke with 'enact_ubi' and { params: { monthly_amount } }", async () => {
    await enactUbi(500);
    expect(mockedInvoke).toHaveBeenCalledWith("enact_ubi", { params: { monthly_amount: 500 } });
  });

  it("resolves to the law ID returned by invoke", async () => {
    mockedInvoke.mockResolvedValue(5);
    expect(await enactUbi(200)).toBe(5);
  });
});

describe("enactAbatement", () => {
  beforeEach(() => { mockedInvoke.mockResolvedValue(4); });

  it("calls invoke with 'enact_abatement' and { params: { pollution_reduction_pu, cost_per_pu } }", async () => {
    await enactAbatement(0.5, 10_000);
    expect(mockedInvoke).toHaveBeenCalledWith("enact_abatement", {
      params: { pollution_reduction_pu: 0.5, cost_per_pu: 10_000 },
    });
  });

  it("resolves to the law ID returned by invoke", async () => {
    mockedInvoke.mockResolvedValue(6);
    expect(await enactAbatement(1.0, 5_000)).toBe(6);
  });
});

describe("repealLaw", () => {
  it("calls invoke with 'repeal_law' and { lawId } (snake → camelCase)", async () => {
    mockedInvoke.mockResolvedValue(undefined);
    await repealLaw(3);
    expect(mockedInvoke).toHaveBeenCalledWith("repeal_law", { lawId: 3 });
  });
});

describe("getLawEffect", () => {
  const fakeEffect = {
    pre: { from_tick: 0, to_tick: 30, n_rows: 30, mean_approval: 0.6,
           mean_unemployment: 0.1, mean_gdp: 5e6, mean_pollution: 0.5,
           mean_legitimacy: 0.05, mean_treasury: 1e6,
           min_approval: 0.55, max_approval: 0.65, min_gdp: 4.9e6, max_gdp: 5.1e6 },
    post: { from_tick: 30, to_tick: 60, n_rows: 30, mean_approval: 0.62,
            mean_unemployment: 0.09, mean_gdp: 5.1e6, mean_pollution: 0.45,
            mean_legitimacy: 0.04, mean_treasury: 1.1e6,
            min_approval: 0.57, max_approval: 0.67, min_gdp: 5.0e6, max_gdp: 5.2e6 },
    delta_approval: 0.02, delta_unemployment: -0.01, delta_gdp: 1e5,
    delta_pollution: -0.05, delta_legitimacy: -0.01, delta_treasury: 1e5,
  };

  beforeEach(() => { mockedInvoke.mockResolvedValue(fakeEffect); });

  it("calls invoke with 'get_law_effect' and renamed camelCase args", async () => {
    await getLawEffect(30, 30);
    expect(mockedInvoke).toHaveBeenCalledWith("get_law_effect", {
      enactedTick: 30, windowTicks: 30,
    });
  });

  it("uses default windowTicks=30 when not supplied", async () => {
    await getLawEffect(60);
    expect(mockedInvoke).toHaveBeenCalledWith("get_law_effect", {
      enactedTick: 60, windowTicks: 30,
    });
  });

  it("resolves to the LawEffectDto returned by invoke", async () => {
    const result = await getLawEffect(30);
    expect(result).toEqual(fakeEffect);
  });
});

describe("exportMetricsParquet", () => {
  it("calls invoke with 'export_metrics_parquet' and { path }", async () => {
    mockedInvoke.mockResolvedValue(undefined);
    await exportMetricsParquet("/tmp/metrics.parquet");
    expect(mockedInvoke).toHaveBeenCalledWith("export_metrics_parquet", {
      path: "/tmp/metrics.parquet",
    });
  });
});

describe("ping", () => {
  it("calls invoke with 'ping' and no args", async () => {
    mockedInvoke.mockResolvedValue("pong");
    const result = await ping();
    expect(mockedInvoke).toHaveBeenCalledWith("ping");
    expect(result).toBe("pong");
  });
});

describe("stepAndGetState", () => {
  const fakeResult = {
    tick: 30,
    state: { tick: 30, approval: 0.6 } as any,
    metrics: [],
    laws: [],
  };

  beforeEach(() => { mockedInvoke.mockResolvedValue(fakeResult); });

  it("calls invoke with 'step_and_get_state' and { ticks, metricsWindow }", async () => {
    await stepAndGetState(1, 360);
    expect(mockedInvoke).toHaveBeenCalledWith("step_and_get_state", {
      ticks: 1, metricsWindow: 360,
    });
  });

  it("uses defaults ticks=1, metricsWindow=360 when not supplied", async () => {
    await stepAndGetState();
    expect(mockedInvoke).toHaveBeenCalledWith("step_and_get_state", {
      ticks: 1, metricsWindow: 360,
    });
  });

  it("resolves to the StepResultDto returned by invoke", async () => {
    const result = await stepAndGetState();
    expect(result).toEqual(fakeResult);
  });
});
