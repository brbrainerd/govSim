<script lang="ts">
  import { ThumbsDown, ThumbsUp } from '@lucide/svelte';
  import { arcPoint, HEMI, hemicycle } from './art/hemicycle';
  import Character, { type Look, type Mood, type Pose } from './art/Character.svelte';
  import { groups, HOUSE_SEATS, TO_PASS, tally, type GroupId } from '../engine/congress';
  import type { SocialDraft } from '../engine/social';

  let {
    whip,
    deals = [],
    houseSeatDelta = 0,
    socialDraft,
    passed = false,
  }: {
    whip: { byGroup: Record<GroupId, number>; total: number; short: number };
    deals?: readonly string[];
    houseSeatDelta?: number;
    socialDraft?: SocialDraft;
    passed?: boolean;
  } = $props();

  const seats = hemicycle(HOUSE_SEATS);
  const looks: Look[] = [
    { skin: 'skin-2', hair: 'hair-1', hairStyle: 'bun', suit: 'sky' },
    { skin: 'skin-1', hair: 'hair-2', hairStyle: 'short', suit: 'sage', tie: 'card' },
    { skin: 'skin-3', hair: 'hair-3', hairStyle: 'side', suit: 'gold', tie: 'ink' },
    { skin: 'skin-1', hair: 'hair-1', hairStyle: 'short', suit: 'alert', tie: 'card' },
    { skin: 'skin-4', hair: 'hair-3', hairStyle: 'bald', suit: 'ink', tie: 'alert' },
  ];

  // Each group's wedge: seat index range -> mid-angle for its leader.
  const wedges = (() => {
    let i = 0;
    return groups.map((g) => {
      const start = i;
      i += g.seats;
      const mid = seats[Math.floor((start + i) / 2)]!.a;
      const isTopApex = Math.sin(mid) > 0.85;
      const p = arcPoint(mid, HEMI.r1 + (isTopApex ? 8 : 14));
      const tx = -50 + Math.cos(mid) * 46;
      const ty = isTopApex ? -68 : -50 - Math.sin(mid) * 42;
      return { start, end: i, left: (p.x / HEMI.w) * 100, top: (p.y / HEMI.h) * 100, shift: `translate(${tx}%, ${ty}%)` };
    });
  })();

  const baseWhip = $derived(tally([], houseSeatDelta, socialDraft));

  const seatFill = (idx: number) => {
    const gi = wedges.findIndex((w) => idx >= w.start && idx < w.end);
    const g = groups[gi]!;
    const offset = idx - wedges[gi]!.start;
    const yes = offset < whip.byGroup[g.id];
    const isBaseYes = offset < (baseWhip.byGroup[g.id] ?? 0);
    const isDeal = yes && !isBaseYes;
    return { color: `var(--${g.color})`, yes, isDeal };
  };
</script>

