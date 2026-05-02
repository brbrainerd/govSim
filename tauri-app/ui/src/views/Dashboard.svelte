<script lang="ts">
  import StatCard   from "../components/StatCard.svelte";
  import LineChart  from "../components/LineChart.svelte";
  import { sim, formatMoney, pct, tickToDate, navigate } from "$lib/store.svelte";
  import { CRISIS_LABELS, PARTY_LABELS } from "$lib/ipc";

  // ── Time range ──────────────────────────────────────────────────────────────
  const TIME_RANGES = [
    { id: "30",  label: "1 mo"  },
    { id: "90",  label: "3 mo"  },
    { id: "180", label: "6 mo"  },
    { id: "360", label: "1 yr"  },
    { id: "all", label: "All"   },
  ];
  let timeRangeId: string = $state("360");

  const cs   = $derived(sim.currentState);
  const rows = $derived(
    timeRangeId === "all"
      ? sim.metricsRows
      : sim.metricsRows.slice(-parseInt(timeRangeId, 10))
  );

  // X-axis labels: one per row
  const xLabels = $derived(rows.map(r => tickToDate(r.tick)));

  // ── Chart annotations ───────────────────────────────────────────────────────
  const lawMarkLines = $derived(
    sim.laws
      .filter(l => !l.repealed)
      .map(l => {
        const row = rows.find(r => r.tick === l.enacted_tick);
        return row ? {
          x: tickToDate(l.enacted_tick),
          label: `Law #${l.id}`,
          color: "var(--color-warning)",
        } : null;
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
  );

  // Detect crisis periods from row-by-row crisis_kind transitions.
  const crisisBands = $derived((() => {
    const bands: Array<{ from: string; to: string; label: string; color: string }> = [];
    let bandStart: number | null = null;
    let bandKind  = 0;
    for (const r of rows) {
      if (r.crisis_kind > 0 && bandStart === null) {
        bandStart = r.tick; bandKind = r.crisis_kind;
      } else if (r.crisis_kind === 0 && bandStart !== null) {
        bands.push({
          from:  tickToDate(bandStart),
          to:    tickToDate(r.tick),
          label: CRISIS_LABELS[bandKind] ?? "Crisis",
          color: "var(--color-danger)",
        });
        bandStart = null;
      }
    }
    if (bandStart !== null && rows.length > 0) {
      bands.push({
        from:  tickToDate(bandStart),
        to:    tickToDate(rows[rows.length - 1].tick),
        label: CRISIS_LABELS[bandKind] ?? "Crisis",
        color: "var(--color-danger)",
      });
    }
    return bands;
  })());

  // ── Series — no hardcoded colours; LineChart reads --chart-N CSS vars ───────
  const gdpSeries          = $derived([{ name: "GDP",         data: rows.map(r => r.gdp) }]);
  const unemploymentSeries = $derived([{ name: "Unemployment", data: rows.map(r => r.unemployment) }]);
  const inflationSeries    = $derived([{ name: "Inflation",    data: rows.map(r => r.inflation) }]);
  const approvalSeries     = $derived([{ name: "Approval",    data: rows.map(r => r.approval) }]);
  const giniSeries         = $derived([
    { name: "Income Gini", data: rows.map(r => r.gini) },
    { name: "Wealth Gini", data: rows.map(r => r.wealth_gini) },
  ]);
  const pollutionSeries      = $derived([{ name: "Pollution",      data: rows.map(r => r.pollution_stock) }]);
  const treasurySeries       = $derived([{ name: "Treasury",       data: rows.map(r => r.treasury_balance) }]);
  const legitimacyDebtSeries = $derived([{ name: "Legitimacy Debt", data: rows.map(r => r.legitimacy_debt) }]);
  const electionMarginSeries = $derived([{ name: "Election Margin", data: rows.map(r => r.election_margin) }]);
  const priceLevelSeries     = $derived([{ name: "Price Level",     data: rows.map(r => r.price_level) }]);

  // Wellbeing series — citizen-level means from the ring-buffer
  const healthSeries       = $derived([{ name: "Mean Health", data: rows.map(r => r.mean_health) }]);
  const incomeSeries       = $derived([{ name: "Mean Income", data: rows.map(r => r.mean_income) }]);
  const productivitySeries = $derived([{ name: "Productivity", data: rows.map(r => r.mean_productivity) }]);

  // Fiscal balance: revenue vs expenditure as two overlapping series
  const fiscalSeries = $derived([
    { name: "Revenue",     data: rows.map(r => r.gov_revenue) },
    { name: "Expenditure", data: rows.map(r => r.gov_expenditure) },
  ]);

  // Correlation overlay: Approval and GDP both normalised to [0, 1] on the same axis.
  // Min-max normalisation is done over the currently visible window (follows time range).
  const correlationSeries = $derived.by(() => {
    const gdpVals  = rows.map(r => r.gdp);
    const minGdp   = Math.min(...gdpVals);
    const maxGdp   = Math.max(...gdpVals);
    const rangeGdp = maxGdp - minGdp || 1;
    return [
      { name: "Approval",    data: rows.map(r => r.approval) },
      { name: "GDP (norm.)", data: gdpVals.map(v => (v - minGdp) / rangeGdp) },
    ];
  });

  // Trend: current minus ~30 ticks ago (regardless of view range, always from full rows)
  function trendOf(key: keyof typeof sim.metricsRows[0]): number | undefined {
    const all = sim.metricsRows;
    if (all.length < 2) return undefined;
    const now  = all[all.length - 1][key] as number;
    const prev = all[Math.max(0, all.length - 31)][key] as number;
    return now - prev;
  }

  // Micro-sparkline data: last 30 ticks of a given metric key.
  function sparkOf(key: keyof typeof sim.metricsRows[0]): number[] {
    return sim.metricsRows.slice(-30).map(r => r[key] as number);
  }

  const crisisLabel = $derived(cs ? CRISIS_LABELS[cs.crisis_kind] ?? "?" : "—");
  const partyLabel  = $derived(cs ? PARTY_LABELS[cs.incumbent_party]  ?? "?" : "—");

  // Wellbeing values from the latest metric row (not in CurrentState snapshot).
  const lastRow = $derived(sim.metricsRows.length > 0 ? sim.metricsRows[sim.metricsRows.length - 1] : null);

  // Critical condition alerts — surfaced in the alert banner.
  interface Alert { level: "warn" | "danger"; msg: string; }
  const alerts = $derived((() => {
    if (!cs) return [];
    const a: Alert[] = [];
    if (cs.approval < 0.25)          a.push({ level: "danger", msg: `Approval critical: ${pct(cs.approval)}` });
    else if (cs.approval < 0.35)     a.push({ level: "warn",   msg: `Approval low: ${pct(cs.approval)}` });
    if (cs.treasury_balance < -1e7)  a.push({ level: "danger", msg: `Treasury deep in deficit: ${formatMoney(cs.treasury_balance)}` });
    else if (cs.treasury_balance < 0) a.push({ level: "warn",  msg: `Treasury negative: ${formatMoney(cs.treasury_balance)}` });
    if (cs.unemployment > 0.2)       a.push({ level: "danger", msg: `Unemployment high: ${pct(cs.unemployment)}` });
    if (cs.pollution_stock > 5)      a.push({ level: "danger", msg: `Pollution critical: ${cs.pollution_stock.toFixed(2)} PU` });
    if (cs.legitimacy_debt > 0.7)    a.push({ level: "danger", msg: `Legitimacy collapsing: debt ${cs.legitimacy_debt.toFixed(3)}` });
    if (cs.crisis_kind > 0)          a.push({ level: "warn",   msg: `Active crisis: ${CRISIS_LABELS[cs.crisis_kind]} (${cs.crisis_remaining_ticks} ticks)` });
    return a;
  })());
</script>

{#if !sim.loaded || !cs}
<div class="empty-state">
  <p>No scenario loaded. Click <strong>⚙ Scenarios</strong> in the sidebar to begin.</p>
</div>
{:else}
<div class="dashboard">
  <div class="page-header">
    <h1 class="page-title">Dashboard <span class="scenario-tag">{sim.scenarioName}</span></h1>
    <!-- Time-range selector -->
    <div class="time-range" role="group" aria-label="Chart time range">
      {#each TIME_RANGES as tr (tr.id)}
      <button
        class="tr-btn"
        class:active={timeRangeId === tr.id}
        onclick={() => timeRangeId = tr.id}
        aria-pressed={timeRangeId === tr.id}
      >{tr.label}</button>
      {/each}
    </div>
  </div>

  <!-- ── Alert banner ── -->
  {#if alerts.length > 0}
  <div class="alert-banner" role="alert" aria-live="assertive">
    {#each alerts as a (a.msg)}
    <div class="alert-item alert-item--{a.level}">
      <span class="alert-icon">{a.level === "danger" ? "🔴" : "⚠️"}</span>
      <span>{a.msg}</span>
    </div>
    {/each}
  </div>
  {/if}

  <!-- ── Economy row ── -->
  <section class="section">
    <h2 class="section-title">Economy</h2>
    <div class="stat-grid">
      <StatCard label="GDP"          value={formatMoney(cs.gdp)}       trend={trendOf("gdp")}              sparkData={sparkOf("gdp")} />
      <StatCard label="Unemployment" value={pct(cs.unemployment)}      trend={trendOf("unemployment")}     sparkData={sparkOf("unemployment")} color={cs.unemployment > 0.15 ? "danger" : cs.unemployment > 0.08 ? "warn" : "good"} />
      <StatCard label="Inflation"    value={pct(cs.inflation)}         trend={trendOf("inflation")}        sparkData={sparkOf("inflation")} color={cs.inflation > 0.05 ? "warn" : "default"} />
      <StatCard label="Income Gini"  value={cs.gini.toFixed(3)}        sub="0=perfect, 1=total"            sparkData={sparkOf("gini")} onclick={() => navigate("citizens")} clickLabel="View citizen income distribution" />
      <StatCard label="Wealth Gini"  value={cs.wealth_gini.toFixed(3)}                                     sparkData={sparkOf("wealth_gini")} onclick={() => navigate("citizens")} clickLabel="View citizen wealth distribution" />
      <StatCard label="Treasury"     value={formatMoney(cs.treasury_balance)} trend={trendOf("treasury_balance")} sparkData={sparkOf("treasury_balance")} color={cs.treasury_balance < 0 ? "danger" : "default"} />
    </div>
    <div class="chart-row">
      <LineChart title="GDP" xLabels={xLabels} series={gdpSeries} yFormatter={formatMoney}  markLines={lawMarkLines} markBands={crisisBands} />
      <LineChart title="Unemployment" xLabels={xLabels} series={unemploymentSeries} yMin={0} yMax={1} yFormatter={pct}  markLines={lawMarkLines} markBands={crisisBands} />
    </div>
  </section>

  <!-- ── Politics row ── -->
  <section class="section">
    <h2 class="section-title">Politics</h2>
    <div class="stat-grid">
      <StatCard label="Approval"         value={pct(cs.approval)}      trend={trendOf("approval")}     sparkData={sparkOf("approval")} color={cs.approval < 0.35 ? "danger" : cs.approval > 0.6 ? "good" : "warn"} onclick={() => navigate("elections")} clickLabel="View election details" />
      <StatCard label="Incumbent"        value={partyLabel}            sub={`${cs.consecutive_terms} terms`}                              onclick={() => navigate("elections")} clickLabel="View elections" />
      <StatCard label="Election Margin"  value={pct(cs.election_margin)} sub={`${cs.consecutive_terms} terms`} sparkData={sparkOf("election_margin")} onclick={() => navigate("elections")} />
      <StatCard label="Legitimacy Debt"  value={cs.legitimacy_debt.toFixed(3)} sparkData={sparkOf("legitimacy_debt")} color={cs.legitimacy_debt > 0.5 ? "danger" : cs.legitimacy_debt > 0.1 ? "warn" : "default"} onclick={() => navigate("elections")} />
      <StatCard label="Crisis"           value={crisisLabel} color={cs.crisis_kind > 0 ? "danger" : "default"} sub={cs.crisis_remaining_ticks > 0 ? `${cs.crisis_remaining_ticks} ticks left` : undefined} />
      <StatCard label="Rights"           value={`${cs.rights_granted_count}`} sub={cs.rights_breadth > 0 ? `of ${Math.round(cs.rights_granted_count / cs.rights_breadth)} rights` : "civic rights"} onclick={() => navigate("elections")} />
    </div>
    <div class="chart-row chart-row--3">
      <LineChart title="Approval" xLabels={xLabels} series={approvalSeries} yMin={0} yMax={1} yFormatter={pct} markLines={lawMarkLines} markBands={crisisBands} />
      <LineChart title="Inequality (Gini)" xLabels={xLabels} series={giniSeries} yMin={0} yMax={1} markLines={lawMarkLines} markBands={crisisBands} />
      <LineChart title="Approval vs GDP (norm.)" xLabels={xLabels} series={correlationSeries} yMin={0} yMax={1} markLines={lawMarkLines} markBands={crisisBands} />
    </div>
    <div class="chart-row">
      <LineChart title="Legitimacy Debt" xLabels={xLabels} series={legitimacyDebtSeries}
        yMin={0} yMax={1}
        yMarkLines={[
          {y: 0.5, label: "Collapse threshold", color: "var(--color-danger)"},
          {y: 0.1, label: "Warning",             color: "var(--color-warning)"},
        ]}
        markLines={lawMarkLines} markBands={crisisBands} />
      <LineChart title="Election Margin" xLabels={xLabels} series={electionMarginSeries}
        yMin={0} yMax={1} yFormatter={pct}
        yMarkLines={[{y: 0.05, label: "< 5% (razor-thin)", color: "var(--color-danger)"}]}
        markLines={lawMarkLines} markBands={crisisBands} />
    </div>
  </section>

  <!-- ── Governance row ── -->
  <section class="section">
    <h2 class="section-title">Governance</h2>
    <div class="governance-info">
      <div class="gov-chip"><span class="gov-label">Regime</span><span class="gov-value">{cs.regime_kind.replace(/([A-Z])/g, ' $1').trim()}</span></div>
      <div class="gov-chip"><span class="gov-label">Polity</span><span class="gov-value">{cs.polity_name}</span></div>
      <div class="gov-chip"><span class="gov-label">Electoral System</span><span class="gov-value">{cs.electoral_system}</span></div>
      <div class="gov-chip"><span class="gov-label">Franchise</span><span class="gov-value">{(cs.franchise_fraction * 100).toFixed(0)}%</span></div>
      {#if cs.executive_term_limit !== null}<div class="gov-chip"><span class="gov-label">Term Limit</span><span class="gov-value">{cs.executive_term_limit} terms</span></div>{/if}
      <div class="gov-chip"><span class="gov-label">Judicial Review</span><span class="gov-value" class:gov-yes={cs.judicial_review_power} class:gov-no={!cs.judicial_review_power}>{cs.judicial_review_power ? "Yes" : "No"}</span></div>
      <div class="gov-chip"><span class="gov-label">Judicial Independence</span><span class="gov-value">{(cs.judicial_independence * 100).toFixed(0)}%</span></div>
    </div>
    <div class="stat-grid">
      <StatCard label="State Capacity"       value={pct(cs.state_capacity_score)}         color={cs.state_capacity_score < 0.4 ? "danger" : cs.state_capacity_score > 0.75 ? "good" : "warn"} sparkData={sparkOf("state_capacity_score")} />
      <StatCard label="Tax Collection"       value={pct(cs.tax_collection_efficiency)}     color={cs.tax_collection_efficiency < 0.5 ? "danger" : "default"} />
      <StatCard label="Enforcement Reach"    value={pct(cs.enforcement_reach)}             color={cs.enforcement_reach < 0.5 ? "danger" : "default"} />
      <StatCard label="Legal Predictability" value={pct(cs.legal_predictability)}          color={cs.legal_predictability < 0.4 ? "danger" : "default"} />
      <StatCard label="Bureaucratic Eff."    value={pct(cs.bureaucratic_effectiveness)}    color={cs.bureaucratic_effectiveness < 0.4 ? "danger" : "default"} />
    </div>
  </section>

  <!-- ── Citizen Wellbeing row ── -->
  <section class="section">
    <h2 class="section-title">Citizen Wellbeing</h2>
    <div class="stat-grid">
      <StatCard label="Mean Health"       value={lastRow ? pct(lastRow.mean_health) : "—"}       trend={trendOf("mean_health")}       color={lastRow && lastRow.mean_health < 0.5 ? "danger" : lastRow && lastRow.mean_health > 0.7 ? "good" : "warn"} onclick={() => navigate("regions")} clickLabel="View regional health breakdown" />
      <StatCard label="Mean Income"       value={lastRow ? formatMoney(lastRow.mean_income) : "—"} trend={trendOf("mean_income")} onclick={() => navigate("regions")} clickLabel="View regional income breakdown" />
      <StatCard label="Mean Productivity" value={lastRow ? pct(lastRow.mean_productivity) : "—"} trend={trendOf("mean_productivity")} onclick={() => navigate("citizens")} />
      <StatCard label="Population"        value={cs.population.toLocaleString()} onclick={() => navigate("regions")} clickLabel="View regional breakdown" />
    </div>
    <div class="chart-row chart-row--3">
      <LineChart title="Mean Health"       xLabels={xLabels} series={healthSeries}       yMin={0} yMax={1} yFormatter={pct}         markLines={lawMarkLines} markBands={crisisBands} />
      <LineChart title="Mean Income"       xLabels={xLabels} series={incomeSeries}       yFormatter={formatMoney}                    markLines={lawMarkLines} markBands={crisisBands} />
      <LineChart title="Mean Productivity" xLabels={xLabels} series={productivitySeries} yMin={0} yMax={1} yFormatter={pct}         markLines={lawMarkLines} markBands={crisisBands} />
    </div>
  </section>

  <!-- ── Environment & Fiscal row ── -->
  <section class="section">
    <h2 class="section-title">Environment &amp; Fiscal</h2>
    <div class="stat-grid">
      <StatCard label="Pollution Stock" value={cs.pollution_stock.toFixed(3)} sub="PU" color={cs.pollution_stock > 3 ? "danger" : cs.pollution_stock > 1.5 ? "warn" : "good"} />
      <StatCard label="Price Level"     value={cs.price_level.toFixed(4)} sub="base = 1.0" />
      <StatCard label="Treasury"        value={formatMoney(cs.treasury_balance)} trend={trendOf("treasury_balance")} color={cs.treasury_balance < 0 ? "danger" : "default"} />
      <StatCard label="Gov Revenue"     value={formatMoney(cs.gov_revenue)}     sub="this year" />
      <StatCard label="Gov Expenditure" value={formatMoney(cs.gov_expenditure)} sub="this year" />
      <StatCard label="Active Laws"     value={String(sim.laws.filter(l => !l.repealed).length)} onclick={() => navigate("laws")} clickLabel="View active laws" />
    </div>
    <div class="chart-row chart-row--3">
      <LineChart title="Pollution Stock (PU)" xLabels={xLabels} series={pollutionSeries} yMin={0}  markLines={lawMarkLines} markBands={crisisBands} />
      <LineChart title="Revenue vs Expenditure" xLabels={xLabels} series={fiscalSeries} yFormatter={formatMoney} markLines={lawMarkLines} markBands={crisisBands} />
      <LineChart title="Treasury Balance" xLabels={xLabels} series={treasurySeries} yFormatter={formatMoney} markLines={lawMarkLines} markBands={crisisBands} yMarkLines={[{y: 0, label: "Zero", color: "var(--color-warning)"}]} />
    </div>
    <div class="chart-row">
      <LineChart title="Price Level" xLabels={xLabels} series={priceLevelSeries}
        yFormatter={(v) => v.toFixed(3)}
        yMarkLines={[{y: 1.0, label: "Base (1.000)", color: "var(--color-text-muted)"}]}
        markLines={lawMarkLines} markBands={crisisBands} />
      <LineChart title="Inflation" xLabels={xLabels} series={inflationSeries} yFormatter={pct}
        markLines={lawMarkLines} markBands={crisisBands}
        yMarkLines={[{y: 0.02, label: "2% target", color: "var(--color-success)"}]} />
    </div>
  </section>
</div>
{/if}

<style>
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: var(--muted);
  font-size: 15px;
  text-align: center;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
}
.scenario-tag {
  font-size: 12px;
  background: rgba(99,102,241,.2);
  color: var(--accent);
  border-radius: 4px;
  padding: 2px 8px;
  font-weight: 500;
}

/* Time-range selector */
.time-range {
  display: flex;
  gap: 2px;
  background: var(--color-surface-2);
  border-radius: var(--radius-md, 6px);
  padding: 3px;
  border: 1px solid var(--color-border-subtle);
}
.tr-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: background 120ms, color 120ms;
}
.tr-btn:hover { color: var(--color-text-primary); }
.tr-btn.active {
  background: var(--color-surface-1);
  color: var(--color-brand);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}

.section { margin-bottom: 32px; }
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .5px;
  margin-bottom: 12px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

/* Alert banner */
.alert-banner {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.alert-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-md, 6px);
  font-size: 12px;
  font-weight: 500;
}
.alert-item--warn   { background: rgba(245,158,11,.15); border: 1px solid rgba(245,158,11,.4); color: var(--warn, #f59e0b); }
.alert-item--danger { background: rgba(239,68,68,.15);  border: 1px solid rgba(239,68,68,.4);  color: var(--danger, #ef4444); }
.alert-icon { font-size: 14px; line-height: 1; }

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.chart-row--3 {
  grid-template-columns: 1fr 1fr 1fr;
}
@media (max-width: 900px) {
  .chart-row--3 { grid-template-columns: 1fr 1fr; }
}

/* ── Governance info chips ── */
.governance-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.gov-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-surface-2, rgba(255,255,255,.04));
  border: 1px solid var(--color-border, rgba(255,255,255,.08));
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
}
.gov-label {
  color: var(--color-text-muted, #888);
  font-weight: 500;
}
.gov-value {
  color: var(--color-text, #e5e5e5);
  font-weight: 700;
}
.gov-yes { color: #34d399; }
.gov-no  { color: #fb7185; }
</style>
