<script lang="ts">
  import type { GameOptions } from '../app/session.svelte';
  import { PARTIES, type PartyId } from '../content/parties';
  import { SCENARIOS, getScenario, type ScenarioId } from '../content/scenarios';
  import { ARCHETYPES, getArchetype, type ArchetypeId } from '../content/archetypes';
  import { formatMasteryStars, loadMastery, masteryLabel } from '../app/mastery';
  import { termLabel } from '../engine/calendar';
  import ScreenLayout from '../ui/ScreenLayout.svelte';
  import Character, { PRESIDENT_LOOKS, resolvePresidentLook } from '../ui/art/Character.svelte';
  import CharacterPortrait from '../ui/art/CharacterPortrait.svelte';
  import CivicEmblem from '../ui/art/CivicEmblem.svelte';
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
  let archetype = $state<ArchetypeId | undefined>(undefined);
  let unlockAll = $state(false);
  let livingWorld = $state(false);
  let classicSim = $state(false);
  let vocabMode = $state<'plain' | 'wonk'>(
    typeof localStorage !== 'undefined' &&
      typeof localStorage?.getItem === 'function' &&
      localStorage.getItem('govsim_vocab_mode') === 'wonk'
      ? 'wonk'
      : 'plain',
  );
  let dismissResume = $state(false);
  let fileInput = $state<HTMLInputElement>();

  const mastery = loadMastery();
  const selectedScenario = $derived(getScenario(scenario));
  const selectedArchetype = $derived(getArchetype(archetype));
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
            {@const scenTier = mastery.scenarios[s.id] ?? 'none'}
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
                  <span class="scen-badges">
                    <span
                      class="mastery-pill"
                      class:tier-gold={scenTier === 'gold'}
                      class:tier-silver={scenTier === 'silver'}
                      title={`${s.name}: ${masteryLabel(scenTier)}`}
                      data-testid={`scenario-mastery-${s.id}`}
                    >
                      {formatMasteryStars(scenTier)}
                    </span>
                    <span class="scen-tag">{s.tag}</span>
                  </span>
                </div>
                <span class="mode-sub">{s.summary}</span>
              </div>
            </label>
          {/each}
        </div>
      </div>

      <div class="mode-section" role="group" aria-label="Presidential Archetype" data-testid="archetype-selector">
        <div class="section-head-row">
          <span class="label">Presidential Playstyle Archetype (Optional)</span>
          {#if selectedArchetype}
            <button
              type="button"
              class="clear-arch-btn"
              data-testid="archetype-clear-btn"
              onclick={() => (archetype = undefined)}
            >
              Reset to Balanced
            </button>
          {/if}
        </div>
        <div class="archetype-grid">
          {#each ARCHETYPES as arch (arch.id)}
            {@const archTier = mastery.archetypes[arch.id] ?? 'none'}
            <button
              type="button"
              class="card archetype-option"
              class:active-mode={archetype === arch.id}
              aria-pressed={archetype === arch.id}
              title={`${arch.name}: ${arch.summary}`}
              data-testid={`archetype-card-${arch.id}`}
              onclick={() => (archetype = archetype === arch.id ? undefined : arch.id)}
            >
              <div class="arch-top">
                <span class="arch-name">
                  <CivicEmblem kind={arch.id} size={14} /> {arch.shortName}
                </span>
                <span
                  class="mastery-pill"
                  class:tier-gold={archTier === 'gold'}
                  class:tier-silver={archTier === 'silver'}
                  title={`${arch.name}: ${masteryLabel(archTier)}`}
                  data-testid={`mastery-stars-${arch.id}`}
                >
                  {formatMasteryStars(archTier)}
                </span>
              </div>
              <span class="arch-passive">
                {evilMode ? arch.evilPassiveLabel : arch.passiveLabel}
              </span>
            </button>
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
              <b>
                <CivicEmblem kind={vocabMode === 'wonk' ? 'grad' : 'speech'} size={13} />
                {vocabMode === 'wonk' ? 'Policy Wonk Mode' : 'Plain Talk (Default)'}
              </b>
              <span class="mode-sub">
                {vocabMode === 'wonk'
                  ? 'Show statutory citations & formal macro terms immediately.'
                  : 'Friendly everyday language with trade-offs upfront.'}
              </span>
            </div>
          </label>

          <label class="card unlock-all-card" class:active-mode={classicSim}>
            <input
              type="checkbox"
              checked={classicSim}
              onchange={(e) => (classicSim = e.currentTarget.checked)}
              data-testid="classic-sim-toggle"
            />
            <div class="mode-info">
              <b>Classic Sim (No Perks)</b>
              <span class="mode-sub">Disable Task Force drafts &amp; Doctrine combos for strict classroom runs.</span>
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
          <!-- Swallowtail govSim ribbon banner (g-newgame.png) -->
          <polygon points="18,22 54,18 46,32 54,44 18,42 28,32" fill={evilMode ? 'var(--alert-dark)' : 'var(--ink-soft)'} stroke="var(--ink)" stroke-width="1.8" />
          <polygon points="302,22 266,18 274,32 266,44 302,42 292,32" fill={evilMode ? 'var(--alert-dark)' : 'var(--ink-soft)'} stroke="var(--ink)" stroke-width="1.8" />
          <path d="M40 12 Q160 1 280 12 L272 40 Q160 28 48 40 Z" fill={evilMode ? 'var(--alert)' : 'var(--ink)'} stroke="var(--ink)" stroke-width="2" />
          <circle cx="66" cy="25" r="4" fill="var(--gold)" />
          <circle cx="254" cy="25" r="4" fill="var(--gold)" />
          <text x="160" y="29" text-anchor="middle" font-family="var(--font-display)" font-size="18.5" font-weight="800" fill="var(--card)">
            {evilMode ? 'govSim · EVIL' : 'govSim'}
          </text>

          <!-- Three waving US flags on roof (left wing, center pediment, right wing) -->
          {#each [
            { x: 64, y: 49, w: 14, h: 8 },
            { x: 160, y: 34, w: 18, h: 10 },
            { x: 256, y: 49, w: 14, h: 8 },
          ] as fl (fl.x)}
            <line x1={fl.x} y1={fl.y} x2={fl.x} y2={fl.y + 18} stroke="var(--ink)" stroke-width="1.6" />
            <circle cx={fl.x} cy={fl.y} r="1.8" fill="var(--gold)" stroke="var(--ink)" stroke-width="0.9" />
            <rect x={fl.x + 1} y={fl.y + 1} width={fl.w} height={fl.h} rx="1" fill="var(--alert)" stroke="var(--ink)" stroke-width="1.1" />
            <line x1={fl.x + 1} y1={fl.y + 1 + fl.h * 0.35} x2={fl.x + 1 + fl.w} y2={fl.y + 1 + fl.h * 0.35} stroke="var(--card)" stroke-width="1.4" />
            <line x1={fl.x + 1} y1={fl.y + 1 + fl.h * 0.7} x2={fl.x + 1 + fl.w} y2={fl.y + 1 + fl.h * 0.7} stroke="var(--card)" stroke-width="1.4" />
            <rect x={fl.x + 1} y={fl.y + 1} width={fl.w * 0.44} height={fl.h * 0.55} fill="var(--ink)" />
          {/each}

          <!-- White House roof balustrade railing -->
          <rect x="26" y="64" width="268" height="8" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" />
          {#each [36, 48, 60, 72, 84, 236, 248, 260, 272, 284] as bx (bx)}
            <line x1={bx} y1="64" x2={bx} y2="72" stroke="var(--ink)" stroke-width="1.2" />
          {/each}

          <!-- Neoclassical White House facade & triangular pediment -->
          <rect x="22" y="72" width="276" height="80" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
          <polygon points="82,72 160,46 238,72" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
          <polygon points="94,70 160,50 226,70" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.3" />
          <circle cx="160" cy="62" r="5" fill="var(--card)" stroke="var(--ink)" stroke-width="1.3" />

          <!-- Side wings pedimented windows -->
          {#each [36, 60, 246, 270] as wx (wx)}
            <rect x={wx} y="82" width="14" height="18" rx="1" fill="var(--ink)" stroke="var(--ink)" stroke-width="1" />
            <line x1={wx + 7} y1="82" x2={wx + 7} y2="100" stroke="var(--card)" stroke-width="1" />
            <line x1={wx} y1="91" x2={wx + 14} y2="91" stroke="var(--card)" stroke-width="1" />
            <polygon points={`${wx - 2},112 ${wx + 7},106 ${wx + 16},112`} fill="var(--paper)" stroke="var(--ink)" stroke-width="1.1" />
            <rect x={wx} y="112" width="14" height="24" rx="1" fill="var(--ink)" stroke="var(--ink)" stroke-width="1" />
            <line x1={wx + 7} y1="112" x2={wx + 7} y2="136" stroke="var(--card)" stroke-width="1" />
            <line x1={wx} y1="124" x2={wx + 14} y2="124" stroke="var(--card)" stroke-width="1" />
          {/each}

          <!-- Central doorway fanlight behind President -->
          <path d="M144 148 L144 106 A 16 14 0 0 1 176 106 L176 148 Z" fill="var(--ink)" />
          <path d="M147 106 A 13 11 0 0 1 173 106 Z" fill="var(--gold)" opacity="0.7" />

          <!-- Four fluted Ionic portico columns -->
          {#each [94, 128, 180, 214] as cx (cx)}
            <rect x={cx} y="72" width="12" height="76" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.7" />
            <line x1={cx + 4} y1="76" x2={cx + 4} y2="144" stroke="var(--ink)" stroke-width="0.7" opacity="0.45" />
            <line x1={cx + 8} y1="76" x2={cx + 8} y2="144" stroke="var(--ink)" stroke-width="0.7" opacity="0.45" />
            <rect x={cx - 3} y="72" width="18" height="5" rx="2" fill="var(--card)" stroke="var(--ink)" stroke-width="1.3" />
            <rect x={cx - 3} y="143" width="18" height="6" rx="1" fill="var(--card)" stroke="var(--ink)" stroke-width="1.3" />
          {/each}

          <!-- Lawn / steps foreground -->
          <rect x="0" y="149" width="320" height="36" fill={evilMode ? 'var(--alert-dark)' : 'var(--paper)'} />
          <line x1="0" y1="149" x2="320" y2="149" stroke="var(--ink)" stroke-width="2" />

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
                size={38}
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
          {#if selectedArchetype}
            <span class="line arch-preview-line" data-testid="newgame-archetype-preview">
              <b><CivicEmblem kind={selectedArchetype.id} size={13} /> {selectedArchetype.name}:</b> {selectedArchetype.evilPassiveLabel}
            </span>
          {/if}
        </div>
      {:else}
        <div class="card info" data-testid="newgame-scenario-preview">
          <span class="label">Scenario Briefing · {selectedScenario.name}</span>
          <span class="line">{selectedScenario.briefing}</span>
          {#if selectedArchetype}
            <span class="line arch-preview-line" data-testid="newgame-archetype-preview">
              <b><CivicEmblem kind={selectedArchetype.id} size={13} /> {selectedArchetype.name}:</b> {selectedArchetype.summary} ({selectedArchetype.passiveLabel})
            </span>
          {:else}
            <span class="line">Your party changes the names you see. The economy plays the same either way.</span>
          {/if}
        </div>
      {/if}
      <div class="spacer"></div>
      <button
        class="stamp"
        class:evil-stamp={evilMode}
        disabled={party === null}
        onclick={() =>
          party &&
          onStart({
            party,
            evilMode,
            scenario,
            ...(archetype ? { archetype } : {}),
            unlockAll,
            livingWorld,
            vocabMode,
            presidentLook,
            ...(classicSim ? { classicSim: true } : {}),
          })}
      >
        {evilMode ? 'Seize power' : 'Start the term'}
      </button>
    {/snippet}
  </ScreenLayout>
</div>

<style>
  .newgame { height: 100dvh; max-height: 100dvh; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr) clamp(256px, 21vw, 296px); gap: clamp(12px, 1.8vw, 22px); padding: clamp(10px, 1.4vh, 18px) clamp(16px, 2.5vw, 28px); }
  .options { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(8px, 1vw, 12px); max-width: 48rem; }
  .option { display: flex; align-items: center; gap: clamp(8px, 1vw, 12px); padding: clamp(7px, 1vh, 11px) clamp(12px, 1.5vw, 18px); cursor: pointer; }
  .option b { font: 700 clamp(17px, 1.6vw, 20px) var(--font-display); color: var(--ink); }
  .option input { width: 18px; height: 18px; accent-color: var(--ink); }
  .option:has(input:checked) { background: var(--gold); }
  .option:has(input:focus-visible) { outline: 3px solid var(--ink); outline-offset: 3px; }
  
  .resume-card {
    padding: clamp(8px, 1.2vh, 14px);
    margin-bottom: clamp(6px, 1vh, 10px);
    max-width: 48rem;
    border: 3px solid var(--ink);
    background: var(--paper-warm);
  }
  .resume-title {
    font: 700 clamp(18px, 1.8vw, 22px) var(--font-display);
    color: var(--ink);
    margin: 2px 0 4px 0;
  }
  .resume-meta {
    display: flex;
    gap: 16px;
    margin-bottom: 8px;
    font: 600 clamp(12px, 0.95vw, 14px) var(--font-body);
    color: var(--ink-soft);
  }
  .resume-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .navy-btn {
    font: 600 clamp(12px, 0.95vw, 14px) var(--font-ui);
    text-transform: uppercase;
    letter-spacing: .06em;
    padding: 6px 14px;
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
    padding: 8px 12px;
    margin-bottom: 8px;
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
    font: 500 13px/1.3 var(--font-body);
    color: var(--ink);
    margin-top: 2px;
  }

  .import-strip {
    margin-top: clamp(4px, 0.7vh, 8px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    max-width: 48rem;
  }
  .import-btn {
    background: none;
    border: none;
    font: 600 clamp(11px, 0.9vw, 13px) var(--font-ui);
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

  .info { display: flex; flex-direction: column; gap: 4px; padding: clamp(10px, 1.3vh, 14px); }
  .line { font: 500 clamp(13px, 1vw, 15px)/1.28 var(--font-body); color: var(--ink-soft); max-width: 55ch; }
  .arch-preview-line { color: var(--ink); }
  .spacer { flex-grow: 1; min-height: 6px; }
  .stamp { align-self: center; flex-shrink: 0; }
  .stamp:disabled { opacity: .45; cursor: not-allowed; }

  .mode-section { margin-top: clamp(5px, 0.85vh, 10px); max-width: 48rem; display: flex; flex-direction: column; gap: 4px; }
  .pacing-section { margin-top: clamp(5px, 0.85vh, 10px); max-width: 48rem; display: flex; flex-direction: column; gap: 4px; }
  .section-head-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .clear-arch-btn {
    background: none;
    border: none;
    font: 700 10px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ink-soft);
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
  }
  .clear-arch-btn:hover { color: var(--ink); }

  .archetype-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: clamp(5px, 0.7vw, 8px);
  }
  .archetype-option {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: clamp(5px, 0.7vh, 8px) clamp(6px, 0.8vw, 10px);
    text-align: left;
    cursor: pointer;
    background: var(--card);
  }
  .archetype-option.active-mode {
    background: var(--gold);
  }
  .arch-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 4px;
  }
  .arch-name {
    font: 700 clamp(11px, 0.9vw, 13px)/1.15 var(--font-display);
    color: var(--ink);
    white-space: nowrap;
  }
  .arch-passive {
    font: 500 clamp(10px, 0.75vw, 11.5px)/1.2 var(--font-body);
    color: var(--ink-soft);
  }
  .archetype-option.active-mode .arch-passive {
    color: var(--ink);
  }

  .scen-badges {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .mastery-pill {
    font: 700 10px/1 var(--font-ui);
    letter-spacing: 0.02em;
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--paper);
    border: 1px solid var(--ink-soft);
    color: var(--ink-soft);
    flex-shrink: 0;
  }
  .mastery-pill.tier-silver {
    background: var(--paper-warm);
    border-color: var(--ink);
    color: var(--ink);
  }
  .mastery-pill.tier-gold {
    background: var(--gold);
    border-color: var(--ink);
    color: var(--ink);
  }

  .pacing-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: clamp(6px, 0.8vw, 10px); }
  .unlock-all-card { display: flex; align-items: flex-start; gap: 6px; padding: clamp(5px, 0.8vh, 8px) clamp(7px, 0.9vw, 10px); cursor: pointer; }
  .unlock-all-card input { width: 16px; height: 16px; accent-color: var(--ink); margin-top: 2px; flex-shrink: 0; }
  .unlock-all-card.active-mode { background: var(--gold); }
  .unlock-all-card.active-mode .mode-sub { color: var(--ink); }
  .mode-cards, .scenario-cards { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(6px, 0.8vw, 10px); }
  .mode-option { display: flex; align-items: flex-start; gap: 8px; padding: clamp(6px, 0.9vh, 10px) clamp(8px, 1vw, 12px); cursor: pointer; }
  .mode-option input { width: 16px; height: 16px; accent-color: var(--ink); margin-top: 2px; flex-shrink: 0; }
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
  .mode-info b { font: 700 clamp(13px, 1.05vw, 15px) var(--font-display); color: var(--ink); }
  .mode-sub { font: 500 clamp(10.5px, 0.8vw, 12.5px)/1.2 var(--font-body); color: var(--ink-soft); }
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
    gap: 4px;
  }
  .look-btn {
    padding: 1px;
    border-radius: 50%;
    border: 2px solid transparent;
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
