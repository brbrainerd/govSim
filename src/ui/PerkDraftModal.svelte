<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import { DOCTRINE_FAMILIES, getPerk, PERK_TIER_LABELS } from '../content/perks';
  import { C } from '../engine/coefficients';
  import Overlay from './Overlay.svelte';
  import TradeoffPill from './TradeoffPill.svelte';
  import CivicEmblem from './art/CivicEmblem.svelte';

  let {
    session,
    onClose,
  }: {
    session: Session;
    onClose: () => void;
  } = $props();

  const isEvil = $derived(session.isEvilMode);
  const isWonk = $derived(session.vocabMode === 'wonk');
  const modalTitle = $derived(
    isEvil
      ? 'Fixer Syndicate & Dark-Market Relic Draft'
      : 'White House Task Force & Mandate Draft',
  );
  const pickedId = $derived(session.draft.perkPickId);
  const skipped = $derived(session.draft.perkSkipForClout);
  const lockedId = $derived(session.effectiveLockedPerkId);
</script>

<Overlay title={modalTitle} {onClose}>
  <div
    class="perk-draft-shell"
    class:evil-draft-skin={isEvil}
    data-testid="perk-draft-modal"
    data-mode={isEvil ? 'evil' : 'standard'}
  >
    <div class="draft-header">
      <div class="header-copy">
        <span class="header-kicker">
          {isEvil
            ? 'SHADOW SYNDICATE PROCUREMENT • STREAM 21'
            : `QUARTER ${session.current.turn} TASK FORCE CHARTER`}
        </span>
        <h2 class="header-title">{modalTitle}</h2>
        <p class="header-sub">
          {isEvil
            ? 'Commission one covert syndicate relic this quarter, lock a card for next quarter, or conserve clout.'
            : 'Charter one interagency task force this quarter, lock a card for next quarter, or skip to conserve clout.'}
        </p>
      </div>
      <div class="header-meta">
        <span class="clout-avail" data-testid="perk-draft-clout">
          <CivicEmblem kind="bolt" size={14} /> {session.clout} Clout Available
        </span>
        <button type="button" class="close-x" onclick={onClose} aria-label="Close Task Force draft">
          ✕
        </button>
      </div>
    </div>

    <div class="slate-grid" role="group" aria-label="Quarterly Task Force choices">
      {#each session.perkSlate as card (card.id)}
        {@const isPicked = pickedId === card.id}
        {@const isLocked = lockedId === card.id}
        {@const prevCost = pickedId ? (getPerk(pickedId)?.cloutCost ?? 0) : 0}
        {@const prevBonus = skipped ? C.perkSkipCloutBonus : 0}
        {@const canAfford = card.cloutCost <= session.clout + prevCost - prevBonus}
        {@const tierMeta = PERK_TIER_LABELS[card.tier]}
        <article
          class="perk-card tier-{card.tier}"
          class:picked={isPicked}
          class:locked={isLocked}
          class:evil-card={Boolean(card.evilOnly)}
          data-testid="perk-card-{card.id}"
          data-tier={card.tier}
        >
          <div class="card-top-row">
            <span class="tier-badge tier-pill-{card.tier}">
              {isWonk ? tierMeta.wonk : tierMeta.label}
            </span>
            <span class="cost-badge" class:free={card.cloutCost === 0}>
              {card.cloutCost > 0 ? `${card.cloutCost} Clout` : '0 Clout'}
            </span>
          </div>

          <div class="card-title-row">
            <CivicEmblem kind={card.id} size={34} medallion={true} />
            <div class="card-title-text">
              <h3 class="card-name">{card.name}</h3>
              {#if isWonk}
                <span class="card-wonk">{card.wonkLabel}</span>
              {/if}
            </div>
          </div>

          <div class="doctrine-tags-row" data-testid="perk-tags-{card.id}">
            {#each card.tags as tagId (tagId)}
              {@const fam = DOCTRINE_FAMILIES[tagId]}
              <span class="doctrine-pill" class:evil-pill={fam.evilOnly} title={fam.summary}>
                <CivicEmblem kind={tagId} size={12} />
                {isWonk ? fam.wonkLabel : fam.label}
              </span>
            {/each}
          </div>

          <p class="card-desc">{card.description}</p>

          <TradeoffPill
            variant="compact"
            upside={card.upside}
            catchText={card.catchText}
            vocabMode={session.vocabMode}
          />

          <p class="civic-note">
            <b>Civic Note:</b> {card.civicNote}
          </p>

          <div class="card-actions">
            <button
              type="button"
              class="pick-btn"
              class:active={isPicked}
              disabled={!canAfford && !isPicked}
              data-testid="perk-pick-{card.id}"
              onclick={() => session.pickPerk(isPicked ? null : card.id)}
            >
              {isPicked ? '✓ Staged for Turn' : canAfford ? 'Charter Task Force' : 'Need More Clout'}
            </button>
            <button
              type="button"
              class="lock-btn"
              class:active={isLocked}
              data-testid="perk-lock-{card.id}"
              aria-pressed={isLocked}
              title="Hold this card in slot 1 for next quarter's draft"
              onclick={() => session.toggleLockPerk(card.id)}
            >
              {#if isLocked}
                <CivicEmblem kind="lock" size={12} /> Locked
              {:else}
                <CivicEmblem kind="unlock" size={12} /> Lock
              {/if}
            </button>
          </div>
        </article>
      {/each}
    </div>

    <div class="draft-footer">
      <div class="footer-left">
        <button
          type="button"
          class="reroll-btn"
          disabled={!session.canRerollPerkSlate}
          data-testid="perk-reroll-btn"
          onclick={() => session.rerollPerkSlate()}
        >
          <CivicEmblem kind="dice" size={14} /> Reroll Slate ({session.nextPerkRerollCost} Clout)
        </button>

        <button
          type="button"
          class="skip-btn"
          class:active={skipped}
          data-testid="perk-skip-btn"
          onclick={() => session.skipPerkDraft()}
        >
          {#if skipped}
            ✓ Skipping Draft (+{C.perkSkipCloutBonus} Clout)
          {:else}
            <CivicEmblem kind="skip" size={13} /> Skip for +{C.perkSkipCloutBonus} Clout
          {/if}
        </button>
      </div>

      <button
        type="button"
        class="confirm-btn"
        data-testid="perk-close-btn"
        onclick={onClose}
      >
        Done
      </button>
    </div>
  </div>
</Overlay>

<style>
  .perk-draft-shell {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 82dvh;
    overflow-y: auto;
    padding: 4px;
    color: var(--ink);
  }

  .evil-draft-skin {
    border-top: 3px solid var(--gold);
    padding-top: 8px;
  }

  .draft-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    border-bottom: 1.5px solid var(--rule);
    padding-bottom: 8px;
  }

  .header-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .header-kicker {
    font: 700 10px var(--font-label);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .header-title {
    margin: 0;
    font: 700 clamp(18px, 1.8vw, 22px) var(--font-display);
    color: var(--ink);
  }

  .header-sub {
    margin: 0;
    font: 400 12px var(--font-body);
    color: var(--ink-soft);
  }

  .header-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .clout-avail {
    padding: 4px 10px;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: var(--r-sm);
    font: 700 12px var(--font-label);
    white-space: nowrap;
  }

  .close-x {
    background: transparent;
    border: none;
    font-size: 16px;
    font-weight: 700;
    color: var(--ink-soft);
    cursor: pointer;
    padding: 4px 8px;
  }

  .slate-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  @media (max-width: 900px) {
    .slate-grid {
      grid-template-columns: 1fr;
    }
  }

  .perk-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: var(--r-md);
    box-shadow: 2px 2px 0 var(--ink);
    transition: transform 0.12s ease;
  }

  .perk-card.picked {
    background: var(--card);
    border-color: var(--sage-dark);
    box-shadow: 3px 3px 0 var(--sage-dark);
  }

  .perk-card.locked {
    outline: 2px dashed var(--gold-dark);
    outline-offset: 2px;
  }

  .perk-card.evil-card {
    border-color: var(--gold-dark);
  }

  .card-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }

  .tier-badge {
    font: 700 10px var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 6px;
    border-radius: 3px;
    border: 1px solid var(--ink);
    background: var(--card);
    color: var(--ink);
  }

  .tier-pill-3 {
    background: var(--sky);
    color: var(--paper);
  }

  .tier-pill-4 {
    background: var(--gold);
    color: var(--ink);
  }

  .cost-badge {
    font: 700 11px var(--font-label);
    padding: 2px 7px;
    border-radius: 3px;
    background: var(--ink);
    color: var(--paper);
    white-space: nowrap;
  }

  .cost-badge.free {
    background: var(--sage-tint);
    color: var(--ink);
    border: 1px solid var(--sage-dark);
  }

  .card-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-title-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .card-name {
    margin: 0;
    font: 700 14px var(--font-display);
    color: var(--ink);
  }

  .card-wonk {
    font: 600 10px var(--font-label);
    color: var(--ink-soft);
  }

  .doctrine-tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .doctrine-pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 6px;
    background: var(--card);
    border: 1px solid var(--ink-soft);
    border-radius: 3px;
    font: 700 10px var(--font-label);
    color: var(--ink);
  }

  .doctrine-pill.evil-pill {
    border-color: var(--gold-dark);
    color: var(--gold-dark);
  }

  .card-desc {
    margin: 0;
    font: 400 12px/1.35 var(--font-body);
    color: var(--ink);
  }

  .civic-note {
    margin: 0;
    font: 400 11px/1.3 var(--font-body);
    color: var(--ink-soft);
    border-top: 1px dotted var(--rule);
    padding-top: 6px;
    margin-top: auto;
  }

  .card-actions {
    display: flex;
    gap: 6px;
    padding-top: 4px;
  }

  .pick-btn {
    flex: 1;
    padding: 7px 10px;
    background: var(--ink);
    color: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: var(--r-sm);
    font: 700 12px var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    cursor: pointer;
  }

  .pick-btn.active {
    background: var(--sage-dark);
    border-color: var(--ink);
  }

  .pick-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .lock-btn {
    padding: 7px 9px;
    background: var(--card);
    color: var(--ink);
    border: 1.5px solid var(--ink);
    border-radius: var(--r-sm);
    font: 700 11px var(--font-label);
    cursor: pointer;
    white-space: nowrap;
  }

  .lock-btn.active {
    background: var(--gold);
    color: var(--ink);
  }

  .draft-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    border-top: 1.5px solid var(--rule);
    padding-top: 10px;
  }

  .footer-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .reroll-btn,
  .skip-btn,
  .confirm-btn {
    padding: 8px 14px;
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    box-shadow: 2px 2px 0 var(--ink);
    font: 700 12px var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    cursor: pointer;
  }

  .reroll-btn {
    background: var(--card);
    color: var(--ink);
  }

  .reroll-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }

  .skip-btn {
    background: var(--paper);
    color: var(--ink);
  }

  .skip-btn.active {
    background: var(--gold);
    color: var(--ink);
  }

  .confirm-btn {
    background: var(--ink);
    color: var(--paper);
  }
</style>
