<script lang="ts">
  import type { ElectionOutcome } from '../engine/election';

  let {
    outcome,
    autopilotOutcome,
    reasons,
    oncontinue,
    onretry,
    onviewcontingent,
  }: {
    outcome: ElectionOutcome;
    autopilotOutcome: ElectionOutcome;
    reasons: readonly string[];
    oncontinue: () => void;
    onretry: () => void;
    onviewcontingent?: () => void;
  } = $props();

  const isWon = $derived(outcome.winner === 'player');
</script>

<div class="result-card" data-testid="election-result-card">
  <div class="header-strip {isWon ? 'won' : 'lost'}">
    <span class="decision-tag cert-title">OFFICIAL CERTIFIED RESULT</span>
    <h3 class="result-title">
      {isWon ? 'REELECTED TO A SECOND TERM' : 'DEFEATED FOR REELECTION'}
    </h3>
  </div>

  <div class="tally-box">
    <div class="tally-col you">
      <span class="col-lbl">You</span>
      <span class="col-num">{outcome.playerEV}</span>
      <span class="col-unit">Electoral Votes</span>
    </div>
    <div class="tally-vs">
      <span class="vs-text">270 to win</span>
      {#if outcome.isTie}
        <span class="tie-badge">269–269 TIE</span>
      {/if}
    </div>
    <div class="tally-col them">
      <span class="col-lbl">Opponent</span>
      <span class="col-num">{outcome.opponentEV}</span>
      <span class="col-unit">Electoral Votes</span>
    </div>
  </div>

  <!-- Autopilot Comparison Pill -->
  <div class="autopilot-pill autopilot-comparison">
    <span class="auto-lbl">Autopilot (Doing Nothing):</span>
    <span class="auto-val">
      {autopilotOutcome.playerEV} EV · {autopilotOutcome.winner === 'player' ? 'Won Reelection' : 'Lost Reelection'}
    </span>
  </div>

  <!-- Contingent Election callout if applicable -->
  {#if outcome.isTie && outcome.contingentResult}
    <div class="contingent-callout">
      <div class="contingent-text">
        <strong>12th Amendment House Vote:</strong> {outcome.contingentResult.playerStates} states You, {outcome.contingentResult.opponentStates} states Opponent (26 needed)
      </div>
      {#if onviewcontingent}
        <button class="contingent-btn" onclick={onviewcontingent}>
          View Roll Call Breakdown →
        </button>
      {/if}
    </div>
  {/if}

  <!-- Attribution reasons -->
  <div class="reasons-section">
    <h4 class="reasons-heading reasons-title">WHY THE ELECTION TURNED OUT THIS WAY</h4>
    <ul class="reasons-list">
      {#each reasons as reason}
        <li class="reason-item">{reason}</li>
      {/each}
    </ul>
  </div>

  <!-- Actions -->
  <div class="actions-row">
    <button class="retry-btn" onclick={onretry} data-testid="retry-turn16-btn">
      ↺ Retry Turn 16
    </button>
    <button class="stamp-btn {isWon ? 'primary' : 'danger'}" onclick={oncontinue} data-testid="election-continue-btn">
      {isWon ? 'CONTINUE TO SECOND TERM →' : 'VIEW PRESIDENTIAL LEGACY →'}
    </button>
  </div>
</div>

<style>
  .result-card {
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: var(--r-md);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-shadow: 2px 2px 0 var(--ink);
  }

  .header-strip {
    padding: 12px 16px;
    border-radius: var(--r-sm);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .header-strip.won {
    background: var(--sage);
    color: var(--paper);
  }

  .header-strip.lost {
    background: var(--alert);
    color: var(--paper);
  }

  .decision-tag {
    font-family: var(--font-condensed);
    font-size: 12px;
    font-weight: bold;
    letter-spacing: 0.1em;
  }

  .result-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 0.02em;
  }

  .tally-box {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    background: var(--paper);
    border: 1px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 14px 16px;
  }

  .tally-col {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tally-col.you {
    text-align: left;
  }

  .tally-col.them {
    text-align: right;
  }

  .col-lbl {
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .col-num {
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: bold;
    line-height: 1;
    color: var(--ink);
  }

  .col-unit {
    font-family: var(--font-body);
    font-size: 11px;
    color: var(--ink-soft);
  }

  .tally-vs {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 0 12px;
  }

  .vs-text {
    font-family: var(--font-condensed);
    font-size: 11px;
    font-weight: bold;
    color: var(--ink-soft);
    text-transform: uppercase;
  }

  .tie-badge {
    background: var(--alert);
    color: var(--paper);
    font-family: var(--font-condensed);
    font-size: 10px;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: var(--r-sm);
  }

  .autopilot-pill {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--card-alt);
    border: 1px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 8px 12px;
    font-size: 12px;
    color: var(--ink);
  }

  .auto-lbl {
    font-family: var(--font-ui);
    font-weight: bold;
  }

  .auto-val {
    font-family: var(--font-body);
  }

  .contingent-callout {
    background: var(--paper);
    border: 1px dashed var(--alert);
    border-radius: var(--r-sm);
    padding: 10px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .contingent-text {
    font-size: 12px;
    color: var(--ink);
    font-family: var(--font-body);
  }

  .contingent-btn {
    background: none;
    border: 1px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 4px 8px;
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: bold;
    color: var(--ink);
    cursor: pointer;
  }

  .contingent-btn:hover {
    background: var(--card-alt);
  }

  .reasons-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .reasons-heading {
    margin: 0;
    font-family: var(--font-condensed);
    font-size: 11px;
    font-weight: bold;
    letter-spacing: 0.05em;
    color: var(--ink-soft);
  }

  .reasons-list {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--ink);
    line-height: 1.4;
  }

  .actions-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 4px;
  }

  .retry-btn {
    padding: 10px 16px;
    background: var(--paper);
    color: var(--ink);
    border: 1.5px solid var(--ink);
    border-radius: var(--r-sm);
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .retry-btn:hover {
    background: var(--card-alt);
  }

  .stamp-btn {
    flex: 1;
    padding: 12px 18px;
    color: var(--paper);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    font-family: var(--font-ui);
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    text-align: center;
    box-shadow: 2px 2px 0 var(--ink);
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }

  .stamp-btn.primary {
    background: var(--ink);
  }

  .stamp-btn.danger {
    background: var(--alert);
  }

  .stamp-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--ink);
  }
</style>
