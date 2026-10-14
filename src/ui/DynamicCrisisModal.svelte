<script lang="ts">
  import type { AiDynamicCrisis, AiDynamicCrisisOption } from '../app/ai-director';
  import type { Session } from '../app/session.svelte';
  import Overlay from './Overlay.svelte';

  let {
    crisis,
    session,
    onClose,
  }: {
    crisis: AiDynamicCrisis;
    session: Session;
    onClose: () => void;
  } = $props();

  const availableClout = $derived(session.clout + session.dynamicCrisisCost);
  let chosenOptionId = $state<string | null>(null);
  const selectedOptionId = $derived(
    chosenOptionId ?? crisis.options.find((o) => o.cloutCost <= availableClout)?.id ?? '',
  );

  const chosenOption = $derived(
    crisis.options.find((o) => o.id === selectedOptionId),
  );

  function handleSelect(id: string) {
    chosenOptionId = id;
  }

  function handleDecide() {
    if (!chosenOption || chosenOption.cloutCost > availableClout) return;
    session.stageDynamicCrisisOption({
      gapDelta: chosenOption.gapDelta,
      infDelta: chosenOption.infDelta,
      approvalDelta: chosenOption.approvalDelta,
      trustDelta: chosenOption.trustDelta,
      ...(chosenOption.cloutCost > 0 ? { cloutCost: chosenOption.cloutCost } : {}),
    });
    onClose();
  }
</script>

