<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import type { ScreenId } from '../app/screens';
  import { describe, estimate, packages, spendLevers, taxLevers, type Lever, type PackageName } from '../engine/budget';
  import ScreenLayout from '../ui/ScreenLayout.svelte';

  import type { ExplainerId } from '../content/explainers';
  import { pickContextualMyth } from '../content/myths';
  import {
    BUDGET_LEVER_TRADEOFFS,
    BUDGET_PACKAGE_TRADEOFFS,
    getBudgetLeverTradeoff,
  } from '../content/tradeoffs';
  import HouseholdModal from '../ui/HouseholdModal.svelte';
  import TradeoffPill from '../ui/TradeoffPill.svelte';
  import { resolveHouseholdPortrait } from '../ui/art/Character.svelte';
  import CharacterPortrait from '../ui/art/CharacterPortrait.svelte';

  let {
    session,
    question,
    go,
    onOpenMyth,
    onOpenExplainer,
  }: {
    session: Session;
    question: string;
    go: (id: ScreenId) => void;
    onOpenMyth?: (id: string) => void;
    onOpenExplainer?: (id: ExplainerId) => void;
  } = $props();

  let showHouseholdModal = $state(false);
  let focusedLeverId = $state<string>('inc');
  let focusedMode = $state<'lever' | 'package'>('lever');

  const words = $derived(describe(estimate(session.draft.budget)));
  const persona = $derived(session.selectedHouseholdPersona);
  const netHousehold = $derived(session.householdImpact.netMonthlyDelta);
  const citizenPortrait = $derived(resolveHouseholdPortrait(persona, netHousehold));
  const budgetMyth = $derived(pickContextualMyth(session.current, 'budget'));
  const packNames = Object.keys(packages) as PackageName[];
  const allLevers = [...taxLevers, ...spendLevers];

  const activeTradeoff = $derived.by(() => {
    if (focusedMode === 'package' && session.draft.pack && BUDGET_PACKAGE_TRADEOFFS[session.draft.pack]) {
      const p = BUDGET_PACKAGE_TRADEOFFS[session.draft.pack];
      return {
        emoji: p.emoji,
        title: session.vocabMode === 'wonk' ? p.wonkLabel : p.plainLabel,
        whyClick: p.whyClick,
        upside: p.upside,
        catchText: p.catchText,
        realTerm: p.wonkLabel,
        legalBasis: p.statutoryBasis,
      };
    }
    const leverDef = allLevers.find((x) => x.id === focusedLeverId) ?? taxLevers[0]!;
    const inForce = session.current.policy[leverDef.id] ?? leverDef.base;
    const val = session.draft.budget[leverDef.id] ?? inForce;
    const t = getBudgetLeverTradeoff(leverDef.id, val, inForce);
    return {
      emoji: t.emoji,
      title: session.vocabMode === 'wonk' ? t.wonkLabel : t.plainLabel,
      whyClick: t.whyClick,
      upside: t.upside,
      catchText: t.catchText,
      realTerm: t.wonkLabel,
      legalBasis: t.statutoryBasis,
    };
  });

  function valueText(l: Lever, v: number, isTax: boolean, inForce: number) {
    const d = +(v - inForce).toFixed(1);
    const baseDelta = +(inForce - l.base).toFixed(1);
    const baseSuffix = d === 0 && baseDelta !== 0 ? ` (${baseDelta > 0 ? '+' : ''}${baseDelta}% vs 2026)` : '';
    if (isTax) return `${v}%${d ? (d > 0 ? ` · up ${d}` : ` · down ${-d}`) : baseSuffix}`;
    return d === 0 ? `Same as now${baseSuffix}` : `${d > 0 ? '+' : ''}${d}% · ${d > 0 ? 'up' : 'down'}`;
  }
  const pct = (l: Lever, v: number) => ((v - l.min) / (l.max - l.min)) * 100;
</script>

