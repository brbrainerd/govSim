<script lang="ts">
  import { realQuarterLabel, termLabel } from '../engine/calendar';
  import { TOTAL_TURNS, type GameState, type ScoreBreakdown } from '../engine/game';
  import type { ScreenId } from '../app/screens';
  import type { StagedActionItem, VocabMode } from '../app/session.svelte';
  import CoinStack from './art/CoinStack.svelte';
  import Ribbon from './art/Ribbon.svelte';
  import CivicEmblem from './art/CivicEmblem.svelte';

  let {
    state: gameState,
    clout,
    title,
    score,
    party,
    evilMode = false,
    calmMode = false,
    vocabMode = 'plain',
    showMyths = true,
    stagedActions = [],
    canFastForward = false,
    onNextTurn,
    onFastForward,
    onSelectScreen,
    onClearStaged,
    onToggleCalm,
    onToggleVocab,
    onToggleMyths,
  }: {
    state: GameState;
    clout: number;
    title: string;
    score: number | ScoreBreakdown;
    party: string;
    evilMode?: boolean;
    calmMode?: boolean;
    vocabMode?: VocabMode;
    showMyths?: boolean;
    stagedActions?: readonly StagedActionItem[];
    canFastForward?: boolean;
    onNextTurn: () => void;
    onFastForward?: () => void;
    onSelectScreen?: (id: ScreenId) => void;
    onClearStaged?: () => void;
    onToggleCalm?: () => void;
    onToggleVocab?: () => void;
    onToggleMyths?: () => void;
  } = $props();

  let trayOpen = $state(false);

  const circ = 2 * Math.PI * 19;
  const totalScore = $derived(typeof score === 'number' ? score : score.total);
  const nowScore = $derived(typeof score === 'number' ? null : Math.round(score.now * 10) / 10);
  const laterScore = $derived(typeof score === 'number' ? null : Math.round(score.later * 10) / 10);
  // Round before choosing the sign so -0.04 shows as +0.0, never "−0.0 worse" (IN-04).
  const shown = $derived(Math.round(totalScore * 10) / 10);
  const hasUnsentWarning = $derived(stagedActions.some((a) => a.warning));
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape' && trayOpen) {
      trayOpen = false;
    }
  }}
/>

