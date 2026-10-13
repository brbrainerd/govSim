<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import {
    REFORMS_CATALOG,
    type JudicialReformId,
  } from '../engine/reforms';
  import Overlay from './Overlay.svelte';

  let {
    session,
    onClose,
  }: {
    session: Session;
    onClose: () => void;
  } = $props();

  const activeReforms = $derived(session.current.activeReforms ?? []);
  const draftedReform = $derived(session.draft.reform);
  const composition = $derived(session.current.courtComposition ?? { conservative: 6, liberal: 3 });

  const judicialReformIds: JudicialReformId[] = [
    'scotus_term_limits',
    'statutory_ethics_code',
    'court_expansion',
  ];

  function handleEnact(id: JudicialReformId) {
    session.enactReform(id);
  }
</script>

<Overlay title="Supreme Court & Judicial Reform" {onClose}>
  <div class="judicial-modal" data-testid="judicial-reform-modal">
    <header class="modal-header">
      <div class="header-titles">
        <h2 class="modal-title">Supreme Court &amp; Judicial Reform</h2>
        <span class="modal-subtitle">
          Current Bench: {composition.conservative} Conservative · {composition.liberal} Liberal ({composition.conservative + composition.liberal} Total)
        </span>
      </div>
      <button type="button" class="close-x" onclick={onClose} aria-label="Close dialog">✕</button>
    </header>

    <div class="reforms-grid">
      {#each judicialReformIds as rId (rId)}
        {@const r = REFORMS_CATALOG[rId]}
        {@const isEnacted = activeReforms.includes(rId)}
        {@const isDrafted = draftedReform === rId}
        {@const canAfford = session.clout >= r.cloutCost}

        <div
          class="reform-card"
          class:enacted={isEnacted}
          class:drafted={isDrafted}
          data-testid="judicial-card-{rId}"
        >
          <div class="card-header">
            <h3 class="reform-title">{r.name}</h3>
            {#if isEnacted}
              <span class="status-badge enacted">Enacted Law</span>
            {:else if isDrafted}
              <span class="status-badge staged">Staged for Next Turn</span>
            {/if}
          </div>

          <p class="reform-desc">{r.description}</p>

          <div class="impact-box">
            <b>Civics &amp; Legal Tradeoffs:</b>
            <span>{r.summary}</span>
          </div>

          <div class="cost-row">
            <span>Clout Investment:</span>
            <b>{r.cloutCost} Clout</b>
          </div>

          <div class="actions">
            {#if isEnacted}
              <button type="button" class="btn disabled-btn" disabled>Enacted</button>
            {:else if isDrafted}
              <button type="button" class="btn drafted-btn" disabled>Staged for Next Turn</button>
            {:else}
              <button
                type="button"
                class="btn enact-btn"
                disabled={!canAfford}
                onclick={() => handleEnact(rId)}
              >
                Enact Reform ({r.cloutCost} Clout)
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <footer class="modal-footer">
      <div class="clout-indicator">
        Available Clout: <b>{session.clout}</b>
      </div>
      <button type="button" class="btn close-btn" onclick={onClose}>Done</button>
    </footer>
  </div>
</Overlay>

<style>
  .judicial-modal {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    max-width: 700px;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    border-bottom: 2px solid var(--paper-dark);
    padding-bottom: 12px;
  }
  .header-titles {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .modal-title {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--ink);
    margin: 0;
  }
  .modal-subtitle {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    color: var(--ink-soft);
  }
  .close-x {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--ink-soft);
    padding: 4px 8px;
  }
  .close-x:hover {
    color: var(--ink);
  }
  .reforms-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
    gap: 12px;
  }
  .reform-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
    padding: 12px;
    border: 2px solid var(--paper-dark);
    border-radius: var(--r-md);
    background: var(--card);
  }
  .reform-card.enacted {
    border-color: var(--sage);
    background: var(--paper-dark);
  }
  .reform-card.drafted {
    border-color: var(--gold);
    box-shadow: 0 0 0 1px var(--gold);
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .reform-title {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--ink);
    margin: 0;
  }
  .status-badge {
    font-family: var(--font-condensed);
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    padding: 1px 6px;
    border-radius: var(--r-sm);
  }
  .status-badge.enacted {
    background: var(--sage-dark);
    color: var(--card);
  }
  .status-badge.staged {
    background: var(--gold);
    color: var(--ink);
  }
  .reform-desc {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    color: var(--ink-soft);
    margin: 0;
    line-height: 1.35;
    flex-grow: 1;
  }
  .impact-box {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px 8px;
    background: var(--paper-dark);
    border-radius: var(--r-sm);
    font-size: 11px;
    color: var(--ink);
  }
  .cost-row {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--ink-soft);
  }
  .actions .btn {
    width: 100%;
    padding: 6px 12px;
    font-size: var(--text-xs);
  }
  .disabled-btn {
    opacity: 0.6;
    cursor: default;
  }
  .drafted-btn {
    background: var(--gold);
    color: var(--ink);
    opacity: 0.85;
    cursor: default;
  }
  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 2px solid var(--paper-dark);
    padding-top: 12px;
  }
  .clout-indicator {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--ink);
  }
  .close-btn {
    padding: 6px 16px;
  }
</style>
