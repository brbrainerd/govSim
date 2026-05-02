<script lang="ts">
  import { sim, ui, navigate, beginLoad, endLoad, setError } from "$lib/store.svelte";
  import { repealLaw, listLaws, getLawDslSource }            from "$lib/ipc";
  import { toast }         from "$lib/toasts.svelte";
  import { tickToDate }    from "$lib/store.svelte";
  import EmptyState        from "../components/ui/EmptyState.svelte";
  import Button            from "../components/ui/Button.svelte";
  import Drawer            from "../components/ui/Drawer.svelte";
  import Tooltip           from "../components/ui/Tooltip.svelte";
  import Spinner           from "../components/ui/Spinner.svelte";
  import type { LawInfo }  from "$lib/ipc";

  // ── Filter / sort ───────────────────────────────────────────────────────────
  type EffectFilter = "all" | "income_tax" | "benefit" | "abatement" | "registration" | "audit" | "right_grant" | "right_revoke" | "state_capacity";
  type SortKey      = "id" | "enacted_tick" | "effect_kind";
  type SortDir      = "asc" | "desc";

  let query:    string       = $state("");
  let filter:   EffectFilter = $state("all");
  let sortKey:  SortKey      = $state("enacted_tick");
  let sortDir:  SortDir      = $state("desc");
  let showRepealed: boolean  = $state(false);

  // ── Law detail drawer ───────────────────────────────────────────────────────
  let drawerOpen:    boolean      = $state(false);
  let drawerLaw:     LawInfo | null = $state(null);
  let sourceText:    string | null  = $state(null);
  let sourceLoading: boolean        = $state(false);

  async function openDrawer(law: LawInfo) {
    drawerLaw    = law;
    drawerOpen   = true;
    sourceText   = null;
    sourceLoading = true;
    try {
      const src = await getLawDslSource(law.id);
      sourceText = src ?? "(DSL source not preserved for this law)";
    } catch (e) {
      sourceText = `Error loading source: ${e}`;
    } finally {
      sourceLoading = false;
    }
  }

  async function handleRepeal(id: number) {
    const law = sim.laws.find(l => l.id === id);
    const isUbi = law?.effect_kind === "benefit";

    const baseMsg = isUbi
      ? `⚠ Repealing Citizen Benefit law #${id} will add 0.5 legitimacy debt.\n\n` +
        `Citizens who relied on this payment may react negatively.\n\n` +
        `Repeal anyway? This cannot be undone.`
      : `Repeal law #${id}? This cannot be undone.`;

    if (!confirm(baseMsg)) return;
    beginLoad();
    try {
      await repealLaw(id);
      sim.laws = await listLaws();
      drawerOpen = false;
      toast.success(`Law #${id} repealed.`);
    } catch (e) {
      setError(String(e));
      toast.error(e, "Repeal failed");
    } finally {
      endLoad();
    }
  }

  function viewEffect(id: number, enactedTick: number) {
    ui.effectLawId       = id;
    ui.effectEnactedTick = enactedTick;
    navigate("effect");
  }

  // ── Sort / filter ───────────────────────────────────────────────────────────
  function setSort(k: SortKey) {
    if (sortKey === k) sortDir = sortDir === "asc" ? "desc" : "asc";
    else { sortKey = k; sortDir = "asc"; }
  }

  function applyFilters(laws: LawInfo[]): LawInfo[] {
    const q = query.trim().toLowerCase();
    let out = laws.filter(l => {
      if (filter !== "all" && l.effect_kind !== filter) return false;
      if (!q) return true;
      return (
        l.label.toLowerCase().includes(q) ||
        l.effect_kind.toLowerCase().includes(q) ||
        l.cadence.toLowerCase().includes(q) ||
        String(l.id).includes(q)
      );
    });
    out = out.slice().sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "id":           return (a.id - b.id) * dir;
        case "enacted_tick": return (a.enacted_tick - b.enacted_tick) * dir;
        case "effect_kind":  return a.label.localeCompare(b.label) * dir;
      }
    });
    return out;
  }

  const activeFiltered   = $derived(applyFilters(sim.laws.filter(l => !l.repealed)));
  const repealedFiltered = $derived(applyFilters(sim.laws.filter(l =>  l.repealed)));
  const totalActive      = $derived(sim.laws.filter(l => !l.repealed).length);

  const FILTER_OPTIONS: Array<{ value: EffectFilter; label: string }> = [
    { value: "all",           label: "All"            },
    { value: "income_tax",    label: "Income Tax"     },
    { value: "benefit",       label: "Citizen Benefit"},
    { value: "abatement",     label: "Abatement"      },
    { value: "registration",  label: "Registration"   },
    { value: "audit",         label: "Audit"          },
    { value: "right_grant",   label: "Right Grant"    },
    { value: "right_revoke",  label: "Right Revoke"   },
    { value: "state_capacity",label: "State Capacity" },
  ];

