<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import { deals, groups, HOUSE_SEATS, TO_PASS, FILIBUSTER_RULES_CATALOG } from '../engine/congress';
  import ScreenLayout from '../ui/ScreenLayout.svelte';
  import Hemicycle from '../ui/Hemicycle.svelte';
  import { getImminentDeadlines } from '../engine/deadlines';
  import FilibusterModal from '../ui/FilibusterModal.svelte';
  import AmendmentModal from '../ui/AmendmentModal.svelte';
  import type { ExplainerId } from '../content/explainers';

  let {
    session,
    question,
    onOpenMyth,
    onOpenExplainer,
  }: {
    session: Session;
    question: string;
    onOpenMyth?: (id: string) => void;
    onOpenExplainer?: (explainerId: ExplainerId) => void;
  } = $props();

  let showingFilibuster = $state(false);
  let showingAmendment = $state(false);

  const filibusterRule = $derived(session.draft.filibusterRule ?? session.current.filibusterRule ?? 'sixty_vote');
  const filibusterInfo = $derived(FILIBUSTER_RULES_CATALOG[filibusterRule]);
  const deadlines = $derived(getImminentDeadlines(session.current.turn, session.current));

  const whip = $derived(session.whip);
  const vote = $derived(session.vote);
</script>

<ScreenLayout {question}>
  {#snippet main()}
    {#if deadlines.length > 0}
      <div class="deadline-banner" role="alert" aria-label="Impending legislative deadlines">
        {#each deadlines as d (d.type)}
          <div class="deadline-item" class:critical={d.critical}>
            <div class="deadline-header">
              <span class="deadline-pill" class:critical={d.critical}>
                {d.critical ? 'CRITICAL DEADLINE' : 'DEADLINE COUNTDOWN'}
              </span>
              <span class="deadline-title">
                {d.title}: <b>{d.turnsRemaining} {d.turnsRemaining === 1 ? 'turn' : 'turns'} remaining</b>
              </span>
            </div>
            <span class="deadline-desc">{d.description}</span>
          </div>
        {/each}
      </div>
    {/if}
    <div class="card chamber">
      <div class="bill">
        <span class="label">This turn's bill</span>
        <b>{session.draft.pack ?? 'Your budget'}</b>
        {#if onOpenMyth}
          <button
            type="button"
            class="mirage-lever-btn"
            data-testid="mirage-lever-congress"
            onclick={() => onOpenMyth?.('veto_line_item')}
          >
            ⚡ Line-Item Veto Waste Lines
          </button>
        {/if}
      </div>
      <Hemicycle
        {whip}
        deals={session.draft.deals}
        houseSeatDelta={session.current.houseSeatDelta}
        socialDraft={session.draft.social}
        passed={Boolean(vote?.passed)}
      />
      <div class="legend">
        {#each groups as g (g.id)}
          <span><i style:background="var(--{g.color})"></i><b>{whip.byGroup[g.id]}</b>/{g.seats} · wants {g.wants.toLowerCase()}</span>
        {/each}
      </div>
    </div>
  {/snippet}
  {#snippet learn()}
    <button
      type="button"
      class="link"
      onclick={() => showingFilibuster = true}
      data-testid="open-filibuster-modal"
    >
      Senate Cloture: {filibusterInfo.threshold} votes ({filibusterInfo.name})
    </button>
    <button
      type="button"
      class="link"
      onclick={() => showingAmendment = true}
      data-testid="open-amendment-modal"
    >
      Article V Amendments {#if session.current.activeAmendment}· <b>Ratifying ({session.current.activeAmendment.ratifiedStates.length}/38)</b>{/if}
    </button>
    {#if onOpenMyth}
      <button
        type="button"
        class="ticket"
        onclick={() => onOpenMyth?.('debt_ceiling_default')}
      >
        Myth? Debt ceiling stops spending
      </button>
    {/if}
  {/snippet}
  {#snippet next()}
    <div class="card info" aria-live="polite">
      <span class="label">What it means</span>
      {#if session.over}
        <b>Your term is over</b><span class="line">Congress has gone home.</span>
      {:else if vote}
        <div class="stamp-wrap">
          <span class="stamp-slam" class:passed={vote.passed} class:failed={!vote.passed} data-testid="stamp-slam-badge">
            {vote.passed ? 'PASSED & STAMPED' : 'BLOCKED'}
          </span>
        </div>
        <b class={vote.passed ? 'good' : 'bad'}>{vote.passed ? `Passed ${vote.total}–${HOUSE_SEATS - vote.total}!` : `Failed ${vote.total}–${HOUSE_SEATS - vote.total}`}</b>
        <span class="line">{vote.passed ? `Your budget becomes law. +${vote.cloutBack} clout for the win.` : `You get ${vote.cloutBack} clout back. Try a deal first next time.`}</span>
      {:else if whip.short > 0}
        <b class="bad">{whip.short} votes short</b><span class="line">Make a deal or two, then call the vote.</span>
      {:else}
        <b class="good">Enough votes!</b><span class="line">Call the vote while you have them.</span>
      {/if}
    </div>
    {#if deadlines.length > 0}
      <div class="card deadline-action-card">
        <span class="label">Impending Deadline</span>
        {#each deadlines as d (d.type)}
          <b>{d.title}</b>
          <span class="line">{d.actionText}</span>
        {/each}
      </div>
    {/if}
    <div class="whip-head">
      <span class="label">Fastest way to pass</span>
      {#if !vote && whip.short > 0 && session.cheapestCoalition.dealsToAdd.length > 0}
        <button
          type="button"
          class="auto-whip-btn"
          data-testid="auto-whip-btn"
          disabled={!session.canAutoWhip}
          onclick={() => session.autoWhipCoalition()}
        >
          Auto-whip ({session.cheapestCoalition.dealsToAdd.length} {session.cheapestCoalition.dealsToAdd.length === 1 ? 'deal' : 'deals'}, {session.cheapestCoalition.additionalCost} clout)
        </button>
      {/if}
    </div>
    {#each deals as d (d.id)}
      {@const done = session.draft.deals.includes(d.id)}
      <div class="card deal">
        <div><b>{d.title}</b><span>{d.detail}</span></div>
        <button class="btn" disabled={done || !session.canDeal(d.id)} onclick={() => session.makeDeal(d.id)}>{done ? 'Done' : `${d.cost} clout`}</button>
      </div>
    {/each}
    <div class="spacer"></div>
    {#if !vote}<button class="stamp" disabled={session.over} onclick={() => session.callVote()}>Call the vote</button>{/if}
  {/snippet}
</ScreenLayout>

{#if showingFilibuster}
  <FilibusterModal {session} onClose={() => showingFilibuster = false} />
{/if}

{#if showingAmendment}
  <AmendmentModal {session} onClose={() => showingAmendment = false} />
{/if}

<style>
  .chamber { position: relative; padding: clamp(8px, 1.2vh, 14px) clamp(10px, 1.2vw, 16px); display: flex; flex-direction: column; gap: clamp(4px, 0.6vh, 8px); flex-grow: 1; min-height: 0; overflow: hidden; }
  .deadline-banner { display: flex; flex-direction: column; gap: 4px; padding: 6px 12px; background: var(--alert-tint); border: 2px solid var(--alert); border-radius: var(--r-md); margin-bottom: 2px; }
  .deadline-item { display: flex; flex-direction: column; gap: 2px; }
  .deadline-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .deadline-pill { font-family: var(--font-condensed); font-size: var(--text-xs); font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; padding: 1px 6px; background: var(--ink); color: var(--card); border-radius: var(--r-sm); }
  .deadline-pill.critical { background: var(--alert); }
  .deadline-title { font-family: var(--font-ui); font-size: var(--text-xs); color: var(--ink); }
  .deadline-desc { font-family: var(--font-body); font-size: var(--text-xs); color: var(--ink-soft); }
  .deadline-action-card { display: flex; flex-direction: column; gap: 4px; padding: 8px 12px; border-left: 4px solid var(--alert); background: var(--paper-dark); }
  .deadline-action-card b { font-family: var(--font-display); font-size: var(--text-sm); color: var(--alert); }
  .bill { display: flex; align-items: baseline; gap: 10px; }
  .bill b { font: 700 clamp(16px, 1.3vw, 20px) var(--font-display); }
  .stamp-wrap { margin: 2px 0 6px; }
  .stamp-slam {
    display: inline-block;
    padding: 3px 10px;
    font: 900 13px/1.1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-radius: var(--r-sm);
    box-shadow: 2px 2px 0 var(--ink);
    transform: rotate(-6deg);
    animation: stampSlam var(--dur-fast) var(--ease-pop);
  }
  .stamp-slam.passed {
    background: var(--sage);
    color: var(--card);
    border: 2px solid var(--ink);
  }
  .stamp-slam.failed {
    background: var(--alert);
    color: var(--card);
    border: 2px solid var(--ink);
  }
  @keyframes stampSlam {
    0% {
      transform: scale(1.85) rotate(-12deg);
      opacity: 0;
    }
    100% {
      transform: scale(1) rotate(-6deg);
      opacity: 1;
    }
  }
  .legend { display: flex; flex-wrap: wrap; gap: clamp(3px, 0.5vh, 6px) clamp(8px, 1vw, 18px); justify-content: center; font: 500 clamp(12px, 0.9vw, 15px) var(--font-ui); color: var(--ink-soft); max-width: 70ch; }
  .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid var(--ink); margin-right: 4px; }
  .legend b { color: var(--ink); }
  .info { display: flex; flex-direction: column; gap: clamp(2px, 0.4vh, 4px); padding: clamp(8px, 1.2vh, 14px); }
  .info b { font: 700 clamp(18px, 1.5vw, 24px) var(--font-display); }
  .line { font: 500 clamp(13px, 1vw, 16px)/1.3 var(--font-body); color: var(--ink-soft); max-width: 45ch; }
  .good { color: var(--sage); }
  .bad { color: var(--alert); }
  .deal { display: flex; align-items: center; gap: clamp(6px, 0.8vw, 10px); padding: clamp(6px, 1vh, 10px) clamp(8px, 1vw, 12px); }
  .deal div { display: flex; flex-direction: column; flex: 1; max-width: 30ch; }
  .deal b { font: 700 clamp(14px, 1.1vw, 17px)/1.15 var(--font-display); }
  .deal span { font-size: clamp(11px, 0.85vw, 13px); color: var(--ink-soft); }
  .deal .btn { white-space: nowrap; }
  .whip-head { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
  .auto-whip-btn {
    padding: 3px 8px;
    font: 700 11px/1.1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--gold);
    color: var(--ink);
    border: 1.5px solid var(--ink);
    border-radius: 4px;
    box-shadow: 1px 1px 0 var(--ink);
    cursor: pointer;
    white-space: nowrap;
  }
  .auto-whip-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .mirage-lever-btn {
    padding: 3px 8px;
    font: 700 11px/1.1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--paper);
    color: var(--alert-dark);
    border: 1.5px solid var(--alert);
    border-radius: var(--r-sm);
    box-shadow: 1px 1px 0 var(--ink);
    cursor: pointer;
    white-space: nowrap;
    margin-left: auto;
    transition: transform var(--dur-fast), background var(--dur-fast);
  }
  .mirage-lever-btn:hover {
    background: var(--gold);
    color: var(--ink);
    transform: translateY(-1px);
  }
  .btn:disabled { opacity: .45; cursor: not-allowed; }
  .spacer { flex-grow: 1; min-height: 4px; }
  .stamp { align-self: center; flex-shrink: 0; }
</style>
