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
  .packs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
  .pack {
    font: 600 20px var(--font-ui); color: var(--ink); background: var(--card); border: var(--rule) solid var(--ink);
    border-radius: var(--r-sm); padding: 12px 10px; min-height: 50px; cursor: pointer; box-shadow: var(--shadow);
    transition: transform var(--dur-fast);
  }
  .pack:hover { transform: translateY(-2px); }
  .pack[aria-pressed='true'] { background: var(--gold); }
  .cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; flex-grow: 1; }
  .group { padding: 16px 20px; display: flex; flex-direction: column; gap: 6px; }
  h3 { margin: 0 0 4px; font: 700 21px var(--font-display); }
  h3 span { font: 400 16px var(--font-body); color: var(--ink-soft); }
  .row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 0 10px; padding: 2px 6px; border-radius: 8px; }
  .row.changed { background: color-mix(in srgb, var(--gold) 30%, transparent); }
  label { font: 600 18px var(--font-ui); }
  .val { font: 600 16px var(--font-ui); color: var(--ink-soft); }
  .track { grid-column: span 2; position: relative; height: 30px; }
  .track::before { content: ''; position: absolute; left: 0; right: 0; top: 11px; height: 9px; border-radius: 5px; background: var(--ink); }
  .changed .track::before { background: linear-gradient(to right, var(--gold) var(--fill), var(--ink) var(--fill)); }
  .tick { position: absolute; top: 4px; width: 3px; height: 22px; margin-left: -1.5px; background: var(--gold-dark); border-radius: 2px; }
  input { position: absolute; inset: 0; width: 100%; margin: 0; appearance: none; background: transparent; cursor: pointer; }
  input::-webkit-slider-thumb { appearance: none; width: 26px; height: 26px; border-radius: 50%; background: var(--gold); border: 3px solid var(--ink); box-shadow: 2px 2px 0 var(--ink); }
  input::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: var(--gold); border: 3px solid var(--ink); }
  .info { display: flex; flex-direction: column; gap: 4px; padding: 16px; }
  .info b { font: 700 20px/1.2 var(--font-display); }
  .info .num { font: 700 30px var(--font-ui); }
  .line { font: 600 18px/1.25 var(--font-ui); }
  .fine { font-size: 13px; color: var(--ink-soft); }
  .good { color: var(--sage); }
  .bad { color: var(--alert); }
  .spacer { flex-grow: 1; }
  .stamp, .sent { align-self: center; }
  .sent { background: var(--sage); font-size: 19px; padding: 12px 16px; }
</style>
