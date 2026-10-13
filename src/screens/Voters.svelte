<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import type { ScreenId } from '../app/screens';
  import { getStateExposure, getStateLegislature } from '../data/electoral';
  import { calculateDemographicCoalitions } from '../engine/cohorts';
  import { calculateElectoralCollege, calculateStateFamilyRelief, type StateVoterState } from '../engine/voters';
  import USMap from '../ui/art/USMap.svelte';
  import ScreenLayout from '../ui/ScreenLayout.svelte';

  interface Props {
    session: Session;
    question: string;
    go?: (id: ScreenId) => void;
    onOpenMyth?: (id: string) => void;
    onOpenSpeech?: () => void;
  }

  const { session, question, go, onOpenMyth, onOpenSpeech }: Props = $props();

  const summary = $derived(calculateElectoralCollege(session.current, session.options.party));
  const cohorts = $derived(calculateDemographicCoalitions(session.current, session.options.party));

  let viewMode = $state<'map' | 'table' | 'coalitions'>('map');
  let selectedId = $state<string | null>(null);

  // Default selection to tipping point or Pennsylvania
  const currentSelectedId = $derived(selectedId ?? summary.tippingPointCode ?? 'PA');
  const selectedUnit = $derived<StateVoterState | undefined>(summary.units[currentSelectedId]);
  const stateExposure = $derived(getStateExposure(currentSelectedId));
  const familyRelief = $derived(calculateStateFamilyRelief(currentSelectedId, session.current.socialPolicy));

  const stateCode = $derived(currentSelectedId.split('-')[0]!);
  const stateLeg = $derived(getStateLegislature(stateCode));
  const activeAmendment = $derived(session.current.activeAmendment);
  const isStateRatified = $derived(
    Boolean(activeAmendment?.ratifiedStates.includes(stateCode))
  );

  const salienceTags = $derived.by(() => {
    if (!stateExposure) return [];
    const tags: string[] = [];
    if (stateExposure.seniorShare >= 0.20) {
      tags.push(`Seniors ${(stateExposure.seniorShare * 100).toFixed(1)}%`);
    }
    if (stateExposure.uninsuredRate >= 0.12) {
      tags.push(`Uninsured ${(stateExposure.uninsuredRate * 100).toFixed(1)}%`);
    }
    if (stateExposure.borderState) {
      tags.push('Border State');
    }
    if (stateExposure.fossilEnergy >= 0.08) {
      tags.push('Energy Producer');
    } else if (stateExposure.cleanEnergyGrowth >= 0.25) {
      tags.push('Clean Energy Corridor');
    }
    if (stateExposure.farm >= 0.04) {
      tags.push('Ag Exporter');
    }
    if (stateExposure.studentDebtShare >= 0.18) {
      tags.push(`Student Debt ${(stateExposure.studentDebtShare * 100).toFixed(1)}%`);
    }
    return tags;
  });

  // Table sorting
  type SortKey = 'name' | 'ev' | 'support' | 'margin' | 'outlook';
  let sortKey = $state<SortKey>('margin');
  let sortAsc = $state<boolean>(false);

  const allUnitsList = $derived(Object.values(summary.units));

  const sortedUnits = $derived.by(() => {
    const list = [...allUnitsList];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'ev':
          cmp = a.electoralVotes - b.electoralVotes;
          break;
        case 'support':
          cmp = a.supportPct - b.supportPct;
          break;
        case 'margin':
          cmp = a.currentMargin - b.currentMargin;
          break;
        case 'outlook':
          cmp = a.leaning.localeCompare(b.leaning);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return list;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      sortAsc = !sortAsc;
    } else {
      sortKey = key;
      sortAsc = key === 'name';
    }
  }

  // Bar percentages out of 538 total
  const youPct = $derived(Math.max(0, Math.min(100, (summary.playerVotes / 538) * 100)));
  const tossupPct = $derived(Math.max(0, Math.min(100, (summary.tossupVotes / 538) * 100)));
  const themPct = $derived(Math.max(0, Math.min(100, (summary.opponentVotes / 538) * 100)));
  const targetPct = (270 / 538) * 100;
