<script lang="ts" module>
  export type HairStyle = 'short' | 'side' | 'bald' | 'bun';
  export interface Look {
    skin: string; // token name, e.g. 'skin-2'
    hair: string;
    hairStyle: HairStyle;
    suit: string;
    tie?: string;
    pants?: string;
    shirtOnly?: boolean; // rolled sleeves, no jacket
    glasses?: boolean;
  }
</script>

<script lang="ts">
  // Pill-person rig (design.md A3): flat parts in a 120×240 box, idle loops in CSS.
  let {
    look,
    pose = 'stand',
    prop = null,
    talking = false,
    x = 0,
    y = 0,
    scale = 1,
    delay = 0,
  }: {
    look: Look;
    pose?: 'stand' | 'point';
    prop?: 'clipboard' | null;
    talking?: boolean;
    x?: number;
    y?: number;
    scale?: number;
    delay?: number;
  } = $props();

  const v = (t: string | undefined, fallback: string) => `var(--${t ?? fallback})`;
  const suit = $derived(v(look.suit, 'ink'));
  const skin = $derived(v(look.skin, 'skin-2'));
  const hair = $derived(v(look.hair, 'hair-1'));
</script>

<g transform="translate({x} {y}) scale({scale})">
  <g class="breathe" style="animation-delay:{-delay}s">
    <!-- legs + shoes -->
    <rect x="40" y="176" width="17" height="50" rx="6" fill={v(look.pants, look.suit)} />
    <rect x="63" y="176" width="17" height="50" rx="6" fill={v(look.pants, look.suit)} />
    <rect x="34" y="220" width="26" height="12" rx="6" fill="var(--hair-3)" />
    <rect x="60" y="220" width="26" height="12" rx="6" fill="var(--hair-3)" />
    <!-- arms behind body -->
    {#if pose === 'stand'}
      <rect x="14" y="100" width="18" height="70" rx="9" fill={look.shirtOnly ? 'var(--art-shirt)' : suit} />
      <circle cx="23" cy="172" r="8.5" fill={skin} />
    {/if}
    {#if prop !== 'clipboard'}
      <rect x="88" y="100" width="18" height="70" rx="9" fill={look.shirtOnly ? 'var(--art-shirt)' : suit} />
      <circle cx="97" cy="172" r="8.5" fill={skin} />
    {/if}
    <!-- torso -->
    <rect x="26" y="92" width="68" height="94" rx="26" fill={look.shirtOnly ? 'var(--art-shirt)' : suit} />
    {#if look.shirtOnly}
      <rect x="26" y="150" width="68" height="36" rx="10" fill={v(look.pants, 'art-wood-dark')} />
      <path d="M50 94 L60 108 L70 94" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
    {:else}
      <path d="M47 94 L60 132 L73 94 Z" fill="var(--art-shirt)" />
      <path d="M47 94 L58 128 L40 106 Z" fill="var(--ink)" opacity=".25" />
      <path d="M73 94 L62 128 L80 106 Z" fill="var(--ink)" opacity=".25" />
    {/if}
    {#if look.tie}
      <path d="M57 98 L63 98 L66 122 L60 130 L54 122 Z" fill={v(look.tie, 'alert')} />
    {/if}
    {#if prop === 'clipboard'}
      <rect x="86" y="100" width="18" height="44" rx="9" fill={look.shirtOnly ? 'var(--art-shirt)' : suit} />
      <g transform="rotate(8 92 144)">
        <rect x="72" y="118" width="40" height="52" rx="4" fill="var(--art-wood-light)" stroke="var(--ink)" stroke-width="2" />
        <rect x="77" y="126" width="30" height="38" rx="2" fill="var(--card)" />
        <path d="M81 136 h22 M81 144 h22 M81 152 h14" stroke="var(--ink-soft)" stroke-width="2" />
        <rect x="85" y="114" width="14" height="8" rx="2" fill="var(--ink-soft)" />
      </g>
      <circle cx="108" cy="150" r="8" fill={skin} />
    {/if}
    {#if pose === 'point'}
      <g class="point">
        <rect x="14" y="98" width="18" height="56" rx="9" fill={look.shirtOnly ? 'var(--art-shirt)' : suit} transform="rotate(130 23 104)" />
        <circle cx="-17" cy="71" r="8.5" fill={skin} />
        <rect x="-30" y="62" width="12" height="5" rx="2.5" fill={skin} transform="rotate(-30 -24 64)" />
      </g>
    {/if}
    <!-- head -->
    <g class="head">
      <rect x="30" y="10" width="60" height="88" rx="30" fill={skin} />
      {#if look.hairStyle === 'short'}
        <path d="M30 46 Q28 8 60 8 Q92 8 90 46 Q86 28 60 26 Q34 28 30 46 Z" fill={hair} />
      {:else if look.hairStyle === 'side'}
        <path d="M30 50 Q26 6 62 8 Q94 10 90 44 Q80 22 52 30 Q38 34 30 50 Z" fill={hair} />
      {:else if look.hairStyle === 'bun'}
        <circle cx="60" cy="8" r="13" fill={hair} />
        <path d="M28 60 Q24 8 60 10 Q96 8 92 60 Q90 30 60 26 Q30 30 28 60 Z" fill={hair} />
      {/if}
      <g class="blink" style="animation-delay:{-delay * 1.7}s">
        <circle cx="48" cy="56" r="4.2" fill="var(--ink)" />
        <circle cx="72" cy="56" r="4.2" fill="var(--ink)" />
      </g>
      {#if look.glasses}
        <g fill="none" stroke="var(--ink)" stroke-width="2.5"><circle cx="48" cy="56" r="9" /><circle cx="72" cy="56" r="9" /><path d="M57 56 h6" /></g>
      {/if}
      {#if talking}
        <ellipse class="talk" cx="60" cy="74" rx="6" ry="5" fill="var(--alert-dark)" />
      {:else}
        <path d="M50 72 Q60 80 70 72" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" />
      {/if}
    </g>
  </g>
</g>

<style>
  .breathe { transform-box: fill-box; transform-origin: center bottom; animation: breathe 3.4s ease-in-out infinite; }
  .blink { transform-box: fill-box; transform-origin: center; animation: blink 4.6s infinite; }
  .talk { transform-box: fill-box; transform-origin: center top; animation: talk .26s ease-in-out infinite alternate; }
  .point { transform-box: fill-box; transform-origin: 85% 70%; animation: point 2.6s ease-in-out infinite; }
  @keyframes breathe { 50% { transform: scaleY(1.018); } }
  @keyframes blink { 0%, 93%, 100% { transform: scaleY(1); } 96% { transform: scaleY(.1); } }
  @keyframes talk { to { transform: scaleY(.35); } }
  @keyframes point { 50% { transform: rotate(-6deg); } }
</style>
