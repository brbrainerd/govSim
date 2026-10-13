<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import { downloadSave } from '../app/save';
  import {
    classifyHistorianVerdict,
    simulateTenYearLegacy,
    type QuarterlyLegacyPoint,
  } from '../engine/election';
  import { BADGES } from '../content/badges';
  import ScreenLayout from '../ui/ScreenLayout.svelte';

  let {
    session,
    onRestart,
  }: {
    session: Session;
    onRestart?: () => void;
  } = $props();

  type TabId = 'overview' | 'economy' | 'legislation' | 'voters' | 'milestones';
  type IndicatorId = 'gdpGrowth' | 'debtPct' | 'unemployment' | 'inflation';

  let activeTab = $state<TabId>('overview');
  let activeIndicator = $state<IndicatorId>('gdpGrowth');
  let showTable = $state(false);

  const autoFinal = $derived(session.autopilot[session.autopilot.length - 1]!);
  const legacyData = $derived(simulateTenYearLegacy(session.current, autoFinal));
  const verdict = $derived(classifyHistorianVerdict(legacyData.scoreVsAutopilot));

  const yearsCompleted = $derived(session.history.length > 16 ? 8 : 4);
  const totalTurnsPlayed = $derived(session.history.length);

  const formatDelta = (val: number): string => (val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1));

  const indicators: { id: IndicatorId; label: string; unit: string; getVal: (p: QuarterlyLegacyPoint) => number }[] = [
    { id: 'gdpGrowth', label: 'GDP Growth', unit: '%', getVal: (p) => p.gdpGrowth },
    { id: 'debtPct', label: 'Debt / GDP', unit: '%', getVal: (p) => p.debtPct },
    { id: 'unemployment', label: 'Unemployment', unit: '%', getVal: (p) => p.unemployment },
    { id: 'inflation', label: 'Inflation', unit: '%', getVal: (p) => p.inflation },
  ];

  const currentInd = $derived(indicators.find((i) => i.id === activeIndicator)!);

  // SVG Chart Geometry
  const chartWidth = 520;
  const chartHeight = 200;
  const padLeft = 40;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 30;

  const xMin = padLeft;
  const xMax = chartWidth - padRight;
  const yTop = padTop;
  const yBottom = chartHeight - padBottom;

  const chartPoints = $derived.by(() => {
    const youVals = legacyData.playerSeries.map(currentInd.getVal);
    const autoVals = legacyData.autopilotSeries.map(currentInd.getVal);
    const allVals = [...youVals, ...autoVals];

    const minV = Math.min(...allVals);
    const maxV = Math.max(...allVals);
    const span = maxV - minV || 1;
    const padding = span * 0.15;
    const yMin = minV - padding;
    const yMax = maxV + padding;
    const yRange = yMax - yMin || 1;

    const getY = (val: number) => yBottom - ((val - yMin) / yRange) * (yBottom - yTop);
    const len = legacyData.playerSeries.length;
    const getX = (idx: number) => xMin + (idx / Math.max(1, len - 1)) * (xMax - xMin);

    const makePath = (vals: number[]) =>
      vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`).join(' ');

    const youPath = makePath(youVals);
    const autoPath = makePath(autoVals);

    const lastYou = youVals[youVals.length - 1] ?? 0;
    const lastAuto = autoVals[autoVals.length - 1] ?? 0;

    return {
      youPath,
      autoPath,
      lastYou,
      lastAuto,
      minV,
      maxV,
      zeroY: yMin <= 0 && yMax >= 0 ? getY(0) : null,
    };
  });
</script>

<div class="end-screen halftone" data-testid="end-screen">
  <!-- Zone 1: Status (Top Bar) -->
  <header class="end-header">
    <div class="header-left">
      <span class="presidency-title">PRESIDENTIAL LEGACY REVIEW</span>
      <span class="term-badge">{yearsCompleted} Years Completed</span>
    </div>
    <div class="header-stats">
      <div class="stat-pill">
        <span class="stat-lbl">Final Approval</span>
        <span class="stat-num">{session.current.approval}%</span>
      </div>
      <div class="stat-pill">
        <span class="stat-lbl">Final Clout</span>
        <span class="stat-num">{session.clout}</span>
      </div>
      <div class="score-pill">
        <span class="stat-lbl">Score vs Doing Nothing</span>
        <span class="stat-num highlight" data-testid="headline-score">{formatDelta(legacyData.scoreVsAutopilot.total)}</span>
      </div>
    </div>
  </header>

  <div class="zones">
    <!-- Zone 2: Where (Left Navigation) -->
    <nav class="end-nav" aria-label="Presidential Record Sections">
      <span class="nav-heading">Presidential Record</span>
      <button
        type="button"
        class="nav-tab"
        class:active={activeTab === 'overview'}
        onclick={() => (activeTab = 'overview')}
      >
        <span>Overview</span>
      </button>
      <button
        type="button"
        class="nav-tab"
        class:active={activeTab === 'economy'}
        onclick={() => (activeTab = 'economy')}
      >
        <span>Economic Record</span>
      </button>
      <button
        type="button"
        class="nav-tab"
        class:active={activeTab === 'legislation'}
        onclick={() => (activeTab = 'legislation')}
      >
        <span>Legislative Acts</span>
      </button>
      <button
        type="button"
        class="nav-tab"
        class:active={activeTab === 'voters'}
        onclick={() => (activeTab = 'voters')}
      >
        <span>Voter Coalition</span>
      </button>
      <button
        type="button"
        class="nav-tab"
        class:active={activeTab === 'milestones'}
        onclick={() => (activeTab = 'milestones')}
        data-testid="tab-milestones"
      >
        <span>Milestones</span>
      </button>
    </nav>

    <!-- Zone 3 & 4: What (Main) & Next Step -->
    <ScreenLayout question="What is your lasting legacy?">
      {#snippet main()}
        <!-- Headline score breakdown -->
        <div class="score-card card">
          <div class="score-main">
            <span class="score-lead">Net Prosperity Impact</span>
            <span class="score-value">{formatDelta(legacyData.scoreVsAutopilot.total)}</span>
            <span class="score-tagline">better than doing nothing across 10 years</span>
          </div>
          <div class="score-components">
            <div class="score-comp">
              <span class="comp-label">At Term End</span>
              <span class="comp-val">{formatDelta(legacyData.scoreVsAutopilot.now)}</span>
            </div>
            <div class="score-comp">
              <span class="comp-label">10-Year Echo</span>
              <span class="comp-val">{formatDelta(legacyData.scoreVsAutopilot.later)}</span>
            </div>
          </div>
        </div>

        {#if activeTab === 'overview' || activeTab === 'economy'}
          <!-- 10-Year Legacy Simulation Trajectory -->
          <div class="chart-panel card">
            <div class="chart-header">
              <div>
                <h3 class="panel-h">10-Year Legacy Simulation</h3>
                <p class="panel-sub">40 quarters projected forward with automatic stabilizers active</p>
              </div>
              <div class="ind-selector">
                {#each indicators as ind (ind.id)}
                  <button
                    type="button"
                    class="ind-btn"
                    class:active={activeIndicator === ind.id}
                    onclick={() => (activeIndicator = ind.id)}
                  >
                    {ind.label}
                  </button>
                {/each}
              </div>
            </div>

            <!-- SVG Projection Chart -->
            <div class="chart-wrap" data-testid="legacy-chart">
              <svg viewBox="0 0 {chartWidth} {chartHeight}" class="legacy-chart" role="img" aria-label="10-year projection chart">
                <!-- Axes -->
                <line x1={xMin} y1={yBottom} x2={xMax} y2={yBottom} stroke="var(--ink)" stroke-width="1.5" />
                <line x1={xMin} y1={yTop} x2={xMin} y2={yBottom} stroke="var(--ink)" stroke-width="1.5" />

                <!-- Zero Line -->
                {#if chartPoints.zeroY !== null}
                  <line
                    x1={xMin}
                    y1={chartPoints.zeroY}
                    x2={xMax}
                    y2={chartPoints.zeroY}
                    stroke="var(--ink-soft)"
                    stroke-width="1"
                    stroke-dasharray="2 2"
                  />
                {/if}

                <!-- Autopilot Path -->
                <path d={chartPoints.autoPath} fill="none" stroke="var(--gold)" stroke-width="2" stroke-dasharray="4 4" />

                <!-- Player Path -->
                <path d={chartPoints.youPath} fill="none" stroke="var(--sage)" stroke-width="2.5" />

                <!-- X Axis ticks -->
                <text x={xMin} y={chartHeight - 10} font-size="10" fill="var(--ink-soft)" text-anchor="start">Now</text>
                <text x={xMin + (xMax - xMin) * 0.3} y={chartHeight - 10} font-size="10" fill="var(--ink-soft)" text-anchor="middle">Year 3</text>
                <text x={xMin + (xMax - xMin) * 0.6} y={chartHeight - 10} font-size="10" fill="var(--ink-soft)" text-anchor="middle">Year 6</text>
                <text x={xMax} y={chartHeight - 10} font-size="10" fill="var(--ink-soft)" text-anchor="end">Year 10</text>

                <!-- Value labels -->
                <text x={xMax + 4} y={yTop + 12} font-size="10" fill="var(--sage)" font-weight="700">
                  {chartPoints.lastYou.toFixed(1)}{currentInd.unit}
                </text>
                <text x={xMax + 4} y={yTop + 26} font-size="10" fill="var(--gold)" font-weight="600">
                  {chartPoints.lastAuto.toFixed(1)}{currentInd.unit}
                </text>
              </svg>
            </div>

            <div class="chart-legend">
              <div class="legend-item">
                <span class="legend-line you-line"></span>
                <span>Your Administration</span>
              </div>
              <div class="legend-item">
                <span class="legend-line auto-line"></span>
                <span>Doing Nothing (Autopilot)</span>
              </div>
              <button
                type="button"
                class="toggle-table-btn"
                data-testid="toggle-table-btn"
                onclick={() => (showTable = !showTable)}
              >
                {showTable ? 'Hide Data Table' : 'Show Data Table'}
              </button>
            </div>

            <!-- Accessible Table Fallback (Pitfall 22) -->
            {#if showTable}
              <div class="table-wrap">
                <table class="legacy-table" data-testid="legacy-table" aria-label="10-year quarterly projection data table">
                  <thead>
                    <tr>
                      <th scope="col">Quarter</th>
                      <th scope="col">Year</th>
                      <th scope="col">GDP (You)</th>
                      <th scope="col">GDP (Auto)</th>
                      <th scope="col">Debt % (You)</th>
                      <th scope="col">Debt % (Auto)</th>
                      <th scope="col">Unemp % (You)</th>
                      <th scope="col">Unemp % (Auto)</th>
                      <th scope="col">Infl % (You)</th>
                      <th scope="col">Infl % (Auto)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each legacyData.playerSeries as p, idx (p.quarter)}
                      {@const a = legacyData.autopilotSeries[idx]!}
                      <tr>
                        <td>Q{p.quarter}</td>
                        <td>Yr {p.year}</td>
                        <td>{p.gdpGrowth.toFixed(1)}%</td>
                        <td>{a.gdpGrowth.toFixed(1)}%</td>
                        <td>{p.debtPct.toFixed(1)}%</td>
                        <td>{a.debtPct.toFixed(1)}%</td>
                        <td>{p.unemployment.toFixed(1)}%</td>
                        <td>{a.unemployment.toFixed(1)}%</td>
                        <td>{p.inflation.toFixed(1)}%</td>
                        <td>{a.inflation.toFixed(1)}%</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>
        {:else if activeTab === 'legislation'}
          <div class="record-panel card">
            <h3 class="panel-h">Legislative & Executive Record</h3>
            <p class="panel-sub">Major decisions and statutory actions enacted during your term.</p>
            <div class="record-list">
              <div class="record-item">
                <span class="rec-label">Active Executive Orders:</span>
                <span class="rec-val">{session.current.activeOrders.length} in force</span>
              </div>
              <div class="record-item">
                <span class="rec-label">Civics Insights Discovered:</span>
                <span class="rec-val">{session.current.viewedMyths.length} myths examined</span>
              </div>
              <div class="record-item">
                <span class="rec-label">Congressional Shifts:</span>
                <span class="rec-val">
                  {session.current.houseSeatDelta >= 0 ? `+${session.current.houseSeatDelta}` : session.current.houseSeatDelta} House seats
                </span>
              </div>
              <div class="record-item">
                <span class="rec-label">Total Quarters Governed:</span>
                <span class="rec-val">{totalTurnsPlayed} quarters</span>
              </div>
            </div>
          </div>
        {:else if activeTab === 'voters'}
          <div class="record-panel card">
            <h3 class="panel-h">Voter Coalition & Reelection Standing</h3>
            <p class="panel-sub">How your policies shaped electoral dynamics across the nation.</p>
            <div class="record-list">
              <div class="record-item">
                <span class="rec-label">Reelection Result:</span>
                <span class="rec-val">{session.reelectionWon ? 'Won Reelection' : 'Defeated in Year 4'}</span>
              </div>
              {#if session.activeElectionOutcome}
                <div class="record-item">
                  <span class="rec-label">Electoral College Tally:</span>
                  <span class="rec-val">{session.activeElectionOutcome.playerEV} EV (vs {session.activeElectionOutcome.opponentEV} EV)</span>
                </div>
                <div class="record-item">
                  <span class="rec-label">Tipping Point State:</span>
                  <span class="rec-val">{session.activeElectionOutcome.tippingPointState}</span>
                </div>
              {/if}
              {#if session.electionReasons.length > 0}
                <div class="reasons-block">
                  <span class="rec-label">Top Election Drivers:</span>
                  <ul class="reasons-list">
                    {#each session.electionReasons as r}
                      <li>{r}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          </div>
        {:else if activeTab === 'milestones'}
          <div class="record-panel card" data-testid="milestones-panel">
            <h3 class="panel-h">Policy Milestones & Badges</h3>
            <p class="panel-sub">
              {session.unlockedBadges.length} of 12 milestones unlocked across budget, crises, powers, and elections.
            </p>
            <div class="badges-grid" data-testid="badges-grid">
              {#each BADGES as badge (badge.id)}
                {@const isUnlocked = session.unlockedBadges.includes(badge.id)}
                <div
                  class="badge-card"
                  class:unlocked={isUnlocked}
                  class:locked={!isUnlocked}
                  data-testid="badge-card-{badge.id}"
                >
                  <div class="badge-card-header">
                    <span class="badge-cat-tag">{badge.category}</span>
                    <span class="badge-status-pill" class:earned={isUnlocked}>
                      {isUnlocked ? 'EARNED' : 'LOCKED'}
                    </span>
                  </div>
                  <h4 class="badge-title">{badge.title}</h4>
                  <p class="badge-desc">{badge.description}</p>
                  <div class="badge-crit-row">
                    <span class="crit-tag">Goal:</span>
                    <span class="crit-text">{badge.criterion}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {/snippet}

      {#snippet next()}
        <!-- Zone 4: Historian Verdict Card -->
        <div class="verdict-card card" data-testid="historian-verdict-card">
          <div class="verdict-badge-wrap">
            <span class="verdict-tag">HISTORIAN ASSESSMENT</span>
            <span
              class="verdict-tier tier-{verdict.tier.toLowerCase().replace(/\s+/g, '-')}"
              data-testid="verdict-tier"
            >
              {verdict.tier}
            </span>
          </div>
          <h3 class="verdict-title">{verdict.title}</h3>
          <p class="verdict-summary">{verdict.summary}</p>
        </div>

        <!-- Action Buttons -->
        <div class="actions-panel">
          {#if onRestart}
            <button
              type="button"
              class="stamp-btn primary-stamp"
              data-testid="start-new-presidency-btn"
              onclick={onRestart}
            >
              START NEW PRESIDENCY
            </button>
          {/if}

          {#if session.turn16Snapshot && !session.reelectionWon}
            <button
              type="button"
              class="retry-btn"
              data-testid="retry-turn16-btn"
              onclick={() => session.retryTurn16()}
            >
              RETRY FROM TURN 16
            </button>
          {/if}

          <button
            type="button"
            class="export-btn"
            data-testid="export-record-btn"
            onclick={() => downloadSave(session)}
          >
            EXPORT RECORD (JSON)
          </button>
        </div>
      {/snippet}
    </ScreenLayout>
  </div>
</div>

<style>
  .end-screen {
    height: 100dvh;
    max-height: 100dvh;
    overflow: hidden;
    display: grid;
    grid-template-rows: auto 1fr;
    background: var(--paper);
    color: var(--ink);
  }

  .end-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: clamp(6px, 1vh, 12px) clamp(16px, 2vw, 28px);
    border-bottom: 2px solid var(--ink);
    background: var(--card);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .presidency-title {
    font: 700 clamp(16px, 1.4vw, 20px) var(--font-label);
    letter-spacing: 0.08em;
    color: var(--ink);
  }

  .term-badge {
    padding: 3px 8px;
    background: var(--card-alt);
    border: 1.5px solid var(--ink);
    font: 700 12px var(--font-label);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .header-stats {
    display: flex;
    align-items: center;
    gap: clamp(10px, 1.5vw, 20px);
  }

  .stat-pill {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .stat-lbl {
    font: 600 11px var(--font-label);
    color: var(--ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .stat-num {
    font: 700 clamp(16px, 1.4vw, 20px) var(--font-headline);
    color: var(--ink);
  }

  .stat-num.highlight {
    color: var(--ink);
  }

  .zones {
    display: grid;
    grid-template-columns: clamp(170px, 15vw, 220px) minmax(0, 1fr) clamp(260px, 22vw, 320px);
    gap: clamp(12px, 1.5vw, 22px);
    padding: clamp(4px, 0.8vh, 10px) clamp(12px, 1.8vw, 24px) clamp(10px, 1.5vh, 20px);
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .end-nav {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-right: 12px;
    border-right: 2px solid var(--ink);
    height: 100%;
  }

  .nav-heading {
    font: 700 12px var(--font-label);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-soft);
    margin-bottom: 4px;
  }

  .nav-tab {
    padding: 10px 14px;
    background: var(--card);
    border: 2px solid var(--ink);
    box-shadow: 2px 2px 0 var(--ink);
    font: 700 14px var(--font-ui);
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }

  .nav-tab.active {
    background: var(--card-alt);
    outline: 2px solid var(--ink);
  }

  .score-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    background: var(--card);
    border: 2px solid var(--ink);
    box-shadow: 2px 2px 0 var(--ink);
    flex-shrink: 0;
  }

  .score-main {
    display: flex;
    flex-direction: column;
  }

  .score-lead {
    font: 700 12px var(--font-label);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .score-value {
    font: 700 clamp(28px, 2.8vw, 38px) var(--font-headline);
    color: var(--ink);
    line-height: 1.1;
  }

  .score-tagline {
    font: 500 13px var(--font-ui);
    color: var(--ink-soft);
  }

  .score-components {
    display: flex;
    gap: 16px;
  }

  .score-comp {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .comp-label {
    font: 600 11px var(--font-label);
    color: var(--ink-soft);
    text-transform: uppercase;
  }

  .comp-val {
    font: 700 18px var(--font-headline);
    color: var(--ink);
  }

  .chart-panel, .record-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 18px;
    background: var(--card);
    border: 2px solid var(--ink);
    box-shadow: 2px 2px 0 var(--ink);
    min-height: 0;
    overflow-y: auto;
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .panel-h {
    font: 700 16px var(--font-headline);
    margin: 0;
    color: var(--ink);
  }

  .panel-sub {
    font: 500 12px var(--font-ui);
    color: var(--ink-soft);
    margin: 2px 0 0 0;
  }

  .ind-selector {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .ind-btn {
    padding: 4px 10px;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    font: 600 12px var(--font-label);
    color: var(--ink);
    cursor: pointer;
  }

  .ind-btn.active {
    background: var(--ink);
    color: var(--paper);
  }

  .chart-wrap {
    width: 100%;
    min-height: 180px;
  }

  .legacy-chart {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .chart-legend {
    display: flex;
    align-items: center;
    gap: 18px;
    font: 600 12px var(--font-label);
    padding-top: 4px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .legend-line {
    display: inline-block;
    width: 20px;
    height: 3px;
  }

  .you-line {
    background: var(--sage);
  }

  .auto-line {
    background: var(--gold);
    border-bottom: 2px dashed var(--gold);
  }

  .toggle-table-btn {
    margin-left: auto;
    background: none;
    border: 0;
    color: var(--ink);
    text-decoration: underline;
    font: 600 12px var(--font-ui);
    cursor: pointer;
  }

  .table-wrap {
    max-height: 180px;
    overflow-y: auto;
    border: 1.5px solid var(--ink);
    margin-top: 8px;
  }

  .legacy-table {
    width: 100%;
    border-collapse: collapse;
    font: 500 11px var(--font-ui);
    text-align: right;
  }

  .legacy-table th, .legacy-table td {
    padding: 4px 8px;
    border: 1px solid var(--ink-soft);
  }

  .legacy-table th {
    background: var(--card-alt);
    font-weight: 700;
  }

  .record-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 6px;
  }

  .record-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    font: 600 13px var(--font-ui);
  }

  .reasons-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 6px;
  }

  .reasons-list {
    margin: 4px 0 0 16px;
    padding: 0;
    font: 500 13px var(--font-ui);
  }

  .verdict-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: var(--card);
    border: 2px solid var(--ink);
    box-shadow: 2px 2px 0 var(--ink);
  }

  .verdict-badge-wrap {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .verdict-tag {
    font: 700 11px var(--font-label);
    letter-spacing: 0.08em;
    color: var(--ink-soft);
    text-transform: uppercase;
  }

  .verdict-tier {
    display: inline-block;
    align-self: flex-start;
    padding: 4px 10px;
    border: 2px solid var(--ink);
    box-shadow: 2px 2px 0 var(--ink);
    font: 700 13px var(--font-label);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .tier-transformational {
    background: var(--sage);
    color: var(--paper);
  }

  .tier-steward-of-stability {
    background: var(--sky);
    color: var(--paper);
  }

  .tier-mixed-legacy {
    background: var(--card-alt);
    color: var(--ink);
  }

  .tier-presidency-of-unresolved-crises {
    background: var(--gold);
    color: var(--ink);
  }

  .tier-institutional-breakdown {
    background: var(--alert);
    color: var(--paper);
  }

  .verdict-title {
    font: 700 18px var(--font-headline);
    margin: 2px 0;
    color: var(--ink);
  }

  .verdict-summary {
    font: 500 13px var(--font-ui);
    color: var(--ink-soft);
    line-height: 1.4;
    margin: 0;
  }

  .actions-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
  }

  .stamp-btn {
    padding: 12px 16px;
    background: var(--alert);
    color: var(--paper);
    border: 2px solid var(--ink);
    box-shadow: 2px 2px 0 var(--ink);
    font: 700 15px var(--font-label);
    letter-spacing: 0.06em;
    cursor: pointer;
    text-transform: uppercase;
  }

  .retry-btn, .export-btn {
    padding: 10px 14px;
    background: var(--card);
    color: var(--ink);
    border: 2px solid var(--ink);
    box-shadow: 2px 2px 0 var(--ink);
    font: 700 13px var(--font-label);
    letter-spacing: 0.04em;
    cursor: pointer;
    text-transform: uppercase;
  }

  .badges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
    margin-top: 10px;
    overflow-y: auto;
    max-height: clamp(340px, 50vh, 480px);
    padding-right: 4px;
  }

  .badge-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: 4px;
  }

  .badge-card.unlocked {
    border-color: var(--gold);
    background: var(--gold-soft);
    box-shadow: 2px 2px 0 var(--ink);
  }

  .badge-card.locked {
    border-style: dashed;
    opacity: 0.75;
  }

  .badge-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .badge-cat-tag {
    font: 700 10px var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ink-soft);
  }

  .badge-status-pill {
    font: 700 10px var(--font-ui);
    padding: 1px 6px;
    border-radius: 3px;
    background: var(--card-alt);
    color: var(--ink-soft);
    border: 1px solid var(--ink-soft);
  }

  .badge-status-pill.earned {
    background: var(--sage);
    color: var(--card);
    border-color: var(--sage);
  }

  .badge-title {
    margin: 0;
    font: 700 14px var(--font-display);
    color: var(--ink);
  }

  .badge-desc {
    margin: 0;
    font: 400 12px/1.3 var(--font-body);
    color: var(--ink);
    flex-grow: 1;
  }

  .badge-crit-row {
    display: flex;
    gap: 4px;
    font: 500 11px var(--font-ui);
    color: var(--ink-soft);
    border-top: 1px dotted var(--rule);
    padding-top: 6px;
  }

  .crit-tag {
    font-weight: 700;
  }
</style>
