<script lang="ts">
  // Circular portrait of the Federal Reserve Chair (PWR-03, OBS-07).
  // Americana pill-person character framed in an engraved circular coin/medallion border.
  // All colors strictly from tokens via CSS variables.

  let {
    size = 64,
  }: {
    size?: number;
  } = $props();
</script>

<svg
  viewBox="0 0 72 72"
  width={size}
  height={size}
  role="img"
  aria-label="Portrait of Federal Reserve Chair"
  preserveAspectRatio="xMidYMid meet"
>
  <!-- Outer circular frame border -->
  <circle cx="36" cy="36" r="34" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5" />
  <circle cx="36" cy="36" r="31" fill="var(--paper)" stroke="var(--gold)" stroke-width="1.5" />

  <!-- Clip path to keep torso within circle -->
  <defs>
    <clipPath id="clip-chair-fed">
      <circle cx="36" cy="36" r="30" />
    </clipPath>
  </defs>

  <g clip-path="url(#clip-chair-fed)">
    <!-- Suit / Shoulders -->
    <path d="M12,74 Q14,46 36,46 Q58,46 60,74 Z" fill="var(--ink)" />
    <!-- White shirt V -->
    <polygon points="30,46 42,46 36,60" fill="var(--art-shirt)" />
    <!-- Navy tie -->
    <polygon points="34,48 38,48 39,66 36,70 33,66" fill="var(--sky)" />

    <!-- Head -->
    <rect x="24" y="16" width="24" height="30" rx="12" fill="var(--skin-2)" />

    <!-- Silver/grey combed hair -->
    <path d="M24,26 Q23,13 36,13 Q49,13 48,26 Q43,18 36,18 Q28,18 24,26 Z" fill="var(--hair-2)" />

    <!-- Eyes -->
    <circle cx="31" cy="28" r="1.6" fill="var(--ink)" />
    <circle cx="41" cy="28" r="1.6" fill="var(--ink)" />

    <!-- Distinguished Wire Glasses -->
    <circle cx="31" cy="28" r="4.2" fill="none" stroke="var(--ink)" stroke-width="1" />
    <circle cx="41" cy="28" r="4.2" fill="none" stroke="var(--ink)" stroke-width="1" />
    <line x1="35.2" y1="28" x2="36.8" y2="28" stroke="var(--ink)" stroke-width="1" />

    <!-- Neutral/focused expression -->
    <path d="M33,38 Q36,40 39,38" fill="none" stroke="var(--ink)" stroke-width="1.2" stroke-linecap="round" />
  </g>
</svg>

<style>
  svg {
    display: inline-block;
    flex-shrink: 0;
  }
</style>
