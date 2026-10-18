<script lang="ts">
  import { Mic, Users, Building, Landmark, AlertCircle } from '@lucide/svelte';
  import type { Session } from '../app/session.svelte';
  import { speechApprovalGain, speechCost } from '../engine/powers';
  import Character, { resolvePresidentLook } from './art/Character.svelte';
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
  const presidentMood = $derived(
    session.current.speechCountInWindow > 1 ? 'stressed' : 'confident',
  );
  const presidentLook = $derived(
    resolvePresidentLook(session.options.presidentLook ?? 0, session.isEvilMode, presidentMood),
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
        <h3 class="title">{session.vocabMode === 'wonk' ? 'Bully Pulpit Address' : 'National TV Speech'}</h3>
      </div>
    </header>

    <!-- Animated Bully Pulpit Podium Broadcast Scene (VIGNETTE-01) -->
    <div
      class="podium-vignette"
      data-testid="speech-podium-vignette"
      data-audience={selectedAudience}
    >
      <svg viewBox="0 0 440 112" class="podium-svg" aria-hidden="true">
        <!-- Press room backdrop & bunting -->
        <rect x="0" y="0" width="440" height="112" fill="var(--paper)" />
        <rect x="0" y="0" width="220" height="96" fill="var(--sky-tint)" opacity="0.55" />
        <path d="M 16 0 V 88 M 44 0 V 88 M 176 0 V 88 M 204 0 V 88" stroke="var(--navy)" stroke-width="6" opacity="0.22" />
        <line x1="0" y1="96" x2="440" y2="96" stroke="var(--ink)" stroke-width="2" />

        <!-- Camera flash bursts -->
        <circle class="camera-flash flash-a" cx="42" cy="28" r="10" fill="var(--gold)" opacity="0.35" />
        <circle class="camera-flash flash-b" cx="188" cy="22" r="8" fill="var(--gold)" opacity="0.25" />

        <!-- President at the podium -->
        <Character
          x={110}
          y={4}
          scale={0.78}
          look={presidentLook}
          mood={presidentMood}
          pose="podium"
        />

        <!-- Presidential Podium & Dual Microphones -->
        <g class="rostrum">
          <path d="M 74 64 L 146 64 L 138 110 L 82 110 Z" fill="var(--wood)" stroke="var(--ink)" stroke-width="2" />
          <rect x="68" y="58" width="84" height="8" rx="2" fill="var(--wood-light)" stroke="var(--ink)" stroke-width="2" />
          <!-- Presidential Seal Medallion -->
          <circle cx="110" cy="82" r="11" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.8" />
          <circle cx="110" cy="82" r="6" fill="var(--navy)" />
          <!-- Dual Gooseneck Microphones -->
          <path d="M 96 58 Q 92 44 102 42" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" />
          <ellipse cx="103" cy="42" rx="3" ry="2" fill="var(--ink)" />
          <path d="M 124 58 Q 128 44 118 42" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" />
          <ellipse cx="117" cy="42" rx="3" ry="2" fill="var(--ink)" />
        </g>

        <!-- Broadcast divider -->
        <line x1="220" y1="0" x2="220" y2="112" stroke="var(--ink)" stroke-width="2" stroke-dasharray="4 3" />

        <!-- Target Audience Silhouettes (Right Half) -->
        {#if selectedAudience === 'general'}
          <g class="audience-group general-audience">
            <text x="234" y="18" class="aud-svg-tag">PRIME-TIME HOUSEHOLDS</text>
            <!-- Crowd silhouettes & living room TV banner -->
            <circle cx="268" cy="54" r="11" fill="var(--navy)" stroke="var(--ink)" stroke-width="1.8" />
            <path d="M 250 96 Q 268 68 286 96 Z" fill="var(--navy)" stroke="var(--ink)" stroke-width="1.8" />
            <circle cx="322" cy="48" r="12" fill="var(--sage-dark)" stroke="var(--ink)" stroke-width="1.8" />
            <path d="M 302 96 Q 322 64 342 96 Z" fill="var(--sage-dark)" stroke="var(--ink)" stroke-width="1.8" />
            <circle cx="376" cy="54" r="11" fill="var(--gold-dark)" stroke="var(--ink)" stroke-width="1.8" />
            <path d="M 358 96 Q 376 68 394 96 Z" fill="var(--gold-dark)" stroke="var(--ink)" stroke-width="1.8" />
            <!-- Small Pennant Flag -->
            <line x1="398" y1="30" x2="398" y2="76" stroke="var(--ink)" stroke-width="2" />
            <polygon points="398,30 424,38 398,46" fill="var(--alert)" stroke="var(--ink)" stroke-width="1.5" />
          </g>
        {:else if selectedAudience === 'congress'}
          <g class="audience-group congress-audience">
            <text x="234" y="18" class="aud-svg-tag">CAPITOL HILL & SWING DISTRICTS</text>
            <!-- Capitol dome silhouette -->
            <path d="M 305 62 Q 330 24 355 62 Z" fill="var(--card-alt)" stroke="var(--ink)" stroke-width="2" />
            <line x1="330" y1="20" x2="330" y2="32" stroke="var(--ink)" stroke-width="2" />
            <rect x="292" y="62" width="76" height="34" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
            <!-- Lawmaker silhouettes -->
            <circle cx="264" cy="58" r="10" fill="var(--navy)" stroke="var(--ink)" stroke-width="1.8" />
            <path d="M 248 96 Q 264 72 280 96 Z" fill="var(--navy)" stroke="var(--ink)" stroke-width="1.8" />
            <circle cx="396" cy="58" r="10" fill="var(--alert)" stroke="var(--ink)" stroke-width="1.8" />
            <path d="M 380 96 Q 396 72 412 96 Z" fill="var(--alert)" stroke="var(--ink)" stroke-width="1.8" />
          </g>
        {:else}
          <g class="audience-group business-audience">
            <text x="234" y="18" class="aud-svg-tag">ECONOMIC SUMMIT & MARKETS</text>
            <!-- Skyline & Rising Bar Chart -->
            <rect x="246" y="60" width="16" height="36" fill="var(--sage)" stroke="var(--ink)" stroke-width="1.8" />
            <rect x="268" y="46" width="16" height="50" fill="var(--sage)" stroke="var(--ink)" stroke-width="1.8" />
            <rect x="290" y="32" width="16" height="64" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.8" />
            <!-- Business leaders silhouettes -->
            <circle cx="346" cy="54" r="11" fill="var(--ink)" />
            <path d="M 328 96 Q 346 68 364 96 Z" fill="var(--ink)" />
            <circle cx="392" cy="52" r="11" fill="var(--navy)" stroke="var(--ink)" stroke-width="1.8" />
            <path d="M 374 96 Q 392 66 410 96 Z" fill="var(--navy)" stroke="var(--ink)" stroke-width="1.8" />
          </g>
        {/if}
      </svg>
    </div>

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
            <span class="boost-badge">{session.vocabMode === 'wonk' ? '+0.25% GDP gap' : '+0.25% business growth'}</span>
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
    font-size: 13px;
    line-height: 1.35;
    color: var(--ink-soft);
    margin: 0;
  }

  .podium-vignette {
    width: 100%;
    height: 98px;
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    box-shadow: 2px 2px 0 var(--ink);
    overflow: hidden;
    background: var(--paper);
    flex-shrink: 0;
  }

  .podium-svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  .aud-svg-tag {
    font: 700 9.5px var(--font-ui);
    fill: var(--ink);
    letter-spacing: 0.06em;
  }

  @keyframes flashPulse {
    0%, 100% {
      opacity: 0.15;
    }
    50% {
      opacity: 0.65;
    }
  }

  .camera-flash.flash-a {
    animation: flashPulse 2.4s ease-in-out infinite;
  }

  .camera-flash.flash-b {
    animation: flashPulse 2.4s ease-in-out 1.2s infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .camera-flash.flash-a,
    .camera-flash.flash-b {
      animation: none;
    }
  }

  :global([data-calm="true"]) .camera-flash.flash-a,
  :global([data-calm="true"]) .camera-flash.flash-b {
    animation: none;
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
