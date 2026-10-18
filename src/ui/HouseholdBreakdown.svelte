<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import { getStateExposure, STATE_EXPOSURES } from '../data/electoral';
  import {
    createCustomHousehold,
    HOUSEHOLD_PRESETS,
    type HouseholdComposition,
    type HouseholdPersona,
  } from '../engine/household';
  import {
    INCOME_TIER_HIGH,
    INCOME_TIER_LOW,
    INCOME_TIER_MEDIAN,
    INCOME_TIER_SERVICE,
    INCOME_TIER_UPPER_MIDDLE,
    RPP_BASE_INDEX,
  } from '../engine/units';
  import { resolveHouseholdPortrait } from './art/Character.svelte';
  import CharacterPortrait from './art/CharacterPortrait.svelte';

  let {
    session,
  }: {
    session: Session;
  } = $props();

  const persona = $derived(session.selectedHouseholdPersona);
  const impact = $derived(session.householdImpact);
  const net = $derived(impact.netMonthlyDelta);
  const citizenPortrait = $derived(resolveHouseholdPortrait(persona, net));

  let isCustomMode = $state(false);

  // Custom configuration fields
  let customState = $state('OH');
  let customIncome = $state<number>(INCOME_TIER_MEDIAN);
  let customComp = $state<HouseholdComposition>('young_family');
  let customDebt = $state(false);
  let customAca = $state(false);

  const allStateCodes = Object.keys(STATE_EXPOSURES).filter((s) => s.length === 2).sort();

  function selectPreset(p: HouseholdPersona) {
    isCustomMode = false;
    session.setHouseholdPersona(p);
  }

  function applyCustom() {
    isCustomMode = true;
    const custom = createCustomHousehold({
      locationState: customState,
      annualIncome: customIncome,
      composition: customComp,
      hasStudentDebt: customDebt,
      usesAcaMarketplace: customAca,
      name: `Custom Household (${customState})`,
    });
    session.setHouseholdPersona(custom);
  }

  const exp = $derived(getStateExposure(persona.locationState));
  const rppText = $derived.by(() => {
    if (!exp?.rpp) return 'National baseline cost-of-living index.';
    const diff = exp.rpp - RPP_BASE_INDEX;
    if (Math.abs(diff) < 0.5) return 'Living costs align with the national average.';
    if (diff < 0) {
      return `Dollars stretch ${Math.abs(diff).toFixed(1)}% further in ${persona.locationState} due to lower living costs (BEA RPP: ${exp.rpp}).`;
    }
    return `Living costs are ${diff.toFixed(1)}% higher in ${persona.locationState} than the national average (BEA RPP: ${exp.rpp}).`;
  });

  // 7 visual ledger rows: definition with cashflow effect
  interface LedgerRow {
    id: string;
    title: string;
    explanation: string;
    amount: number; // positive = net benefit to wallet, negative = net drag
    format: string;
  }

  const ledgerRows = $derived<LedgerRow[]>([
    {
      id: 'wages',
      title: 'Wages & Take-Home Pay',
      explanation: 'Share of macroeconomic real wage growth reaching household labor.',
      amount: impact.wagesDelta,
      format: impact.wagesDelta >= 0 ? `+$${impact.wagesDelta}` : `-$${Math.abs(impact.wagesDelta)}`,
    },
    {
      id: 'groceries',
      title: 'Groceries & Consumer Goods',
      explanation: 'Inflation and tariff price passthrough on essential family basket.',
      amount: -impact.groceriesDelta,
      format: impact.groceriesDelta <= 0 ? `+$${Math.abs(impact.groceriesDelta)}` : `-$${impact.groceriesDelta}`,
    },
    {
      id: 'energy',
      title: 'Energy Utilities & Fuel',
      explanation: 'Carbon standard rate shifts vs clean energy and fossil permitting relief.',
      amount: -impact.energyDelta,
      format: impact.energyDelta <= 0 ? `+$${Math.abs(impact.energyDelta)}` : `-$${impact.energyDelta}`,
    },
    {
      id: 'healthcare',
      title: 'Healthcare & Prescriptions',
      explanation: 'ACA premium subsidies, Medicare drug caps, and public option competition.',
      amount: -impact.healthcareDelta,
      format: impact.healthcareDelta <= 0 ? `+$${Math.abs(impact.healthcareDelta)}` : `-$${impact.healthcareDelta}`,
    },
    {
      id: 'childcare',
      title: 'Childcare & Pre-K Grants',
      explanation: 'Universal Pre-K tuition relief and Title I public school support per child.',
      amount: impact.childcareDelta,
      format: impact.childcareDelta >= 0 ? `+$${impact.childcareDelta}` : `-$${Math.abs(impact.childcareDelta)}`,
    },
    {
      id: 'student_loans',
      title: 'Student Loan Payments',
      explanation: 'Monthly debt service relief from income-driven repayment and cancellation.',
      amount: impact.studentLoansDelta,
      format: impact.studentLoansDelta >= 0 ? `+$${impact.studentLoansDelta}` : `-$${Math.abs(impact.studentLoansDelta)}`,
    },
    {
      id: 'taxes',
      title: 'Taxes & Payroll Deductions',
      explanation: 'Federal income tax bracket adjustments and payroll statutory rates.',
      amount: -impact.taxesDelta,
      format: impact.taxesDelta <= 0 ? `+$${Math.abs(impact.taxesDelta)}` : `-$${impact.taxesDelta}`,
    },
  ]);
