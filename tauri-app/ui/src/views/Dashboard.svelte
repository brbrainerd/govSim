<script lang="ts">
  import StatCard   from "../components/StatCard.svelte";
  import LineChart  from "../components/LineChart.svelte";
  import { sim, formatMoney, pct, tickToDate } from "$lib/store.svelte";
  import { CRISIS_LABELS, PARTY_LABELS } from "$lib/ipc";

  const cs = $derived(sim.currentState);
  const rows = $derived(sim.metricsRows);

  // X-axis labels: one per row
  const xLabels = $derived(rows.map(r => tickToDate(r.tick)));

  // Series data
  const approvalSeries = $derived([{
    name: "Approval",
    data: rows.map(r => r.approval),
    color: "#6366f1",
  }]);

  const gdpSeries = $derived([{
    name: "GDP",
    data: rows.map(r => r.gdp),
    color: "#22c55e",
  }]);

  const unemploymentSeries = $derived([{
    name: "Unemployment",
    data: rows.map(r => r.unemployment),
    color: "#f59e0b",
  }]);

  const pollutionSeries = $derived([{
    name: "Pollution",
    data: rows.map(r => r.pollution_stock),
    color: "#ef4444",
  }]);

  const giniSeries = $derived([
    { name: "Income Gini",  data: rows.map(r => r.gini),         color: "#f59e0b" },
    { name: "Wealth Gini",  data: rows.map(r => r.wealth_gini),  color: "#ef4444" },
  ]);

  const treasurySeries = $derived([{
    name: "Treasury",
    data: rows.map(r => r.treasury_balance),
    color: "#38bdf8",
  }]);

  // Trend: current minus 30 ticks ago
  function trendOf(key: keyof typeof rows[0]): number | undefined {
    if (rows.length < 2) return undefined;
    const now  = rows[rows.length - 1][key] as number;
    const prev = rows[Math.max(0, rows.length - 31)][key] as number;
    return now - prev;
  }

  const crisisLabel = $derived(cs ? CRISIS_LABELS[cs.crisis_kind] ?? "?" : "—");
  const partyLabel  = $derived(cs ? PARTY_LABELS[cs.incumbent_party]  ?? "?" : "—");
</script>

{#if !sim.loaded || !cs}
<div class="empty-state">
  <p>No scenario loaded. Click <strong>⚙ Scenarios</strong> in the sidebar to begin.</p>
</div>
{:else}
<div class="dashboard">
  <h1 class="page-title">Dashboard <span class="scenario-tag">{sim.scenarioName}</span></h1>

  <!-- ── Economy row ── -->
  <section class="section">
    <h2 class="section-title">Economy</h2>
    <div class="stat-grid">
      <StatCard label="GDP"          value={formatMoney(cs.gdp)}       trend={trendOf("gdp")} />
      <StatCard label="Unemployment" value={pct(cs.unemployment)}      trend={trendOf("unemployment")} color={cs.unemployment > 0.15 ? "danger" : cs.unemployment > 0.08 ? "warn" : "good"} />
      <StatCard label="Inflation"    value={pct(cs.inflation)}         trend={trendOf("inflation")} color={cs.inflation > 0.05 ? "warn" : "default"} />
      <StatCard label="Income Gini"  value={cs.gini.toFixed(3)}        sub="0=perfect, 1=total" />
      <StatCard label="Wealth Gini"  value={cs.wealth_gini.toFixed(3)} />
      <StatCard label="Treasury"     value={formatMoney(cs.treasury_balance)} trend={trendOf("treasury_balance")} color={cs.treasury_balance < 0 ? "danger" : "default"} />
    </div>
    <div class="chart-row">
      <LineChart title="GDP" xLabels={xLabels} series={gdpSeries} yFormatter={formatMoney} />
      <LineChart title="Unemployment" xLabels={xLabels} series={unemploymentSeries} yMin={0} yMax={1} yFormatter={pct} />
    </div>
  </section>

  <!-- ── Politics row ── -->
  <section class="section">
    <h2 class="section-title">Politics</h2>
    <div class="stat-grid">
      <StatCard label="Approval"         value={pct(cs.approval)}      trend={trendOf("approval")} color={cs.approval < 0.35 ? "danger" : cs.approval > 0.6 ? "good" : "warn"} />
      <StatCard label="Incumbent"        value={partyLabel}            sub={`${cs.consecutive_terms} terms`} />
      <StatCard label="Last Election"    value={`Tick ${cs.last_election_tick ?? "—"}`} sub={`Margin ${pct(cs.election_margin)}`} />
      <StatCard label="Legitimacy Debt"  value={cs.legitimacy_debt.toFixed(3)} color={cs.legitimacy_debt > 0.5 ? "danger" : cs.legitimacy_debt > 0.1 ? "warn" : "default"} />
      <StatCard label="Crisis"           value={crisisLabel} color={cs.crisis_kind > 0 ? "danger" : "default"} sub={cs.crisis_remaining_ticks > 0 ? `${cs.crisis_remaining_ticks} ticks left` : undefined} />
      <StatCard label="Rights"           value={`${cs.rights_granted_bits.toString(2).split("").filter(b => b === "1").length} / 9`} sub="civic rights" />
    </div>
    <div class="chart-row">
      <LineChart title="Approval" xLabels={xLabels} series={approvalSeries} yMin={0} yMax={1} yFormatter={pct} />
      <LineChart title="Inequality (Gini)" xLabels={xLabels} series={giniSeries} yMin={0} yMax={1} />
    </div>
  </section>

  <!-- ── Environment row ── -->
  <section class="section">
    <h2 class="section-title">Environment &amp; Fiscal</h2>
    <div class="stat-grid">
      <StatCard label="Pollution Stock" value={cs.pollution_stock.toFixed(3)} sub="PU" color={cs.pollution_stock > 3 ? "danger" : cs.pollution_stock > 1.5 ? "warn" : "good"} />
      <StatCard label="Price Level"     value={cs.price_level.toFixed(4)} sub="base = 1.0" />
      <StatCard label="Population"      value={cs.population.toLocaleString()} />
      <StatCard label="Gov Revenue"     value={formatMoney(cs.gov_revenue)}     sub="this year" />
      <StatCard label="Gov Expenditure" value={formatMoney(cs.gov_expenditure)} sub="this year" />
      <StatCard label="Active Laws"     value={String(sim.laws.length)} />
    </div>
    <div class="chart-row">
      <LineChart title="Pollution Stock (PU)" xLabels={xLabels} series={pollutionSeries} yMin={0} />
      <LineChart title="Treasury Balance" xLabels={xLabels} series={treasurySeries} yFormatter={formatMoney} />
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

.page-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.scenario-tag {
  font-size: 12px;
  background: rgba(99,102,241,.2);
  color: var(--accent);
  border-radius: 4px;
  padding: 2px 8px;
  font-weight: 500;
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

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>
