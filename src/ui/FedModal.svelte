<script lang="ts">
  import { Landmark, AlertTriangle, ShieldCheck, CheckCircle2 } from '@lucide/svelte';
  import type { Session } from '../app/session.svelte';
  import { C } from '../engine/coefficients';
  import FedPortrait from './art/FedPortrait.svelte';
  import Overlay from './Overlay.svelte';

  let {
    session,
    onClose,
  }: {
    session: Session;
    onClose: () => void;
  } = $props();

  let pressureSelected = $state<boolean>(false);
  $effect(() => {
    pressureSelected = session.draft.fedPressure;
  });
  const cost = C.fedPressureCost;
  const canAffordPressure = $derived(
    session.clout >= (session.draft.fedPressure ? 0 : cost),
  );

  function handleSave() {
    session.setFedPressure(pressureSelected);
    onClose();
  }
</script>

<Overlay title="Federal Reserve: Central Bank Relations" {onClose}>
  <div class="fed-modal-content">
    <header class="modal-header">
      <div class="portrait-box">
        <FedPortrait size={56} />
      </div>
      <div class="header-text">
        <span class="tag">CENTRAL BANK INDEPENDENCE</span>
        <h3 class="title">The Federal Reserve System</h3>
      </div>
    </header>

    <div class="institution-overview">
      <p>
        The Federal Reserve operates independently under a dual mandate from Congress: maximum employment
        and price stability. The President does not set interest rates directly, but can nominate the Chair
        or use public political pressure to urge rate cuts.
      </p>
    </div>

    <!-- Pressure the Fed Box -->
    <section class="pressure-section" aria-label="Public Pressure">
      <div class="section-title-row">
        <h4 class="subhead">Public Rate Cut Pressure</h4>
        <span class="cost-badge">{cost} clout</span>
      </div>

      <div class="pressure-card" class:selected={pressureSelected}>
        <div class="toggle-row">
          <label class="switch-label">
            <input
              type="checkbox"
              checked={pressureSelected}
              disabled={session.over || (!canAffordPressure && !pressureSelected)}
              onchange={(e) => (pressureSelected = e.currentTarget.checked)}
            />
            <span class="switch-text">Pressure Chair for Immediate Rate Cut (-0.50% rate)</span>
          </label>
        </div>

        <div class="tradeoff-grid">
          <div class="tradeoff-item gain">
            <div class="tradeoff-head">
              <CheckCircle2 size={16} />
              <b>Immediate Gain</b>
            </div>
            <p>Short-term borrowing rate drops 0.50%, lowering borrowing costs for businesses and homebuyers.</p>
          </div>

          <div class="tradeoff-item cost">
            <div class="tradeoff-head">
              <AlertTriangle size={16} />
              <b>{session.vocabMode === 'wonk' ? 'Credibility Cost' : 'The Catch: Higher Store Prices'}</b>
            </div>
            <p>
              Political interference spooks bond markets. Expect higher inflation (+0.20%)
              for the next 4 turns as savers brace for rising prices.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal Footer -->
    <footer class="modal-footer">
      <button class="cancel-link" onclick={onClose}>
        Close
      </button>

      <button
        class="confirm-btn"
        disabled={session.over || (pressureSelected && !canAffordPressure && !session.draft.fedPressure)}
        onclick={handleSave}
      >
        {pressureSelected ? `CONFIRM PRESSURE (${cost} CLOUT)` : 'SAVE & CLOSE'}
      </button>
    </footer>
  </div>
</Overlay>

<style>
  .fed-modal-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 82vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: 14px;
    border-bottom: 2px solid var(--ink);
    padding-bottom: 10px;
  }

  .portrait-box {
    flex-shrink: 0;
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
    margin: 2px 0 0 0;
    line-height: 1.1;
  }

  .institution-overview p {
    font-family: var(--font-body);
    font-size: 14px;
    line-height: 1.4;
    color: var(--ink-soft);
    margin: 0;
  }

  .pressure-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .subhead {
    font-family: var(--font-display);
    font-size: 16px;
    color: var(--ink);
    margin: 0;
  }

  .cost-badge {
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    background: var(--paper);
    border: 1px solid var(--ink);
    border-radius: 4px;
    padding: 2px 6px;
    color: var(--ink);
  }

  .pressure-card {
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 2px 2px 0 var(--ink);
  }

  .pressure-card.selected {
    border-color: var(--alert);
    outline: 2px solid var(--alert);
    background: var(--card);
  }

  .switch-label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-family: var(--font-ui);
    font-size: 15px;
    font-weight: 700;
    color: var(--ink);
  }

  .switch-label input {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--alert);
  }

  .tradeoff-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  @media (max-width: 640px) {
    .tradeoff-grid {
      grid-template-columns: 1fr;
    }
  }

  .tradeoff-item {
    border-radius: 4px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-family: var(--font-body);
    font-size: 12.5px;
    line-height: 1.35;
  }

  .tradeoff-item.gain {
    background: var(--sage-tint);
    border: 1px solid var(--sage);
    color: var(--ink);
  }

  .tradeoff-item.cost {
    background: var(--alert-tint);
    border: 1px solid var(--alert);
    color: var(--ink);
  }

  .tradeoff-head {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-ui);
    font-size: 13px;
  }

  .tradeoff-head b {
    font-weight: 700;
  }

  .tradeoff-item p {
    margin: 0;
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 2px solid var(--ink);
    padding-top: 10px;
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

  .confirm-btn {
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

  .confirm-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.06);
  }

  .confirm-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
