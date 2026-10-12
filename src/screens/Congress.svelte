<script lang="ts">
  import { ThumbsDown, ThumbsUp } from '@lucide/svelte';
  import type { Session } from '../app/session.svelte';
  import { deals, groups, HOUSE_SEATS, TO_PASS } from '../engine/congress';
  import Character, { type Look } from '../ui/art/Character.svelte';
  import { arcPoint, HEMI, hemicycle } from '../ui/art/hemicycle';
  import ScreenLayout from '../ui/ScreenLayout.svelte';

  let { session, question }: { session: Session; question: string } = $props();

  const seats = hemicycle(HOUSE_SEATS);
  const looks: Look[] = [
    { skin: 'skin-2', hair: 'hair-1', hairStyle: 'bun', suit: 'sky' },
    { skin: 'skin-1', hair: 'hair-2', hairStyle: 'short', suit: 'sage', tie: 'card' },
    { skin: 'skin-3', hair: 'hair-3', hairStyle: 'side', suit: 'gold', tie: 'ink' },
    { skin: 'skin-1', hair: 'hair-1', hairStyle: 'short', suit: 'alert', tie: 'card' },
    { skin: 'skin-4', hair: 'hair-3', hairStyle: 'bald', suit: 'ink', tie: 'alert' },
  ];

  // Each group's wedge: seat index range → mid-angle for its leader.
  const wedges = (() => {
    let i = 0;
    return groups.map((g) => {
      const start = i;
      i += g.seats;
      const mid = seats[Math.floor((start + i) / 2)]!.a;
      const p = arcPoint(mid, HEMI.r1 + 16);
      // anchor the leader outward from the arc so it never covers seats
      const tx = -50 + Math.cos(mid) * 50, ty = -50 - Math.sin(mid) * 50;
      return { start, end: i, left: (p.x / HEMI.w) * 100, top: (p.y / HEMI.h) * 100, shift: `translate(${tx}%, ${ty}%)` };
    });
  })();

  const whip = $derived(session.whip);
  const vote = $derived(session.vote);
  const seatFill = (idx: number) => {
    const gi = wedges.findIndex((w) => idx >= w.start && idx < w.end);
    const g = groups[gi]!;
    return { color: `var(--${g.color})`, yes: idx - wedges[gi]!.start < whip.byGroup[g.id] };
  };
</script>

