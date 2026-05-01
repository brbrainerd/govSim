<script lang="ts">
  import { sim, ui, navigate, formatMoney, pct, tickToDate } from "$lib/store.svelte";
  import { getLawEffect }       from "$lib/ipc";
  import type { LawEffectDto }  from "$lib/ipc";
  import LineChart              from "../components/LineChart.svelte";

  let effect:     LawEffectDto | null = $state(null);
  let windowSize: number              = $state(30);
  let loading:    boolean             = $state(false);
  let error:      string              = $state("");

  async function fetchEffect() {
    if (ui.effectLawId === null) return;
    loading = true; error = "";
    try {
      effect = await getLawEffect(ui.effectEnactedTick, windowSize);
    } catch (e) {
      error = String(e);
    } finally {
      loading = false;
    }
  }

  // Fetch on mount and whenever windowSize changes.
  $effect(() => {
    void windowSize;
    void ui.effectLawId;
    fetchEffect();
  });

  // Comparison chart data.
  const compRows = $derived(() => {
    if (!effect) return { labels: [], pre: [], post: [] };
    const labels = ["Approval", "Unemployment", "Legitimacy Debt"];
    return {
      labels,
      pre:  [effect.pre.mean_approval,  effect.pre.mean_unemployment,  effect.pre.mean_legitimacy],
      post: [effect.post.mean_approval, effect.post.mean_unemployment, effect.post.mean_legitimacy],
    };
  });

  function deltaColor(v: number, positiveGood: boolean): string {
    if (Math.abs(v) < 0.001) return "var(--muted)";
    const good = positiveGood ? v > 0 : v < 0;
    return good ? "var(--good)" : "var(--danger)";
  }

  function fmtDelta(v: number, fmt: (n: number) => string): string {
    return (v >= 0 ? "+" : "") + fmt(v);
  }

  const approvalSeries = $derived(effect ? [
    { name: "Pre",  data: [effect.pre.min_approval,  effect.pre.mean_approval,  effect.pre.max_approval],  color: "#6b7280" },
    { name: "Post", data: [effect.post.min_approval, effect.post.mean_approval, effect.post.max_approval], color: "#6366f1" },
  ] : []);

  const gdpSeries = $derived(effect ? [
    { name: "Pre",  data: [effect.pre.min_gdp,  effect.pre.mean_gdp,  effect.pre.max_gdp],  color: "#6b7280" },
    { name: "Post", data: [effect.post.min_gdp, effect.post.mean_gdp, effect.post.max_gdp], color: "#22c55e" },
  ] : []);
</script>

<div class="effect-view">
  <div class="page-header">
    <h1>
      Law Effect
      {#if ui.effectLawId !== null}<span class="id-tag">#{ ui.effectLawId }</span>{/if}
    </h1>
    <button class="btn-back" onclick={() => navigate("laws")}>← Laws</button>
  </div>

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
  <div class="loading-msg">Computing…</div>
  {:else if error}
  <div class="error-msg">⚠ {error}</div>
  {:else if effect}

  <!-- ── Delta summary cards ── -->
  <div class="delta-grid">
    {#each [
      ["Approval",     fmtDelta(effect.delta_approval,     pct),         deltaColor(effect.delta_approval,     true)],
      ["Unemployment", fmtDelta(effect.delta_unemployment, pct),         deltaColor(effect.delta_unemployment, false)],
      ["GDP",          fmtDelta(effect.delta_gdp,          formatMoney), deltaColor(effect.delta_gdp,          true)],
      ["Pollution",    fmtDelta(effect.delta_pollution,    v => v.toFixed(3) + " PU"), deltaColor(effect.delta_pollution, false)],
      ["Legitimacy D.",fmtDelta(effect.delta_legitimacy,  v => v.toFixed(4)), deltaColor(effect.delta_legitimacy, false)],
      ["Treasury",     fmtDelta(effect.delta_treasury,    formatMoney),  deltaColor(effect.delta_treasury,     true)],
    ] as [label, val, col]}
    <div class="delta-card">
      <span class="d-label">{label}</span>
      <span class="d-value" style="color:{col}">{val}</span>
      <span class="d-sub">post − pre</span>
    </div>
    {/each}
  </div>

  <!-- ── Before / After table ── -->
  <div class="table-section">
    <table class="effect-table">
      <thead>
        <tr><th>Metric</th><th>Pre-window avg</th><th>Post-window avg</th><th>Δ</th></tr>
      </thead>
      <tbody>
        {#each [
          ["Approval",       effect.pre.mean_approval,     effect.post.mean_approval,     effect.delta_approval,     pct,         true],
          ["Unemployment",   effect.pre.mean_unemployment, effect.post.mean_unemployment, effect.delta_unemployment, pct,         false],
          ["GDP",            effect.pre.mean_gdp,          effect.post.mean_gdp,          effect.delta_gdp,          formatMoney, true],
          ["Pollution",      effect.pre.mean_pollution,    effect.post.mean_pollution,     effect.delta_pollution,    (v:number)=>v.toFixed(3), false],
          ["Legitimacy Debt",effect.pre.mean_legitimacy,   effect.post.mean_legitimacy,    effect.delta_legitimacy,   (v:number)=>v.toFixed(4), false],
          ["Treasury",       effect.pre.mean_treasury,     effect.post.mean_treasury,      effect.delta_treasury,     formatMoney, true],
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
  </div>

  <div class="window-meta">
    Pre-window: ticks {effect.pre.from_tick}–{effect.pre.to_tick} ({effect.pre.n_rows} rows) &nbsp;|&nbsp;
    Post-window: ticks {effect.post.from_tick}–{effect.post.to_tick} ({effect.post.n_rows} rows)
  </div>

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
.btn-back { background: transparent; color: var(--muted); border: 1px solid var(--border); }

.controls { margin-bottom: 20px; }
.controls label { margin-bottom: 8px; }
.control-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.control-row button {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--muted);
  padding: 5px 12px;
  border-radius: var(--radius);
}
.control-row button.active { border-color: var(--accent); color: var(--accent); background: rgba(99,102,241,.12); }
.enacted-label { font-size: 12px; color: var(--muted); margin-left: 8px; }
.field-label { font-size: 12px; color: var(--muted); margin-bottom: 0; }

.loading-msg, .error-msg { color: var(--muted); padding: 40px 0; text-align: center; }
.error-msg { color: var(--danger); }

.delta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 24px;
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

.table-section { margin-bottom: 12px; }
.effect-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  overflow: hidden;
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
</style>
