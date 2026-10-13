<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import {
    AMENDMENTS_CATALOG,
    calculateAmendmentProposalVotes,
    checkAmendmentCongressionalProposal,
    type AmendmentId,
  } from '../engine/amendments';
  import {
    AMENDMENT_EXPIRY_TURNS,
    AMENDMENT_HOUSE_THRESHOLD,
    AMENDMENT_SENATE_THRESHOLD,
    AMENDMENT_STATES_TO_RATIFY,
  } from '../engine/units';
  import Overlay from './Overlay.svelte';

  let {
    session,
    onClose,
  }: {
    session: Session;
    onClose: () => void;
  } = $props();

  const activeAmendment = $derived(session.current.activeAmendment);
  const draftedProposal = $derived(session.draft.amendmentProposal);
  const isCampaigning = $derived(session.draft.amendmentCampaign);
  const ratifiedList = $derived(session.current.ratifiedAmendments ?? []);

  const candidateIds: AmendmentId[] = [
    'amendment_judicial_terms',
    'amendment_campaign_finance',
    'amendment_equal_rights',
    'amendment_balanced_budget',
  ];

  function getVotes(id: AmendmentId) {
    return calculateAmendmentProposalVotes(
      id,
      session.current.houseSeatDelta,
      session.current.senateSeatDelta ?? 0,
      session.current.approval,
    );
  }

  function handlePropose(id: AmendmentId) {
    session.proposeAmendment(id);
  }

  function handleToggleCampaign() {
    session.toggleAmendmentCampaign();
  }
</script>

