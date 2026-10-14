<script lang="ts">
  import type { ActiveCrisis } from '../engine/director';
  import type { Session } from '../app/session.svelte';
  import Overlay from './Overlay.svelte';
  import ReporterScene from './art/ReporterScene.svelte';

  let {
    crisis,
    session,
    onClose,
  }: {
    crisis: ActiveCrisis;
    session: Session;
    onClose: () => void;
  } = $props();

  const defaultOption = $derived(crisis.options.find((o) => o.autopilot)?.id ?? crisis.options[0]?.id ?? '');
  let chosenOptionId = $state<string | null>(null);
  const selectedOptionId = $derived(
    chosenOptionId ??
      (session.draft.crisisChoice?.crisisId === crisis.crisisId
        ? session.draft.crisisChoice.optionId
        : defaultOption),
  );

  function handleSelect(id: string, cost: number) {
    if (cost <= session.current.clout) {
      chosenOptionId = id;
    }
  }

  function handleDecide() {
    if (!selectedOptionId) return;
    session.selectCrisisOption(crisis.crisisId, selectedOptionId);
    onClose();
  }
</script>

<Overlay title={`Breaking News: ${crisis.name}`} {onClose}>
  <div class="crisis-shell">
    <button
      type="button"
      class="close-btn"
      aria-label="Close crisis window"
      onclick={onClose}
    >
      ✕
    </button>

    <!-- Top ribbon banner -->
    <div class="breaking-ribbon" aria-hidden="true">
      <span class="ribbon-text">BREAKING</span>
    </div>

    <div class="modal-grid">
      <!-- Left Column: What happened -->
      <section class="what-happened" aria-labelledby="crisis-headline">
        <div class="label-row">
          <span class="section-label">What happened</span>
          {#if crisis.isEndogenous}
            <span class="autopilot-badge">Autopilot didn't face this</span>
          {/if}
          {#if crisis.isGeopolitical}
            <span class="geopolitical-badge" data-testid="geopolitical-badge">
              <svg class="globe-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              International Crisis
            </span>
            {#if (crisis.turnsRemaining ?? 1) > 1}
              <span class="countdown-badge gold" data-testid="countdown-badge" aria-live="polite">2 Quarters to Escalation</span>
            {:else}
              <span class="countdown-badge urgent" data-testid="countdown-badge" aria-live="polite">Final Quarter to Act</span>
            {/if}
          {/if}
        </div>

        <h2 id="crisis-headline" class="crisis-headline">{crisis.headline}</h2>

        <div class="scene-container">
          <ReporterScene category={crisis.crisisId} chyronText={crisis.headline.toUpperCase()} />
        </div>

        <p class="crisis-desc">{crisis.description}</p>

        <div class="explainer-box">
          <button type="button" class="learn-link" disabled aria-disabled="true">
            How it works: {crisis.explainerTitle}
          </button>
        </div>
      </section>

      <!-- Right Column: What will you do? -->
      <section class="what-to-do" aria-labelledby="crisis-choices-title">
        <h3 id="crisis-choices-title" class="choices-headline">What will you do?</h3>

        <div class="option-cards" role="radiogroup" aria-label="Crisis response options">
          {#each crisis.options as opt (opt.id)}
            {@const isAffordable = opt.cloutCost <= session.current.clout}
            {@const isSelected = selectedOptionId === opt.id}
            <div
              class="option-card"
              class:selected={isSelected}
              class:unaffordable={!isAffordable}
              data-testid={`crisis-option-${opt.id}`}
            >
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={!isAffordable}
                class="option-select-btn"
                onclick={() => handleSelect(opt.id, opt.cloutCost)}
              >
                <div class="card-header">
                  <span class="card-title">{opt.label}</span>
                  <span class="clout-pill" class:free={opt.cloutCost === 0}>
                    {opt.cloutCost > 0 ? `${opt.cloutCost} clout` : 'free'}
                  </span>
                </div>
                <p class="card-desc">{opt.description}</p>
                {#if !isAffordable}
                  <span class="unaffordable-hint">Not enough political capital ({session.current.clout} clout available)</span>
                {/if}
              </button>

              {#if opt.precedent}
                <details class="precedent-accordion" data-testid={`precedent-${opt.id}`}>
                  <summary class="precedent-summary">Historical Precedent &amp; CRS Citation</summary>
                  <div class="precedent-body">
                    <span class="precedent-citation">{opt.precedent.citation}</span>
                    <p class="precedent-text">{opt.precedent.summary}</p>
                  </div>
                </details>
              {/if}
            </div>
          {/each}
        </div>

        <div class="footer-action">
          <button
            type="button"
            class="stamp decide-btn"
            disabled={!selectedOptionId}
            onclick={handleDecide}
          >
            DECIDE
          </button>
        </div>
      </section>
    </div>
  </div>
</Overlay>

<style>
  .crisis-shell {
    position: relative;
    padding-top: clamp(8px, 1.5vh, 16px);
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 82dvh;
    overflow-y: auto;
  }

  .close-btn {
    position: absolute;
    top: 4px;
    right: 8px;
    background: transparent;
    border: none;
    font-size: 18px;
    font-weight: 700;
    color: var(--ink-muted);
    cursor: pointer;
    padding: 4px 8px;
    line-height: 1;
    z-index: 10;
  }

  .close-btn:hover {
    color: var(--ink);
  }

  /* Red ribbon across the top */
  .breaking-ribbon {
    position: absolute;
    top: -24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--alert);
    color: var(--card);
    padding: 4px 28px;
    border-radius: var(--r-sm);
    box-shadow: 0 3px 6px var(--scrim);
    border: 1.5px solid var(--alert-dark);
    z-index: 10;
  }

  .ribbon-text {
    font-family: var(--font-condensed);
    font-size: var(--text-sm);
    font-weight: 900;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .modal-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: clamp(16px, 2.5vw, 32px);
    align-items: start;
    padding-top: clamp(8px, 1vh, 16px);
  }

  @media (max-width: 768px) {
    .modal-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Left column */
  .what-happened {
    display: flex;
    flex-direction: column;
    gap: clamp(8px, 1.2vh, 14px);
  }

  .label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .section-label {
    font-family: var(--font-condensed);
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-soft);
  }

  .autopilot-badge {
    font-family: var(--font-condensed);
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    background: var(--alert-tint);
    color: var(--alert);
    border: 1px solid var(--alert);
    border-radius: var(--r-sm);
  }

  .geopolitical-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-condensed);
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    background: var(--paper-dark);
    color: var(--ink);
    border: 1px solid var(--ink);
    border-radius: var(--r-sm);
  }

  .countdown-badge {
    font-family: var(--font-condensed);
    font-size: var(--text-xs);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: var(--r-sm);
  }

  .countdown-badge.gold {
    background: var(--card);
    color: var(--ink);
    border: 1.5px solid var(--gold);
  }

  .countdown-badge.urgent {
    background: var(--alert-tint);
    color: var(--alert);
    border: 1.5px solid var(--alert);
  }

  .crisis-headline {
    font-family: var(--font-display);
    font-size: clamp(var(--text-lg), 2.2vw, var(--text-2xl));
    font-weight: 700;
    line-height: 1.15;
    color: var(--ink);
    margin: 0;
  }

  .scene-container {
    width: 100%;
  }

  .crisis-desc {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    line-height: 1.45;
    color: var(--ink);
    margin: 0;
  }

  .explainer-box {
    padding-top: 4px;
  }

  .learn-link {
    background: none;
    border: none;
    padding: 0;
    font-family: var(--font-body);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--ink-soft);
    text-decoration: underline;
    cursor: not-allowed;
    opacity: 0.75;
  }

  /* Right column */
  .what-to-do {
    display: flex;
    flex-direction: column;
    gap: clamp(10px, 1.4vh, 16px);
  }

  .choices-headline {
    font-family: var(--font-display);
    font-size: clamp(var(--text-md), 1.8vw, var(--text-xl));
    font-weight: 700;
    color: var(--ink);
    margin: 0;
  }

  .option-cards {
    display: flex;
    flex-direction: column;
    gap: clamp(8px, 1.2vh, 12px);
  }

  .option-card {
    text-align: left;
    background: var(--paper);
    border: 2px solid var(--ink-soft);
    border-radius: var(--r-md);
    padding: clamp(10px, 1.4vh, 14px);
    cursor: pointer;
    transition: border-color 0.15s, background-color 0.15s, transform 0.1s;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .option-card:hover:not(:disabled) {
    border-color: var(--ink);
    background: var(--card);
  }

  .option-card:focus-visible {
    outline: 3px solid var(--gold);
    outline-offset: 2px;
  }

  .option-card.selected {
    border-color: var(--ink);
    border-width: 2.5px;
    background: var(--paper-dark);
    box-shadow: 0 2px 4px var(--scrim);
  }

  .option-card.unaffordable {
    opacity: 0.55;
    cursor: not-allowed;
    background: var(--paper-dark);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .card-title {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--ink);
  }

  .clout-pill {
    font-family: var(--font-condensed);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: var(--r-sm);
    background: var(--ink);
    color: var(--card);
    white-space: nowrap;
  }

  .clout-pill.free {
    background: var(--paper-dark);
    color: var(--ink-soft);
    border: 1px solid var(--ink-soft);
  }

  .card-desc {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    line-height: 1.4;
    color: var(--ink-soft);
    margin: 0;
  }

  .unaffordable-hint {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    font-style: italic;
    color: var(--alert);
    margin-top: 2px;
  }

  .option-select-btn {
    all: unset;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    box-sizing: border-box;
    text-align: left;
  }

  .option-select-btn:disabled {
    cursor: not-allowed;
  }

  .option-select-btn:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }

  .precedent-accordion {
    margin-top: 6px;
    border-top: 1px dashed var(--ink-soft);
    padding-top: 4px;
  }

  .precedent-summary {
    font-family: var(--font-condensed);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--ink-soft);
    cursor: pointer;
    user-select: none;
    letter-spacing: 0.03em;
  }

  .precedent-summary:hover {
    color: var(--ink);
  }

  .precedent-body {
    padding: 6px 8px;
    margin-top: 4px;
    background: var(--card);
    border-radius: var(--r-sm);
    border-left: 3px solid var(--gold);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .precedent-citation {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--ink);
  }

  .precedent-text {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    line-height: 1.35;
    color: var(--ink-soft);
    margin: 0;
  }

  .footer-action {
    display: flex;
    justify-content: flex-end;
    padding-top: clamp(6px, 1vh, 12px);
  }

  .decide-btn {
    background: var(--alert);
    color: var(--card);
    border: 2px solid var(--ink);
    font-family: var(--font-condensed);
    font-size: var(--text-md);
    font-weight: 900;
    letter-spacing: 0.1em;
    padding: clamp(8px, 1.2vh, 12px) clamp(20px, 2.5vw, 32px);
    border-radius: var(--r-sm);
    cursor: pointer;
    box-shadow: 2px 3px 0 var(--ink);
    transition: transform 0.08s, box-shadow 0.08s;
  }

  .decide-btn:hover:not(:disabled) {
    transform: translate(-1px, -1px);
    box-shadow: 3px 4px 0 var(--ink);
  }

  .decide-btn:active:not(:disabled) {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0 var(--ink);
  }

  .decide-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }
</style>
