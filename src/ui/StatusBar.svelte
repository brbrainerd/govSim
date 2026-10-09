<script lang="ts">
  import { TOTAL_TURNS, turnLabel, type GameState } from '../engine/game';
  import CoinStack from './art/CoinStack.svelte';
  import Ribbon from './art/Ribbon.svelte';

  let { state, clout, title, score, onNextTurn }: { state: GameState; clout: number; title: string; score: number; onNextTurn: () => void } = $props();
  const circ = 2 * Math.PI * 19;
</script>

<header class="bar">
  <div class="resources">
    <div class="stat" title="Real term: approval rating">
      <svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true">
        <circle cx="29" cy="29" r="26" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5" />
        <circle cx="29" cy="29" r="19" fill="none" stroke="var(--ink)" stroke-width="8" opacity=".15" />
        <circle cx="29" cy="29" r="19" fill="none" stroke="var(--ink)" stroke-width="8"
          stroke-dasharray="{(circ * state.approval) / 100} {circ}" transform="rotate(-90 29 29)" />
        <path d="M29 19 l3 6.2 6.8 .9 -5 4.7 1.2 6.7 -6 -3.3 -6 3.3 1.2 -6.7 -5 -4.7 6.8 -.9 Z" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.2" />
      </svg>
      <div><div class="label">Approval</div><div class="num">{state.approval}%</div></div>
    </div>
    <div class="stat" title="Real term: political capital">
      <CoinStack />
      <div><div class="label">Clout</div><div class="num" aria-live="polite">{clout}</div></div>
    </div>
  </div>
  <div class="center">
    <Ribbon text={title} />
    <div class="score"><span class="star">★</span> <b class:worse={score < 0}>{score < 0 ? '−' : '+'}{Math.abs(score).toFixed(1)}</b> {score < 0 ? 'worse' : 'better'} than doing nothing <span class="star">★</span></div>
  </div>
  <div class="time">
    <div class="when">Turn {state.turn} of {TOTAL_TURNS} · {turnLabel(state.turn)}</div>
    <div class="next">
      <button class="stamp" onclick={onNextTurn} disabled={state.turn >= TOTAL_TURNS}>Next turn</button>
      <span>3 months pass</span>
    </div>
  </div>
</header>

<style>
  .bar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; gap: 16px; padding: 14px 24px 6px; }
  .resources, .time { display: flex; align-items: center; gap: 26px; padding-top: 6px; }
  .time { justify-content: flex-end; gap: 18px; }
  .stat { display: flex; align-items: center; gap: 10px; }
  .num { font-size: 36px; }
  .center { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .score { font: 400 16px var(--font-body); color: var(--ink); }
  .score b { color: var(--sage); font-family: var(--font-ui); font-size: 18px; }
  .score b.worse { color: var(--alert); }
  .star { color: var(--ink); font-size: 12px; }
  .when { font: 600 19px var(--font-display); color: var(--ink); }
  .next { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .next span { font: 400 14px var(--font-body); color: var(--ink-soft); }
</style>
