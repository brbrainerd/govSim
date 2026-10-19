<script lang="ts">
  import { headline } from '../app/indicators';
  import type { Session } from '../app/session.svelte';
  import { year1GuideFor, type ScreenId } from '../app/screens';
  import { prosperity as score } from '../engine/game';
  import { generateBriefing } from '../content/briefing';
  import type { ActiveCrisis } from '../engine/director';
  import OvalOfficeScene from '../ui/art/OvalOfficeScene.svelte';
  import CharacterPortrait from '../ui/art/CharacterPortrait.svelte';
  import CivicEmblem from '../ui/art/CivicEmblem.svelte';
  import type { Look, Mood } from '../ui/art/Character.svelte';
  import Rosette from '../ui/art/Rosette.svelte';
  import ScreenLayout from '../ui/ScreenLayout.svelte';
  import HouseholdCard from '../ui/HouseholdCard.svelte';
  import HouseholdModal from '../ui/HouseholdModal.svelte';
  import DynamicCrisisModal from '../ui/DynamicCrisisModal.svelte';
  import PerkDraftModal from '../ui/PerkDraftModal.svelte';
  import SynergyBar from '../ui/SynergyBar.svelte';
  import { getPerk } from '../content/perks';
  import { pickChyron } from '../content/chyrons';
  import { loadAiConfig } from '../app/ai-providers';

  import type { ExplainerId } from '../content/explainers';
  import { BUDGET_PACKAGE_TRADEOFFS } from '../content/tradeoffs';

  let {
    session,
    question,
    go,
    onOpenMyth,
    onOpenExplainer,
    onOpenCrisis,
  }: {
    session: Session;
    question: string;
    go: (id: ScreenId) => void;
    onOpenMyth?: (mythId: string) => void;
    onOpenExplainer?: (explainerId: ExplainerId) => void;
    onOpenCrisis?: (crisis: ActiveCrisis) => void;
  } = $props();

  let showHouseholdModal = $state(false);
  let showDynamicCrisisModal = $state(false);
  let showPerkDraftModal = $state(false);

  const isAiEnabled = $derived(session.aiConfig.provider !== 'off');
  const tiles = $derived(headline(session.history));
  const index = $derived(Math.round(session.index));
  const change = $derived(index - Math.round(score(session.previous).index));
  const briefingInfo = $derived(generateBriefing(session));
  const chyron = $derived(pickChyron(session));
  const guide = $derived(year1GuideFor(session.current.turn));

  const activeGeopoliticalCrisis = $derived(
    session.current.activeGeopoliticalCrises && session.current.activeGeopoliticalCrises.length > 0
      ? session.current.activeGeopoliticalCrises[0]
      : null,
  );
  const turnsRemaining = $derived(activeGeopoliticalCrisis?.turnsRemaining ?? 1);

  const advisorMood = $derived.by<Mood>(() => {
    if (session.hasUnresolvedCrisis || (session.isEvilMode && session.heat >= 60)) return 'panicked';
    if (session.isEvilMode) return 'scheming';
    if (session.current.approval < 48) return 'stressed';
    return 'confident';
  });

  function advisorForSuggestion(idx: number): { role: string; look: Look } {
    if (session.isEvilMode) {
      return {
        role: 'FIXER',
        look: { skin: 'skin-2', hair: 'hair-3', hairStyle: 'bald', suit: 'art-suit-black', tie: 'alert', mood: advisorMood },
      };
    }
    if (idx === 0) {
      return {
        role: 'COS',
        look: { skin: 'skin-3', hair: 'hair-3', hairStyle: 'bald', suit: 'art-shirt-blue', shirtOnly: true, outfit: 'shirt', mood: advisorMood },
      };
    }
    if (idx === 1) {
      return {
        role: 'WHIP',
        look: { skin: 'skin-4', hair: 'hair-3', hairStyle: 'bald', suit: 'art-suit-black', tie: 'sky', mood: advisorMood },
      };
    }
    return {
      role: 'FED',
      look: { skin: 'skin-1', hair: 'hair-2', hairStyle: 'bald', suit: 'art-cardigan', outfit: 'cardigan', glasses: true, mood: advisorMood },
    };
  }

  const spark = (t: number[]) => {
    const lo = Math.min(...t), hi = Math.max(...t), span = hi - lo || 1;
    const pts = t.map((v, i) => `${t.length > 1 ? (i * 100) / (t.length - 1) : 50},${22 - ((v - lo) / span) * 18}`);
    return { line: `M${pts.join(' L')}`, area: `M0,24 L${pts.join(' L')} L100,24 Z` };
  };
