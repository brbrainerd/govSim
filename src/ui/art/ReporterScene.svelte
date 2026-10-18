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

  // Exact News Anchor look from .design-targets/D.png (#4), g-crisis.png, and g-election.png
  const reporter: Look = $derived({
    skin: 'skin-2',
    hair: 'hair-1',
    hairStyle: 'bob',
    suit: 'art-plum',
    pants: 'art-plum-dark',
    outfit: 'blazer',
    pearls: true,
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
      <!-- Cream backdrop matching g-crisis.png -->
      <rect width="400" height="240" fill="var(--paper)" />

      {#if category === 'hurricane' || category === 'wildfire' || category === 'flood'}
        <!-- Gulf Coast Hurricane Map Infographic matching .design-targets/g-crisis.png -->
        <!-- Deep Navy Gulf Water -->
        <rect x="0" y="0" width="400" height="210" fill="var(--ink)" />
        <!-- Coastal States Landmass (Texas, Louisiana, Mississippi, Alabama, Florida panhandle) -->
        <path
          d="M 0 0 L 355 0 L 348 45 L 366 84 L 352 128 L 310 105 L 258 92 L 222 108 L 195 94 L 146 96 L 94 128 L 62 168 L 0 185 Z"
          fill="var(--paper)"
          stroke="var(--ink)"
          stroke-width="2"
        />
        <!-- State Boundary Lines on Map (g-crisis.png) -->
        <path
          d="M 118 0 L 118 112 M 186 0 L 182 95 M 244 0 L 238 100 M 300 0 L 310 105"
          fill="none"
          stroke="var(--ink)"
          stroke-width="1.6"
        />
        <!-- Amber Storm Surge Coastline Band (g-crisis.png) -->
        <path
          d="M 54 166 Q 94 122 146 94 Q 195 92 222 106 Q 260 90 310 104"
          fill="none"
          stroke="var(--gold)"
          stroke-width="10"
          stroke-linecap="round"
        />
        <!-- Coastal Houses & Green Trees along Surge Zone (g-crisis.png) -->
        {#each [[76, 134], [126, 96], [202, 86], [286, 92]] as [hx, hy] (hx)}
          <g transform="translate({hx}, {hy})">
            <rect x="-6" y="0" width="12" height="9" fill="var(--gold-dark)" stroke="var(--ink)" stroke-width="1.2" />
            <polygon points="-8,0 0,-7 8,0" fill="var(--alert)" stroke="var(--ink)" stroke-width="1.2" />
            <rect x="-2" y="3" width="4" height="6" fill="var(--ink)" />
          </g>
        {/each}
        {#each [[98, 114], [156, 84], [244, 80]] as [tx, ty] (tx)}
          <g transform="translate({tx}, {ty})">
            <rect x="-1.5" y="2" width="3" height="8" fill="var(--art-wood-dark)" />
            <circle cx="-3" cy="0" r="5" fill="var(--sage)" />
            <circle cx="3" cy="-2" r="5.5" fill="var(--sage)" />
          </g>
        {/each}
        <!-- White Multi-Arm Hurricane Spiral Vortex in Gulf (exact match to g-crisis.png) -->
        <g class="spin-slow" transform-origin="195 148">
          <circle cx="195" cy="148" r="34" fill="var(--art-shirt)" opacity=".18" />
          <path
            d="M 195 110 C 228 110 242 138 226 164 C 214 182 184 188 164 172 C 184 180 208 172 216 154 C 222 136 212 118 195 110 Z"
            fill="var(--art-shirt)"
          />
          <path
            d="M 195 186 C 162 186 148 158 164 132 C 176 114 206 108 226 124 C 206 116 182 124 174 142 C 168 160 178 178 195 186 Z"
            fill="var(--art-shirt)"
          />
          <circle cx="195" cy="148" r="18" fill="var(--art-shirt)" />
          <circle cx="195" cy="148" r="6.5" fill="var(--ink)" />
        </g>
      {:else if category === 'oil_shock' || category === 'debt_crisis' || category === 'market_panic'}
        <!-- Economic / Market Chart Screen -->
        <rect x="16" y="14" width="368" height="184" fill="var(--card)" rx="6" stroke="var(--ink)" stroke-width="2" />
        <line x1="42" y1="168" x2="340" y2="168" stroke="var(--ink)" stroke-width="2" />
        <line x1="42" y1="36" x2="42" y2="168" stroke="var(--ink)" stroke-width="2" />
        <path
          d="M 52 146 L 104 132 L 154 152 L 204 94 L 254 114 L 304 54 L 334 66 L 334 168 L 52 168 Z"
          fill="var(--alert-tint)"
        />
        <path
          d="M 52 146 L 104 132 L 154 152 L 204 94 L 254 114 L 304 54 L 334 66"
          fill="none"
          stroke="var(--alert)"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle cx="334" cy="66" r="5" fill="var(--alert)" />
      {:else}
        <!-- Capitol Standoff Screen -->
        <rect x="16" y="14" width="368" height="184" fill="var(--art-sky)" rx="6" stroke="var(--ink)" stroke-width="2" />
        <rect x="16" y="156" width="368" height="42" fill="var(--art-grass)" />
        <path d="M120 160 h140 v-34 h-140 Z" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
        <path d="M160 126 h60 v-22 a30 24 0 0 1 -60 0 Z" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
        <path d="M160 104 a30 26 0 0 1 60 0 Z" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
        <line x1="190" y1="78" x2="190" y2="64" stroke="var(--ink)" stroke-width="2.5" />
      {/if}

      <!-- LIVE Broadcast Status Badge -->
      <g transform="translate(18, 18)">
        <rect x="0" y="0" width="54" height="22" rx="4" fill="var(--alert)" stroke="var(--ink)" stroke-width="1.5" />
        <circle cx="11" cy="11" r="3.5" fill="var(--card)" />
        <text x="33" y="15.5" font-family="var(--font-ui)" font-size="12" font-weight="800" fill="var(--card)" text-anchor="middle" letter-spacing="0.8">LIVE</text>
      </g>

      <!-- News Anchor in Plum Blazer holding Red Broadcast Microphone in Bottom-Right Corner (exact match to g-crisis.png!) -->
      <Character
        look={reporter}
        pose="stand"
        prop="mic"
        talking={true}
        x={272}
        y={58}
        scale={0.88}
      />

      <!-- Lower Third Chyron News Ticker -->
      <rect x="0" y="210" width="400" height="30" fill="var(--ink)" />
      <rect x="0" y="208" width="400" height="2" fill="var(--gold)" />
      <rect x="10" y="214" width="62" height="20" rx="2" fill="var(--alert)" />
      <text x="41" y="228" font-family="var(--font-ui)" font-size="11" font-weight="900" fill="var(--card)" text-anchor="middle">SPECIAL</text>
      <text
        x="82"
        y="228"
        font-family="var(--font-body)"
        font-size="11"
        font-weight="700"
        fill="var(--card)"
        textLength={chyronText.length > 42 ? 308 : undefined}
        lengthAdjust={chyronText.length > 42 ? 'spacingAndGlyphs' : undefined}
      >{chyronText}</text>
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
