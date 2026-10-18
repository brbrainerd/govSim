<script lang="ts">
  // Reusable circular medallion bust component (GFX-03).
  // Frames a <Character> bust inside a double-bordered Americana medallion with mood-reactive accents.
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
      <circle cx="40" cy="40" r="34" />
    </clipPath>
  </defs>

  <!-- Outer Engraved Medallion Ring -->
  <circle cx="40" cy="40" r="38" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5" />
  <circle cx="40" cy="40" r="35" fill="var(--paper)" stroke={effectiveRing} stroke-width="1.8" />

  <g clip-path="url(#{clipId})">
    <!-- Backdrop surface -->
    <rect x="0" y="0" width="80" height="80" fill="var(--paper)" />

    <!-- Mood-reactive backdrop accents -->
    {#if effectiveMood === 'triumphant'}
      <g data-testid="portrait-confetti">
        <circle cx="40" cy="40" r="30" fill="var(--sage-tint)" />
        <line x1="40" y1="6" x2="40" y2="14" stroke="var(--gold)" stroke-width="1.6" />
        <line x1="14" y1="18" x2="20" y2="23" stroke="var(--gold)" stroke-width="1.6" />
        <line x1="66" y1="18" x2="60" y2="23" stroke="var(--gold)" stroke-width="1.6" />
        <rect x="16" y="14" width="4" height="2.5" rx="0.8" fill="var(--alert)" transform="rotate(-18 16 14)" />
        <rect x="60" y="14" width="4" height="2.5" rx="0.8" fill="var(--sage)" transform="rotate(22 60 14)" />
        <rect x="20" y="30" width="3.5" height="2.5" rx="0.8" fill="var(--gold)" transform="rotate(12 20 30)" />
        <rect x="58" y="30" width="3.5" height="2.5" rx="0.8" fill="var(--sky)" transform="rotate(-16 58 30)" />
      </g>
    {:else if effectiveMood === 'panicked' || effectiveMood === 'stressed' || effectiveMood === 'facepalm'}
      <rect x="0" y="0" width="80" height="80" fill="var(--alert-tint)" />
      <line x1="8" y1="16" x2="24" y2="8" stroke="var(--alert)" stroke-width="1" opacity=".35" />
      <line x1="56" y1="8" x2="72" y2="16" stroke="var(--alert)" stroke-width="1" opacity=".35" />
    {:else if effectiveMood === 'scheming'}
      <path d="M6 6 Q40 24 74 6 L74 0 L6 0 Z" fill="var(--ink)" opacity=".16" />
    {:else}
      <circle cx="40" cy="42" r="26" fill="var(--card)" opacity=".65" />
    {/if}

    <!-- Framed Character Bust -->
    <Character
      {look}
      mood={effectiveMood}
      pose={effectivePose}
      {prop}
      x={6}
      y={8}
      scale={0.56}
    />
  </g>

  <!-- Optional bottom ribbon badge -->
  {#if badgeText}
    <g data-testid="{testId}-badge" transform="translate(40, 70)">
      <rect x="-28" y="-7" width="56" height="12" rx="3" fill="var(--ink)" stroke="var(--gold)" stroke-width="1.2" />
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
