<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import { extractTurnAttributions, extractUnforeseenRipples } from '../app/attribution';
  import { formatLuckText, whyTextForMode } from '../content/text/why';
  import { termLabel } from '../engine/calendar';
  import { getBadge } from '../content/badges';
  import type { Look, Mood } from './art/Character.svelte';
  import CharacterPortrait from './art/CharacterPortrait.svelte';
  import Rosette from './art/Rosette.svelte';
  import CivicEmblem from './art/CivicEmblem.svelte';
  import SynergyBar from './SynergyBar.svelte';

  let { session, onClose }: { session: Session; onClose: () => void } = $props();

  const HISTORIAN_LOOK: Look = {
    skin: 'skin-3',
    hair: 'hair-4',
    hairStyle: 'bun',
    outfit: 'cardigan',
    suit: 'sky',
    tie: 'gold',
    glasses: true,
  };

  const IND_EMOJI: Record<string, string> = {
    income: '💵',
    empPop: '👷',
    inflation: '🛒',
    debtPct: '💳',
    lifeExp: '🏥',
    gini: '⚖️',
    security: '🛡️',
    trust: '🤝',
    approval: '🗳️',
    clout: '🏛️',
  };

  const attributions = $derived(extractTurnAttributions(session.current, session.previous));
  const ripples = $derived(extractUnforeseenRipples(session.current, session.previous));
  const luckText = $derived(formatLuckText(session.current.report.luck));
  const scoreDiff = $derived(Math.round(session.score.total * 10) / 10);
  const nowDiff = $derived(Math.round(session.score.now * 10) / 10);
  const laterDiff = $derived(Math.round(session.score.later * 10) / 10);
  const title = $derived(`${termLabel(session.current.turn)} Report`);
  const midtermLog = $derived(session.current.report.log.find((l) => l.kind === 'midterm'));
  const newlyEarnedBadges = $derived(
    session.newlyUnlockedBadges
      .map((id) => getBadge(id))
      .filter((b): b is NonNullable<typeof b> => Boolean(b)),
  );
  const advisorMood = $derived<Mood>(scoreDiff >= 0 ? 'confident' : 'stressed');
</script>

