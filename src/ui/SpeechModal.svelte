<script lang="ts">
  import { Mic, Users, Building, Landmark, AlertCircle } from '@lucide/svelte';
  import type { Session } from '../app/session.svelte';
  import { speechApprovalGain, speechCost } from '../engine/powers';
  import Overlay from './Overlay.svelte';

  let {
    session,
    onClose,
  }: {
    session: Session;
    onClose: () => void;
  } = $props();

  let selectedAudience = $state<'general' | 'congress' | 'business'>('general');
  $effect(() => {
    if (session.draft.speechAudience) {
      selectedAudience = session.draft.speechAudience;
    }
  });

  const cost = $derived(speechCost(session.current.speechCountInWindow));
  const approvalBoost = $derived(speechApprovalGain(session.current.speechCountInWindow));
  const canAfford = $derived(
    session.clout >= (session.draft.speechAudience === selectedAudience ? 0 : cost),
  );

  function handleDeliver() {
    session.setSpeech(selectedAudience);
    onClose();
  }

  function handleCancelSpeech() {
    session.setSpeech(null);
    onClose();
  }
</script>

<Overlay title="Bully Pulpit: Deliver a Presidential Address" {onClose}>
  <div class="speech-modal-content">
    <header class="modal-header">
      <div class="header-icon">
        <Mic size={24} />
      </div>
      <div>
        <span class="tag">PRESIDENTIAL COMMUNICATIONS</span>
        <h3 class="title">Bully Pulpit Address</h3>
      </div>
    </header>

    <p class="subtitle">
      Use the power of the microphone to speak directly to the nation. Speeches shift public opinion,
      but repetitive addresses face diminishing returns as audiences fatigue.
    </p>

    <!-- Diminishing Returns Warning Banner if count > 0 -->
    {#if session.current.speechCountInWindow > 0}
      <div class="diminishing-banner">
        <AlertCircle size={18} />
        <div>
          <b>Audience fatigue active ({session.current.speechCountInWindow} prior address{session.current.speechCountInWindow > 1 ? 'es' : ''})</b>
          <p>Each additional speech in a rolling window costs more clout and yields smaller opinion swings.</p>
        </div>
      </div>
    {/if}

    <!-- Audience Selection Grid -->
    <div class="audiences-grid" role="radiogroup" aria-label="Select Target Audience">
      <!-- Option 1: General Public -->
      <button
        class="audience-card"
        class:selected={selectedAudience === 'general'}
        role="radio"
        aria-checked={selectedAudience === 'general'}
        onclick={() => (selectedAudience = 'general')}
      >
        <div class="card-icon">
          <Users size={20} />
        </div>
        <div class="card-body">
          <div class="card-title-row">
            <span class="aud-name">General Public</span>
            <span class="boost-badge">+{approvalBoost.toFixed(1)}% approval</span>
          </div>
          <p class="aud-desc">Prime-time televised address rallying everyday voters to your platform.</p>
        </div>
      </button>

      <!-- Option 2: Congress / Swing Districts -->
      <button
        class="audience-card"
        class:selected={selectedAudience === 'congress'}
        role="radio"
        aria-checked={selectedAudience === 'congress'}
        onclick={() => (selectedAudience = 'congress')}
      >
        <div class="card-icon">
          <Landmark size={20} />
        </div>
        <div class="card-body">
          <div class="card-title-row">
            <span class="aud-name">Swing Districts & Congress</span>
            <span class="boost-badge">+1 trust</span>
          </div>
          <p class="aud-desc">Speech targeted at competitive districts to build bipartisan legislative trust.</p>
        </div>
      </button>

      <!-- Option 3: Business Leaders -->
      <button
        class="audience-card"
        class:selected={selectedAudience === 'business'}
        role="radio"
        aria-checked={selectedAudience === 'business'}
        onclick={() => (selectedAudience = 'business')}
      >
        <div class="card-icon">
          <Building size={20} />
        </div>
        <div class="card-body">
          <div class="card-title-row">
            <span class="aud-name">Business Leaders</span>
            <span class="boost-badge">+0.25% GDP gap</span>
          </div>
          <p class="aud-desc">Economic summit speech boosting commercial investment and hiring confidence.</p>
        </div>
      </button>
    </div>

    <!-- Summary Box -->
    <div class="cost-summary">
      <span class="summary-label">Clout Required:</span>
      <b class="cost-value">{cost} clout</b>
      <span class="balance-after">Your balance: {session.clout} clout</span>
    </div>

    <!-- Modal Footer -->
    <footer class="modal-footer">
      <div class="footer-left">
        <button class="cancel-link" onclick={onClose}>
          Close
        </button>
        {#if session.draft.speechAudience !== null}
          <button class="remove-btn" onclick={handleCancelSpeech}>
            Cancel Scheduled Speech
          </button>
        {/if}
      </div>

      <button
        class="deliver-btn"
        disabled={session.over || !canAfford}
        onclick={handleDeliver}
      >
        DELIVER ADDRESS ({cost} CLOUT)
      </button>
    </footer>
  </div>
</Overlay>

<style>
  .speech-modal-content {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-height: 82vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 2px solid var(--ink);
    padding-bottom: 8px;
  }

  .header-icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    color: var(--ink);
  }

  .tag {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--ink-soft);
  }

  .title {
    font-family: var(--font-display);
    font-size: 22px;
    color: var(--ink);
    margin: 0;
    line-height: 1.1;
  }

  .subtitle {
    font-family: var(--font-body);
    font-size: 14px;
    line-height: 1.4;
    color: var(--ink-soft);
    margin: 0;
  }

  .diminishing-banner {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: var(--alert-tint);
    border: 1.5px solid var(--alert);
    border-radius: var(--r-sm);
    padding: 10px 12px;
    color: var(--alert-dark);
    font-family: var(--font-body);
    font-size: 13px;
    line-height: 1.35;
  }

  .diminishing-banner p {
    margin: 2px 0 0 0;
    color: var(--ink);
  }

  .audiences-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .audience-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 12px;
    text-align: left;
    cursor: pointer;
    box-shadow: 2px 2px 0 var(--ink);
    transition: transform var(--dur-fast), border-color var(--dur-fast), background-color var(--dur-fast);
  }

  .audience-card:hover {
    transform: translateY(-1px);
    background: var(--card);
  }

  .audience-card.selected {
    border-color: var(--gold-dark);
    outline: 2px solid var(--gold);
    background: var(--card);
  }

  .card-icon {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    background: var(--card);
    border: 1.5px solid var(--ink);
    border-radius: 4px;
    color: var(--ink);
    flex-shrink: 0;
  }

  .card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .aud-name {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 700;
    color: var(--ink);
  }

  .boost-badge {
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    background: var(--sage-tint);
    color: var(--ink);
    border: 1.5px solid var(--sage-dark);
    border-radius: 4px;
    padding: 2px 8px;
  }

  .aud-desc {
    font-family: var(--font-body);
    font-size: 13px;
    line-height: 1.35;
    color: var(--ink-soft);
    margin: 0;
  }

  .cost-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--card);
    border: 1px solid var(--ink);
    border-radius: 4px;
    padding: 8px 12px;
    font-family: var(--font-ui);
    font-size: 13px;
  }

  .summary-label {
    color: var(--ink-soft);
    font-weight: 700;
  }

  .cost-value {
    color: var(--alert);
    font-size: 15px;
  }

  .balance-after {
    margin-left: auto;
    color: var(--ink-soft);
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 2px solid var(--ink);
    padding-top: 10px;
    margin-top: 4px;
  }

  .footer-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .cancel-link {
    background: none;
    border: none;
    font-family: var(--font-ui);
    font-size: 14px;
    font-weight: 700;
    color: var(--ink-soft);
    cursor: pointer;
    text-decoration: underline;
  }

  .remove-btn {
    background: var(--paper);
    border: 1px solid var(--alert);
    border-radius: 4px;
    color: var(--alert);
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 700;
    padding: 4px 8px;
    cursor: pointer;
  }

  .deliver-btn {
    padding: 10px 22px;
    font-family: var(--font-ui);
    font-size: 15px;
    font-weight: 900;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    background: var(--alert);
    color: var(--card);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    box-shadow: 2px 2px 0 var(--ink);
    cursor: pointer;
    transition: transform var(--dur-fast), filter var(--dur-fast);
  }

  .deliver-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.06);
  }

  .deliver-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