</script>

<div class="laws-view">
  <div class="page-header">
    <h1>Active Laws <span class="count">{totalActive}</span></h1>
    <Button onclick={() => navigate("propose")}>+ Propose Law</Button>
  </div>

  {#if sim.laws.length === 0}
  <EmptyState
    icon="📜"
    title="No laws currently enacted"
    description="Propose a flat tax, UBI, or pollution-abatement law to start steering the simulation."
  >
    <Button onclick={() => navigate("propose")}>+ Propose your first law</Button>
  </EmptyState>
  {:else}

  <!-- ── Filter bar ── -->
  <div class="toolbar">
    <input
      type="search"
      class="search"
      bind:value={query}
      placeholder="Search by id, type, cadence…"
      aria-label="Search laws"
    />
    <div class="filter-chips" role="group" aria-label="Filter by type">
      {#each FILTER_OPTIONS as opt}
        <button class="chip" class:active={filter === opt.value} onclick={() => filter = opt.value}>
          {opt.label}
        </button>
      {/each}
    </div>
  </div>

  {#if activeFiltered.length === 0}
  <EmptyState
    icon="🔍"
    title="No laws match your filters"
    description="Try clearing the search box or selecting a different type."
  >
    <Button variant="secondary" onclick={() => { query = ""; filter = "all"; }}>Clear filters</Button>
  </EmptyState>
  {:else}
  <table class="law-table" aria-label="Active laws">
    <thead>
      <tr>
        <th class="sortable" onclick={() => setSort("id")} aria-sort={sortKey === "id" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
          ID {sortKey === "id" ? (sortDir === "asc" ? "▲" : "▼") : ""}
        </th>
        <th class="sortable" onclick={() => setSort("effect_kind")} aria-sort={sortKey === "effect_kind" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
          Type {sortKey === "effect_kind" ? (sortDir === "asc" ? "▲" : "▼") : ""}
        </th>
        <th>Cadence</th>
        <th class="sortable" onclick={() => setSort("enacted_tick")} aria-sort={sortKey === "enacted_tick" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
          Enacted {sortKey === "enacted_tick" ? (sortDir === "asc" ? "▲" : "▼") : ""}
        </th>
        <th>Age</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each activeFiltered as law (law.id)}
      <tr class="law-row" onclick={() => openDrawer(law)} title="Click to view details">
        <td class="id-cell">#{law.id}</td>
        <td>
          <span class="badge badge-{law.effect_kind}">{law.label}</span>
          {#if law.magnitude}<span class="magnitude">{law.magnitude}</span>{/if}
        </td>
        <td class="muted">{law.cadence}</td>
        <td class="muted">tick {law.enacted_tick} · {tickToDate(law.enacted_tick)}</td>
        <td class="muted age-cell">{sim.tick - law.enacted_tick} ticks</td>
        <td class="actions" onclick={(e) => e.stopPropagation()}>
          <Tooltip text="View causal effect">
            <button class="btn-sm" onclick={() => viewEffect(law.id, law.enacted_tick)}>Effect</button>
          </Tooltip>
          <Tooltip text="Repeal this law">
            <button class="btn-sm btn-danger" onclick={() => handleRepeal(law.id)}>Repeal</button>
          </Tooltip>
        </td>
      </tr>
      {/each}
    </tbody>
  </table>
  {/if}

  {#if repealedFiltered.length > 0}
  <div class="repealed-toggle">
    <button onclick={() => showRepealed = !showRepealed} class="link-btn">
      {showRepealed ? "▼" : "▶"} Repealed laws ({repealedFiltered.length})
    </button>
  </div>
  {#if showRepealed}
  <table class="law-table muted-table" aria-label="Repealed laws">
    <thead><tr><th>ID</th><th>Type</th><th>Enacted</th></tr></thead>
    <tbody>
      {#each repealedFiltered as law (law.id)}
      <tr>
        <td class="id-cell">#{law.id}</td>
        <td>
          {law.label}
          {#if law.magnitude}<span class="magnitude">{law.magnitude}</span>{/if}
        </td>
        <td class="muted">tick {law.enacted_tick} · {tickToDate(law.enacted_tick)}</td>
      </tr>
      {/each}
    </tbody>
  </table>
  {/if}
  {/if}

  {/if}
</div>

<!-- ── Law detail drawer ──────────────────────────────────────────────────── -->
<Drawer
  open={drawerOpen}
  title={drawerLaw ? `Law #${drawerLaw.id} — ${drawerLaw.label}` : "Law Detail"}
  width="440px"
  onClose={() => drawerOpen = false}
>
  {#if drawerLaw}
  <div class="drawer-content">

    <!-- Meta row -->
    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Type</span>
        <span class="badge badge-{drawerLaw.effect_kind}">{drawerLaw.label}</span>
      </div>
      {#if drawerLaw.magnitude}
      <div class="meta-item">
        <span class="meta-label">Parameter</span>
        <span class="meta-val meta-magnitude">{drawerLaw.magnitude}</span>
      </div>
      {/if}
      <div class="meta-item">
        <span class="meta-label">Cadence</span>
        <span class="meta-val">{drawerLaw.cadence}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Enacted at</span>
        <span class="meta-val">tick {drawerLaw.enacted_tick} · {tickToDate(drawerLaw.enacted_tick)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Status</span>
        <span class="meta-val" style="color:{drawerLaw.repealed ? 'var(--danger)' : 'var(--good)'}">
          {drawerLaw.repealed ? "Repealed" : "Active"}
        </span>
      </div>
    </div>

    <!-- Quick actions -->
    {#if !drawerLaw.repealed}
    <div class="drawer-actions">
      <button class="btn-effect" onclick={() => { drawerOpen = false; viewEffect(drawerLaw!.id, drawerLaw!.enacted_tick); }}>
        📈 View Effect Analysis
      </button>
      <button class="btn-repeal-drawer" onclick={() => handleRepeal(drawerLaw!.id)}>
        🗑 Repeal Law
      </button>
    </div>
    {/if}

    <!-- DSL source -->
    <div class="source-section">
      <h3 class="source-title">DSL Source</h3>
      {#if sourceLoading}
      <div class="source-loading"><Spinner size="sm" /> Loading source…</div>
      {:else if sourceText}
      <pre class="dsl">{sourceText}</pre>
      {/if}
    </div>
  </div>
  {/if}
</Drawer>

<style>
.laws-view { max-width: 960px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}
h1 { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); display: flex; align-items: center; gap: var(--space-3); }
.count {
  font-size: var(--font-size-sm);
  background: var(--color-surface-2);
  color: var(--color-text-muted);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-medium);
}

/* Toolbar */
.toolbar {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
}
.search { flex: 1; min-width: 200px; }
.filter-chips { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.chip {
  background: var(--color-surface-2);
  color: var(--color-text-secondary);
  border: 1px solid transparent;
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-full);
}
.chip.active {
  background: var(--color-brand-subtle);
  color: var(--color-brand);
  border-color: var(--color-brand);
}

/* Table */
.law-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-base);
  background: var(--color-surface-1);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border-subtle);
}
.law-table th {
  text-align: left;
  padding: var(--space-3) var(--space-5);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-surface-2);
}
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: var(--color-text-primary); }

.law-table td {
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--color-border-subtle);
  vertical-align: middle;
}
.law-table tr:last-child td { border-bottom: none; }

.law-row {
  cursor: pointer;
  transition: background 80ms;
}
.law-row:hover { background: var(--color-surface-2); }

.id-cell  { color: var(--color-text-muted); font-family: var(--font-mono); }
.age-cell { font-size: var(--font-size-sm); white-space: nowrap; }
.muted   { color: var(--color-text-muted); }

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}
.badge-income_tax   { background: rgba(99,102,241,.20);  color: #818cf8; }
.badge-benefit      { background: rgba(34,197,94,.20);   color: #4ade80; }
.badge-abatement    { background: rgba(56,189,248,.20);  color: #38bdf8; }
.badge-registration  { background: rgba(245,158,11,.20);  color: #fbbf24; }
.badge-audit         { background: rgba(239,68,68,.20);   color: #f87171; }
.badge-right_grant   { background: rgba(16,185,129,.20);  color: #34d399; }
.badge-right_revoke  { background: rgba(244,63,94,.20);   color: #fb7185; }
.badge-state_capacity{ background: rgba(168,85,247,.20);  color: #c084fc; }

.magnitude {
  display: inline-block;
  margin-left: 6px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.actions { display: flex; gap: var(--space-2); }
.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  background: var(--color-surface-2);
  color: var(--color-text-primary);
  border-radius: var(--radius-sm);
}
.btn-sm:hover { background: var(--color-surface-3); }
.btn-danger { background: rgba(239,68,68,.20); color: var(--color-danger); }
.btn-danger:hover { background: rgba(239,68,68,.30); }

.repealed-toggle { margin-top: var(--space-6); margin-bottom: var(--space-3); }
.link-btn {
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  padding: 0;
}
.link-btn:hover { color: var(--color-text-primary); }
.muted-table { opacity: 0.65; }

/* ── Drawer content ── */
.drawer-content { display: flex; flex-direction: column; gap: 20px; }

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.meta-item {
  background: var(--color-surface-2);
  border-radius: var(--radius-md, 6px);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.meta-label     { font-size: 10px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .5px; }
.meta-val       { font-size: 13px; font-weight: 600; }
.meta-magnitude { font-family: var(--font-mono); color: var(--color-text-primary); }

.drawer-actions { display: flex; flex-direction: column; gap: 8px; }
.btn-effect {
  background: var(--color-brand-subtle);
  color: var(--color-brand);
  border: 1px solid var(--color-brand);
  border-radius: var(--radius-md, 6px);
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: background 120ms;
}
.btn-effect:hover { background: var(--color-brand); color: white; }
.btn-repeal-drawer {
  background: rgba(239,68,68,.12);
  color: var(--color-danger);
  border: 1px solid rgba(239,68,68,.3);
  border-radius: var(--radius-md, 6px);
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: background 120ms;
}
.btn-repeal-drawer:hover { background: rgba(239,68,68,.25); }

.source-section { display: flex; flex-direction: column; gap: 8px; }
.source-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: .5px;
  margin: 0;
}
.source-loading { display: flex; align-items: center; gap: 8px; color: var(--color-text-muted); font-size: 13px; }
.dsl {
  background: var(--color-bg);
  padding: 14px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-subtle);
  max-height: 320px;
  overflow-y: auto;
  line-height: 1.6;
}
</style>
