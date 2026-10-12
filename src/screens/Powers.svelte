<script lang="ts">
  import { Scale, Landmark, Mic, AlertTriangle, ExternalLink, CheckCircle } from '@lucide/svelte';
  import type { Session } from '../app/session.svelte';
  import type { ScreenId } from '../app/screens';
  import { ORDERS_CATALOG, getOrder, type ExecutiveOrder } from '../content/orders';
  import { speechApprovalGain, speechCost } from '../engine/powers';
  import CourtBench from '../ui/art/CourtBench.svelte';
  import FedPortrait from '../ui/art/FedPortrait.svelte';
  import ScreenLayout from '../ui/ScreenLayout.svelte';

  let {
    session,
    question,
    go,
    onOpenMyth,
    onOpenSpeech,
    onOpenFed,
  }: {
    session: Session;
    question: string;
    go?: (id: ScreenId) => void;
    onOpenMyth?: (mythId: string) => void;
    onOpenSpeech?: () => void;
    onOpenFed?: () => void;
  } = $props();

  let selectedOrderId = $state<string>(ORDERS_CATALOG[0]!.id);
  const selectedOrder = $derived(getOrder(selectedOrderId) ?? ORDERS_CATALOG[0]!);

  const isOrderActive = (id: string) => session.current.activeOrders.includes(id);
  const isOrderDraftSigned = (id: string) => session.draft.signedOrders.includes(id);
  const isOrderDraftRevoked = (id: string) => session.draft.revokedOrders.includes(id);
  const isOrderChallenged = (id: string) =>
    session.current.scheduled.some((s) => s.kind === 'court_ruling' && s.data.orderId === id);

  const effectiveActive = (id: string) =>
    (isOrderActive(id) && !isOrderDraftRevoked(id)) || isOrderDraftSigned(id);

  const selectedActive = $derived(effectiveActive(selectedOrderId));
  const canAffordSelected = $derived(
    isOrderActive(selectedOrderId) || session.clout >= selectedOrder.cloutCost,
  );

  const currentSpeechCost = $derived(speechCost(session.current.speechCountInWindow));
  const currentSpeechGain = $derived(speechApprovalGain(session.current.speechCountInWindow));
  const canAffordSpeech = $derived(session.clout >= currentSpeechCost);
  const canAffordFedPressure = $derived(session.clout >= 15);

  const pendingChallengesCount = $derived(
    session.current.scheduled.filter((s) => s.kind === 'court_ruling').length,
  );
</script>

