<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import type { ScreenId } from '../app/screens';
  import { describe, estimate, packages, spendLevers, taxLevers, type Lever, type PackageName } from '../engine/budget';
  import ScreenLayout from '../ui/ScreenLayout.svelte';

  let { session, question, go }: { session: Session; question: string; go: (id: ScreenId) => void } = $props();

  const words = $derived(describe(estimate(session.draft.budget)));
  const packNames = Object.keys(packages) as PackageName[];

  function valueText(l: Lever, v: number, isTax: boolean) {
    const d = +(v - l.base).toFixed(1);
    if (isTax) return `${v}%${d ? (d > 0 ? ` · up ${d}` : ` · down ${-d}`) : ''}`;
    return d === 0 ? 'Same as now' : `${d > 0 ? '+' : ''}${d}% · ${d > 0 ? 'up' : 'down'}`;
  }
  const pct = (l: Lever, v: number) => ((v - l.min) / (l.max - l.min)) * 100;
</script>

{#snippet sliders(title: string, sub: string, levers: Lever[], isTax: boolean)}
  <section class="card group" aria-label={title}>
    <h3>{title} <span>· {sub}</span></h3>
    {#each levers as l (l.id)}
      {@const v = session.draft.budget[l.id] ?? l.base}
      {@const changed = v !== l.base}
      <div class="row" class:changed>
        <label for={l.id}>{l.label}</label>
        <span class="val">{valueText(l, v, isTax)}</span>
        <div class="track" style:--fill="{pct(l, v)}%">
          <span class="tick" style:left="{pct(l, l.base)}%"></span>
          <input id={l.id} type="range" disabled={session.over} min={l.min} max={l.max} step={l.step} value={v}
            aria-valuetext={valueText(l, v, isTax)}
            oninput={(e) => session.setLever(l.id, +e.currentTarget.value)} />
        </div>
      </div>
    {/each}
  </section>
{/snippet}

<ScreenLayout {question}>
  {#snippet main()}
    <div class="packs" role="group" aria-label="Start from a package">
      {#each packNames as p (p)}
        <button class="pack" aria-pressed={session.draft.pack === p} disabled={session.over} onclick={() => session.pickPackage(p)}>{p}</button>
      {/each}
    </div>
    <div class="cols">
      {@render sliders('Money in', 'taxes', taxLevers, true)}
      {@render sliders('Money out', 'vs this year', spendLevers, false)}
    </div>
  {/snippet}
  {#snippet learn()}
    <button class="link" disabled title="Coming soon">How a budget becomes law</button>
    <button class="ticket" disabled title="Coming soon">Myth? Cut foreign aid to balance it</button>
  {/snippet}
  {#snippet next()}
    <div class="card info" aria-live="polite">
      <span class="label">Expert forecast</span>
      <b class:good={words.deficitGood} class:bad={!words.deficitGood}>{words.deficit}</b>
      <span class="line">{words.economy}</span>
      <span class="fine">Could be off by 30%. Voter reactions not included.</span>
    </div>
    <div class="card info">
      <span class="label">Your family</span>
      <span class="line">Nurse in Ohio</span>
      <b class="num" class:good={words.familyGood} class:bad={!words.familyGood}>{words.family}</b>
    </div>
    <div class="card info">
      <span class="label">Route</span>
      <span class="line">Budget bill: 218 House votes, 51 in the Senate.</span>
    </div>
    <div class="spacer"></div>
    {#if session.draft.sentToCongress}
      <button class="btn sent" onclick={() => go('congress')}>Sent! Open Congress →</button>
    {:else}
      <button class="stamp" disabled={session.over} onclick={() => session.sendToCongress()}>Send to Congress</button>
    {/if}
  {/snippet}
</ScreenLayout>

<style>
  .packs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(6px, 1vw, 14px); }
  .pack {
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
  label { font: 600 clamp(14px, 1.1vw, 18px) var(--font-ui); }
  .val { font: 600 clamp(13px, 1vw, 16px) var(--font-ui); color: var(--ink-soft); }
  .track { grid-column: span 2; position: relative; height: clamp(20px, 2.6vh, 28px); }
  .track::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); height: 8px; border-radius: 4px; background: var(--ink); }
  .changed .track::before { background: linear-gradient(to right, var(--gold) var(--fill), var(--ink) var(--fill)); }
  .tick { position: absolute; top: 50%; transform: translateY(-50%); width: 3px; height: 18px; margin-left: -1.5px; background: var(--gold-dark); border-radius: 2px; }
  input { position: absolute; inset: 0; width: 100%; margin: 0; appearance: none; background: transparent; cursor: pointer; }
  input::-webkit-slider-thumb { appearance: none; width: clamp(20px, 2.2vh, 26px); height: clamp(20px, 2.2vh, 26px); border-radius: 50%; background: var(--gold); border: 2.5px solid var(--ink); box-shadow: 2px 2px 0 var(--ink); }
  input::-moz-range-thumb { width: clamp(18px, 2vh, 22px); height: clamp(18px, 2vh, 22px); border-radius: 50%; background: var(--gold); border: 2.5px solid var(--ink); }
  .info { display: flex; flex-direction: column; gap: clamp(2px, 0.4vh, 4px); padding: clamp(8px, 1.2vh, 14px); }
  .info b { font: 700 clamp(16px, 1.3vw, 20px)/1.2 var(--font-display); }
  .info .num { font: 700 clamp(20px, 2vw, 28px) var(--font-ui); }
  .line { font: 600 clamp(14px, 1.1vw, 17px)/1.25 var(--font-ui); max-width: 45ch; }
  .fine { font-size: clamp(11px, 0.9vw, 13px); color: var(--ink-soft); max-width: 45ch; }
  .good { color: var(--sage); }
  .bad { color: var(--alert); }
  .spacer { flex-grow: 1; min-height: 4px; }
  .stamp, .sent { align-self: center; flex-shrink: 0; }
  .sent { background: var(--sage); font-size: clamp(15px, 1.2vw, 19px); padding: clamp(8px, 1.2vh, 12px) clamp(12px, 1.5vw, 16px); }
</style>
