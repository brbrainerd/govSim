<script lang="ts">
  import { onMount } from 'svelte';
  import { clearAutosave, loadAutosave, parseSave, type SaveFile } from './app/save';
  import { Session, type GameOptions } from './app/session.svelte';
  import { fromData, us } from './data/us';
  import Game from './screens/Game.svelte';
  import NewGame from './screens/NewGame.svelte';

  let session = $state.raw<Session | null>(null);
  let autosave = $state.raw<SaveFile | null>(null);
  let errorMessage = $state<string | null>(null);

  onMount(() => {
    autosave = loadAutosave();
  });

  function startNew(options: GameOptions) {
    clearAutosave();
    session = new Session(Date.now() | 0, fromData(us), options);
    autosave = null;
    errorMessage = null;
  }

  function resume(save: SaveFile) {
    try {
      session = Session.fromSave(save);
      errorMessage = null;
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
</script>

{#if session}
  <Game {session} onImport={handleImport} />
{:else}
  <NewGame
    {autosave}
    {errorMessage}
    onStart={startNew}
    onResume={resume}
    onImport={handleImport}
  />
{/if}
