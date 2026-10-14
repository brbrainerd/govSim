<script lang="ts">
  import { ArrowRight, CheckCircle2, ExternalLink, HelpCircle, XCircle } from '@lucide/svelte';
  import type { MythCard, MythRealLeverAction } from '../content/myths';
  import Character, { type Look } from './art/Character.svelte';
  import Overlay from './Overlay.svelte';

  let {
    myth,
    isFirstView = false,
    calmMode = false,
    onClose,
    onGotIt,
    onPivot,
    onSpin,
  }: {
    myth: MythCard;
    isFirstView?: boolean;
    calmMode?: boolean;
    onClose: () => void;
    onGotIt: () => void;
    onPivot?: (action: MythRealLeverAction) => void;
    onSpin?: () => void;
  } = $props();

  let selectedOption = $state<number | null>(null);
  let manuallyRevealed = $state<boolean>(false);
  let isRevealed = $derived(!isFirstView || manuallyRevealed);
  let stampSlam = $state<boolean>(false);

  const analystLook: Look = {
    skin: 'skin-2',
    hair: 'hair-1',
    hairStyle: 'side',
    suit: 'art-carpet',
    tie: 'gold',
    glasses: true,
  };

  function handleSelectOption(index: number) {
    if (isRevealed) return;
    selectedOption = index;
    manuallyRevealed = true;
    if (!calmMode) {
      stampSlam = true;
      setTimeout(() => {
        stampSlam = false;
      }, 350);
    }
  }

  function handleSkip() {
    manuallyRevealed = true;
  }
</script>

