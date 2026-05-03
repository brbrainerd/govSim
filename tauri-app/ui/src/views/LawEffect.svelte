<script lang="ts">
  import { sim, ui, navigate, formatMoney, pct, tickToDate } from "$lib/store.svelte";
  import { getLawEffect, runMonteCarlo, exportMonteCarloCsv,
           compareTwoLaws, runComparativeMonteCarlo, listLaws } from "$lib/ipc";
  import type { LawEffectDto, MonteCarloSummaryDto, LawInfo,
                ComparativeEstimateDto, ComparativeSummaryDto } from "$lib/ipc";
  import { ciBarStyle }                                      from "$lib/chart-utils";
  import Tabs      from "../components/ui/Tabs.svelte";
  import Spinner   from "../components/ui/Spinner.svelte";
  import LineChart from "../components/LineChart.svelte";

  let lawEffect:  LawEffectDto | null        = $state(null);
  let mcResult:   MonteCarloSummaryDto | null = $state(null);
  let windowSize: number                      = $state(30);
  let nRuns:      number                      = $state(20);
  let loading:    boolean                     = $state(false);
  let mcLoading:  boolean                     = $state(false);
  let error:      string                      = $state("");
  let mcError:    string                      = $state("");
  let activeTab:  string                      = $state("overview");

  // ─── Compare-two-laws tab state ───────────────────────────────────────────
  let availableLaws:    LawInfo[]                      = $state([]);
  let secondLawId:      number | null                  = $state(null);
  let cmpResult:        ComparativeEstimateDto | null  = $state(null);
  let cmpMcResult:      ComparativeSummaryDto | null   = $state(null);
  let cmpLoading:       boolean                        = $state(false);
  let cmpMcLoading:     boolean                        = $state(false);
  let cmpError:         string                         = $state("");
  let cmpMcError:       string                         = $state("");

  const TABS = [
    { id: "overview",  label: "Δ Overview" },
    { id: "quintile",  label: "By Income Group" },
    { id: "detail",    label: "Window Detail" },
    { id: "causal",    label: "Counterfactual DiD" },
    { id: "compare",   label: "Compare Two Laws" },
  ];

  async function fetchEffect() {
    if (ui.effectLawId === null) return;
    loading = true; error = "";
    mcResult = null; mcError = "";
    try {
      lawEffect = await getLawEffect(ui.effectEnactedTick, windowSize);
    } catch (e) {
      error = String(e);
    } finally {
      loading = false;
    }
  }

  async function fetchMonteCarlo() {
    if (ui.effectLawId === null) return;
    mcLoading = true; mcError = ""; mcResult = null;
    try {
      mcResult = await runMonteCarlo(ui.effectLawId, windowSize, nRuns);
    } catch (e) {
      mcError = String(e);
    } finally {
      mcLoading = false;
    }
  }

  async function loadAvailableLaws() {
    try {
      const all = await listLaws();
      // Exclude the law currently being inspected and any repealed laws —
      // only show enactable counterfactual candidates.
      availableLaws = all.filter(l => !l.repealed && l.id !== ui.effectLawId);
      if (secondLawId !== null && !availableLaws.some(l => l.id === secondLawId)) {
        secondLawId = null;
      }
    } catch (e) {
      cmpError = `failed to list laws: ${e}`;
    }
  }

  async function fetchCompare() {
    if (ui.effectLawId === null || secondLawId === null) return;
    cmpLoading = true; cmpError = ""; cmpResult = null;
    try {
      cmpResult = await compareTwoLaws(ui.effectLawId, secondLawId, windowSize);
    } catch (e) {
      cmpError = String(e);
    } finally {
      cmpLoading = false;
    }
  }

  async function fetchCompareMc() {
    if (ui.effectLawId === null || secondLawId === null) return;
    cmpMcLoading = true; cmpMcError = ""; cmpMcResult = null;
    try {
      cmpMcResult = await runComparativeMonteCarlo(ui.effectLawId, secondLawId, windowSize, nRuns);
    } catch (e) {
      cmpMcError = String(e);
    } finally {
      cmpMcLoading = false;
    }
  }

  // Refresh the law list when the inspected law changes.
  $effect(() => {
    void ui.effectLawId;
    loadAvailableLaws();
  });

  async function downloadMcCsv() {
    try {
      const csv = await exportMonteCarloCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const lawId = ui.effectLawId ?? 0;
      const tick  = ui.effectEnactedTick ?? 0;
      a.href     = url;
      a.download = `mc_law${lawId}_tick${tick}_${nRuns}runs.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      mcError = `CSV export failed: ${e}`;
    }
  }

  // Fetch on mount and whenever windowSize / law changes.
  $effect(() => {
    void windowSize;
    void ui.effectLawId;
    fetchEffect();
  });

  // Auto-trigger Monte Carlo when the palette command `sim.monte_carlo.run` fires.
  $effect(() => {
    if (!ui.triggerMC) return;
    ui.triggerMC = false;
    // Switch to the Counterfactual DiD tab so the result is visible.
    activeTab = "causal";
    fetchMonteCarlo();
  });

  function deltaColor(v: number, positiveGood: boolean): string {
    if (Math.abs(v) < 0.001) return "var(--muted)";
    const good = positiveGood ? v > 0 : v < 0;
    return good ? "var(--good)" : "var(--danger)";
  }

  function fmtDelta(v: number, fmt: (n: number) => string): string {
    return (v >= 0 ? "+" : "") + fmt(v);
  }

  function fmtDeltaOpt(v: number | null, fmt: (n: number) => string): string {
    if (v === null) return "—";
    return (v >= 0 ? "+" : "") + fmt(v);
  }

  /** Width pct for the CI bar relative to the p5–p95 range. */
  // ── Sparkline data derived from the global metric ring-buffer ─────────────
  // Slices sim.metricsRows for the pre+post window around the enacted tick.
  // No extra IPC call needed — the ring-buffer already has all historical rows.

  const windowRows = $derived.by(() => {
    if (!lawEffect) return [];
    const fromTick = lawEffect.pre.from_tick;
    const toTick   = lawEffect.post.to_tick;
    return sim.metricsRows.filter(r => r.tick >= fromTick && r.tick <= toTick);
  });

  const sparkLabels  = $derived(windowRows.map(r => tickToDate(r.tick)));

  const approvalSpark = $derived([
    { name: "Approval", data: windowRows.map(r => r.approval) },
  ]);

  const gdpSpark = $derived([
    { name: "GDP", data: windowRows.map(r => r.gdp) },
  ]);

  const unemploySpark = $derived([
    { name: "Unemployment", data: windowRows.map(r => r.unemployment) },
  ]);

  // ── Chart annotations ─────────────────────────────────────────────────────
  // Focal law's enactment tick (highlighted) + every other law enacted within
  // the window (greyed) so the player can see confounding policy changes.
  const enactMark = $derived.by(() => {
    if (!lawEffect) return [];
    const fromTick = lawEffect.pre.from_tick;
    const toTick   = lawEffect.post.to_tick;

    const focal = {
      x: tickToDate(ui.effectEnactedTick),
      label: `#${ui.effectLawId} enacted`,
      color: "var(--color-warning)",
    };
    const others = sim.laws
      .filter(l => l.id !== ui.effectLawId
                && l.enacted_tick >= fromTick
                && l.enacted_tick <= toTick)
      .map(l => ({
        x: tickToDate(l.enacted_tick),
        label: `#${l.id} ${l.label}`,
        color: "var(--color-text-muted)",
      }));
    return [focal, ...others];
  });

  /** Human-readable name for each CrisisKind value. */
  const CRISIS_NAMES: Record<number, string> = {
    1: "War", 2: "Pandemic", 3: "Recession", 4: "Natural Disaster",
  };
  const CRISIS_COLORS: Record<number, string> = {
    1: "var(--color-danger)",
    2: "var(--color-warning)",
    3: "var(--color-info, #38bdf8)",
    4: "var(--color-warning)",
  };

  // Crisis bands: collapse consecutive ticks with the same non-zero crisis_kind
  // into a single shaded x-band. We label bands at their start.
  const crisisBands = $derived.by(() => {
    if (windowRows.length === 0) return [];
    const bands: { from: string; to: string; label?: string; color?: string }[] = [];
    let runStart: number | null = null;
    let runKind: number | null = null;
    for (let i = 0; i < windowRows.length; i++) {
      const k = windowRows[i].crisis_kind;
      if (k > 0 && runKind === null) {
        runStart = i; runKind = k;
      } else if (runKind !== null && k !== runKind) {
        bands.push({
          from: tickToDate(windowRows[runStart!].tick),
          to:   tickToDate(windowRows[i - 1].tick),
          label: CRISIS_NAMES[runKind] ?? "Crisis",
          color: CRISIS_COLORS[runKind] ?? "var(--color-danger)",
        });
        runStart = k > 0 ? i : null;
        runKind  = k > 0 ? k : null;
      }
    }
    if (runKind !== null) {
      bands.push({
        from: tickToDate(windowRows[runStart!].tick),
        to:   tickToDate(windowRows[windowRows.length - 1].tick),
        label: CRISIS_NAMES[runKind] ?? "Crisis",
        color: CRISIS_COLORS[runKind] ?? "var(--color-danger)",
      });
    }
    return bands;
  });

  /** Law from the active-laws list, for the title tag. May be null if already repealed. */
  const currentLaw = $derived(
    ui.effectLawId !== null ? (sim.laws.find(l => l.id === ui.effectLawId) ?? null) : null
  );