{#snippet sliders(title: string, sub: string, levers: Lever[], isTax: boolean)}
  <section class="card group" aria-label={title}>
    <h3>{title} <span>· {sub}</span></h3>
    {#each levers as l (l.id)}
      {@const inForce = session.current.policy[l.id] ?? l.base}
      {@const v = session.draft.budget[l.id] ?? inForce}
      {@const changed = v !== inForce}
      {@const meta = BUDGET_LEVER_TRADEOFFS[l.id]}
      <div class="row" class:changed data-in-force={inForce}>
        <label for={l.id} title={meta ? `${meta.wonkLabel} — ${meta.whyClick}` : undefined}>
          {#if meta}<span class="lever-emoji" aria-hidden="true">{meta.emoji}</span> {/if}{l.label}
        </label>
        <span class="val">{valueText(l, v, isTax, inForce)}</span>
        <div class="track" style:--fill="{pct(l, v)}%">
          {#if inForce !== l.base}
            <span class="tick base-tick" style:left="{pct(l, l.base)}%" title="2026 baseline"></span>
          {/if}
          <span class="tick" style:left="{pct(l, inForce)}%" title="Current policy in force"></span>
          <input
            id={l.id}
            type="range"
            disabled={session.over}
            min={l.min}
            max={l.max}
            step={l.step}
            value={v}
            aria-valuetext={valueText(l, v, isTax, inForce)}
            onmouseenter={() => {
              focusedLeverId = l.id;
              focusedMode = 'lever';
            }}
            onfocus={() => {
              focusedLeverId = l.id;
              focusedMode = 'lever';
            }}
            oninput={(e) => {
              focusedLeverId = l.id;
              focusedMode = 'lever';
              session.setLever(l.id, +e.currentTarget.value);
            }}
          />
        </div>
      </div>
    {/each}
    {#if !isTax}
      {@const assistInForce = session.current.foreignPolicy?.foreignAssistance ?? 100}
      {@const assist = session.effectiveForeignPolicy.foreignAssistance}
      {@const changed = assist !== assistInForce}
      <div class="row foreign-assistance-row" class:changed>
        <label for="foreign-assistance-slider">🌍 Foreign Assistance &amp; Aid</label>
        <span class="val">{assist === assistInForce ? 'Same as now ($45B/yr, <1%)' : `${assist > assistInForce ? '+' : ''}${assist - assistInForce}% · ${assist > assistInForce ? 'up' : 'down'}`}</span>
        <div class="track" style:--fill="{(assist / 200) * 100}%">
          {#if assistInForce !== 100}
            <span class="tick base-tick" style:left="50%" title="2026 baseline"></span>
          {/if}
          <span class="tick" style:left="{(assistInForce / 200) * 100}%" title="Current policy in force"></span>
          <input
            id="foreign-assistance-slider"
            type="range"
            disabled={session.over}
            min={0}
            max={200}
            step={5}
            value={assist}
            aria-valuetext={assist === assistInForce ? 'Same as now ($45B/yr, <1%)' : `${assist > assistInForce ? '+' : ''}${assist - assistInForce}% · ${assist > assistInForce ? 'up' : 'down'}`}
            oninput={(e) => session.setForeignAssistance(+e.currentTarget.value)}
          />
        </div>
      </div>
    {/if}
  </section>
{/snippet}

<ScreenLayout {question}>
  {#snippet main()}
    <div class="packs" role="group" aria-label="Start from a package">
      {#each packNames as p (p)}
        {@const pMeta = BUDGET_PACKAGE_TRADEOFFS[p]}
        <button
          class="pack"
          aria-pressed={session.draft.pack === p}
          disabled={session.over}
          title={pMeta ? `${pMeta.whyClick} (👍 ${pMeta.upside} · ⚠️ ${pMeta.catchText})` : undefined}
          onclick={() => {
            focusedMode = 'package';
            session.pickPackage(p);
          }}
        >
          {#if pMeta}<span aria-hidden="true">{pMeta.emoji}</span> {/if}{p}
        </button>
      {/each}
    </div>
    <div class="cols">
      {@render sliders('Money in', 'taxes', taxLevers, true)}
      {@render sliders('Money out', 'vs this year', spendLevers, false)}
    </div>
  {/snippet}
  {#snippet learn()}
    <button type="button" class="link" data-testid="how-it-works-btn" onclick={() => onOpenExplainer?.('budget')}>How a budget becomes law</button>
    <button
      type="button"
      class="ticket"
      onclick={() => onOpenMyth?.('foreign_aid_deficit')}
    >
      Myth? Cut foreign aid to balance it
    </button>
    {#if budgetMyth.id !== 'foreign_aid_deficit'}
      <button
        type="button"
        class="ticket"
        data-testid="contextual-myth-budget"
        onclick={() => onOpenMyth?.(budgetMyth.id)}
      >
        🎲 Myth? {budgetMyth.title}?
      </button>
    {/if}
  {/snippet}
  {#snippet next()}
    <div class="card info" aria-live="polite">
      <span class="label">Expert forecast</span>
      <b class:good={words.deficitGood} class:bad={!words.deficitGood}>{words.deficit}</b>
      <span class="line">{words.economy}</span>
      <span class="fine">Could be off by 30%. Voter reactions not included.</span>
    </div>
    <div class="card info family-card" data-testid="budget-household-card">
      <div class="family-head">
        <span class="label">Your family</span>
        <button
          type="button"
          class="switch-family-btn"
          data-testid="budget-switch-household-btn"
          onclick={() => (showHouseholdModal = true)}
        >
          Switch
        </button>
      </div>
      <div class="family-row">
        <span class="budget-medallion" data-testid="budget-citizen-portrait">
          <CharacterPortrait
            look={citizenPortrait.look}
            mood={citizenPortrait.mood}
            prop={citizenPortrait.prop}
            size={38}
            badgeText={citizenPortrait.badge}
            ringColor={netHousehold > 0 ? 'sage' : netHousehold < 0 ? 'alert' : 'gold'}
          />
        </span>
        <div class="family-copy">
          <span class="line" data-testid="budget-household-persona">{persona.name} · {persona.locationState}</span>
          <b class="num" class:good={netHousehold >= 0} class:bad={netHousehold < 0} data-testid="budget-household-delta">
            {netHousehold >= 0 ? `+$${netHousehold} a month` : `-$${Math.abs(netHousehold)} a month`}
          </b>
        </div>
      </div>
    </div>
    <div class="tradeoff-panel" data-testid="budget-tradeoff-card">
      <TradeoffPill
        variant="card"
        emoji={activeTradeoff.emoji}
        title={activeTradeoff.title}
        whyClick={activeTradeoff.whyClick}
        upside={activeTradeoff.upside}
        catchText={activeTradeoff.catchText}
        realTerm={activeTradeoff.realTerm}
        legalBasis={activeTradeoff.legalBasis}
        vocabMode={session.vocabMode}
      />
      <span class="route-note" data-testid="budget-whip-preview">
        {session.whip.short === 0
          ? '✅ 218+ House votes ready — send to Congress to pass'
          : `⚠️ ${session.whip.short} House votes short — make deals in Congress`}
      </span>
    </div>
    {#if onOpenMyth}
      <button
        type="button"
        class="mirage-lever-btn"
        data-testid="mirage-lever-budget"
        onclick={() => onOpenMyth?.('foreign_aid_deficit')}
      >
        ⚡ Zero Out Foreign Aid
      </button>
    {/if}
    <div class="spacer"></div>
    {#if session.draft.sentToCongress}
      <button class="btn sent" onclick={() => go('congress')}>Sent! Open Congress →</button>
    {:else}
      <button class="stamp" disabled={session.over} onclick={() => session.sendToCongress()}>Send to Congress</button>
    {/if}
  {/snippet}
</ScreenLayout>

{#if showHouseholdModal}
  <HouseholdModal {session} onClose={() => (showHouseholdModal = false)} />
{/if}

<style>
  .packs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(6px, 1vw, 14px); }
  .pack {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    font: 600 clamp(15px, 1.2vw, 20px) var(--font-ui); color: var(--ink); background: var(--card); border: var(--rule) solid var(--ink);
    border-radius: var(--r-sm); padding: clamp(6px, 1vh, 10px) clamp(6px, 0.8vw, 10px); min-height: clamp(38px, 4.5vh, 48px); cursor: pointer; box-shadow: var(--shadow);
    transition: transform var(--dur-fast);
  }
  .pack:hover { transform: translateY(-2px); }
  .pack[aria-pressed='true'] { background: var(--gold); }
  .cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(8px, 1.2vw, 18px); flex-grow: 1; min-height: 0; }
  .group { padding: clamp(8px, 1.2vh, 14px) clamp(10px, 1.2vw, 18px); display: flex; flex-direction: column; gap: clamp(2px, 0.4vh, 5px); min-height: 0; }
  h3 { margin: 0 0 2px; font: 700 clamp(16px, 1.3vw, 20px) var(--font-display); }
  h3 span { font: 400 clamp(13px, 1vw, 16px) var(--font-body); color: var(--ink-soft); }
  .row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 0 clamp(6px, 0.8vw, 10px); padding: 1px 4px; border-radius: 8px; }
  .row.changed { background: color-mix(in srgb, var(--gold) 30%, transparent); }
  label { display: inline-flex; align-items: center; gap: 5px; font: 600 clamp(14px, 1.1vw, 18px) var(--font-ui); }
  .val { font: 600 clamp(13px, 1vw, 16px) var(--font-ui); color: var(--ink-soft); }
  .track { grid-column: span 2; position: relative; height: clamp(20px, 2.6vh, 28px); }
  .track::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); height: 8px; border-radius: 4px; background: var(--ink); }
  .changed .track::before { background: linear-gradient(to right, var(--gold) var(--fill), var(--ink) var(--fill)); }
  .tick { position: absolute; top: 50%; transform: translateY(-50%); width: 3px; height: 18px; margin-left: -1.5px; background: var(--gold-dark); border-radius: 2px; }
  .base-tick { background: var(--ink-soft); opacity: 0.55; height: 14px; }
  .family-head { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
  .family-row { display: flex; align-items: center; gap: 8px; }
  .budget-medallion { flex-shrink: 0; display: inline-flex; }
  .family-copy { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .switch-family-btn {
    padding: 2px 8px;
    font: 700 11px/1.1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--paper);
    color: var(--ink);
    border: 1.5px solid var(--ink);
    border-radius: 4px;
    cursor: pointer;
  }
  input { position: absolute; inset: 0; width: 100%; margin: 0; appearance: none; background: transparent; cursor: pointer; }
  input::-webkit-slider-thumb { appearance: none; width: clamp(20px, 2.2vh, 26px); height: clamp(20px, 2.2vh, 26px); border-radius: 50%; background: var(--gold); border: 2.5px solid var(--ink); box-shadow: 2px 2px 0 var(--ink); }
  input::-moz-range-thumb { width: clamp(18px, 2vh, 22px); height: clamp(18px, 2vh, 22px); border-radius: 50%; background: var(--gold); border: 2.5px solid var(--ink); }
  .info { display: flex; flex-direction: column; gap: 2px; padding: clamp(6px, 0.9vh, 11px) clamp(8px, 1vw, 12px); }
  .info b { font: 700 clamp(15px, 1.25vw, 19px)/1.2 var(--font-display); }
  .info .num { font: 700 clamp(18px, 1.8vw, 24px) var(--font-ui); }
  .line { font: 600 clamp(13px, 1vw, 16px)/1.2 var(--font-ui); max-width: 45ch; }
  .fine { font-size: clamp(10px, 0.85vw, 12px); color: var(--ink-soft); max-width: 45ch; }
  .tradeoff-panel { display: flex; flex-direction: column; gap: 3px; }
  .route-note { font: 500 11px/1.2 var(--font-ui); color: var(--ink-soft); text-align: center; }
  .good { color: var(--sage-dark); }
  .bad { color: var(--alert); }
  .spacer { flex-grow: 1; min-height: 2px; }
  .mirage-lever-btn {
    padding: 3px 8px;
    font: 700 11px/1.1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--paper);
    color: var(--alert-dark);
    border: 1.5px solid var(--alert);
    border-radius: var(--r-sm);
    box-shadow: 1px 1px 0 var(--ink);
    cursor: pointer;
    white-space: nowrap;
    align-self: center;
    transition: transform var(--dur-fast), background var(--dur-fast);
  }
  .mirage-lever-btn:hover {
    background: var(--gold);
    color: var(--ink);
    transform: translateY(-1px);
  }
  .stamp, .sent { align-self: center; flex-shrink: 0; }
  .sent { background: var(--sage); font-size: clamp(15px, 1.2vw, 19px); padding: clamp(8px, 1.2vh, 12px) clamp(12px, 1.5vw, 16px); }
</style>
