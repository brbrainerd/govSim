<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import type { ScreenId } from '../app/screens';
  import { extractTurnAttributions, type Direction } from '../app/attribution';
  import { whyTextForMode } from '../content/text/why';
  import MiniChart from '../ui/art/MiniChart.svelte';
  import Overlay from '../ui/Overlay.svelte';
  import ScreenLayout from '../ui/ScreenLayout.svelte';
  import HouseholdBreakdown from '../ui/HouseholdBreakdown.svelte';

  import type { ExplainerId } from '../content/explainers';
  import { getInspectorSummary } from '../content/model-inspector';

  let {
    session,
    question,
    go,
    onOpenMyth,
    onOpenExplainer,
    onOpenFed,
    onOpenModelInspector,
  }: {
    session: Session;
    question: string;
    go: (id: ScreenId) => void;
    onOpenMyth?: (mythId: string) => void;
    onOpenExplainer?: (explainerId: ExplainerId) => void;
    onOpenFed?: () => void;
    onOpenModelInspector?: () => void;
  } = $props();

  const totalParams = getInspectorSummary().totalParameters;

  const IND_EMOJI: Record<string, string> = {
    income: '💵',
    empPop: '👷',
    inflation: '🛒',
    debtPct: '💳',
    lifeExp: '🏥',
    gini: '⚖️',
    security: '🛡️',
    trust: '🤝',
  };

  let showScoresModal = $state(false);
  let viewMode = $state<'macro' | 'household'>('macro');

  // Time series extraction
  const growthSeries = $derived(session.history.map((s) => s.econ.growth));
  const autoGrowthSeries = $derived(session.autopilot.map((s) => s.econ.growth));

  const empPopSeries = $derived(session.history.map((s) => s.econ.empPop));
  const autoEmpPopSeries = $derived(session.autopilot.map((s) => s.econ.empPop));

  const inflationSeries = $derived(session.history.map((s) => s.econ.inflation));
  const autoInflationSeries = $derived(session.autopilot.map((s) => s.econ.inflation));

  const debtPctSeries = $derived(session.history.map((s) => (s.econ.debt / s.econ.gdp) * 100));
  const autoDebtPctSeries = $derived(session.autopilot.map((s) => (s.econ.debt / s.econ.gdp) * 100));

  // Current values and directions
  const currEcon = $derived(session.current.econ);
  const prevEcon = $derived(session.previous.econ);

  const getDir = (curr: number, prev: number): { word: string; dir: Direction } => {
    const diff = curr - prev;
    if (Math.abs(diff) < 0.05) return { word: 'flat', dir: 'flat' };
    return diff > 0 ? { word: 'up', dir: 'up' } : { word: 'down', dir: 'down' };
  };

  const growthDir = $derived(getDir(currEcon.growth, prevEcon.growth));
  const empPopDir = $derived(getDir(currEcon.empPop, prevEcon.empPop));
  const inflationDir = $derived(getDir(currEcon.inflation, prevEcon.inflation));
  const debtPctDir = $derived(
    getDir(
      (currEcon.debt / currEcon.gdp) * 100,
      (prevEcon.debt / prevEcon.gdp) * 100,
    ),
  );

  const kitchenTableSummary = $derived.by(() => {
    if (currEcon.inflation > 3.2) {
      return '🏠 For regular people: Store prices are rising faster than paychecks, squeezing monthly grocery budgets.';
    }
    if (currEcon.growth < 1.2) {
      return '🏠 For regular people: Hiring is slowing down, making families cautious about big purchases.';
    }
    return '🏠 For regular people: Paychecks are keeping up with store prices and jobs are steady.';
  });

  // Fed explainer
  const fedExplainer = $derived.by(() => {
    const rate = currEcon.fedRate.toFixed(2);
    const infl = currEcon.inflation;
    const gap = currEcon.gap;

    let rationale = 'The Fed held rates steady because inflation is near the 2.0% target and employment is stable.';
    if (infl > 2.5) {
      rationale = 'The Fed is keeping interest rates high to cool stubborn price inflation back toward 2.0%.';
    } else if (gap < -1.0) {
      rationale = 'The Fed is lowering interest rates to stimulate business hiring and support job growth.';
    } else if (currEcon.fedRate > 4.5) {
      rationale = 'The Fed maintains a restrictive rate posture to ensure inflationary pressures do not rebound.';
    }
    return { rate, rationale };
  });

  // Top 3 macroeconomic movers
  const topMovers = $derived.by(() => {
    const trace = session.current.report.trace;
    if (!trace) {
      return [
        'Baseline budget in force.',
        'Market expectations remain steady.',
        'Stable consumer demand across sectors.',
      ];
    }

    const candidateTerms = [
      ...(trace.growth ?? []),
      ...(trace.gap ?? []),
      ...(trace.inflation ?? []),
      ...(trace.debtPct ?? []),
    ];

    const meaningful = candidateTerms
      .filter((t) => Math.abs(t.amount) > 1e-4 && t.source !== 'rounding' && t.source !== 'clamp')
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    const seen = new Set<string>();
    const movers: string[] = [];

    for (const term of meaningful) {
      const text = whyTextForMode(term.source, session.vocabMode);
      if (!seen.has(text)) {
        seen.add(text);
        movers.push(text);
        if (movers.length >= 3) break;
      }
    }

    while (movers.length < 3) {
      const defaults = [
        'Baseline federal budget policy.',
        'Market inflation expectations.',
        'Consumer spending momentum.',
      ];
      const nextDef = defaults[movers.length]!;
      if (!seen.has(nextDef)) {
        movers.push(nextDef);
      } else {
        movers.push(`Sector factor ${movers.length + 1}`);
      }
    }

    return movers;
  });

  // All 8 scores comparison for overlay modal
  const allAttributions = $derived(extractTurnAttributions(session.current, session.previous));
