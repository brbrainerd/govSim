<script lang="ts">
  import {
    MODEL_DOMAINS,
    MODEL_EQUATIONS,
    getInspectorEntries,
    getInspectorSummary,
    type ModelDomainId,
    type InspectorEntry,
  } from '../content/model-inspector';
  import Overlay from './Overlay.svelte';

  let {
    onClose,
  }: {
    onClose: () => void;
  } = $props();

  let selectedDomain = $state<ModelDomainId>('all');
  let searchQuery = $state<string>('');

  const summary = $derived(getInspectorSummary());
  const entries = $derived(getInspectorEntries(selectedDomain, searchQuery));

  const filteredEquations = $derived(
    selectedDomain === 'all'
      ? MODEL_EQUATIONS
      : MODEL_EQUATIONS.filter((eq) => eq.primaryDomain === selectedDomain),
  );

  function getRangePercent(entry: InspectorEntry): number | null {
    if (
      entry.rawLo === undefined ||
      entry.rawHi === undefined ||
      entry.rawValue === undefined ||
      entry.rawHi <= entry.rawLo
    ) {
      return null;
    }
    const ratio = (entry.rawValue - entry.rawLo) / (entry.rawHi - entry.rawLo);
    return Math.max(0, Math.min(100, Math.round(ratio * 100)));
  }
</script>

