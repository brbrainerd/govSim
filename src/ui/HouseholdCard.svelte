<script lang="ts">
  import type { Session } from '../app/session.svelte';

  let {
    session,
    onExplore,
  }: {
    session: Session;
    onExplore?: () => void;
  } = $props();

  const persona = $derived(session.selectedHouseholdPersona);
  const impact = $derived(session.householdImpact);
  const net = $derived(impact.netMonthlyDelta);

  // Identify the single largest positive and negative driver
  const topBenefit = $derived.by(() => {
    const benefits = [
      { label: 'Childcare relief', val: impact.childcareDelta },
      { label: 'Healthcare savings', val: -impact.healthcareDelta },
      { label: 'Student debt relief', val: impact.studentLoansDelta },
      { label: 'Wage growth', val: impact.wagesDelta },
    ].filter((b) => b.val > 0);
    benefits.sort((a, b) => b.val - a.val);
    return benefits[0];
  });

  const topDrag = $derived.by(() => {
    const drags = [
      { label: 'Groceries & tariffs', val: impact.groceriesDelta },
      { label: 'Utility rates', val: impact.energyDelta },
      { label: 'Taxes', val: impact.taxesDelta },
      { label: 'Healthcare costs', val: impact.healthcareDelta },
    ].filter((d) => d.val > 0);
    drags.sort((a, b) => b.val - a.val);
    return drags[0];
  });
</script>

<div class="card household-card" data-testid="household-card">
  <div class="card-top">
    <div class="persona-identity">
      <span class="label">Kitchen Table Impact</span>
      <h4 class="persona-name">{persona.name}</h4>
      <span class="location-pill">{persona.locationState} · ${persona.annualIncome.toLocaleString()}</span>
    </div>
    <div
      class="hero-pill"
      class:positive={net > 0}
      class:negative={net < 0}
      class:neutral={net === 0}
      aria-label={`Net monthly impact: ${net >= 0 ? `+${net}` : net} dollars per month`}
    >
      <span class="hero-amount">{net >= 0 ? `+$${net}` : `-$${Math.abs(net)}`}</span>
      <span class="hero-unit">/ month {net > 0 ? '▲' : net < 0 ? '▼' : '—'}</span>
    </div>
  </div>

  <div class="highlights">
    {#if topBenefit}
      <span class="tag benefit">+{topBenefit.label} (${topBenefit.val}/mo)</span>
    {/if}
    {#if topDrag}
      <span class="tag drag">−{topDrag.label} (${topDrag.val}/mo)</span>
    {/if}
    {#if !topBenefit && !topDrag}
      <span class="tag neutral">Baseline policies in force</span>
    {/if}
  </div>

  {#if onExplore}
    <button
      type="button"
      class="btn explore-btn"
      onclick={onExplore}
      aria-label="Explore Household Impact details"
    >
      Explore Household Impact →
    </button>
  {/if}
</div>

<style>
  .household-card {
    padding: clamp(8px, 1.2vh, 12px);
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: var(--card);
  }
  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }
  .persona-identity {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .persona-name {
    margin: 0;
    font: 700 clamp(14px, 1.1vw, 16px)/1.2 var(--font-display);
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .location-pill {
    font: 600 12px/1.2 var(--font-ui);
    color: var(--ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .hero-pill {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1.5px solid var(--ink);
    background: var(--paper);
    flex-shrink: 0;
  }
  .hero-pill.positive {
    background: var(--sage-dark);
    color: var(--card);
    border-color: var(--sage-dark);
  }
  .hero-pill.negative {
    background: var(--alert-dark);
    color: var(--card);
    border-color: var(--alert-dark);
  }
  .hero-pill.neutral {
    background: var(--paper);
    color: var(--ink);
  }
  .hero-amount {
    font: 700 clamp(16px, 1.3vw, 20px)/1 var(--font-ui);
    letter-spacing: 0.02em;
  }
  .hero-unit {
    font: 600 11px/1.2 var(--font-ui);
    opacity: 0.9;
  }
  .highlights {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .tag {
    font: 600 11px/1.2 var(--font-ui);
    padding: 2px 6px;
    border-radius: 4px;
    white-space: nowrap;
  }
  .tag.benefit {
    background: var(--sage);
    color: var(--ink);
  }
  .tag.drag {
    background: var(--alert-tint);
    color: var(--alert-dark);
    border: 1px solid var(--alert);
  }
  .tag.neutral {
    background: var(--paper);
    color: var(--ink-soft);
    border: 1px dashed var(--ink-soft);
  }
  .explore-btn {
    width: 100%;
    margin-top: 2px;
    text-align: center;
    font-size: 13px;
    padding: 6px 10px;
    min-height: 32px;
  }
</style>
