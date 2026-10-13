<script lang="ts">
  import type { GameOptions } from '../app/session.svelte';
  import { PARTIES, type PartyId } from '../content/parties';
  import { termLabel } from '../engine/calendar';
  import ScreenLayout from '../ui/ScreenLayout.svelte';
  import type { SaveFile } from '../app/save';

  let {
    onStart,
    onResume,
    onImport,
    autosave = null,
    errorMessage = null,
  }: {
    onStart: (o: GameOptions) => void;
    onResume?: (s: SaveFile) => void;
    onImport?: (f: File) => void;
    autosave?: SaveFile | null;
    errorMessage?: string | null;
  } = $props();

  let party = $state<PartyId | null>(null);
  let evilMode = $state(false);
  let dismissResume = $state(false);
  let fileInput = $state<HTMLInputElement>();

  const showResume = $derived(autosave !== null && !dismissResume && onResume !== undefined);
  const saveParty = $derived(
    autosave ? (PARTIES.find((p) => p.id === autosave.options.party)?.name ?? autosave.options.party) : '',
  );
  const saveTurn = $derived(autosave ? autosave.inputs.length + 1 : 1);
  const saveSeason = $derived(termLabel(saveTurn));
</script>

<div class="newgame halftone">
  <ScreenLayout question="Which party do you lead?">
    {#snippet main()}
      {#if errorMessage}
        <div role="alert" class="card alert-banner">
          <span class="label error-label">Notice</span>
          <span class="error-text">{errorMessage}</span>
        </div>
      {/if}

      {#if showResume && autosave}
        <div class="card resume-card" role="region" aria-label="Resume previous game">
          <span class="label">Saved game in progress</span>
          <h2 class="resume-title">Resume your term?</h2>
          <div class="resume-meta">
            <span class="meta-item">Turn {saveTurn} of 32 · {saveSeason}</span>
            <span class="meta-item">Party: {saveParty}</span>
          </div>
          <div class="resume-actions">
            <button class="stamp resume-btn" onclick={() => onResume?.(autosave!)}>Resume term</button>
            <button class="navy-btn" onclick={() => (dismissResume = true)}>Start new term</button>
          </div>
        </div>
      {/if}

      <div class="options" role="radiogroup" aria-label="Your party">
        {#each PARTIES as p (p.id)}
          <label class="card option">
            <input type="radio" name="party" value={p.id} bind:group={party} />
            <b>{p.name}</b>
          </label>
        {/each}
      </div>

      <div class="mode-section" role="radiogroup" aria-label="Game Mode">
        <span class="label">Governing Objective</span>
        <div class="mode-cards">
          <label class="card mode-option" class:active-mode={!evilMode}>
            <input type="radio" name="gameMode" value="standard" checked={!evilMode} onchange={() => (evilMode = false)} />
            <div class="mode-info">
              <b>Public Servant (Standard)</b>
              <span class="mode-sub">Serve the nation. Balance economic growth, stability, and societal well-being.</span>
            </div>
          </label>
          <label class="card mode-option evil-option" class:active-mode={evilMode} data-testid="evil-mode-card">
            <input type="radio" name="gameMode" value="evil" checked={evilMode} onchange={() => (evilMode = true)} data-testid="evil-mode-toggle" />
            <div class="mode-info">
              <b>Satirical "Evil Mode"</b>
              <span class="mode-sub">Loot the treasury. Maximize your offshore stash while evading impeachment and conviction.</span>
            </div>
          </label>
        </div>
      </div>

      <div class="import-strip">
        <button type="button" class="import-btn" onclick={() => fileInput?.click()}>
          Load save file (.json)
        </button>
        <input
          bind:this={fileInput}
          type="file"
          accept=".json,application/json"
          style="display:none"
          onchange={(e) => {
            const f = e.currentTarget.files?.[0];
            if (f && onImport) onImport(f);
            e.currentTarget.value = '';
          }}
        />
      </div>
    {/snippet}
    {#snippet next()}
      {#if evilMode}
        <div class="card info evil-warning" role="note" aria-label="Evil mode disclaimer">
          <span class="label">Satirical Mode Warning</span>
          <span class="line">You have selected Satirical Evil Mode. Your goal is personal enrichment.</span>
          <span class="line">Every corrupt move generates public Heat. Too much Heat triggers Special Counsel, Impeachment, and Conviction.</span>
        </div>
      {:else}
        <div class="card info">
          <span class="label">What it means</span>
          <span class="line">Your party changes the names you see. The economy plays the same either way.</span>
          <span class="line">Your term is made up. It starts from the real economy of late 2026.</span>
        </div>
      {/if}
      <div class="spacer"></div>
      <button
        class="stamp"
        class:evil-stamp={evilMode}
        disabled={party === null}
        onclick={() => party && onStart({ party, evilMode })}
      >
        {evilMode ? 'Seize power' : 'Start the term'}
      </button>
    {/snippet}
  </ScreenLayout>
</div>

<style>
  .newgame { height: 100dvh; max-height: 100dvh; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr) clamp(240px, 20vw, 290px); gap: clamp(14px, 2vw, 24px); padding: clamp(16px, 2.5vh, 28px) clamp(16px, 2.5vw, 28px); }
  .options { display: flex; flex-direction: column; gap: clamp(10px, 1.5vh, 14px); max-width: 48rem; }
  .option { display: flex; align-items: center; gap: clamp(10px, 1.2vw, 14px); padding: clamp(12px, 1.8vh, 18px) clamp(14px, 1.8vw, 20px); cursor: pointer; }
  .option b { font: 700 clamp(20px, 2vw, 24px) var(--font-display); color: var(--ink); }
  .option input { width: 22px; height: 22px; accent-color: var(--ink); }
  .option:has(input:checked) { background: var(--gold); }
  .option:has(input:focus-visible) { outline: 3px solid var(--ink); outline-offset: 3px; }
  
  .resume-card {
    padding: clamp(14px, 2vh, 20px);
    margin-bottom: clamp(12px, 1.8vh, 18px);
    max-width: 48rem;
    border: 3px solid var(--ink);
    background: var(--paper-warm);
  }
  .resume-title {
    font: 700 clamp(22px, 2.2vw, 28px) var(--font-display);
    color: var(--ink);
    margin: 4px 0 8px 0;
  }
  .resume-meta {
    display: flex;
    gap: 16px;
    margin-bottom: 14px;
    font: 600 clamp(14px, 1.1vw, 16px) var(--font-body);
    color: var(--ink-soft);
  }
  .resume-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .navy-btn {
    font: 600 clamp(14px, 1vw, 16px) var(--font-ui);
    text-transform: uppercase;
    letter-spacing: .06em;
    padding: 10px 18px;
    background: var(--ink);
    color: var(--card);
    border: 2px solid var(--ink);
    border-radius: 4px;
    box-shadow: 2px 2px 0 var(--ink);
    cursor: pointer;
  }
  .navy-btn:hover {
    background: var(--ink-soft);
  }

  .alert-banner {
    padding: 12px 16px;
    margin-bottom: 12px;
    border: 2px solid var(--alert);
    background: var(--card);
    max-width: 48rem;
  }
  .error-label {
    color: var(--alert);
    font-weight: 700;
  }
  .error-text {
    display: block;
    font: 500 15px/1.3 var(--font-body);
    color: var(--ink);
    margin-top: 2px;
  }

  .import-strip {
    margin-top: clamp(10px, 1.5vh, 16px);
  }
  .import-btn {
    background: none;
    border: none;
    font: 600 clamp(13px, 1vw, 15px) var(--font-ui);
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--ink-soft);
    text-decoration: underline;
    cursor: pointer;
    padding: 4px 0;
  }
  .import-btn:hover {
    color: var(--ink);
  }

  .info { display: flex; flex-direction: column; gap: 4px; padding: clamp(12px, 1.5vh, 16px); }
  .line { font: 500 clamp(14px, 1.1vw, 16px)/1.3 var(--font-body); color: var(--ink-soft); max-width: 55ch; }
  .spacer { flex-grow: 1; min-height: 8px; }
  .stamp { align-self: center; flex-shrink: 0; }
  .stamp:disabled { opacity: .45; cursor: not-allowed; }

  .mode-section { margin-top: clamp(12px, 1.8vh, 18px); max-width: 48rem; display: flex; flex-direction: column; gap: 8px; }
  .mode-cards { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(10px, 1.2vw, 14px); }
  .mode-option { display: flex; align-items: flex-start; gap: 10px; padding: clamp(10px, 1.4vh, 14px) clamp(12px, 1.4vw, 16px); cursor: pointer; }
  .mode-option input { width: 18px; height: 18px; accent-color: var(--ink); margin-top: 2px; }
  .mode-option.active-mode { background: var(--gold); }
  .mode-option.evil-option.active-mode { background: var(--alert-tint); border-color: var(--alert); }
  .mode-info { display: flex; flex-direction: column; gap: 2px; }
  .mode-info b { font: 700 clamp(15px, 1.2vw, 17px) var(--font-display); color: var(--ink); }
  .mode-sub { font: 500 clamp(12px, 0.9vw, 13px)/1.3 var(--font-body); color: var(--ink-soft); }
  .evil-warning { border-color: var(--alert); background: var(--card); }
  .evil-warning .label { color: var(--alert); }
  .stamp.evil-stamp { background: var(--alert-dark); border-color: var(--ink); }
</style>