</script>

<ScreenLayout {question}>
  {#snippet main()}
    <div class="voters-main" data-testid="voters-screen">
      <!-- Mode Toggle Header -->
      <div class="main-header">
        <div class="view-switcher" role="radiogroup" aria-label="Voters View Mode">
          <button
            type="button"
            class="switch-btn"
            class:active={viewMode === 'map'}
            role="radio"
            aria-checked={viewMode === 'map'}
            onclick={() => (viewMode = 'map')}
          >
            Map View
          </button>
          <button
            type="button"
            class="switch-btn"
            class:active={viewMode === 'table'}
            role="radio"
            aria-checked={viewMode === 'table'}
            onclick={() => (viewMode = 'table')}
          >
            Table View
          </button>
          <button
            type="button"
            class="switch-btn"
            class:active={viewMode === 'coalitions'}
            role="radio"
            aria-checked={viewMode === 'coalitions'}
            onclick={() => (viewMode = 'coalitions')}
          >
            Coalitions
          </button>
        </div>

        <div class="meta-status">
          <span class="tipping-point-badge">
            ★ Tipping Point: <b>{summary.tippingPointCode}</b>
          </span>
          <span class="swing-count">
            {summary.swingStates.length} Swing States
          </span>
        </div>
      </div>

      <!-- Main Canvas: Map, Table, or Coalitions -->
      <div class="display-area">
        {#if viewMode === 'map'}
          <div class="map-wrapper">
            <USMap
              states={summary.states}
              districts={summary.districts}
              selectedCode={currentSelectedId}
              onSelect={(code) => (selectedId = code)}
            />
          </div>
        {:else if viewMode === 'table'}
          <div class="table-wrapper" role="region" aria-label="Electoral College States Table">
            <table class="states-table">
              <thead>
                <tr>
                  <th scope="col" onclick={() => toggleSort('name')} class="sortable">
                    State / District {sortKey === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th scope="col" onclick={() => toggleSort('ev')} class="sortable num-col">
                    EV {sortKey === 'ev' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th scope="col" onclick={() => toggleSort('support')} class="sortable num-col">
                    Support {sortKey === 'support' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th scope="col" onclick={() => toggleSort('margin')} class="sortable num-col">
                    Margin {sortKey === 'margin' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th scope="col" onclick={() => toggleSort('outlook')} class="sortable">
                    Outlook {sortKey === 'outlook' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {#each sortedUnits as unit (unit.code)}
                  <tr
                    class="state-row"
                    class:selected={currentSelectedId === unit.code}
                    onclick={() => (selectedId = unit.code)}
                    onkeydown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectedId = unit.code;
                      }
                    }}
                    tabindex="0"
                    role="button"
                    aria-label={`Select ${unit.name}`}
                  >
                    <td class="name-cell">
                      <b>{unit.name}</b>
                      {#if unit.isTippingPoint}
                        <span class="tag-star" title="Tipping Point">★</span>
                      {/if}
                      {#if unit.isSwing}
                        <span class="tag-swing">SWING</span>
                      {/if}
                    </td>
                    <td class="num-cell">{unit.electoralVotes}</td>
                    <td class="num-cell">{unit.supportPct.toFixed(1)}%</td>
                    <td class="num-cell" class:lead-pos={unit.currentMargin > 0} class:lead-neg={unit.currentMargin < 0}>
                      {unit.currentMargin >= 0 ? '+' : ''}{unit.currentMargin.toFixed(1)} pp
                    </td>
                    <td class="outlook-cell">
                      <span class="outlook-badge {unit.leaning}">
                        {unit.leaning.replace('-', ' ')}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else if viewMode === 'coalitions'}
          <div class="coalitions-wrapper" role="region" aria-label="Demographic Coalitions Overview">
            <div class="coalitions-header">
              <h3 class="coalitions-title">National Demographic Coalitions</h3>
              <p class="coalitions-subtitle">
                How macroeconomic trajectory and domestic social policies resonate across voter blocs (SOC-05).
              </p>
            </div>

            <div class="cohorts-grid">
              {#each cohorts as cohort (cohort.id)}
                <div class="cohort-card" data-testid={`cohort-${cohort.id}`}>
                  <div class="cohort-header">
                    <span class="cohort-name">{cohort.name}</span>
                    <span class="cohort-share">{cohort.sharePct}% of electorate</span>
                  </div>

                  <div class="cohort-meter-row">
                    <div class="cohort-metric">
                      <span class="cohort-pct">{cohort.supportPct.toFixed(1)}%</span>
                      <span class="cohort-trend" class:trend-up={cohort.supportDelta >= 0} class:trend-down={cohort.supportDelta < 0}>
                        {cohort.supportDelta >= 0 ? '▲ +' : '▼ '}{cohort.supportDelta.toFixed(1)}%
                      </span>
                    </div>
                    <div
                      class="cohort-bar-track"
                      role="progressbar"
                      aria-valuenow={cohort.supportPct}
                      aria-valuemin={15}
                      aria-valuemax={85}
                      aria-label={`${cohort.name} support`}
                    >
                      <div
                        class="cohort-bar-fill"
                        class:lead-pos={cohort.supportPct >= 50}
                        class:lead-neg={cohort.supportPct < 50}
                        style="width: {cohort.supportPct}%;"
                      ></div>
                    </div>
                  </div>

                  <div class="cohort-drivers">
                    {#if cohort.topPositiveDriver}
                      <div class="driver-item driver-positive">
                        <span class="driver-tag">✓</span>
                        <span class="driver-text">{cohort.topPositiveDriver}</span>
                      </div>
                    {/if}
                    {#if cohort.topNegativeDriver}
                      <div class="driver-item driver-negative">
                        <span class="driver-tag">✗</span>
                        <span class="driver-text">{cohort.topNegativeDriver}</span>
                      </div>
                    {/if}
                    {#if !cohort.topPositiveDriver && !cohort.topNegativeDriver}
                      <div class="driver-item driver-neutral">
                        <span class="driver-tag">•</span>
                        <span class="driver-text">Sentiment aligned with national baseline</span>
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- 270 Electoral College Bar -->
      <div class="ec-bar-container" data-testid="ec-bar">
        <div class="ec-header">
          <div class="ec-count you">
            <span class="count-label">You (Projected)</span>
            <span class="count-val">{summary.playerVotes} EV</span>
          </div>

          <div class="ec-target-label">
            <span class="target-flag">270 TO WIN</span>
          </div>

          <div class="ec-count them">
            <span class="count-label">Opponent</span>
            <span class="count-val">{summary.opponentVotes} EV</span>
          </div>
        </div>

        <div class="ec-meter-track" role="progressbar" aria-valuenow={summary.playerVotes} aria-valuemin={0} aria-valuemax={538} aria-label="Electoral College 270 Progress Bar">
          <div class="meter-segment you-seg" style="width: {youPct}%;"></div>
          <div class="meter-segment tossup-seg" style="width: {tossupPct}%;"></div>
          <div class="meter-segment them-seg" style="width: {themPct}%;"></div>

          <!-- 270 Milestone Pin -->
          <div class="target-pin" style="left: {targetPct}%;">
            <div class="pin-tick"></div>
          </div>
        </div>

        <!-- Honest Projection Range (Year 3+, turn >= 9, VOT-03) -->
        {#if summary.projectionRange}
          <div class="projection-whisker-row">
            <span class="whisker-tag">Honest Model Range:</span>
            <span class="whisker-range"><b>{summary.projectionRange.low} – {summary.projectionRange.high} EV</b></span>
            <span class="whisker-note">(accounts for remaining quarters & polling error)</span>
          </div>
        {/if}
      </div>
    </div>
  {/snippet}

  {#snippet learn()}
    <button
      type="button"
      class="link"
      onclick={() => onOpenMyth?.('rule_by_decree')}
    >
      Myth? How presidential actions shift the electoral landscape →
    </button>
  {/snippet}

  {#snippet next()}
    <div class="voters-sidebar" data-testid="state-inspector">
      {#if selectedUnit}
        <div class="card inspector-card">
          <div class="inspector-header">
            <div class="state-title-row">
              <h3 class="state-title">{selectedUnit.name}</h3>
              <span class="state-ev-pill">{selectedUnit.electoralVotes} EV</span>
            </div>
            <div class="inspector-badges">
              {#if selectedUnit.isTippingPoint}
                <span class="badge-tipping">★ TIPPING POINT</span>
              {/if}
              {#if selectedUnit.isSwing}
                <span class="badge-swing">SWING STATE</span>
              {/if}
            </div>
          </div>

          <div class="support-metric-box">
            <div class="support-big">
              <span class="support-pct">{selectedUnit.supportPct.toFixed(1)}%</span>
              <span class="support-label">Support</span>
            </div>
            <div class="support-trend" class:trend-up={selectedUnit.supportDelta >= 0} class:trend-down={selectedUnit.supportDelta < 0}>
              <span class="trend-icon">{selectedUnit.supportDelta >= 0 ? '▲' : '▼'}</span>
              <span class="trend-val">
                {selectedUnit.supportDelta >= 0 ? '+' : ''}{selectedUnit.supportDelta.toFixed(1)}% vs baseline
              </span>
            </div>
          </div>

          <!-- Demographic Salience Badges -->
          {#if salienceTags.length > 0}
            <div class="salience-tags-row">
              {#each salienceTags as tag}
                <span class="salience-tag">{tag}</span>
              {/each}
            </div>
          {/if}

          <!-- Local Family Impact (SOC-05) -->
          <div class="local-impact-box" data-testid="local-family-impact">
            <div class="impact-header">
              <span class="impact-label">LOCAL FAMILY IMPACT</span>
              <span class="impact-val" class:lead-pos={familyRelief > 0} class:lead-neg={familyRelief < 0}>
                {familyRelief >= 0 ? '+' : ''}${familyRelief} / mo
              </span>
            </div>
            <p class="rpp-note">
              {#if stateExposure?.rpp}
                Price parity index: <b>{stateExposure.rpp.toFixed(1)}</b>
                {#if stateExposure.rpp < 95}
                  (lower living costs stretch relief dollars)
                {:else if stateExposure.rpp > 105}
                  (higher living costs dampen relief impact)
                {:else}
                  (matches national price parity)
                {/if}
              {:else}
                National price parity benchmark: 100.0
              {/if}
            </p>
          </div>

          <!-- State Legislature & Article V Status (REF-04) -->
          {#if stateLeg}
            <div class="legislature-status-box" data-testid="state-legislature-status">
              <div class="leg-row">
                <span class="leg-label">STATE LEGISLATURE</span>
                <span class="leg-badge {stateLeg.control}">
                  {stateLeg.control === 'R' ? 'GOP Majority' : stateLeg.control === 'D' ? 'Dem Majority' : 'Divided Legislature'}
                </span>
              </div>
              {#if activeAmendment && !activeAmendment.isRatified && !activeAmendment.isExpired}
                <div class="ratification-status-row">
                  <span class="amendment-sub">Article V Status:</span>
                  {#if isStateRatified}
                    <span class="ratified-chip">✓ Ratified</span>
                  {:else}
                    <span class="pending-chip">Pending</span>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}

          <div class="reasons-section">
            <span class="reasons-title">WHY VOTERS FEEL THIS WAY</span>
            <ul class="reasons-list">
              {#each selectedUnit.reasons as reason}
                <li class="reason-item">{reason}</li>
              {/each}
            </ul>
          </div>
        </div>

        <!-- Strategic Actions Card -->
        <div class="card action-card">
          <span class="card-caption">STRATEGIC INTERVENTIONS</span>
          <div class="action-btn-row">
            <button
              type="button"
              class="side-btn"
              onclick={() => onOpenSpeech?.()}
            >
              🎤 Give a speech in {selectedUnit.name}
            </button>
          </div>
          <p class="action-hint">
            Speeches build clout and shift approval in key battlegrounds before the next election cycle.
          </p>
        </div>

        <!-- Primary Stamp Action Button -->
        <div class="stamp-action-box">
          <button
            type="button"
            class="stamp-btn"
            onclick={() => go?.('budget')}
          >
            Adjust tariffs & taxes in Budget →
          </button>
        </div>
      {:else}
        <div class="card empty-card">
          <p>Select any state or district to inspect voter sentiment.</p>
        </div>
      {/if}
    </div>
  {/snippet}
</ScreenLayout>

<style>
  .voters-main {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 8px;
  }

  .main-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 4px;
    flex-shrink: 0;
  }

  .view-switcher {
    display: inline-flex;
    background: var(--paper);
    border: 1px solid var(--ink);
    border-radius: var(--r-sm);
    overflow: hidden;
  }

  .switch-btn {
    border: none;
    background: none;
    padding: 4px 12px;
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
    color: var(--ink);
  }

  .switch-btn.active {
    background: var(--ink);
    color: var(--paper);
  }

  .meta-status {
    display: flex;
    gap: 12px;
    font-size: 12px;
    font-family: var(--font-condensed);
    color: var(--ink-soft);
    align-items: center;
  }

  .tipping-point-badge {
    color: var(--gold);
    font-weight: bold;
  }

  .display-area {
    flex: 1;
    min-height: 0;
    position: relative;
    border: 1px solid var(--ink);
    border-radius: var(--r-md);
    background: var(--card);
    overflow: hidden;
  }

  .map-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .table-wrapper {
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }

  /* Coalitions View (SOC-05) */
  .coalitions-wrapper {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    box-sizing: border-box;
  }

  .coalitions-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .coalitions-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: 18px;
    color: var(--ink);
  }

  .coalitions-subtitle {
    margin: 0;
    font-size: 12px;
    font-family: var(--font-body);
    color: var(--ink-soft);
  }

  .cohorts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
  }

  .cohort-card {
    background: var(--paper);
    border: 1px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }

  .cohort-card:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }

  .cohort-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 6px;
  }

  .cohort-name {
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: bold;
    color: var(--ink);
  }

  .cohort-share {
    font-size: 11px;
    font-family: var(--font-condensed);
    color: var(--ink-soft);
    white-space: nowrap;
  }

  .cohort-meter-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .cohort-metric {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .cohort-pct {
    font-size: 20px;
    font-family: var(--font-ui);
    font-weight: bold;
    color: var(--ink);
  }

  .cohort-trend {
    font-size: 11px;
    font-family: var(--font-ui);
    font-weight: bold;
  }

  .cohort-bar-track {
    height: 8px;
    background: var(--card);
    border: 1px solid var(--ink);
    border-radius: 4px;
    overflow: hidden;
  }

  .cohort-bar-fill {
    height: 100%;
    transition: width 0.3s ease;
  }

  .cohort-drivers {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 2px;
    font-size: 11px;
    font-family: var(--font-body);
  }

  .driver-item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    line-height: 1.3;
  }

  .driver-tag {
    font-weight: bold;
    font-family: var(--font-ui);
    flex-shrink: 0;
  }

  .driver-positive {
    color: var(--sage-dark);
  }

  .driver-negative {
    color: var(--alert-dark);
  }

  .driver-neutral {
    color: var(--ink-soft);
  }

  .states-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    font-family: var(--font-body);
  }

  .states-table th {
    position: sticky;
    top: 0;
    background: var(--paper);
    border-bottom: 2px solid var(--ink);
    padding: 8px 10px;
    text-align: left;
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--ink);
    cursor: pointer;
    user-select: none;
  }

  .states-table td {
    padding: 6px 10px;
    border-bottom: 1px solid var(--paper);
  }

  .state-row {
    cursor: pointer;
    transition: background 0.1s ease;
  }

  .state-row:hover,
  .state-row:focus-visible {
    background: var(--paper);
    outline: none;
  }

  .state-row.selected {
    background: var(--paper);
    border-left: 4px solid var(--gold);
  }

  .num-col, .num-cell {
    text-align: right;
    font-family: var(--font-ui);
  }

  .tag-star {
    color: var(--gold);
    font-size: 14px;
    margin-left: 4px;
  }

  .tag-swing {
    font-size: 9px;
    font-family: var(--font-ui);
    font-weight: bold;
    padding: 1px 5px;
    border-radius: 3px;
    background: var(--ink);
    color: var(--card);
    margin-left: 6px;
  }

  .lead-pos {
    color: var(--sage-dark);
    font-weight: bold;
  }

  .lead-neg {
    color: var(--alert-dark);
    font-weight: bold;
  }

  .outlook-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-family: var(--font-ui);
    text-transform: capitalize;
    color: var(--paper);
  }

  .outlook-badge.safe-you,
  .outlook-badge.likely-you {
    background: var(--sage-dark);
  }

  .outlook-badge.lean-you {
    background: var(--sky);
  }

  .outlook-badge.tossup {
    background: var(--gold);
  }

  .outlook-badge.lean-them {
    background: var(--alert);
  }

  .outlook-badge.likely-them,
  .outlook-badge.safe-them {
    background: var(--alert-dark);
  }

  /* 270 EC Bar */
  .ec-bar-container {
    background: var(--card);
    border: 1px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }

  .ec-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ec-count {
    display: flex;
    flex-direction: column;
  }

  .ec-count.you .count-val {
    font-size: 18px;
    font-family: var(--font-ui);
    font-weight: bold;
    color: var(--sage-dark);
  }

  .ec-count.them {
    text-align: right;
  }

  .ec-count.them .count-val {
    font-size: 18px;
    font-family: var(--font-ui);
    font-weight: bold;
    color: var(--alert-dark);
  }

  .count-label {
    font-size: 10px;
    font-family: var(--font-ui);
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .target-flag {
    font-size: 12px;
    font-family: var(--font-ui);
    font-weight: bold;
    padding: 2px 8px;
    background: var(--paper);
    border: 1px solid var(--ink);
    border-radius: 4px;
    color: var(--ink);
  }

  .ec-meter-track {
    position: relative;
    height: 16px;
    background: var(--paper);
    border: 1px solid var(--ink);
    border-radius: 4px;
    display: flex;
    overflow: visible;
  }

  .meter-segment.you-seg {
    background: var(--sage);
    transition: width 0.3s ease;
  }

  .meter-segment.tossup-seg {
    background: var(--gold);
    transition: width 0.3s ease;
  }

  .meter-segment.them-seg {
    background: var(--alert);
    transition: width 0.3s ease;
  }

  .target-pin {
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 2px;
    background: var(--ink);
    transform: translateX(-50%);
    z-index: 2;
  }

  .projection-whisker-row {
    font-size: 11px;
    font-family: var(--font-ui);
    color: var(--ink-soft);
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .whisker-range {
    color: var(--ink);
  }

  .whisker-note {
    font-style: italic;
    opacity: 0.8;
  }

  .learn-strip {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }

  .learn-badge {
    background: var(--ink);
    color: var(--paper);
    font-size: 10px;
    font-family: var(--font-ui);
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 3px;
  }

  .learn-link {
    background: none;
    border: none;
    padding: 0;
    color: var(--ink);
    text-decoration: underline;
    font-family: var(--font-body);
    font-size: 12px;
    cursor: pointer;
  }

  /* Sidebar */
  .voters-sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    overflow-y: auto;
    box-sizing: border-box;
    padding-right: 2px;
  }

  .inspector-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }

  .inspector-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .state-title-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .state-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: 20px;
    color: var(--ink);
  }

  .state-ev-pill {
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: bold;
    background: var(--paper);
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid var(--ink);
  }

  .inspector-badges {
    display: flex;
    gap: 6px;
  }

  .badge-tipping {
    font-size: 10px;
    font-family: var(--font-ui);
    font-weight: bold;
    color: var(--ink);
    background: var(--paper);
    border: 1px solid var(--gold-dark);
    padding: 1px 6px;
    border-radius: 3px;
  }

  .badge-swing {
    font-size: 10px;
    font-family: var(--font-ui);
    font-weight: bold;
    background: var(--ink);
    color: var(--card);
    padding: 1px 6px;
    border-radius: 3px;
  }

  .support-metric-box {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 8px 10px;
    background: var(--paper);
    border-radius: var(--r-sm);
  }

  .support-big {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .support-pct {
    font-size: 28px;
    font-family: var(--font-ui);
    font-weight: bold;
    color: var(--ink);
  }

  .support-label {
    font-size: 11px;
    font-family: var(--font-ui);
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .support-trend {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    font-family: var(--font-ui);
    font-weight: bold;
  }

  .trend-up {
    color: var(--sage-dark);
  }

  .trend-down {
    color: var(--alert-dark);
  }

  .salience-tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .salience-tag {
    font-size: 10px;
    font-family: var(--font-condensed);
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 3px;
    background: var(--paper);
    border: 1px solid var(--ink);
    color: var(--ink);
  }

  .local-impact-box {
    background: var(--paper);
    border: 1px solid var(--ink);
    border-radius: var(--r-sm);
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .impact-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .impact-label {
    font-size: 10px;
    font-family: var(--font-ui);
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--ink-soft);
  }

  .impact-val {
    font-size: 13px;
    font-family: var(--font-ui);
    font-weight: bold;
  }

  .rpp-note {
    margin: 0;
    font-size: 11px;
    font-family: var(--font-body);
    color: var(--ink-soft);
    line-height: 1.3;
  }

  .reasons-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .reasons-title {
    font-size: 10px;
    font-family: var(--font-ui);
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--ink-soft);
  }

  .reasons-list {
    margin: 0;
    padding-left: 18px;
    font-size: 12px;
    font-family: var(--font-body);
    color: var(--ink);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .action-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
  }

  .card-caption {
    font-size: 10px;
    font-family: var(--font-ui);
    font-weight: bold;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .side-btn {
    width: 100%;
    padding: 8px 12px;
    background: var(--paper);
    border: 1px solid var(--ink);
    border-radius: var(--r-sm);
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: bold;
    color: var(--ink);
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease;
  }

  .side-btn:hover {
    background: var(--card);
  }

  .action-hint {
    margin: 0;
    font-size: 11px;
    font-family: var(--font-body);
    color: var(--ink-soft);
    line-height: 1.3;
  }

  .stamp-action-box {
    margin-top: auto;
  }

  .stamp-btn {
    width: 100%;
    padding: 12px 14px;
    background: var(--ink);
    color: var(--paper);
    border: 2px solid var(--ink);
    border-radius: var(--r-sm);
    font-family: var(--font-ui);
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.1s ease, filter 0.15s ease;
  }

  .stamp-btn:hover {
    filter: brightness(1.15);
    transform: translateY(-1px);
  }

  .empty-card {
    padding: 24px;
    text-align: center;
    color: var(--ink-soft);
    font-size: 13px;
  }

  .legislature-status-box {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 10px;
    background: var(--paper-dark);
    border-radius: var(--r-sm);
  }

  .leg-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .leg-label {
    font-family: var(--font-condensed);
    font-size: 11px;
    font-weight: 700;
    color: var(--ink-soft);
  }

  .leg-badge {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: var(--r-sm);
  }

  .leg-badge.R {
    background: var(--alert-light);
    color: var(--ink);
  }

  .leg-badge.D {
    background: var(--sky);
    color: var(--ink);
  }

  .leg-badge.split {
    background: var(--paper);
    color: var(--ink);
    border: 1px solid var(--ink-soft);
  }

  .ratification-status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    margin-top: 2px;
  }

  .amendment-sub {
    color: var(--ink-soft);
  }

  .ratified-chip {
    font-weight: 700;
    color: var(--sage);
  }

  .pending-chip {
    font-weight: 600;
    color: var(--ink-soft);
  }
</style>