</script>

<div class="household-dashboard" data-testid="household-breakdown">
  <!-- Persona selector tabs -->
  <div class="persona-tabs" role="tablist" aria-label="Select household persona">
    {#each HOUSEHOLD_PRESETS as p (p.id)}
      <button
        type="button"
        role="tab"
        class="persona-tab"
        class:active={!isCustomMode && persona.id === p.id}
        aria-selected={!isCustomMode && persona.id === p.id}
        onclick={() => selectPreset(p)}
        data-testid={`preset-tab-${p.id}`}
      >
        <span class="tab-state">{p.locationState}</span>
        <span class="tab-title">{p.name.split(' ')[0]}</span>
      </button>
    {/each}
    <button
      type="button"
      role="tab"
      class="persona-tab custom-tab"
      class:active={isCustomMode || persona.id === 'custom'}
      aria-selected={isCustomMode || persona.id === 'custom'}
      onclick={() => {
        isCustomMode = true;
        applyCustom();
      }}
      data-testid="preset-tab-custom"
    >
      <span class="tab-state">⚙</span>
      <span class="tab-title">Custom</span>
    </button>
  </div>

  <!-- Hero Net Cashflow Banner -->
  <div
    class="hero-banner"
    class:positive={net > 0}
    class:negative={net < 0}
    class:neutral={net === 0}
    role="status"
    aria-live="polite"
  >
    <div class="banner-top">
      <div class="banner-title-group">
        <span data-testid="household-modal-portrait">
          <CharacterPortrait
            look={citizenPortrait.look}
            mood={citizenPortrait.mood}
            prop={citizenPortrait.prop}
            size={44}
            badgeText={citizenPortrait.badge}
            ringColor={net > 0 ? 'sage' : net < 0 ? 'alert' : 'gold'}
          />
        </span>
        <span class="banner-label">Monthly Net Household Cashflow</span>
      </div>
      <span class="banner-amount">
        {net >= 0 ? `+$${net}` : `-$${Math.abs(net)}`}
        <span class="banner-unit">/ month {net > 0 ? '▲' : net < 0 ? '▼' : '—'}</span>
      </span>
    </div>
    <div class="banner-desc">
      <b>{persona.name} ({persona.locationState})</b>: {persona.description}
    </div>
  </div>

  <!-- BEA RPP Context Note -->
  <div class="rpp-note">
    <span class="rpp-icon" aria-hidden="true">ℹ</span>
    <span class="rpp-text">{rppText}</span>
  </div>

  <!-- Custom Builder Controls (shown when custom is active) -->
  {#if isCustomMode || persona.id === 'custom'}
    <div class="custom-builder card" data-testid="custom-builder">
      <h4 class="builder-title">Customize Household Profile</h4>
      <div class="builder-grid">
        <label class="builder-field">
          <span class="label">State</span>
          <select
            bind:value={customState}
            onchange={applyCustom}
            aria-label="Select household state"
          >
            {#each allStateCodes as st}
              <option value={st}>{st}</option>
            {/each}
          </select>
        </label>

        <label class="builder-field">
          <span class="label">Income Tier</span>
          <select
            bind:value={customIncome}
            onchange={applyCustom}
            aria-label="Select annual household income"
          >
            <option value={INCOME_TIER_LOW}>$35,000 (Low / Fixed)</option>
            <option value={INCOME_TIER_SERVICE}>$42,000 (Service / Hourly)</option>
            <option value={INCOME_TIER_MEDIAN}>$65,000 (Median Working)</option>
            <option value={INCOME_TIER_UPPER_MIDDLE}>$105,000 (Upper-Middle)</option>
            <option value={INCOME_TIER_HIGH}>$160,000 (High Earner)</option>
          </select>
        </label>

        <label class="builder-field">
          <span class="label">Family Composition</span>
          <select
            bind:value={customComp}
            onchange={applyCustom}
            aria-label="Select family composition"
          >
            <option value="single">Single Adult</option>
            <option value="couple">Working Couple</option>
            <option value="young_family">Family with Children</option>
            <option value="senior">Senior (65+)</option>
          </select>
        </label>
      </div>

      <div class="builder-checkboxes">
        <label class="checkbox-label">
          <input
            type="checkbox"
            bind:checked={customDebt}
            onchange={applyCustom}
          />
          <span>Carries Federal Student Debt</span>
        </label>

        <label class="checkbox-label">
          <input
            type="checkbox"
            bind:checked={customAca}
            onchange={applyCustom}
          />
          <span>Purchases ACA Marketplace Insurance</span>
        </label>
      </div>
    </div>
  {/if}

  <!-- 7-Component Visual Ledger -->
  <div class="ledger-list" role="table" aria-label="Kitchen-table household ledger">
    {#each ledgerRows as row (row.id)}
      <div class="ledger-row card" role="row" data-testid={`ledger-row-${row.id}`}>
        <div class="row-info">
          <div class="row-title" role="rowheader">{row.title}</div>
          <div class="row-explanation">{row.explanation}</div>
        </div>
        <div
          class="row-pill"
          class:positive={row.amount > 0}
          class:negative={row.amount < 0}
          class:neutral={row.amount === 0}
          role="cell"
          aria-label={`${row.title}: ${row.format} per month`}
        >
          {row.format} <span class="pill-unit">/ mo</span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .household-dashboard {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    overflow-y: auto;
    padding-right: 4px;
  }
  .persona-tabs {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
  }
  .persona-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 4px;
    background: var(--paper);
    color: var(--ink);
    border: 2px solid var(--ink);
    border-radius: 6px;
    cursor: pointer;
    font-family: var(--font-ui);
    transition: background var(--dur-fast), transform var(--dur-fast);
  }
  .persona-tab:hover {
    background: var(--card);
  }
  .persona-tab.active {
    background: var(--ink);
    color: var(--card);
    box-shadow: 2px 2px 0 var(--gold-dark);
  }
  .tab-state {
    font: 700 12px/1 var(--font-ui);
    letter-spacing: 0.05em;
  }
  .tab-title {
    font: 600 11px/1.2 var(--font-body);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  .hero-banner {
    padding: 10px 14px;
    border-radius: 8px;
    border: 2px solid var(--ink);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .hero-banner.positive {
    background: var(--sage-dark);
    color: var(--card);
    border-color: var(--sage-dark);
  }
  .hero-banner.negative {
    background: var(--alert-dark);
    color: var(--card);
    border-color: var(--alert-dark);
  }
  .hero-banner.neutral {
    background: var(--card);
    color: var(--ink);
  }
  .banner-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .banner-title-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .banner-label {
    font: 600 12px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    opacity: 0.9;
  }
  .banner-amount {
    font: 700 clamp(20px, 1.8vw, 26px)/1 var(--font-ui);
  }
  .banner-unit {
    font: 600 13px/1 var(--font-ui);
    margin-left: 2px;
  }
  .banner-desc {
    font: 400 13px/1.3 var(--font-body);
    opacity: 0.95;
  }
  .rpp-note {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background: var(--paper);
    border-radius: 4px;
    border: 1px dashed var(--ink-soft);
    font: 400 12px/1.3 var(--font-body);
    color: var(--ink-soft);
  }
  .rpp-icon {
    font-weight: 700;
  }
  .custom-builder {
    padding: 8px 12px;
    background: var(--card);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .builder-title {
    margin: 0;
    font: 700 14px/1 var(--font-display);
    color: var(--ink);
  }
  .builder-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .builder-field {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .builder-field select {
    font: 600 12px/1.2 var(--font-ui);
    padding: 4px;
    border: 1.5px solid var(--ink);
    border-radius: 4px;
    background: var(--paper);
    color: var(--ink);
  }
  .builder-checkboxes {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font: 500 12px/1.2 var(--font-body);
    cursor: pointer;
  }
  .ledger-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ledger-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    background: var(--card);
    gap: 8px;
  }
  .row-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .row-title {
    font: 700 13px/1.2 var(--font-display);
    color: var(--ink);
  }
  .row-explanation {
    font: 400 11px/1.2 var(--font-body);
    color: var(--ink-soft);
  }
  .row-pill {
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid var(--ink);
    font: 700 13px/1 var(--font-ui);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .row-pill.positive {
    background: var(--sage-dark);
    color: var(--card);
  }
  .row-pill.negative {
    background: var(--alert-tint);
    color: var(--alert-dark);
    border-color: var(--alert);
  }
  .row-pill.neutral {
    background: var(--paper);
    color: var(--ink-soft);
    border-color: var(--ink-soft);
  }
  .pill-unit {
    font-size: 10px;
    font-weight: 500;
  }
</style>
