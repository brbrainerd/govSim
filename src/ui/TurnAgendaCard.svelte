<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import type { ScreenId } from '../app/screens';
  import { year1GuideFor } from '../app/screens';
  import type { Suggestion } from '../content/briefing';
  import type { ActiveCrisis } from '../engine/director';
  import { getPerk } from '../content/perks';
  import CivicEmblem from './art/CivicEmblem.svelte';
  import {
    buildTurnChecklist,
    describeStagedItem,
    isMandateDraftSpotlightTurn,
    resolveTurnTrigger,
    type TurnChecklistItem,
  } from '../app/turn-triggers';

  let {
    session,
    thisTurnTitle,
    thisTurnDetail,
    suggestions,
    go,
    onOpenMyth,
    onOpenCrisis,
    onOpenPerkDraft,
  }: {
    session: Session;
    thisTurnTitle: string;
    thisTurnDetail: string;
    suggestions: readonly Suggestion[];
    go: (id: ScreenId) => void;
    onOpenMyth?: (mythId: string) => void;
    onOpenCrisis?: (crisis: ActiveCrisis) => void;
    onOpenPerkDraft?: () => void;
  } = $props();

  const guide = $derived(year1GuideFor(session.current.turn));
  const trigger = $derived(resolveTurnTrigger(session, suggestions));
  const checklist = $derived(buildTurnChecklist(session, suggestions));
  const visibleChecklist = $derived(
    session.stagedActionsSummary.length > 0 ? checklist : checklist.slice(0, 1),
  );
  const spotlightPerkDraft = $derived(isMandateDraftSpotlightTurn(session));

  const clearingCount = $derived(
    session.stagedActionsSummary.filter((a) => describeStagedItem(session, a).status === 'will_clear')
      .length,
  );
  const warningCount = $derived(
    session.stagedActionsSummary.filter((a) => describeStagedItem(session, a).status !== 'will_clear')
      .length,
  );
  const cloutDelta = $derived(session.clout - session.current.clout);

  function handleChecklistClick(item: TurnChecklistItem) {
    if (item.openCrisis) {
      const geo =
        session.current.activeGeopoliticalCrises && session.current.activeGeopoliticalCrises.length > 0
          ? session.current.activeGeopoliticalCrises[0]
          : null;
      const targetCrisis = session.current.activeCrisis ?? geo;
      if (targetCrisis) {
        onOpenCrisis?.(targetCrisis);
        return;
      }
    }
    if (item.play) {
      session.applyAdvisorPlay(item.play);
      // If the play stages a budget package, also send it to Congress so it clears immediately unless customized!
      if (item.play.pack && !session.draft.sentToCongress) {
        session.sendToCongress();
      }
      return;
    }
    if (item.mythId) {
      onOpenMyth?.(item.mythId);
      return;
    }
    if (item.screen) {
      go(item.screen);
    }
  }

  function handleTriggerClick() {
    if (trigger.openCrisis) {
      const geo =
        session.current.activeGeopoliticalCrises && session.current.activeGeopoliticalCrises.length > 0
          ? session.current.activeGeopoliticalCrises[0]
          : null;
      const targetCrisis = session.current.activeCrisis ?? geo;
      if (targetCrisis) {
        onOpenCrisis?.(targetCrisis);
        return;
      }
    }
    if (trigger.openPerkDraft) {
      onOpenPerkDraft?.();
      return;
    }
    if (trigger.play) {
      session.applyAdvisorPlay(trigger.play);
      if (trigger.play.pack && !session.draft.sentToCongress) {
        session.sendToCongress();
      }
      return;
    }
    if (trigger.screen) {
      go(trigger.screen);
    }
  }
</script>

