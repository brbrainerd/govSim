<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import { downloadSave } from '../app/save';
  import { createShareUrl } from '../app/share';
  import {
    classifyHistorianVerdict,
    simulateTenYearLegacy,
    type QuarterlyLegacyPoint,
  } from '../engine/election';
  import { classifyKleptocratVerdict } from '../engine/evil-endgame';
  import { getEvilLever } from '../data/evil';
  import type { EvilLeverId } from '../engine/units';
  import { BADGES } from '../content/badges';
  import { MYTHS_CATALOG } from '../content/myths';
  import { DOCTRINE_FAMILIES, getPerk, type PerkDefinition } from '../content/perks';
  import {
    evaluateRunMastery,
    formatMasteryStars,
    loadMastery,
    masteryLabel,
    recordRunMastery,
  } from '../app/mastery';
  import { resolvePresidentLook, type Look, type Mood } from '../ui/art/Character.svelte';
  import CharacterPortrait from '../ui/art/CharacterPortrait.svelte';
  import CivicEmblem from '../ui/art/CivicEmblem.svelte';
  import ScreenLayout from '../ui/ScreenLayout.svelte';

  let {
    session,
    onRestart,
  }: {
    session: Session;
    onRestart?: () => void;
  } = $props();

  type TabId = 'overview' | 'economy' | 'legislation' | 'voters' | 'civics' | 'milestones' | 'extraction';
  type IndicatorId = 'gdpGrowth' | 'debtPct' | 'unemployment' | 'inflation';

  let activeTab = $state<TabId>('overview');
  let activeIndicator = $state<IndicatorId>('gdpGrowth');
  let showTable = $state(false);

  let shareStatus = $state<'idle' | 'copied' | 'error'>('idle');
  let shareUrl = $state<string>('');
  let shareInputVisible = $state<boolean>(false);

  async function handleShare() {
    try {
      const url = await createShareUrl(session);
      shareUrl = url;
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        shareStatus = 'copied';
        setTimeout(() => {
          shareStatus = 'idle';
        }, 2500);
      } else {
        shareInputVisible = true;
      }
    } catch {
      shareInputVisible = true;
      shareStatus = 'error';
    }
  }

  const autoFinal = $derived(session.autopilot[session.autopilot.length - 1]!);
  const legacyData = $derived(simulateTenYearLegacy(session.current, autoFinal));
  const verdict = $derived(classifyHistorianVerdict(legacyData.scoreVsAutopilot));
  const evilVerdict = $derived(
    session.isEvilMode
      ? classifyKleptocratVerdict({
          state: session.current,
          reelectionLost: !session.reelectionWon && session.current.turn >= 16 && !session.current.evil?.convicted,
        })
      : null,
  );

  const allEnactedEvilLevers = $derived.by(() => {
    if (!session.isEvilMode) return [];
    const leverCounts = new Map<EvilLeverId, number>();
    for (const input of session.inputs) {
      if (input.evil?.enactedLevers) {
        for (const id of input.evil.enactedLevers) {
          leverCounts.set(id, (leverCounts.get(id) ?? 0) + 1);
        }
      }
    }
    return Array.from(leverCounts.entries()).map(([id, count]) => ({
      lever: getEvilLever(id)!,
      count,
    }));
  });

  const allViewedMyths = $derived(
    (session.current.viewedMyths ?? []).filter((id) => !id.startsWith('explainer:'))
  );
  const allSpunMyths = $derived(session.current.spunMyths ?? []);
  const mythsBustedCount = $derived(
    allViewedMyths.filter((id) => !allSpunMyths.includes(id)).length
  );
  const mythsSpunCount = $derived(allSpunMyths.length);
  const netTrustPenalty = $derived(mythsSpunCount * 1.5);

  const civicArchetype = $derived.by(() => {
    if (mythsSpunCount >= 4) {
      return {
        title: 'Unrepentant Demagogue',
        summary: 'You routinely exploited populist civics misconceptions on television for short-term approval, eroding long-term public trust.',
      };
    }
    if (mythsSpunCount > 0 && mythsBustedCount > 0) {
      return {
        title: 'Calculated Populist',
        summary: 'You balanced institutional myth-busting with selective populist television spin when convenient.',
      };
    }
    if (mythsBustedCount >= 6 && mythsSpunCount === 0) {
      return {
        title: 'Constitutional Realist',
        summary: 'You stood firm on institutional reality, debunking myths without resorting to populist demagoguery.',
      };
    }
    if (mythsBustedCount > 0) {
      return {
        title: 'Emerging Institutionalist',
        summary: 'You began mastering the constitutional machinery of statecraft and refrained from cynical demagoguery.',
      };
    }
    return {
      title: 'Untested Executive',
      summary: 'You completed your term without directly confronting the populist civics misconceptions facing modern presidents.',
    };
  });

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

  const draftedPerks = $derived(
    session.activePerks
      .map((id) => getPerk(id))
      .filter((p): p is PerkDefinition => p !== undefined),
  );
  const activeDoctrineFamilies = $derived(
    session.activeSynergies.filter((s) => s.count > 0),
  );
  const masteryInput = $derived({
    archetype: session.options.archetype,
    scenario: session.options.scenario,
    isEvilMode: session.isEvilMode,
    convicted: Boolean(session.current.evil?.convicted),
    reelectionWon: session.reelectionWon,
    scoreVsAutopilot: legacyData.scoreVsAutopilot.total,
    offshoreStashBn: session.current.evil?.offshoreStashBn ?? 0,
  });

  $effect(() => {
    recordRunMastery(masteryInput);
  });

  const masteryOutcome = $derived({
    earnedTier: evaluateRunMastery(masteryInput),
    record: loadMastery(),
  });