<header class="bar">
  <div class="resources">
    <button type="button" class="stat tip" aria-describedby="tip-approval">
      <svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true">
        <circle cx="29" cy="29" r="26" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5" />
        <circle cx="29" cy="29" r="19" fill="none" stroke="var(--ink)" stroke-width="8" opacity=".15" />
        <circle cx="29" cy="29" r="19" fill="none" stroke="var(--ink)" stroke-width="8"
          stroke-dasharray="{(circ * gameState.approval) / 100} {circ}" transform="rotate(-90 29 29)" />
        <path d="M29 19 l3 6.2 6.8 .9 -5 4.7 1.2 6.7 -6 -3.3 -6 3.3 1.2 -6.7 -5 -4.7 6.8 -.9 Z" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.2" />
      </svg>
      <span><span class="label">Approval</span><span class="num">{gameState.approval}%</span></span>
      <span role="tooltip" id="tip-approval">Real term: approval rating</span>
    </button>
    <button type="button" class="stat tip" aria-describedby="tip-clout">
      <CoinStack />
      <span><span class="label">Clout</span><span class="num" aria-live="polite">{clout}</span></span>
      <span role="tooltip" id="tip-clout">Real term: political capital</span>
    </button>
    {#if evilMode}
      <button type="button" class="stat tip evil-stat" aria-describedby="tip-stash" data-testid="status-offshore-stash">
        <span><span class="label">Stash</span><span class="num evil-num">${(gameState.evil?.offshoreStashBn ?? 0).toFixed(1)}B</span></span>
        <span role="tooltip" id="tip-stash">Personal wealth stashed in anonymous offshore accounts</span>
      </button>
      <button type="button" class="stat tip evil-stat" class:critical-heat={(gameState.evil?.heat ?? 0) >= 80} aria-describedby="tip-heat" data-testid="status-heat-meter">
        <span><span class="label">Heat</span><span class="num heat-num">{Math.round(gameState.evil?.heat ?? 0)}/100</span></span>
        <span role="tooltip" id="tip-heat">Public outrage and investigative scrutiny (60: Special Counsel, 80: Impeachment, 67 Senate Votes: Conviction)</span>
      </button>
    {/if}
  </div>
  <div class="center">
    <Ribbon text={title} />
    {#if evilMode}
      <div class="score evil-score" data-testid="evil-mode-indicator">
        <span class="star">★</span> <b>SATIRICAL EVIL MODE</b> <span class="star">★</span>
      </div>
      {#if gameState.evil?.specialCounselAppointed}
        <button
          type="button"
          class="special-counsel-badge tip"
          aria-describedby="tip-special-counsel"
          data-testid="status-special-counsel"
        >
          <CivicEmblem kind="warn" size={12} />
          <span>SPECIAL COUNSEL SUBPOENAS ACTIVE (−25 CLOUT/QTR)</span>
          <span role="tooltip" id="tip-special-counsel">Special counsel and congressional subpoenas drain 25 political clout each quarter</span>
        </button>
      {/if}
    {:else}
      <div class="score"><span class="star">★</span> <b class:worse={shown < 0}>{shown < 0 ? '−' : '+'}{Math.abs(shown).toFixed(1)}</b> {shown < 0 ? 'worse' : 'better'} than doing nothing <span class="star">★</span></div>
    {/if}
    <div class="score-sub">
      <span class="label party-label">{party}</span>
      {#if nowScore !== null && laterScore !== null}
        <span class="sep">·</span>
        <span>Now: <b>{nowScore >= 0 ? '+' : '−'}{Math.abs(nowScore).toFixed(1)}</b></span>
        <span class="sep">·</span>
        <span>In 10 years: <b>{laterScore >= 0 ? '+' : '−'}{Math.abs(laterScore).toFixed(1)}</b></span>
      {/if}
    </div>
  </div>
  <div class="time">
    <div class="when-wrap">
      <div class="when-top">
        <div class="staged-wrap">
          <button
            type="button"
            class="staged-pill"
            class:active={stagedActions.length > 0}
            class:warning={hasUnsentWarning}
            data-testid="staged-decisions-pill"
            aria-expanded={trayOpen}
            onclick={() => (trayOpen = !trayOpen)}
          >
            {#if hasUnsentWarning}
              <CivicEmblem kind="warn" size={11} /> {stagedActions.length} staged (unsent)
            {:else}
              {stagedActions.length} staged
            {/if}
          </button>
          {#if trayOpen}
            <div class="staged-popover" data-testid="staged-decisions-popover" role="region" aria-label="Staged decisions this turn">
              <div class="popover-head">
                <b>This turn's queue</b>
                {#if stagedActions.length > 0 && onClearStaged}
                  <button
                    type="button"
                    class="clear-staged-btn"
                    data-testid="clear-staged-btn"
                    onclick={() => {
                      onClearStaged();
                      trayOpen = false;
                    }}
                  >
                    Reset
                  </button>
                {/if}
              </div>
              {#if stagedActions.length === 0}
                <span class="empty-staged">No decisions queued yet.</span>
              {:else}
                <ul class="staged-list">
                  {#each stagedActions as item (item.id)}
                    <li>
                      <button
                        type="button"
                        class="staged-item-btn"
                        class:warn={item.warning}
                        data-testid={`staged-item-${item.id}`}
                        onclick={() => {
                          onSelectScreen?.(item.screen);
                          trayOpen = false;
                        }}
                      >
                        <span>{item.label}</span>
                        <span class="jump-arrow" aria-hidden="true">→</span>
                      </button>
                    </li>
                  {/each}
                </ul>
              {/if}
            </div>
          {/if}
        </div>
        <div class="party-calm-wrap">
          <button
            type="button"
            class="calm-pill vocab-pill"
            class:active={vocabMode === 'wonk'}
            data-testid="vocab-mode-toggle"
            aria-pressed={vocabMode === 'wonk'}
            onclick={onToggleVocab}
            title={vocabMode === 'wonk'
              ? 'Policy Wonk mode: showing statutory terms & citations. Click for Plain Talk.'
              : 'Plain Talk mode: everyday civics language. Click for Policy Wonk mode.'}
          >
            <CivicEmblem kind={vocabMode === 'wonk' ? 'grad' : 'speech'} size={12} />
            <span>{vocabMode === 'wonk' ? 'Policy Wonk' : 'Plain Talk'}</span>
          </button>
          <button
            type="button"
            class="calm-pill"
            class:active={calmMode}
            data-testid="calm-mode-toggle"
            aria-pressed={calmMode}
            onclick={onToggleCalm}
            title="Calm mode: disable decorative animations"
          >
            {calmMode ? 'Calm: ON' : 'Calm'}
          </button>
          {#if onToggleMyths}
            <button
              type="button"
              class="calm-pill myths-pill"
              class:active={!showMyths}
              data-testid="myths-toggle"
              aria-pressed={!showMyths}
              onclick={onToggleMyths}
              title={showMyths
                ? 'Civics myth prompts are visible when relevant. Click to hide myth prompts from all surfaces.'
                : 'Civics myth prompts are hidden across all surfaces. Click to re-enable contextual myth prompts.'}
            >
              {showMyths ? 'Myths: On' : 'Myths: Off'}
            </button>
          {/if}
        </div>
      </div>
      <button type="button" class="when tip" aria-describedby="tip-when">{gameState.turn >= TOTAL_TURNS ? 'Term over' : `Turn ${gameState.turn} of ${TOTAL_TURNS} · ${termLabel(gameState.turn)}`}
        <span role="tooltip" id="tip-when">Real calendar: {realQuarterLabel(gameState.turn)}. Your term is fictional and off-cycle.</span>
      </button>
    </div>
    <div class="next">
      <button class="stamp" onclick={onNextTurn} disabled={gameState.turn >= TOTAL_TURNS}>Next turn</button>
      <div class="next-sub">
        <span>3 mo</span>
        {#if onFastForward}
          <span class="sep">·</span>
          <button
            type="button"
            class="skip-btn"
            data-testid="fast-forward-btn"
            disabled={!canFastForward || gameState.turn >= TOTAL_TURNS}
            onclick={onFastForward}
          >
            Skip to event »
          </button>
        {/if}
      </div>
    </div>
  </div>
</header>

<style>
  .bar { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: start; gap: clamp(6px, 1vw, 14px); padding: clamp(4px, 0.8vh, 10px) clamp(10px, 1.5vw, 22px) clamp(2px, 0.4vh, 6px); max-width: 100vw; box-sizing: border-box; }
  .resources, .time { display: flex; align-items: center; gap: clamp(8px, 1.2vw, 18px); padding-top: 4px; min-width: 0; }
  .time { justify-content: flex-end; gap: clamp(6px, 1vw, 14px); }
  .stat { display: flex; align-items: center; gap: clamp(5px, 0.6vw, 8px); flex-shrink: 0; }
  .num { font-size: clamp(20px, 2.1vw, 32px); }
  .center { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .score { font: 400 clamp(13px, 1vw, 16px) var(--font-body); color: var(--ink); }
  .score b { color: var(--sage); font-family: var(--font-ui); font-size: clamp(15px, 1.2vw, 18px); }
  .score b.worse { color: var(--alert); }
  .star { color: var(--ink); font-size: 12px; }
  .score-sub { font: 400 clamp(11px, 0.85vw, 13px) var(--font-body); color: var(--ink-soft); display: flex; align-items: center; gap: 6px; }
  .score-sub b { font-family: var(--font-ui); color: var(--ink); font-weight: 600; }
  .sep { opacity: 0.5; }
  /* Tooltips open on hover and on keyboard focus (WCAG 1.4.13), unlike title attributes. */
  .tip { position: relative; border-radius: var(--r-sm); background: none; border: 0; padding: 0; color: inherit; text-align: inherit; cursor: help; }
  .tip .label, .tip .num { display: block; }
  .stat.tip { font: inherit; }
  .tip:focus-visible { outline: 3px solid var(--gold-dark); outline-offset: 3px; }
  [role='tooltip'] { display: none; position: absolute; top: calc(100% + 6px); left: 0; z-index: 10; width: max-content; max-width: 280px; padding: 6px 10px; font: 500 14px/1.3 var(--font-body); color: var(--card); background: var(--ink); border-radius: var(--r-sm); text-align: left; }
  .when [role='tooltip'] { left: auto; right: 0; }
  .tip:hover [role='tooltip'], .tip:focus-visible [role='tooltip'] { display: block; }
  .when-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
  .when-top { display: flex; align-items: center; gap: 6px; flex-wrap: nowrap; }
  .staged-wrap { position: relative; display: flex; align-items: center; }
  .staged-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font: 700 11.5px/1.1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 3px 9px;
    border-radius: 999px;
    border: 1.5px solid var(--ink);
    background: var(--paper);
    color: var(--ink-soft);
    white-space: nowrap;
    cursor: pointer;
  }
  .staged-pill.active {
    background: var(--gold);
    color: var(--ink);
  }
  .staged-pill.warning {
    background: var(--alert-tint);
    border-color: var(--alert);
    color: var(--alert);
  }
  .staged-popover {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 30;
    width: 240px;
    padding: 8px 10px;
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .popover-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.5px solid var(--ink);
    padding-bottom: 4px;
    font: 700 12px/1.2 var(--font-ui);
  }
  .clear-staged-btn {
    background: none;
    border: none;
    padding: 0;
    font: 700 11px/1 var(--font-ui);
    color: var(--alert);
    text-transform: uppercase;
    cursor: pointer;
    text-decoration: underline;
  }
  .empty-staged {
    font: 500 12px/1.3 var(--font-body);
    color: var(--ink-soft);
  }
  .staged-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .staged-item-btn {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 6px;
    font: 600 12px/1.2 var(--font-ui);
    background: var(--paper);
    color: var(--ink);
    border: 1.5px solid var(--ink);
    border-radius: 4px;
    cursor: pointer;
    text-align: left;
  }
  .staged-item-btn.warn {
    border-color: var(--alert);
    color: var(--alert);
  }
  .when { font: 600 clamp(14px, 1.2vw, 18px) var(--font-display); color: var(--ink); white-space: nowrap; }
  .next { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; }
  .next-sub { display: flex; align-items: center; gap: 5px; font: 400 12px var(--font-body); color: var(--ink-soft); white-space: nowrap; }
  .skip-btn {
    background: none;
    border: none;
    padding: 0;
    font: 700 12px/1 var(--font-ui);
    color: var(--ink);
    white-space: nowrap;
    cursor: pointer;
    text-decoration: underline;
  }
  .skip-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    text-decoration: none;
  }
  .evil-stat { border-left: 1px dashed var(--ink-soft); padding-left: 10px; }
  .evil-num { color: var(--gold-dark); font-weight: 700; }
  .heat-num { color: var(--ink); font-weight: 700; }
  .critical-heat .heat-num { color: var(--alert); font-weight: 800; }
  .evil-score { font: 600 clamp(12px, 0.9vw, 15px) var(--font-ui); color: var(--alert); letter-spacing: 0.04em; }
  .evil-score b { color: var(--alert-dark); }
  .special-counsel-badge {
    background: var(--alert);
    color: var(--paper);
    font: 700 clamp(10px, 0.75vw, 11px)/1 var(--font-ui);
    padding: 3px 8px;
    border-radius: var(--r-sm);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 1px solid var(--ink);
    box-shadow: 1px 1px 0 var(--ink);
    cursor: help;
  }
  .party-calm-wrap {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: nowrap;
    white-space: nowrap;
  }
  .party-label {
    font-size: 11px;
  }
  .calm-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 2.5px 8px;
    font: 700 10.5px/1.1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: .04em;
    background: var(--paper);
    color: var(--ink);
    border: 1.5px solid var(--ink);
    border-radius: 999px;
    white-space: nowrap;
    cursor: pointer;
    transition: background var(--dur-fast), color var(--dur-fast);
  }
  .calm-pill:hover, .calm-pill.active {
    background: var(--ink);
    color: var(--card);
  }
  :global([data-theme="evil"]) .calm-pill {
    background: var(--ink);
    color: var(--paper);
    border-color: var(--paper);
  }
  :global([data-theme="evil"]) .calm-pill:hover,
  :global([data-theme="evil"]) .calm-pill.active {
    background: var(--paper);
    color: var(--ink);
    border-color: var(--ink);
  }
</style>