</script>

<div class="effect-view">
  <div class="page-header">
    <h1>
      Law Effect
      {#if ui.effectLawId !== null}<span class="id-tag">#{ui.effectLawId}</span>{/if}
      {#if currentLaw}<span class="kind-tag">{currentLaw.label}</span>{/if}
      {#if currentLaw?.magnitude}<span class="kind-tag">{currentLaw.magnitude}</span>{/if}
    </h1>
    <button class="btn-back" onclick={() => navigate("laws")}>← Laws</button>
  </div>

  <!-- Window size selector -->
  <div class="controls">
    <p class="field-label">Window size (ticks each side)</p>
    <div class="control-row">
      {#each [15, 30, 60, 90] as w}
      <button class:active={windowSize === w} onclick={() => windowSize = w}>{w}</button>
      {/each}
      <span class="enacted-label">Enacted: tick {ui.effectEnactedTick} ({tickToDate(ui.effectEnactedTick)})</span>
    </div>
  </div>

  {#if loading}
  <div class="loading-msg"><Spinner size="sm" /> Computing…</div>
  {:else if error}
  <div class="error-msg">⚠ {error}</div>
  {:else if lawEffect}

  <Tabs tabs={TABS} bind:active={activeTab} />

  <!-- ─── Tab: Δ Overview ─────────────────────────────────────── -->
  {#if activeTab === "overview"}
  <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
    <div class="delta-grid">
      {#each [
        ["Approval",       fmtDelta(lawEffect.delta_approval,       pct),         deltaColor(lawEffect.delta_approval,       true)],
        ["Unemployment",   fmtDelta(lawEffect.delta_unemployment,   pct),         deltaColor(lawEffect.delta_unemployment,   false)],
        ["GDP",            fmtDelta(lawEffect.delta_gdp,            formatMoney), deltaColor(lawEffect.delta_gdp,            true)],
        ["Pollution",      fmtDelta(lawEffect.delta_pollution,      v => v.toFixed(3) + " PU"), deltaColor(lawEffect.delta_pollution, false)],
        ["Legitimacy D.",  fmtDelta(lawEffect.delta_legitimacy,     v => v.toFixed(4)), deltaColor(lawEffect.delta_legitimacy, false)],
        ["Treasury",       fmtDelta(lawEffect.delta_treasury,       formatMoney), deltaColor(lawEffect.delta_treasury,       true)],
        ["Income Gini",    fmtDelta(lawEffect.delta_gini,           v => v.toFixed(3)), deltaColor(lawEffect.delta_gini,      false)],
        ["Wealth Gini",    fmtDelta(lawEffect.delta_wealth_gini,    v => v.toFixed(3)), deltaColor(lawEffect.delta_wealth_gini, false)],
        ["State Capacity", fmtDelta(lawEffect.delta_state_capacity, pct),         deltaColor(lawEffect.delta_state_capacity, true)],
        ["Mean Health",    fmtDelta(lawEffect.delta_health,         pct),         deltaColor(lawEffect.delta_health,         true)],
        ["Mean Income",    fmtDelta(lawEffect.delta_income,         formatMoney), deltaColor(lawEffect.delta_income,         true)],
        ["Mean Wealth",    fmtDelta(lawEffect.delta_wealth,         formatMoney), deltaColor(lawEffect.delta_wealth,         true)],
        ["Rights Breadth", fmtDelta(lawEffect.delta_rights_breadth, pct),         deltaColor(lawEffect.delta_rights_breadth, true)],
      ] as [label, val, col]}
      <div class="delta-card">
        <span class="d-label">{label}</span>
        <span class="d-value" style="color:{col}">{val}</span>
        <span class="d-sub">post − pre (naive)</span>
      </div>
      {/each}
    </div>

    <p class="overview-note">
      Naive before/after difference — not causal. See <button class="inline-link" onclick={() => activeTab = "causal"}>Counterfactual DiD</button> for a controlled estimate.
    </p>
  </div>

  <!-- ─── Tab: By Income Group ───────────────────────────────── -->
  {:else if activeTab === "quintile"}
  <div role="tabpanel" id="panel-quintile" aria-labelledby="tab-quintile">
    <p class="overview-note" style="margin-bottom:0.75rem">
      Approval change per income group (Q1 = bottom 20%, Q5 = top 20%).
      Positive = that group approved of the law; negative = disapproved.
    </p>
    {#if lawEffect}
    <table class="quintile-table">
      <thead>
        <tr>
          <th>Group</th>
          <th>Pre mean</th>
          <th>Post mean</th>
          <th>Δ Approval</th>
        </tr>
      </thead>
      <tbody>
        {#each (["approval_q1","approval_q2","approval_q3","approval_q4","approval_q5"] as const) as key, idx}
        {@const labels = ["Q1 (bottom 20%)", "Q2", "Q3 (middle)", "Q4", "Q5 (top 20%)"]}
        {@const delta  = lawEffect.delta_approval_by_quintile[idx]}
        {@const pre    = lawEffect.pre[key]}
        {@const post   = lawEffect.post[key]}
        <tr>
          <td>{labels[idx]}</td>
          <td>{(pre  * 100).toFixed(1)}%</td>
          <td>{(post * 100).toFixed(1)}%</td>
          <td class:pos={delta > 0.005} class:neg={delta < -0.005}>
            {delta > 0 ? "+" : ""}{(delta * 100).toFixed(1)}%
          </td>
        </tr>
        {/each}
      </tbody>
    </table>
    <p class="overview-note" style="margin-top:0.75rem">
      Naive pre/post difference per quintile — see <button class="inline-link" onclick={() => activeTab = "causal"}>Counterfactual DiD</button> for a controlled estimate.
    </p>
    {:else}
    <p class="no-data">No law effect data available.</p>
    {/if}
  </div>

  <!-- ─── Tab: Window Detail ──────────────────────────────────── -->
  {:else if activeTab === "detail"}
  <div role="tabpanel" id="panel-detail" aria-labelledby="tab-detail">

    <!-- Confounder banner: warn when other laws or crises overlap the window. -->
    {#if enactMark.length > 1 || crisisBands.length > 0}
    <div class="confounder-banner">
      ⚠ <strong>Confounders in window:</strong>
      {#if enactMark.length > 1}
      {enactMark.length - 1} other law{enactMark.length - 1 > 1 ? "s" : ""} enacted
      {/if}
      {#if enactMark.length > 1 && crisisBands.length > 0} · {/if}
      {#if crisisBands.length > 0}
      {crisisBands.length} crisis period{crisisBands.length > 1 ? "s" : ""}
      ({crisisBands.map(b => b.label).join(", ")})
      {/if}
      <span class="confounder-hint">Naive Δ may overstate this law's contribution. Run Counterfactual DiD for an isolated estimate.</span>
    </div>
    {/if}

    <!-- Mini sparklines — sliced from the global metric ring-buffer -->
    {#if windowRows.length > 0}
    <div class="spark-grid">
      <div class="spark-panel">
        <span class="spark-label">Approval</span>
        <LineChart
          series={approvalSpark}
          xLabels={sparkLabels}
          yMin={0}
          yMax={1}
          yFormatter={pct}
          height="80px"
          markLines={enactMark}
          markBands={crisisBands}
        />
      </div>
      <div class="spark-panel">
        <span class="spark-label">GDP</span>
        <LineChart
          series={gdpSpark}
          xLabels={sparkLabels}
          height="80px"
          markLines={enactMark}
          markBands={crisisBands}
        />
      </div>
      <div class="spark-panel">
        <span class="spark-label">Unemployment</span>
        <LineChart
          series={unemploySpark}
          xLabels={sparkLabels}
          yMin={0}
          yMax={1}
          yFormatter={pct}
          height="80px"
          markLines={enactMark}
          markBands={crisisBands}
        />
      </div>
    </div>
    {:else}
    <p class="spark-empty">No metric history in range — run more simulation ticks.</p>
    {/if}

    <table class="effect-table">
      <thead>
        <tr><th>Metric</th><th>Pre avg</th><th>Post avg</th><th>Δ</th></tr>
      </thead>
      <tbody>
        {#each [
          ["Approval",       lawEffect.pre.mean_approval,     lawEffect.post.mean_approval,     lawEffect.delta_approval,     pct,         true],
          ["Unemployment",   lawEffect.pre.mean_unemployment, lawEffect.post.mean_unemployment, lawEffect.delta_unemployment, pct,         false],
          ["GDP",            lawEffect.pre.mean_gdp,          lawEffect.post.mean_gdp,          lawEffect.delta_gdp,          formatMoney, true],
          ["Pollution",      lawEffect.pre.mean_pollution,    lawEffect.post.mean_pollution,     lawEffect.delta_pollution,    (v:number)=>v.toFixed(3), false],
          ["Legitimacy Debt",lawEffect.pre.mean_legitimacy,   lawEffect.post.mean_legitimacy,    lawEffect.delta_legitimacy,   (v:number)=>v.toFixed(4), false],
          ["Treasury",       lawEffect.pre.mean_treasury,     lawEffect.post.mean_treasury,      lawEffect.delta_treasury,     formatMoney, true],
          ["Income Gini",    lawEffect.pre.mean_gini,            lawEffect.post.mean_gini,            lawEffect.delta_gini,            (v:number)=>v.toFixed(3), false],
          ["Wealth Gini",    lawEffect.pre.mean_wealth_gini,     lawEffect.post.mean_wealth_gini,     lawEffect.delta_wealth_gini,     (v:number)=>v.toFixed(3), false],
          ["State Capacity", lawEffect.pre.mean_state_capacity,  lawEffect.post.mean_state_capacity,  lawEffect.delta_state_capacity,  pct,         true],
          ["Mean Health",    lawEffect.pre.mean_health,          lawEffect.post.mean_health,          lawEffect.delta_health,          pct,         true],
          ["Mean Income",    lawEffect.pre.mean_income,          lawEffect.post.mean_income,          lawEffect.delta_income,          formatMoney, true],
          ["Mean Wealth",    lawEffect.pre.mean_wealth,          lawEffect.post.mean_wealth,          lawEffect.delta_wealth,          formatMoney, true],
          ["Rights Breadth", lawEffect.pre.mean_rights_breadth,  lawEffect.post.mean_rights_breadth,  lawEffect.delta_rights_breadth,  pct,         true],
        ] as [label, pre, post, delta, fmt, posGood]}
        <tr>
          <td>{label}</td>
          <td>{(fmt as Function)(pre)}</td>
          <td>{(fmt as Function)(post)}</td>
          <td style="color:{deltaColor(delta as number, posGood as boolean)};font-weight:600">
            {fmtDelta(delta as number, fmt as (n: number) => string)}
          </td>
        </tr>
        {/each}
      </tbody>
    </table>
    <div class="window-meta">
      Pre: ticks {lawEffect.pre.from_tick}–{lawEffect.pre.to_tick} ({lawEffect.pre.n_rows} rows) &nbsp;|&nbsp;
      Post: ticks {lawEffect.post.from_tick}–{lawEffect.post.to_tick} ({lawEffect.post.n_rows} rows)
    </div>
  </div>

  <!-- ─── Tab: Counterfactual DiD ─────────────────────────────── -->
  {:else if activeTab === "causal"}
  <div role="tabpanel" id="panel-causal" aria-labelledby="tab-causal">
    <div class="mc-header">
      <p class="mc-desc">
        Forks the sim at enactment, runs treatment/control pairs with varied seeds,
        and returns the DiD distribution.
      </p>
      <div class="mc-controls">
        <label for="nruns-sel" class="field-label">Runs</label>
        <select id="nruns-sel" bind:value={nRuns}>
          {#each [5, 10, 20, 50] as n}
          <option value={n}>{n}</option>
          {/each}
        </select>
        <button class="btn-mc" onclick={fetchMonteCarlo} disabled={mcLoading}>
          {#if mcLoading}<Spinner size="sm" />{:else}▶ Run MC{/if}
        </button>
        {#if mcResult}
        <button class="btn-mc-secondary" onclick={downloadMcCsv} title="Download raw MC estimates as CSV">
          ⬇ CSV
        </button>
        {/if}
      </div>
    </div>

    {#if mcLoading}
    <div class="loading-msg">Running {nRuns} simulations…</div>
    {:else if mcError}
    <div class="error-msg">⚠ {mcError}</div>
    {:else if mcResult}

    <div class="mc-grid">
      <!-- Approval DiD CI -->
      <div class="mc-card">
        <div class="mc-card-header">
          <span class="mc-metric">Approval DiD</span>
          <span class="mc-runs">{mcResult.n_runs} runs</span>
        </div>
        <div class="mc-value" style="color:{deltaColor(mcResult.mean_did_approval ?? 0, true)}">
          {fmtDeltaOpt(mcResult.mean_did_approval, pct)}
          {#if mcResult.std_did_approval !== null}
          <span class="mc-std">± {pct(mcResult.std_did_approval)}</span>
          {/if}
        </div>
        {#if mcResult.p5_did_approval !== null && mcResult.p95_did_approval !== null}
        <div class="ci-bar-wrap">
          <div class="ci-bar" style={ciBarStyle(mcResult.mean_did_approval, mcResult.p5_did_approval, mcResult.p95_did_approval)}>
            <div class="ci-range"></div>
            <div class="ci-mean-line"></div>
          </div>
          <div class="ci-labels">
            <span>P5: {fmtDeltaOpt(mcResult.p5_did_approval, pct)}</span>
            <span>P95: {fmtDeltaOpt(mcResult.p95_did_approval, pct)}</span>
          </div>
        </div>
        {/if}
      </div>

      <!-- GDP DiD -->
      <div class="mc-card">
        <div class="mc-card-header">
          <span class="mc-metric">GDP DiD</span>
          <span class="mc-runs">{mcResult.n_runs} runs</span>
        </div>
        <div class="mc-value" style="color:{deltaColor(mcResult.mean_did_gdp ?? 0, true)}">
          {fmtDeltaOpt(mcResult.mean_did_gdp, formatMoney)}
          {#if mcResult.std_did_gdp !== null}
          <span class="mc-std">± {formatMoney(mcResult.std_did_gdp)}</span>
          {/if}
        </div>
        {#if mcResult.p5_did_gdp !== null && mcResult.p95_did_gdp !== null}
        <div class="ci-bar-wrap">
          <div class="ci-bar" style={ciBarStyle(mcResult.mean_did_gdp, mcResult.p5_did_gdp, mcResult.p95_did_gdp)}>
            <div class="ci-range"></div>
            <div class="ci-mean-line"></div>
          </div>
          <div class="ci-labels">
            <span>P5: {fmtDeltaOpt(mcResult.p5_did_gdp, formatMoney)}</span>
            <span>P95: {fmtDeltaOpt(mcResult.p95_did_gdp, formatMoney)}</span>
          </div>
        </div>
        {/if}
      </div>

      <!-- Pollution DiD -->
      <div class="mc-card">
        <div class="mc-card-header">
          <span class="mc-metric">Pollution DiD</span>
          <span class="mc-runs">{mcResult.n_runs} runs</span>
        </div>
        <div class="mc-value" style="color:{deltaColor(mcResult.mean_did_pollution ?? 0, false)}">
          {fmtDeltaOpt(mcResult.mean_did_pollution, v => v.toFixed(4) + " PU")}
          {#if mcResult.std_did_pollution !== null}
          <span class="mc-std">± {mcResult.std_did_pollution.toFixed(4)} PU</span>
          {/if}
        </div>
        {#if mcResult.p5_did_pollution !== null && mcResult.p95_did_pollution !== null}
        <div class="ci-bar-wrap">
          <div class="ci-bar" style={ciBarStyle(mcResult.mean_did_pollution, mcResult.p5_did_pollution, mcResult.p95_did_pollution)}>
            <div class="ci-range"></div>
            <div class="ci-mean-line"></div>
          </div>
          <div class="ci-labels">
            <span>P5: {fmtDeltaOpt(mcResult.p5_did_pollution, v => v.toFixed(4) + " PU")}</span>
            <span>P95: {fmtDeltaOpt(mcResult.p95_did_pollution, v => v.toFixed(4) + " PU")}</span>
          </div>
        </div>
        {/if}
      </div>

      <!-- Unemployment DiD -->
      <div class="mc-card">
        <div class="mc-card-header">
          <span class="mc-metric">Unemployment DiD</span>
          <span class="mc-runs">{mcResult.n_runs} runs</span>
        </div>
        <div class="mc-value" style="color:{deltaColor(-(mcResult.mean_did_unemployment ?? 0), true)}">
          {fmtDeltaOpt(mcResult.mean_did_unemployment, v => (v * 100).toFixed(2) + " pp")}
          {#if mcResult.std_did_unemployment !== null}
          <span class="mc-std">± {(mcResult.std_did_unemployment * 100).toFixed(2)} pp</span>
          {/if}
        </div>
        {#if mcResult.p5_did_unemployment !== null && mcResult.p95_did_unemployment !== null}
        <div class="ci-bar-wrap">
          <div class="ci-bar" style={ciBarStyle(mcResult.mean_did_unemployment, mcResult.p5_did_unemployment, mcResult.p95_did_unemployment)}>
            <div class="ci-range"></div>
            <div class="ci-mean-line"></div>
          </div>
          <div class="ci-labels">
            <span>P5: {fmtDeltaOpt(mcResult.p5_did_unemployment, v => (v * 100).toFixed(2) + " pp")}</span>
            <span>P95: {fmtDeltaOpt(mcResult.p95_did_unemployment, v => (v * 100).toFixed(2) + " pp")}</span>
          </div>
        </div>
        {/if}
      </div>

      <!-- Legitimacy Debt DiD -->
      <div class="mc-card">
        <div class="mc-card-header">
          <span class="mc-metric">Legitimacy Debt DiD</span>
          <span class="mc-runs">{mcResult.n_runs} runs</span>
        </div>
        <div class="mc-value" style="color:{deltaColor(-(mcResult.mean_did_legitimacy ?? 0), true)}">
          {fmtDeltaOpt(mcResult.mean_did_legitimacy, v => v.toFixed(4))}
          {#if mcResult.std_did_legitimacy !== null}
          <span class="mc-std">± {mcResult.std_did_legitimacy.toFixed(4)}</span>
          {/if}
        </div>
        {#if mcResult.p5_did_legitimacy !== null && mcResult.p95_did_legitimacy !== null}
        <div class="ci-bar-wrap">
          <div class="ci-bar" style={ciBarStyle(mcResult.mean_did_legitimacy, mcResult.p5_did_legitimacy, mcResult.p95_did_legitimacy)}>
            <div class="ci-range"></div>
            <div class="ci-mean-line"></div>
          </div>
          <div class="ci-labels">
            <span>P5: {fmtDeltaOpt(mcResult.p5_did_legitimacy, v => v.toFixed(4))}</span>
            <span>P95: {fmtDeltaOpt(mcResult.p95_did_legitimacy, v => v.toFixed(4))}</span>
          </div>
        </div>
        {/if}
      </div>

      <!-- Treasury DiD -->
      <div class="mc-card">
        <div class="mc-card-header">
          <span class="mc-metric">Treasury DiD</span>
          <span class="mc-runs">{mcResult.n_runs} runs</span>
        </div>
        <div class="mc-value" style="color:{deltaColor(mcResult.mean_did_treasury ?? 0, true)}">
          {fmtDeltaOpt(mcResult.mean_did_treasury, formatMoney)}
          {#if mcResult.std_did_treasury !== null}
          <span class="mc-std">± {formatMoney(mcResult.std_did_treasury)}</span>
          {/if}
        </div>
        {#if mcResult.p5_did_treasury !== null && mcResult.p95_did_treasury !== null}
        <div class="ci-bar-wrap">
          <div class="ci-bar" style={ciBarStyle(mcResult.mean_did_treasury, mcResult.p5_did_treasury, mcResult.p95_did_treasury)}>
            <div class="ci-range"></div>
            <div class="ci-mean-line"></div>
          </div>
          <div class="ci-labels">
            <span>P5: {fmtDeltaOpt(mcResult.p5_did_treasury, formatMoney)}</span>
            <span>P95: {fmtDeltaOpt(mcResult.p95_did_treasury, formatMoney)}</span>
          </div>
        </div>
        {/if}
      </div>

      <!-- Mean Income DiD -->
      <div class="mc-card">
        <div class="mc-card-header">
          <span class="mc-metric">Mean Income DiD</span>
          <span class="mc-runs">{mcResult.n_runs} runs</span>
        </div>
        <div class="mc-value" style="color:{deltaColor(mcResult.mean_did_income ?? 0, true)}">
          {fmtDeltaOpt(mcResult.mean_did_income, formatMoney)}
          {#if mcResult.std_did_income !== null}
          <span class="mc-std">± {formatMoney(mcResult.std_did_income)}</span>
          {/if}
        </div>
        {#if mcResult.p5_did_income !== null && mcResult.p95_did_income !== null}
        <div class="ci-bar-wrap">
          <div class="ci-bar" style={ciBarStyle(mcResult.mean_did_income, mcResult.p5_did_income, mcResult.p95_did_income)}>
            <div class="ci-range"></div>
            <div class="ci-mean-line"></div>
          </div>
          <div class="ci-labels">
            <span>P5: {fmtDeltaOpt(mcResult.p5_did_income, formatMoney)}</span>
            <span>P95: {fmtDeltaOpt(mcResult.p95_did_income, formatMoney)}</span>
          </div>
        </div>
        {/if}
      </div>

      <!-- Mean Wealth DiD -->
      <div class="mc-card">
        <div class="mc-card-header">
          <span class="mc-metric">Mean Wealth DiD</span>
          <span class="mc-runs">{mcResult.n_runs} runs</span>
        </div>
        <div class="mc-value" style="color:{deltaColor(mcResult.mean_did_wealth ?? 0, true)}">
          {fmtDeltaOpt(mcResult.mean_did_wealth, formatMoney)}
          {#if mcResult.std_did_wealth !== null}
          <span class="mc-std">± {formatMoney(mcResult.std_did_wealth)}</span>
          {/if}
        </div>
        {#if mcResult.p5_did_wealth !== null && mcResult.p95_did_wealth !== null}
        <div class="ci-bar-wrap">
          <div class="ci-bar" style={ciBarStyle(mcResult.mean_did_wealth, mcResult.p5_did_wealth, mcResult.p95_did_wealth)}>
            <div class="ci-range"></div>
            <div class="ci-mean-line"></div>
          </div>
          <div class="ci-labels">
            <span>P5: {fmtDeltaOpt(mcResult.p5_did_wealth, formatMoney)}</span>
            <span>P95: {fmtDeltaOpt(mcResult.p95_did_wealth, formatMoney)}</span>
          </div>
        </div>
        {/if}
      </div>

      <!-- Mean Health DiD -->
      <div class="mc-card">
        <div class="mc-card-header">
          <span class="mc-metric">Mean Health DiD</span>
          <span class="mc-runs">{mcResult.n_runs} runs</span>
        </div>
        <div class="mc-value" style="color:{deltaColor(mcResult.mean_did_health ?? 0, true)}">
          {fmtDeltaOpt(mcResult.mean_did_health, pct)}
          {#if mcResult.std_did_health !== null}
          <span class="mc-std">± {pct(mcResult.std_did_health)}</span>
          {/if}
        </div>
        {#if mcResult.p5_did_health !== null && mcResult.p95_did_health !== null}
        <div class="ci-bar-wrap">
          <div class="ci-bar" style={ciBarStyle(mcResult.mean_did_health, mcResult.p5_did_health, mcResult.p95_did_health)}>
            <div class="ci-range"></div>
            <div class="ci-mean-line"></div>
          </div>
          <div class="ci-labels">
            <span>P5: {fmtDeltaOpt(mcResult.p5_did_health, pct)}</span>
            <span>P95: {fmtDeltaOpt(mcResult.p95_did_health, pct)}</span>
          </div>
        </div>
        {/if}
      </div>
    </div>

    <!-- Heterogeneous DiD by income quintile -->
    {#if mcResult.mean_did_approval_by_quintile.some(v => v !== null)}
    <div class="quintile-did">
      <h3 class="quintile-did-title">Approval DiD by Income Quintile</h3>
      <p class="quintile-did-sub">
        Causal effect on approval, broken out by household income group.
        A positive value means the law lifted approval among that quintile
        relative to the no-law counterfactual.
      </p>
      <table class="quintile-did-table">
        <thead>
          <tr>
            <th>Quintile</th>
            <th>Mean DiD</th>
            <th>P5</th>
            <th>P95</th>
          </tr>
        </thead>
        <tbody>
          {#each ["Q1 Poorest", "Q2 Lower-mid", "Q3 Middle", "Q4 Upper-mid", "Q5 Wealthiest"] as label, q}
            <tr>
              <td>{label}</td>
              <td style="color:{deltaColor(mcResult.mean_did_approval_by_quintile[q] ?? 0, true)}">
                {mcResult.mean_did_approval_by_quintile[q] !== null
                  ? fmtDelta(mcResult.mean_did_approval_by_quintile[q]!, pct)
                  : "—"}
              </td>
              <td class="muted">
                {mcResult.p5_did_approval_by_quintile[q] !== null
                  ? fmtDelta(mcResult.p5_did_approval_by_quintile[q]!, pct)
                  : "—"}
              </td>
              <td class="muted">
                {mcResult.p95_did_approval_by_quintile[q] !== null
                  ? fmtDelta(mcResult.p95_did_approval_by_quintile[q]!, pct)
                  : "—"}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {/if}

    <p class="mc-note">
      DiD = (treatment_post − treatment_pre) − (control_post − control_pre).
      Each run uses a different post-enactment RNG seed. The snapshot was taken
      automatically at enactment tick {ui.effectEnactedTick}.
      All CI bars show exact P5/P95 from the Monte Carlo distribution.
      Inverted metrics (negative = good): Pollution, Unemployment, Legitimacy Debt.
    </p>

    {:else}
    <div class="mc-placeholder">
      Click <strong>▶ Run MC</strong> to run counterfactual simulations.
      A snapshot was saved automatically when the law was enacted.
    </div>
    {/if}
  </div>

  <!-- ─── Tab: Compare two laws ───────────────────────────────────────── -->
  {:else if activeTab === "compare"}
  <div role="tabpanel" id="panel-compare" aria-labelledby="tab-compare">
    <div class="mc-header">
      <p class="mc-desc">
        Compare law #{ui.effectLawId} (this view) against another enacted law.
        Both arms fork from the saved snapshot and run against a shared no-law
        control, so the two DiD estimates are directly comparable.
      </p>
      <div class="mc-controls">
        <label for="cmp-law-sel" class="field-label">vs.</label>
        <select id="cmp-law-sel" bind:value={secondLawId}>
          <option value={null}>(select law)</option>
          {#each availableLaws as law}
            <option value={law.id}>#{law.id} {law.label}{law.magnitude ? ` (${law.magnitude})` : ""}</option>
          {/each}
        </select>
        <button class="btn-mc" onclick={fetchCompare}
                disabled={cmpLoading || secondLawId === null}>
          {#if cmpLoading}<Spinner size="sm" />{:else}▶ Compare{/if}
        </button>
        <button class="btn-mc-secondary" onclick={fetchCompareMc}
                disabled={cmpMcLoading || secondLawId === null}>
          {#if cmpMcLoading}<Spinner size="sm" />{:else}MC ({nRuns}){/if}
        </button>
      </div>
    </div>

    {#if availableLaws.length === 0}
      <div class="mc-placeholder">
        No other enacted laws available. Enact a second law in the Laws view
        to enable comparison.
      </div>
    {:else if cmpError}
      <div class="error-msg">⚠ {cmpError}</div>
    {:else if cmpResult}
      <h3 class="quintile-did-title">Single-run comparison</h3>
      <table class="quintile-did-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Law #{ui.effectLawId} DiD</th>
            <th>Law #{secondLawId} DiD</th>
            <th>Net (A − B)</th>
          </tr>
        </thead>
        <tbody>
          {#each [
            ["Approval",   cmpResult.law_a.did_approval,   cmpResult.law_b.did_approval,   cmpResult.net_approval,  pct,         true],
            ["GDP",        cmpResult.law_a.did_gdp,        cmpResult.law_b.did_gdp,        cmpResult.net_gdp,       formatMoney, true],
            ["Pollution",  cmpResult.law_a.did_pollution,  cmpResult.law_b.did_pollution,  cmpResult.net_pollution, (v: number) => v.toFixed(3) + " PU", false],
          ] as [label, a, b, net, fmt, positiveGood]}
            <tr>
              <td>{label}</td>
              <td style="color:{a !== null ? deltaColor(a as number, positiveGood as boolean) : 'var(--muted)'}">
                {a !== null ? fmtDelta(a as number, fmt as (n: number) => string) : "—"}
              </td>
              <td style="color:{b !== null ? deltaColor(b as number, positiveGood as boolean) : 'var(--muted)'}">
                {b !== null ? fmtDelta(b as number, fmt as (n: number) => string) : "—"}
              </td>
              <td style="color:{net !== null ? deltaColor(net as number, positiveGood as boolean) : 'var(--muted)'}; font-weight:600;">
                {net !== null ? fmtDelta(net as number, fmt as (n: number) => string) : "—"}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      <p class="overview-note" style="margin-top:0.75rem">
        Net &gt; 0 on Approval / GDP means law A produced a stronger lift.
        Net &lt; 0 on Pollution means A reduced pollution more than B.
        Single run uses one RNG seed — for confidence intervals, click <strong>MC</strong>.
      </p>
    {/if}

    {#if cmpMcError}
      <div class="error-msg" style="margin-top:1rem">⚠ {cmpMcError}</div>
    {:else if cmpMcResult}
      <h3 class="quintile-did-title" style="margin-top:1.5rem">
        Monte Carlo comparison ({cmpMcResult.n_runs} runs)
      </h3>
      <table class="quintile-did-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Mean Net (A − B)</th>
            <th>P5</th>
            <th>P95</th>
          </tr>
        </thead>
        <tbody>
          {#each [
            ["Approval",   cmpMcResult.mean_net_approval,  cmpMcResult.p5_net_approval,  cmpMcResult.p95_net_approval,  pct,         true],
            ["GDP",        cmpMcResult.mean_net_gdp,       cmpMcResult.p5_net_gdp,       cmpMcResult.p95_net_gdp,       formatMoney, true],
            ["Pollution",  cmpMcResult.mean_net_pollution, cmpMcResult.p5_net_pollution, cmpMcResult.p95_net_pollution, (v: number) => v.toFixed(3) + " PU", false],
          ] as [label, mean, p5, p95, fmt, positiveGood]}
            <tr>
              <td>{label}</td>
              <td style="color:{mean !== null ? deltaColor(mean as number, positiveGood as boolean) : 'var(--muted)'}; font-weight:600;">
                {mean !== null ? fmtDelta(mean as number, fmt as (n: number) => string) : "—"}
              </td>
              <td class="muted">{p5 !== null ? fmtDelta(p5 as number, fmt as (n: number) => string) : "—"}</td>
              <td class="muted">{p95 !== null ? fmtDelta(p95 as number, fmt as (n: number) => string) : "—"}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <p class="overview-note" style="margin-top:0.75rem">
        If P5 and P95 straddle zero, the contrast is within MC noise — the two
        laws are not reliably distinguishable on that metric.
      </p>
    {/if}
  </div>
  {/if}

  {/if}
</div>

<style>
.effect-view { max-width: 900px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
h1 { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
.id-tag {
  font-size: 13px;
  background: rgba(99,102,241,.2);
  color: var(--accent);
  border-radius: 4px;
  padding: 2px 8px;
}
.kind-tag {
  font-size: 12px;
  background: var(--surface);
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 8px;
  font-weight: 500;
  letter-spacing: .2px;
}
.btn-back { background: transparent; color: var(--muted); border: 1px solid var(--border); }

.controls { margin-bottom: 20px; }
.control-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
.control-row button {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--muted);
  padding: 5px 12px;
  border-radius: var(--radius);
}
.control-row button.active { border-color: var(--accent); color: var(--accent); background: rgba(99,102,241,.12); }
.enacted-label { font-size: 12px; color: var(--muted); margin-left: 8px; }
.field-label { font-size: 12px; color: var(--muted); margin: 0; }

.loading-msg, .error-msg { color: var(--muted); padding: 20px 0; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; }
.error-msg { color: var(--danger); }

/* Delta overview grid */
.delta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}
.delta-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.d-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; }
.d-value { font-size: 20px; font-weight: 700; line-height: 1.1; }
.d-sub   { font-size: 10px; color: var(--muted); }

.overview-note {
  font-size: 12px;
  color: var(--muted);
  margin-top: 8px;
}
.inline-link {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  padding: 0;
  font-size: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* Confounder banner */
.confounder-banner {
  background: rgba(245,158,11,.10);
  border: 1px solid rgba(245,158,11,.35);
  color: var(--color-text-primary);
  border-radius: var(--radius);
  padding: 10px 14px;
  margin-bottom: 14px;
  font-size: 12px;
  line-height: 1.55;
}
.confounder-banner strong { color: var(--warn, #f59e0b); }
.confounder-hint { display: block; margin-top: 4px; color: var(--muted); font-size: 11px; }

/* Window detail sparklines */
.spark-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
.spark-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px;
}
.spark-label {
  display: block;
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .4px;
  margin-bottom: 6px;
}
.spark-empty {
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  padding: 20px 0;
  margin-bottom: 16px;
}

/* Detail table */
.effect-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  overflow: hidden;
  margin-bottom: 8px;
}
.effect-table th {
  text-align: left;
  padding: 10px 14px;
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .4px;
  border-bottom: 1px solid var(--border);
}
.effect-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
}
.effect-table tr:last-child td { border-bottom: none; }
.window-meta { font-size: 11px; color: var(--muted); }

/* Quintile table */
.quintile-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.quintile-table th { padding: 6px 12px; text-align: left; font-weight: 600; font-size: 11px;
  color: var(--muted); border-bottom: 2px solid var(--border); }
.quintile-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); }
.quintile-table tr:last-child td { border-bottom: none; }
.quintile-table td.pos { color: var(--good); font-weight: 600; }
.quintile-table td.neg { color: var(--danger); font-weight: 600; }

/* Heterogeneous DiD by quintile */
.quintile-did { margin: 18px 0 12px; padding: 14px 16px;
  background: var(--bg-secondary, #1a1a23); border-radius: 6px;
  border: 1px solid var(--border, rgba(255,255,255,.08)); }
.quintile-did-title { font-size: 13px; font-weight: 600; margin: 0 0 4px; }
.quintile-did-sub { font-size: 11.5px; color: var(--muted); margin: 0 0 10px; }
.quintile-did-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.quintile-did-table th, .quintile-did-table td { padding: 5px 8px; text-align: right; }
.quintile-did-table th:first-child, .quintile-did-table td:first-child { text-align: left; }
.quintile-did-table th { color: var(--muted); font-weight: 500;
  border-bottom: 1px solid var(--border, rgba(255,255,255,.08)); }
.quintile-did-table tbody tr + tr td { border-top: 1px solid rgba(255,255,255,.04); }
.quintile-did-table td.muted { color: var(--muted); }

/* Monte Carlo tab */
.mc-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
.mc-desc { font-size: 12px; color: var(--muted); }
.mc-controls { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.mc-controls select {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--fg);
  border-radius: var(--radius);
  padding: 4px 8px;
  font-size: 13px;
}
.btn-mc {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-mc:disabled { opacity: .5; cursor: wait; }
.btn-mc-secondary {
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.btn-mc-secondary:hover { background: rgba(99,102,241,.12); }

.mc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
.mc-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
}
.mc-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.mc-metric { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; }
.mc-runs   { font-size: 11px; color: var(--muted); }
.mc-value  { font-size: 22px; font-weight: 700; line-height: 1.1; margin-bottom: 10px; }
.mc-std    { font-size: 13px; font-weight: 400; color: var(--muted); margin-left: 4px; }

/* CI bar */
.ci-bar-wrap { margin-top: 6px; }
.ci-bar {
  position: relative;
  height: 8px;
  background: var(--surface);
  border-radius: 4px;
  overflow: visible;
  margin-bottom: 4px;
}
.ci-range {
  position: absolute;
  top: 0; bottom: 0;
  left: var(--ci-left);
  right: var(--ci-right);
  background: rgba(99,102,241,.25);
  border-radius: 4px;
}
.ci-mean-line {
  position: absolute;
  top: -3px; bottom: -3px;
  left: var(--ci-mean);
  width: 2px;
  background: var(--accent);
  border-radius: 1px;
}
.ci-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--muted);
}

.mc-note { font-size: 11px; color: var(--muted); line-height: 1.5; }
.mc-placeholder { text-align: center; color: var(--muted); padding: 20px 0; font-size: 13px; }
</style>
