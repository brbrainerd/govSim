<script lang="ts">
  import { Session } from './app/session.svelte';
  import { screenById } from './app/screens';
  import StatusBar from './ui/StatusBar.svelte';
  import Rail from './ui/Rail.svelte';

  const session = new Session(Date.now() | 0);
  const screen = $derived(screenById(session.screen));
</script>

<div class="app halftone">
  <StatusBar state={session.current} title={screen.label} onNextTurn={() => session.nextTurn()} />
  <div class="zones">
    <Rail turn={session.current.turn} current={session.screen} onSelect={(id) => (session.screen = id)} />
    <main>
      <h2 class="h question">{screen.question}</h2>
      <div class="panel placeholder">{screen.label}: coming in M1</div>
    </main>
    <aside class="panel next-step">
      <div class="label">What it means</div>
    </aside>
  </div>
</div>

<style>
  .app { min-height: 100vh; display: grid; grid-template-rows: auto 1fr; }
  .zones { display: grid; grid-template-columns: 190px minmax(0, 1fr) 290px; gap: 18px; padding: 8px 22px 22px; }
  main { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
  .question { font-size: 26px; }
  .placeholder { flex-grow: 1; display: grid; place-items: center; min-height: 320px; color: var(--ink-soft); }
  .next-step { padding: 12px 14px; align-self: start; }
</style>
