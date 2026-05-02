<script lang="ts">
  import { sim, ui, navigate, formatMoney, pct, tickToDate } from "$lib/store.svelte";
  import { getCitizenDistribution, getCitizenScatter }   from "$lib/ipc";
  import type { CitizenDistributionDto, HistogramDto }   from "$lib/ipc";
  import Histogram    from "../components/Histogram.svelte";
  import ScatterChart from "../components/ScatterChart.svelte";
  import Tabs         from "../components/ui/Tabs.svelte";
  import Spinner      from "../components/ui/Spinner.svelte";

  // ── State ──────────────────────────────────────────────────────────────────
  let dist:          CitizenDistributionDto | null          = $state(null);
  let scatterPoints: [number, number, number][] | null      = $state(null);
  let loading:       boolean                                = $state(false);
  let error:         string                                 = $state("");
  let activeTab:     string                                 = $state("distributions");

  const TABS = [
    { id: "distributions", label: "Distributions" },
    { id: "scatter",       label: "Income vs Wealth" },
  ];

  // ── Data fetching ──────────────────────────────────────────────────────────
  async function fetchAll() {
    loading = true; error = "";
    try {
      dist = await getCitizenDistribution(ui.filterRegionId ?? undefined);
    } catch (e) {
      error = String(e);
    } finally {
      loading = false;
    }
  }

  async function fetchScatter() {
    try {
      // [income, wealth, health, productivity] → scatter uses income/wealth/health
      const raw = await getCitizenScatter(600, ui.filterRegionId ?? undefined);
      scatterPoints = raw.map(([inc, wlt, hlt]) => [inc, wlt, hlt] as [number, number, number]);
    } catch (e) {
      error = String(e);
    }
  }

  // Throttle heavy IPC: refresh at most once per simulated month (30 ticks).
  let lastFetchMonth = $state(-1);

  // Invalidate stale scatter whenever the region filter changes so switching
  // to the scatter tab after a filter change always shows fresh data.
  $effect(() => {
    void ui.filterRegionId;
    scatterPoints = null;
    // Force immediate refresh on filter change regardless of month throttle.
    lastFetchMonth = -1;
  });

  // Refetch histograms at most once per simulated month or on filter change.
  $effect(() => {
    const tick  = sim.tick;
    const month = Math.floor(tick / 30);
    void ui.filterRegionId;
    if (!sim.loaded) return;
    if (month === lastFetchMonth) return;
    lastFetchMonth = month;
    fetchAll();
    if (activeTab === "scatter") void fetchScatter();
  });

  // If user switches to the scatter tab and data hasn't been loaded yet
  // (e.g. first open without a tick change, or just cleared above), fetch it.
  $effect(() => {
    if (activeTab === "scatter" && scatterPoints === null) void fetchScatter();
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  type StatRow = [string, string];

  interface Panel {
    title:  string;
    hist:   HistogramDto;
    color:  string;
    stats:  StatRow[];
    fmtVal: (v: number) => string;
  }

  function statsFor(h: HistogramDto, fmtVal: (v: number) => string): StatRow[] {
    return [
      ["Citizens", h.n.toString()],
      ["Mean",     fmtVal(h.mean)],
      ["Min",      fmtVal(h.min)],
      ["Max",      fmtVal(h.max)],
    ];
  }

  function buildPanels(d: CitizenDistributionDto): Panel[] {
    return [
      { title: "Income",       hist: d.income,       color: "var(--chart-1)", stats: statsFor(d.income,       formatMoney), fmtVal: formatMoney },
      { title: "Wealth",       hist: d.wealth,       color: "var(--chart-2)", stats: statsFor(d.wealth,       formatMoney), fmtVal: formatMoney },
      { title: "Health",       hist: d.health,       color: "var(--chart-3)", stats: statsFor(d.health,       pct),         fmtVal: pct         },
      { title: "Productivity", hist: d.productivity, color: "var(--chart-5)", stats: statsFor(d.productivity, pct),         fmtVal: pct         },
    ];
  }

  const panels = $derived<Panel[]>(dist ? buildPanels(dist) : []);
</script>

<div class="citizen-view">
  <div class="page-header">
    <div class="title-row">
      <h1>Citizen Distribution</h1>
      {#if ui.filterRegionId !== null}
      <span class="region-pill">
        Region {ui.filterRegionId}
        <button class="pill-clear" onclick={() => { ui.filterRegionId = null; }} aria-label="Clear region filter">✕</button>
      </span>
      {/if}
    </div>
    <div class="header-right">
      {#if dist}
      <span class="tick-badge">tick {sim.tick} · {dist.n_citizens.toLocaleString()} citizens · {tickToDate(sim.tick)}</span>
      {/if}
      <button class="btn-refresh" onclick={() => { fetchAll(); if (activeTab === "scatter") fetchScatter(); }} disabled={loading}>
        {loading ? "Loading…" : "↻ Refresh"}
      </button>
    </div>
  </div>

  {#if loading && !dist}
  <div class="loading-msg"><Spinner size="sm" /> Loading citizen data…</div>
  {:else if error}
  <div class="error-msg">⚠ {error}</div>
  {:else if dist}

  <Tabs tabs={TABS} bind:active={activeTab} />

  <!-- ─── Tab: Distributions ─────────────────────────────────── -->
  {#if activeTab === "distributions"}
  <div role="tabpanel" id="panel-distributions" aria-labelledby="tab-distributions">
    <div class="panels-grid">
      {#each panels as p (p.title)}
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">{p.title}</span>
          <span class="panel-mean" style="color:{p.color}">avg {p.fmtVal(p.hist.mean)}</span>
        </div>

        <Histogram
          counts={p.hist.counts}
          edges={p.hist.edges}
          color={p.color}
          height="100px"
          formatEdge={p.fmtVal}
          label={`${p.title} distribution`}
        />

        <div class="stat-rows">
          {#each p.stats as [label, val]}
          <div class="stat-row">
            <span class="stat-label">{label}</span>
            <span class="stat-val">{val}</span>
          </div>
          {/each}
        </div>
      </div>
      {/each}
    </div>

    <!-- Inequality summary bar -->
    <div class="inequality-row">
      {#each [
        ["Income Gini",  sim.currentState ? (sim.currentState.gini * 100).toFixed(1) + "%" : "—",         (sim.currentState?.gini ?? 0) > 0.4],
        ["Wealth Gini",  sim.currentState ? (sim.currentState.wealth_gini * 100).toFixed(1) + "%" : "—",  (sim.currentState?.wealth_gini ?? 0) > 0.5],
        ["Unemployment", sim.currentState ? pct(sim.currentState.unemployment) : "—",                      (sim.currentState?.unemployment ?? 0) > 0.1],
        ["Population",
          ui.filterRegionId !== null && dist
            ? `${dist.n_citizens.toLocaleString()} / ${sim.currentState?.population.toLocaleString() ?? "—"}`
            : sim.currentState ? sim.currentState.population.toLocaleString() : "—",
          false],
        ["Date",         tickToDate(sim.tick),                                                              false],
      ] as [label, val, bad]}
      <div class="ineq-card">
        <span class="ineq-label">{label}</span>
        <span class="ineq-value" style={bad ? "color:var(--danger)" : ""}>{val}</span>
      </div>
      {/each}
    </div>
  </div>

  <!-- ─── Tab: Income vs Wealth scatter ──────────────────────── -->
  {:else if activeTab === "scatter"}
  <div role="tabpanel" id="panel-scatter" aria-labelledby="tab-scatter">
    {#if scatterPoints === null}
    <div class="loading-msg"><Spinner size="sm" /> Loading scatter data…</div>
    {:else}
    <div class="scatter-wrap">
      <ScatterChart
        points={scatterPoints}
        xLabel="Income"
        yLabel="Wealth"
        colorLabel="Health"
        xFormatter={formatMoney}
        yFormatter={formatMoney}
        colorMin={dist?.health.min ?? 0}
        colorMax={dist?.health.max ?? 1}
        height="340px"
        title="Income vs Wealth (colour = Health)"
      />
    </div>
    <p class="scatter-note">
      Each dot is one citizen. Colour encodes health (green = healthy, red = unhealthy).
      Up to 600 citizens sampled. Refresh to resample.
    </p>
    {/if}
  </div>
  {/if}

  {/if}
</div>

<style>
.citizen-view { max-width: 960px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}
h1 { font-size: 20px; font-weight: 700; }
.title-row { display: flex; align-items: center; gap: 10px; }
.header-right { display: flex; align-items: center; gap: 10px; }

/* Region filter pill */
.region-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(99,102,241,.15);
  color: var(--accent);
  border: 1px solid rgba(99,102,241,.35);
  border-radius: 20px;
  padding: 3px 10px 3px 12px;
  font-size: 12px;
  font-weight: 600;
}
.pill-clear {
  background: transparent;
  color: var(--accent);
  border: none;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  opacity: .7;
}
.pill-clear:hover { opacity: 1; }
.tick-badge { font-size: 12px; color: var(--muted); }
.btn-refresh {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--muted);
  padding: 5px 12px;
  border-radius: var(--radius);
  font-size: 13px;
}
.btn-refresh:disabled { opacity: .5; cursor: wait; }

.loading-msg, .error-msg {
  display: flex; align-items: center; gap: 8px;
  justify-content: center;
  text-align: center;
  padding: 40px 0;
  color: var(--muted);
}
.error-msg { color: var(--danger); }

/* Distributions tab */
.panels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}
.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}
.panel-title { font-size: 13px; font-weight: 600; }
.panel-mean  { font-size: 12px; font-weight: 600; }

.stat-rows { border-top: 1px solid var(--border); padding-top: 8px; margin-top: 10px; }
.stat-row  { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; }
.stat-label { color: var(--muted); }
.stat-val   { font-weight: 500; }

/* Inequality bar */
.inequality-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.ineq-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
}
.ineq-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; }
.ineq-value { font-size: 18px; font-weight: 700; }

/* Scatter tab */
.scatter-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
  margin-bottom: 10px;
}
.scatter-note {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}
</style>
