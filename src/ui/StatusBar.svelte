<script lang="ts">
  import type { GameState } from '../engine/game';
  import { TOTAL_TURNS, turnLabel } from '../engine/game';

  let { state, title, onNextTurn }: { state: GameState; title: string; onNextTurn: () => void } = $props();
  const circ = 2 * Math.PI * 16;
</script>

<header class="bar">
  <div class="resources">
    <div class="stat" title="Real term: approval rating">
      <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r="21" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
        <circle cx="26" cy="26" r="16" fill="none" stroke="var(--paper)" stroke-width="7" />
        <circle cx="26" cy="26" r="16" fill="none" stroke="var(--gold)" stroke-width="7"
          stroke-dasharray="{(circ * state.approval) / 100} {circ}" transform="rotate(-90 26 26)" />
      </svg>
      <div><div class="label">Approval</div><div class="num">{state.approval}%</div></div>
    </div>
    <div class="stat" title="Real term: political capital">
      <div><div class="label">Clout</div><div class="num">{state.clout}</div></div>
    </div>
  </div>
  <h1 class="ribbon">{title}</h1>
  <div class="time">
    <div><div class="label">Turn {state.turn} of {TOTAL_TURNS}</div><div class="h when">{turnLabel(state.turn)}</div></div>
    <div class="next">
      <button class="stamp" onclick={onNextTurn} disabled={state.turn >= TOTAL_TURNS}>Next turn</button>
      <span>3 months pass</span>
    </div>
  </div>
</header>

<style>
  .bar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; padding: 0 22px; height: 84px; }
  .resources, .time { display: flex; align-items: center; gap: 22px; }
  .time { justify-content: flex-end; text-align: right; gap: 16px; }
  .stat { display: flex; align-items: center; gap: 10px; }
  .num { font-size: 30px; }
  .when { font-size: 20px; }
  .next { display: flex; flex-direction: column; align-items: center; }
  .next span { font-size: 13px; color: var(--ink-soft); margin-top: 4px; }
</style>
