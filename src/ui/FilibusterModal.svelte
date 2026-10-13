<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import {
    FILIBUSTER_RULES_CATALOG,
    type FilibusterRule,
  } from '../engine/congress';
  import Overlay from './Overlay.svelte';

  let {
    session,
    onClose,
  }: {
    session: Session;
    onClose: () => void;
  } = $props();

  const currentRule = $derived(session.current.filibusterRule ?? 'sixty_vote');
  const draftedRule = $derived(session.draft.filibusterRule ?? currentRule);

  const rulesList: FilibusterRule[] = [
    'sixty_vote',
    'talking_filibuster',
    'fifty_five_vote',
    'simple_majority',
  ];

  function handleSelect(rule: FilibusterRule) {
    session.setFilibusterRule(rule);
  }
</script>

<Overlay title="Senate Filibuster & Cloture Rules" {onClose}>
  <div class="filibuster-modal" data-testid="filibuster-modal">
    <header class="modal-header">
      <div class="header-titles">
        <h2 class="modal-title">Senate Filibuster &amp; Cloture Rules</h2>
        <span class="modal-subtitle">Reform Senate rules to adjust legislative cloture hurdles and bipartisan requirements</span>
      </div>
      <button type="button" class="close-x" onclick={onClose} aria-label="Close dialog">✕</button>
    </header>

    <div class="rules-grid">
      {#each rulesList as ruleId (ruleId)}
        {@const r = FILIBUSTER_RULES_CATALOG[ruleId]}
        {@const isActive = currentRule === ruleId}
        {@const isDrafted = draftedRule === ruleId}
        {@const canAfford = session.clout >= r.cloutCost || isDrafted}

        <div
          class="rule-card"
          class:active={isActive}
          class:drafted={isDrafted}
          data-testid="filibuster-rule-{ruleId}"
        >
          <div class="card-top">
            <div class="title-row">
              <h3 class="rule-name">{r.name}</h3>
              <span class="threshold-pill">{r.threshold} Votes</span>
            </div>
            {#if isActive}
              <span class="status-badge current">Current Law</span>
            {:else if isDrafted}
              <span class="status-badge staged">Pending Next Turn</span>
            {/if}
          </div>

          <p class="rule-desc">{r.description}</p>

          <div class="cost-row">
            <span class="cost-label">Clout Cost:</span>
            <span class="cost-val">{r.cloutCost} Clout</span>
          </div>

          <div class="actions">
            {#if isDrafted}
              <button
                type="button"
                class="btn current-btn"
                disabled
              >
                {isActive ? 'Active Rule' : 'Staged for Next Turn'}
              </button>
            {:else}
              <button
                type="button"
                class="btn select-btn"
                disabled={!canAfford}
                onclick={() => handleSelect(ruleId)}
              >
                {r.cloutCost > 0 ? `Enact (${r.cloutCost} Clout)` : 'Restore Rule'}
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
  .filibuster-modal {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    max-width: 680px;
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
  .rules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 12px;
  }
  .rule-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
    padding: 12px;
    border: 2px solid var(--paper-dark);
    border-radius: var(--r-md);
    background: var(--card);
  }
  .rule-card.active {
    border-color: var(--ink);
    background: var(--paper-dark);
  }
  .rule-card.drafted {
    border-color: var(--gold);
    box-shadow: 0 0 0 1px var(--gold);
  }
  .card-top {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .rule-name {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--ink);
    margin: 0;
  }
  .threshold-pill {
    font-family: var(--font-condensed);
    font-size: var(--text-xs);
    font-weight: 700;
    padding: 2px 6px;
    border-radius: var(--r-sm);
    background: var(--ink);
    color: var(--card);
  }
  .status-badge {
    align-self: flex-start;
    font-family: var(--font-condensed);
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 1px 6px;
    border-radius: var(--r-sm);
  }
  .status-badge.current {
    background: var(--sage-dark);
    color: var(--card);
  }
  .status-badge.staged {
    background: var(--gold);
    color: var(--ink);
  }
  .rule-desc {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    color: var(--ink-soft);
    margin: 0;
    line-height: 1.35;
    flex-grow: 1;
  }
  .cost-row {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--ink-soft);
  }
  .cost-val {
    font-weight: 700;
    color: var(--ink);
  }
  .actions {
    margin-top: 4px;
  }
  .actions .btn {
    width: 100%;
    padding: 6px 12px;
    font-size: var(--text-xs);
  }
  .current-btn {
    opacity: 0.65;
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
