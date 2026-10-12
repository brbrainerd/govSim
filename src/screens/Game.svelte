<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import { downloadSave } from '../app/save';
  import { screenById } from '../app/screens';
  import { PARTIES } from '../content/parties';
  import Budget from './Budget.svelte';
  import Congress from './Congress.svelte';
  import Economy from './Economy.svelte';
  import OvalOffice from './OvalOffice.svelte';
  import Powers from './Powers.svelte';
  import ScreenLayout from '../ui/ScreenLayout.svelte';
  import StatusBar from '../ui/StatusBar.svelte';
  import Rail from '../ui/Rail.svelte';
  import Overlay from '../ui/Overlay.svelte';
  import TurnReport from '../ui/TurnReport.svelte';
  import CrisisModal from '../ui/CrisisModal.svelte';
  import MythModal from '../ui/MythModal.svelte';
  import SpeechModal from '../ui/SpeechModal.svelte';
  import FedModal from '../ui/FedModal.svelte';
  import { getMyth } from '../content/myths';

  let { session, onImport }: { session: Session; onImport?: (f: File) => void } = $props();
  const screen = $derived(screenById(session.screen));
  const go = (id: typeof session.screen) => (session.screen = id);

  let dismissedCrisisTurn = $state<number | null>(null);
  let activeMythId = $state<string | null>(null);
  let speechModalOpen = $state<boolean>(false);
  let fedModalOpen = $state<boolean>(false);

  const activeMyth = $derived(activeMythId ? getMyth(activeMythId) : null);

  const showCrisisModal = $derived(
    session.current.activeCrisis !== null &&
    !session.showingReport &&
    dismissedCrisisTurn !== session.current.turn
  );
</script>

<div class="app halftone">
  <StatusBar state={session.current} clout={session.clout} title={screen.label} score={session.score} party={PARTIES.find((p) => p.id === session.options.party)!.name} onNextTurn={() => session.nextTurn()} />
  <div class="zones">
    <Rail
      turn={session.current.turn}
      current={session.screen}
      onSelect={go}
      onExport={() => downloadSave(session)}
      {onImport}
    />
    {#if screen.id === 'oval'}
      <OvalOffice {session} question={screen.question} {go} onOpenMyth={(id) => (activeMythId = id)} />
    {:else if screen.id === 'economy'}
      <Economy {session} question={screen.question} {go} />
    {:else if screen.id === 'budget'}
      <Budget {session} question={screen.question} {go} />
    {:else if screen.id === 'congress'}
      <Congress {session} question={screen.question} />
    {:else if screen.id === 'powers'}
      <Powers
        {session}
        question={screen.question}
        {go}
        onOpenMyth={(id) => (activeMythId = id)}
        onOpenSpeech={() => (speechModalOpen = true)}
        onOpenFed={() => (fedModalOpen = true)}
      />
    {:else}
      <ScreenLayout question={screen.question}>
        {#snippet main()}<div class="card placeholder">{screen.label}: coming in M1</div>{/snippet}
        {#snippet next()}<div class="card placeholder-side"><span class="label">What it means</span></div>{/snippet}
      </ScreenLayout>
    {/if}
  </div>

  {#if session.showingReport}
    <Overlay title="Quarterly Turn Report" onClose={() => session.closeReport()}>
      {#snippet children()}
        <TurnReport {session} onClose={() => session.closeReport()} />
      {/snippet}
    </Overlay>
  {/if}

  {#if showCrisisModal && session.current.activeCrisis}
    <CrisisModal
      crisis={session.current.activeCrisis}
      {session}
      onClose={() => {
        dismissedCrisisTurn = session.current.turn;
      }}
    />
  {/if}

  {#if activeMyth}
    <MythModal
      myth={activeMyth}
      isFirstView={!session.current.viewedMyths.includes(activeMyth.id)}
      onClose={() => (activeMythId = null)}
      onGotIt={() => {
        session.viewMythCard(activeMyth!.id);
        activeMythId = null;
      }}
    />
  {/if}

  {#if speechModalOpen}
    <SpeechModal
      {session}
      onClose={() => (speechModalOpen = false)}
    />
  {/if}

  {#if fedModalOpen}
    <FedModal
      {session}
      onClose={() => (fedModalOpen = false)}
    />
  {/if}
</div>

<style>
  .app { height: 100dvh; max-height: 100dvh; overflow: hidden; display: grid; grid-template-rows: auto 1fr; }
  .zones {
    display: grid;
    grid-template-columns: clamp(170px, 15vw, 220px) minmax(0, 1fr) clamp(240px, 20vw, 290px);
    gap: clamp(12px, 1.5vw, 22px);
    padding: clamp(4px, 0.8vh, 10px) clamp(12px, 1.8vw, 24px) clamp(10px, 1.5vh, 20px);
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
  .placeholder { flex-grow: 1; display: grid; place-items: center; min-height: 200px; color: var(--ink-soft); }
  .placeholder-side { padding: 16px; }
</style>
