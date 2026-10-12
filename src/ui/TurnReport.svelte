<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import { extractTurnAttributions } from '../app/attribution';
  import { formatLuckText } from '../content/text/why';
  import { termLabel } from '../engine/calendar';
  import Rosette from './art/Rosette.svelte';

  let { session, onClose }: { session: Session; onClose: () => void } = $props();

  const attributions = $derived(extractTurnAttributions(session.current, session.previous));
  const luckText = $derived(formatLuckText(session.current.report.luck));
  const scoreDiff = $derived(Math.round(session.score.total * 10) / 10);
  const nowDiff = $derived(Math.round(session.score.now * 10) / 10);
  const laterDiff = $derived(Math.round(session.score.later * 10) / 10);
  const title = $derived(`${termLabel(session.current.turn)} Report`);
</script>

<div class="report-card">
  <div class="banner">
    <div class="banner-tail left" aria-hidden="true"></div>
    <h2 id="turn-report-title">{title}</h2>
    <div class="banner-tail right" aria-hidden="true"></div>
  </div>

  <div class="content-split">
    <!-- Left Column: Attribution Table -->
    <div class="table-col">
      <div class="rows" role="table" aria-label="Quarterly Indicator Results">
        {#each [...attributions.indicators, attributions.approval, attributions.clout] as item}
          <div class="row" role="row">
            <span class="name" role="cell">{item.name}</span>
            <span class="val num" role="cell">{item.formattedValue}</span>
            <span
              class="badge {item.direction}"
              class:positive={item.isPositive}
              class:negative={!item.isPositive}
              role="cell"
            >
              {#if item.direction === 'up'}
                <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                  <path d="M8 2 L14 10 H10 V14 H6 V10 H2 Z" fill="currentColor" />
                </svg>
              {:else if item.direction === 'down'}
                <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                  <path d="M8 14 L2 6 H6 V2 H10 V6 H14 Z" fill="currentColor" />
                </svg>
              {:else}
                <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                  <path d="M2 7 H14 V9 H2 Z" fill="currentColor" />
                </svg>
              {/if}
              <span>{item.direction}</span>
            </span>
            <span class="cause" role="cell">{item.topCauseText}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Right Column: Rosette & Context -->
    <div class="side-col">
      <div class="rosette-box">
        <Rosette size={90} />
        <div class="rosette-label">Quarter Completed</div>
      </div>

      <div class="info-card luck-box">
        <span class="label">Luck this quarter</span>
        <p class="luck-desc">{luckText}</p>
      </div>

      <div class="info-card score-box">
        <span class="label">Vs doing nothing</span>
        <div class="score-main">
          <b class:worse={scoreDiff < 0}>
            {scoreDiff >= 0 ? '+' : '−'}{Math.abs(scoreDiff).toFixed(1)}
          </b>
          <span>{scoreDiff >= 0 ? 'better' : 'worse'} than doing nothing</span>
        </div>
        <div class="score-breakdown">
          <span>Now: <b>{nowDiff >= 0 ? '+' : '−'}{Math.abs(nowDiff).toFixed(1)}</b></span>
          <span class="sep">·</span>
          <span>10 yrs: <b>{laterDiff >= 0 ? '+' : '−'}{Math.abs(laterDiff).toFixed(1)}</b></span>
        </div>
      </div>

      <div class="action-box">
        <button type="button" class="stamp primary-stamp" onclick={onClose}>
          Continue term
        </button>
        <span class="action-sub">Return to Oval Office</span>
      </div>
    </div>
  </div>
</div>

<style>
  .report-card {
    display: flex;
    flex-direction: column;
    gap: clamp(8px, 1.2vh, 16px);
    width: 100%;
    height: 100%;
  }

  .banner {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }
  .banner h2 {
    margin: 0;
    padding: 6px 28px 8px;
    background: var(--gold);
    color: var(--ink);
    font: 700 clamp(20px, 2.2vw, 28px)/1 var(--font-display);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border: 2px solid var(--ink);
    box-shadow: 2px 2px 0 var(--ink);
  }
  .banner-tail {
    width: 24px;
    height: 100%;
  }

  .content-split {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(240px, 0.9fr);
    gap: clamp(14px, 2vw, 24px);
    align-items: start;
    min-height: 0;
  }

  .table-col {
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    padding: clamp(8px, 1.2vh, 14px) clamp(10px, 1.4vw, 18px);
    overflow-y: auto;
    max-height: clamp(340px, 58vh, 520px);
  }

  .rows {
    display: flex;
    flex-direction: column;
    gap: clamp(4px, 0.6vh, 8px);
  }

  .row {
    display: grid;
    grid-template-columns: minmax(130px, 1fr) auto auto minmax(130px, 1fr);
    align-items: center;
    gap: clamp(6px, 1vw, 12px);
    padding: clamp(3px, 0.4vh, 6px) 0;
    border-bottom: 1px dashed var(--dot);
    font: 400 clamp(12px, 0.95vw, 14px) var(--font-body);
  }
  .row:last-child {
    border-bottom: none;
  }

  .name {
    font-weight: 600;
    color: var(--ink);
    white-space: nowrap;
  }

  .val {
    font-size: clamp(14px, 1.1vw, 16px);
    font-weight: 700;
    color: var(--ink);
    text-align: right;
    white-space: nowrap;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 6px;
    border-radius: 4px;
    font: 700 11px var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .badge.positive {
    background: var(--sage-tint);
    color: var(--sage-dark);
  }
  .badge.negative {
    background: var(--alert-tint);
    color: var(--alert-dark);
  }
  .badge.flat {
    background: var(--ink-tint);
    color: var(--ink-soft);
  }

  .cause {
    color: var(--ink-soft);
    font-size: clamp(11px, 0.85vw, 13px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .side-col {
    display: flex;
    flex-direction: column;
    gap: clamp(8px, 1.2vh, 14px);
  }

  .rosette-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .rosette-label {
    font: 700 14px var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ink);
  }

  .info-card {
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    padding: clamp(8px, 1vh, 12px) clamp(10px, 1.2vw, 16px);
  }
  .info-card .label {
    display: block;
    margin-bottom: 4px;
  }

  .luck-desc {
    margin: 0;
    font: 400 clamp(12px, 0.9vw, 13px)/1.4 var(--font-body);
    color: var(--ink);
    max-width: 65ch;
  }

  .score-main {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font: 400 clamp(12px, 0.9vw, 14px) var(--font-body);
    color: var(--ink);
  }
  .score-main b {
    font-family: var(--font-ui);
    font-size: clamp(20px, 1.8vw, 26px);
    color: var(--sage-dark);
  }
  .score-main b.worse {
    color: var(--alert);
  }

  .score-breakdown {
    display: flex;
    align-items: center;
    gap: 6px;
    font: 400 12px var(--font-body);
    color: var(--ink-soft);
    margin-top: 4px;
  }
  .score-breakdown b {
    color: var(--ink);
  }
  .sep {
    opacity: 0.5;
  }

  .action-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    margin-top: clamp(2px, 0.5vh, 6px);
  }
  .primary-stamp {
    width: 100%;
    padding: 12px 20px;
    font-size: 19px;
  }
  .action-sub {
    font: 400 12px var(--font-body);
    color: var(--ink-soft);
  }
</style>