<Overlay title={`AI Dynamic Crisis: ${crisis.title}`} {onClose}>
  <div class="dynamic-crisis-shell" data-testid="dynamic-crisis-modal">
    <button
      type="button"
      class="close-btn"
      aria-label="Close crisis window"
      onclick={onClose}
    >
      ✕
    </button>

    <div class="breaking-ribbon">
      <span class="ribbon-text">AI DYNAMIC CRISIS · LIVE SYNTHESIS</span>
    </div>

    <div class="modal-grid">
      <!-- Left Column: What happened -->
      <section class="what-happened">
        <div class="label-row">
          <span class="section-label">Emergent Situation</span>
          <span class="category-badge">{crisis.category}</span>
        </div>

        <h2 class="crisis-headline">{crisis.title}</h2>
        <p class="crisis-desc">{crisis.summary}</p>

        <div class="safeguard-box">
          <b>Deterministic Engine Boundary:</b>
          <p>
            AI synthesized this crisis text, but all consequences are mathematically clamped and validated
            before touching the pure economic engine.
          </p>
        </div>
      </section>

      <!-- Right Column: Choices -->
      <section class="what-to-do">
        <h3 class="choices-headline">How will you respond?</h3>

        <div class="option-cards" role="radiogroup" aria-label="Crisis response options">
          {#each crisis.options as opt (opt.id)}
            {@const isAffordable = opt.cloutCost <= availableClout}
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
                onclick={() => handleSelect(opt.id)}
              >
                <div class="card-header">
                  <span class="card-title">{opt.label}</span>
                  <span class="clout-pill" class:free={opt.cloutCost === 0}>
                    {opt.cloutCost > 0 ? `${opt.cloutCost} clout` : 'free'}
                  </span>
                </div>
                <p class="card-desc">{opt.detail}</p>

                <div class="impact-chips">
                  {#if opt.gapDelta !== 0}
                    <span class="chip" class:positive={opt.gapDelta > 0} class:negative={opt.gapDelta < 0}>
                      GDP Gap: {opt.gapDelta > 0 ? `+${opt.gapDelta.toFixed(2)}` : opt.gapDelta.toFixed(2)}%
                    </span>
                  {/if}
                  {#if opt.infDelta !== 0}
                    <span class="chip" class:positive={opt.infDelta < 0} class:negative={opt.infDelta > 0}>
                      Inflation: {opt.infDelta > 0 ? `+${opt.infDelta.toFixed(2)}` : opt.infDelta.toFixed(2)}%
                    </span>
                  {/if}
                  {#if opt.approvalDelta !== 0}
                    <span class="chip" class:positive={opt.approvalDelta > 0} class:negative={opt.approvalDelta < 0}>
                      Approval: {opt.approvalDelta > 0 ? `+${opt.approvalDelta}` : opt.approvalDelta}%
                    </span>
                  {/if}
                  {#if opt.trustDelta !== 0}
                    <span class="chip" class:positive={opt.trustDelta > 0} class:negative={opt.trustDelta < 0}>
                      Trust: {opt.trustDelta > 0 ? `+${opt.trustDelta}` : opt.trustDelta} pts
                    </span>
                  {/if}
                </div>
              </button>
            </div>
          {/each}
        </div>

        <div class="footer-action">
          <button
            type="button"
            class="stamp decide-btn"
            data-testid="decide-crisis-btn"
            disabled={!chosenOption || chosenOption.cloutCost > availableClout}
            onclick={handleDecide}
          >
            Stage Response
          </button>
        </div>
      </section>
    </div>
  </div>
</Overlay>

<style>
  .dynamic-crisis-shell {
    position: relative;
    width: min(840px, 94vw);
    max-height: 88vh;
    background: var(--paper);
    border: var(--rule) solid var(--ink);
    border-radius: 4px;
    box-shadow: 6px 6px 0 var(--ink);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .close-btn {
    position: absolute;
    top: 10px;
    right: 12px;
    background: var(--card);
    border: 1px solid var(--ink);
    font: 700 14px/1 var(--font-ui);
    color: var(--ink);
    padding: 6px 10px;
    cursor: pointer;
    border-radius: 3px;
    z-index: 10;
  }

  .close-btn:hover {
    background: var(--ink);
    color: var(--paper);
  }

  .breaking-ribbon {
    background: var(--ink);
    color: var(--gold);
    padding: 6px 16px;
    border-bottom: 2px solid var(--ink);
  }

  .ribbon-text {
    font: 700 11px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .modal-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    padding: clamp(14px, 2vh, 22px);
  }

  @media (max-width: 680px) {
    .modal-grid {
      grid-template-columns: 1fr;
    }
  }

  .what-happened,
  .what-to-do {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .section-label {
    font: 700 11px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-soft);
  }

  .category-badge {
    font: 700 10px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: var(--gold);
    color: var(--ink);
    padding: 3px 6px;
    border-radius: 3px;
    border: 1px solid var(--ink);
  }

  .crisis-headline {
    font: 700 clamp(18px, 1.4vw, 22px)/1.2 var(--font-display);
    color: var(--ink);
    margin: 0;
  }

  .crisis-desc {
    font: 500 14px/1.4 var(--font-body);
    color: var(--ink);
    margin: 0;
  }

  .safeguard-box {
    background: var(--card);
    border: 1px dashed var(--ink-soft);
    padding: 10px 14px;
    border-radius: 4px;
    font: 500 12px/1.4 var(--font-body);
    color: var(--ink-soft);
  }

  .safeguard-box b {
    display: block;
    color: var(--ink);
    margin-bottom: 2px;
  }

  .safeguard-box p {
    margin: 0;
  }

  .choices-headline {
    font: 700 15px/1.2 var(--font-display);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ink);
    margin: 0;
  }

  .option-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .option-card {
    border: 1.5px solid var(--ink-soft);
    border-radius: 4px;
    background: var(--card);
    transition: all 0.15s ease;
  }

  .option-card.selected {
    border: 2px solid var(--ink);
    background: var(--paper);
    box-shadow: 2px 2px 0 var(--ink);
  }

  .option-card.unaffordable {
    opacity: 0.5;
  }

  .option-select-btn {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 10px 14px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .card-title {
    font: 700 14px/1.2 var(--font-display);
    color: var(--ink);
  }

  .clout-pill {
    font: 700 11px/1 var(--font-ui);
    text-transform: uppercase;
    background: var(--paper);
    border: 1px solid var(--ink);
    padding: 2px 6px;
    border-radius: 3px;
    color: var(--ink);
  }

  .clout-pill.free {
    background: var(--gold);
  }

  .card-desc {
    font: 500 13px/1.3 var(--font-body);
    color: var(--ink-soft);
    margin: 0;
  }

  .impact-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
  }

  .chip {
    font: 600 10px/1 var(--font-ui);
    padding: 2px 6px;
    border-radius: 3px;
    background: var(--paper);
    border: 1px solid var(--ink-tint);
    color: var(--ink);
  }

  .chip.positive {
    background: var(--card);
    color: var(--ink);
  }

  .chip.negative {
    background: var(--alert-tint);
    border-color: var(--alert);
    color: var(--ink);
  }

  .footer-action {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }

  .decide-btn {
    background: var(--ink);
    color: var(--paper);
    border: var(--rule) solid var(--ink);
    font: 700 13px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 10px 20px;
    border-radius: 3px;
    cursor: pointer;
  }

  .decide-btn:hover {
    background: var(--ink-soft);
  }
</style>
