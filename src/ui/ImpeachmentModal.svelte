<script lang="ts">
  import type { EvilState } from '../engine/evil';
  import {
    HOUSE_IMPEACHMENT_THRESHOLD,
    HOUSE_TOTAL_SEATS,
    SENATE_CONVICTION_THRESHOLD,
    SENATE_TOTAL_SEATS,
  } from '../engine/units';
  import Character, { resolvePresidentLook, type Look } from './art/Character.svelte';
  import Overlay from './Overlay.svelte';

  let {
    evilState,
    onClose,
  }: {
    evilState?: EvilState;
    onClose: () => void;
  } = $props();

  const CHIEF_JUSTICE_LOOK: Look = {
    skin: 'skin-3',
    hair: 'hair-4',
    hairStyle: 'short',
    outfit: 'suit',
    suit: 'ink',
    tie: 'paper',
    glasses: true,
  };

  const houseVotes = $derived(evilState?.houseImpeachmentVotes ?? HOUSE_IMPEACHMENT_THRESHOLD);
  const houseNays = $derived(Math.max(0, HOUSE_TOTAL_SEATS - houseVotes));
  const senateVotes = $derived(evilState?.senateConvictionVotes ?? 0);
  const senateNays = $derived(Math.max(0, SENATE_TOTAL_SEATS - senateVotes));
  const isConvicted = $derived(Boolean(evilState?.convicted));
  const isImpeached = $derived(Boolean(evilState?.articlesOfImpeachmentVoted));
  const defendantLook = $derived(
    resolvePresidentLook(0, true, isConvicted ? 'panicked' : 'scheming'),
  );
</script>

