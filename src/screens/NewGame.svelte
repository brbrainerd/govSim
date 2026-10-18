<script lang="ts">
  import type { GameOptions } from '../app/session.svelte';
  import { PARTIES, type PartyId } from '../content/parties';
  import { SCENARIOS, getScenario, type ScenarioId } from '../content/scenarios';
  import { termLabel } from '../engine/calendar';
  import ScreenLayout from '../ui/ScreenLayout.svelte';
  import Character, { PRESIDENT_LOOKS, resolvePresidentLook } from '../ui/art/Character.svelte';
  import CharacterPortrait from '../ui/art/CharacterPortrait.svelte';
  import type { BrowserProfile, SaveFile } from '../app/save';

  let {
    onStart,
    onResume,
    onImport,
    onSelectProfile,
    profiles = [],
    activeProfileId = 'default',
    autosave = null,
    errorMessage = null,
  }: {
    onStart: (o: GameOptions) => void;
    onResume?: (s: SaveFile) => void;
    onImport?: (f: File) => void;
    onSelectProfile?: (profileId: string) => void;
    profiles?: readonly BrowserProfile[];
    activeProfileId?: string;
    autosave?: SaveFile | null;
    errorMessage?: string | null;
  } = $props();

  let party = $state<PartyId | null>(null);
  let evilMode = $state(false);
  let presidentLook = $state<0 | 1 | 2 | 3>(0);
  let scenario = $state<ScenarioId>('standard_2026');
  let unlockAll = $state(false);
  let livingWorld = $state(false);
  let vocabMode = $state<'plain' | 'wonk'>(
    typeof localStorage !== 'undefined' &&
      typeof localStorage?.getItem === 'function' &&
      localStorage.getItem('govsim_vocab_mode') === 'wonk'
      ? 'wonk'
      : 'plain',
  );
  let dismissResume = $state(false);
  let fileInput = $state<HTMLInputElement>();

  const selectedScenario = $derived(getScenario(scenario));
  const activeLook = $derived(
    resolvePresidentLook(presidentLook, evilMode, evilMode ? 'scheming' : 'confident'),
  );
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

      <div class="mode-section" role="radiogroup" aria-label="Starting Scenario" data-testid="scenario-selector">
        <span class="label">Starting Scenario</span>
        <div class="scenario-cards">
          {#each SCENARIOS as s (s.id)}
            <label
              class="card mode-option scenario-option"
              class:active-mode={scenario === s.id}
              data-testid={`scenario-card-${s.id}`}
            >
              <input
                type="radio"
                name="scenario"
                value={s.id}
                checked={scenario === s.id}
                onchange={() => (scenario = s.id)}
              />
              <div class="mode-info">
                <div class="scen-head">
                  <b>{s.name}</b>
                  <span class="scen-tag">{s.tag}</span>
                </div>
                <span class="mode-sub">{s.summary}</span>
              </div>
            </label>
          {/each}
        </div>
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

      <div class="pacing-section">
        <span class="label">Term Options &amp; Civics Language</span>
        <div class="pacing-grid">
          <label class="card unlock-all-card" class:active-mode={unlockAll}>
            <input
              type="checkbox"
              checked={unlockAll}
              onchange={(e) => (unlockAll = e.currentTarget.checked)}
              data-testid="unlock-all-toggle"
            />
            <div class="mode-info">
              <b>Experienced Mode: Unlock all</b>
              <span class="mode-sub">Unlock Your Powers, Trade &amp; Voters on Turn 1.</span>
            </div>
          </label>

          <label class="card unlock-all-card" class:active-mode={livingWorld}>
            <input
              type="checkbox"
              checked={livingWorld}
              onchange={(e) => (livingWorld = e.currentTarget.checked)}
              data-testid="living-world-toggle"
            />
            <div class="mode-info">
              <b>Living World Shocks</b>
              <span class="mode-sub">Enable unpredictable quarterly market &amp; supply shifts.</span>
            </div>
          </label>

          <label class="card unlock-all-card" class:active-mode={vocabMode === 'wonk'}>
            <input
              type="checkbox"
              checked={vocabMode === 'wonk'}
              onchange={(e) => (vocabMode = e.currentTarget.checked ? 'wonk' : 'plain')}
              data-testid="vocab-mode-toggle-newgame"
            />
            <div class="mode-info">
              <b>{vocabMode === 'wonk' ? '📜 Policy Wonk Mode' : '🗣️ Plain Talk (Default)'}</b>
              <span class="mode-sub">
                {vocabMode === 'wonk'
                  ? 'Show statutory citations & formal macro terms immediately.'
                  : 'Friendly everyday language with trade-offs upfront.'}
              </span>
            </div>
          </label>
        </div>
      </div>

      <div class="import-strip">
        <button type="button" class="import-btn" onclick={() => fileInput?.click()}>
          Load save file (.json)
        </button>
        {#if profiles.length > 0 && onSelectProfile}
          <div class="slot-group" role="group" aria-label="Browser save slot">
            <span class="slot-label">Browser Slot:</span>
            {#each profiles as prof (prof.id)}
              <button
                type="button"
                class="slot-btn"
                class:active-slot={activeProfileId === prof.id}
                data-testid={`profile-slot-${prof.id}`}
                onclick={() => {
                  dismissResume = false;
                  onSelectProfile(prof.id);
                }}
              >
                {prof.name}
              </button>
            {/each}
          </div>
        {/if}
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
      <div
        class="card portico-banner"
        class:evil-portico={evilMode}
        data-testid="newgame-portico-banner"
        role="img"
        aria-label={evilMode ? 'White House portico under dark kleptocratic sky' : 'White House inauguration portico'}
      >
        <svg viewBox="0 0 320 185" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
          <rect width="320" height="185" fill={evilMode ? 'var(--ink)' : 'var(--paper-warm)'} />
          <!-- Swallowtail govSim ribbon banner -->
          <polygon points="26,20 56,18 48,30 56,42 26,40 34,30" fill={evilMode ? 'var(--alert-dark)' : 'var(--ink-soft)'} stroke="var(--ink)" stroke-width="1.5" />
          <polygon points="294,20 264,18 272,30 264,42 294,40 286,30" fill={evilMode ? 'var(--alert-dark)' : 'var(--ink-soft)'} stroke="var(--ink)" stroke-width="1.5" />
          <path d="M46 12 Q160 2 274 12 L268 38 Q160 28 52 38 Z" fill={evilMode ? 'var(--alert)' : 'var(--ink)'} stroke="var(--ink)" stroke-width="2" />
          <circle cx="70" cy="24" r="4" fill="var(--gold)" />
          <circle cx="250" cy="24" r="4" fill="var(--gold)" />
          <text x="160" y="28" text-anchor="middle" font-family="var(--font-display)" font-size="18" font-weight="800" fill="var(--card)">
            {evilMode ? 'govSim · EVIL' : 'govSim'}
          </text>

          <!-- White House roof flag -->
          <line x1="160" y1="36" x2="160" y2="54" stroke="var(--ink)" stroke-width="1.8" />
          <rect x="161" y="37" width="18" height="10" rx="1" fill="var(--alert)" stroke="var(--ink)" stroke-width="1" />
          <rect x="161" y="37" width="7" height="5" fill="var(--ink)" />

          <!-- Neoclassical White House facade & triangular pediment -->
          <rect x="34" y="72" width="252" height="76" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
          <polygon points="88,72 160,48 232,72" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
          <polygon points="98,70 160,52 222,70" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.2" />

          <!-- Side wings windows -->
          {#each [48, 70, 236, 258] as wx (wx)}
            <rect x={wx} y="84" width="14" height="22" rx="1" fill="var(--ink)" />
            <rect x={wx} y="114" width="14" height="24" rx="1" fill="var(--ink)" />
          {/each}

          <!-- Portico columns -->
          {#each [100, 136, 174, 210] as cx (cx)}
            <rect x={cx} y="72" width="10" height="74" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.6" />
            <rect x={cx - 2} y="72" width="14" height="4" fill="var(--card)" stroke="var(--ink)" stroke-width="1.2" />
            <rect x={cx - 2} y="142" width="14" height="6" fill="var(--card)" stroke="var(--ink)" stroke-width="1.2" />
          {/each}

          <!-- Lawn / steps foreground -->
          <rect x="0" y="148" width="320" height="37" fill={evilMode ? 'var(--alert-dark)' : 'var(--paper)'} />
          <line x1="0" y1="148" x2="320" y2="148" stroke="var(--ink)" stroke-width="2" />

          <!-- Chosen Presidential Character waving (or fanning cash in Evil Mode) -->
          <Character
            look={activeLook}
            pose={evilMode ? 'cash' : 'wave'}
            prop={evilMode ? 'cash_fan' : null}
            mood={evilMode ? 'scheming' : 'confident'}
            x={124}
            y={58}
            scale={0.58}
          />
        </svg>
      </div>

      <div class="card look-card" role="radiogroup" aria-label="Presidential Look" data-testid="president-look-selector">
        <span class="label">Presidential Look</span>
        <div class="look-row">
          {#each PRESIDENT_LOOKS as opt (opt.index)}
            {@const portLook = resolvePresidentLook(opt.index, evilMode, evilMode ? 'scheming' : 'confident')}
            <button
              type="button"
              role="radio"
              aria-checked={presidentLook === opt.index}
              aria-label={opt.label}
              title={opt.label}
              class="look-btn"
              class:active-look={presidentLook === opt.index}
              data-testid={`president-look-option-${opt.index}`}
              onclick={() => (presidentLook = opt.index)}
            >
              <CharacterPortrait
                look={portLook}
                mood={evilMode ? 'scheming' : 'confident'}
                size={46}
              />
            </button>
          {/each}
        </div>
      </div>

      {#if evilMode}
        <div class="card info evil-warning" role="note" aria-label="Evil mode disclaimer">
          <span class="label">Satirical Mode Warning</span>
          <span class="line">You have selected Satirical Evil Mode. Your goal is personal enrichment.</span>
          <span class="line">Every corrupt move generates public Heat. Too much Heat triggers Special Counsel, Impeachment, and Conviction.</span>
        </div>
      {:else}
        <div class="card info" data-testid="newgame-scenario-preview">
          <span class="label">Scenario Briefing · {selectedScenario.name}</span>
          <span class="line">{selectedScenario.briefing}</span>
          <span class="line">Your party changes the names you see. The economy plays the same either way.</span>
        </div>
      {/if}
      <div class="spacer"></div>
      <button
        class="stamp"
        class:evil-stamp={evilMode}
        disabled={party === null}
        onclick={() => party && onStart({ party, evilMode, scenario, unlockAll, livingWorld, vocabMode, presidentLook })}
      >
        {evilMode ? 'Seize power' : 'Start the term'}
      </button>
    {/snippet}
  </ScreenLayout>
</div>

<style>
  .newgame { height: 100dvh; max-height: 100dvh; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr) clamp(240px, 20vw, 290px); gap: clamp(14px, 2vw, 24px); padding: clamp(14px, 2vh, 24px) clamp(16px, 2.5vw, 28px); }
  .options { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(10px, 1.2vw, 14px); max-width: 48rem; }
  .option { display: flex; align-items: center; gap: clamp(10px, 1.2vw, 14px); padding: clamp(10px, 1.4vh, 14px) clamp(14px, 1.8vw, 20px); cursor: pointer; }
  .option b { font: 700 clamp(18px, 1.8vw, 22px) var(--font-display); color: var(--ink); }
  .option input { width: 20px; height: 20px; accent-color: var(--ink); }
  .option:has(input:checked) { background: var(--gold); }
  .option:has(input:focus-visible) { outline: 3px solid var(--ink); outline-offset: 3px; }
  
  .resume-card {
    padding: clamp(10px, 1.5vh, 16px);
    margin-bottom: clamp(8px, 1.2vh, 12px);
    max-width: 48rem;
    border: 3px solid var(--ink);
    background: var(--paper-warm);
  }
  .resume-title {
    font: 700 clamp(20px, 2vw, 24px) var(--font-display);
    color: var(--ink);
    margin: 2px 0 6px 0;
  }
  .resume-meta {
    display: flex;
    gap: 16px;
    margin-bottom: 10px;
    font: 600 clamp(13px, 1vw, 15px) var(--font-body);
    color: var(--ink-soft);
  }
  .resume-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .navy-btn {
    font: 600 clamp(13px, 1vw, 15px) var(--font-ui);
    text-transform: uppercase;
    letter-spacing: .06em;
    padding: 8px 16px;
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
    padding: 10px 14px;
    margin-bottom: 10px;
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
    font: 500 14px/1.3 var(--font-body);
    color: var(--ink);
    margin-top: 2px;
  }

  .import-strip {
    margin-top: clamp(6px, 1vh, 12px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    max-width: 48rem;
  }
  .import-btn {
    background: none;
    border: none;
    font: 600 clamp(12px, 0.95vw, 14px) var(--font-ui);
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--ink-soft);
    text-decoration: underline;
    cursor: pointer;
    padding: 2px 0;
  }
  .import-btn:hover {
    color: var(--ink);
  }
  .slot-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .slot-label {
    font: 600 11px var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ink-soft);
  }
  .slot-btn {
    padding: 2px 8px;
    font: 700 11px var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--card);
    color: var(--ink-soft);
    border: 1.5px solid var(--ink);
    border-radius: 3px;
    cursor: pointer;
  }
  .slot-btn.active-slot {
    background: var(--gold);
    color: var(--ink);
    box-shadow: 1px 1px 0 var(--ink);
  }

  .info { display: flex; flex-direction: column; gap: 4px; padding: clamp(12px, 1.5vh, 16px); }
  .line { font: 500 clamp(14px, 1.1vw, 16px)/1.3 var(--font-body); color: var(--ink-soft); max-width: 55ch; }
  .spacer { flex-grow: 1; min-height: 8px; }
  .stamp { align-self: center; flex-shrink: 0; }
  .stamp:disabled { opacity: .45; cursor: not-allowed; }

  .mode-section { margin-top: clamp(8px, 1.2vh, 14px); max-width: 48rem; display: flex; flex-direction: column; gap: 6px; }
  .pacing-section { margin-top: clamp(8px, 1.2vh, 14px); max-width: 48rem; display: flex; flex-direction: column; gap: 6px; }
  .pacing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(8px, 1vw, 12px); }
  .unlock-all-card { display: flex; align-items: flex-start; gap: 8px; padding: clamp(7px, 1vh, 10px) clamp(8px, 1vw, 12px); cursor: pointer; }
  .unlock-all-card input { width: 18px; height: 18px; accent-color: var(--ink); margin-top: 2px; flex-shrink: 0; }
  .unlock-all-card.active-mode { background: var(--gold); }
  .unlock-all-card.active-mode .mode-sub { color: var(--ink); }
  .mode-cards, .scenario-cards { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(8px, 1vw, 12px); }
  .mode-option { display: flex; align-items: flex-start; gap: 10px; padding: clamp(8px, 1.1vh, 12px) clamp(10px, 1.2vw, 14px); cursor: pointer; }
  .mode-option input { width: 18px; height: 18px; accent-color: var(--ink); margin-top: 2px; flex-shrink: 0; }
  .mode-option.active-mode { background: var(--gold); }
  .mode-option.evil-option.active-mode { background: var(--alert-tint); border-color: var(--alert); }
  .mode-option.active-mode .mode-sub { color: var(--ink); }
  .mode-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .scen-head { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
  .scen-tag {
    font: 700 10px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--paper);
    border: 1px solid var(--ink);
    color: var(--ink);
    flex-shrink: 0;
  }
  .mode-info b { font: 700 clamp(14px, 1.15vw, 16px) var(--font-display); color: var(--ink); }
  .mode-sub { font: 500 clamp(11px, 0.85vw, 13px)/1.25 var(--font-body); color: var(--ink-soft); }
  .evil-warning { border-color: var(--alert); background: var(--card); }
  .evil-warning .label { color: var(--alert); }
  .stamp.evil-stamp { background: var(--alert-dark); border-color: var(--ink); }

  .portico-banner {
    height: clamp(135px, 21vh, 185px);
    padding: 0;
    overflow: hidden;
    flex-shrink: 0;
  }
  .portico-banner.evil-portico {
    border-color: var(--alert);
  }
  .look-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: clamp(8px, 1.1vh, 12px);
    flex-shrink: 0;
  }
  .look-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }
  .look-btn {
    padding: 2px;
    border-radius: 50%;
    border: 2.5px solid transparent;
    background: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .look-btn.active-look {
    border-color: var(--gold);
    background: var(--gold);
    box-shadow: 0 0 0 2px var(--ink);
  }
  .look-btn:focus-visible {
    outline: 3px solid var(--ink);
    outline-offset: 2px;
  }
</style>
