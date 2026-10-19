<script lang="ts">
  import Character, { resolvePresidentLook, type Look, type Mood } from './Character.svelte';

  let {
    talking = true,
    approval = 52,
    inflation = 2.5,
    unemployment = 4.2,
    hasCrisis = false,
    evilMode = false,
    heat = 0,
    stagedCount = 0,
    presidentLook = 0,
  }: {
    talking?: boolean;
    approval?: number;
    inflation?: number;
    unemployment?: number;
    hasCrisis?: boolean;
    evilMode?: boolean;
    heat?: number;
    stagedCount?: number;
    presidentLook?: 0 | 1 | 2 | 3;
  } = $props();

  const weather = $derived.by<'sunny' | 'rain' | 'storm'>(() => {
    if (hasCrisis) return 'storm';
    if (unemployment >= 5.8 || inflation >= 4.5) return 'rain';
    return 'sunny';
  });

  const presidentMood = $derived.by<Mood>(() => {
    if (evilMode && heat >= 75) return 'panicked';
    if (evilMode && heat < 75) return 'scheming';
    if (hasCrisis && approval < 42) return 'panicked';
    if (approval < 45 || weather === 'rain') return 'stressed';
    if (approval >= 62 && !hasCrisis) return 'triumphant';
    return 'confident';
  });

  const advisorMood = $derived.by<Mood>(() => {
    if (hasCrisis || (evilMode && heat >= 60)) return 'panicked';
    if (evilMode) return 'scheming';
    if (approval < 48 || stagedCount >= 3) return 'stressed';
    return 'confident';
  });

  const president: Look = $derived(resolvePresidentLook(presidentLook, evilMode, presidentMood));

  // Exact Chief of Staff look from .design-targets/D.png (#2), g-home.png, and hub2.png
  const chief: Look = $derived({
    skin: 'skin-3',
    hair: 'hair-3',
    hairStyle: 'bald',
    suit: 'art-shirt-blue',
    shirtOnly: true,
    outfit: 'shirt',
    pants: 'art-khaki',
    mood: advisorMood,
  });

  const windows = [225, 356, 488];
  const stripes = Array.from({ length: 9 }, (_, i) => i);
  const dossierLayers = $derived(Array.from({ length: Math.min(4, Math.max(0, stagedCount)) }, (_, i) => i));
</script>

<svg
  viewBox="0 0 800 380"
  width="100%"
  height="100%"
  preserveAspectRatio="xMidYMid slice"
  role="img"
  aria-label="The Oval Office: the President at the Resolute Desk while the Chief of Staff delivers the briefing"
  data-weather={weather}
  data-testid="oval-office-scene"
