<script lang="ts">
  // Reusable circular medallion bust component matching .design-targets/D.png (President Expressions)
  // and .design-targets/g-newgame.png (Look Swatches).
  // Frames a finger/thumb-shaped <Character> bust against a rich navy medallion backdrop.
  // Strictly uses design tokens via CSS variables (--*).
  import Character, {
    type CharacterProp,
    type Look,
    type Mood,
    type Pose,
  } from './Character.svelte';

  let {
    look,
    mood = undefined,
    pose = undefined,
    prop = null,
    size = 56,
    label = 'Character portrait',
    badgeText = undefined,
    ringColor = 'gold',
    testId = 'character-portrait',
  }: {
    look: Look;
    mood?: Mood;
    pose?: Pose;
    prop?: CharacterProp;
    size?: number;
    label?: string;
    badgeText?: string;
    ringColor?: 'ink' | 'gold' | 'sage' | 'alert' | 'sky';
    testId?: string;
  } = $props();

  const effectiveMood = $derived<Mood>(mood ?? look.mood ?? 'confident');
  const effectivePose = $derived<Pose>(
    pose ??
      (effectiveMood === 'facepalm'
        ? 'facepalm'
        : effectiveMood === 'triumphant'
          ? 'celebrate'
          : 'stand'),
  );
  const clipId = $derived(
    `clip-medallion-${testId.replace(/[^a-zA-Z0-9_-]/g, '-')}-${look.skin}-${look.hairStyle}-${effectiveMood}`,
  );
  const effectiveRing = $derived.by(() => {
    if (effectiveMood === 'panicked' || effectiveMood === 'stressed' || effectiveMood === 'facepalm') {
      return `var(--${ringColor === 'gold' ? 'alert' : ringColor})`;
    }
    if (effectiveMood === 'triumphant') {
      return `var(--${ringColor === 'gold' ? 'sage' : ringColor})`;
    }
    return `var(--${ringColor})`;
  });
</script>

<svg
  viewBox="0 0 80 80"
  width={size}
  height={size}
  role="img"
  aria-label={label}
  data-testid={testId}
  data-mood={effectiveMood}
  data-pose={effectivePose}
  preserveAspectRatio="xMidYMid meet"
>
  <defs>
    <clipPath id={clipId}>
      <circle cx="40" cy="40" r="35" />
    </clipPath>
  </defs>

  <!-- Outer Medallion Ring (matching D.png President Expressions & g-newgame.png) -->
  <circle cx="40" cy="40" r="38" fill="var(--card)" stroke={effectiveRing} stroke-width="2.5" />
  <circle cx="40" cy="40" r="35" fill="var(--art-carpet)" />

  <g clip-path="url(#{clipId})">
    <!-- Rich Navy Medallion Backdrop (D.png bottom row) -->
    <rect x="0" y="0" width="80" height="80" fill="var(--art-carpet)" />

    <!-- Mood-reactive backdrop accents -->
    {#if effectiveMood === 'triumphant'}
      <g data-testid="portrait-confetti">
        <rect x="12" y="14" width="5" height="2.6" rx="0.8" fill="var(--sky)" transform="rotate(-24 12 14)" />
        <rect x="62" y="14" width="5" height="2.6" rx="0.8" fill="var(--alert)" transform="rotate(24 62 14)" />
        <rect x="14" y="30" width="4.5" height="2.4" rx="0.8" fill="var(--gold)" transform="rotate(14 14 30)" />
        <rect x="62" y="30" width="4.5" height="2.4" rx="0.8" fill="var(--sage)" transform="rotate(-18 62 30)" />
      </g>
    {:else if effectiveMood === 'panicked' || effectiveMood === 'stressed' || effectiveMood === 'facepalm'}
      <circle cx="40" cy="40" r="35" fill="var(--ink)" opacity=".35" />
    {:else if effectiveMood === 'scheming'}
      <rect x="0" y="0" width="80" height="80" fill="var(--alert-dark)" opacity=".55" />
    {/if}

    <!-- Framed Finger/Thumb-Pawn Character Bust (scaled to fill the medallion like D.png) -->
    <Character
      {look}
      mood={effectiveMood}
      pose={effectivePose}
      {prop}
      x={2.2}
      y={9}
      scale={0.63}
    />
  </g>

  <!-- Optional bottom ribbon badge -->
  {#if badgeText}
    <g data-testid="{testId}-badge" transform="translate(40, 71)">
      <rect x="-28" y="-6.5" width="56" height="11.5" rx="3" fill="var(--ink)" stroke="var(--gold)" stroke-width="1.2" />
      <text
        x="0"
        y="1.5"
        font-family="var(--font-ui)"
        font-size="6.8"
        font-weight="800"
        fill="var(--card)"
        text-anchor="middle"
        letter-spacing="0.3"
      >
        {badgeText}
      </text>
    </g>
  {/if}
</svg>

<style>
  svg {
    display: inline-block;
    flex-shrink: 0;
  }
</style>
