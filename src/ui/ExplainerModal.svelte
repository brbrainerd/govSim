<script lang="ts">
  import { BookOpen, ExternalLink } from '@lucide/svelte';
  import type { CivicExplainer } from '../content/explainers';
  import Character, { type Look } from './art/Character.svelte';
  import Overlay from './Overlay.svelte';

  let {
    explainer,
    isFirstView = false,
    onClose,
    onGotIt,
  }: {
    explainer: CivicExplainer;
    isFirstView?: boolean;
    onClose: () => void;
    onGotIt: () => void;
  } = $props();

  const guideLook: Look = {
    skin: 'skin-3',
    hair: 'hair-2',
    hairStyle: 'bun',
    suit: 'navy',
    tie: 'gold',
    glasses: true,
  };
</script>

<Overlay title="Civic Guide: {explainer.title}" {onClose}>
  <div class="explainer-modal-content" data-testid="explainer-modal">
    <section class="explainer-card" aria-label={explainer.title}>
      <div class="explainer-header">
        <div class="badge-row">
          <span class="guide-badge">
            <BookOpen size={16} aria-hidden="true" />
            <span>HOW IT WORKS</span>
          </span>
          <span class="explainer-tag">{explainer.tag}</span>
        </div>
        <h3 class="explainer-title">{explainer.title}</h3>
        <p class="explainer-summary">{explainer.summary}</p>
      </div>

      <div class="scene-container">
        <div class="flowchart-box" aria-label="Step-by-step civic process">
          <div class="flow-steps">
            {#each explainer.flowSteps as step, i}
              <div class="flow-node">
                <div class="step-card">
                  <span class="step-num">STEP {i + 1}</span>
                  <span class="step-name">{step}</span>
                </div>
                {#if i < explainer.flowSteps.length - 1}
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

        <div class="character-wrapper" aria-hidden="true">
          <svg viewBox="0 0 120 240" width="76" height="132" preserveAspectRatio="xMidYMid meet">
            <Character look={guideLook} pose="point" prop="clipboard" />
          </svg>
        </div>
      </div>

      <div class="takeaways-section">
        <span class="takeaways-tag">KEY CIVIC TAKEAWAYS</span>
        <ul class="takeaways-list">
          {#each explainer.takeaways as item}
            <li>{item}</li>
          {/each}
        </ul>
      </div>

      <div class="source-row">
        <span class="source-label">Source:</span>
        {#if explainer.citation.url}
          <a
            href={explainer.citation.url}
            target="_blank"
            rel="noopener noreferrer"
            class="source-link"
          >
            {explainer.citation.title}
            <ExternalLink size={12} />
          </a>
        {:else}
          <span class="source-title">{explainer.citation.title}</span>
        {/if}
      </div>
    </section>

    <footer class="modal-footer">
      <button type="button" class="close-link" onclick={onClose}>
        Close
      </button>

      <button
        type="button"
        class="got-it-btn"
        data-testid="explainer-got-it-btn"
        onclick={onGotIt}
      >
        GOT IT {#if isFirstView}(+1 CLOUT){/if}
      </button>
    </footer>
  </div>
</Overlay>

<style>
  .explainer-modal-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .explainer-card {
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    box-shadow: 3px 3px 0 var(--ink);
  }

  .badge-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }

  .guide-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: var(--sage-tint);
    border: 2px solid var(--sage-dark);
    border-radius: 4px;
    color: var(--sage-dark);
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  .explainer-tag {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--ink-soft);
  }

  .explainer-title {
    font-family: var(--font-display);
    font-size: 24px;
    color: var(--ink);
    margin: 4px 0 6px 0;
    line-height: 1.15;
  }

  .explainer-summary {
    font-family: var(--font-body);
    font-size: 15px;
    line-height: 1.4;
    color: var(--ink);
    margin: 0;
  }

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
    padding: 6px 10px;
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
    font-size: 13px;
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

  .takeaways-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .takeaways-tag {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--ink-soft);
  }

  .takeaways-list {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-family: var(--font-body);
    font-size: 14px;
    line-height: 1.35;
    color: var(--ink);
  }

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

  .got-it-btn {
    padding: 10px 24px;
    font-family: var(--font-ui);
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: var(--gold);
    color: var(--ink);
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
