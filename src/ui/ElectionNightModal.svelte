<script lang="ts">
  import { onMount } from 'svelte';
  import type { ElectionOutcome, StateRollCallItem } from '../engine/election';
  import { PRESIDENT_LOOKS, type Look, type Mood } from './art/Character.svelte';
  import CharacterPortrait from './art/CharacterPortrait.svelte';
  import ContingentElectionModal from './ContingentElectionModal.svelte';
  import ElectionResultCard from './ElectionResultCard.svelte';
  import Overlay from './Overlay.svelte';

  let {
    outcome,
    autopilotOutcome,
    reasons,
    oncontinue,
    onretry,
  }: {
    outcome: ElectionOutcome;
    autopilotOutcome: ElectionOutcome;
    reasons: readonly string[];
    oncontinue: () => void;
    onretry: () => void;
  } = $props();

  const ANCHOR_LOOK: Look = {
    skin: 'skin-2',
    hair: 'hair-1',
    hairStyle: 'parted',
    outfit: 'blazer',
    suit: 'ink',
    tie: 'alert',
    glasses: true,
  };

  let showContingentModal = $state(false);
  let animationComplete = $state(false);
  let currentCallIndex = $state(0);

  // Filter items into called vs pending
  const calledItems = $derived(outcome.rollCall.slice(0, currentCallIndex));
  const latestCall = $derived<StateRollCallItem | null>(
    currentCallIndex > 0 ? (outcome.rollCall[currentCallIndex - 1] ?? null) : null,
  );

  // Live running counts
  const currentRunningPlayerEV = $derived(
    animationComplete
      ? outcome.playerEV
      : calledItems.reduce((acc, item) => (item.winner === 'player' ? acc + item.electoralVotes : acc), 0),
  );
  const currentRunningOpponentEV = $derived(
    animationComplete
      ? outcome.opponentEV
      : calledItems.reduce((acc, item) => (item.winner === 'opponent' ? acc + item.electoralVotes : acc), 0),
  );

  const playerMood = $derived<Mood>(
    currentRunningPlayerEV >= 270
      ? 'triumphant'
      : currentRunningPlayerEV >= currentRunningOpponentEV
        ? 'confident'
        : 'stressed',
  );
  const opponentMood = $derived<Mood>(
    currentRunningOpponentEV >= 270
      ? 'triumphant'
      : currentRunningOpponentEV > currentRunningPlayerEV
        ? 'confident'
        : 'stressed',
  );

  let timer: ReturnType<typeof setTimeout> | null = null;

  function skipAnimation() {
    if (timer) clearTimeout(timer);
    currentCallIndex = outcome.rollCall.length;
    animationComplete = true;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.code === 'Space' && !animationComplete) {
      e.preventDefault();
      skipAnimation();
    }
  }

  onMount(() => {
    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      skipAnimation();
      return;
    }

    // Step 1: Batch call all safe/non-battleground states in the first tick
    const safeCount = outcome.rollCall.filter((c) => !c.isBattleground).length;
    currentCallIndex = Math.min(safeCount, outcome.rollCall.length);

    if (currentCallIndex >= outcome.rollCall.length) {
      animationComplete = true;
      return;
    }

    // Step 2: Step through battleground swing states one by one
    function advanceCall() {
      if (currentCallIndex < outcome.rollCall.length) {
        currentCallIndex++;
        timer = setTimeout(advanceCall, 350);
      } else {
        animationComplete = true;
      }
    }

    timer = setTimeout(advanceCall, 500);

    return () => {
      if (timer) clearTimeout(timer);
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<Overlay title="Decision Night: Electoral College Reelection" onClose={skipAnimation}>
  <div class="election-night-shell" data-testid="election-night-modal">
    <!-- Breaking Broadcast Ribbon with Live News Anchor (VIGNETTE-02) -->
    <div class="broadcast-ribbon" aria-hidden="true">
      <div class="anchor-badge" data-testid="election-anchor-vignette">
        <CharacterPortrait
          look={ANCHOR_LOOK}
          mood="confident"
          pose="desk"
          prop="earpiece"
          size={36}
          ringColor="gold"
        />
      </div>
      <span class="pulse-indicator">● LIVE</span>
      <span class="ribbon-text election-title">PRESIDENTIAL ELECTION DECISION NIGHT</span>
      {#if !animationComplete}
        <button class="skip-btn" onclick={skipAnimation} data-testid="skip-election-night-btn">
          Skip to Final Result [Space]
        </button>
      {/if}
    </div>

    <!-- Live 270 Bar Tracker -->
    <div class="tracker-card">
      <div class="ev-stat-row">
        <div class="ev-team-wrap player">
          <div data-testid="election-player-portrait">
            <CharacterPortrait
              look={PRESIDENT_LOOKS[0]!.look}
              mood={playerMood}
              pose={currentRunningPlayerEV >= 270 ? 'celebrate' : 'stand'}
              size={44}
              ringColor="sage"
            />
          </div>
          <div class="ev-team player">
            <span class="team-label">You (Projected)</span>
            <span class="team-score" data-testid="live-player-ev">{currentRunningPlayerEV} EV</span>
          </div>
        </div>
        <div class="milestone-badge">
          <span class="threshold">270 TO WIN</span>
        </div>
        <div class="ev-team-wrap opponent">
          <div class="ev-team opponent">
            <span class="team-label">Opponent</span>
            <span class="team-score" data-testid="live-opponent-ev">{currentRunningOpponentEV} EV</span>
          </div>
          <div data-testid="election-opponent-portrait">
            <CharacterPortrait
              look={PRESIDENT_LOOKS[3]!.look}
              mood={opponentMood}
              pose={currentRunningOpponentEV >= 270 ? 'celebrate' : 'crossed'}
              size={44}
              ringColor="alert"
            />
          </div>
        </div>
      </div>

      <div
        class="progress-bar-container"
        role="progressbar"
        aria-label="Electoral College 270 to win progress"
        aria-valuenow={currentRunningPlayerEV}
        aria-valuemin={0}
        aria-valuemax={538}
      >
        <div class="bar-fill player" style="width: {(currentRunningPlayerEV / 538) * 100}%"></div>
        <div class="center-marker" style="left: {(270 / 538) * 100}%"></div>
        <div class="bar-fill opponent" style="width: {(currentRunningOpponentEV / 538) * 100}%"></div>
      </div>
    </div>

    <!-- Active Broadcast Feed or Result Card -->
    {#if !animationComplete}
      <div class="broadcast-feed" data-testid="broadcast-feed">
        <div class="feed-headline">
          CALLING THE STATES
        </div>
        {#if latestCall}
          <div class="latest-call-box {latestCall.winner}">
            <span class="projected-badge">PROJECTED WINNER</span>
            <div class="state-call-name">
              {latestCall.name} ({latestCall.electoralVotes} EV)
            </div>
            <div class="call-attribution">
              Called for {latestCall.winner === 'player' ? 'YOU' : 'OPPONENT'}
            </div>
          </div>
        {/if}

        <div class="called-ticker">
          <span class="ticker-title">RECENT CALLS:</span>
          <div class="ticker-chips">
            {#each calledItems.slice(-8).reverse() as item}
              <span class="mini-chip {item.winner}">
                {item.code} ({item.electoralVotes})
              </span>
            {/each}
          </div>
        </div>
      </div>
    {:else}
      <!-- Final Official Result Card -->
      <ElectionResultCard
        {outcome}
        {autopilotOutcome}
        {reasons}
        {oncontinue}
        {onretry}
        onviewcontingent={outcome.isTie ? () => (showContingentModal = true) : undefined}
      />
    {/if}
  </div>
</Overlay>

{#if showContingentModal && outcome.contingentResult}
  <ContingentElectionModal
    contingentResult={outcome.contingentResult}
    onClose={() => (showContingentModal = false)}
  />
{/if}

<style>
  .election-night-shell {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-height: 85vh;
    overflow-y: auto;
  }

  .broadcast-ribbon {
    background: var(--ink);
    color: var(--paper);
    padding: 10px 16px;
    border-radius: var(--r-sm);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .pulse-indicator {
    background: var(--alert);
    color: var(--paper);
    padding: 2px 8px;
    border-radius: var(--r-sm);
    font-family: var(--font-condensed);
    font-size: 11px;
    font-weight: bold;
    letter-spacing: 0.05em;
  }

  .ribbon-text {
    flex: 1;
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 0.04em;
  }

  .skip-btn {
    padding: 4px 10px;
    background: var(--card-alt);
    color: var(--ink);
    border: 1px solid var(--ink);
    border-radius: var(--r-sm);
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: bold;
    cursor: pointer;
  }

  .skip-btn:hover {
    background: var(--paper);
  }

  .tracker-card {
    background: var(--card);
    border: 1.5px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ev-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .anchor-badge {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .ev-team-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ev-team {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ev-team.player {
    text-align: left;
  }

  .ev-team.opponent {
    text-align: right;
  }

  .team-label {
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: bold;
    color: var(--ink-soft);
    text-transform: uppercase;
  }

  .team-score {
    font-family: var(--font-display);
    font-size: 26px;
    font-weight: bold;
    color: var(--ink);
  }

  .milestone-badge {
    background: var(--card-alt);
    border: 1px solid var(--ink);
    padding: 4px 10px;
    border-radius: var(--r-sm);
    font-family: var(--font-condensed);
    font-size: 12px;
    font-weight: bold;
    color: var(--ink);
  }

  .progress-bar-container {
    position: relative;
    height: 18px;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: var(--r-sm);
    display: flex;
    justify-content: space-between;
    overflow: hidden;
  }

  .bar-fill.player {
    height: 100%;
    display: block;
    background: var(--sage);
    transition: width 0.3s ease;
  }

  .bar-fill.opponent {
    height: 100%;
    display: block;
    background: var(--alert);
    transition: width 0.3s ease;
  }

  .center-marker {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--ink);
    transform: translateX(-50%);
    z-index: 2;
  }

  .broadcast-feed {
    background: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    min-height: 200px;
    justify-content: center;
  }

  .feed-headline {
    font-family: var(--font-condensed);
    font-size: 12px;
    font-weight: bold;
    letter-spacing: 0.1em;
    color: var(--ink-soft);
  }

  .latest-call-box {
    padding: 16px 28px;
    border: 2px solid var(--ink);
    border-radius: var(--r-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    box-shadow: 3px 3px 0 var(--ink);
    background: var(--card);
    color: var(--ink);
  }

  .latest-call-box.player {
    border-color: var(--sage);
    border-width: 3px;
  }

  .latest-call-box.opponent {
    border-color: var(--alert);
    border-width: 3px;
  }

  .projected-badge {
    font-family: var(--font-condensed);
    font-size: 11px;
    font-weight: bold;
    letter-spacing: 0.08em;
    opacity: 0.9;
  }

  .state-call-name {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: bold;
  }

  .call-attribution {
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: bold;
  }

  .called-ticker {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }

  .ticker-title {
    font-family: var(--font-condensed);
    font-size: 11px;
    font-weight: bold;
    color: var(--ink-soft);
  }

  .ticker-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .mini-chip {
    padding: 2px 6px;
    border-radius: var(--r-sm);
    font-family: var(--font-condensed);
    font-size: 11px;
    font-weight: bold;
    background: var(--card);
    color: var(--ink);
    border: 1px solid var(--ink);
  }

  .mini-chip.player {
    border: 1.5px solid var(--sage);
    color: var(--ink);
  }

  .mini-chip.opponent {
    border: 1.5px solid var(--alert);
    color: var(--ink);
  }
</style>
