<script lang="ts">
  import {
    sim, navigate, beginLoad, endLoad, setError,
  } from "$lib/store.svelte";
  import {
    enactFlatTax, enactUbi, enactAbatement, listLaws,
  } from "$lib/ipc";

  type LawKind = "income_tax" | "ubi" | "abatement";

  let kind:            LawKind = $state("income_tax");
  let taxRate:         number  = $state(0.25);
  let ubiAmount:       number  = $state(500);
  let pollRedux:       number  = $state(0.5);
  let costPerPu:       number  = $state(10_000);
  let statusMsg:       string  = $state("");

  async function submit() {
    beginLoad();
    statusMsg = "";
    try {
      let id: number;
      if (kind === "income_tax") {
        id = await enactFlatTax(taxRate);
      } else if (kind === "ubi") {
        id = await enactUbi(ubiAmount);
      } else {
        id = await enactAbatement(pollRedux, costPerPu);
      }
      sim.laws = await listLaws();
      statusMsg = `✓ Law #${id} enacted at tick ${sim.tick}.`;
    } catch (e) {
      setError(String(e));
    } finally {
      endLoad();
    }
  }

  // Rough fiscal estimates displayed in the preview panel.
  const estimatedAnnualCost = $derived(() => {
    if (kind === "income_tax") {
      // Tax raises revenue; show positive impact.
      return sim.currentState
        ? sim.currentState.population * sim.currentState.mean_income * taxRate * 12
        : null;
    } else if (kind === "ubi") {
      return sim.currentState ? sim.currentState.population * ubiAmount * 12 : null;
    } else {
      return pollRedux * costPerPu * 12;
    }
  });

  function fmt(n: number) {
    if (Math.abs(n) >= 1e9) return `$${(n/1e9).toFixed(1)}B`;
    if (Math.abs(n) >= 1e6) return `$${(n/1e6).toFixed(1)}M`;
    return `$${n.toLocaleString()}`;
  }
</script>

