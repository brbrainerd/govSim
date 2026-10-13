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
  import Voters from './Voters.svelte';
  import ScreenLayout from '../ui/ScreenLayout.svelte';
  import StatusBar from '../ui/StatusBar.svelte';
  import Rail from '../ui/Rail.svelte';
  import Overlay from '../ui/Overlay.svelte';
  import TurnReport from '../ui/TurnReport.svelte';
  import CrisisModal from '../ui/CrisisModal.svelte';
  import MythModal from '../ui/MythModal.svelte';
  import SpeechModal from '../ui/SpeechModal.svelte';
  import FedModal from '../ui/FedModal.svelte';
  import ElectionNightModal from '../ui/ElectionNightModal.svelte';
  import AboutModal from '../ui/AboutModal.svelte';
  import ProblemReportModal from '../ui/ProblemReportModal.svelte';
  import EndScreen from './EndScreen.svelte';
  import { getMyth } from '../content/myths';

  let {
    session,
    onImport,
    onRestart,
  }: {
    session: Session;
    onImport?: (f: File) => void;
    onRestart?: () => void;
  } = $props();
  const screen = $derived(screenById(session.screen));
  const go = (id: typeof session.screen) => (session.screen = id);

  let dismissedCrisisTurn = $state<number | null>(null);
  let activeMythId = $state<string | null>(null);
  let speechModalOpen = $state<boolean>(false);
  let fedModalOpen = $state<boolean>(false);
  let aboutModalOpen = $state<boolean>(false);
  let reportModalOpen = $state<boolean>(false);

  const activeMyth = $derived(activeMythId ? getMyth(activeMythId) : null);

  const showCrisisModal = $derived(
    session.current.activeCrisis !== null &&
    !session.showingReport &&
    dismissedCrisisTurn !== session.current.turn
  );
</script>

{#if session.termEnded}
  <EndScreen {session} {onRestart} />
{:else}
  <div class="app halftone">
    <StatusBar state={session.current} clout={session.clout} title={screen.label} score={session.score} party={PARTIES.find((p) => p.id === session.options.party)!.name} onNextTurn={() => session.nextTurn()} />
    <div class="zones">
      <Rail
        turn={session.current.turn}
        current={session.screen}
        onSelect={go}
        onExport={() => downloadSave(session)}
        onAbout={() => (aboutModalOpen = true)}
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
        <Voters
          {session}
          question={screen.question}
          {go}
          onOpenMyth={(id) => (activeMythId = id)}
          onOpenSpeech={() => (speechModalOpen = true)}
        />
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

    {#if aboutModalOpen}
      <AboutModal
        onClose={() => (aboutModalOpen = false)}
        onOpenReport={() => (reportModalOpen = true)}
      />
    {/if}

    {#if reportModalOpen}
      <ProblemReportModal
        {session}
        onClose={() => (reportModalOpen = false)}
      />
    {/if}
  </div>
{/if}

{#if session.showingElectionNight && session.activeElectionOutcome && session.activeAutopilotElectionOutcome}
  <ElectionNightModal
    outcome={session.activeElectionOutcome}
    autopilotOutcome={session.activeAutopilotElectionOutcome}
    reasons={session.electionReasons}
    oncontinue={() => session.continueAfterElection()}
    onretry={() => session.retryTurn16()}
  />
{/if}

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
</style>