<div class="arc">
  <svg viewBox="0 0 {HEMI.w} {HEMI.h}" role="img" aria-label="House: {whip.total} of {HOUSE_SEATS} seats voting yes; {TO_PASS} needed.">
    {#each seats as s, i (i)}
      {@const f = seatFill(i)}
      <circle
        class="seat"
        class:seat-deal={f.isDeal}
        cx={s.x}
        cy={s.y}
        r="6.3"
        fill={f.color}
        opacity={f.yes ? 1 : 0.22}
      />
    {/each}
    <line x1={HEMI.cx} y1="44" x2={HEMI.cx} y2={HEMI.cy - 76} stroke="var(--ink)" stroke-width="3" stroke-dasharray="7 6" />
    <text x={HEMI.cx} y={HEMI.cy - 30} text-anchor="middle" class="count">{whip.total} of {TO_PASS}</text>
    <text x={HEMI.cx} y={HEMI.cy - 6} text-anchor="middle" class="count-sub">votes yes</text>
  </svg>
  {#each groups as g, i (g.id)}
    {@const share = whip.byGroup[g.id] / g.seats}
    {@const dealFlipped = whip.byGroup[g.id] > (baseWhip.byGroup[g.id] ?? 0)}
    {@const leaderPose: Pose = passed ? 'celebrate' : share > 0.6 ? 'wave' : share < 0.3 ? 'crossed' : 'hips'}
    {@const leaderMood: Mood = passed ? 'triumphant' : share > 0.6 ? 'confident' : share < 0.3 ? 'stressed' : 'confident'}
    <div
      class="leader"
      class:deal-flipped={dealFlipped}
      data-testid={`bloc-leader-${g.id}`}
      data-whip-state={share > 0.6 ? 'yes' : share < 0.3 ? 'no' : 'undecided'}
      style:left="{wedges[i]!.left}%"
      style:top="{wedges[i]!.top}%"
      style:transform={wedges[i]!.shift}
    >
      <svg width="44" height="68" viewBox="0 0 120 190" aria-hidden="true">
        <Character look={{ ...looks[i]!, mood: leaderMood }} pose={leaderPose} mood={leaderMood} delay={i * 0.7} />
      </svg>
      <span class="chip" style:background="var(--{g.color})" class:dark={g.color === 'ink' || g.color === 'alert'}>{g.name}</span>
      <span class="mood">
        {#if share > 0.6}<ThumbsUp size={18} role="img" aria-label="mostly yes" />{:else if share < 0.3}<ThumbsDown size={18} role="img" aria-label="mostly no" />{:else}<b role="img" aria-label="undecided">?</b>{/if}
      </span>
    </div>
  {/each}
  {#if passed}
    <div class="confetti" aria-hidden="true">
      {#each Array(14) as _, i (i)}
        <i
          style:left="{(i * 7.3) % 100}%"
          style:animation-delay="{-(i % 5) * 0.35}s"
          style:background="var(--{['gold', 'alert', 'sky', 'sage'][i % 4]})"
        ></i>
      {/each}
    </div>
  {/if}
</div>

<style>
  .arc {
    margin: clamp(32px, 5vh, 46px) auto clamp(2px, 0.5vh, 6px);
    position: relative;
    aspect-ratio: 640 / 340;
    align-self: center;
    width: min(100%, 640px);
    max-height: clamp(146px, 27vh, 270px);
  }
  .arc > svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  .seat {
    transition: opacity var(--dur) ease;
  }
  .seat-deal {
    transform-box: fill-box;
    transform-origin: center;
    animation: seatFlipPulse var(--dur-fast) var(--ease-pop);
  }
  @keyframes seatFlipPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.6); }
    100% { transform: scale(1); }
  }
  .count {
    font: 700 clamp(28px, 3vw, 40px) var(--font-ui);
    fill: var(--ink);
  }
  .count-sub {
    font: 600 clamp(13px, 1.1vw, 17px) var(--font-ui);
    fill: var(--ink-soft);
  }
  .leader {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .leader.deal-flipped > svg {
    animation: leaderDealBounce var(--dur) var(--ease-pop);
  }
  @keyframes leaderDealBounce {
    0% { transform: translateY(0) scale(1); }
    45% { transform: translateY(-6px) scale(1.1); }
    100% { transform: translateY(0) scale(1); }
  }
  .chip {
    font: 600 clamp(11px, 0.9vw, 14px) var(--font-ui);
    color: var(--ink);
    border: 2px solid var(--ink);
    border-radius: 6px;
    padding: 1px 6px;
    white-space: nowrap;
  }
  .chip.dark {
    color: var(--card);
  }
  .mood {
    position: absolute;
    right: -12px;
    top: 4px;
    color: var(--ink);
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: 50%;
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
  }
  .confetti {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .confetti i {
    position: absolute;
    top: -10px;
    width: 9px;
    height: 9px;
    border-radius: 2px;
    animation: fall 1.8s linear infinite;
  }
  @keyframes fall {
    to {
      transform: translateY(380px) rotate(240deg);
      opacity: 0;
    }
  }
</style>
