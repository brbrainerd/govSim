<script lang="ts">
  import { ThumbsDown, ThumbsUp } from '@lucide/svelte';
  import type { Session } from '../app/session.svelte';
  import { deals, groups, HOUSE_SEATS, TO_PASS } from '../engine/congress';
  import Character, { type Look } from '../ui/art/Character.svelte';
  import { arcPoint, HEMI, hemicycle } from '../ui/art/hemicycle';
  import ScreenLayout from '../ui/ScreenLayout.svelte';
  import { getImminentDeadlines } from '../engine/deadlines';

  let { session, question }: { session: Session; question: string } = $props();

  const deadlines = $derived(getImminentDeadlines(session.current.turn, session.current));

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
    {#if deadlines.length > 0}
      <div class="deadline-banner" role="alert" aria-label="Impending legislative deadlines">
        {#each deadlines as d (d.type)}
          <div class="deadline-item" class:critical={d.critical}>
            <div class="deadline-header">
              <span class="deadline-pill" class:critical={d.critical}>
                {d.critical ? 'CRITICAL DEADLINE' : 'DEADLINE COUNTDOWN'}
              </span>
              <span class="deadline-title">
                {d.title}: <b>{d.turnsRemaining} {d.turnsRemaining === 1 ? 'turn' : 'turns'} remaining</b>
              </span>
            </div>
            <span class="deadline-desc">{d.description}</span>
          </div>
        {/each}
      </div>
    {/if}
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
    {#if deadlines.length > 0}
      <div class="card deadline-action-card">
        <span class="label">Impending Deadline</span>
        {#each deadlines as d (d.type)}
          <b>{d.title}</b>
          <span class="line">{d.actionText}</span>
        {/each}
      </div>
    {/if}
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
  .chamber { position: relative; padding: clamp(8px, 1.2vh, 14px) clamp(10px, 1.2vw, 16px); display: flex; flex-direction: column; gap: clamp(4px, 0.6vh, 8px); flex-grow: 1; min-height: 0; overflow: hidden; }
  .deadline-banner { display: flex; flex-direction: column; gap: 4px; padding: 6px 12px; background: var(--alert-tint); border: 2px solid var(--alert); border-radius: var(--r-md); margin-bottom: 2px; }
  .deadline-item { display: flex; flex-direction: column; gap: 2px; }
  .deadline-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .deadline-pill { font-family: var(--font-condensed); font-size: var(--text-xs); font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; padding: 1px 6px; background: var(--ink); color: var(--card); border-radius: var(--r-sm); }
  .deadline-pill.critical { background: var(--alert); }
  .deadline-title { font-family: var(--font-ui); font-size: var(--text-xs); color: var(--ink); }
  .deadline-desc { font-family: var(--font-body); font-size: var(--text-xs); color: var(--ink-soft); }
  .deadline-action-card { display: flex; flex-direction: column; gap: 4px; padding: 8px 12px; border-left: 4px solid var(--alert); background: var(--paper-dark); }
  .deadline-action-card b { font-family: var(--font-display); font-size: var(--text-sm); color: var(--alert); }
  .bill { display: flex; align-items: baseline; gap: 10px; }
  .bill b { font: 700 clamp(16px, 1.3vw, 20px) var(--font-display); }
  .arc { margin: clamp(24px, 4vh, 36px) auto clamp(2px, 0.5vh, 6px); position: relative; aspect-ratio: 640 / 340; align-self: center; width: min(100%, 640px); max-height: clamp(150px, 28vh, 280px); }
  .arc > svg { width: 100%; height: 100%; display: block; }
  .seat { transition: opacity .5s ease; }
  .count { font: 700 clamp(28px, 3vw, 40px) var(--font-ui); fill: var(--ink); }
  .count-sub { font: 600 clamp(13px, 1.1vw, 17px) var(--font-ui); fill: var(--ink-soft); }
  .leader { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .chip { font: 600 clamp(11px, 0.9vw, 14px) var(--font-ui); color: var(--ink); border: 2px solid var(--ink); border-radius: 6px; padding: 1px 6px; white-space: nowrap; }
  .chip.dark { color: var(--card); }
  .mood { position: absolute; right: -12px; top: 4px; color: var(--ink); background: var(--card); border: 2px solid var(--ink); border-radius: 50%; width: 22px; height: 22px; display: grid; place-items: center; }
  .legend { display: flex; flex-wrap: wrap; gap: clamp(3px, 0.5vh, 6px) clamp(8px, 1vw, 18px); justify-content: center; font: 500 clamp(12px, 0.9vw, 15px) var(--font-ui); color: var(--ink-soft); max-width: 70ch; }
  .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid var(--ink); margin-right: 4px; }
  .legend b { color: var(--ink); }
  .confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  .confetti i { position: absolute; top: -10px; width: 9px; height: 9px; border-radius: 2px; animation: fall 1.8s linear infinite; }
  @keyframes fall { to { transform: translateY(380px) rotate(240deg); opacity: 0; } }
  .info { display: flex; flex-direction: column; gap: clamp(2px, 0.4vh, 4px); padding: clamp(8px, 1.2vh, 14px); }
  .info b { font: 700 clamp(18px, 1.5vw, 24px) var(--font-display); }
  .line { font: 500 clamp(13px, 1vw, 16px)/1.3 var(--font-body); color: var(--ink-soft); max-width: 45ch; }
  .good { color: var(--sage); }
  .bad { color: var(--alert); }
  .deal { display: flex; align-items: center; gap: clamp(6px, 0.8vw, 10px); padding: clamp(6px, 1vh, 10px) clamp(8px, 1vw, 12px); }
  .deal div { display: flex; flex-direction: column; flex: 1; max-width: 30ch; }
  .deal b { font: 700 clamp(14px, 1.1vw, 17px)/1.15 var(--font-display); }
  .deal span { font-size: clamp(11px, 0.85vw, 13px); color: var(--ink-soft); }
  .deal .btn { white-space: nowrap; }
  .btn:disabled { opacity: .45; cursor: not-allowed; }
  .spacer { flex-grow: 1; min-height: 4px; }
  .stamp { align-self: center; flex-shrink: 0; }
</style>