>
  <defs>
    {#each windows as wx, i (i)}
      <clipPath id="win{i}">
        <path d="M{wx} 102 A38 38 0 0 1 {wx + 76} 102 L{wx + 76} 234 L{wx} 234 Z" />
      </clipPath>
    {/each}
    <!-- Warm radial glow for Evil Mode banker's lamp (matching g-evil.png) -->
    <radialGradient id="evil-lamp-glow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="var(--gold)" stop-opacity="0.52" />
      <stop offset="55%" stop-color="var(--gold)" stop-opacity="0.18" />
      <stop offset="100%" stop-color="var(--gold)" stop-opacity="0" />
    </radialGradient>
    <!-- Sunbeam gradient for sunny high-approval days -->
    <linearGradient id="sunbeam-grad" x1="0%" y1="0%" x2="20%" y2="100%">
      <stop offset="0%" stop-color="var(--gold)" stop-opacity="0.24" />
      <stop offset="100%" stop-color="var(--gold)" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- LAYER 0: Pre-Generated Vintage Americana Environment Plate (oval-day-bg.jpg / oval-evil-bg.jpg) -->
  <rect width="800" height="380" fill="var(--art-wall)" />
  <image
    href={evilMode ? '/assets/environments/oval-evil-bg.jpg' : '/assets/environments/oval-day-bg.jpg'}
    x="0"
    y="0"
    width="800"
    height="380"
    preserveAspectRatio="xMidYMid slice"
    data-testid="oval-env-plate"
  />

  <!-- LAYER 1: Reactive Animated Window Weather, Sunbeams & Noir Horizon Overlays -->
  {#each windows as wx, i (i)}
    <g clip-path="url(#win{i})">
      {#if evilMode}
        <ellipse
          class="evil-glow"
          cx={wx + 38}
          cy="185"
          rx="44"
          ry="28"
          fill="var(--gold)"
          opacity=".18"
        />
      {:else if weather === 'storm'}
        <rect x={wx} y="60" width="76" height="176" fill="var(--ink)" opacity=".62" />
        {#each [14, 34, 54, 68] as rx (rx)}
          <line
            class="rain-streak"
            x1={wx + rx}
            y1="72"
            x2={wx + rx - 10}
            y2="220"
            stroke="var(--sky)"
            stroke-width="1.8"
            stroke-dasharray="9 11"
          />
        {/each}
        {#if i === 1}
          <polygon
            class="lightning-bolt"
            points="{wx + 42},74 {wx + 30},112 {wx + 44},112 {wx + 26},154 {wx + 54},108 {wx + 40},108"
            fill="var(--gold)"
          />
        {/if}
      {:else if weather === 'rain'}
        <rect x={wx} y="60" width="76" height="176" fill="var(--ink-soft)" opacity=".38" />
        {#each [14, 34, 54, 68] as rx (rx)}
          <line
            class="rain-streak"
            x1={wx + rx}
            y1="72"
            x2={wx + rx - 8}
            y2="220"
            stroke="var(--sky)"
            stroke-width="1.6"
            stroke-dasharray="7 12"
          />
        {/each}
      {:else}
        <g class="cloud" style="animation-delay:{-i * 6}s" opacity=".55">
          <ellipse cx={wx + 28} cy="108" rx="18" ry="8" fill="var(--art-cloud)" />
          <ellipse cx={wx + 42} cy="102" rx="14" ry="8" fill="var(--art-cloud)" />
        </g>
        <polygon
          class="sunbeam"
          points="{wx + 12},66 {wx + 58},66 {wx + 74},232 {wx - 4},232"
          fill="url(#sunbeam-grad)"
        />
      {/if}
    </g>
  {/each}

  <!-- Back Credenza Behind the President with Two Framed Portraits (exact match to g-home.png & hub2.png!) -->
  {#if !evilMode}
    <g class="credenza">
      <rect x="304" y="196" width="192" height="10" rx="2" fill="var(--art-wood-light)" stroke="var(--ink)" stroke-width="2" />
      <rect x="312" y="206" width="176" height="36" fill="var(--art-wood-dark)" stroke="var(--ink)" stroke-width="2" />
      <!-- Left Framed Portrait on Credenza -->
      <g transform="translate(322, 166) rotate(-4)">
        <rect x="0" y="0" width="24" height="30" rx="2" fill="var(--hair-2)" stroke="var(--ink)" stroke-width="2" />
        <rect x="4" y="4" width="16" height="22" fill="var(--card)" stroke="var(--ink)" stroke-width="1" />
      </g>
      <!-- Right Framed Portrait on Credenza -->
      <g transform="translate(454, 166) rotate(4)">
        <rect x="0" y="0" width="24" height="30" rx="2" fill="var(--hair-2)" stroke="var(--ink)" stroke-width="2" />
        <rect x="4" y="4" width="16" height="22" fill="var(--card)" stroke="var(--ink)" stroke-width="1" />
      </g>
    </g>
  {/if}

  <!-- US Flag & Presidential Seal Flag Behind Desk (exact match to g-home.png & hub2.png) -->
  {#if !evilMode}
    <!-- Left Flag: Stars & Stripes with Gold Eagle Finial -->
    <line x1="292" y1="48" x2="292" y2="290" stroke="var(--art-wood-dark)" stroke-width="4.5" />
    <!-- Gold Eagle Finial on Top of Flagpole (hub2.png) -->
    <path d="M282 44 Q292 36 302 44 Q296 48 292 48 Q288 48 282 44 Z" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.4" />
    <circle cx="292" cy="40" r="3" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.2" />
    <g class="sway">
      <path d="M292 52 L258 214 L310 218 Z" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
      {#each stripes as s (s)}
        <path
          d="M{292 - s * 3.5} {56 + s * 16} L{308 - s * 1.2} {72 + s * 16}"
          stroke="var(--art-flag-red)"
          stroke-width="6"
        />
      {/each}
      <path d="M292 52 L276 128 L300 132 L292 52 Z" fill="var(--ink)" stroke="var(--ink)" stroke-width="1.5" />
      <circle cx="288" cy="86" r="1.8" fill="var(--card)" />
      <circle cx="284" cy="102" r="1.8" fill="var(--card)" />
      <circle cx="292" cy="106" r="1.8" fill="var(--card)" />
      <circle cx="282" cy="118" r="1.8" fill="var(--card)" />
      <circle cx="290" cy="120" r="1.8" fill="var(--card)" />
    </g>

    <!-- Right Flag: Navy Presidential Flag with Gold Seal Disc (hub2.png) -->
    <line x1="492" y1="48" x2="492" y2="290" stroke="var(--art-wood-dark)" stroke-width="4.5" />
    <circle cx="492" cy="44" r="5" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.4" />
    <g class="sway" style="animation-delay:-1.3s">
      <path d="M492 52 L462 204 L516 212 Z" fill="var(--ink)" stroke="var(--ink)" stroke-width="2" />
      <circle cx="490" cy="138" r="16" fill="var(--card)" stroke="var(--gold)" stroke-width="2" />
    </g>
  {/if}

  <!-- Rounded Leather Executive Chair Tucked Behind President's Shoulders (g-home.png, hub2.png, g-evil.png) -->
  <g data-testid="oval-exec-chair">
    <rect
      x="362"
      y={evilMode ? 124 : 144}
      width="76"
      height="86"
      rx="18"
      fill="var(--art-wood-dark)"
      stroke="var(--ink)"
      stroke-width="2.2"
    />
    <rect
      x="369"
      y={evilMode ? 131 : 151}
      width="62"
      height="72"
      rx="12"
      fill="var(--ink)"
      opacity=".25"
      stroke="var(--gold)"
      stroke-width="1.2"
    />
  </g>

  <!-- President Behind the Resolute Desk (g-home.png: seated desk pose; g-evil.png: scheming cash pose) -->
  <Character
    look={president}
    pose={evilMode ? 'cash' : 'desk'}
    prop={evilMode ? 'cash_fan' : null}
    x={348}
    y={evilMode ? 80 : 94}
    scale={evilMode ? 0.88 : 0.86}
    delay={0.4}
  />

  <!-- Grand 3-Bay Carved Mahogany Resolute Desk (exact match to g-home.png, hub2.png & g-evil.png) -->
  <g class="resolute-desk">
    <!-- Ambient floor contact shadow grounding desk on illustrated carpet -->
    <ellipse cx="396" cy="328" rx="166" ry="11" fill="var(--ink)" opacity=".28" />

    <!-- Top Desktop Cornice & Ledge -->
    <rect x="234" y="218" width="324" height="12" rx="3" fill="var(--art-wood-light)" stroke="var(--ink)" stroke-width="2.4" />
    <rect x="242" y="230" width="308" height="8" fill="var(--art-wood-dark)" stroke="var(--ink)" stroke-width="2" />

    <!-- Main Desk Body -->
    <rect x="246" y="238" width="300" height="88" fill="var(--art-wood)" stroke="var(--ink)" stroke-width="2.4" />

    <!-- Carved Ornate Frieze Strip Under Desktop (g-home.png) -->
    <rect x="252" y="242" width="288" height="10" fill="var(--art-wood-dark)" opacity=".55" stroke="var(--ink)" stroke-width="1.2" />

    <!-- Left & Right Recessed Pedestal Panels (g-home.png & g-evil.png) -->
    {#each [260, 464] as px (px)}
      <rect x={px} y="256" width="68" height="58" rx="2" fill="var(--art-wood-dark)" opacity=".45" stroke="var(--ink)" stroke-width="1.8" />
      <rect x={px + 6} y="262" width="56" height="46" rx="1" fill="none" stroke="var(--ink)" stroke-width="1.2" opacity=".6" />
    {/each}

    <!-- Center Front Panel with Carved Presidential Eagle Seal Relief (exact match to g-home.png!) -->
    <rect x="342" y="254" width="108" height="62" rx="2" fill="var(--art-wood-dark)" opacity=".48" stroke="var(--ink)" stroke-width="1.8" />
    <path
      d="M 352 262 L 440 262 L 440 308 L 352 308 Z"
      fill="none"
      stroke="var(--ink)"
      stroke-width="1.4"
      opacity=".65"
    />
    <!-- Carved Eagle Relief Medallion in Center Desk Panel -->
    <g transform="translate(396, 286)" opacity=".8">
      <circle cx="0" cy="0" r="17" fill="var(--art-wood)" stroke="var(--ink)" stroke-width="1.6" />
      <path d="M -12 -3 Q -6 -10 0 -3 Q 6 -10 12 -3 Q 7 5 0 8 Q -7 5 -12 -3 Z" fill="var(--art-wood-light)" stroke="var(--ink)" stroke-width="1.2" />
    </g>

    <!-- Heavy Molded Desk Base Plinth (g-home.png) -->
    <rect x="240" y="320" width="312" height="10" rx="2" fill="var(--art-wood-dark)" stroke="var(--ink)" stroke-width="2.2" />
  </g>

  <!-- Standard Mode Desk Props (hub2.png & g-home.png) -->
  {#if !evilMode}
    <!-- Gold "PRESIDENT" Desk Nameplate (exact match to hub2.png!) -->
    <g transform="translate(366, 208)">
      <rect x="0" y="0" width="60" height="13" rx="2" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.6" />
      <text x="30" y="9.5" font-family="var(--font-ui)" font-size="8.5" font-weight="800" fill="var(--ink)" text-anchor="middle" letter-spacing="0.5">PRESIDENT</text>
    </g>

    <!-- Left Inbox Tray & Briefing Sheet (hub2.png) -->
    <g transform="translate(254, 206)">
      <polygon points="0,12 8,2 40,2 34,12" fill="var(--ink)" stroke="var(--ink)" stroke-width="1.5" />
      <polygon points="6,6 12,0 36,0 31,6" fill="var(--card)" stroke="var(--ink)" stroke-width="1.2" />
      <polygon points="48,12 54,4 78,4 72,12" fill="var(--card)" stroke="var(--ink)" stroke-width="1.4" />
    </g>

    <!-- Right Executive Push-Button Console Phone (hub2.png) -->
    <g transform="translate(480, 198)">
      <polygon points="0,20 8,6 42,6 36,20" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="1.8" />
      <rect x="4" y="2" width="34" height="7" rx="3" fill="var(--ink)" stroke="var(--ink)" stroke-width="1.5" />
    </g>
  {/if}

  <!-- Reactive Staged Dossier Stack on the Desk (grows with stagedCount so player sees queued actions!) -->
  {#if dossierLayers.length > 0}
    <g class="dossier-stack" transform="translate(326, 210)" data-testid="oval-staged-dossiers">
      {#each dossierLayers as idx (idx)}
        <g transform="translate({idx * 1.5}, {-idx * 4})">
          <polygon points="0,8 5,1 32,1 28,8" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.2" />
          <polygon points="3,6 7,0 29,0 26,6" fill="var(--card)" stroke="var(--ink)" stroke-width="1" />
        </g>
      {/each}
    </g>
  {/if}

  <!-- Crisis Red Hotline Telephone -->
  {#if hasCrisis}
    <g class="pulse-phone" transform="translate(442, 198)" data-testid="oval-crisis-phone">
      <rect x="0" y="8" width="24" height="14" rx="3" fill="var(--alert)" stroke="var(--ink)" stroke-width="1.8" />
      <path d="M-2 4 Q12 0 26 4 L24 8 Q12 5 0 8 Z" fill="var(--alert-dark)" stroke="var(--ink)" stroke-width="1.5" />
      <circle cx="12" cy="4" r="5" fill="var(--alert)" opacity=".5" class="halo" />
    </g>
  {/if}

  <!-- Satirical Evil Mode Stage Props (exact match to .design-targets/g-evil.png!) -->
  {#if evilMode}
    <!-- Warm Radial Lamp Glow Cone + Brass Banker's Lamp on Left of Desk (g-evil.png) -->
    <g data-testid="oval-evil-lamp-cone">
      <!-- Radial ambient light glow behind lamp & cash -->
      <circle cx="305" cy="182" r="95" fill="url(#evil-lamp-glow)" />
      <polygon points="292,162 232,232 368,232" fill="var(--gold)" opacity=".22" />
      <!-- Molded Brass Lamp Base & Curved Stem -->
      <ellipse cx="282" cy="222" rx="18" ry="5.5" fill="var(--gold-dark)" stroke="var(--ink)" stroke-width="2" />
      <path d="M270 220 Q282 212 294 220 Z" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.6" />
      <path d="M282 214 L282 178 Q282 162 296 162" fill="none" stroke="var(--gold-dark)" stroke-width="5" stroke-linecap="round" />
      <!-- Glowing Amber/Cream Banker's Lamp Shade (g-evil.png) -->
      <path
        d="M266 166 Q272 148 314 148 Q324 148 332 166 Z"
        fill="var(--card)"
        stroke="var(--ink)"
        stroke-width="2.2"
      />
      <path d="M272 160 H322" stroke="var(--gold)" stroke-width="2.5" />
    </g>

    <!-- Two 3D Banded Cash Bundle Stacks on the Desk (exact match to g-evil.png!) -->
    <g data-testid="oval-evil-cash-stacks" transform="translate(310, 198)">
      <!-- Tall Left Stack of Dollar Bills -->
      {#each [14, 9, 4, -1] as dy (dy)}
        <rect x="0" y={dy} width="32" height="8" rx="1.5" fill="var(--sage)" stroke="var(--ink)" stroke-width="1.4" />
        <rect x="11" y={dy} width="9" height="8" fill="var(--gold)" stroke="var(--ink)" stroke-width="1" />
      {/each}
      <!-- Shorter Right Stack of Dollar Bills -->
      {#each [15, 10] as dy (dy)}
        <rect x="26" y={dy} width="30" height="8" rx="1.5" fill="var(--sage)" stroke="var(--ink)" stroke-width="1.4" />
        <rect x="36" y={dy} width="8" height="8" fill="var(--gold)" stroke="var(--ink)" stroke-width="1" />
      {/each}
    </g>

    <!-- Standing Office Paper Shredder on Right Side of Desk with Document & Shredded Strips (exact match to g-evil.png!) -->
    <g data-testid="oval-evil-shredder" transform="translate(514, 212)">
      <!-- White Document Feeding into Top Slot -->
      <g class="shred-feed">
        <rect x="14" y="-22" width="44" height="32" rx="1.5" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8" />
        <path d="M20 -14 h26 M20 -8 h32 M20 -2 h28 M20 4 h22" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round" />
      </g>
      <!-- Shredder Top Head Unit -->
      <polygon points="0,12 8,2 64,2 72,12" fill="var(--art-wood-light)" stroke="var(--ink)" stroke-width="2" />
      <line x1="10" y1="7" x2="62" y2="7" stroke="var(--ink)" stroke-width="2.5" />
      <!-- Shredder Cabinet Body -->
      <rect x="0" y="12" width="72" height="114" rx="3" fill="var(--art-wood)" stroke="var(--ink)" stroke-width="2.2" />
      <rect x="4" y="16" width="64" height="14" fill="var(--art-wood-dark)" opacity=".5" stroke="var(--ink)" stroke-width="1.2" />
      <circle cx="58" cy="23" r="2.2" fill="var(--alert)" />
      <!-- Dark Open Shredder Mouth Window with Vertical Paper Strips & Crumpled Pile (g-evil.png!) -->
      <rect x="8" y="36" width="56" height="84" rx="2" fill="var(--canvas)" stroke="var(--ink)" stroke-width="2" />
      <!-- Hanging Shredded Paper Strips -->
      <g class="shred-strips">
        {#each [14, 20, 26, 32, 38, 44, 50, 56] as sx, si (sx)}
          <path
            d="M{sx} 38 Q{sx + (si % 2 === 0 ? 2 : -2)} 64 {sx + (si % 2 === 0 ? -1 : 2)} {88 + (si % 3) * 6}"
            fill="none"
            stroke="var(--card)"
            stroke-width="3.2"
            stroke-linecap="round"
          />
        {/each}
      </g>
      <!-- Crumpled Shredded Paper Mound at Bottom of Bin -->
      <path
        d="M10 118 L16 106 L26 112 L36 102 L48 110 L56 104 L62 118 Z"
        fill="var(--card)"
        stroke="var(--ink)"
        stroke-width="1.4"
      />
      <path
        d="M14 118 L24 110 L38 114 L50 108 L60 118 Z"
        fill="var(--paper)"
        stroke="var(--ink)"
        stroke-width="1.2"
      />
    </g>
  {/if}

  <!-- Chief of Staff Standing to Right of Resolute Desk (in Standard Mode, matching g-home.png & hub2.png) -->
  {#if !evilMode}
    <Character
      look={chief}
      pose="point"
      prop="clipboard"
      {talking}
      x={518}
      y={110}
      scale={0.86}
    />
  {/if}
</svg>

<style>
  .sway { transform-box: fill-box; transform-origin: top left; animation: sway 5s ease-in-out infinite; }
  .cloud { animation: drift 26s ease-in-out infinite alternate; }
  .sunbeam { animation: sunbeam-pulse 6s ease-in-out infinite alternate; }
  .rain-streak { animation: rain-fall 1.1s linear infinite; }
  .evil-glow { animation: evil-pulse 4s ease-in-out infinite alternate; }
  .halo { animation: pulse-ring 1.2s ease-in-out infinite alternate; }
  .shred-feed { animation: shred-bob 2.2s ease-in-out infinite alternate; }
  :global([data-calm='true']) .sway,
  :global([data-calm='true']) .cloud,
  :global([data-calm='true']) .sunbeam,
  :global([data-calm='true']) .rain-streak,
  :global([data-calm='true']) .evil-glow,
  :global([data-calm='true']) .halo,
  :global([data-calm='true']) .shred-feed {
    animation: none !important;
  }
  @keyframes sway { 50% { transform: skewY(1.2deg) scaleX(.98); } }
  @keyframes drift { to { transform: translateX(18px); } }
  @keyframes sunbeam-pulse { from { opacity: 0.55; } to { opacity: 0.95; } }
  @keyframes rain-fall { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
  @keyframes evil-pulse { from { opacity: 0.12; } to { opacity: 0.28; } }
  @keyframes pulse-ring { from { opacity: 0.25; transform: scale(0.9); } to { opacity: 0.85; transform: scale(1.25); } }
  @keyframes shred-bob { from { transform: translateY(-2px); } to { transform: translateY(3px); } }
</style>