<Overlay title="Civics Myth: {myth.title}" {onClose}>
  <div class="myth-modal-content">
    <div class="myth-grid">
      <!-- Left Column: The Myth / Claim -->
      <section class="myth-side" aria-label="The Myth">
        <div class="myth-stamp-container">
          <div
            class="myth-stamp"
            class:slam={stampSlam}
            class:busted={isRevealed}
            data-testid="myth-stamp"
            aria-hidden="true"
          >
            {#if isRevealed}
              <XCircle size={24} />
              <span>MYTH BUSTED</span>
            {:else}
              <HelpCircle size={24} />
              <span>CIVIC CLAIM</span>
            {/if}
          </div>
        </div>

        <span class="myth-tag">CIVICS MISCONCEPTION</span>
        <blockquote class="myth-quote">
          &ldquo;{myth.mythStatement}&rdquo;
        </blockquote>

        <div class="myth-context-card">
          <p>
            Constitutional checks, federal statutes, and market forces limit direct executive control
            over complex decentralized systems.
          </p>
        </div>
      </section>

      <!-- Right Column: Prediction Challenge or Institutional Reality -->
      <section class="reality-side" aria-label="The Reality">
        {#if !isRevealed}
          <!-- Prediction Step (MYTH-03) -->
          <div class="challenge-container" data-testid="myth-challenge">
            <div class="challenge-header">
              <span class="challenge-tag">POPULIST CLAIM REALITY CHECK</span>
              <h3 class="challenge-question">{myth.predictionPrompt.question}</h3>
              <p class="challenge-lead">
                Call the bluff or spot the bottleneck before checking the constitutional facts:
              </p>
            </div>

            <div class="options-grid">
              {#each myth.predictionPrompt.options as option, idx}
                <button
                  type="button"
                  class="pred-option-btn"
                  data-testid="myth-pred-opt-{idx}"
                  onclick={() => handleSelectOption(idx)}
                >
                  <span class="option-marker">{idx === 0 ? 'A' : 'B'}</span>
                  <span class="option-text">{option}</span>
                </button>
              {/each}
            </div>

            <div class="skip-row">
              <button
                type="button"
                class="skip-btn skip-challenge-btn"
                data-testid="myth-skip-btn"
                onclick={handleSkip}
              >
                Skip straight to reality &rarr;
              </button>
            </div>
          </div>
        {:else}
          <!-- Refutation Banner -->
          {#if selectedOption !== null}
            <div
              class="refutation-banner"
              class:correct={selectedOption === myth.predictionPrompt.correctIndex}
              data-testid="refutation-banner"
            >
              <div class="banner-title-row">
                {#if selectedOption === myth.predictionPrompt.correctIndex}
                  <CheckCircle2 size={16} />
                  <strong>Spot on! You called the institutional bluff.</strong>
                {:else}
                  <HelpCircle size={16} />
                  <strong>A very common misconception!</strong>
                {/if}
              </div>
              <p class="refutation-text">{myth.predictionPrompt.refutation}</p>
            </div>
          {/if}

          <div class="reality-header">
            <span class="reality-tag">INSTITUTIONAL MECHANISM</span>
            <h3 class="reality-title">REALITY</h3>
            <p class="reality-summary">{myth.realitySummary}</p>
          </div>

          <!-- Flowchart & Character Scene -->
          <div class="scene-container">
            <div class="flowchart-box" aria-label="Flowchart: how it works in reality">
              <div class="flow-steps">
                {#each myth.flowSteps as step, i}
                  <div class="flow-node">
                    <div class="step-card">
                      <span class="step-num">{i + 1}</span>
                      <span class="step-name">{step}</span>
                    </div>
                    {#if i < myth.flowSteps.length - 1}
                      <div class="flow-arrow" aria-hidden="true">
                        <svg viewBox="0 0 24 16" width="20" height="14">
                          <line x1="2" y1="8" x2="16" y2="8" stroke="var(--ink)" stroke-width="2" />
                          <polygon points="15,4 22,8 15,12" fill="var(--ink)" />
                        </svg>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>

            <!-- Character Explainer -->
            <div class="character-wrapper" aria-hidden="true">
              <svg viewBox="0 0 120 240" width="80" height="140" preserveAspectRatio="xMidYMid meet">
                <Character look={analystLook} pose="point" prop="clipboard" />
              </svg>
            </div>
          </div>

          <!-- Real Levers Row with 1-Click Tactical Pivots (PIVOT-02) -->
          <div class="levers-section">
            <span class="levers-tag">TACTICAL PIVOT: REAL LEVERS AVAILABLE TO THE PRESIDENT</span>
            <div class="levers-list">
              {#if myth.realLeverActions && myth.realLeverActions.length > 0}
                {#each myth.realLeverActions as action}
                  <button
                    type="button"
                    class="lever-pivot-btn"
                    data-testid="lever-pivot-btn"
                    title={action.hint}
                    onclick={() => (onPivot ? onPivot(action) : onGotIt())}
                  >
                    <span>⚡ {action.label}</span>
                    <ArrowRight size={14} />
                  </button>
                {/each}
              {:else}
                {#each myth.realLevers as lever}
                  <span class="lever-pill">{lever}</span>
                {/each}
              {/if}
            </div>
          </div>

          <!-- Sourced Attribution -->
          <div class="source-row">
            <span class="source-label">Source:</span>
            {#if myth.citation.url}
              <a
                href={myth.citation.url}
                target="_blank"
                rel="noopener noreferrer"
                class="source-link"
              >
                {myth.citation.title}
                <ExternalLink size={12} />
              </a>
            {:else}
              <span class="source-title">{myth.citation.title}</span>
            {/if}
          </div>
        {/if}
      </section>
    </div>

    <!-- Modal Footer with Debunk and Spin Buttons -->
    <footer class="modal-footer">
      <button class="close-link" onclick={onClose}>
        Close
      </button>

      <div class="footer-actions">
        {#if isFirstView && onSpin}
          <button
            type="button"
            class="spin-btn"
            data-testid="spin-myth-btn"
            onclick={onSpin}
            title="Spin this populist myth on national television: gain short-term approval rally (+2%), but erode public trust (-1.5) and raise Evil Heat"
          >
            📺 SPIN THIS MYTH (+2% Approval, −Trust)
          </button>
        {/if}

        <button class="got-it-btn" onclick={onGotIt} data-testid="debunk-myth-btn">
          {#if isFirstView}DEBUNK MYTH (+5 CLOUT){:else}GOT IT{/if}
        </button>
      </div>
    </footer>
  </div>
</Overlay>

<style>
  .myth-modal-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .myth-grid {
    display: grid;
    grid-template-columns: 1fr 1.6fr;
    gap: 20px;
    align-items: stretch;
  }

  @media (max-width: 820px) {
    .myth-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Left: Myth Column */
  .myth-side {
    background: var(--paper);
    border: 2px solid var(--alert);
    border-radius: var(--r-sm);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 2px 2px 0 var(--alert);
  }

  .myth-stamp-container {
    display: flex;
    justify-content: flex-start;
  }

  .myth-stamp {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: var(--paper);
    border: 3px double var(--ink);
    border-radius: 4px;
    color: var(--ink);
    font-family: var(--font-ui);
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 0.12em;
    transform: rotate(-3deg);
    transition: all var(--dur-fast);
  }

  .myth-stamp.busted {
    background: var(--alert-tint);
    border-color: var(--alert);
    color: var(--alert);
  }

  @keyframes stampSlam {
    0% {
      transform: scale(2.2) rotate(-15deg);
      opacity: 0;
    }
    50% {
      transform: scale(0.95) rotate(-3deg);
      opacity: 1;
    }
    75% {
      transform: scale(1.05) rotate(-3deg);
    }
    100% {
      transform: scale(1) rotate(-3deg);
    }
  }

  .myth-stamp.slam {
    animation: stampSlam 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  .myth-tag {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--alert);
  }

  .myth-quote {
    font-family: var(--font-display);
    font-size: 22px;
    line-height: 1.25;
    color: var(--ink);
    margin: 0;
    font-weight: 700;
  }

  .myth-context-card {
    margin-top: auto;
    background: var(--card);
    border: 1px solid var(--ink);
    border-radius: 4px;
    padding: 10px;
    font-family: var(--font-body);
    font-size: 13px;
    line-height: 1.4;
    color: var(--ink-soft);
  }

  .myth-context-card p {
    margin: 0;
  }

  /* Right: Reality Column */
  .reality-side {
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    box-shadow: 3px 3px 0 var(--ink);
  }

  /* Challenge Step */
  .challenge-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 8px 0;
  }

  .challenge-tag {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--alert);
  }

  .challenge-question {
    font-family: var(--font-display);
    font-size: 22px;
    line-height: 1.25;
    color: var(--ink);
    margin: 4px 0 6px 0;
  }

  .challenge-lead {
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--ink-soft);
    margin: 0;
  }

  .options-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .pred-option-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    box-shadow: 2px 2px 0 var(--ink);
    cursor: pointer;
    text-align: left;
    transition: transform var(--dur-fast), background var(--dur-fast);
  }

  .pred-option-btn:hover {
    transform: translateY(-2px);
    background: var(--card);
  }

  .option-marker {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: var(--ink);
    color: var(--card);
    border-radius: 50%;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 900;
    flex-shrink: 0;
  }

  .option-text {
    font-family: var(--font-ui);
    font-size: 14px;
    font-weight: 700;
    color: var(--ink);
    line-height: 1.3;
  }

  .skip-row {
    display: flex;
    justify-content: flex-end;
  }

  .skip-btn {
    background: none;
    border: none;
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-soft);
    cursor: pointer;
    text-decoration: underline;
  }

  .skip-btn:hover {
    color: var(--ink);
  }

  /* Refutation Banner */
  .refutation-banner {
    background: var(--paper);
    border: 1.5px solid var(--ink);
    border-left: 6px solid var(--alert);
    border-radius: 4px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .refutation-banner.correct {
    border-left-color: var(--sage);
    background: var(--sage-tint);
  }

  .banner-title-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 700;
    color: var(--ink);
  }

  .refutation-text {
    font-family: var(--font-body);
    font-size: 13px;
    line-height: 1.35;
    color: var(--ink);
    margin: 0;
  }

  .reality-tag {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--sage-dark);
  }

  .reality-title {
    font-family: var(--font-display);
    font-size: 24px;
    color: var(--ink);
    margin: 2px 0 6px 0;
    line-height: 1.1;
  }

  .reality-summary {
    font-family: var(--font-body);
    font-size: 14px;
    line-height: 1.4;
    color: var(--ink);
    margin: 0;
  }

  /* Scene & Flowchart */
  .scene-container {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 12px;
  }

  .flowchart-box {
    flex: 1;
    min-width: 0;
  }

  .flow-steps {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .flow-node {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .step-card {
    background: var(--card);
    border: 1.5px solid var(--ink);
    border-radius: 4px;
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    box-shadow: 1px 1px 0 var(--ink);
  }

  .step-num {
    font-family: var(--font-ui);
    font-size: 10px;
    font-weight: 700;
    color: var(--ink-soft);
  }

  .step-name {
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 700;
    color: var(--ink);
    white-space: nowrap;
  }

  .flow-arrow {
    display: flex;
    align-items: center;
  }

  .character-wrapper {
    flex-shrink: 0;
    display: flex;
    align-items: flex-end;
  }

  /* Real Levers & Tactical Pivot Buttons (PIVOT-02) */
  .levers-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .levers-tag {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--ink-soft);
  }

  .levers-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .lever-pivot-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 700;
    background: var(--sage-tint);
    color: var(--sage-dark);
    border: 1.5px solid var(--sage);
    border-radius: 4px;
    padding: 6px 10px;
    cursor: pointer;
    box-shadow: 1px 1px 0 var(--sage);
    transition: transform var(--dur-fast), filter var(--dur-fast);
  }

  .lever-pivot-btn:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
  }

  .lever-pill {
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 700;
    background: var(--sage-tint);
    color: var(--sage-dark);
    border: 1px solid var(--sage);
    border-radius: 4px;
    padding: 4px 8px;
  }

  /* Sources */
  .source-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-ui);
    font-size: 11px;
    color: var(--ink-soft);
    margin-top: auto;
  }

  .source-label {
    font-weight: 700;
  }

  .source-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink);
    text-decoration: underline;
    font-weight: 600;
  }

  /* Modal Footer */
  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 2px solid var(--ink);
  }

  .close-link {
    background: none;
    border: none;
    font-family: var(--font-ui);
    font-size: 14px;
    font-weight: 700;
    color: var(--ink-soft);
    cursor: pointer;
    text-decoration: underline;
  }

  .close-link:hover {
    color: var(--ink);
  }

  .footer-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .spin-btn {
    padding: 10px 18px;
    font-family: var(--font-ui);
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.04em;
    background: var(--alert-dark);
    color: var(--card);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    box-shadow: 2px 2px 0 var(--ink);
    cursor: pointer;
    transition: transform var(--dur-fast), filter var(--dur-fast);
  }

  :global([data-theme="evil"]) .spin-btn {
    color: var(--ink);
  }

  .spin-btn:hover {
    transform: translateY(-2px);
    filter: brightness(1.15);
  }

  .spin-btn:active {
    transform: translateY(1px);
    box-shadow: 1px 1px 0 var(--ink);
  }

  .got-it-btn {
    padding: 10px 24px;
    font-family: var(--font-ui);
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: var(--alert);
    color: var(--card);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    box-shadow: 2px 2px 0 var(--ink);
    cursor: pointer;
    transition: transform var(--dur-fast), filter var(--dur-fast);
  }

  .got-it-btn:hover {
    transform: translateY(-2px);
    filter: brightness(1.06);
  }
</style>
