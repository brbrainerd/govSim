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
  import Trade from './Trade.svelte';
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
  import ImpeachmentModal from '../ui/ImpeachmentModal.svelte';
  import ExplainerModal from '../ui/ExplainerModal.svelte';
  import ModelInspectorModal from '../ui/ModelInspectorModal.svelte';
  import AiSettingsModal from '../ui/AiSettingsModal.svelte';
  import EndScreen from './EndScreen.svelte';
  import { getMyth } from '../content/myths';
  import { getExplainer, type ExplainerId } from '../content/explainers';
  import { onMount } from 'svelte';
  import { completeOpenRouterPkceAuth, loadAiConfig, saveAiConfig } from '../app/ai-providers';

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
  import type { ActiveCrisis } from '../engine/director';

  let activeReviewCrisis = $state<ActiveCrisis | null>(null);
  let activeMythId = $state<string | null>(null);
  let activeExplainerId = $state<ExplainerId | null>(null);
  let speechModalOpen = $state<boolean>(false);
  let fedModalOpen = $state<boolean>(false);
  let aboutModalOpen = $state<boolean>(false);
  let reportModalOpen = $state<boolean>(false);
  let modelInspectorOpen = $state<boolean>(false);
  let aiSettingsModalOpen = $state<boolean>(false);

  onMount(async () => {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        try {
          const apiKey = await completeOpenRouterPkceAuth(code);
          const currentConfig = loadAiConfig();
          currentConfig.provider = 'openrouter_free';
          currentConfig.apiKey = apiKey;
          saveAiConfig(currentConfig);
          aiSettingsModalOpen = true;
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (err) {
          console.error('Failed to complete OpenRouter PKCE auth:', err);
        }
      }
    }
  });

  const activeMyth = $derived(activeMythId ? getMyth(activeMythId) : null);
  const activeExplainer = $derived(activeExplainerId ? getExplainer(activeExplainerId) : null);

  const displayedCrisis = $derived.by(() => {
    if (activeReviewCrisis) return activeReviewCrisis;
    if (session.current.activeCrisis && !session.showingReport && dismissedCrisisTurn !== session.current.turn) {
      return session.current.activeCrisis;
    }
    if (
      !session.current.activeCrisis &&
      session.current.activeGeopoliticalCrises &&
      session.current.activeGeopoliticalCrises.length > 0 &&
      !session.showingReport &&
      dismissedCrisisTurn !== session.current.turn
    ) {
      return session.current.activeGeopoliticalCrises[0];
    }
    return null;
  });
</script>

{#if session.termEnded && !session.showingImpeachmentModal}
  <EndScreen {session} {onRestart} />
{:else}
  <div class="app halftone">
    <StatusBar
      state={session.current}
      clout={session.clout}
      title={screen.label}
      score={session.score}
      party={PARTIES.find((p) => p.id === session.options.party)!.name}
      evilMode={session.isEvilMode}
      calmMode={session.calmMode}
      stagedActions={session.stagedActionsSummary}
      canFastForward={session.canFastForward}
      onNextTurn={() => session.nextTurn()}
      onFastForward={() => session.fastForwardToNextEvent()}
      onSelectScreen={go}
      onClearStaged={() => session.resetDraft()}
      onToggleCalm={() => session.toggleCalmMode()}
    />
    <div class="zones">
      <Rail
        turn={session.current.turn}
        current={session.screen}
        isEvilMode={session.isEvilMode}
        unlockAll={session.unlockAll}
        onSelect={go}
        onExport={() => downloadSave(session)}
        onAbout={() => (aboutModalOpen = true)}
        onOpenAiSettings={() => (aiSettingsModalOpen = true)}
        onUnlockAll={() => session.unlockAllScreens()}
        {onImport}
      />
      {#if screen.id === 'oval'}
        <OvalOffice
          {session}
          question={screen.question}
          {go}
          onOpenMyth={(id) => (activeMythId = id)}
          onOpenExplainer={(id) => (activeExplainerId = id)}
          onOpenCrisis={(crisis) => { activeReviewCrisis = crisis; }}
        />
      {:else if screen.id === 'economy'}
        <Economy
          {session}
          question={screen.question}
          {go}
          onOpenMyth={(id) => (activeMythId = id)}
          onOpenExplainer={(id) => (activeExplainerId = id)}
          onOpenFed={() => (fedModalOpen = true)}
          onOpenModelInspector={() => (modelInspectorOpen = true)}
        />
      {:else if screen.id === 'budget'}
        <Budget
          {session}
          question={screen.question}
          {go}
          onOpenMyth={(id) => (activeMythId = id)}
          onOpenExplainer={(id) => (activeExplainerId = id)}
        />
      {:else if screen.id === 'congress'}
        <Congress
          {session}
          question={screen.question}
          onOpenMyth={(id) => (activeMythId = id)}
          onOpenExplainer={(id) => (activeExplainerId = id)}
        />
      {:else if screen.id === 'powers'}
        <Powers
          {session}
          question={screen.question}
          {go}
          onOpenMyth={(id) => (activeMythId = id)}
          onOpenSpeech={() => (speechModalOpen = true)}
          onOpenFed={() => (fedModalOpen = true)}
        />
      {:else if screen.id === 'trade'}
        <Trade
          {session}
          question={screen.question}
          {go}
          onOpenMyth={(id) => (activeMythId = id)}
          onOpenExplainer={(id) => (activeExplainerId = id)}
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

    {#if displayedCrisis}
      <CrisisModal
        crisis={displayedCrisis}
        {session}
        onClose={() => {
          dismissedCrisisTurn = session.current.turn;
          activeReviewCrisis = null;
        }}
      />
    {/if}

    {#if activeMyth}
      <MythModal
        myth={activeMyth}
        isFirstView={!session.current.viewedMyths.includes(activeMyth.id)}
        calmMode={session.calmMode}
        onClose={() => (activeMythId = null)}
        onGotIt={() => {
          session.viewMythCard(activeMyth!.id);
          activeMythId = null;
        }}
        onPivot={(action) => {
          session.viewMythCard(activeMyth!.id);
          activeMythId = null;
          go(action.screen);
        }}
      />
    {/if}

    {#if activeExplainer}
      <ExplainerModal
        explainer={activeExplainer}
        isFirstView={!session.hasViewedExplainer(activeExplainer.id)}
        onClose={() => (activeExplainerId = null)}
        onGotIt={() => {
          session.viewExplainer(activeExplainer!.id);
          activeExplainerId = null;
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
        onOpenModelInspector={() => (modelInspectorOpen = true)}
      />
    {/if}

    {#if reportModalOpen}
      <ProblemReportModal
        {session}
        onClose={() => (reportModalOpen = false)}
      />
    {/if}

    {#if modelInspectorOpen}
      <ModelInspectorModal
        onClose={() => (modelInspectorOpen = false)}
      />
    {/if}

    {#if aiSettingsModalOpen}
      <AiSettingsModal
        {session}
        onClose={() => (aiSettingsModalOpen = false)}
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

{#if session.showingImpeachmentModal}
  <ImpeachmentModal
    evilState={session.current.evil}
    onClose={() => session.dismissImpeachmentModal()}
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
  :global([data-calm='true'] *),
  :global([data-calm='true'] *::before),
  :global([data-calm='true'] *::after) {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
</style>