<ScreenLayout {question}>
  {#snippet main()}
    <div class="card chamber">
      <div class="bill"><span class="label">This turn's bill</span><b>{session.draft.pack ?? 'Your budget'}</b></div>
      <div class="arc">
        <svg viewBox="0 0 {HEMI.w} {HEMI.h}" role="img" aria-label="House: {whip.total} of {HOUSE_SEATS} seats voting yes; {TO_PASS} needed.">
          {#each seats as s, i (i)}
            {@const f = seatFill(i)}
            <circle class="seat" cx={s.x} cy={s.y} r="6.3" fill={f.color} opacity={f.yes ? 1 : 0.22} />
          {/each}
          <line x1={HEMI.cx} y1="44" x2={HEMI.cx} y2={HEMI.cy - 76} stroke="var(--ink)" stroke-width="3" stroke-dasharray="7 6" />
          <text x={HEMI.cx} y={HEMI.cy - 30} text-anchor="middle" class="count">{whip.total} of {TO_PASS}</text>
          <text x={HEMI.cx} y={HEMI.cy - 6} text-anchor="middle" class="count-sub">votes yes</text>
        </svg>
        {#each groups as g, i (g.id)}
          {@const share = whip.byGroup[g.id] / g.seats}
          <div class="leader" style:left="{wedges[i]!.left}%" style:top="{wedges[i]!.top}%" style:transform={wedges[i]!.shift}>
            <svg width="46" height="72" viewBox="0 0 120 190" aria-hidden="true"><Character look={looks[i]!} delay={i * 0.7} /></svg>
            <span class="chip" style:background="var(--{g.color})" class:dark={g.color === 'ink' || g.color === 'alert'}>{g.name}</span>
            <span class="mood">
              {#if share > 0.6}<ThumbsUp size={18} role="img" aria-label="mostly yes" />{:else if share < 0.3}<ThumbsDown size={18} role="img" aria-label="mostly no" />{:else}<b role="img" aria-label="undecided">?</b>{/if}
            </span>
          </div>
        {/each}
        {#if vote?.passed}
          <div class="confetti" aria-hidden="true">{#each Array(14) as _, i (i)}<i style:left="{(i * 7.3) % 100}%" style:animation-delay="{-(i % 5) * 0.35}s" style:background="var(--{['gold', 'alert', 'sky', 'sage'][i % 4]})"></i>{/each}</div>
        {/if}
      </div>
      <div class="legend">
        {#each groups as g (g.id)}
          <span><i style:background="var(--{g.color})"></i><b>{whip.byGroup[g.id]}</b>/{g.seats} · wants {g.wants.toLowerCase()}</span>
        {/each}
      </div>
    </div>
  {/snippet}
  {#snippet learn()}
    <button class="link" disabled title="Coming soon">Senate: 60 votes, or 51 for budget bills</button>
    <button class="ticket" disabled title="Coming soon">Myth? The President writes the laws</button>
  {/snippet}
  {#snippet next()}
    <div class="card info" aria-live="polite">
      <span class="label">What it means</span>
      {#if session.over}
        <b>Your term is over</b><span class="line">Congress has gone home.</span>
      {:else if vote}
        <b class={vote.passed ? 'good' : 'bad'}>{vote.passed ? `Passed ${vote.total}–${HOUSE_SEATS - vote.total}!` : `Failed ${vote.total}–${HOUSE_SEATS - vote.total}`}</b>
        <span class="line">{vote.passed ? `Your budget becomes law. +${vote.cloutBack} clout for the win.` : `You get ${vote.cloutBack} clout back. Try a deal first next time.`}</span>
      {:else if whip.short > 0}
        <b class="bad">{whip.short} votes short</b><span class="line">Make a deal or two, then call the vote.</span>
      {:else}
        <b class="good">Enough votes!</b><span class="line">Call the vote while you have them.</span>
      {/if}
    </div>
    <span class="label">Fastest way to pass</span>
    {#each deals as d (d.id)}
      {@const done = session.draft.deals.includes(d.id)}
      <div class="card deal">
        <div><b>{d.title}</b><span>{d.detail}</span></div>
        <button class="btn" disabled={done || !session.canDeal(d.id)} onclick={() => session.makeDeal(d.id)}>{done ? 'Done' : `${d.cost} clout`}</button>
      </div>
    {/each}
    <div class="spacer"></div>
    {#if !vote}<button class="stamp" disabled={session.over} onclick={() => session.callVote()}>Call the vote</button>{/if}
  {/snippet}
</ScreenLayout>

<style>
  .chamber { position: relative; padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; flex-grow: 1; overflow: hidden; }
  .bill { display: flex; align-items: baseline; gap: 10px; }
  .bill b { font: 700 20px var(--font-display); }
  .arc { margin: 64px 96px 4px; position: relative; aspect-ratio: 640 / 340; align-self: center; width: calc(100% - 192px); max-width: 720px; }
  .arc > svg { width: 100%; height: 100%; display: block; }
  .seat { transition: opacity .5s ease; }
  .count { font: 700 40px var(--font-ui); fill: var(--ink); }
  .count-sub { font: 600 17px var(--font-ui); fill: var(--ink-soft); }
  .leader { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .chip { font: 600 14px var(--font-ui); color: var(--ink); border: 2px solid var(--ink); border-radius: 6px; padding: 2px 8px; white-space: nowrap; }
  .chip.dark { color: var(--card); }
  .mood { position: absolute; right: -14px; top: 6px; color: var(--ink); background: var(--card); border: 2px solid var(--ink); border-radius: 50%; width: 26px; height: 26px; display: grid; place-items: center; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 18px; justify-content: center; font: 500 15px var(--font-ui); color: var(--ink-soft); }
  .legend i { display: inline-block; width: 11px; height: 11px; border-radius: 50%; border: 1.5px solid var(--ink); margin-right: 5px; }
  .legend b { color: var(--ink); }
  .confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  .confetti i { position: absolute; top: -10px; width: 9px; height: 9px; border-radius: 2px; animation: fall 1.8s linear infinite; }
  @keyframes fall { to { transform: translateY(380px) rotate(240deg); opacity: 0; } }
  .info { display: flex; flex-direction: column; gap: 4px; padding: 16px; }
  .info b { font: 700 24px var(--font-display); }
  .line { font: 500 16px/1.3 var(--font-body); color: var(--ink-soft); }
  .good { color: var(--sage); }
  .bad { color: var(--alert); }
  .deal { display: flex; align-items: center; gap: 10px; padding: 12px 14px; }
  .deal div { display: flex; flex-direction: column; flex: 1; }
  .deal b { font: 700 17px/1.15 var(--font-display); }
  .deal span { font-size: 13px; color: var(--ink-soft); }
  .deal .btn { white-space: nowrap; }
  .btn:disabled { opacity: .45; cursor: not-allowed; }
  .spacer { flex-grow: 1; }
  .stamp { align-self: center; }
</style>