<Overlay title={isConvicted ? 'Impeachment Trial: Convicted' : 'Impeachment Trial: Acquitted'} {onClose}>
  <div class="impeachment-shell" data-testid="impeachment-modal">
    <div class="header">
      <span class="badge" class:convicted-badge={isConvicted}>
        {isConvicted ? 'CONSTITUTIONAL REMOVAL' : 'SENATE TRIAL ACQUITTAL'}
      </span>
      <h2 class="title">
        {isConvicted ? 'Convicted by the Senate' : 'Acquitted by the Senate'}
      </h2>
      <p class="summary">
        {#if isConvicted}
          The United States Senate has concluded the trial on Articles of Impeachment, rendering a verdict of guilty on charges of public corruption, abuse of executive authority, and illicit overseas enrichment.
        {:else}
          The United States Senate has completed roll call on Articles of Impeachment. While the House adopted formal articles, the prosecution failed to achieve the mandatory two-thirds supermajority for removal from office.
        {/if}
      </p>
    </div>

    <!-- Senate Trial & Chief Justice Verdict Vignette (VIGNETTE-03) -->
    <div
      class="trial-vignette"
      data-testid="impeachment-trial-vignette"
      data-verdict={isConvicted ? 'convicted' : 'acquitted'}
    >
      <svg viewBox="0 0 440 100" class="trial-svg" aria-hidden="true">
        <rect x="0" y="0" width="440" height="100" fill="var(--card)" />
        <line x1="0" y1="88" x2="440" y2="88" stroke="var(--ink)" stroke-width="2" />
        <!-- Senate Chamber Columns -->
        <rect x="18" y="0" width="12" height="88" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5" />
        <rect x="196" y="0" width="12" height="88" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5" />
        <rect x="410" y="0" width="12" height="88" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5" />

        <!-- Chief Justice Presiding -->
        <text x="42" y="16" class="trial-svg-lbl">CHIEF JUSTICE PRESIDING</text>
        <Character
          x={110}
          y={4}
          scale={0.75}
          look={CHIEF_JUSTICE_LOOK}
          mood={isConvicted ? 'stressed' : 'confident'}
          pose={isConvicted ? 'point' : 'stand'}
          prop="gavel"
        />
        <rect x="64" y="64" width="92" height="24" fill="var(--wood)" stroke="var(--ink)" stroke-width="2" />

        <!-- Defense Counsel Table & Defendant President -->
        <text x="236" y="16" class="trial-svg-lbl">
          {isConvicted ? 'REMOVED UNDER ART. II §4' : 'EXECUTIVE AUTHORITY RETAINED'}
        </text>
        <Character
          x={318}
          y={4}
          scale={0.75}
          look={defendantLook}
          mood={isConvicted ? 'panicked' : 'scheming'}
          pose={isConvicted ? 'facepalm' : 'cash'}
        />
        <rect x="272" y="68" width="92" height="20" fill="var(--wood-light)" stroke="var(--ink)" stroke-width="2" />
      </svg>
    </div>

    <div class="tallies-grid">
      <!-- House Impeachment Tally -->
      <section class="tally-card" aria-label="House Impeachment Vote">
        <div class="chamber-header">
          <span class="chamber-title">U.S. House of Representatives</span>
          <span class="chamber-badge adopted">Articles Adopted</span>
        </div>
        <div class="vote-counts">
          <div class="vote-metric yea">
            <span class="num">{houseVotes}</span>
            <span class="lbl">Yeas</span>
          </div>
          <div class="vote-divider" aria-hidden="true">:</div>
          <div class="vote-metric nay">
            <span class="num">{houseNays}</span>
            <span class="lbl">Nays</span>
          </div>
        </div>
        <div class="threshold-track">
          <div class="track-bar" style="width: {(houseVotes / HOUSE_TOTAL_SEATS) * 100}%"></div>
          <div class="track-marker" style="left: {(HOUSE_IMPEACHMENT_THRESHOLD / HOUSE_TOTAL_SEATS) * 100}%" title="218 To Pass"></div>
        </div>
        <div class="threshold-caption">
          <span>Threshold: 218 Votes</span>
          <span>Total: 435 Seats</span>
        </div>
      </section>

      <!-- Senate Trial Tally -->
      <section class="tally-card" aria-label="Senate Trial Vote">
        <div class="chamber-header">
          <span class="chamber-title">United States Senate</span>
          <span class="chamber-badge" class:convicted={isConvicted} class:acquitted={!isConvicted}>
            {isConvicted ? 'Guilty Verdict' : 'Acquitted'}
          </span>
        </div>
        <div class="vote-counts">
          <div class="vote-metric" class:convicted-num={isConvicted}>
            <span class="num">{senateVotes}</span>
            <span class="lbl">Guilty</span>
          </div>
          <div class="vote-divider" aria-hidden="true">:</div>
          <div class="vote-metric nay">
            <span class="num">{senateNays}</span>
            <span class="lbl">Not Guilty</span>
          </div>
        </div>
        <div class="threshold-track">
          <div class="track-bar" class:convicted-bar={isConvicted} style="width: {(senateVotes / SENATE_TOTAL_SEATS) * 100}%"></div>
          <div class="track-marker" style="left: {(SENATE_CONVICTION_THRESHOLD / SENATE_TOTAL_SEATS) * 100}%" title="67 Supermajority"></div>
        </div>
        <div class="threshold-caption">
          <span>2/3 Supermajority: 67 Votes</span>
          <span>Total: 100 Senators</span>
        </div>
      </section>
    </div>

    <!-- Satirical Verdict Callout -->
    <div class="verdict-banner" class:convicted-banner={isConvicted}>
      <div class="banner-title">
        {#if isConvicted}
          ⚡ EXECUTIVE POWERS STRIPPED · OFFSHORE STASH FORFEITED
        {:else}
          ⚡ TRIAL CONCLUDED · EXECUTIVE AUTHORITY PRESERVED
        {/if}
      </div>
      <p class="banner-body">
        {#if isConvicted}
          All offshore accounts frozen by federal decree ($0.0B recovered). Department of Justice asset forfeiture teams have impounded all private foundations, overseas holding shell entities, and siphoned kickbacks. Your administration is terminated immediately under Article II, Section 4.
        {:else}
          Acquitted by narrow minority: Heat burns hot but power remains intact. The constitutional threshold of 67 votes withstood partisan pressure. Your offshore accounts remain insulated behind foreign bank secrecy laws, but institutional trust and congressional whip friction remain scarred.
        {/if}
      </p>
    </div>

    <div class="actions">
      {#if isConvicted}
        <button
          type="button"
          class="stamp stamp-alert"
          data-testid="impeachment-term-over-btn"
          onclick={onClose}
        >
          Accept Verdict · Term Over
        </button>
      {:else}
        <button
          type="button"
          class="stamp stamp-primary"
          data-testid="impeachment-continue-btn"
          onclick={onClose}
        >
          Return to Oval Office
        </button>
      {/if}
    </div>
  </div>
</Overlay>

<style>
  .impeachment-shell {
    display: flex;
    flex-direction: column;
    gap: clamp(14px, 2vh, 22px);
    max-width: 680px;
    padding: clamp(12px, 1.5vh, 20px);
  }
  .header {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .badge {
    align-self: flex-start;
    font: 700 clamp(11px, 0.8vw, 13px) var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: var(--gold-soft);
    color: var(--ink);
    padding: 3px 8px;
    border-radius: var(--r-sm);
    border: 1px solid var(--gold-dark);
  }
  .badge.convicted-badge {
    background: var(--alert);
    color: var(--paper);
    border-color: var(--ink);
  }
  .title {
    margin: 0;
    font: 700 clamp(22px, 2.2vw, 30px) var(--font-slab);
    color: var(--ink);
    line-height: 1.15;
  }
  .summary {
    margin: 0;
    font: 400 clamp(13px, 1vw, 15px) var(--font-body);
    color: var(--ink-soft);
    line-height: 1.45;
  }
  .trial-vignette {
    width: 100%;
    height: 92px;
    border: 2px solid var(--ink);
    border-radius: var(--r-md);
    box-shadow: 2px 2px 0 var(--ink);
    overflow: hidden;
    background: var(--card);
    flex-shrink: 0;
  }
  .trial-svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  .trial-svg-lbl {
    font: 700 9.5px var(--font-ui);
    fill: var(--ink);
    letter-spacing: 0.05em;
  }
  .tallies-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(10px, 1.4vw, 16px);
  }
  .tally-card {
    background: var(--paper);
    border: var(--rule) solid var(--ink);
    border-radius: var(--r-md);
    padding: clamp(10px, 1.2vw, 14px);
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 2px 2px 0 var(--ink);
  }
  .chamber-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .chamber-title {
    font: 700 clamp(11px, 0.85vw, 13px) var(--font-ui);
    text-transform: uppercase;
    color: var(--ink);
    letter-spacing: 0.03em;
  }
  .chamber-badge {
    font: 600 10px var(--font-ui);
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: var(--r-sm);
  }
  .chamber-badge.adopted {
    background: var(--ink);
    color: var(--paper);
  }
  .chamber-badge.convicted {
    background: var(--alert);
    color: var(--paper);
  }
  .chamber-badge.acquitted {
    background: var(--sage);
    color: var(--ink);
  }
  .vote-counts {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 12px;
    padding: 4px 0;
  }
  .vote-metric {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .vote-metric .num {
    font: 700 clamp(24px, 2.4vw, 32px) var(--font-ui);
    color: var(--ink);
    line-height: 1;
  }
  .vote-metric.yea .num {
    color: var(--alert);
  }
  .vote-metric.convicted-num .num {
    color: var(--alert);
  }
  .vote-metric .lbl {
    font: 600 clamp(10px, 0.75vw, 11px) var(--font-ui);
    text-transform: uppercase;
    color: var(--ink-soft);
  }
  .vote-divider {
    font: 700 20px var(--font-ui);
    color: var(--ink-soft);
  }
  .threshold-track {
    position: relative;
    height: 10px;
    background: var(--card);
    border: 1px solid var(--ink);
    border-radius: 4px;
    overflow: hidden;
  }
  .track-bar {
    height: 100%;
    background: var(--ink);
    transition: width 0.3s ease;
  }
  .track-bar.convicted-bar {
    background: var(--alert);
  }
  .track-marker {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--gold-dark);
  }
  .threshold-caption {
    display: flex;
    justify-content: space-between;
    font: 500 10px var(--font-ui);
    color: var(--ink-soft);
  }
  .verdict-banner {
    background: var(--card);
    border: 2px solid var(--gold-dark);
    border-radius: var(--r-md);
    padding: clamp(10px, 1.4vw, 14px);
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: 2px 2px 0 var(--ink);
  }
  .verdict-banner.convicted-banner {
    border-color: var(--alert);
    background: var(--paper);
  }
  .banner-title {
    font: 700 clamp(12px, 0.95vw, 14px) var(--font-ui);
    text-transform: uppercase;
    color: var(--ink);
    letter-spacing: 0.04em;
  }
  .verdict-banner.convicted-banner .banner-title {
    color: var(--alert);
  }
  .banner-body {
    margin: 0;
    font: 400 clamp(12px, 0.9vw, 14px) var(--font-body);
    color: var(--ink);
    line-height: 1.4;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  .stamp {
    font: 700 clamp(13px, 1.1vw, 16px) var(--font-ui);
    text-transform: uppercase;
    padding: clamp(8px, 1.2vh, 12px) clamp(16px, 1.8vw, 24px);
    border-radius: var(--r-sm);
    cursor: pointer;
    border: var(--rule) solid var(--ink);
    box-shadow: 2px 2px 0 var(--ink);
    transition: transform 0.05s ease;
  }
  .stamp:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--ink);
  }
  .stamp:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0 var(--ink);
  }
  .stamp-primary {
    background: var(--gold);
    color: var(--ink);
  }
  .stamp-alert {
    background: var(--alert);
    color: var(--paper);
  }
</style>