<ScreenLayout {question}>
  {#snippet main()}
    <div class="powers-container">
      <!-- Executive Orders Grid -->
      <section class="orders-section" aria-label="Curated Executive Orders">
        <div class="section-header">
          <div class="header-titles">
            <span class="section-tag">ARTICLE II SECTION 1</span>
            <h3 class="section-title">Executive Orders</h3>
          </div>
          <span class="active-count">
            <b>{session.current.activeOrders.length}</b> active in force
          </span>
        </div>

        <div class="orders-grid" role="listbox" aria-label="Executive Orders list">
          {#each ORDERS_CATALOG as order (order.id)}
            {@const active = effectiveActive(order.id)}
            {@const selected = selectedOrderId === order.id}
            {@const challenged = isOrderChallenged(order.id)}
            {@const draftSigned = isOrderDraftSigned(order.id)}
            {@const draftRevoked = isOrderDraftRevoked(order.id)}

            <button
              class="order-card"
              class:selected
              class:active
              class:challenged
              role="option"
              aria-selected={selected}
              onclick={() => (selectedOrderId = order.id)}
            >
              <div class="card-top">
                <span class="order-name">{order.name}</span>
                <span class="clout-badge">{order.cloutCost} clout</span>
              </div>

              <p class="order-desc">{order.preview}</p>

              <div class="card-footer">
                <span class="risk-pill risk-{order.courtRisk.toLowerCase()}">
                  Court risk: {order.courtRisk}
                </span>

                {#if challenged}
                  <span class="status-badge challenged">
                    <Scale size={13} /> Under Review
                  </span>
                {:else if draftRevoked}
                  <span class="status-badge revoking">Revoking</span>
                {:else if draftSigned}
                  <span class="status-badge signing">Signing</span>
                {:else if active}
                  <span class="status-badge signed">
                    <CheckCircle size={13} /> Active
                  </span>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </section>

      <!-- Institutional Power Strip: Fed & Supreme Court -->
      <div class="institutions-strip">
        <!-- Federal Reserve Card -->
        <div class="institution-card fed-card">
          <div class="inst-media">
            <FedPortrait size={52} />
          </div>
          <div class="inst-info">
            <div class="inst-header">
              <span class="inst-tag">CENTRAL BANK</span>
              <h4 class="inst-name">The Fed (independent)</h4>
            </div>
            <p class="inst-desc">Sets short-term borrowing costs to steady prices and support employment.</p>
            <div class="inst-actions">
              <button
                class="fed-btn"
                class:active={session.draft.fedPressure}
                disabled={session.over || (!canAffordFedPressure && !session.draft.fedPressure)}
                onclick={() => session.setFedPressure(!session.draft.fedPressure)}
              >
                <Landmark size={14} />
                {session.draft.fedPressure ? 'Pressuring Fed (-15 clout)' : 'Pressure for Rate Cut (15 clout)'}
              </button>
              <button
                class="fed-btn secondary"
                onclick={() => onOpenFed?.()}
              >
                More Fed options...
              </button>
            </div>
          </div>
        </div>

        <!-- Supreme Court Card -->
        <div class="institution-card court-card">
          <div class="court-header-row">
            <div>
              <span class="inst-tag">ARTICLE III</span>
              <h4 class="inst-name">Supreme Court · leans 6–3</h4>
            </div>
            {#if pendingChallengesCount > 0}
              <span class="court-badge alert">
                <Scale size={14} /> {pendingChallengesCount} review{pendingChallengesCount > 1 ? 's' : ''} pending
              </span>
            {:else}
              <span class="court-badge normal">Major Questions Doctrine</span>
            {/if}
          </div>
          <div class="bench-illustration">
            <CourtBench />
          </div>
          <p class="court-subtext">Strikes down executive actions exceeding delegated statutory authority.</p>
        </div>
      </div>
    </div>
  {/snippet}

  {#snippet learn()}
    <button class="link" onclick={() => onOpenMyth?.('rule_by_decree')}>
      How it works: Executive orders & court review
    </button>
    <button class="ticket" onclick={() => onOpenMyth?.('gas_prices')}>
      Myth? Can you lower gas prices
    </button>
  {/snippet}

  {#snippet next()}
    <div class="next-column">
      <!-- What It Means Explainer -->
      <div class="card preview-card">
        <span class="label">What it means</span>
        <h4 class="preview-title">{selectedOrder.name}</h4>
        <p class="preview-desc">{selectedOrder.description}</p>

        <div class="legal-box">
          <span class="box-tag">STATUTORY AUTHORITY</span>
          <span class="legal-basis">{selectedOrder.legalBasis}</span>
        </div>

        <div class="risk-box">
          <span class="box-tag">JUDICIAL VULNERABILITY</span>
          <p class="risk-explanation">
            {#if selectedOrder.courtRisk === 'High'}
              Major Questions vulnerability. High probability of commercial or state legal challenge.
            {:else if selectedOrder.courtRisk === 'Moderate'}
              Discretionary agency interpretation. Moderate risk of circuit court injunction.
            {:else}
              Strong delegated statutory precedent. High likelihood of being upheld if challenged.
            {/if}
          </p>
        </div>

        {#if selectedOrder.citation}
          <div class="citation-box">
            <a href={selectedOrder.citation.url} target="_blank" rel="noopener noreferrer" class="citation-link">
              <ExternalLink size={13} /> {selectedOrder.citation.title}
            </a>
          </div>
        {/if}
      </div>

      <!-- Action Card: Bully Pulpit Speech -->
      <div class="card speech-card">
        <div class="speech-header">
          <div class="speech-title-box">
            <Mic size={16} />
            <span class="label">Bully Pulpit Speech</span>
          </div>
          <button class="speech-dialog-link" onclick={() => onOpenSpeech?.()}>
            Choose audience...
          </button>
        </div>
        <p class="speech-desc">Address the nation directly to lift public support with diminishing returns.</p>

        <div class="speech-options">
          <button
            class="speech-btn"
            class:active={session.draft.speechAudience === 'general'}
            disabled={session.over || (!canAffordSpeech && session.draft.speechAudience !== 'general')}
            onclick={() =>
              session.setSpeech(session.draft.speechAudience === 'general' ? null : 'general')}
          >
            General Public (+{currentSpeechGain}% appr)
          </button>
          <button
            class="speech-btn"
            class:active={session.draft.speechAudience === 'congress'}
            disabled={session.over || (!canAffordSpeech && session.draft.speechAudience !== 'congress')}
            onclick={() =>
              session.setSpeech(session.draft.speechAudience === 'congress' ? null : 'congress')}
          >
            Swing Districts (+1 trust)
          </button>
        </div>
      </div>

      <!-- Primary Red Stamp Button -->
      <div class="stamp-container">
        <button
          class="stamp-btn"
          class:revoke={selectedActive}
          disabled={session.over || (!selectedActive && !canAffordSelected)}
          onclick={() => session.toggleSignOrder(selectedOrderId)}
        >
          {#if isOrderDraftRevoked(selectedOrderId)}
            CANCEL REVOKE
          {:else if isOrderDraftSigned(selectedOrderId)}
            CANCEL SIGNING
          {:else if selectedActive}
            REVOKE ORDER
          {:else}
            SIGN ORDER ({selectedOrder.cloutCost} CLOUT)
          {/if}
        </button>
      </div>
    </div>
  {/snippet}
</ScreenLayout>

<style>
  .powers-container {
    display: flex;
    flex-direction: column;
    gap: 14px;
    height: 100%;
    min-height: 0;
  }

  .orders-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-height: 0;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-bottom: 4px;
    border-bottom: 2px solid var(--ink);
  }

  .section-tag {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--ink-soft);
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 20px;
    color: var(--ink);
    margin: 0;
    line-height: 1.1;
  }

  .active-count {
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--ink-soft);
  }

  .active-count b {
    color: var(--ink);
  }

  .orders-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    overflow-y: auto;
    padding-right: 4px;
    flex: 1;
    min-height: 0;
  }

  .order-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 10px 12px;
    text-align: left;
    cursor: pointer;
    box-shadow: 2px 2px 0 var(--ink);
    transition: transform var(--dur-fast), border-color var(--dur-fast), background-color var(--dur-fast);
  }

  .order-card:hover {
    transform: translateY(-1px);
    box-shadow: 3px 3px 0 var(--ink);
  }

  .order-card.selected {
    border-color: var(--gold-dark);
    background: var(--paper);
    outline: 2px solid var(--gold);
  }

  .order-card.active {
    border-left: 6px solid var(--sage-dark);
  }

  .order-card.challenged {
    border-left: 6px solid var(--alert);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 6px;
  }

  .order-name {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    color: var(--ink);
    line-height: 1.2;
  }

  .clout-badge {
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    background: var(--paper);
    border: 1px solid var(--ink);
    padding: 2px 6px;
    border-radius: 4px;
    white-space: nowrap;
    color: var(--ink);
  }

  .order-desc {
    font-family: var(--font-body);
    font-size: 13px;
    line-height: 1.35;
    color: var(--ink-soft);
    margin: 0 0 10px 0;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }

  .risk-pill {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.05em;
  }

  .risk-low {
    background: var(--sage-tint);
    color: var(--sage-dark);
    border: 1px solid var(--sage);
  }

  .risk-moderate {
    background: var(--paper);
    color: var(--gold-dark);
    border: 1px solid var(--gold);
  }

  .risk-high {
    background: var(--alert-tint);
    color: var(--alert-dark);
    border: 1px solid var(--alert);
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .status-badge.signed {
    background: var(--sage-dark);
    color: var(--card);
  }

  .status-badge.challenged {
    background: var(--alert-dark);
    color: var(--card);
  }

  .status-badge.signing {
    background: var(--gold-dark);
    color: var(--card);
  }

  .status-badge.revoking {
    background: var(--alert);
    color: var(--card);
  }

  /* Institutional bottom strip */
  .institutions-strip {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 12px;
    flex-shrink: 0;
  }

  .institution-card {
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 10px 12px;
    box-shadow: 2px 2px 0 var(--ink);
  }

  .fed-card {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .inst-header {
    display: flex;
    flex-direction: column;
    margin-bottom: 2px;
  }

  .inst-tag {
    font-family: var(--font-ui);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--ink-soft);
  }

  .inst-name {
    font-family: var(--font-display);
    font-size: 14px;
    color: var(--ink);
    margin: 0;
  }

  .inst-desc {
    font-family: var(--font-body);
    font-size: 12px;
    line-height: 1.3;
    color: var(--ink-soft);
    margin: 0 0 6px 0;
  }

  .fed-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: 4px;
    padding: 4px 10px;
    color: var(--ink);
    cursor: pointer;
    box-shadow: 1px 1px 0 var(--ink);
    transition: background-color var(--dur-fast);
  }

  .fed-btn:hover:not(:disabled) {
    background: var(--card);
  }

  .fed-btn.active {
    background: var(--alert);
    color: var(--card);
  }

  .court-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .court-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .court-badge {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .court-badge.normal {
    background: var(--paper);
    color: var(--ink-soft);
    border: 1px solid var(--ink-soft);
  }

  .court-badge.alert {
    background: var(--alert-tint);
    color: var(--alert-dark);
    border: 1px solid var(--alert);
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .bench-illustration {
    width: 100%;
    max-height: 52px;
  }

  .court-subtext {
    font-family: var(--font-body);
    font-size: 11px;
    line-height: 1.25;
    color: var(--ink-soft);
    margin: 0;
  }

  /* Right rail */
  .next-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
  }

  .preview-card {
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 12px;
    box-shadow: 3px 3px 0 var(--ink);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .preview-title {
    font-family: var(--font-display);
    font-size: 17px;
    color: var(--ink);
    margin: 0;
  }

  .preview-desc {
    font-family: var(--font-body);
    font-size: 13px;
    line-height: 1.35;
    color: var(--ink);
    margin: 0;
  }

  .legal-box,
  .risk-box,
  .citation-box {
    background: var(--paper);
    border: 1px solid var(--ink);
    border-radius: 4px;
    padding: 6px 8px;
  }

  .box-tag {
    display: block;
    font-family: var(--font-ui);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--ink-soft);
    margin-bottom: 2px;
  }

  .legal-basis {
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 700;
    color: var(--ink);
  }

  .risk-explanation {
    font-family: var(--font-body);
    font-size: 12px;
    line-height: 1.3;
    color: var(--ink);
    margin: 0;
  }

  .citation-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 700;
    color: var(--ink);
    text-decoration: underline;
  }

  .speech-card {
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 12px;
    box-shadow: 3px 3px 0 var(--ink);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .speech-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .speech-dialog-link {
    background: none;
    border: none;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--ink-soft);
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
  }

  .speech-dialog-link:hover {
    color: var(--ink);
  }

  .speech-title-box {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ink);
  }

  .speech-cost {
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    background: var(--paper);
    border: 1px solid var(--ink);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--ink);
  }

  .speech-desc {
    font-family: var(--font-body);
    font-size: 12px;
    line-height: 1.3;
    color: var(--ink-soft);
    margin: 0;
  }

  .speech-options {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 4px;
  }

  .speech-btn {
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: 4px;
    padding: 6px 10px;
    text-align: left;
    cursor: pointer;
    box-shadow: 1px 1px 0 var(--ink);
    transition: background-color var(--dur-fast);
    color: var(--ink);
  }

  .speech-btn:hover:not(:disabled) {
    background: var(--card);
  }

  .speech-btn.active {
    background: var(--gold);
    color: var(--ink);
  }

  .stamp-container {
    margin-top: auto;
  }

  .stamp-btn {
    width: 100%;
    padding: 14px;
    font-family: var(--font-ui);
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    background: var(--alert);
    color: var(--card);
    border: 3px solid var(--ink);
    border-radius: var(--r-md);
    box-shadow: var(--shadow);
    cursor: pointer;
    transition: transform var(--dur-fast), filter var(--dur-fast);
  }

  .stamp-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.05);
  }

  .stamp-btn.revoke {
    background: var(--alert-dark);
  }

  .stamp-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: 1px 1px 0 var(--ink);
    transform: none;
  }
</style>
