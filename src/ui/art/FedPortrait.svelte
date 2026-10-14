<script lang="ts">
  // Circular portrait of the Federal Reserve Chair (PWR-03, OBS-07, ART-03).
  // Americana pill-person character framed in an engraved classical medallion border with yield-curve grid.
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
      <circle cx="38" cy="38" r="32" />
    </clipPath>
  </defs>

  <!-- Outer circular frame border with coin reeding -->
  <circle cx="38" cy="38" r="36" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5" />
  <circle cx="38" cy="38" r="33" fill="var(--paper)" stroke="var(--gold)" stroke-width="1.5" />

  <!-- Inside circular medallion -->
  <g clip-path="url(#clip-chair-fed)">
    <!-- Background wall and yield curve grid -->
    <rect x="0" y="0" width="76" height="76" fill="var(--paper)" />
    <!-- Yield curve grid lines -->
    <line x1="8" y1="20" x2="68" y2="20" stroke="var(--ink-soft)" stroke-width="0.75" opacity=".25" stroke-dasharray="2 3" />
    <line x1="8" y1="32" x2="68" y2="32" stroke="var(--ink-soft)" stroke-width="0.75" opacity=".25" stroke-dasharray="2 3" />
    <line x1="8" y1="44" x2="68" y2="44" stroke="var(--ink-soft)" stroke-width="0.75" opacity=".25" stroke-dasharray="2 3" />
    <!-- Dynamic yield-curve line in background -->
    {#if stance === 'hawk'}
      <!-- Inverted / steep hawkish curve -->
      <path d="M12 28 Q38 18 64 36" fill="none" stroke="var(--alert)" stroke-width="1.5" opacity=".6" />
    {:else if stance === 'dove'}
      <!-- Stimulative downward curve -->
      <path d="M12 38 Q38 34 64 22" fill="none" stroke="var(--sage)" stroke-width="1.5" opacity=".6" />
    {:else}
      <!-- Balanced gentle curve -->
      <path d="M12 36 Q38 28 64 24" fill="none" stroke="var(--gold)" stroke-width="1.5" opacity=".6" />
    {/if}

    <!-- Classical Pediment Arch Header at top of medallion -->
    <rect x="18" y="6" width="40" height="4" fill="var(--card)" stroke="var(--ink)" stroke-width="0.8" />
    <text x="38" y="10" font-family="var(--font-ui)" font-size="3.8" font-weight="900" fill="var(--ink)" text-anchor="middle" letter-spacing="0.4">FEDERAL RESERVE</text>

    <!-- Suit / Shoulders with lapel notch -->
    <path d="M12 78 Q14 48 38 48 Q62 48 64 78 Z" fill="var(--ink)" stroke="var(--ink)" stroke-width="1.5" />
    <!-- White shirt V-neck -->
    <polygon points="32,48 44,48 38,62" fill="var(--art-shirt)" />
    <!-- Tie with gold pin -->
    <polygon points="36,50 40,50 41,68 38,72 35,68" fill="var(--sky)" stroke="var(--ink)" stroke-width="0.8" />
    <circle cx="38" cy="58" r="1.2" fill="var(--gold)" />

    <!-- Head pill -->
    <rect x="26" y="18" width="24" height="30" rx="12" fill="var(--skin-2)" stroke="var(--ink)" stroke-width="1.5" />

    <!-- Ears -->
    <circle cx="25" cy="33" r="2.5" fill="var(--skin-2)" stroke="var(--ink)" stroke-width="1" />
    <circle cx="51" cy="33" r="2.5" fill="var(--skin-2)" stroke="var(--ink)" stroke-width="1" />

    <!-- Silver/grey combed hair with executive part -->
    <path d="M26 28 Q25 14 38 14 Q51 14 50 28 Q45 20 38 20 Q30 20 26 28 Z" fill="var(--hair-2)" stroke="var(--ink)" stroke-width="1.2" />
    <path d="M30 16 Q38 18 46 16" fill="none" stroke="var(--card)" stroke-width="0.8" opacity=".4" />

    <!-- Stance-reactive eyebrows -->
    {#if stance === 'hawk'}
      <!-- Stern, angled hawkish eyebrows -->
      <line x1="30" y1="26" x2="35" y2="28" stroke="var(--ink)" stroke-width="1.3" stroke-linecap="round" />
      <line x1="41" y1="28" x2="46" y2="26" stroke="var(--ink)" stroke-width="1.3" stroke-linecap="round" />
    {:else if stance === 'dove'}
      <!-- Relaxed, arched dovish eyebrows -->
      <path d="M30 27 Q33 25 36 27" fill="none" stroke="var(--ink)" stroke-width="1.3" stroke-linecap="round" />
      <path d="M40 27 Q43 25 46 27" fill="none" stroke="var(--ink)" stroke-width="1.3" stroke-linecap="round" />
    {:else}
      <!-- Composed, balanced central banker brow -->
      <line x1="30" y1="26" x2="35" y2="26" stroke="var(--ink)" stroke-width="1.3" stroke-linecap="round" />
      <line x1="41" y1="26" x2="46" y2="26" stroke="var(--ink)" stroke-width="1.3" stroke-linecap="round" />
    {/if}

    <!-- Eyes with catchlight -->
    <circle cx="33" cy="30" r="1.7" fill="var(--ink)" />
    <circle cx="33.8" cy="29.2" r="0.6" fill="var(--card)" />
    <circle cx="43" cy="30" r="1.7" fill="var(--ink)" />
    <circle cx="43.8" cy="29.2" r="0.6" fill="var(--card)" />

    <!-- Nose contour -->
    <path d="M38 27 L39 33 L37 34" fill="none" stroke="var(--ink)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Horn-rimmed wire glasses -->
    <circle cx="33" cy="30" r="4.4" fill="none" stroke="var(--ink)" stroke-width="1.2" />
    <circle cx="43" cy="30" r="4.4" fill="none" stroke="var(--ink)" stroke-width="1.2" />
    <line x1="37.4" y1="30" x2="38.6" y2="30" stroke="var(--ink)" stroke-width="1.2" />

    <!-- Focused, measured mouth line -->
    <path d="M35 39 Q38 41 41 39" fill="none" stroke="var(--ink)" stroke-width="1.2" stroke-linecap="round" />
  </g>
</svg>

<style>
  svg {
    display: inline-block;
    flex-shrink: 0;
  }
</style>