</script>

<div class="end-screen halftone" data-testid="end-screen">
  <!-- Zone 1: Status (Top Bar) -->
  <header class="end-header">
    <div class="header-left">
      <span class="presidency-title">{session.isEvilMode ? 'KLEPTOCRATIC HEIST REVIEW' : 'PRESIDENTIAL LEGACY REVIEW'}</span>
      <span class="term-badge">{session.current.evil?.convicted ? 'Term Terminated (Convicted)' : `${yearsCompleted} Years Completed`}</span>
      <span class="term-badge" data-testid="end-scenario-badge">{session.activeScenario.name}</span>
      {#if session.activeArchetype}
        <span class="term-badge" data-testid="end-archetype-badge">
          <CivicEmblem kind={session.activeArchetype.id} size={14} /> {session.activeArchetype.shortName}
        </span>
      {/if}
      <span
        class="term-badge mastery-header-badge"
        class:tier-gold={masteryOutcome.earnedTier === 'gold'}
        class:tier-silver={masteryOutcome.earnedTier === 'silver'}
        data-testid="endscreen-mastery-badge"
      >
        {formatMasteryStars(masteryOutcome.earnedTier)} {masteryLabel(masteryOutcome.earnedTier)}
      </span>
    </div>
    <div class="header-stats">
      {#if session.isEvilMode}
        <div class="stat-pill" data-testid="end-offshore-stash">
          <span class="stat-lbl">Offshore Stash</span>
          <span class="stat-num evil-gold">${(session.current.evil?.offshoreStashBn ?? 0).toFixed(1)}B</span>
        </div>
        <div class="stat-pill" data-testid="end-heat-meter">
          <span class="stat-lbl">Final Heat</span>
          <span class="stat-num">{Math.round(session.current.evil?.heat ?? 0)}/100</span>
        </div>
        <div class="score-pill">
          <span class="stat-lbl">Heist Outcome</span>
          <span class="stat-num highlight" data-testid="headline-score">{evilVerdict?.tier ?? 'Kleptocrat'}</span>
        </div>
      {:else}
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
      {/if}
    </div>
  </header>

  <div class="zones">
    <!-- Zone 2: Where (Left Navigation) -->
    <nav class="end-nav" aria-label="Presidential Record Sections">
      <span class="nav-heading">Presidential Record</span>
      {#if session.isEvilMode}
        <button
          type="button"
          class="nav-tab evil-nav-tab"
          class:active={activeTab === 'extraction'}
          onclick={() => (activeTab = 'extraction')}
          data-testid="tab-extraction"
        >
          <span>Extraction Ledger</span>
        </button>
      {/if}
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
        class:active={activeTab === 'civics'}
        onclick={() => (activeTab = 'civics')}
        data-testid="tab-civic-dossier"
      >
        <span>Civic Dossier</span>
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
    <ScreenLayout question={session.isEvilMode ? "What became of your plunder?" : "What is your lasting legacy?"}>
      {#snippet main()}
        <!-- Headline score breakdown -->
        {#if session.isEvilMode}
          {@const isConvicted = Boolean(session.current.evil?.convicted)}
          {@const stash = session.current.evil?.offshoreStashBn ?? 0}
          <div class="score-card card evil-score-card" data-testid="evil-score-card">
            <div class="score-main">
              <span class="score-lead">{isConvicted ? 'Asset Seizure & Forfeiture' : 'Total Offshore Loot Siphoned'}</span>
              <span class="score-value evil-gold">${stash.toFixed(1)}B</span>
              <span class="score-tagline">
                {isConvicted
                  ? 'All corrupt kickbacks forfeited to the federal judiciary upon Senate conviction'
                  : 'Laundered into numbered accounts across non-extradition offshore jurisdictions'}
              </span>
            </div>
            <div class="score-components">
              <div class="score-comp">
                <span class="comp-label">Investigation Heat</span>
                <span class="comp-val">{Math.round(session.current.evil?.heat ?? 0)}/100</span>
              </div>
              <div class="score-comp">
                <span class="comp-label">Senate Trial Votes</span>
                <span class="comp-val">{session.current.evil?.senateConvictionVotes ?? 0}/100</span>
              </div>
            </div>
          </div>
        {:else}
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
        {/if}

        {#if activeTab === 'extraction'}
          <div class="record-panel card" data-testid="extraction-ledger-panel">
            <h3 class="panel-h">Kleptocratic Extraction Ledger</h3>
            <p class="panel-sub">Catalog of corrupt executive powers and siphoning operations executed during your tenure.</p>
            <div class="syndicate-breakdown" data-testid="endscreen-syndicate-summary">
              <div class="syndicate-row">
                <span class="rec-label">Fixer Relics Recruited ({draftedPerks.length}):</span>
                <span class="rec-val">
                  {draftedPerks.length > 0 ? draftedPerks.map((p) => `${p.emoji} ${p.name}`).join(' · ') : 'None recruited'}
                </span>
              </div>
              <div class="syndicate-row">
                <span class="rec-label">Syndicate Doctrines Active:</span>
                <span class="rec-val">
                  {activeDoctrineFamilies.length > 0
                    ? activeDoctrineFamilies.map((f) => `${DOCTRINE_FAMILIES[f.tag].emoji} ${DOCTRINE_FAMILIES[f.tag].label} (${f.count})`).join(' · ')
                    : 'No syndicate sets stacked'}
                </span>
              </div>
            </div>
            {#if allEnactedEvilLevers.length === 0}
              <div class="empty-ledger">
                <p>No corrupt levers were enacted. You left office with standard administrative records.</p>
              </div>
            {:else}
              <div class="record-list">
                {#each allEnactedEvilLevers as item (item.lever.id)}
                  <div class="record-item extraction-item" data-testid="extraction-item-{item.lever.id}">
                    <div class="extraction-main">
                      <span class="rec-label">{item.lever.name} ({item.count}×)</span>
                      <span class="extraction-desc">{item.lever.description}</span>
                    </div>
                    <div class="extraction-impacts">
                      {#if item.lever.kickbackBn > 0}
                        <span class="impact-stash">+${(item.lever.kickbackBn * item.count).toFixed(1)}B Loot</span>
                      {/if}
                      {#if item.lever.heatDelta !== 0}
                        <span class="impact-heat" class:heat-down={item.lever.heatDelta < 0}>
                          {item.lever.heatDelta > 0 ? `+${item.lever.heatDelta * item.count}` : `${item.lever.heatDelta * item.count}`} Heat
                        </span>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {:else if activeTab === 'overview' || activeTab === 'economy'}
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
            <div class="record-list" data-testid="endscreen-doctrine-summary">
              <div class="record-item">
                <span class="rec-label">Active Executive Orders:</span>
                <span class="rec-val">{session.current.activeOrders.length} in force</span>
              </div>
              <div class="record-item">
                <span class="rec-label">Task Forces & Relics Drafted:</span>
                <span class="rec-val">
                  {draftedPerks.length > 0 ? draftedPerks.map((p) => `${p.emoji} ${p.name}`).join(' · ') : 'None drafted'}
                </span>
              </div>
              <div class="record-item">
                <span class="rec-label">Policy Doctrines Stacked:</span>
                <span class="rec-val">
                  {activeDoctrineFamilies.length > 0
                    ? activeDoctrineFamilies.map((f) => `${DOCTRINE_FAMILIES[f.tag].emoji} ${DOCTRINE_FAMILIES[f.tag].label} (${f.count})`).join(' · ')
                    : 'Balanced baseline'}
                </span>
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
        {:else if activeTab === 'civics'}
          <div class="record-panel card civic-dossier-panel" data-testid="civic-dossier-panel">
            <h3 class="panel-h">Civic Mastery Dossier</h3>
            <p class="panel-sub">
              Your record distinguishing between constitutional realities and populist television demagoguery.
            </p>

            <div class="civic-stats-row">
              <div class="civic-stat-card">
                <span class="civic-stat-num stat-busted" data-testid="stat-myths-busted">{mythsBustedCount}</span>
                <span class="civic-stat-label">Myths Busted</span>
                <span class="civic-stat-sub">+{mythsBustedCount * 5} Clout Earned</span>
              </div>
              <div class="civic-stat-card">
                <span class="civic-stat-num stat-spun" data-testid="stat-myths-spun">{mythsSpunCount}</span>
                <span class="civic-stat-label">Myths Spun on TV</span>
                <span class="civic-stat-sub">+{mythsSpunCount * 2}% Short-Term Appr</span>
              </div>
              <div class="civic-stat-card">
                <span class="civic-stat-num stat-trust" data-testid="stat-trust-impact">{netTrustPenalty > 0 ? `-${netTrustPenalty.toFixed(1)}` : '0.0'}%</span>
                <span class="civic-stat-label">Social Trust Impact</span>
                <span class="civic-stat-sub">{netTrustPenalty > 0 ? 'Lasting Trust Erosion' : 'No Demagogue Fallout'}</span>
              </div>
              <div class="civic-stat-card archetype-card">
                <span class="archetype-tag">PEDAGOGICAL ARCHETYPE</span>
                <h4 class="archetype-title" data-testid="civic-archetype-title">{civicArchetype.title}</h4>
                <p class="archetype-desc">{civicArchetype.summary}</p>
              </div>
            </div>

            <h4 class="civic-sub-h">Civic Misconceptions Ledger ({allViewedMyths.length} of {MYTHS_CATALOG.length} Examined)</h4>
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <div class="civic-ledger-grid" role="region" aria-label="Civics myths ledger" tabindex="0">
              {#each MYTHS_CATALOG as myth (myth.id)}
                {@const isSpun = allSpunMyths.includes(myth.id)}
                {@const isBusted = allViewedMyths.includes(myth.id) && !isSpun}
                <div
                  class="civic-myth-card"
                  class:status-busted={isBusted}
                  class:status-spun={isSpun}
                  class:status-unexamined={!isBusted && !isSpun}
                  data-testid="civic-myth-card-{myth.id}"
                >
                  <div class="civic-card-header">
                    <span class="civic-domain-tag">{myth.target.toUpperCase()}</span>
                    {#if isBusted}
                      <span class="civic-status-pill pill-busted">BUSTED (+5 Clout)</span>
                    {:else if isSpun}
                      <span class="civic-status-pill pill-spun">SPUN ON TV</span>
                    {:else}
                      <span class="civic-status-pill pill-unexamined">UNEXAMINED</span>
                    {/if}
                  </div>
                  <h5 class="civic-claim-text">"{myth.mythStatement}"</h5>
                  <p class="civic-reality-snippet">{myth.realitySummary}</p>
                </div>
              {/each}
            </div>
          </div>
        {:else if activeTab === 'milestones'}
          <div class="record-panel card" data-testid="milestones-panel">
            <h3 class="panel-h">Policy Milestones & Badges</h3>
            <p class="panel-sub">
              {session.unlockedBadges.length} of {BADGES.length} milestones unlocked across budget, crises, powers, and elections.
            </p>
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <div class="badges-grid" data-testid="badges-grid" role="region" aria-label="Policy milestones and badges" tabindex="0">
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
        {#if session.isEvilMode && evilVerdict}
          {@const isConvicted = Boolean(session.current.evil?.convicted)}
          {@const evilPresLook = resolvePresidentLook(
            session.options.presidentLook ?? 0,
            true,
            isConvicted ? 'panicked' : 'scheming',
          )}
          <div class="verdict-card card evil-verdict-card" data-testid="historian-verdict-card">
            <div class="verdict-header-row">
              <div class="verdict-badge-wrap">
                <span class="verdict-tag">KLEPTOCRACY ASSESSMENT</span>
                <span
                  class="verdict-tier tier-{evilVerdict.tier.toLowerCase().replace(/\s+/g, '-')}"
                  data-testid="verdict-tier"
                >
                  {evilVerdict.tier}
                </span>
              </div>
              <div
                class="legacy-vignette-pair"
                data-testid="endscreen-legacy-vignette"
                data-mode="evil"
              >
                <CharacterPortrait
                  look={evilPresLook}
                  mood={isConvicted ? 'panicked' : 'scheming'}
                  pose={isConvicted ? 'facepalm' : 'cash'}
                  prop={isConvicted ? null : 'cash_fan'}
                  size={44}
                  ringColor={isConvicted ? 'alert' : 'gold'}
                />
              </div>
            </div>
            <h3 class="verdict-title">{evilVerdict.title}</h3>
            <p class="verdict-summary">{evilVerdict.summary}</p>
            <div class="epilogue-block">
              <span class="epilogue-tag">POST-PRESIDENCY EPILOGUE</span>
              <p class="epilogue-text" data-testid="kleptocrat-epilogue">{evilVerdict.epilogue}</p>
            </div>
          </div>
        {:else}
          {@const isPositiveLegacy = legacyData.scoreVsAutopilot.total >= 0}
          {@const stdPresMood: Mood =
            legacyData.scoreVsAutopilot.total >= 5
              ? 'triumphant'
              : isPositiveLegacy
                ? 'confident'
                : 'stressed'}
          {@const stdPresLook = resolvePresidentLook(
            session.options.presidentLook ?? 0,
            false,
            stdPresMood,
          )}
          {@const historianLook: Look = {
            skin: 'skin-3',
            hair: 'hair-4',
            hairStyle: 'bun',
            outfit: 'cardigan',
            suit: 'sky',
            tie: 'gold',
            glasses: true,
          }}
          <div class="verdict-card card" data-testid="historian-verdict-card">
            <div class="verdict-header-row">
              <div class="verdict-badge-wrap">
                <span class="verdict-tag">HISTORIAN ASSESSMENT</span>
                <span
                  class="verdict-tier tier-{verdict.tier.toLowerCase().replace(/\s+/g, '-')}"
                  data-testid="verdict-tier"
                >
                  {verdict.tier}
                </span>
              </div>
              <div
                class="legacy-vignette-pair"
                data-testid="endscreen-legacy-vignette"
                data-mode="standard"
              >
                <CharacterPortrait
                  look={stdPresLook}
                  mood={stdPresMood}
                  pose={isPositiveLegacy ? 'celebrate' : 'stand'}
                  size={42}
                  ringColor={isPositiveLegacy ? 'sage' : 'alert'}
                />
                <CharacterPortrait
                  look={historianLook}
                  mood={isPositiveLegacy ? 'confident' : 'stressed'}
                  pose="stand"
                  prop="clipboard"
                  size={38}
                  ringColor="gold"
                />
              </div>
            </div>
            <h3 class="verdict-title">{verdict.title}</h3>
            <p class="verdict-summary">{verdict.summary}</p>
          </div>
        {/if}

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
            class="share-btn"
            class:copied={shareStatus === 'copied'}
            data-testid="share-record-btn"
            onclick={handleShare}
          >
            {shareStatus === 'copied' ? 'COPIED REPLAY LINK!' : 'SHARE PRESIDENTIAL RECORD'}
          </button>

          {#if shareInputVisible && shareUrl}
            <div class="share-fallback">
              <input
                type="text"
                readonly
                value={shareUrl}
                class="share-input"
                data-testid="share-url-input"
                onclick={(e) => (e.currentTarget as HTMLInputElement).select()}
              />
            </div>
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

  .stat-pill,
  .score-pill {
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
    flex-wrap: nowrap;
    flex-shrink: 0;
  }

  .ind-btn {
    padding: 4px 10px;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    font: 600 12px var(--font-label);
    color: var(--ink);
    cursor: pointer;
    white-space: nowrap;
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

  .verdict-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .legacy-vignette-pair {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
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

  .retry-btn, .export-btn, .share-btn {
    padding: 10px 14px;
    background: var(--card);
    color: var(--ink);
    border: 2px solid var(--ink);
    box-shadow: 2px 2px 0 var(--ink);
    font: 700 13px var(--font-label);
    letter-spacing: 0.04em;
    cursor: pointer;
    text-transform: uppercase;
    transition: background 0.15s ease;
  }

  .share-btn {
    background: var(--gold-soft);
  }

  .share-btn.copied {
    background: var(--sage);
    color: var(--paper);
  }

  .share-fallback {
    margin-top: 4px;
  }

  .share-input {
    width: 100%;
    padding: 6px 8px;
    font: 500 11px monospace;
    border: 1.5px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    box-sizing: border-box;
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
    color: var(--ink);
  }

  .badge-status-pill {
    font: 700 10px var(--font-ui);
    padding: 1px 6px;
    border-radius: 3px;
    background: var(--card-alt);
    color: var(--ink);
    border: 1px solid var(--ink);
  }

  .badge-status-pill.earned {
    background: var(--ink);
    color: var(--paper);
    border-color: var(--ink);
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
    color: var(--ink);
    border-top: 1px dotted var(--rule);
    padding-top: 6px;
  }

  .crit-tag {
    font-weight: 700;
  }

  .evil-gold {
    color: var(--gold);
  }

  .evil-score-card {
    border-color: var(--gold);
    border-left: 6px solid var(--gold);
  }

  .evil-verdict-card {
    border-color: var(--gold);
  }

  .evil-verdict-card .verdict-tier {
    background: var(--gold-dark);
    color: var(--card);
    border-color: var(--gold);
  }

  .epilogue-block {
    margin-top: 8px;
    padding: 8px;
    background: var(--paper);
    border: 1px solid var(--ink);
    border-radius: var(--r-sm);
  }

  .epilogue-tag {
    display: block;
    font: 700 10px var(--font-ui);
    color: var(--ink-soft);
    letter-spacing: 0.08em;
    margin-bottom: 2px;
  }

  .epilogue-text {
    margin: 0;
    font: 500 12px/1.3 var(--font-body);
    color: var(--ink);
  }

  .extraction-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .extraction-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .extraction-desc {
    font: 400 12px var(--font-body);
    color: var(--ink-soft);
  }

  .extraction-impacts {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .impact-stash {
    font: 700 13px var(--font-ui);
    color: var(--gold-dark);
    padding: 2px 6px;
    background: var(--paper);
    border: 1px solid var(--gold);
    border-radius: 4px;
  }

  .impact-heat {
    font: 700 13px var(--font-ui);
    color: var(--alert);
    padding: 2px 6px;
    background: var(--paper);
    border: 1px solid var(--alert);
    border-radius: 4px;
  }

  .impact-heat.heat-down {
    color: var(--sage-dark);
    border-color: var(--sage);
  }

  .empty-ledger {
    padding: 16px;
    text-align: center;
    color: var(--ink-soft);
    font: 500 14px var(--font-body);
  }

  /* Civic Mastery Dossier Styles (SPIN-02) */
  .civic-stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr) 1.6fr;
    gap: 12px;
    margin-bottom: 16px;
  }

  .civic-stat-card {
    background: var(--paper);
    border: 1px solid var(--ink-soft);
    border-radius: var(--r-sm);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .civic-stat-num {
    font-family: var(--font-mono, monospace);
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1.1;
  }

  .stat-busted {
    color: var(--sage-dark);
  }

  .stat-spun {
    color: var(--alert);
  }

  .stat-trust {
    color: var(--gold-dark);
  }

  :global([data-theme="evil"]) .stat-spun {
    color: var(--gold);
  }

  :global([data-theme="evil"]) .stat-busted {
    color: var(--sage-dark);
  }

  :global([data-theme="evil"]) .stat-trust {
    color: var(--gold);
  }

  .civic-stat-label {
    font-family: var(--font-ui);
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .civic-stat-sub {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    color: var(--ink-soft);
  }

  .archetype-card {
    background: var(--card);
    border: 2px solid var(--ink);
  }

  .archetype-tag {
    font-family: var(--font-mono, monospace);
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: var(--ink-soft);
    text-transform: uppercase;
  }

  .archetype-title {
    font-family: var(--font-headline);
    font-size: 1.05rem;
    font-weight: 800;
    margin: 2px 0 4px 0;
    color: var(--ink);
  }

  .archetype-desc {
    font-family: var(--font-body);
    font-size: 0.78rem;
    color: var(--ink);
    line-height: 1.35;
    margin: 0;
  }

  .civic-sub-h {
    font-family: var(--font-ui);
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink);
    margin: 14px 0 8px 0;
  }

  .civic-ledger-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 10px;
    max-height: 250px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .civic-myth-card {
    background: var(--paper);
    border: 1px solid var(--ink-soft);
    border-radius: var(--r-sm);
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .civic-myth-card.status-busted {
    border-left: 4px solid var(--sage-dark);
  }

  .civic-myth-card.status-spun {
    border-left: 4px solid var(--alert);
  }

  :global([data-theme="evil"]) .civic-myth-card.status-spun {
    border-left-color: var(--gold);
  }

  :global([data-theme="evil"]) .civic-myth-card.status-busted {
    border-left-color: var(--sage-dark);
  }

  .civic-myth-card.status-unexamined {
    border-left: 4px solid var(--ink-soft);
    opacity: 0.85;
  }

  .civic-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .civic-domain-tag {
    font-family: var(--font-mono, monospace);
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--ink-soft);
    letter-spacing: 0.06em;
  }

  .civic-status-pill {
    font-family: var(--font-mono, monospace);
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 3px;
    letter-spacing: 0.04em;
  }

  .pill-busted {
    background: var(--sage-tint);
    color: var(--sage-dark);
    border: 1px solid var(--sage-dark);
  }

  .pill-spun {
    background: var(--alert-tint);
    color: var(--alert);
    border: 1px solid var(--alert);
  }

  :global([data-theme="evil"]) .pill-spun {
    color: var(--gold);
    border-color: var(--gold);
  }

  .pill-unexamined {
    background: var(--paper);
    color: var(--ink);
    border: 1px solid var(--ink-soft);
  }

  .civic-claim-text {
    font-family: var(--font-headline);
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0;
    line-height: 1.3;
  }

  .civic-reality-snippet {
    font-family: var(--font-body);
    font-size: 0.74rem;
    color: var(--ink);
    margin: 0;
    line-height: 1.3;
  }

  .mastery-header-badge.tier-silver {
    background: var(--paper-warm);
    border-color: var(--ink);
    color: var(--ink);
    font-weight: 800;
  }

  .mastery-header-badge.tier-gold {
    background: var(--gold);
    border-color: var(--ink);
    color: var(--ink);
    font-weight: 800;
  }

  .syndicate-breakdown {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 12px;
    margin-bottom: 10px;
    border-radius: 6px;
    background: var(--paper);
    border: 1.5px solid var(--ink);
  }

  .syndicate-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 13px;
  }
</style>
