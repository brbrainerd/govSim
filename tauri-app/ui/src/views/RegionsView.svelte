<script lang="ts">
  import { sim, ui, navigate, pct, formatMoney, tickToDate } from "$lib/store.svelte";
  import { getRegionStats, type RegionStatsDto } from "$lib/ipc";
  import { normalizeInRange, makeHeatBarStyle } from "$lib/region-utils";
  import { toast } from "$lib/toasts.svelte";

  type SortKey = keyof RegionStatsDto;

  let data:      RegionStatsDto[] = $state([]);
  let loading:   boolean          = $state(false);
  let error:     string           = $state("");
  let sortKey:   SortKey          = $state("region_id");
  let sortAsc:   boolean          = $state(true);
  let lastMonth: number           = $state(-1);

  /** Human-readable date of the last successful fetch, or null if never fetched. */
  const lastFetchedDate = $derived(lastMonth < 0 ? null : tickToDate(lastMonth * 30));

  // Refresh at most once per simulated month (every 30 ticks) to avoid
  // flooding the IPC with full-world scans during high-speed autostep.
  $effect(() => {
    const tick = sim.tick;
    if (!sim.loaded) return;
    const month = Math.floor(tick / 30);
    if (month === lastMonth) return;
    lastMonth = month;
    fetch();
  });

  async function fetch() {
    loading = true; error = "";
    try {
      data = await getRegionStats();
    } catch (e) {
      error = String(e);
      toast.error(e, "Failed to load region stats");
    } finally {
      loading = false;
    }
  }

  function setSort(key: SortKey) {
    if (sortKey === key) { sortAsc = !sortAsc; }
    else { sortKey = key; sortAsc = key === "region_id"; }
  }

  function sortIndicator(key: SortKey): string {
    if (sortKey !== key) return "";
    return sortAsc ? " ▲" : " ▼";
  }

  const sorted = $derived((() => {
    const rows = [...data];
    rows.sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return sortAsc ? av - bv : bv - av;
    });
    return rows;
  })());

  // Column-level min/max for heat-bar normalization.
  const colRange = $derived((() => {
    if (data.length === 0) return {} as Record<SortKey, [number, number]>;
    const keys: SortKey[] = ["population", "mean_approval", "mean_income", "unemployment_rate", "mean_health"];
    const out: Partial<Record<SortKey, [number, number]>> = {};
    for (const k of keys) {
      const vals = data.map(r => r[k] as number);
      out[k] = [Math.min(...vals), Math.max(...vals)];
    }
    return out as Record<SortKey, [number, number]>;
  })());

  /** Normalise value to [0,1] within its column's range. */
  function norm(key: SortKey, v: number): number {
    const r = colRange[key];
    if (!r) return 0.5;
    const [lo, hi] = r;
    return normalizeInRange(v, lo, hi);
  }

  /**
   * Style for the absolutely-positioned heat-bar div inside each cell.
   * Width = normalized position in column; hue = quality (green=best, red=worst).
   * Separated from cell background so text is always readable.
   */
  function heatBarStyle(key: SortKey, v: number, higherIsBetter: boolean): string {
    return makeHeatBarStyle(norm(key, v), higherIsBetter);
  }

  const cs = $derived(sim.currentState);
</script>