</script>

<ScreenLayout {question}>
  {#snippet main()}
    <div class="card stage">
      <div class="scene">
        <OvalOfficeScene
          talking={true}
          approval={session.current.approval}
          inflation={session.current.econ.inflation}
          unemployment={session.current.econ.unemployment}
          hasCrisis={Boolean(session.current.activeCrisis || activeGeopoliticalCrisis)}
          evilMode={session.isEvilMode}
          heat={session.current.evil?.heat ?? 0}
          stagedCount={session.stagedActionsSummary.length}
          presidentLook={session.presidentLook}
        />
        <div class="bubble" class:evil-bubble={session.isEvilMode} role="status">
          {session.aiTurnPayload?.advisorBubble ?? briefingInfo.bubble}
        </div>
      </div>
      <div class="chyron-strip" data-testid="oval-news-chyron">
        <span class="chyron-tag" class:evil-tag={session.isEvilMode}>{session.aiTurnPayload ? 'AI LIVE' : 'LIVE'}</span>
        {#if session.aiTurnPayload}
          <span class="ai-director-inline-badge" data-testid="ai-director-badge">AI DIRECTOR LIVE</span>
        {/if}
        <span class="chyron-text">{session.aiTurnPayload?.chyron ?? chyron}</span>
      </div>
    </div>
    <div class="doing" class:evil-doing={session.isEvilMode}>
      <div class="doing-head">
        <h3>{session.isEvilMode ? 'How the loot is doing' : 'How America is doing'}</h3>
        <SynergyBar {session} compact={true} />
        <a href="#economy" onclick={(e) => { e.preventDefault(); go('economy'); }}>See all 8</a>
      </div>
      <div class="tiles">
        {#if session.isEvilMode}
          {@const stash = session.current.evil?.offshoreStashBn ?? 0}
          {@const prevStash = session.previous?.evil?.offshoreStashBn ?? 0}
          {@const stashDelta = stash - prevStash}
          <div class="score evil-stash-score" data-testid="oval-offshore-stash">
            <Rosette size={96} />
            <div class="score-text">
              <b>${stash.toFixed(1)}B</b>
              <span>Offshore Stash</span>
              <em class="stash-delta">
                {stashDelta > 0 ? `+$${stashDelta.toFixed(1)}B ▲` : 'no change'}
              </em>
            </div>
          </div>
        {:else}
          <div class="score">
            <Rosette size={96} />
            <div class="score-text"><b>{index}</b><span>/ 100</span><em class:down={change < 0}>{change === 0 ? 'no change' : change > 0 ? `up ${change} ▲` : `down ${-change} ▼`}</em></div>
          </div>
        {/if}
        {#each tiles as t (t.label)}
          {@const s = spark(t.trend)}
          <div class="card tile">
            <svg class="spark" viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden="true">
              <path d={s.area} fill={t.good ? 'var(--sage)' : 'var(--alert)'} opacity=".18" />
              <path d={s.line} fill="none" stroke={t.good ? 'var(--sage)' : 'var(--alert)'} stroke-width="2.5" vector-effect="non-scaling-stroke" />
            </svg>
            <span class="label">{t.label}</span>
            <span class="num">{t.value}</span>
            <span class="dir" class:good={t.good}>{t.unit ? `${t.unit}, ` : ''}{t.direction === 'flat' ? 'no change' : t.direction} {t.direction === 'up' ? '▲' : t.direction === 'down' ? '▼' : ''}</span>
          </div>
        {/each}
      </div>
    </div>
  {/snippet}
  {#snippet learn()}
    <button type="button" class="link" data-testid="how-it-works-btn" onclick={() => onOpenExplainer?.('oval_office')}>How it works</button>
    {#if session.showMyths && !session.hasResolvedMyth('gas_prices')}
      <button type="button" class="ticket" onclick={() => onOpenMyth?.('gas_prices')}>Myth? Can you lower gas prices</button>
    {/if}
  {/snippet}
  {#snippet next()}
    {#if activeGeopoliticalCrisis}
      <div class="card geopolitical-alert" data-testid="geopolitical-alert-card">
        <div class="alert-top">
          <span class="alert-tag">
            <svg class="globe-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            INTERNATIONAL CRISIS
          </span>
          <span class="countdown-tag" class:urgent={turnsRemaining <= 1}>
            {turnsRemaining > 1 ? `${turnsRemaining} Quarters Left` : 'Final Quarter!'}
          </span>
        </div>
        <b class="alert-headline">{activeGeopoliticalCrisis.headline}</b>
        <button
          type="button"
          class="btn review-crisis-btn"
          data-testid="review-crisis-btn"
          onclick={() => onOpenCrisis?.(activeGeopoliticalCrisis)}
        >
          Review Crisis Options
        </button>
      </div>
    {/if}
    {#if session.isEvilMode}
      {@const evil = session.current.evil}
      {@const heat = Math.round(evil?.heat ?? 0)}
      {@const stash = evil?.offshoreStashBn ?? 0}
      {@const isImminent = heat >= 80}
      {@const isSpecialCounsel = Boolean(evil?.specialCounselAppointed || heat >= 60)}
      <div class="card evil-situation-card" class:urgent={isImminent} data-testid="evil-situation-card">
        <div class="evil-card-header">
          <span class="evil-intel-tag">
            <CivicEmblem kind="syndicate" size={14} />
            KLEPTOCRATIC INTEL
          </span>
          <span
            class="evil-heat-pill"
            class:heat-critical={isImminent}
            class:heat-warning={isSpecialCounsel && !isImminent}
            data-testid="oval-heat-pill"
          >
            Heat: {heat}/100
          </span>
        </div>

        <div
          class="heat-gauge-wrap"
          role="progressbar"
          aria-valuenow={heat}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Investigation Heat Gauge"
        >
          <div class="heat-gauge-track">
            <div
              class="heat-gauge-fill"
              style="width: {Math.min(100, Math.max(0, heat))}%"
              class:fill-critical={isImminent}
              class:fill-warning={isSpecialCounsel && !isImminent}
            ></div>
            <div class="heat-marker threshold-sc" style="left: 60%" title="Special Counsel (60 Heat)"></div>
            <div class="heat-marker threshold-impeach" style="left: 80%" title="Impeachment (80 Heat)"></div>
          </div>
          <div class="heat-gauge-labels">
            <span>0</span>
            <span class="threshold-label" style="left: 60%">60</span>
            <span class="threshold-label" style="left: 80%">80</span>
            <span>100</span>
          </div>
        </div>

        <div class="evil-status-callout">
          {#if isImminent}
            <b class="status-alert critical-alert">CRITICAL: Impeachment Vote Imminent (218 House Votes)</b>
          {:else if isSpecialCounsel}
            <b class="status-alert warning-alert">WARNING: Special Counsel Active (−25 Clout/Qtr)</b>
          {:else if heat >= 35}
            <span class="status-text">Watchdogs Snooping: Evidence leaking slowly</span>
          {:else}
            <span class="status-text">Investigations Dormant: Extraction proceeding cleanly</span>
          {/if}
        </div>

        <div class="evil-card-stats">
          <div class="stat-mini">
            <span class="stat-mini-label">Offshore Loot</span>
            <span class="stat-mini-val" data-testid="oval-stash-val">${stash.toFixed(1)}B</span>
          </div>
          <div class="stat-mini">
            <span class="stat-mini-label">Watchdog Probes</span>
            <span class="stat-mini-val">{evil?.specialCounselAppointed ? 'Investigated' : 'Evading Probes'}</span>
          </div>
        </div>

        <button
          type="button"
          class="btn corrupt-levers-btn"
          data-testid="goto-corrupt-levers-btn"
          onclick={() => go('powers')}
        >
          Enact Corrupt Levers
        </button>
      </div>
    {/if}
    <div class="card info">
      <div class="turn-head">
        <span class="label">This turn</span>
        <span class="scen-pill" data-testid="oval-scenario-badge">{session.activeScenario.name}</span>
        {#if !session.isClassicSim}
          <button
            type="button"
            class="perk-draft-pill"
            class:drafted={Boolean(session.draft.perkPickId)}
            class:skipped={Boolean(session.draft.perkSkipForClout)}
            data-testid="open-perk-draft-btn"
            onclick={() => (showPerkDraftModal = true)}
          >
            {#if session.draft.perkPickId}
              <CivicEmblem kind="up" size={12} /> {getPerk(session.draft.perkPickId)?.name ?? 'Drafted'}
            {:else if session.draft.perkSkipForClout}
              <CivicEmblem kind="skip" size={12} /> Draft Skipped (+10 Clout)
            {:else}
              <CivicEmblem kind={session.isEvilMode ? 'syndicate' : 'capitol'} size={13} />
              {session.isEvilMode ? 'Heist Relic Draft' : 'Task Force Draft'} ({session.activePerks.length} Active)
            {/if}
          </button>
        {/if}
      </div>
      {#if guide}
        <div class="year1-guide" data-testid="year1-onboarding-guide">
          <b>{guide.step}:</b> <span>{guide.detail}</span>
        </div>
      {/if}
      <b>{briefingInfo.thisTurn.title}</b>
      <span>{briefingInfo.thisTurn.detail}</span>
    </div>
    <HouseholdCard {session} onExplore={() => (showHouseholdModal = true)} />

    {#if session.aiTurnPayload}
      <div class="card ai-director-card" data-testid="ai-briefing-card">
        <div class="ai-head-row">
          <span class="ai-director-badge" data-testid="ai-director-badge">AI DIRECTOR LIVE</span>
          {#if session.aiTurnPayload.dynamicCrisis}
            <span class="ai-crisis-badge">CRISIS READY</span>
          {/if}
        </div>
        <b class="ai-headline">{session.aiTurnPayload.turnHeadline}</b>
        <span class="ai-detail">{session.aiTurnPayload.turnDetail}</span>
        {#if session.aiTurnPayload.dynamicCrisis}
          <button
            type="button"
            class="btn ai-trigger-btn"
            data-testid="trigger-ai-crisis-btn"
            onclick={() => (showDynamicCrisisModal = true)}
          >
            Review AI Dynamic Crisis
          </button>
        {/if}
      </div>
    {:else if isAiEnabled}
      <div class="card ai-trigger-card">
        <button
          type="button"
          class="btn ai-trigger-btn"
          data-testid="trigger-ai-crisis-btn"
          onclick={() => session.refreshAiDirector()}
          disabled={session.aiLoading}
        >
          {session.aiLoading ? 'Synthesizing...' : 'Synthesize AI Turn Briefing'}
        </button>
      </div>
    {/if}

    {#each briefingInfo.suggestions as s, idx (s.title)}
      {@const packMeta = s.play?.pack ? BUDGET_PACKAGE_TRADEOFFS[s.play.pack] : null}
      {@const adv = advisorForSuggestion(idx)}
      <div
        class="card option"
        title={packMeta ? `${packMeta.whyClick} (Upside: ${packMeta.upside} · Trade-off: ${packMeta.catchText})` : s.play?.autoWhip ? 'Locks in the cheapest deals to pass your bill · Costs Clout from your bank' : undefined}
      >
        <div class="option-row">
          <div class="advisor-medallion" data-testid="oval-advisor-portrait">
            <CharacterPortrait
              look={adv.look}
              mood={advisorMood}
              size={38}
              badgeText={adv.role}
              ringColor={session.isEvilMode ? 'alert' : 'gold'}
            />
          </div>
          <div class="option-text">
            <b>{s.title}</b>
            {#if s.play?.pack && packMeta}
              <span class="play-badge" data-testid="advisor-play-badge">
                <CivicEmblem kind={packMeta.emoji} size={12} /> Play: {s.play.pack} · <CivicEmblem kind="up" size={11} /> {packMeta.upside}
              </span>
            {:else if s.play?.autoWhip}
              <span class="play-badge" data-testid="advisor-play-badge">
                <CivicEmblem kind="handshake" size={12} /> Play: Auto-whip · <CivicEmblem kind="up" size={11} /> Enough votes to pass
              </span>
            {/if}
          </div>
        </div>
        <button
          type="button"
          class="btn"
          onclick={() => {
            if (s.play) {
              session.applyAdvisorPlay(s.play);
            }
            if (s.openCrisis && session.current.activeCrisis) {
              onOpenCrisis?.(session.current.activeCrisis);
            } else if (s.mythId) {
              onOpenMyth?.(s.mythId);
            } else if (s.target) {
              go(s.target);
            }
          }}
        >{s.cta}</button>
      </div>
    {/each}
  {/snippet}
</ScreenLayout>

{#if showHouseholdModal}
  <HouseholdModal {session} onClose={() => (showHouseholdModal = false)} />
{/if}

{#if showDynamicCrisisModal && session.aiTurnPayload?.dynamicCrisis}
  <DynamicCrisisModal
    crisis={session.aiTurnPayload.dynamicCrisis}
    {session}
    onClose={() => (showDynamicCrisisModal = false)}
  />
{/if}

{#if showPerkDraftModal}
  <PerkDraftModal {session} onClose={() => (showPerkDraftModal = false)} />
{/if}

<style>
  .stage { position: relative; display: flex; flex-direction: column; gap: 4px; height: clamp(185px, 31vh, 320px); padding: clamp(5px, 0.8vh, 8px); min-height: 0; flex-shrink: 1; }
  :global([data-theme="evil"]) .stage { background: var(--alert-dark); border-color: var(--alert); }
  .scene { position: relative; flex: 1; min-height: 0; border-radius: 8px; overflow: hidden; border: 2px solid var(--ink); }
  .chyron-strip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 8px;
    background: var(--ink);
    color: var(--card);
    border-radius: 6px;
    flex-shrink: 0;
    overflow: hidden;
  }
  .chyron-tag {
    font: 900 10px/1.2 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: var(--alert);
    color: var(--card);
    padding: 2px 6px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .chyron-text {
    font: 600 clamp(11px, 0.9vw, 13px)/1.2 var(--font-ui);
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bubble {
    position: absolute;
    right: clamp(10px, 1.4vw, 18px);
    top: clamp(8px, 1.2vh, 14px);
    max-width: 22ch;
    padding: clamp(6px, 0.9vh, 10px) clamp(8px, 1vw, 14px);
    background: var(--card);
    border: 2.5px solid var(--ink);
    border-radius: 12px;
    font: 700 clamp(12px, 1vw, 15px)/1.25 var(--font-body);
    color: var(--ink);
    text-align: center;
    box-shadow: 3px 3px 0 var(--ink);
    z-index: 2;
  }
  .bubble.evil-bubble {
    border-color: var(--ink);
    background: var(--card);
  }
  .bubble::after { content: ''; position: absolute; bottom: -12px; left: 24px; border: 12px solid transparent; border-top-color: var(--ink); border-bottom: 0; }
  .doing { min-height: 0; }
  .doing-head { display: flex; justify-content: space-between; align-items: baseline; }
  h3 { margin: 0; font: 700 clamp(18px, 1.5vw, 22px) var(--font-display); color: var(--paper-ink); }
  .doing-head a { font: 600 clamp(14px, 1.1vw, 17px) var(--font-ui); color: var(--paper-ink); }
  .tiles { display: grid; grid-template-columns: minmax(150px, 1.2fr) repeat(4, minmax(0, 1fr)); gap: clamp(6px, 1vw, 14px); margin-top: clamp(4px, 0.6vh, 8px); }
  .score { display: flex; align-items: center; gap: 4px; }
  .score-text { display: flex; flex-direction: column; line-height: 1; }
  .score-text b { font: 700 clamp(30px, 3.2vw, 44px) var(--font-ui); color: var(--paper-ink); }
  .score-text span { font: 600 clamp(14px, 1.2vw, 18px) var(--font-ui); color: var(--paper-ink-soft); }
  .score-text em { font: 600 clamp(14px, 1.1vw, 18px) var(--font-ui); font-style: normal; color: var(--sage-dark); margin-top: 2px; }
  :global([data-theme="evil"]) .score-text em { color: var(--gold); }
  .score-text em.down { color: var(--alert); }
  .tile { display: flex; flex-direction: column; align-items: center; text-align: center; padding: clamp(4px, 0.8vh, 8px) clamp(4px, 0.5vw, 8px); gap: 2px; min-width: 0; }
  .tile .label { font-size: clamp(11px, 0.85vw, 13px); line-height: 1.1; color: var(--ink); text-wrap: balance; height: 2.2em; display: grid; place-items: center; }
  .tile .num { font-size: clamp(20px, 2vw, 30px); }
  .spark { width: 70%; height: clamp(16px, 2vh, 22px); }
  .dir { font: 600 clamp(12px, 0.9vw, 15px) var(--font-ui); color: var(--alert); }
  .dir.good { color: var(--sage-dark); }
  .info { display: flex; flex-direction: column; gap: 3px; padding: clamp(6px, 0.9vh, 10px); text-align: center; }
  .turn-head { display: flex; justify-content: center; align-items: center; gap: 6px; flex-wrap: wrap; }
  .scen-pill { font: 700 10px/1 var(--font-ui); text-transform: uppercase; letter-spacing: 0.04em; padding: 2px 6px; border-radius: 4px; background: var(--paper); border: 1px solid var(--ink); color: var(--ink); }
  .perk-draft-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font: 700 10px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 3px 7px;
    border-radius: 4px;
    background: var(--gold);
    border: 1.5px solid var(--ink);
    color: var(--ink);
    cursor: pointer;
    box-shadow: 1px 1px 0 var(--ink);
  }
  .perk-draft-pill:hover {
    background: var(--paper-warm);
  }
  .perk-draft-pill.drafted {
    background: var(--sage-tint);
    border-color: var(--sage-dark);
  }
  .perk-draft-pill.skipped {
    background: var(--paper-dark);
  }
  .year1-guide {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 4px 8px;
    background: var(--paper-dark);
    border-left: 3px solid var(--gold);
    border-radius: var(--r-sm);
    text-align: left;
    font-size: clamp(10.5px, 0.85vw, 12px);
    line-height: 1.2;
    color: var(--ink);
  }
  .year1-guide b {
    font-family: var(--font-ui);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ink-soft);
  }
  .info b { font: 700 clamp(15px, 1.25vw, 18px)/1.15 var(--font-display); }
  .info span:last-child { font-size: clamp(11.5px, 0.9vw, 13.5px); line-height: 1.2; color: var(--ink-soft); max-width: 35ch; }
  .option { display: flex; flex-direction: column; align-items: stretch; gap: clamp(3px, 0.5vh, 6px); padding: clamp(5px, 0.8vh, 9px) clamp(7px, 0.9vw, 10px); text-align: left; }
  .option-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .advisor-medallion { flex-shrink: 0; display: inline-flex; }
  .option-text { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; flex: 1; min-width: 0; }
  .option b { font: 700 clamp(13px, 1.1vw, 16px)/1.15 var(--font-display); }
  .option .btn { align-self: center; width: 100%; padding: 4px 10px; font-size: clamp(12px, 0.95vw, 14px); }
  .play-badge { font: 700 9.5px/1.1 var(--font-ui); color: var(--sage-dark); text-transform: uppercase; letter-spacing: 0.03em; }

  .geopolitical-alert {
    background: var(--paper-dark);
    border: 2px solid var(--alert);
    border-left: 6px solid var(--alert);
    padding: clamp(8px, 1.2vh, 12px);
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: 2px 2px 0 var(--ink);
  }

  .alert-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .alert-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-condensed);
    font-size: var(--text-xs);
    font-weight: 800;
    letter-spacing: 0.06em;
    color: var(--alert);
  }

  .countdown-tag {
    font-family: var(--font-condensed);
    font-size: var(--text-xs);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 6px;
    border-radius: var(--r-sm);
    background: var(--card);
    color: var(--ink);
    border: 1px solid var(--gold);
  }

  .countdown-tag.urgent {
    background: var(--alert-tint);
    color: var(--alert);
    border-color: var(--alert);
  }

  .alert-headline {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    line-height: 1.35;
    color: var(--ink);
  }

  .review-crisis-btn {
    align-self: flex-start;
    background: var(--alert);
    color: var(--card);
    border: 1.5px solid var(--ink);
    font-family: var(--font-condensed);
    font-size: var(--text-xs);
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: var(--r-sm);
    cursor: pointer;
  }

  .review-crisis-btn:hover {
    background: var(--alert-dark);
  }

  .evil-situation-card {
    background: var(--card);
    border: 2px solid var(--gold);
    border-left: 6px solid var(--gold);
    padding: clamp(8px, 1.2vh, 12px);
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 2px 2px 0 var(--ink);
  }

  .evil-situation-card.urgent {
    border-color: var(--alert);
    border-left-color: var(--alert);
  }

  .evil-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .evil-intel-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font: 700 11px var(--font-ui);
    letter-spacing: 0.08em;
    color: var(--alert-dark);
    text-transform: uppercase;
  }

  .evil-heat-pill {
    font: 700 12px var(--font-ui);
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--paper);
    border: 1px solid var(--ink);
    color: var(--ink);
  }

  .evil-heat-pill.heat-warning {
    border-color: var(--gold);
    background: var(--gold-dark);
    color: var(--card);
  }

  .evil-heat-pill.heat-critical {
    border-color: var(--alert);
    background: var(--alert);
    color: var(--card);
  }

  .heat-gauge-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .heat-gauge-track {
    position: relative;
    height: 10px;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: 5px;
    overflow: hidden;
  }

  .heat-gauge-fill {
    height: 100%;
    background: var(--gold);
    transition: width 0.3s ease;
  }

  .heat-gauge-fill.fill-warning {
    background: var(--gold-dark);
  }

  .heat-gauge-fill.fill-critical {
    background: var(--alert);
  }

  .heat-marker {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--ink);
    opacity: 0.6;
  }

  .heat-gauge-labels {
    position: relative;
    display: flex;
    justify-content: space-between;
    font: 600 10px var(--font-ui);
    color: var(--ink-soft);
  }

  .threshold-label {
    position: absolute;
    transform: translateX(-50%);
  }

  .evil-status-callout {
    font: 600 12px/1.2 var(--font-ui);
    padding: 4px 6px;
    background: var(--paper);
    border-radius: 4px;
  }

  .status-alert.critical-alert {
    color: var(--alert);
    font-weight: 700;
  }

  .status-alert.warning-alert {
    color: var(--gold-dark);
    font-weight: 700;
  }

  .evil-card-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 4px 0;
  }

  .stat-mini {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .stat-mini-label {
    font: 600 11px var(--font-ui);
    color: var(--ink-soft);
    text-transform: uppercase;
  }

  .stat-mini-val {
    font: 700 15px var(--font-ui);
    color: var(--ink);
  }

  .corrupt-levers-btn {
    width: 100%;
    margin-top: 2px;
    background: var(--alert);
    border-color: var(--alert-dark);
    color: var(--card);
  }

  .corrupt-levers-btn:hover {
    filter: brightness(1.1);
  }

  .evil-stash-score .stash-delta {
    color: var(--gold);
    font-style: normal;
  }

  .ai-director-inline-badge {
    font: 700 9px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: var(--gold);
    color: var(--ink);
    padding: 2px 6px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .ai-director-card,
  .ai-trigger-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: clamp(8px, 1.2vh, 12px);
    background: var(--paper-dark);
    border: 1.5px solid var(--ink);
    border-radius: var(--r-sm);
  }

  .ai-head-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ai-director-badge {
    font: 700 10px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: var(--gold);
    color: var(--ink);
    padding: 2px 6px;
    border-radius: 3px;
    border: 1px solid var(--ink);
  }

  .ai-crisis-badge {
    font: 700 9px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: var(--alert);
    color: var(--card);
    padding: 2px 5px;
    border-radius: 2px;
  }

  .ai-headline {
    font: 700 14px/1.2 var(--font-display);
    color: var(--ink);
  }

  .ai-detail {
    font: 500 12px/1.3 var(--font-body);
    color: var(--ink-soft);
  }

  .ai-trigger-btn {
    margin-top: 4px;
    background: var(--ink);
    color: var(--paper);
    font: 700 11px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 6px 10px;
    border-radius: 3px;
    border: 1px solid var(--ink);
    cursor: pointer;
  }

  .ai-trigger-btn:hover:not(:disabled) {
    background: var(--ink-soft);
  }
</style>
