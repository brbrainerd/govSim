<script lang="ts">
  import Character, { type Look, type Mood } from './Character.svelte';

  let {
    category = 'hurricane',
    chyronText = 'NEWS BULLETIN • WASHINGTON REPORT',
    mood = 'panicked',
  }: {
    category?: string;
    chyronText?: string;
    mood?: Mood;
  } = $props();

  const reporter: Look = $derived({
    skin: 'skin-2',
    hair: 'hair-1',
    hairStyle: 'swept',
    suit: 'ink',
    tie: 'alert',
    mood,
  });
</script>

<div class="reporter-scene">
  <svg
    viewBox="0 0 400 240"
    width="100%"
    height="100%"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    aria-label="Breaking news broadcast report"
    data-testid="reporter-scene"
  >
    <defs>
      <clipPath id="screen-clip">
        <rect width="400" height="240" rx="8" />
      </clipPath>
    </defs>

    <g clip-path="url(#screen-clip)">
      <!-- Studio backdrop -->
      <rect width="400" height="240" fill="var(--paper)" />

      <!-- Map / Graphic display screen -->
      <rect x="20" y="16" width="360" height="172" rx="6" fill="var(--art-sky)" stroke="var(--ink)" stroke-width="2" />

      {#if category === 'hurricane' || category === 'wildfire' || category === 'flood'}
        <!-- Weather / Storm Map -->
        <path d="M 60 40 Q 120 70 140 120 T 110 188 L 20 188 L 20 40 Z" fill="var(--art-grass)" />
        <path d="M 140 120 Q 220 150 300 130 T 380 160 L 380 188 L 110 188 Z" fill="var(--art-grass)" opacity="0.8" />
        <!-- Storm spiral bands -->
        <g class="spin-slow" transform-origin="240 90">
          <ellipse cx="240" cy="90" rx="42" ry="24" fill="none" stroke="var(--alert)" stroke-width="4" stroke-dasharray="14 8" />
          <ellipse cx="240" cy="90" rx="26" ry="15" fill="none" stroke="var(--alert-dark)" stroke-width="3" stroke-dasharray="8 6" />
          <circle cx="240" cy="90" r="7" fill="var(--alert)" />
        </g>
      {:else if category === 'oil_shock' || category === 'debt_crisis' || category === 'market_panic'}
        <!-- Economic / Market Chart Screen -->
        <rect x="30" y="26" width="340" height="152" fill="var(--art-wall)" rx="4" />
        <line x1="50" y1="150" x2="350" y2="150" stroke="var(--ink-soft)" stroke-width="2" />
        <line x1="50" y1="50" x2="50" y2="150" stroke="var(--ink-soft)" stroke-width="2" />
        <path d="M 60 130 L 110 120 L 160 140 L 210 90 L 260 110 L 310 60 L 340 70" fill="none" stroke="var(--alert)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="340" cy="70" r="5" fill="var(--alert)" />
      {:else}
        <!-- General / Capitol Standoff Screen -->
        <rect x="30" y="26" width="340" height="152" fill="var(--art-wall)" rx="4" />
        <!-- Spotlight beams in background -->
        <polygon points="120,26 150,26 260,178 200,178" fill="var(--gold)" opacity=".12" />
        <polygon points="300,26 330,26 360,178 310,178" fill="var(--gold)" opacity=".12" />
        <!-- Capitol dome silhouette -->
        <path d="M210 160 h60 v-30 h-60 Z" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
        <path d="M225 130 h30 v-20 q-15 -14 -30 0 Z" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
        <line x1="240" y1="96" x2="240" y2="86" stroke="var(--ink)" stroke-width="2" />
      {/if}

      <!-- Broadcast Studio Lights Grid Overhead -->
      <line x1="20" y1="16" x2="380" y2="16" stroke="var(--ink)" stroke-width="3" />
      {#each [60, 140, 220, 300, 360] as lx (lx)}
        <rect x={lx} y="8" width="12" height="8" rx="2" fill="var(--ink)" />
        <path d="M{lx + 2} 16 L{lx - 6} 28 L{lx + 18} 28 Z" fill="var(--gold)" opacity=".3" />
      {/each}

      <!-- Studio Anchor Desk with Mahogany Grain -->
      <path d="M 0 192 Q 200 178 400 192 L 400 240 L 0 240 Z" fill="var(--art-wood)" stroke="var(--ink)" stroke-width="3" />
      <path d="M 0 198 Q 200 184 400 198" stroke="var(--art-wood-dark)" stroke-width="2" fill="none" />

      <!-- News Reporter character -->
      <Character look={reporter} pose="stand" prop="folder" x={45} y={15} scale={0.78} />

      <!-- Broadcast Studio Microphone Array on Desk -->
      <g transform="translate(185, 166)">
        <!-- Center mic with station cube -->
        <rect x="12" y="10" width="4" height="28" fill="var(--art-wood-dark)" />
        <circle cx="14" cy="38" r="10" fill="var(--art-wood-dark)" />
        <rect x="4" y="-6" width="20" height="16" rx="2" fill="var(--alert)" stroke="var(--ink)" stroke-width="1.5" />
        <text x="14" y="6" font-family="var(--font-ui)" font-size="8" font-weight="900" fill="var(--card)" text-anchor="middle">WDC</text>
        <circle cx="14" cy="-11" r="5" fill="var(--ink)" />

        <!-- Side mic 1: LIVE flag -->
        <rect x="-6" y="14" width="3" height="24" fill="var(--art-wood-dark)" />
        <rect x="-12" y="0" width="15" height="14" rx="2" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.2" />
        <text x="-4" y="10" font-family="var(--font-ui)" font-size="7" font-weight="900" fill="var(--ink)" text-anchor="middle">LIVE</text>
        <circle cx="-4" cy="-5" r="4" fill="var(--ink)" />

        <!-- Side mic 2: CAP flag -->
        <rect x="34" y="14" width="3" height="24" fill="var(--art-wood-dark)" />
        <rect x="28" y="0" width="15" height="14" rx="2" fill="var(--sky)" stroke="var(--ink)" stroke-width="1.2" />
        <text x="36" y="10" font-family="var(--font-ui)" font-size="7" font-weight="900" fill="var(--ink)" text-anchor="middle">CAP</text>
        <circle cx="36" cy="-5" r="4" fill="var(--ink)" />
      </g>

      <!-- LIVE Broadcast Status Badge -->
      <g transform="translate(320, 26)">
        <rect x="0" y="0" width="50" height="22" rx="3" fill="var(--alert)" stroke="var(--ink)" stroke-width="1.5" />
        <circle cx="8" cy="11" r="3.5" fill="var(--card)" />
        <text x="28" y="16" font-family="var(--font-ui)" font-size="12" font-weight="900" fill="var(--card)" letter-spacing="1">LIVE</text>
      </g>

      <!-- Studio Camera Silhouette on Lower Left -->
      <g transform="translate(-10, 160)" opacity=".85">
        <rect x="0" y="10" width="32" height="24" rx="3" fill="var(--ink)" stroke="var(--ink)" stroke-width="1.5" />
        <path d="M32 14 L46 6 L46 38 L32 30 Z" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="1.5" />
        <circle cx="16" cy="22" r="6" fill="var(--card)" opacity=".3" />
        <!-- Camera tally light -->
        <circle cx="10" cy="14" r="2.5" fill="var(--alert)" />
      </g>

      <!-- Lower Third Chyron News Ticker -->
      <rect x="0" y="210" width="400" height="30" fill="var(--ink)" />
      <rect x="0" y="208" width="400" height="2" fill="var(--gold)" />
      <rect x="10" y="214" width="62" height="20" rx="2" fill="var(--alert)" />
      <text x="41" y="228" font-family="var(--font-ui)" font-size="11" font-weight="900" fill="var(--card)" text-anchor="middle">SPECIAL</text>
      <text x="82" y="228" font-family="var(--font-body)" font-size="11" font-weight="700" fill="var(--card)">{chyronText}</text>
    </g>
  </svg>
</div>

<style>
  .reporter-scene {
    width: 100%;
    aspect-ratio: 16 / 9.6;
    max-height: 240px;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: var(--r-md);
    overflow: hidden;
    box-shadow: inset 0 0 0 1px var(--ink-soft);
  }

  .spin-slow {
    animation: rotate-slow 24s linear infinite;
  }

  @keyframes rotate-slow {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spin-slow {
      animation: none;
    }
  }
</style>
