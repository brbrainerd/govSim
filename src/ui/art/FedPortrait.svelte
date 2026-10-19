<script lang="ts">
  // Circular portrait of the Federal Reserve Chair matching .design-targets/D.png (#3) & g-powers.png.
  // Continuous finger/thumb-shaped head, big round wire-frame spectacles, dot eyes, grey cardigan over white V-collar shirt,
  // framed in a royal-navy medallion with subtle stance yield curve. Flat vector character anatomy (no cartoon outlines).
  // All colors strictly from tokens via CSS variables.

  let {
    size = 64,
    stance = 'centrist',
  }: {
    size?: number;
    stance?: 'hawk' | 'centrist' | 'dove';
  } = $props();
</script>

<svg
  viewBox="0 0 76 76"
  width={size}
  height={size}
  role="img"
  aria-label="Portrait of Federal Reserve Chair ({stance})"
  data-testid="fed-portrait"
  data-stance={stance}
  preserveAspectRatio="xMidYMid meet"
>
  <defs>
    <clipPath id="clip-chair-fed">
      <circle cx="38" cy="38" r="34" />
    </clipPath>
  </defs>

  <!-- Outer medallion ring (matching g-powers.png) -->
  <circle cx="38" cy="38" r="36" fill="var(--card)" stroke="var(--ink)" stroke-width="2.2" />
  <circle cx="38" cy="38" r="34" fill="var(--art-carpet)" stroke="var(--gold)" stroke-width="1.4" />

  <g clip-path="url(#clip-chair-fed)">
    <!-- Royal-navy backdrop matching g-powers.png -->
    <rect x="0" y="0" width="76" height="76" fill="var(--art-carpet)" />

    <!-- Subtle yield-curve line in upper backdrop -->
    {#if stance === 'hawk'}
      <path d="M8 22 Q38 12 68 28" fill="none" stroke="var(--alert)" stroke-width="1.5" opacity=".55" />
    {:else if stance === 'dove'}
      <path d="M8 30 Q38 24 68 14" fill="none" stroke="var(--sage)" stroke-width="1.5" opacity=".55" />
    {:else}
      <path d="M8 26 Q38 20 68 18" fill="none" stroke="var(--gold)" stroke-width="1.5" opacity=".55" />
    {/if}

    <!-- Continuous 40px-wide Grey Cardigan Torso (D.png #3 & g-powers.png) -->
    <path d="M18 52 L58 52 L60 78 L16 78 Z" fill="var(--art-cardigan)" />
    <!-- White V-collar shirt -->
    <polygon points="27,52 49,52 38,70" fill="var(--art-shirt)" />
    <path d="M30 52 L35 61 L38 56 L41 61 L46 52" fill="none" stroke="var(--hair-2)" stroke-width="1.2" />
    <path d="M27 52 L38 71 L49 52" fill="none" stroke="var(--art-charcoal)" stroke-width="1.4" opacity=".45" />

    <!-- Seamless Collar-to-Thumb-Head Contour Seam (no stick neck!) -->
    <path d="M18 51 Q38 57 58 51 L58 53.5 Q38 59.5 18 53.5 Z" fill="var(--hair-3)" opacity=".16" />

    <!-- Continuous 40px-wide Finger/Thumb Head Dome (exact match to D.png #3 & g-powers.png!) -->
    <path
      d="M18 33 A20 20 0 0 1 58 33 L58 52 Q38 57 18 52 Z"
      fill="var(--skin-1)"
    />
    <!-- Subtle right-side cylindrical shading -->
    <path
      d="M48 16 A20 20 0 0 1 58 33 L58 52 Q53 54 48 55 Z"
      fill="var(--hair-3)"
      opacity=".07"
    />

    <!-- Stance-reactive eyebrows -->
    {#if stance === 'hawk'}
      <line x1="26" y1="27" x2="33" y2="29.5" stroke="var(--hair-3)" stroke-width="1.8" stroke-linecap="round" />
      <line x1="50" y1="27" x2="43" y2="29.5" stroke="var(--hair-3)" stroke-width="1.8" stroke-linecap="round" />
    {:else if stance === 'dove'}
      <path d="M26 28 Q29.5 25.5 33 28" fill="none" stroke="var(--hair-3)" stroke-width="1.6" stroke-linecap="round" />
      <path d="M43 28 Q46.5 25.5 50 28" fill="none" stroke="var(--hair-3)" stroke-width="1.6" stroke-linecap="round" />
    {/if}

    <!-- Solid Dark Dot Eyes (D.png #3) -->
    <circle cx="30" cy="34.5" r="2.5" fill="var(--hair-3)" />
    <circle cx="46" cy="34.5" r="2.5" fill="var(--hair-3)" />

    <!-- Big Round Wire-Frame Spectacles with curved bridge & side temple arms (exact match to D.png #3 & g-powers.png) -->
    <g fill="none" stroke="var(--hair-3)" stroke-width="1.8">
      <circle cx="30" cy="34.5" r="6.4" />
      <circle cx="46" cy="34.5" r="6.4" />
      <path d="M36.4 34.5 Q38 32.5 39.6 34.5" stroke-linecap="round" />
      <path d="M23.6 34 L15 34 Q13.5 34 13.5 36" stroke-linecap="round" />
      <path d="M52.4 34 L61 34 Q62.5 34 62.5 36" stroke-linecap="round" />
    </g>

    <!-- Stance-reactive mouth (D.png #3 & g-powers.png) -->
    {#if stance === 'hawk'}
      <path d="M32 45 L44 43.5" fill="none" stroke="var(--hair-3)" stroke-width="2" stroke-linecap="round" />
    {:else}
      <path d="M32 43.5 Q38 48 44 43.5" fill="none" stroke="var(--hair-3)" stroke-width="2" stroke-linecap="round" />
    {/if}
  </g>
</svg>

<style>
  svg {
    display: inline-block;
    flex-shrink: 0;
  }
</style>