<Overlay title="Article V Constitutional Amendments" {onClose}>
  <div class="amendment-modal" data-testid="amendment-modal">
    <header class="modal-header">
      <div class="header-titles">
        <h2 class="modal-title">Article V Constitutional Amendments</h2>
        <span class="modal-subtitle">
          Supermajoritarian democracy: 2/3 House (290), 2/3 Senate (67), and 3/4 State Legislatures (38 of 50)
        </span>
      </div>
      <button type="button" class="close-x" onclick={onClose} aria-label="Close dialog">✕</button>
    </header>

    {#if ratifiedList.length > 0}
      <section class="ratified-section">
        <h3 class="section-title">Codified Into the U.S. Constitution</h3>
        <div class="ratified-grid">
          {#each ratifiedList as ratId (ratId)}
            {@const def = AMENDMENTS_CATALOG[ratId]}
            <div class="ratified-card">
              <span class="ratified-badge">✓ RATIFIED</span>
              <b>{def.title}</b>
              <p>{def.effectsSummary}</p>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#if activeAmendment && !activeAmendment.isRatified && !activeAmendment.isExpired}
      {@const def = AMENDMENTS_CATALOG[activeAmendment.id]}
      {@const turnsRemaining = AMENDMENT_EXPIRY_TURNS - (session.current.turn - activeAmendment.proposedTurn)}
      {@const progressPct = Math.min(100, Math.round((activeAmendment.ratifiedStates.length / AMENDMENT_STATES_TO_RATIFY) * 100))}

      <section class="active-tracker-section" data-testid="active-amendment-tracker">
        <div class="tracker-header">
          <div class="badge-row">
            <span class="tracker-badge">PENDING STATE RATIFICATION</span>
            <span class="turns-left">{turnsRemaining} turns until sunset</span>
          </div>
          <h3 class="active-title">{def.title}</h3>
          <p class="active-desc">{def.description}</p>
        </div>

        <div class="progress-container">
          <div class="progress-labels">
            <span>State Legislatures Ratified:</span>
            <b>{activeAmendment.ratifiedStates.length} / {AMENDMENT_STATES_TO_RATIFY} states ({progressPct}%)</b>
          </div>
          <div class="progress-bar-bg" role="progressbar" aria-valuenow={activeAmendment.ratifiedStates.length} aria-valuemin={0} aria-valuemax={AMENDMENT_STATES_TO_RATIFY}>
            <div class="progress-bar-fill" style:width="{progressPct}%"></div>
          </div>
        </div>

        <div class="campaign-box">
          <div class="campaign-info">
            <b>Lobby State Legislatures</b>
            <span>Invest 15 clout this turn to mobilize organizers and pressure divided chambers</span>
          </div>
          <button
            type="button"
            class="btn campaign-btn"
            class:active={isCampaigning}
            onclick={handleToggleCampaign}
          >
            {isCampaigning ? '✓ Campaigning (+15 Clout)' : 'Campaign in States (15 Clout)'}
          </button>
        </div>

        <div class="ratified-states-tags">
          <span class="tags-label">Ratified States:</span>
          {#if activeAmendment.ratifiedStates.length === 0}
            <span class="no-states">Debate underway in state capitals...</span>
          {:else}
            <div class="state-chips">
              {#each activeAmendment.ratifiedStates as st (st)}
                <span class="state-chip">{st}</span>
              {/each}
            </div>
          {/if}
        </div>
      </section>
    {:else}
      <section class="proposals-section">
        <h3 class="section-title">Candidate Constitutional Amendments</h3>
        <div class="proposals-grid">
          {#each candidateIds as candId (candId)}
            {@const def = AMENDMENTS_CATALOG[candId]}
            {@const votes = getVotes(candId)}
            {@const check = checkAmendmentCongressionalProposal(candId, votes.houseVotes, votes.senateVotes)}
            {@const isDrafted = draftedProposal === candId}
            {@const canAfford = session.clout >= def.proposalCloutCost}
            {@const canPropose = check.proposed && canAfford}

            <div class="proposal-card" class:drafted={isDrafted} data-testid="amendment-card-{candId}">
              <div class="prop-top">
                <h4 class="prop-title">{def.title}</h4>
                <p class="prop-desc">{def.description}</p>
                <div class="prop-effects">
                  <b>Permanent Impact:</b> {def.effectsSummary}
                </div>
              </div>

              <div class="funnel-stats">
                <div class="stat-stage" class:met={votes.houseVotes >= AMENDMENT_HOUSE_THRESHOLD}>
                  <span class="stage-label">House (2/3 Needed)</span>
                  <span class="stage-val">{votes.houseVotes} / {AMENDMENT_HOUSE_THRESHOLD}</span>
                </div>
                <div class="stat-stage" class:met={votes.senateVotes >= AMENDMENT_SENATE_THRESHOLD}>
                  <span class="stage-label">Senate (2/3 Needed)</span>
                  <span class="stage-val">{votes.senateVotes} / {AMENDMENT_SENATE_THRESHOLD}</span>
                </div>
              </div>

              {#if !check.proposed}
                <div class="hurdle-hint">
                  {check.reason}
                </div>
              {/if}

              <div class="actions">
                {#if isDrafted}
                  <button type="button" class="btn drafted-btn" disabled>
                    Staged for Congressional Proposal
                  </button>
                {:else}
                  <button
                    type="button"
                    class="btn propose-btn"
                    disabled={!canPropose}
                    onclick={() => handlePropose(candId)}
                  >
                    Propose Amendment ({def.proposalCloutCost} Clout)
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <footer class="modal-footer">
      <div class="clout-indicator">
        Available Clout: <b>{session.clout}</b>
      </div>
      <button type="button" class="btn close-btn" onclick={onClose}>Done</button>
    </footer>
  </div>
</Overlay>

<style>
  .amendment-modal {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    max-width: 720px;
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
  .section-title {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 8px 0;
  }
  .ratified-section {
    padding: 10px;
    background: var(--paper-dark);
    border-radius: var(--r-md);
  }
  .ratified-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ratified-card {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px;
    background: var(--card);
    border-radius: var(--r-sm);
    font-size: var(--text-xs);
  }
  .ratified-badge {
    align-self: flex-start;
    font-family: var(--font-condensed);
    font-size: 10px;
    font-weight: 900;
    background: var(--sage-dark);
    color: var(--card);
    padding: 1px 6px;
    border-radius: var(--r-sm);
  }
  .active-tracker-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    border: 2px solid var(--ink);
    border-radius: var(--r-md);
    background: var(--card);
  }
  .badge-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .tracker-badge {
    font-family: var(--font-condensed);
    font-size: 11px;
    font-weight: 900;
    background: var(--gold);
    color: var(--ink);
    padding: 2px 8px;
    border-radius: var(--r-sm);
  }
  .turns-left {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--ink-soft);
  }
  .active-title {
    font-family: var(--font-display);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--ink);
    margin: 4px 0 2px 0;
  }
  .active-desc {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    color: var(--ink-soft);
    margin: 0;
  }
  .progress-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .progress-labels {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--ink);
  }
  .progress-bar-bg {
    width: 100%;
    height: 10px;
    background: var(--paper-dark);
    border-radius: 5px;
    overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    background: var(--sage);
    transition: width 0.3s ease;
  }
  .campaign-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: var(--paper-dark);
    border-radius: var(--r-sm);
  }
  .campaign-info {
    display: flex;
    flex-direction: column;
    font-size: var(--text-xs);
  }
  .campaign-info span {
    color: var(--ink-soft);
  }
  .campaign-btn.active {
    background: var(--gold);
    color: var(--ink);
  }
  .ratified-states-tags {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--text-xs);
  }
  .tags-label {
    font-weight: 700;
    color: var(--ink);
  }
  .no-states {
    color: var(--ink-soft);
    font-style: italic;
  }
  .state-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .state-chip {
    font-family: var(--font-condensed);
    font-size: 11px;
    font-weight: 700;
    background: var(--paper-dark);
    color: var(--ink);
    padding: 2px 6px;
    border-radius: var(--r-sm);
  }
  .proposals-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .proposal-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border: 2px solid var(--paper-dark);
    border-radius: var(--r-md);
    background: var(--card);
  }
  .proposal-card.drafted {
    border-color: var(--gold);
    box-shadow: 0 0 0 1px var(--gold);
  }
  .prop-title {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--ink);
    margin: 0;
  }
  .prop-desc {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    color: var(--ink-soft);
    margin: 2px 0 0 0;
  }
  .prop-effects {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--ink);
    margin-top: 4px;
  }
  .funnel-stats {
    display: flex;
    gap: 12px;
  }
  .stat-stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px 10px;
    background: var(--paper-dark);
    border-radius: var(--r-sm);
    font-size: var(--text-xs);
  }
  .stat-stage.met {
    background: var(--sage-dark);
    color: var(--card);
  }
  .stage-label {
    font-weight: 600;
  }
  .stage-val {
    font-weight: 700;
  }
  .hurdle-hint {
    font-family: var(--font-body);
    font-size: 11px;
    color: var(--alert);
  }
  .actions .btn {
    width: 100%;
    padding: 6px 12px;
    font-size: var(--text-xs);
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
