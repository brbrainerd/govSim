<script lang="ts">
  import { sim, ui, navigate, beginLoad, endLoad, setError } from "$lib/store.svelte";
  import { repealLaw, listLaws } from "$lib/ipc";

  async function handleRepeal(id: number) {
    if (!confirm(`Repeal law #${id}?`)) return;
    beginLoad();
    try {
      await repealLaw(id);
      sim.laws = await listLaws();
    } catch (e) {
      setError(String(e));
    } finally {
      endLoad();
    }
  }

  function viewEffect(id: number, enactedTick: number) {
    ui.effectLawId       = id;
    ui.effectEnactedTick = enactedTick;
    navigate("effect");
  }

  const activeLaws = $derived(sim.laws.filter(l => !l.repealed));
  const repealedLaws = $derived(sim.laws.filter(l => l.repealed));
</script>

<div class="laws-view">
  <div class="page-header">
    <h1>Active Laws</h1>
    <button class="btn-primary" onclick={() => navigate("propose")}>+ Propose Law</button>
  </div>

  {#if activeLaws.length === 0}
  <div class="empty">No laws currently enacted.</div>
  {:else}
  <table class="law-table">
    <thead>
      <tr>
        <th>ID</th><th>Type</th><th>Cadence</th><th>Enacted</th><th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each activeLaws as law (law.id)}
      <tr>
        <td class="id-cell">#{law.id}</td>
        <td><span class="badge badge-{law.effect_kind}">{law.effect_kind.replace("_", " ")}</span></td>
        <td class="muted">{law.cadence}</td>
        <td class="muted">Tick {law.enacted_tick}</td>
        <td class="actions">
          <button class="btn-sm" onclick={() => viewEffect(law.id, law.enacted_tick)}>Effect</button>
          <button class="btn-sm btn-danger" onclick={() => handleRepeal(law.id)}>Repeal</button>
        </td>
      </tr>
      {/each}
    </tbody>
  </table>
  {/if}

  {#if repealedLaws.length > 0}
  <details class="repealed-section">
    <summary>Repealed laws ({repealedLaws.length})</summary>
    <table class="law-table muted-table">
      <thead><tr><th>ID</th><th>Type</th><th>Enacted</th></tr></thead>
      <tbody>
        {#each repealedLaws as law (law.id)}
        <tr>
          <td class="id-cell">#{law.id}</td>
          <td>{law.effect_kind.replace("_", " ")}</td>
          <td>Tick {law.enacted_tick}</td>
        </tr>
        {/each}
      </tbody>
    </table>
  </details>
  {/if}
</div>

<style>
.laws-view { max-width: 900px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
h1 { font-size: 20px; font-weight: 700; }

.btn-primary { background: var(--accent); color: white; }

.empty { color: var(--muted); margin: 40px 0; text-align: center; }

.law-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: var(--surface);
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
}
.law-table th {
  text-align: left;
  padding: 10px 14px;
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .4px;
  border-bottom: 1px solid var(--border);
}
.law-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.law-table tr:last-child td { border-bottom: none; }
.id-cell { color: var(--muted); font-family: monospace; }
.muted   { color: var(--muted); }

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .4px;
}
.badge-income_tax  { background: rgba(99,102,241,.2);  color: #818cf8; }
.badge-benefit     { background: rgba(34,197,94,.2);   color: #4ade80; }
.badge-abatement   { background: rgba(56,189,248,.2);  color: #38bdf8; }
.badge-registration{ background: rgba(245,158,11,.2);  color: #fbbf24; }
.badge-audit       { background: rgba(239,68,68,.2);   color: #f87171; }

.actions { display: flex; gap: 6px; }
.btn-sm {
  padding: 4px 10px;
  font-size: 11px;
  background: var(--border);
  color: var(--text);
  border-radius: 4px;
}
.btn-danger { background: rgba(239,68,68,.2); color: var(--danger); }

.repealed-section {
  margin-top: 20px;
  color: var(--muted);
  font-size: 13px;
}
.repealed-section summary { cursor: pointer; margin-bottom: 10px; }
.muted-table { opacity: .5; }
</style>
