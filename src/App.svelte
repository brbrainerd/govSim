<script lang="ts">
  import { Session } from './app/session.svelte';
  import { screenById } from './app/screens';
  import { prosperity } from './content/sample';
  import Budget from './screens/Budget.svelte';
  import Congress from './screens/Congress.svelte';
  import OvalOffice from './screens/OvalOffice.svelte';
  import ScreenLayout from './ui/ScreenLayout.svelte';
  import StatusBar from './ui/StatusBar.svelte';
  import Rail from './ui/Rail.svelte';

  const session = new Session(Date.now() | 0);
  const screen = $derived(screenById(session.screen));
  const go = (id: typeof session.screen) => (session.screen = id);
</script>

<div class="app halftone">
  <StatusBar state={session.current} clout={session.clout} title={screen.label} score={prosperity.vsNothing} onNextTurn={() => session.nextTurn()} />
  <div class="zones">
    <Rail turn={session.current.turn} current={session.screen} onSelect={go} />
    {#if screen.id === 'oval'}
      <OvalOffice question={screen.question} {go} />
    {:else if screen.id === 'budget'}
      <Budget {session} question={screen.question} {go} />
    {:else if screen.id === 'congress'}
      <Congress {session} question={screen.question} {go} />
    {:else}
      <ScreenLayout question={screen.question}>
        {#snippet main()}<div class="card placeholder">{screen.label}: coming in M1</div>{/snippet}
        {#snippet next()}<div class="card placeholder-side"><span class="label">What it means</span></div>{/snippet}
      </ScreenLayout>
    {/if}
  </div>
</div>

<style>
  .app { min-height: 100vh; display: grid; grid-template-rows: auto 1fr; }
  .zones { display: grid; grid-template-columns: 220px minmax(0, 1fr) 260px; gap: 22px; padding: 10px 24px 24px; }
  .placeholder { flex-grow: 1; display: grid; place-items: center; min-height: 320px; color: var(--ink-soft); }
  .placeholder-side { padding: 16px; }
</style>