<div class="card info index-stack-card" data-testid="turn-agenda-card">
  <div class="index-header">
    <span class="index-title">★ PENDING &amp; CLEARING ★</span>
    <span class="scen-pill" data-testid="oval-scenario-badge">{session.activeScenario.name}</span>
    {#if !session.isClassicSim}
      <button
        type="button"
        class="perk-draft-pill"
        class:drafted={Boolean(session.draft.perkPickId)}
        class:skipped={Boolean(session.draft.perkSkipForClout)}
        class:spotlight={spotlightPerkDraft}
        data-testid="open-perk-draft-btn"
        onclick={() => onOpenPerkDraft?.()}
      >
        {#if session.draft.perkPickId}
          <CivicEmblem kind="up" size={11} /> {getPerk(session.draft.perkPickId)?.name ?? 'Drafted'}
        {:else if session.draft.perkSkipForClout}
          <CivicEmblem kind="skip" size={11} /> Skipped (+10 Clout)
        {:else}
          <CivicEmblem kind={session.isEvilMode ? 'syndicate' : 'capitol'} size={12} />
          {session.isEvilMode ? 'Heist Relic' : 'Task Force'} ({session.activePerks.length})
        {/if}
      </button>
    {/if}
  </div>

  <!-- Civ-Style Spotlight Trigger Banner (Max 1 spotlight trigger per turn) -->
  <div class="trigger-banner" class:is-blocker={trigger.blocker} class:is-ready={trigger.kind === 'ready'} data-testid="turn-trigger-spotlight">
    <button
      type="button"
      class="trigger-pill"
      class:blocker-pill={trigger.blocker}
      class:ready-pill={trigger.kind === 'ready'}
      data-testid="civ-turn-trigger-pill"
      onclick={handleTriggerClick}
    >
      {trigger.badge}
    </button>
    <div class="trigger-copy">
      <b>{thisTurnTitle}</b>
      <span>{thisTurnDetail}</span>
    </div>
  </div>

  {#if guide}
    <div class="year1-guide" data-testid="year1-onboarding-guide">
      <b>{guide.step}:</b> <span>{guide.detail}</span>
    </div>
  {/if}

  <!-- Numbered Checklist of Pending & Clearing Actions (matching uikit.png & hub2.png!) -->
  <div class="checklist" role="group" aria-label="This quarter's pending and clearing decisions">
    {#each visibleChecklist as item (item.id)}
      <button
        type="button"
        class="checklist-row"
        class:row-checked={item.checked}
        class:row-warning={item.warning}
        data-testid={`turn-checklist-row-${item.index}`}
        onclick={() => handleChecklistClick(item)}
      >
        <span class="row-num">{item.index}.</span>
        <span class="row-text">
          <b class="row-title">{item.title}</b>
          <span class="row-sub">{item.subtitle}</span>
        </span>
        <span
          class="row-badge"
          class:badge-clear={item.checked}
          class:badge-warn={item.warning}
        >
          {item.statusBadge}
        </span>
        <span
          class="row-box"
          class:box-checked={item.checked}
          class:box-warn={item.warning}
          aria-hidden="true"
        >
          {item.checked ? '✓' : item.warning ? '!' : ''}
        </span>
      </button>
    {/each}
  </div>

  <!-- Live "What Will Clear at Turn End" Summary Strip -->
  <div class="clearing-footer" data-testid="clearing-summary-footer">
    {#if warningCount > 0}
      <span class="footer-warn" data-testid="turn-clearing-summary">
        <CivicEmblem kind="warn" size={12} />
        <b>{warningCount} Needs Action</b> · {clearingCount} ready to clear
      </span>
    {:else if clearingCount > 0}
      <span class="footer-clear" data-testid="turn-clearing-summary">
        <CivicEmblem kind="up" size={12} />
        <b>{clearingCount} Clearing on Next Turn</b> · Clout {cloutDelta >= 0 ? `+${cloutDelta}` : cloutDelta} ({session.clout} left)
      </span>
    {:else}
      <span class="footer-idle" data-testid="turn-clearing-summary">
        <b>0 Queued:</b> Stage 1-click play above or pick an Advisor Option below
      </span>
    {/if}
  </div>
</div>

<style>
  /* Stacked Index Card styling matching .design-targets/uikit.png & hub2.png */
  .index-stack-card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: clamp(6px, 0.8vh, 9px) clamp(8px, 0.9vw, 12px);
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: 10px;
    box-shadow:
      0 3px 0 var(--paper),
      0 5px 0 var(--ink),
      3px 6px 0 var(--ink);
    text-align: left;
  }

  .index-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
    flex-wrap: wrap;
    padding-bottom: 3px;
    border-bottom: 1.5px solid var(--ink);
  }

  .index-title {
    font: 800 clamp(11px, 0.85vw, 13px)/1 var(--font-ui);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink);
  }

  .scen-pill {
    font: 700 9.5px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 5px;
    border-radius: 4px;
    background: var(--paper);
    border: 1px solid var(--ink);
    color: var(--ink);
  }

  .perk-draft-pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font: 700 9.5px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    color: var(--ink);
    cursor: pointer;
  }
  .perk-draft-pill.spotlight {
    background: var(--gold);
    box-shadow: 1px 1px 0 var(--ink);
  }
  .perk-draft-pill.drafted {
    background: var(--sage-tint);
    border-color: var(--sage-dark);
  }
  .perk-draft-pill.skipped {
    background: var(--paper-dark);
  }

  .trigger-banner {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 6px;
    border-radius: 6px;
    background: var(--paper);
    border: 1px solid var(--ink);
  }
  .trigger-banner.is-blocker {
    background: var(--alert-tint);
    border-color: var(--alert);
  }
  .trigger-banner.is-ready {
    background: var(--sage-tint);
    border-color: var(--sage-dark);
  }

  .trigger-pill {
    flex-shrink: 0;
    font: 800 9.5px/1.1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 3px 6px;
    border-radius: 4px;
    background: var(--ink);
    color: var(--card);
    border: 1px solid var(--ink);
    cursor: pointer;
  }
  .trigger-pill.blocker-pill {
    background: var(--alert);
    color: var(--card);
  }
  .trigger-pill.ready-pill {
    background: var(--sage-dark);
    color: var(--card);
  }

  .trigger-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.15;
  }
  .trigger-copy b {
    font: 700 clamp(11.5px, 0.9vw, 13px)/1.15 var(--font-display);
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .trigger-copy span {
    font: 500 clamp(10.5px, 0.8vw, 12px)/1.15 var(--font-body);
    color: var(--ink-soft);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .year1-guide {
    display: flex;
    align-items: baseline;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--gold-tint);
    border: 1px dashed var(--ink);
    font: 600 10.5px/1.2 var(--font-body);
    color: var(--ink);
  }
  .year1-guide b {
    font: 800 9.5px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }

  .checklist {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .checklist-row {
    display: flex;
    align-items: center;
    gap: 5px;
    width: 100%;
    padding: 3px 6px;
    border-radius: 5px;
    background: var(--paper);
    border: 1px solid var(--ink);
    color: var(--ink);
    text-align: left;
    cursor: pointer;
    transition: transform 80ms ease;
  }
  .checklist-row:hover {
    transform: translateX(2px);
    background: var(--paper-warm);
  }
  .checklist-row.row-checked {
    background: var(--sage-tint);
    border-color: var(--sage-dark);
  }
  .checklist-row.row-warning {
    background: var(--alert-tint);
    border-color: var(--alert);
  }

  .row-num {
    font: 800 11px/1 var(--font-ui);
    color: var(--ink);
    flex-shrink: 0;
  }

  .row-text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    line-height: 1.1;
  }
  .row-title {
    font: 700 clamp(11px, 0.85vw, 12.5px)/1.15 var(--font-body);
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .row-sub {
    font: 500 10px/1.1 var(--font-body);
    color: var(--ink-soft);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .row-badge {
    flex-shrink: 0;
    font: 800 9px/1 var(--font-ui);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 2px 5px;
    border-radius: 3px;
    background: var(--ink);
    color: var(--card);
  }
  .row-badge.badge-clear {
    background: var(--sage-dark);
    color: var(--card);
  }
  .row-badge.badge-warn {
    background: var(--alert);
    color: var(--card);
  }

  .row-box {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    display: inline-grid;
    place-items: center;
    border: 1.5px solid var(--ink);
    border-radius: 3px;
    background: var(--card);
    font: 900 11px/1 var(--font-ui);
    color: var(--ink);
  }
  .row-box.box-checked {
    background: var(--sage-dark);
    color: var(--card);
    border-color: var(--ink);
  }
  .row-box.box-warn {
    background: var(--alert);
    color: var(--card);
    border-color: var(--ink);
  }

  .clearing-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 2px;
    border-top: 1px dashed var(--ink-soft);
    font: 600 10.5px/1.15 var(--font-ui);
    color: var(--ink);
  }
  .footer-warn,
  .footer-clear,
  .footer-idle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .footer-warn {
    color: var(--alert);
  }
  .footer-clear {
    color: var(--sage-dark);
  }
</style>