<div class="proposal-view">
  <div class="page-header">
    <h1>Propose a Law</h1>
    <button class="btn-back" onclick={() => navigate("laws")}>← Laws</button>
  </div>

  <div class="proposal-layout">
    <!-- ── Form ── -->
    <div class="form-panel">
      <div class="form-section">
        <p class="field-label">Law Type</p>
        <div class="kind-tabs">
          {#each [["income_tax","📊 Income Tax"],["ubi","💰 UBI"],["abatement","🌿 Abatement"]] as [k,l]}
          <button
            class="kind-tab"
            class:active={kind === k}
            onclick={() => { kind = k as LawKind; }}
          >{l}</button>
          {/each}
        </div>
      </div>

      {#if kind === "income_tax"}
      <div class="form-section">
        <label for="tax-rate">Flat Tax Rate</label>
        <div class="slider-row">
          <input id="tax-rate" type="range" min="0" max="1" step="0.01" bind:value={taxRate} />
          <span class="slider-value">{(taxRate * 100).toFixed(0)}%</span>
        </div>
        <p class="hint">Applied monthly to each employed citizen's income. Revenue flows to Treasury.</p>
      </div>

      {:else if kind === "ubi"}
      <div class="form-section">
        <label for="ubi-amount">Monthly UBI per citizen ($)</label>
        <input id="ubi-amount" type="number" min="0" step="50" bind:value={ubiAmount} />
        <p class="hint">Unconditional monthly payment to every citizen. Costs deducted from Treasury.</p>
      </div>

      {:else}
      <div class="form-section">
        <label for="poll-redux">Pollution reduction per month (PU)</label>
        <input id="poll-redux" type="number" min="0" step="0.1" bind:value={pollRedux} />
      </div>
      <div class="form-section">
        <label for="cost-per-pu">Cost per PU reduced ($)</label>
        <input id="cost-per-pu" type="number" min="0" step="1000" bind:value={costPerPu} />
        <p class="hint">Treasury is charged each month. If insufficient funds, abatement is proportionally reduced.</p>
      </div>
      {/if}

      {#if statusMsg}
      <p class="status-msg">{statusMsg}</p>
      {/if}

      <button class="btn-enact" onclick={submit} disabled={sim.loading || !sim.loaded}>
        {sim.loading ? "Enacting…" : "Enact Law"}
      </button>
    </div>

    <!-- ── Preview panel ── -->
    <div class="preview-panel">
      <h3>Fiscal Estimate</h3>
      <div class="estimate-row">
        <span class="est-label">{kind === "income_tax" ? "Est. annual revenue" : "Est. annual cost"}</span>
        <span class="est-value">
          {#if estimatedAnnualCost?.()}
            {fmt(estimatedAnnualCost()!)}
          {:else}
            —
          {/if}
        </span>
      </div>

      {#if sim.currentState}
      <div class="context-block">
        <h4>Current context</h4>
        <div class="ctx-row"><span>Treasury</span><span>{fmt(sim.currentState.treasury_balance)}</span></div>
        <div class="ctx-row"><span>Population</span><span>{sim.currentState.population.toLocaleString()}</span></div>
        <div class="ctx-row"><span>Approval</span><span>{(sim.currentState.approval * 100).toFixed(1)}%</span></div>
        {#if kind === "abatement"}
        <div class="ctx-row"><span>Pollution Stock</span><span>{sim.currentState.pollution_stock.toFixed(3)} PU</span></div>
        {/if}
      </div>
      {/if}

      <div class="notes-block">
        <h4>Expected effects</h4>
        {#if kind === "income_tax"}
        <ul>
          <li>↑ Government revenue each month</li>
          <li>↓ Disposable income → possible approval drag</li>
          <li>Progressive ↓ inequality if rate is high</li>
        </ul>
        {:else if kind === "ubi"}
        <ul>
          <li>↑ Citizen income → improved health & productivity</li>
          <li>↑ Approval, especially for lower-income quintiles</li>
          <li>↓ Treasury each month (high ongoing cost)</li>
          <li>⚠ Repeal incurs legitimacy debt</li>
        </ul>
        {:else}
        <ul>
          <li>↓ Pollution stock each month</li>
          <li>→ Improved citizen health over time</li>
          <li>↓ Treasury (monthly deduction)</li>
        </ul>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
.proposal-view { max-width: 860px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
h1 { font-size: 20px; font-weight: 700; }
.btn-back { background: transparent; color: var(--muted); border: 1px solid var(--border); }

.proposal-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.form-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section { display: flex; flex-direction: column; gap: 8px; }

.kind-tabs { display: flex; gap: 8px; }
.kind-tab {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--muted);
  padding: 8px 0;
  border-radius: var(--radius);
  font-size: 12px;
}
.kind-tab.active {
  background: rgba(99,102,241,.2);
  border-color: var(--accent);
  color: var(--accent);
}

.slider-row { display: flex; align-items: center; gap: 12px; }
.slider-row input { flex: 1; }
.slider-value { font-size: 18px; font-weight: 700; min-width: 3ch; text-align: right; }

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  border: none;
  padding: 0;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
}

input[type="number"] { width: 100%; }

.hint { font-size: 12px; color: var(--muted); }
.field-label { font-size: 12px; color: var(--muted); margin-bottom: 0; }

.status-msg { color: var(--good); font-size: 13px; }

.btn-enact {
  background: var(--accent);
  color: white;
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  width: 100%;
  margin-top: auto;
}
.btn-enact:disabled { opacity: .4; cursor: default; }

/* Preview panel */
.preview-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.preview-panel h3 {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .4px;
}

.estimate-row {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.est-label { font-size: 11px; color: var(--muted); }
.est-value { font-size: 22px; font-weight: 700; }

.context-block, .notes-block {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
}
.context-block h4, .notes-block h4 {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .4px;
  margin-bottom: 10px;
}
.ctx-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
  border-bottom: 1px solid var(--border);
}
.ctx-row:last-child { border-bottom: none; }

.notes-block ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}
</style>
