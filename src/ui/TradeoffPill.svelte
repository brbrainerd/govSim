<script lang="ts">
  import type { VocabMode } from '../content/glossary';
  import CivicEmblem from './art/CivicEmblem.svelte';

  let {
    variant = 'compact',
    title,
    upside,
    catchText,
    whyClick,
    emoji,
    realTerm,
    legalBasis,
    vocabMode = 'plain',
    impactScore,
  }: {
    variant?: 'compact' | 'card';
    title?: string;
    upside: string;
    catchText: string;
    whyClick?: string;
    emoji?: string;
    realTerm?: string;
    legalBasis?: string;
    vocabMode?: VocabMode;
    impactScore?: number;
  } = $props();

  let expandedWonk = $state(false);
  const showWonkDetails = $derived(vocabMode === 'wonk' || expandedWonk);
  const hasWonkMeta = $derived(Boolean(realTerm || legalBasis));
  const tipId = `wonk-tip-${Math.random().toString(36).slice(2, 9)}`;
</script>

{#if variant === 'compact'}
  <div class="tradeoff-compact" data-testid="tradeoff-pill">
    <span class="badge upside-badge" data-testid="tradeoff-pill-upside">
      <CivicEmblem kind="up" size={11} /> {upside}
    </span>
    <span class="badge catch-badge" data-testid="tradeoff-pill-catch">
      <CivicEmblem kind="warn" size={11} /> {catchText}
    </span>
    {#if hasWonkMeta}
      {#if vocabMode === 'wonk'}
        <span class="badge wonk-badge" data-testid="tradeoff-wonk-inline">
          <CivicEmblem kind="grad" size={11} /> {realTerm ?? ''}{realTerm && legalBasis ? ' · ' : ''}{legalBasis ?? ''}
        </span>
      {:else}
        <button
          type="button"
          class="wonk-tip-btn"
          aria-describedby={tipId}
          data-testid="tradeoff-wonk-tip-btn"
        >
          <CivicEmblem kind="grad" size={11} /> Real term
          <span role="tooltip" id={tipId} class="wonk-tooltip">
            {#if whyClick}
              <span class="tip-line"><b>Why click:</b> {whyClick}</span>
            {/if}
            {#if realTerm}
              <span class="tip-line"><b>Real term:</b> {realTerm}</span>
            {/if}
            {#if legalBasis}
              <span class="tip-line"><b>Law:</b> {legalBasis}</span>
            {/if}
          </span>
        </button>
      {/if}
    {/if}
  </div>
{:else}
  <div class="tradeoff-card" data-testid="tradeoff-card">
    {#if title || emoji || impactScore !== undefined}
      <div class="card-head">
        <div class="card-title-wrap">
          <CivicEmblem kind="bolt" size={14} />
          {#if title}
            <b class="card-title">{title}</b>
          {/if}
        </div>
        {#if impactScore !== undefined}
          <span
            class="impact-meter"
            class:pos={impactScore > 0}
            class:neg={impactScore < 0}
            data-testid="tradeoff-impact-meter"
          >
            {impactScore > 0 ? `+${impactScore} Net` : impactScore < 0 ? `${impactScore} Net` : 'Balanced'}
          </span>
        {/if}
      </div>
    {/if}

    {#if whyClick}
      <div class="why-click-row" data-testid="tradeoff-why-click">
        <span class="why-label"><CivicEmblem kind="bolt" size={12} /> Why click this:</span>
        <span class="why-body">{whyClick}</span>
      </div>
    {/if}

    <div class="tradeoff-grid">
      <div class="tradeoff-box upside-box" data-testid="tradeoff-pill-upside">
        <span class="box-tag"><CivicEmblem kind="up" size={11} /> Upside</span>
        <span class="box-text">{upside}</span>
      </div>
      <div class="tradeoff-box catch-box" data-testid="tradeoff-pill-catch">
        <span class="box-tag"><CivicEmblem kind="warn" size={11} /> The Catch</span>
        <span class="box-text">{catchText}</span>
      </div>
    </div>

    {#if hasWonkMeta}
      <div class="wonk-footer">
        {#if vocabMode !== 'wonk'}
          <button
            type="button"
            class="wonk-toggle"
            aria-expanded={expandedWonk}
            data-testid="tradeoff-wonk-toggle"
            onclick={() => (expandedWonk = !expandedWonk)}
          >
            {expandedWonk ? '▾ Hide Policy Wonk note' : '▸ Policy Wonk note'}
          </button>
        {/if}
        {#if showWonkDetails}
          <div class="wonk-drawer" data-testid="tradeoff-wonk-drawer">
            {#if realTerm}
              <span><b>Real-world term:</b> {realTerm}</span>
            {/if}
            {#if legalBasis}
              <span><b>Statutory basis:</b> {legalBasis}</span>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .tradeoff-compact {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    margin-top: 3px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 7px;
    border-radius: 4px;
    font: 600 11px/1.2 var(--font-body);
    border: 1px solid var(--ink);
  }
  .upside-badge {
    background: var(--sage-tint);
    border-color: var(--sage-dark);
    color: var(--ink);
  }
  .catch-badge {
    background: var(--alert-tint);
    border-color: var(--alert);
    color: var(--ink);
  }
  .wonk-badge {
    background: var(--card-alt);
    border-style: dashed;
    color: var(--ink-soft);
    font-family: var(--font-ui);
    letter-spacing: 0.02em;
  }
  .wonk-tip-btn {
    position: relative;
    background: var(--card-alt);
    border: 1px dashed var(--ink-soft);
    border-radius: 4px;
    padding: 1px 6px;
    font: 600 10px/1.2 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ink-soft);
    cursor: help;
  }
  .wonk-tip-btn:focus-visible {
    outline: 2px solid var(--gold-dark);
    outline-offset: 2px;
  }
  .wonk-tooltip {
    display: none;
    position: absolute;
    bottom: calc(100% + 6px);
    left: 0;
    z-index: 25;
    width: max-content;
    max-width: 260px;
    padding: 6px 9px;
    background: var(--ink);
    color: var(--card);
    border-radius: var(--r-sm);
    font: 500 11px/1.3 var(--font-body);
    text-transform: none;
    letter-spacing: normal;
    text-align: left;
    box-shadow: var(--shadow);
  }
  .tip-line {
    display: block;
    margin-bottom: 2px;
  }
  .tip-line:last-child {
    margin-bottom: 0;
  }
  .wonk-tip-btn:hover .wonk-tooltip,
  .wonk-tip-btn:focus-visible .wonk-tooltip {
    display: block;
  }

  .tradeoff-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    background: var(--card-alt);
    border: 1.5px solid var(--ink);
    border-radius: var(--r-sm);
  }
  .card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }
  .card-title-wrap {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .card-title {
    font: 700 13px/1.2 var(--font-display);
    color: var(--ink);
  }
  .impact-meter {
    font: 700 10px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 6px;
    border-radius: 999px;
    border: 1px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
  }
  .impact-meter.pos {
    background: var(--sage-tint);
    border-color: var(--sage-dark);
    color: var(--sage-dark);
  }
  .impact-meter.neg {
    background: var(--alert-tint);
    border-color: var(--alert);
    color: var(--alert);
  }
  .why-click-row {
    font: 500 12px/1.3 var(--font-body);
    color: var(--ink);
  }
  .why-label {
    font-weight: 700;
    margin-right: 4px;
  }
  .tradeoff-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .tradeoff-box {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 5px 7px;
    border-radius: 4px;
    border: 1px solid var(--ink);
  }
  .upside-box {
    background: var(--sage-tint);
    border-color: var(--sage-dark);
  }
  .catch-box {
    background: var(--alert-tint);
    border-color: var(--alert);
  }
  .box-tag {
    font: 700 10px/1.1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ink);
  }
  .box-text {
    font: 600 11px/1.25 var(--font-body);
    color: var(--ink);
  }
  .wonk-footer {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .wonk-toggle {
    align-self: flex-start;
    background: none;
    border: none;
    padding: 0;
    font: 700 11px/1.2 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ink-soft);
    cursor: pointer;
  }
  .wonk-toggle:hover {
    color: var(--ink);
  }
  .wonk-drawer {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px 7px;
    background: var(--paper);
    border-left: 2.5px solid var(--ink-soft);
    font: 500 11px/1.25 var(--font-body);
    color: var(--ink-soft);
  }
</style>