<div class="report-card">
  <img
    src="/assets/environments/report-oval-bg.jpg"
    alt=""
    aria-hidden="true"
    class="report-env-plate"
    data-testid="report-env-plate"
  />
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
            <span class="name-cell" role="cell"><span class="ind-icon" aria-hidden="true"><CivicEmblem kind={IND_EMOJI[item.id] ?? '📊'} size={15} /></span><span class="name">{item.name}</span></span>
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
            <span class="cause" role="cell">
              {session.vocabMode === 'wonk' && item.topCauseId !== 'none' && item.topCauseId !== 'mixed' && item.id !== 'security'
                ? whyTextForMode(item.topCauseId, 'wonk')
                : item.topCauseText}
            </span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Right Column: Rosette & Context -->
    <div class="side-col">
      <div class="rosette-box">
        <div class="rosette-pair">
          <Rosette size={68} />
          <CharacterPortrait
            look={HISTORIAN_LOOK}
            mood={advisorMood}
            pose="stand"
            prop="clipboard"
            size={48}
            ringColor={scoreDiff >= 0 ? 'sage' : 'alert'}
            testId="turn-report-portrait"
          />
        </div>
        <div class="rosette-label">Quarter Completed</div>
      </div>

      <SynergyBar {session} />

      {#if newlyEarnedBadges.length > 0}
        <div class="info-card milestone-box" data-testid="new-milestone-ribbon">
          <span class="label">★ Milestone Earned</span>
          {#each newlyEarnedBadges as b (b.id)}
            <div class="milestone-item">
              <span class="milestone-title">{b.title}</span>
              <p class="milestone-desc">{b.description}</p>
            </div>
          {/each}
        </div>
      {/if}

      <div class="info-card luck-box">
        <span class="label">Luck this quarter</span>
        <p class="luck-desc">{luckText}</p>
      </div>

      {#if ripples.length > 0}
        <div class="info-card ripple-box">
          <span class="label">Unforeseen consequence</span>
          {#each ripples as r (r.title)}
            <div class="ripple-item">
              <span class="ripple-title"><b>{r.title}</b> <em class="ripple-cause">({r.cause})</em></span>
              <p class="ripple-desc">{r.description}</p>
            </div>
          {/each}
        </div>
      {/if}

      {#if midtermLog}
        <div class="info-card midterm-box" data-testid="midterm-results-card">
          <span class="label">Midterm Results</span>
          <p class="midterm-headline">Voters have spoken</p>
          <div class="midterm-seats">
            <span class="seat-badge" class:negative={(midtermLog.amount ?? 0) < 0}>
              {midtermLog.detail}
            </span>
          </div>
          <p class="midterm-desc">
            Voters reacted to approval ratings and economic conditions, rebalancing congressional strength.
          </p>
        </div>
      {/if}

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
        <p class="kitchen-takeaway" data-testid="report-kitchen-table-summary">
          <CivicEmblem kind="🏠" size={14} /> {scoreDiff >= 0 ? 'Regular families are better off than on autopilot.' : 'Regular families are feeling more strain than on autopilot.'}
        </p>
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
    position: relative;
    display: flex;
    flex-direction: column;
    gap: clamp(8px, 1.2vh, 16px);
    width: 100%;
    height: 100%;
    padding: 8px;
    border-radius: var(--r-md);
    overflow: hidden;
  }

  .report-env-plate {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.22;
    pointer-events: none;
    z-index: 0;
  }

  .banner {
    position: relative;
    z-index: 1;
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
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(240px, 0.9fr);
    gap: clamp(14px, 2vw, 24px);
    align-items: start;
    min-height: 0;
  }

  .table-col {
    background: var(--card);
    border: 2px solid var(--ink);
    outline: 1px solid var(--ink);
    outline-offset: -5px;
    border-radius: var(--r-sm);
    padding: clamp(10px, 1.4vh, 16px) clamp(12px, 1.6vw, 20px);
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

  .name-cell {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
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
    gap: clamp(6px, 1vh, 12px);
    max-height: clamp(340px, 58vh, 520px);
    overflow-y: auto;
    padding-right: 2px;
  }

  .ripple-box {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ripple-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ripple-title {
    font: 700 clamp(11px, 0.9vw, 13px) var(--font-display);
    color: var(--ink);
  }
  .ripple-cause {
    font-style: italic;
    font-weight: 400;
    font-size: clamp(10px, 0.8vw, 11px);
    color: var(--ink-soft);
  }
  .ripple-desc {
    margin: 0;
    font: 400 clamp(11px, 0.85vw, 12px)/1.3 var(--font-body);
    color: var(--ink-soft);
  }

  .rosette-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .rosette-pair {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
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
  .kitchen-takeaway {
    margin: 5px 0 0;
    font: 500 11.5px/1.25 var(--font-body);
    color: var(--ink);
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

  .midterm-box {
    border-color: var(--gold);
    background: var(--card);
  }
  .midterm-headline {
    margin: 0 0 6px 0;
    font: 700 clamp(13px, 1vw, 15px) var(--font-display);
    color: var(--ink);
  }
  .midterm-seats {
    display: flex;
    margin-bottom: 6px;
  }
  .seat-badge {
    font: 700 13px var(--font-ui);
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--sage);
    color: var(--card);
  }
  .seat-badge.negative {
    background: var(--alert);
  }
  .midterm-desc {
    margin: 0;
    font: 400 clamp(11px, 0.85vw, 12px)/1.3 var(--font-body);
    color: var(--ink-soft);
  }

  .milestone-box {
    border-color: var(--gold);
    background: var(--gold-tint);
  }
  .milestone-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .milestone-title {
    font: 700 clamp(12px, 0.95vw, 14px) var(--font-display);
    color: var(--ink);
  }
  .milestone-desc {
    margin: 0;
    font: 400 clamp(11px, 0.85vw, 12px)/1.3 var(--font-body);
    color: var(--ink);
  }
</style>