<Overlay title="Economic Model Inspector & Equations" {onClose}>
  <div class="inspector-modal" data-testid="model-inspector-modal">
    <!-- Header -->
    <header class="inspector-header">
      <div class="header-titles">
        <div class="badge-row">
          <span class="gov-badge">EMPIRICAL ARCHITECTURE</span>
          <span class="transparency-badge">SHOW YOUR WORK · DESIGN §4</span>
        </div>
        <h2 class="inspector-title">Economic Model &amp; Equation Inspector</h2>
        <p class="inspector-sub">
          Every coefficient in govSim is verified against academic and government research or calibrated
          as an audited, non-partisan policy judgment. No hidden biases or uncalibrated levers.
        </p>
      </div>
      <button
        type="button"
        class="close-btn"
        data-testid="model-inspector-close-x"
        onclick={onClose}
        aria-label="Close dialog"
      >
        ✕
      </button>
    </header>

    <!-- Stat Bar -->
    <div class="summary-bar" aria-label="Model metrics summary">
      <div class="stat-item">
        <span class="stat-val">{summary.totalParameters}</span>
        <span class="stat-lbl">Active Parameters</span>
      </div>
      <div class="stat-divider" aria-hidden="true"></div>
      <div class="stat-item">
        <span class="stat-val citation-stat">{summary.totalCitations}</span>
        <span class="stat-lbl">Verified Citations</span>
      </div>
      <div class="stat-divider" aria-hidden="true"></div>
      <div class="stat-item">
        <span class="stat-val judgement-stat">{summary.totalJudgement}</span>
        <span class="stat-lbl">Calibrated Judgments</span>
      </div>
      <div class="stat-divider" aria-hidden="true"></div>
      <div class="stat-item">
        <span class="stat-val equation-stat">{MODEL_EQUATIONS.length}</span>
        <span class="stat-lbl">Core Equations</span>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="controls-bar">
      <div class="search-box">
        <label for="model-search-input" class="sr-only">Search parameters</label>
        <input
          id="model-search-input"
          type="text"
          class="search-input"
          data-testid="model-search-input"
          placeholder="Search by parameter ID, equation, note, or citation..."
          bind:value={searchQuery}
        />
        {#if searchQuery}
          <button
            type="button"
            class="clear-search-btn"
            aria-label="Clear search"
            onclick={() => (searchQuery = '')}
          >
            ✕
          </button>
        {/if}
      </div>

      <div class="domain-pills" role="radiogroup" aria-label="Filter parameters by policy domain">
        {#each MODEL_DOMAINS as domain (domain.id)}
          <button
            type="button"
            role="radio"
            class="domain-pill"
            class:active={selectedDomain === domain.id}
            data-testid="model-domain-{domain.id}"
            aria-checked={selectedDomain === domain.id}
            onclick={() => (selectedDomain = domain.id)}
          >
            <span class="pill-label">{domain.label}</span>
            <span class="pill-count">{summary.domains[domain.id]}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Main Content: Equations & Parameters -->
    <div class="inspector-body">
      <!-- Left Column: Core Equations -->
      <aside class="equations-col" aria-label="Core mathematical equations">
        <div class="col-header">
          <h3 class="col-title">Core Equations</h3>
          <span class="col-badge">{filteredEquations.length} active</span>
        </div>

        {#if filteredEquations.length === 0}
          <div class="empty-equations">
            <p>No primary equations in this domain filter.</p>
          </div>
        {:else}
          <div class="equations-list">
            {#each filteredEquations as eq (eq.id)}
              <article class="eq-card" data-testid="model-equation-card">
                <div class="eq-header">
                  <h4 class="eq-title">{eq.title}</h4>
                  <span class="eq-domain">{eq.subtitle}</span>
                </div>
                <div class="formula-box">
                  <code>{eq.formula}</code>
                </div>
                <p class="eq-explanation">{eq.explanation}</p>
                {#if eq.sources && eq.sources.length > 0}
                  <div class="eq-citations">
                    <span class="citation-tag">Source:</span>
                    {#each eq.sources as src}
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="citation-link"
                      >
                        {src.text} ↗
                      </a>
                    {/each}
                  </div>
                {/if}
              </article>
            {/each}
          </div>
        {/if}
      </aside>

      <!-- Right Column: Parameter Registry -->
      <main class="params-col" aria-label="Parameter registry cards">
        <div class="col-header">
          <h3 class="col-title">Parameter Registry</h3>
          <span class="col-badge" data-testid="model-result-count">
            Showing {entries.length} of {summary.totalParameters}
          </span>
        </div>

        {#if entries.length === 0}
          <div class="empty-state">
            <p class="empty-title">No parameters match your search.</p>
            <p class="empty-sub">Try searching a different term or clearing your domain filter.</p>
            <button
              type="button"
              class="reset-btn"
              onclick={() => {
                searchQuery = '';
                selectedDomain = 'all';
              }}
            >
              Reset Filters
            </button>
          </div>
        {:else}
          <div class="params-list" data-testid="model-entries-list">
            {#each entries as entry (entry.id)}
              <article class="param-card" data-testid="model-entry-card">
                <div class="param-top">
                  <div class="param-meta">
                    <h4 class="param-label">{entry.label}</h4>
                    <div class="param-tags">
                      <code class="param-id">{entry.id}</code>
                      <span class="table-tag">{entry.table}</span>
                      <span class="domain-tag">{entry.domain}</span>
                    </div>
                  </div>

                  <span
                    class="basis-badge"
                    class:citation={entry.basis === 'citation'}
                    class:judgement={entry.basis === 'judgement'}
                    data-testid="model-basis-badge"
                  >
                    {entry.basis === 'citation' ? 'VERIFIED CITATION' : 'CALIBRATED JUDGMENT'}
                  </span>
                </div>

                <div class="param-values">
                  <div class="val-block">
                    <span class="val-label">Value</span>
                    <span class="val-text">
                      <strong>{entry.valueDisplay}</strong>
                      <span class="val-unit">{entry.unit}</span>
                    </span>
                  </div>

                  <div class="range-block">
                    <span class="val-label">Permitted Range</span>
                    <span class="range-text">{entry.rangeDisplay}</span>
                  </div>

                  {#if getRangePercent(entry) !== null}
                    <div class="bar-block" aria-label="Position in range">
                      <div class="range-track">
                        <div
                          class="range-fill"
                          style="width: {getRangePercent(entry)}%"
                        ></div>
                        <div
                          class="range-marker"
                          style="left: {getRangePercent(entry)}%"
                          title="Current: {entry.valueDisplay}"
                        ></div>
                      </div>
                    </div>
                  {/if}
                </div>

                <p class="param-note">{entry.note}</p>

                {#if entry.sources && entry.sources.length > 0}
                  <div class="param-sources">
                    <span class="sources-label">Citations:</span>
                    <ul class="sources-links">
                      {#each entry.sources as src}
                        <li>
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="source-anchor"
                          >
                            {src.text} ↗
                          </a>
                        </li>
                      {/each}
                    </ul>
                  </div>
                {/if}
              </article>
            {/each}
          </div>
        {/if}
      </main>
    </div>

    <!-- Footer -->
    <footer class="inspector-footer">
      <div class="footer-info">
        <span class="audit-note">
          Model Audit: 100% of mathematical limits, fiscal coefficients, and rules are exposed above.
        </span>
      </div>
      <button
        type="button"
        class="stamp-btn primary-stamp"
        data-testid="model-inspector-close-btn"
        onclick={onClose}
      >
        Done Inspecting
      </button>
    </footer>
  </div>
</Overlay>

<style>
  .inspector-modal {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: calc(100dvh - 56px);
    overflow: hidden;
    gap: clamp(8px, 1.2vh, 14px);
    font-family: var(--font-body);
    color: var(--ink);
  }

  .inspector-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid var(--ink-tint);
    padding-bottom: clamp(6px, 1vh, 12px);
    gap: 12px;
  }

  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 4px;
  }

  .gov-badge,
  .transparency-badge {
    font-family: var(--font-display);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 2px 8px;
    border-radius: var(--r-sm);
    text-transform: uppercase;
  }

  .gov-badge {
    background: var(--ink-tint);
    color: var(--ink);
    border: 1px solid var(--ink-soft);
  }

  .transparency-badge {
    background: var(--sage-tint);
    color: var(--sage-dark);
    border: 1px solid var(--sage-dark);
  }

  .inspector-title {
    font-family: var(--font-display);
    font-size: clamp(1.2rem, 2vw, 1.6rem);
    font-weight: 800;
    margin: 2px 0 4px;
    color: var(--ink);
  }

  .inspector-sub {
    font-size: 0.84rem;
    line-height: 1.35;
    color: var(--ink-soft);
    margin: 0;
    max-width: 820px;
  }

  .close-btn {
    background: none;
    border: 1px solid var(--ink-tint);
    border-radius: var(--r-sm);
    color: var(--ink-soft);
    font-size: 1.1rem;
    cursor: pointer;
    padding: 4px 10px;
    line-height: 1;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .close-btn:hover {
    background: var(--alert-tint);
    color: var(--alert-dark);
    border-color: var(--alert-dark);
  }

  /* Summary Metrics Bar */
  .summary-bar {
    display: flex;
    align-items: center;
    justify-content: space-around;
    background: var(--card-alt);
    border: 1px solid var(--ink-tint);
    border-radius: var(--r-md);
    padding: 6px 12px;
    gap: 8px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stat-val {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 800;
    line-height: 1.1;
    color: var(--ink);
  }

  .stat-val.citation-stat {
    color: var(--sage-dark);
  }

  .stat-val.judgement-stat {
    color: var(--ink-soft);
  }

  .stat-val.equation-stat {
    color: var(--ink);
  }

  .stat-lbl {
    font-size: 0.72rem;
    color: var(--ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .stat-divider {
    width: 1px;
    height: 24px;
    background: var(--ink-tint);
  }

  /* Controls Bar */
  .controls-bar {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .search-box {
    position: relative;
    width: 100%;
  }

  .search-input {
    width: 100%;
    padding: 7px 32px 7px 12px;
    font-size: 0.88rem;
    font-family: var(--font-body);
    color: var(--ink);
    background: var(--card);
    border: 1px solid var(--ink-soft);
    border-radius: var(--r-sm);
    box-sizing: border-box;
  }

  .search-input:focus {
    outline: 2px solid var(--ink);
    border-color: var(--ink);
  }

  .clear-search-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--ink-soft);
    cursor: pointer;
    font-size: 0.9rem;
    padding: 2px 6px;
  }

  .domain-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .domain-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border: 1px solid var(--ink-tint);
    background: var(--card);
    color: var(--ink-soft);
    border-radius: var(--r-sm);
    font-size: 0.8rem;
    cursor: pointer;
    font-family: var(--font-body);
    font-weight: 600;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }

  .domain-pill:hover {
    background: var(--card-alt);
    color: var(--ink);
  }

  .domain-pill.active {
    background: var(--ink);
    color: var(--card);
    border-color: var(--ink);
  }

  .pill-count {
    font-size: 0.72rem;
    background: var(--ink-tint);
    color: var(--ink);
    padding: 1px 5px;
    border-radius: 10px;
  }

  .domain-pill.active .pill-count {
    background: var(--card);
    color: var(--ink);
  }

  /* Body Split Grid */
  .inspector-body {
    display: grid;
    grid-template-columns: minmax(280px, 34%) minmax(0, 66%);
    gap: 16px;
    min-height: 0;
    flex: 1;
    overflow: hidden;
  }

  .equations-col,
  .params-col {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    background: var(--card);
    border: 1px solid var(--ink-tint);
    border-radius: var(--r-md);
    padding: 10px;
  }

  .col-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--ink-tint);
  }

  .col-title {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
    color: var(--ink);
  }

  .col-badge {
    font-size: 0.75rem;
    color: var(--ink-soft);
    font-weight: 600;
  }

  .equations-list,
  .params-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
    padding-right: 4px;
    min-height: 0;
    flex: 1;
  }

  /* Equation Cards */
  .eq-card {
    background: var(--card-alt);
    border: 1px solid var(--ink-tint);
    border-radius: var(--r-sm);
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .eq-header {
    display: flex;
    flex-direction: column;
  }

  .eq-title {
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0;
    color: var(--ink);
  }

  .eq-domain {
    font-size: 0.72rem;
    color: var(--ink-soft);
    text-transform: uppercase;
    font-weight: 600;
  }

  .formula-box {
    background: var(--card);
    border: 1px dashed var(--ink-soft);
    border-radius: var(--r-sm);
    padding: 6px 8px;
    overflow-x: auto;
  }

  .formula-box code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.78rem;
    color: var(--ink);
    word-break: break-all;
  }

  .eq-explanation {
    font-size: 0.8rem;
    line-height: 1.35;
    color: var(--ink-soft);
    margin: 0;
  }

  .eq-citations {
    font-size: 0.75rem;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
  }

  .citation-tag {
    font-weight: 700;
    color: var(--ink-soft);
  }

  .citation-link,
  .source-anchor {
    color: var(--ink);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
  }

  .citation-link:hover,
  .source-anchor:hover {
    color: var(--sage-dark);
  }

  /* Parameter Registry Cards */
  .param-card {
    background: var(--card);
    border: 1px solid var(--ink-tint);
    border-radius: var(--r-sm);
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: 0 1px 2px var(--dot);
  }

  .param-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }

  .param-label {
    font-family: var(--font-display);
    font-size: 0.98rem;
    font-weight: 700;
    margin: 0 0 2px;
    color: var(--ink);
  }

  .param-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .param-id {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.72rem;
    background: var(--card-alt);
    padding: 1px 5px;
    border-radius: var(--r-sm);
    color: var(--ink-soft);
  }

  .table-tag,
  .domain-tag {
    font-size: 0.68rem;
    padding: 1px 5px;
    border-radius: var(--r-sm);
    text-transform: uppercase;
    font-weight: 700;
  }

  .table-tag {
    background: var(--ink-tint);
    color: var(--ink-soft);
  }

  .domain-tag {
    background: var(--card-alt);
    color: var(--ink);
  }

  .basis-badge {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: var(--r-sm);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .basis-badge.citation {
    background: var(--sage-tint);
    color: var(--sage-dark);
    border: 1px solid var(--sage-dark);
  }

  .basis-badge.judgement {
    background: var(--ink-tint);
    color: var(--ink);
    border: 1px solid var(--ink-soft);
  }

  .param-values {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    background: var(--card-alt);
    border: 1px solid var(--ink-tint);
    border-radius: var(--r-sm);
    padding: 6px 10px;
  }

  .val-block,
  .range-block {
    display: flex;
    flex-direction: column;
  }

  .val-label {
    font-size: 0.68rem;
    color: var(--ink-soft);
    text-transform: uppercase;
    font-weight: 600;
  }

  .val-text strong {
    font-size: 0.95rem;
    font-family: ui-monospace, monospace;
    color: var(--ink);
  }

  .val-unit {
    font-size: 0.76rem;
    color: var(--ink-soft);
    margin-left: 3px;
  }

  .range-text {
    font-family: ui-monospace, monospace;
    font-size: 0.85rem;
    color: var(--ink-soft);
  }

  .bar-block {
    flex: 1;
    min-width: 100px;
    display: flex;
    align-items: center;
  }

  .range-track {
    position: relative;
    width: 100%;
    height: 8px;
    background: var(--card);
    border: 1px solid var(--ink-soft);
    border-radius: 4px;
    overflow: visible;
  }

  .range-fill {
    height: 100%;
    background: var(--sage);
    border-radius: 3px;
  }

  .range-marker {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    background: var(--alert);
    border: 2px solid var(--card);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 1px 2px var(--dot);
  }

  .param-note {
    font-size: 0.82rem;
    line-height: 1.35;
    color: var(--ink-soft);
    margin: 0;
  }

  .param-sources {
    border-top: 1px dashed var(--ink-tint);
    padding-top: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sources-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--ink-soft);
    text-transform: uppercase;
  }

  .sources-links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sources-links li {
    font-size: 0.75rem;
    line-height: 1.3;
  }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: var(--ink-soft);
  }

  .empty-title {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 4px;
  }

  .empty-sub {
    font-size: 0.82rem;
    margin: 0 0 12px;
  }

  .reset-btn {
    background: var(--ink);
    color: var(--card);
    border: none;
    border-radius: var(--r-sm);
    padding: 6px 14px;
    font-size: 0.8rem;
    cursor: pointer;
    font-weight: 600;
  }

  /* Footer */
  .inspector-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 2px solid var(--ink-tint);
    padding-top: clamp(6px, 1vh, 10px);
    gap: 12px;
  }

  .audit-note {
    font-size: 0.78rem;
    color: var(--ink-soft);
    font-style: italic;
  }

  .stamp-btn {
    border: 2px solid var(--ink);
    background: var(--ink);
    color: var(--card);
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    padding: 6px 18px;
    border-radius: var(--r-sm);
    cursor: pointer;
    box-shadow: var(--shadow);
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }

  .stamp-btn:hover {
    transform: translateY(-1px);
  }

  .stamp-btn:active {
    transform: translateY(1px);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  @media (max-width: 900px) {
    .inspector-body {
      grid-template-columns: 1fr;
    }
    .equations-col {
      max-height: 200px;
    }
  }
</style>
