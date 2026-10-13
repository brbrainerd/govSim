<script lang="ts">
  import { AlertTriangle, CheckCircle, Landmark } from '@lucide/svelte';
  import type { Session } from '../app/session.svelte';
  import { EVIL_LEVERS_CATALOG, type EvilLever } from '../data/evil';

  let { session }: { session: Session } = $props();

  const siphons = EVIL_LEVERS_CATALOG.filter((l) => l.category === 'siphon');
  const suppressions = EVIL_LEVERS_CATALOG.filter((l) => l.category === 'suppression');
</script>

<section class="evil-levers-section" aria-label="Corrupt Executive Levers & Cronyism" data-testid="evil-levers-section">
  <div class="evil-header">
    <div class="evil-titles">
      <span class="evil-tag">SATIRICAL KLEPTOCRACY · EXECUTIVE CRONYISM</span>
      <h3 class="evil-title">Corrupt Executive Directives</h3>
      <p class="evil-subtitle">
        Siphon public funds into your offshore accounts or crush independent watchdogs before the Special Counsel strikes.
      </p>
    </div>

    <div class="evil-summary" data-testid="evil-levers-summary">
      <div class="summary-pill">
        <span class="pill-label">Staged</span>
        <span class="pill-val" data-testid="evil-staged-count">{session.stagedEvilLeversCount}</span>
      </div>
      <div class="summary-pill">
        <span class="pill-label">Clout Cost</span>
        <span class="pill-val" data-testid="evil-staged-cost">{session.evilLeversCost}</span>
      </div>
      <div class="summary-pill">
        <span class="pill-label">Net Siphon</span>
        <span class="pill-val highlight-gold" data-testid="evil-staged-kickback">+${session.stagedEvilLeversKickbackBn.toFixed(1)}B</span>
      </div>
      <div class="summary-pill">
        <span class="pill-label">Net Heat</span>
        <span
          class="pill-val"
          class:highlight-red={session.stagedEvilLeversHeatDelta > 0}
          class:highlight-green={session.stagedEvilLeversHeatDelta < 0}
          data-testid="evil-staged-heat"
        >
          {session.stagedEvilLeversHeatDelta >= 0 ? '+' : ''}{session.stagedEvilLeversHeatDelta.toFixed(0)}
        </span>
      </div>
    </div>
  </div>

  <div class="lever-groups">
    <!-- Group 1: Kleptocratic Siphoning (LEVER-01, LEVER-02) -->
    <div class="group-container">
      <h4 class="group-heading">
        <Landmark size={18} aria-hidden="true" />
        Kleptocratic Siphoning &amp; Crony Enrichment
      </h4>
      <div class="lever-grid">
        {#each siphons as lever (lever.id)}
          {@const isStaged = session.isEvilLeverStaged(lever.id)}
          {@const canAfford = isStaged || session.clout >= lever.cloutCost}
          <div
            class="lever-card"
            class:staged={isStaged}
            class:unaffordable={!canAfford}
            data-testid={`evil-lever-card-${lever.id}`}
          >
            <div class="lever-top">
              <span class="lever-name">{lever.name}</span>
              <span class="cost-badge">{lever.cloutCost} Clout</span>
            </div>

            <p class="flavor-quote">{lever.flavorQuote}</p>
            <p class="lever-desc">{lever.description}</p>

            <div class="metrics-bar">
              <span class="metric kickback">+${lever.kickbackBn.toFixed(1)}B Stash</span>
              <span class="metric heat">+{lever.heatDelta} Heat</span>
              <span class="metric fallout">-{lever.trustPenalty} Trust · -{lever.approvalPenalty}% Appr</span>
            </div>

            <button
              type="button"
              class="action-btn"
              class:staged-btn={isStaged}
              disabled={!canAfford}
              onclick={() => session.toggleEvilLever(lever.id)}
              data-testid={`evil-lever-toggle-${lever.id}`}
              aria-pressed={isStaged}
            >
              {#if isStaged}
                <CheckCircle size={16} aria-hidden="true" />
                Directive Staged (Click to Cancel)
              {:else if canAfford}
                Issue Directive
              {:else}
                Insufficient Clout ({lever.cloutCost})
              {/if}
            </button>
          </div>
        {/each}
      </div>
    </div>

    <!-- Group 2: Oversight Suppression (LEVER-03) -->
    <div class="group-container">
      <h4 class="group-heading">
        <AlertTriangle size={18} aria-hidden="true" />
        Watchdog Purges &amp; Subpoena Suppression
      </h4>
      <div class="lever-grid">
        {#each suppressions as lever (lever.id)}
          {@const isStaged = session.isEvilLeverStaged(lever.id)}
          {@const canAfford = isStaged || session.clout >= lever.cloutCost}
          <div
            class="lever-card suppression-card"
            class:staged={isStaged}
            class:unaffordable={!canAfford}
            data-testid={`evil-lever-card-${lever.id}`}
          >
            <div class="lever-top">
              <span class="lever-name">{lever.name}</span>
              <span class="cost-badge">{lever.cloutCost} Clout</span>
            </div>

            <p class="flavor-quote">{lever.flavorQuote}</p>
            <p class="lever-desc">{lever.description}</p>

            <div class="metrics-bar">
              <span class="metric suppression">{lever.heatDelta} Heat (Cooling)</span>
              <span class="metric fallout">-{lever.trustPenalty} Trust · -{lever.approvalPenalty}% Appr</span>
            </div>

            <button
              type="button"
              class="action-btn"
              class:staged-btn={isStaged}
              disabled={!canAfford}
              onclick={() => session.toggleEvilLever(lever.id)}
              data-testid={`evil-lever-toggle-${lever.id}`}
              aria-pressed={isStaged}
            >
              {#if isStaged}
                <CheckCircle size={16} aria-hidden="true" />
                Suppression Staged (Click to Cancel)
              {:else if canAfford}
                Purge Watchdogs
              {:else}
                Insufficient Clout ({lever.cloutCost})
              {/if}
            </button>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<style>
  .evil-levers-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    background: var(--card);
    border: var(--rule) solid var(--alert);
    border-radius: var(--r-md);
    box-shadow: var(--shadow);
  }

  .evil-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
    border-bottom: 1.5px solid var(--alert);
    padding-bottom: 1rem;
  }

  .evil-tag {
    display: inline-block;
    font-family: var(--font-ui);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--alert);
    text-transform: uppercase;
  }

  .evil-title {
    margin: 0.25rem 0 0.25rem 0;
    font-family: var(--font-display);
    font-size: 1.35rem;
    color: var(--ink);
    letter-spacing: -0.01em;
  }

  .evil-subtitle {
    margin: 0;
    font-family: var(--font-body);
    font-size: 0.9rem;
    color: var(--ink-soft);
    max-width: 600px;
  }

  .evil-summary {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .summary-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.4rem 0.75rem;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: var(--r-sm);
    min-width: 70px;
  }

  .pill-label {
    font-family: var(--font-ui);
    font-size: 0.7rem;
    text-transform: uppercase;
    color: var(--ink-soft);
    font-weight: 700;
  }

  .pill-val {
    font-family: var(--font-ui);
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--ink);
  }

  .highlight-gold {
    color: var(--gold-dark);
  }

  .highlight-red {
    color: var(--alert);
  }

  .highlight-green {
    color: var(--sage-dark);
  }

  .lever-groups {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .group-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .group-heading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-family: var(--font-ui);
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .lever-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: 1rem;
  }

  .lever-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 1rem;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: var(--r-sm);
    transition: transform var(--dur-fast), border-color var(--dur-fast);
  }

  .lever-card.staged {
    border-color: var(--alert);
    border-width: 2.5px;
    background: var(--card);
  }

  .lever-card.unaffordable {
    opacity: 0.65;
  }

  .lever-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
  }

  .lever-name {
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1.25;
  }

  .cost-badge {
    display: inline-block;
    padding: 0.15rem 0.45rem;
    font-family: var(--font-ui);
    font-size: 0.75rem;
    font-weight: 700;
    background: var(--ink);
    color: var(--paper);
    border-radius: var(--r-sm);
    white-space: nowrap;
  }

  .flavor-quote {
    margin: 0 0 0.5rem 0;
    font-family: var(--font-body);
    font-size: 0.8rem;
    font-style: italic;
    color: var(--ink-soft);
    line-height: 1.3;
  }

  .lever-desc {
    margin: 0 0 0.75rem 0;
    font-family: var(--font-body);
    font-size: 0.85rem;
    color: var(--ink);
    line-height: 1.35;
    flex-grow: 1;
  }

  .metrics-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.75rem;
  }

  .metric {
    display: inline-block;
    padding: 0.2rem 0.45rem;
    font-family: var(--font-ui);
    font-size: 0.75rem;
    font-weight: 700;
    border-radius: var(--r-sm);
  }

  .metric.kickback {
    background: var(--ink);
    color: var(--gold);
    border: 1px solid var(--gold);
  }

  .metric.heat {
    background: var(--paper);
    color: var(--alert);
    border: 1px solid var(--alert);
  }

  .metric.suppression {
    background: var(--paper);
    color: var(--sage-dark);
    border: 1px solid var(--sage-dark);
  }

  .metric.fallout {
    background: var(--paper);
    color: var(--ink-soft);
    border: 1px solid var(--ink-soft);
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    width: 100%;
    padding: 0.5rem;
    font-family: var(--font-ui);
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: var(--ink);
    color: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: var(--r-sm);
    cursor: pointer;
    transition: background var(--dur-fast), transform var(--dur-fast);
  }

  .action-btn:hover:not(:disabled) {
    background: var(--alert-dark);
    border-color: var(--alert-dark);
  }

  .action-btn:disabled {
    cursor: not-allowed;
    background: var(--paper);
    color: var(--ink-soft);
    border-color: var(--ink-soft);
  }

  .action-btn.staged-btn {
    background: var(--alert);
    border-color: var(--alert);
    color: var(--paper);
  }

  .action-btn.staged-btn:hover {
    background: var(--alert-dark);
    border-color: var(--alert-dark);
  }
</style>