</script>

<ScreenLayout {question}>
  {#snippet main()}
    <div class="economy-nav-bar">
      <div class="switcher-group" role="radiogroup" aria-label="Economy View Modes">
        <button
          type="button"
          class="switch-btn"
          class:active={viewMode === 'macro'}
          role="radio"
          aria-checked={viewMode === 'macro'}
          onclick={() => (viewMode = 'macro')}
          data-testid="tab-macro"
        >
          {session.vocabMode === 'wonk' ? 'Macro Indicators (GDP / CPI)' : '📊 Big Picture Economy'}
        </button>
        <button
          type="button"
          class="switch-btn"
          class:active={viewMode === 'household'}
          role="radio"
          aria-checked={viewMode === 'household'}
          onclick={() => (viewMode = 'household')}
          data-testid="tab-household"
        >
          🏠 Your Household
        </button>
      </div>

      {#if onOpenMyth}
        <button
          type="button"
          class="mirage-lever-btn"
          data-testid="mirage-lever-economy"
          onclick={() => onOpenMyth?.('interest_rates')}
        >
          ⚡ Order 2% Fed Rate Cut
        </button>
      {/if}
    </div>

    {#if viewMode === 'macro'}
      <div class="chart-grid">
        <MiniChart
          title={session.vocabMode === 'wonk' ? '📈 Growth (Real GDP)' : '📈 Growth'}
          currentValue={`${currEcon.growth.toFixed(1)}% ${growthDir.word}`}
          valueColor={growthDir.dir === 'up' ? 'var(--sage-dark)' : growthDir.dir === 'down' ? 'var(--alert-dark)' : 'var(--ink-soft)'}
          lineColor="var(--sky)"
          youSeries={growthSeries}
          autoSeries={autoGrowthSeries}
          unit="%"
          zeroBased={true}
        />

        <MiniChart
          title={session.vocabMode === 'wonk' ? '👷 Jobs (Emp-Pop)' : '👷 Jobs'}
          currentValue={`${currEcon.empPop.toFixed(1)}% ${empPopDir.word}`}
          valueColor={empPopDir.dir === 'up' ? 'var(--sage-dark)' : empPopDir.dir === 'down' ? 'var(--alert-dark)' : 'var(--ink-soft)'}
          lineColor="var(--sage)"
          youSeries={empPopSeries}
          autoSeries={autoEmpPopSeries}
          unit="%"
          zeroBased={false}
        />

        <MiniChart
          title={session.vocabMode === 'wonk' ? '🛒 Prices (CPI Inflation)' : '🛒 Prices'}
          currentValue={`${currEcon.inflation.toFixed(1)}% ${inflationDir.word}`}
          valueColor={inflationDir.dir === 'down' ? 'var(--sage-dark)' : inflationDir.dir === 'up' ? 'var(--alert-dark)' : 'var(--ink-soft)'}
          lineColor="var(--alert)"
          youSeries={inflationSeries}
          autoSeries={autoInflationSeries}
          unit="%"
          zeroBased={true}
        />

        <MiniChart
          title={session.vocabMode === 'wonk' ? '💳 Debt (Debt-to-GDP)' : '💳 Debt'}
          currentValue={`${((currEcon.debt / currEcon.gdp) * 100).toFixed(0)}% ${debtPctDir.word}`}
          valueColor={debtPctDir.dir === 'down' ? 'var(--sage-dark)' : debtPctDir.dir === 'up' ? 'var(--alert-dark)' : 'var(--ink-soft)'}
          lineColor="var(--gold-dark)"
          youSeries={debtPctSeries}
          autoSeries={autoDebtPctSeries}
          unit="%"
          zeroBased={false}
        />
      </div>
    {:else}
      <div class="household-view-wrap">
        <HouseholdBreakdown {session} />
      </div>
    {/if}
  {/snippet}

  {#snippet learn()}
    <button type="button" class="link" data-testid="how-it-works-btn" onclick={() => onOpenExplainer?.('economy')}>How it works</button>
    <button type="button" class="link" data-testid="open-model-inspector-btn" onclick={() => onOpenModelInspector?.()}>Show your work ({totalParams} params)</button>
    <button type="button" class="ticket" onclick={() => onOpenMyth?.('supply_side_taxes')}>Myth? Lower taxes boost growth?</button>
  {/snippet}

  {#snippet next()}
    <div class="card panel why-panel">
      <h3 class="panel-title">Why it's happening</h3>
      <p class="kitchen-summary" data-testid="economy-kitchen-table-summary">{kitchenTableSummary}</p>
      <ol class="mover-list">
        {#each topMovers as mover, idx}
          <li>
            <span class="mover-num">{idx + 1}.</span>
            <span class="mover-text">{mover}</span>
          </li>
        {/each}
      </ol>
    </div>

    <div class="card panel fed-panel">
      <div class="fed-header">
        <h3 class="panel-title">🏦 Federal Reserve</h3>
        <span class="fed-rate">{fedExplainer.rate}%</span>
      </div>
      <p class="fed-detail">{fedExplainer.rationale}</p>
      <button type="button" class="btn secondary-btn" onclick={() => onOpenFed?.()}>Pressure the Fed (costs trust)</button>
    </div>

    <button
      class="card option-card"
      onclick={() => (showScoresModal = true)}
      aria-label="See all 8 prosperity scores"
    >
      <span class="option-label">See the 8 scores</span>
      <span class="dots" aria-hidden="true">···</span>
    </button>

    <div class="action-wrap">
      <button class="btn action-btn" onclick={() => go('budget')}>
        Fix it in Budget →
      </button>
    </div>
  {/snippet}
</ScreenLayout>

{#if showScoresModal}
  <Overlay title="All 8 Prosperity Scores" onClose={() => (showScoresModal = false)}>
    {#snippet children()}
      <div class="scores-modal">
        <h3 class="modal-h">All 8 Prosperity Scores</h3>
        <p class="modal-sub">How your administration moves the 8 core pillars of prosperity.</p>
        <div class="scores-table-wrap">
          <table class="scores-table">
            <thead>
              <tr>
                <th scope="col">Indicator</th>
                <th scope="col">Current</th>
                <th scope="col">Quarter Change</th>
                <th scope="col">Primary Cause</th>
              </tr>
            </thead>
            <tbody>
              {#each allAttributions.indicators as item (item.id)}
                <tr>
                  <td class="ind-name"><b><span aria-hidden="true">{IND_EMOJI[item.id] ?? '📊'}</span> {item.name}</b></td>
                  <td class="ind-val">{item.formattedValue}</td>
                  <td class="ind-delta" class:good={item.isPositive} class:bad={!item.isPositive && item.direction !== 'flat'}>
                    {item.formattedDelta} ({item.direction})
                  </td>
                  <td class="ind-cause">
                    {session.vocabMode === 'wonk' && item.topCauseId !== 'none' && item.topCauseId !== 'mixed' && item.id !== 'security'
                      ? whyTextForMode(item.topCauseId, 'wonk')
                      : item.topCauseText}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button class="btn" onclick={() => (showScoresModal = false)}>Done</button>
        </div>
      </div>
    {/snippet}
  </Overlay>
{/if}

<style>
  .economy-nav-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    flex-shrink: 0;
  }

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
    transition: transform var(--dur-fast), background var(--dur-fast);
  }
  .mirage-lever-btn:hover {
    background: var(--gold);
    color: var(--ink);
    transform: translateY(-1px);
  }

  .switcher-group {
    display: inline-flex;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: var(--r-sm);
    overflow: hidden;
  }

  .switch-btn {
    border: none;
    background: none;
    padding: 5px 14px;
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    color: var(--ink);
  }

  .switch-btn.active {
    background: var(--ink);
    color: var(--card);
  }

  .household-view-wrap {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chart-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: clamp(8px, 1.2vh, 14px);
    flex: 1;
    min-height: 0;
  }

  .panel {
    padding: clamp(8px, 1.2vh, 12px) clamp(10px, 1.2vw, 14px);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .panel-title {
    margin: 0;
    font: 700 clamp(16px, 1.3vw, 20px) var(--font-display);
    color: var(--ink);
  }
  .kitchen-summary {
    margin: 0;
    padding: 4px 8px;
    background: var(--paper-dark);
    border-left: 3px solid var(--gold-dark);
    border-radius: 4px;
    font: 500 12px/1.3 var(--font-body);
    color: var(--ink);
  }

  .mover-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .mover-list li {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font: 600 clamp(13px, 1vw, 15px)/1.25 var(--font-ui);
    color: var(--ink);
  }
  .mover-num {
    color: var(--ink-soft);
    font-weight: 700;
  }
  .mover-text {
    flex: 1;
  }

  .fed-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .fed-rate {
    font: 700 clamp(16px, 1.4vw, 20px) var(--font-ui);
    color: var(--ink);
  }
  .fed-detail {
    margin: 0;
    font: 400 clamp(12px, 0.9vw, 14px)/1.35 var(--font-body);
    color: var(--ink-soft);
  }
  .secondary-btn {
    align-self: flex-start;
    font-size: clamp(12px, 0.85vw, 13px);
    padding: 4px 10px;
    min-height: 30px;
    color: var(--ink);
    background: var(--paper);
    border: 1px solid var(--ink-soft);
    cursor: default;
    box-shadow: none;
  }

  .option-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: clamp(8px, 1.2vh, 12px) clamp(12px, 1.2vw, 16px);
    cursor: pointer;
    background: var(--card);
    border: var(--rule) solid var(--ink);
    border-radius: var(--r-md);
    box-shadow: var(--shadow);
    transition: transform var(--dur-fast);
  }
  .option-card:hover {
    transform: translateY(-1px);
  }
  .option-label {
    font: 700 clamp(14px, 1.1vw, 17px) var(--font-ui);
    color: var(--ink);
  }
  .dots {
    font-size: 18px;
    letter-spacing: 2px;
    color: var(--ink-soft);
  }

  .action-wrap {
    margin-top: auto;
  }
  .action-btn {
    width: 100%;
    font: 700 clamp(16px, 1.4vw, 20px)/1 var(--font-ui);
    padding: clamp(10px, 1.4vh, 14px);
    border-radius: 10px;
  }

  .scores-modal {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 650px;
  }
  .modal-h {
    margin: 0;
    font: 700 clamp(20px, 1.8vw, 26px) var(--font-display);
    color: var(--ink);
  }
  .modal-sub {
    margin: 0;
    font: 400 14px/1.3 var(--font-body);
    color: var(--ink-soft);
  }
  .scores-table-wrap {
    max-height: 50vh;
    overflow-y: auto;
    border: 1px solid var(--ink);
    border-radius: 8px;
  }
  .scores-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    text-align: left;
  }
  .scores-table th, .scores-table td {
    padding: 8px 10px;
    border-bottom: 1px solid var(--ink-soft);
  }
  .scores-table th {
    background: var(--card);
    font: 700 13px var(--font-ui);
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .ind-delta.good {
    color: var(--sage-dark);
    font-weight: 700;
  }
  .ind-delta.bad {
    color: var(--alert);
    font-weight: 700;
  }
  .ind-cause {
    color: var(--ink-soft);
  }
  .modal-footer {
    display: flex;
    justify-content: flex-end;
  }
</style>
