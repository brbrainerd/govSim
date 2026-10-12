<script lang="ts">
  import { realQuarterLabel, termLabel } from '../engine/calendar';
  import { TOTAL_TURNS, type GameState } from '../engine/game';
  import CoinStack from './art/CoinStack.svelte';
  import Ribbon from './art/Ribbon.svelte';

  let { state, clout, title, score, party, onNextTurn }: { state: GameState; clout: number; title: string; score: number; party: string; onNextTurn: () => void } = $props();
  const circ = 2 * Math.PI * 19;
  // Round before choosing the sign so -0.04 shows as +0.0, never "−0.0 worse" (IN-04).
  const shown = $derived(Math.round(score * 10) / 10);
</script>

<header class="bar">
  <div class="resources">
    <button type="button" class="stat tip" aria-describedby="tip-approval">
      <svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true">
        <circle cx="29" cy="29" r="26" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5" />
        <circle cx="29" cy="29" r="19" fill="none" stroke="var(--ink)" stroke-width="8" opacity=".15" />
        <circle cx="29" cy="29" r="19" fill="none" stroke="var(--ink)" stroke-width="8"
          stroke-dasharray="{(circ * state.approval) / 100} {circ}" transform="rotate(-90 29 29)" />
        <path d="M29 19 l3 6.2 6.8 .9 -5 4.7 1.2 6.7 -6 -3.3 -6 3.3 1.2 -6.7 -5 -4.7 6.8 -.9 Z" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.2" />
      </svg>
      <span><span class="label">Approval</span><span class="num">{state.approval}%</span></span>
      <span role="tooltip" id="tip-approval">Real term: approval rating</span>
    </button>
    <button type="button" class="stat tip" aria-describedby="tip-clout">
      <CoinStack />
      <span><span class="label">Clout</span><span class="num" aria-live="polite">{clout}</span></span>
      <span role="tooltip" id="tip-clout">Real term: political capital</span>
    </button>
  </div>
  <div class="center">
    <Ribbon text={title} />
    <div class="score"><span class="star">★</span> <b class:worse={shown < 0}>{shown < 0 ? '−' : '+'}{Math.abs(shown).toFixed(1)}</b> {shown < 0 ? 'worse' : 'better'} than doing nothing <span class="star">★</span></div>
  </div>
  <div class="time">
    <div class="when-wrap">
      <div class="label">{party}</div>
      <button type="button" class="when tip" aria-describedby="tip-when">{state.turn >= TOTAL_TURNS ? 'Term over' : `Turn ${state.turn} of ${TOTAL_TURNS} · ${termLabel(state.turn)}`}
        <span role="tooltip" id="tip-when">Real calendar: {realQuarterLabel(state.turn)}. Your term is fictional and off-cycle.</span>
      </button>
    </div>
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
  /* Tooltips open on hover and on keyboard focus (WCAG 1.4.13), unlike title attributes. */
  .tip { position: relative; border-radius: var(--r-sm); background: none; border: 0; padding: 0; color: inherit; text-align: inherit; cursor: help; }
  .tip .label, .tip .num { display: block; }
  .stat.tip { font: inherit; }
  .tip:focus-visible { outline: 3px solid var(--gold-dark); outline-offset: 3px; }
  [role='tooltip'] { display: none; position: absolute; top: calc(100% + 6px); left: 0; z-index: 10; width: max-content; max-width: 280px; padding: 6px 10px; font: 500 14px/1.3 var(--font-body); color: var(--card); background: var(--ink); border-radius: var(--r-sm); text-align: left; }
  .when [role='tooltip'] { left: auto; right: 0; }
  .tip:hover [role='tooltip'], .tip:focus-visible [role='tooltip'] { display: block; }
  .when-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
  .when { font: 600 19px var(--font-display); color: var(--ink); }
  .next { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .next span { font: 400 14px var(--font-body); color: var(--ink-soft); }
</style>
