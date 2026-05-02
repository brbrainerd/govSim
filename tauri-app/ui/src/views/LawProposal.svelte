<script lang="ts">
  import { onMount } from "svelte";
  import { sim, navigate, formatMoney, pct } from "$lib/store.svelte";
  import {
    enactFlatTax, enactUbi, enactAbatement, listLaws,
    listRights, enactRightGrant, enactRightRevoke, enactStateCapacityModify,
    CAPACITY_FIELDS,
    type RightInfo, type CapacityField,
  } from "$lib/ipc";
  import { toast } from "$lib/toasts.svelte";

  type LawKind =
    | "income_tax" | "ubi" | "abatement"
    | "right_grant" | "right_revoke" | "capacity";

  let enacting:        boolean = $state(false);
  let kind:            LawKind = $state("income_tax");
  let taxRate:         number  = $state(0.25);
  let ubiAmount:       number  = $state(500);
  let pollRedux:       number  = $state(0.5);
  let costPerPu:       number  = $state(10_000);

  // Live RightsCatalog (fetched once on mount, refetched after each enactment).
  let rightsCatalog: RightInfo[] = $state([]);
  let rightsLoadError: string = $state("");
  let selectedRightId: string = $state("");
  let capacityField: CapacityField = $state("tax_collection_efficiency");
  let capacityDelta: number = $state(0.05);

  async function refreshRights() {
    try {
      rightsCatalog = await listRights();
      rightsLoadError = "";
      // Auto-select a sensible default for whichever tab needs it.
      if (kind === "right_grant" && !selectedRightId) {
        const first = rightsCatalog.find(r => !r.granted && r.prerequisites_met);
        if (first) selectedRightId = first.id;
      }
      if (kind === "right_revoke" && !selectedRightId) {
        const first = rightsCatalog.find(r => r.granted);
        if (first) selectedRightId = first.id;
      }
    } catch (e) {
      // RightsCatalog is absent in some scenarios; show a friendly message
      // and leave Right Grant / Revoke / Capacity tabs disabled at submit.
      rightsLoadError = String(e);
      rightsCatalog = [];
    }
  }
  onMount(() => { void refreshRights(); });

  // Re-derive default selection when the tab changes (kind switch).
  $effect(() => {
    void kind;
    if (rightsCatalog.length === 0) return;
    if (kind === "right_grant") {
      const cur = rightsCatalog.find(r => r.id === selectedRightId);
      if (!cur || cur.granted || !cur.prerequisites_met) {
        const first = rightsCatalog.find(r => !r.granted && r.prerequisites_met);
        selectedRightId = first?.id ?? "";
      }
    } else if (kind === "right_revoke") {
      const cur = rightsCatalog.find(r => r.id === selectedRightId);
      if (!cur || !cur.granted) {
        const first = rightsCatalog.find(r => r.granted);
        selectedRightId = first?.id ?? "";
      }
    }
  });

  /** Rights eligible to be granted: defined, not granted, prereqs met. */
  const grantableRights = $derived(
    rightsCatalog.filter(r => !r.granted && r.prerequisites_met),
  );
  /** Rights eligible to be revoked: currently granted. */
  const revocableRights = $derived(
    rightsCatalog.filter(r => r.granted),
  );
  /** Lookup the metadata for the currently-selected right (for warnings/preview). */
  const selectedRight = $derived(
    rightsCatalog.find(r => r.id === selectedRightId) ?? null,
  );

  async function submit() {
    // Fiscal danger gate: require explicit confirmation before a high-risk enactment.
    // This prevents accidental death-spirals while preserving player agency.
    if (affordability === "danger") {
      const runwayMsg = monthsTreasury !== null
        ? ` Treasury runway: ${monthsTreasury} months.`
        : "";
      const ok = confirm(
        `⚠ High fiscal risk detected.${runwayMsg}\n\n` +
        `Estimated cost exceeds 150% of annual government revenue.\n\n` +
        `Enact this law anyway?`
      );
      if (!ok) return;
    } else if (monthsTreasury !== null && monthsTreasury < 6) {
      const ok = confirm(
        `⚠ Low treasury runway: ${monthsTreasury} months.\n\n` +
        `This law will drain the treasury within ${monthsTreasury} months at current balance.\n\n` +
        `Enact anyway?`
      );
      if (!ok) return;
    }

    // Right Revoke confirmation: revoking is destructive and accrues legitimacy
    // debt scaled by the right's revocation_debt magnitude. Force confirmation.
    if (kind === "right_revoke" && selectedRight) {
      const rev = selectedRight.revocation_debt.toFixed(2);
      const ok = confirm(
        `⚠ Revoking ${selectedRight.label} will accrue ${rev} legitimacy debt.\n\n` +
        `Citizens who relied on this right may react negatively.\n\n` +
        `Enact this revocation?`
      );
      if (!ok) return;
    }

    enacting = true;
    try {
      let id: number;
      if (kind === "income_tax") {
        id = await enactFlatTax(taxRate);
      } else if (kind === "ubi") {
        id = await enactUbi(ubiAmount);
      } else if (kind === "abatement") {
        id = await enactAbatement(pollRedux, costPerPu);
      } else if (kind === "right_grant") {
        if (!selectedRightId) throw new Error("no right selected");
        id = await enactRightGrant(selectedRightId);
      } else if (kind === "right_revoke") {
        if (!selectedRightId) throw new Error("no right selected");
        id = await enactRightRevoke(selectedRightId);
      } else {
        id = await enactStateCapacityModify(capacityField, capacityDelta);
      }
      sim.laws = await listLaws();
      // RightsCatalog state changed → refetch so the selector reflects it.
      if (kind === "right_grant" || kind === "right_revoke") {
        await refreshRights();
      }
      toast.success(`Law #${id} enacted at tick ${sim.tick}.`);
      navigate("laws");
    } catch (e) {
      toast.error(e, "Failed to enact law");
    } finally {
      enacting = false;
    }
  }

  // Rough fiscal estimates displayed in the preview panel.
  // Right & capacity laws don't have direct fiscal cost — null means "not applicable".
  const estimatedAnnualCost = $derived.by(() => {
    if (kind === "income_tax") {
      // Flat tax revenue ≈ GDP * rate * 12 months (per-citizen proxy: GDP = Σ incomes).
      return sim.currentState
        ? sim.currentState.gdp * taxRate * 12
        : null;
    } else if (kind === "ubi") {
      return sim.currentState ? sim.currentState.population * ubiAmount * 12 : null;
    } else if (kind === "abatement") {
      return pollRedux * costPerPu * 12;
    }
    return null; // right_grant / right_revoke / capacity
  });

  // ── Affordability metrics ─────────────────────────────────────────────────

  /** Estimated monthly cost (+) or revenue (-) to Treasury. */
  const monthlyImpact = $derived.by((): number | null => {
    if (!sim.currentState) return null;
    if (kind === "income_tax") return -(sim.currentState.gdp * taxRate); // revenue (negative cost)
    if (kind === "ubi")        return sim.currentState.population * ubiAmount;
    if (kind === "abatement")  return pollRedux * costPerPu;
    return null; // right_grant / right_revoke / capacity
  });

  /** Estimated annual as % of GDP. */
  const pctOfGdp = $derived.by((): number | null => {
    if (estimatedAnnualCost === null || !sim.currentState || sim.currentState.gdp === 0) return null;
    return Math.abs(estimatedAnnualCost) / sim.currentState.gdp;
  });

  /** For net-cost laws: how many months can treasury sustain the monthly drain? */
  const monthsTreasury = $derived.by((): number | null => {
    if (monthlyImpact === null || monthlyImpact <= 0) return null; // income_tax is revenue
    if (!sim.currentState || sim.currentState.treasury_balance <= 0) return 0;
    return Math.floor(sim.currentState.treasury_balance / monthlyImpact);
  });

  type Afford = "good" | "warn" | "danger";
  const affordability = $derived.by((): Afford | null => {
    if (kind === "income_tax") {
      // Tax: warn if rate > 50% (high approval drag), danger if > 80%
      if (taxRate > 0.8)  return "danger";
      if (taxRate > 0.5)  return "warn";
      return "good";
    }
    if (kind === "right_revoke") {
      // Legitimacy-debt cost dominates fiscal cost for revocations.
      const d = selectedRight?.revocation_debt ?? 0;
      if (d >= 0.4) return "danger";
      if (d >= 0.2) return "warn";
      return "good";
    }
    if (kind === "right_grant" || kind === "capacity") {
      // No direct fiscal cost; treat as "good" by default.
      return "good";
    }
    // Cost laws: compare against annual revenue proxy
    if (estimatedAnnualCost === null || !sim.currentState) return null;
    const annualRevenue = sim.currentState.gov_revenue * 12;
    const ratio = estimatedAnnualCost / Math.max(annualRevenue, 1);
    if (ratio > 1.5)  return "danger";
    if (ratio > 0.5)  return "warn";
    return "good";
  });

  const affordLabel: Record<Afford, string> = {
    good:   "✓ Fiscally sustainable",
    warn:   "⚠ Expensive — monitor treasury",
    danger: "🔴 High fiscal risk",
  };

  // ── Badge preview ─────────────────────────────────────────────────────────

  /**
   * Mirrors effect_magnitude() in Rust so the user sees exactly what string
   * will appear in the Laws table before they enact the law.
   */
  const previewMagnitude = $derived.by((): string => {
    if (kind === "income_tax")   return pct(taxRate);
    if (kind === "ubi")          return `$${ubiAmount.toFixed(0)}/mo`;
    if (kind === "abatement")    return `${pollRedux.toFixed(2)} PU · $${costPerPu.toFixed(0)}/PU`;
    if (kind === "right_grant")  return `Grant ${selectedRightId || "—"}`;
    if (kind === "right_revoke") return `Revoke ${selectedRightId || "—"}`;
    return `${capacityField} ${capacityDelta >= 0 ? "+" : ""}${capacityDelta.toFixed(3)}`;
  });

  const previewLabel: Record<LawKind, string> = {
    income_tax:   "Income Tax",
    ubi:          "Citizen Benefit",
    abatement:    "Abatement",
    right_grant:  "Right Grant",
    right_revoke: "Right Revoke",
    capacity:     "State Capacity",
  };

  /** Maps proposal kind → effect_kind used by Rust/LawsView badge CSS classes. */
  const BADGE_KIND: Record<LawKind, string> = {
    income_tax:   "income_tax",
    ubi:          "benefit",    // Rust effect_kind for UBI is "benefit"
    abatement:    "abatement",
    right_grant:  "right_grant",
    right_revoke: "right_revoke",
    capacity:     "state_capacity",
  };

  /** Disable the Enact button when the current selection isn't actionable. */
  const submitDisabled = $derived.by((): boolean => {
    if (enacting || !sim.loaded) return true;
    if (kind === "right_grant"  && grantableRights.length === 0) return true;
    if (kind === "right_revoke" && revocableRights.length === 0) return true;
    if ((kind === "right_grant" || kind === "right_revoke") && !selectedRightId) return true;
    if (kind === "capacity" && (!Number.isFinite(capacityDelta) || Math.abs(capacityDelta) > 0.5)) return true;
    return false;
  });
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
          {#each [
            ["income_tax",   "📊 Income Tax"],
            ["ubi",          "💰 UBI"],
            ["abatement",    "🌿 Abatement"],
            ["right_grant",  "✓ Grant Right"],
            ["right_revoke", "✗ Revoke Right"],
            ["capacity",     "🏛 Capacity"],
          ] as [k,l]}
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

      {:else if kind === "abatement"}
      <div class="form-section">
        <label for="poll-redux">Pollution reduction per month (PU)</label>
        <input id="poll-redux" type="number" min="0" step="0.1" bind:value={pollRedux} />
      </div>
      <div class="form-section">
        <label for="cost-per-pu">Cost per PU reduced ($)</label>
        <input id="cost-per-pu" type="number" min="0" step="1000" bind:value={costPerPu} />
        <p class="hint">Treasury is charged each month. If insufficient funds, abatement is proportionally reduced.</p>
      </div>

      {:else if kind === "right_grant"}
      {#if rightsLoadError}
      <div class="form-section">
        <p class="hint">RightsCatalog unavailable in this scenario: {rightsLoadError}</p>
      </div>
      {:else if grantableRights.length === 0}
      <div class="form-section">
        <p class="hint">No rights are currently grantable. Either every defined right is already granted, or none have their prerequisites met.</p>
      </div>
      {:else}
      <div class="form-section">
        <label for="right-grant">Right to grant</label>
        <select id="right-grant" bind:value={selectedRightId}>
          {#each grantableRights as r (r.id)}
          <option value={r.id}>{r.label}</option>
          {/each}
        </select>
        {#if selectedRight}
        <p class="hint">
          Beneficiary: {pct(selectedRight.beneficiary_fraction)} of population ·
          Honeymoon boost: +{pct(selectedRight.grant_boost)} approval (decays over 12 months) ·
          Revocation cost: {selectedRight.revocation_debt.toFixed(2)} legitimacy debt
        </p>
        {#if selectedRight.prerequisites.length > 0}
        <p class="hint">Prerequisites: {selectedRight.prerequisites.join(", ")} ✓</p>
        {/if}
        {/if}
      </div>
      {/if}

      {:else if kind === "right_revoke"}
      {#if rightsLoadError}
      <div class="form-section">
        <p class="hint">RightsCatalog unavailable: {rightsLoadError}</p>
      </div>
      {:else if revocableRights.length === 0}
      <div class="form-section">
        <p class="hint">No rights are currently granted to revoke.</p>
      </div>
      {:else}
      <div class="form-section">
        <label for="right-revoke">Right to revoke</label>
        <select id="right-revoke" bind:value={selectedRightId}>
          {#each revocableRights as r (r.id)}
          <option value={r.id}>{r.label}</option>
          {/each}
        </select>
        {#if selectedRight}
        <p class="hint danger-hint">
          ⚠ Revoking this right accrues <strong>{selectedRight.revocation_debt.toFixed(2)}</strong> legitimacy debt
          and may harm approval among the {pct(selectedRight.beneficiary_fraction)} of citizens it covers.
        </p>
        {/if}
      </div>
      {/if}

      {:else if kind === "capacity"}
      <div class="form-section">
        <label for="cap-field">State Capacity field</label>
        <select id="cap-field" bind:value={capacityField}>
          {#each CAPACITY_FIELDS as f (f)}
          <option value={f}>{f.replace(/_/g, " ")}</option>
          {/each}
        </select>
      </div>
      <div class="form-section">
        <label for="cap-delta">Monthly delta (signed)</label>
        <div class="slider-row">
          <input id="cap-delta" type="range" min="-0.5" max="0.5" step="0.005" bind:value={capacityDelta} />
          <span class="slider-value">{capacityDelta >= 0 ? "+" : ""}{capacityDelta.toFixed(3)}</span>
        </div>
        <p class="hint">Applied each month while the law is active. Clamped to [0,1] in the engine. Repeal stops further application but does not undo prior changes.</p>
      </div>
      {/if}

      <button class="btn-enact" onclick={submit} disabled={submitDisabled}>
        {enacting ? "Enacting…" : "Enact Law"}
      </button>
    </div>

    <!-- ── Preview panel ── -->
    <div class="preview-panel">
      <h3>Fiscal Estimate</h3>
      <div class="estimate-row">
        <span class="est-label">{
          kind === "income_tax" ? "Est. annual revenue"
            : kind === "right_grant" || kind === "right_revoke" ? "Est. legitimacy impact"
            : kind === "capacity" ? "Est. fiscal impact"
            : "Est. annual cost"
        }</span>
        <span class="est-value">
          {#if estimatedAnnualCost !== null}
            {formatMoney(Math.abs(estimatedAnnualCost))}
          {:else if kind === "right_revoke" && selectedRight}
            +{selectedRight.revocation_debt.toFixed(2)} debt
          {:else if kind === "right_grant" && selectedRight}
            +{pct(selectedRight.grant_boost)} approval
          {:else}
            —
          {/if}
        </span>
        {#if pctOfGdp !== null}
        <span class="est-pct">{pct(pctOfGdp)} of GDP per year</span>
        {/if}
        {#if monthlyImpact !== null}
        <span class="est-monthly">
          {monthlyImpact >= 0 ? "Costs" : "Generates"} {formatMoney(Math.abs(monthlyImpact))}/month
        </span>
        {/if}
      </div>

      <!-- Table badge preview -->
      <div class="badge-preview">
        <span class="bp-label">Will appear in table as</span>
        <span class="bp-row">
          <span class="badge badge-{BADGE_KIND[kind]}">{previewLabel[kind]}</span>
          <span class="bp-magnitude">{previewMagnitude}</span>
        </span>
      </div>

      <!-- Affordability badge -->
      {#if affordability !== null}
      <div class="afford-badge afford-badge--{affordability}">
        {affordLabel[affordability]}
      </div>
      {/if}

      <!-- Treasury runway (cost laws only) -->
      {#if monthsTreasury !== null}
      <div class="runway-row">
        <span class="runway-label">Treasury runway</span>
        <span class="runway-value {monthsTreasury < 6 ? 'runway-danger' : monthsTreasury < 18 ? 'runway-warn' : ''}">
          {monthsTreasury} months
        </span>
      </div>
      {/if}

      {#if sim.currentState}
      <div class="context-block">
        <h4>Current context</h4>
        <div class="ctx-row"><span>Treasury</span><span class={sim.currentState.treasury_balance < 0 ? "ctx-danger" : ""}>{formatMoney(sim.currentState.treasury_balance)}</span></div>
        <div class="ctx-row"><span>Annual Revenue</span><span>{formatMoney(sim.currentState.gov_revenue * 12)}</span></div>
        <div class="ctx-row"><span>Population</span><span>{sim.currentState.population.toLocaleString()}</span></div>
        <div class="ctx-row"><span>Approval</span><span>{pct(sim.currentState.approval)}</span></div>
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
        {:else if kind === "abatement"}
        <ul>
          <li>↓ Pollution stock each month</li>
          <li>→ Improved citizen health over time</li>
          <li>↓ Treasury (monthly deduction)</li>
        </ul>
        {:else if kind === "right_grant"}
        <ul>
          <li>↑ Approval (honeymoon boost over 12 months)</li>
          <li>↑ Rights breadth — institutional legitimacy stock</li>
          <li>Re-fires monthly until prerequisites are met (idempotent)</li>
          <li>⚠ Future revocation will cost legitimacy debt</li>
        </ul>
        {:else if kind === "right_revoke"}
        <ul>
          <li>↑ Legitimacy debt (one-time, scaled by right's revocation_debt)</li>
          <li>↓ Rights breadth</li>
          <li>↓ Approval among the affected beneficiary share</li>
          <li>Idempotent: no-op if the right is not currently granted</li>
        </ul>
        {:else}
        <ul>
          <li>Adjusts the named StateCapacity field by Δ each month</li>
          <li>Field is clamped to [0,1] in the engine</li>
          <li>Downstream: tax efficiency / enforcement / legal predictability</li>
          <li>Repeal stops the monthly delta but does not undo prior changes</li>
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
.danger-hint { color: var(--danger, #ef4444); }
.danger-hint strong { color: var(--danger, #ef4444); font-weight: 700; }
select {
  width: 100%;
  background: var(--bg);
  color: var(--color-text-primary, inherit);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 6px 8px;
  font-size: 13px;
}
.field-label { font-size: 12px; color: var(--muted); margin-bottom: 0; }


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
.est-label   { font-size: 11px; color: var(--muted); }
.est-value   { font-size: 22px; font-weight: 700; }
.est-pct     { font-size: 11px; color: var(--muted); }
.est-monthly { font-size: 12px; color: var(--muted); }

.badge-preview {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bp-label     { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; }
.bp-row       { display: flex; align-items: center; gap: 8px; }
.bp-magnitude { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }

/* Badge colours reused from LawsView */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .4px;
}
.badge-income_tax  { background: rgba(99,102,241,.20);  color: #818cf8; }
.badge-benefit     { background: rgba(34,197,94,.20);   color: #4ade80; }
.badge-abatement      { background: rgba(56,189,248,.20);  color: #38bdf8; }
.badge-right_grant    { background: rgba(16,185,129,.20);  color: #34d399; }
.badge-right_revoke   { background: rgba(244,63,94,.20);   color: #fb7185; }
.badge-state_capacity { background: rgba(168,85,247,.20);  color: #c084fc; }

.afford-badge {
  padding: 8px 12px;
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 600;
}
.afford-badge--good   { background: rgba(34,197,94,.15);  color: var(--good,   #22c55e); border: 1px solid rgba(34,197,94,.3); }
.afford-badge--warn   { background: rgba(245,158,11,.15); color: var(--warn,   #f59e0b); border: 1px solid rgba(245,158,11,.3); }
.afford-badge--danger { background: rgba(239,68,68,.15);  color: var(--danger, #ef4444); border: 1px solid rgba(239,68,68,.3); }

.runway-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid var(--border);
  font-size: 12px;
}
.runway-label { color: var(--muted); }
.runway-value { font-weight: 600; }
.runway-warn  { color: var(--warn, #f59e0b); }
.runway-danger { color: var(--danger, #ef4444); }

.ctx-danger { color: var(--danger, #ef4444); font-weight: 600; }

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
