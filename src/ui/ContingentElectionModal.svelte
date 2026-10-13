<script lang="ts">
  import type { ContingentElectionResult } from '../engine/election';
  import Overlay from './Overlay.svelte';

  let {
    contingentResult,
    onClose,
  }: {
    contingentResult: ContingentElectionResult;
    onClose: () => void;
  } = $props();

  const isWon = $derived(contingentResult.winner === 'player');
</script>

<Overlay title="12th Amendment House Contingent Election" {onClose}>
  <div class="contingent-shell" data-testid="contingent-election-modal">
    <div class="crisis-header">
      <span class="crisis-badge">CONSTITUTIONAL PROCEDURE</span>
      <h2 class="crisis-title">12th Amendment House Contingent Election</h2>
      <p class="crisis-desc">
        With neither candidate reaching 270 electoral votes (269–269 tie), the election moved to the House of Representatives. Under the 12th Amendment, each state delegation casts exactly <strong>one vote</strong> (26 states required to elect; the District of Columbia has 0 votes).
      </p>
    </div>

    <!-- Tally Progress Bar -->
    <div class="tally-section">
      <div class="tally-metrics">
        <span class="tally-stat you">You: {contingentResult.playerStates} States</span>
        <span class="target-marker">26 TO WIN</span>
        <span class="tally-stat them">Opponent: {contingentResult.opponentStates} States</span>
      </div>
      <div class="state-bar" role="progressbar" aria-valuenow={contingentResult.playerStates} aria-valuemin={0} aria-valuemax={50}>
        <div class="bar-seg you" style="width: {(contingentResult.playerStates / 50) * 100}%"></div>
        <div class="bar-seg split" style="width: {(contingentResult.splitStates / 50) * 100}%"></div>
        <div class="bar-seg them" style="width: {(contingentResult.opponentStates / 50) * 100}%"></div>
      </div>
      <div class="split-info">
        <span>{contingentResult.splitStates} split / uncommitted delegations</span>
        <span class="outcome-pill {isWon ? 'won' : 'lost'}">
          Outcome: {isWon ? 'Elected by the House' : 'Opponent Elected by the House'}
        </span>
      </div>
    </div>

    <!-- 50 States Roll Call List -->
    <div class="delegations-container">
      <h3 class="delegations-title">STATE DELEGATION ROLL CALL (50 STATES)</h3>
      <div class="delegations-grid">
        {#each contingentResult.rollCall as stateVote}
          <div class="state-chip {stateVote.winner}">
            <div class="chip-top">
              <span class="chip-code">{stateVote.stateCode}</span>
              <span class="chip-vote">{stateVote.vote}</span>
            </div>
            <div class="chip-seats">
              {stateVote.democratSeats}D · {stateVote.republicanSeats}R
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="modal-footer">
      <button class="return-btn" onclick={onClose} data-testid="contingent-close-btn">
        Return to Election Night Results →
      </button>
    </div>
  </div>
</Overlay>

<style>
  .contingent-shell {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .crisis-header {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .crisis-badge {
    align-self: flex-start;
    padding: 4px 8px;
    background: var(--alert);
    color: var(--paper);
    font-family: var(--font-condensed);
    font-size: 11px;
    font-weight: bold;
    border-radius: var(--r-sm);
    letter-spacing: 0.08em;
  }

  .crisis-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: 22px;
    color: var(--ink);
  }

  .crisis-desc {
    margin: 0;
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--ink-soft);
    line-height: 1.4;
  }

  .tally-section {
    background: var(--paper);
    border: 1px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .tally-metrics {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--font-ui);
    font-weight: bold;
    font-size: 13px;
  }

  .tally-stat.you {
    color: var(--sage);
  }

  .tally-stat.them {
    color: var(--alert);
  }

  .target-marker {
    background: var(--gold);
    color: var(--ink);
    padding: 2px 8px;
    border-radius: var(--r-sm);
    font-family: var(--font-condensed);
    font-size: 11px;
    border: 1px solid var(--ink);
  }

  .state-bar {
    height: 16px;
    background: var(--card-alt);
    border: 1px solid var(--ink);
    border-radius: var(--r-sm);
    display: flex;
    overflow: hidden;
  }

  .bar-seg.you {
    background: var(--sage);
  }

  .bar-seg.split {
    background: var(--gold);
  }

  .bar-seg.them {
    background: var(--alert);
  }

  .split-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--font-body);
    font-size: 12px;
    color: var(--ink-soft);
  }

  .outcome-pill {
    font-family: var(--font-ui);
    font-weight: bold;
    padding: 2px 8px;
    border-radius: var(--r-sm);
  }

  .outcome-pill.won {
    background: var(--sage);
    color: var(--paper);
  }

  .outcome-pill.lost {
    background: var(--alert);
    color: var(--paper);
  }

  .delegations-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .delegations-title {
    margin: 0;
    font-family: var(--font-condensed);
    font-size: 11px;
    font-weight: bold;
    color: var(--ink-soft);
    letter-spacing: 0.05em;
  }

  .delegations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
    gap: 6px;
    max-height: 220px;
    overflow-y: auto;
    padding: 4px;
    border: 1px solid var(--ink);
    border-radius: var(--r-sm);
    background: var(--paper);
  }

  .state-chip {
    padding: 4px 6px;
    border: 1px solid var(--ink);
    border-radius: var(--r-sm);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .state-chip.player {
    background: var(--sage);
    color: var(--paper);
  }

  .state-chip.opponent {
    background: var(--alert);
    color: var(--paper);
  }

  .state-chip.split {
    background: var(--card-alt);
    color: var(--ink);
  }

  .chip-top {
    display: flex;
    justify-content: space-between;
    width: 100%;
    font-family: var(--font-ui);
    font-weight: bold;
    font-size: 11px;
  }

  .chip-seats {
    font-family: var(--font-condensed);
    font-size: 9px;
    opacity: 0.85;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
  }

  .return-btn {
    padding: 10px 18px;
    background: var(--ink);
    color: var(--paper);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 2px 2px 0 var(--ink);
    transition: transform 0.1s ease;
  }

  .return-btn:hover {
    transform: translate(-1px, -1px);
  }
</style>
