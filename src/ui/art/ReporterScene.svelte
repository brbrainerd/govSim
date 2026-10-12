<script lang="ts">
  import Character, { type Look } from './Character.svelte';

  let { category = 'hurricane' }: { category?: string } = $props();

  const reporter: Look = {
    skin: 'skin-2',
    hair: 'hair-1',
    hairStyle: 'side',
    suit: 'ink',
    tie: 'alert',
  };
</script>

<div class="reporter-scene">
  <svg
    viewBox="0 0 400 240"
    width="100%"
    height="100%"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    aria-label="Breaking news broadcast report"
  >
    <defs>
      <clipPath id="screen-clip">
        <rect width="400" height="240" rx="8" />
      </clipPath>
    </defs>

    <g clip-path="url(#screen-clip)">
      <!-- Studio backdrop -->
      <rect width="400" height="240" fill="var(--paper-dark)" />

      <!-- Map / Graphic display screen -->
      <rect x="20" y="18" width="360" height="170" rx="6" fill="var(--art-sky)" stroke="var(--ink)" stroke-width="2" />

      {#if category === 'hurricane' || category === 'wildfire' || category === 'flood'}
        <!-- Weather / Storm Map -->
        <!-- Stylized coastline -->
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
        <rect x="30" y="28" width="340" height="150" fill="var(--art-wall)" rx="4" />
        <line x1="50" y1="150" x2="350" y2="150" stroke="var(--ink-soft)" stroke-width="2" />
        <line x1="50" y1="50" x2="50" y2="150" stroke="var(--ink-soft)" stroke-width="2" />
        <path d="M 60 130 L 110 120 L 160 140 L 210 90 L 260 110 L 310 60 L 340 70" fill="none" stroke="var(--alert)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="340" cy="70" r="5" fill="var(--alert)" />
      {:else}
        <!-- General / Civic Standoff Screen -->
        <rect x="30" y="28" width="340" height="150" fill="var(--art-wall)" rx="4" />
        <!-- Capitol / Pillars motif -->
        <rect x="190" y="80" width="12" height="70" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
        <rect x="220" y="80" width="12" height="70" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
        <rect x="250" y="80" width="12" height="70" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
        <rect x="280" y="80" width="12" height="70" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
        <polygon points="175,80 241,50 307,80" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
      {/if}

      <!-- Studio Desk -->
      <path d="M 0 195 Q 200 180 400 195 L 400 240 L 0 240 Z" fill="var(--art-wood)" stroke="var(--ink)" stroke-width="3" />
      <path d="M 0 200 Q 200 185 400 200" stroke="var(--art-wood-dark)" stroke-width="2" fill="none" />

      <!-- News Reporter character -->
      <Character look={reporter} pose="stand" x={45} y={15} scale={0.78} />

      <!-- Microphone on desk -->
      <g transform="translate(195, 172)">
        <rect x="0" y="10" width="4" height="25" fill="var(--art-wood-dark)" />
        <circle cx="2" cy="35" r="10" fill="var(--art-wood-dark)" />
        <!-- Mic cube with "NEWS" -->
        <rect x="-8" y="-6" width="20" height="16" rx="2" fill="var(--alert)" stroke="var(--ink)" stroke-width="1.5" />
        <text x="2" y="6" font-family="var(--font-condensed)" font-size="8" font-weight="900" fill="var(--card)" text-anchor="middle">NEWS</text>
        <circle cx="2" cy="-11" r="5" fill="var(--ink)" />
      </g>

      <!-- LIVE broadcast badge -->
      <g transform="translate(320, 32)">
        <rect x="0" y="0" width="48" height="20" rx="3" fill="var(--alert)" stroke="var(--ink)" stroke-width="1.5" />
        <circle cx="8" cy="10" r="3" fill="var(--card)" />
        <text x="26" y="14" font-family="var(--font-condensed)" font-size="11" font-weight="900" fill="var(--card)" letter-spacing="1">LIVE</text>
      </g>

      <!-- Lower third chyron news ticker -->
      <rect x="0" y="212" width="400" height="28" fill="var(--ink)" />
      <rect x="0" y="210" width="400" height="2" fill="var(--gold)" />
      <rect x="12" y="216" width="60" height="18" rx="2" fill="var(--alert)" />
      <text x="42" y="229" font-family="var(--font-condensed)" font-size="11" font-weight="900" fill="var(--card)" text-anchor="middle">SPECIAL</text>
      <text x="82" y="230" font-family="var(--font-body)" font-size="11" font-weight="700" fill="var(--card)">NEWS BULLETIN &bull; WASHINGTON REPORT</text>
    </g>
  </svg>
</div>

<style>
  .reporter-scene {
    width: 100%;
    aspect-ratio: 16 / 9.6;
    max-height: 240px;
    background: var(--paper-dark);
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
