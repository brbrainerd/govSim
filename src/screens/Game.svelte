<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import { screenById } from '../app/screens';
  import { PARTIES } from '../content/parties';
  import Budget from './Budget.svelte';
  import Congress from './Congress.svelte';
  import OvalOffice from './OvalOffice.svelte';
  import ScreenLayout from '../ui/ScreenLayout.svelte';
  import StatusBar from '../ui/StatusBar.svelte';
  import Rail from '../ui/Rail.svelte';

  let { session }: { session: Session } = $props();
  const screen = $derived(screenById(session.screen));
  const go = (id: typeof session.screen) => (session.screen = id);
</script>

<div class="app halftone">
  <StatusBar state={session.current} clout={session.clout} title={screen.label} score={session.vsNothing} party={PARTIES.find((p) => p.id === session.options.party)!.name} onNextTurn={() => session.nextTurn()} />
  <div class="zones">
    <Rail turn={session.current.turn} current={session.screen} onSelect={go} />
    {#if screen.id === 'oval'}
      <OvalOffice {session} question={screen.question} {go} />
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