<div class="regions-view">
  <div class="page-header">
    <h1>Regions</h1>
    <span class="tick-badge">tick {sim.tick} · {tickToDate(sim.tick)}</span>
  </div>

  {#if !cs}
  <div class="empty-msg">Load a scenario to view region data.</div>
  {:else}

  <div class="toolbar">
    <button class="btn-refresh" onclick={fetch} disabled={loading}>
      {loading ? "Loading…" : "⟳ Refresh"}
    </button>
    {#if lastFetchedDate}
    <span class="fetch-date">as of {lastFetchedDate}</span>
    {/if}
    <span class="hint">Refreshes once per simulated month. Click a column header to sort.</span>
  </div>

  {#if error}
  <div class="err-msg">⚠ {error}</div>
  {/if}

  {#if data.length === 0 && !loading}
  <div class="empty-msg">No region data available. Click Refresh.</div>
  {:else if data.length > 0}

  <!-- Summary stat cards -->
  <div class="summary-grid">
    <div class="card">
      <span class="card-label">Regions</span>
      <span class="card-value">{data.length}</span>
    </div>
    <div class="card">
      <span class="card-label">Total Population</span>
      <span class="card-value">{data.reduce((s, r) => s + r.population, 0).toLocaleString()}</span>
    </div>
    <div class="card">
      <span class="card-label">Approval Range</span>
      <span class="card-value">
        {pct(Math.min(...data.map(r => r.mean_approval)))} –
        {pct(Math.max(...data.map(r => r.mean_approval)))}
      </span>
    </div>
    <div class="card">
      <span class="card-label">Income Range</span>
      <span class="card-value">
        {formatMoney(Math.min(...data.map(r => r.mean_income)))} –
        {formatMoney(Math.max(...data.map(r => r.mean_income)))}
      </span>
    </div>
    <div class="card">
      <span class="card-label">Unemployment Range</span>
      <span class="card-value">
        {pct(Math.min(...data.map(r => r.unemployment_rate)))} –
        {pct(Math.max(...data.map(r => r.unemployment_rate)))}
      </span>
    </div>
    <div class="card">
      <span class="card-label">Health Range</span>
      <span class="card-value">
        {pct(Math.min(...data.map(r => r.mean_health)))} –
        {pct(Math.max(...data.map(r => r.mean_health)))}
      </span>
    </div>
  </div>

  <!-- Data table -->
  <section class="section">
    <table class="region-table">
      <thead>
        <tr>
          <th onclick={() => setSort("region_id")}      class="th-sort">Region{sortIndicator("region_id")}</th>
          <th onclick={() => setSort("population")}     class="th-sort">Population{sortIndicator("population")}</th>
          <th onclick={() => setSort("mean_approval")}  class="th-sort">Approval{sortIndicator("mean_approval")}</th>
          <th onclick={() => setSort("mean_income")}    class="th-sort">Income{sortIndicator("mean_income")}</th>
          <th onclick={() => setSort("unemployment_rate")} class="th-sort">Unemployment{sortIndicator("unemployment_rate")}</th>
          <th onclick={() => setSort("mean_health")}    class="th-sort">Health{sortIndicator("mean_health")}</th>
        </tr>
      </thead>
      <tbody>
        {#each sorted as r}
        <tr
          class="data-row"
          onclick={() => { ui.filterRegionId = r.region_id; navigate("citizens"); }}
          title="Click to view citizen distributions for Region {r.region_id}"
          role="button"
          tabindex="0"
          onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") { ui.filterRegionId = r.region_id; navigate("citizens"); } }}
        >
          <td class="region-id">R{r.region_id}</td>
          <td class="heat-cell">
            <div class="heat-bar" style={heatBarStyle("population", r.population, true)}></div>
            <span class="cell-text">{r.population.toLocaleString()}</span>
          </td>
          <td class="heat-cell">
            <div class="heat-bar" style={heatBarStyle("mean_approval", r.mean_approval, true)}></div>
            <span class="cell-text" style="color:{r.mean_approval > 0.6 ? 'var(--good)' : r.mean_approval > 0.4 ? 'var(--warn)' : 'var(--danger)'}">
              {pct(r.mean_approval)}
            </span>
          </td>
          <td class="heat-cell">
            <div class="heat-bar" style={heatBarStyle("mean_income", r.mean_income, true)}></div>
            <span class="cell-text">{formatMoney(r.mean_income)}</span>
          </td>
          <td class="heat-cell">
            <div class="heat-bar" style={heatBarStyle("unemployment_rate", r.unemployment_rate, false)}></div>
            <span class="cell-text" style="color:{r.unemployment_rate > 0.15 ? 'var(--danger)' : r.unemployment_rate > 0.08 ? 'var(--warn)' : 'var(--good)'}">
              {pct(r.unemployment_rate)}
            </span>
          </td>
          <td class="heat-cell">
            <div class="heat-bar" style={heatBarStyle("mean_health", r.mean_health, true)}></div>
            <span class="cell-text" style="color:{r.mean_health < 0.5 ? 'var(--danger)' : r.mean_health > 0.7 ? 'var(--good)' : 'var(--warn)'}">
              {pct(r.mean_health)}
            </span>
          </td>
        </tr>
        {/each}
      </tbody>
    </table>
    <p class="table-note">
      Heat bars show relative position within each column (green = best, red = worst for that metric).
      Unemployment: lower is better. Click column headers to sort.
      Click a row to view citizen distributions filtered to that region.
    </p>
  </section>

  {/if}
  {/if}
</div>

<style>
.regions-view { max-width: 900px; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
h1 { font-size: 20px; font-weight: 700; }
.tick-badge { font-size: 12px; color: var(--muted); }
.empty-msg  { text-align: center; color: var(--muted); padding: 60px 0; }
.err-msg    { color: var(--danger); font-size: 13px; margin-bottom: 12px; }

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.btn-refresh {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 5px 14px;
  font-size: 12px;
  cursor: pointer;
}
.btn-refresh:hover { border-color: var(--accent); }
.btn-refresh:disabled { opacity: .5; cursor: default; }
.hint       { font-size: 11px; color: var(--muted); }
.fetch-date { font-size: 11px; color: var(--muted); font-variant-numeric: tabular-nums; }

/* Summary cards */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.card-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; }
.card-value  { font-size: 16px; font-weight: 700; line-height: 1.2; }

/* Region table */
.section { margin-bottom: 24px; }

.region-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 6px;
}

.region-table th {
  text-align: left;
  padding: 10px 14px;
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .4px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.th-sort {
  cursor: pointer;
  user-select: none;
}
.th-sort:hover { color: var(--fg); }

.region-table td {
  padding: 8px 14px;
  border-bottom: 1px solid var(--border);
  position: relative;
}
.region-table tr:last-child td { border-bottom: none; }

.data-row { cursor: pointer; }
.data-row:hover td { background: rgba(99,102,241,.06); }
.data-row:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

.region-id { font-weight: 600; font-size: 12px; color: var(--muted); }

/* Heat cell: absolutely-positioned bar behind the text */
.heat-cell {
  position: relative; /* ensures heat-bar is scoped to the cell */
  overflow: hidden;
}
.heat-bar {
  position: absolute;
  inset-block: 0;
  left: 0;
  border-radius: 2px;
  pointer-events: none;
  transition: width 300ms ease, background 300ms ease;
}
.cell-text {
  position: relative;
  z-index: 1;
}

.table-note { font-size: 11px; color: var(--muted); line-height: 1.5; }
</style>
