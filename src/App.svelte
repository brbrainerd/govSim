<script lang="ts">
  import { onMount } from 'svelte';
  import {
    clearAutosave,
    getActiveProfileId,
    listBrowserProfiles,
    loadAutosave,
    parseSave,
    switchBrowserProfile,
    type SaveFile,
  } from './app/save';
  import { decodeRunCode } from './app/share';
  import { Session, type GameOptions } from './app/session.svelte';
  import { applyTheme } from './design/tokens';
  import { fromData, us } from './data/us';
  import Game from './screens/Game.svelte';
  import NewGame from './screens/NewGame.svelte';

  let session = $state.raw<Session | null>(null);
  let autosave = $state.raw<SaveFile | null>(null);
  let activeProfileId = $state<string>(getActiveProfileId());
  const profiles = listBrowserProfiles();
  let errorMessage = $state<string | null>(null);
  let sharedReplay = $state<{ seed: number; party: string } | null>(null);
  let sharedRunError = $state<string | null>(null);
  let embedMode = $state<boolean>(false);

  $effect(() => {
    applyTheme(session?.isEvilMode ? 'evil' : 'day');
  });

  onMount(() => {
    activeProfileId = getActiveProfileId();
    autosave = loadAutosave();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isEmbed = params.get('embed') === '1' || params.get('demo') === '1';
      embedMode = isEmbed;

      if (window.location.hash.startsWith('#run=')) {
        const code = window.location.hash.slice(5);
        void decodeRunCode(code).then((run) => {
          if (run) {
            session = Session.fromRun(run, fromData(us));
            sharedReplay = { seed: run.seed, party: run.party };
          } else {
            sharedRunError = 'Invalid or corrupted shared run link';
            setTimeout(() => {
              sharedRunError = null;
            }, 5000);
          }
        });
      } else if (isEmbed && !session) {
        session = new Session(17760704, fromData(us), {
          party: 'D',
          unlockAll: true,
          livingWorld: true,
          showMyths: true,
        });
      }
    }

    const onStorage = () => {
      activeProfileId = getActiveProfileId();
      autosave = loadAutosave();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }
  });

  function handleSelectProfile(profileId: string) {
    activeProfileId = profileId;
    autosave = switchBrowserProfile(profileId);
    errorMessage = null;
  }

  function startNew(options: GameOptions) {
    clearAutosave();
    session = new Session(Date.now() | 0, fromData(us), options);
    autosave = null;
    errorMessage = null;
    sharedReplay = null;
  }

  function resume(save: SaveFile) {
    try {
      session = Session.fromSave(save);
      errorMessage = null;
      sharedReplay = null;
    } catch {
      errorMessage = 'Cannot load save: file is damaged, modified, or incompatible.';
    }
  }

  function handleImport(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = String(e.target?.result ?? '');
        const save = parseSave(text);
        resume(save);
      } catch {
        errorMessage = 'Cannot load save: file is damaged, modified, or incompatible.';
      }
    };
    reader.readAsText(file);
  }

  function exitSharedReplay() {
    sharedReplay = null;
    session = null;
    autosave = loadAutosave();
    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }
</script>

{#if sharedReplay}
  <aside class="shared-run-banner" data-testid="shared-run-banner" role="status">
    <span class="banner-text">
      Viewing Shared Presidential Record (Seed: {sharedReplay.seed}, Party: {sharedReplay.party})
    </span>
    <button
      type="button"
      class="banner-btn"
      data-testid="exit-shared-replay-btn"
      onclick={exitSharedReplay}
    >
      Start Your Own Presidency
    </button>
  </aside>
{/if}

{#if sharedRunError}
  <div class="shared-run-error-toast" data-testid="shared-run-error" role="alert">
    {sharedRunError}
  </div>
{/if}

{#if session}
  <Game
    {session}
    onImport={handleImport}
    onRestart={() => {
      clearAutosave();
      exitSharedReplay();
    }}
  />
{:else}
  <NewGame
    {autosave}
    {errorMessage}
    {profiles}
    {activeProfileId}
    onSelectProfile={handleSelectProfile}
    onStart={startNew}
    onResume={resume}
    onImport={handleImport}
  />
{/if}

<style>
  .shared-run-banner {
    position: sticky;
    top: 0;
    z-index: 999;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 16px;
    background: var(--gold-soft);
    border-bottom: 2px solid var(--ink);
    color: var(--ink);
    font: 600 13px var(--font-ui);
  }

  .banner-btn {
    padding: 4px 12px;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    box-shadow: 1px 1px 0 var(--ink);
    font: 700 12px var(--font-label);
    letter-spacing: 0.04em;
    cursor: pointer;
    text-transform: uppercase;
  }

  .banner-btn:hover {
    background: var(--card-alt);
  }

  .shared-run-error-toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    padding: 10px 16px;
    background: var(--card);
    border: 2px solid var(--alert);
    color: var(--alert);
    font: 600 13px var(--font-ui);
    box-shadow: 2px 2px 0 var(--ink);
  }
</style>
