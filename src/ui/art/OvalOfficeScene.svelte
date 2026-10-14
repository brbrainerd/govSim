<script lang="ts">
  import Character, { type Look, type Mood } from './Character.svelte';

  let {
    talking = true,
    approval = 52,
    inflation = 2.5,
    unemployment = 4.2,
    hasCrisis = false,
    evilMode = false,
    heat = 0,
    stagedCount = 0,
  }: {
    talking?: boolean;
    approval?: number;
    inflation?: number;
    unemployment?: number;
    hasCrisis?: boolean;
    evilMode?: boolean;
    heat?: number;
    stagedCount?: number;
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
    if (approval >= 58 && !hasCrisis) return 'triumphant';
    return 'confident';
  });

  const advisorMood = $derived.by<Mood>(() => {
    if (hasCrisis || (evilMode && heat >= 60)) return 'panicked';
    if (approval < 48 || stagedCount >= 3) return 'stressed';
    return 'confident';
  });

  const president: Look = $derived({
    skin: 'skin-1',
    hair: 'hair-2',
    hairStyle: 'parted',
    suit: evilMode ? 'art-wood-dark' : 'ink',
    tie: evilMode ? 'gold' : 'sky',
    mood: presidentMood,
  });

  const chief: Look = $derived({
    skin: 'skin-3',
    hair: 'hair-3',
    hairStyle: 'swept',
    suit: 'art-shirt',
    shirtOnly: true,
    pants: 'art-wood-dark',
    glasses: true,
    mood: advisorMood,
  });

  // Windows: sky + weather + lawn, 4x3 mullion grid, gold/crimson drapes
  const windows = [120, 330, 540];
  const stripes = Array.from({ length: 13 }, (_, i) => i);
</script>

<svg
  viewBox="0 0 800 380"
  width="100%"
  height="100%"
  preserveAspectRatio="xMidYMid slice"
  role="img"
  aria-label="The Oval Office: the President at the desk while the Chief of Staff gives the briefing"
  data-weather={weather}
  data-testid="oval-office-scene"
>
  <defs>
    {#each windows as wx, i (i)}
      <clipPath id="win{i}"><rect x={wx} y="34" width="140" height="196" rx="4" /></clipPath>
    {/each}
  </defs>

  <!-- Back wall, wainscoting and mouldings -->
  <rect width="800" height="380" fill="var(--art-wall)" />
  <rect y="0" width="800" height="16" fill="var(--art-trim)" />
  <rect y="16" width="800" height="4" fill="var(--ink)" opacity=".15" />
  <rect y="236" width="800" height="54" fill="var(--art-trim)" />
  {#each [40, 280, 500, 740] as px (px)}
    <rect x={px} y="246" width="40" height="34" rx="3" fill="none" stroke="var(--art-wall)" stroke-width="3" />
  {/each}

  <!-- Framed wall landscape silhouettes -->
  <g class="wall-paintings" opacity=".8">
    <rect x="36" y="70" width="48" height="64" rx="3" fill="var(--art-wood)" stroke="var(--ink)" stroke-width="2" />
    <rect x="42" y="76" width="36" height="52" fill="var(--paper)" />
    <path d="M44 114 L54 98 L64 112 L72 104 L76 114 Z" fill="var(--sage)" opacity=".6" />

    <rect x="716" y="70" width="48" height="64" rx="3" fill="var(--art-wood)" stroke="var(--ink)" stroke-width="2" />
    <rect x="722" y="76" width="36" height="52" fill="var(--paper)" />
    <path d="M724 114 L736 94 L748 114 Z" fill="var(--sky)" opacity=".6" />
  </g>

  <!-- Windows with dynamic weather -->
  {#each windows as wx, i (i)}
    <g clip-path="url(#win{i})">
      <!-- Sky: dark storm, overcast grey, or bright blue -->
      {#if weather === 'storm'}
        <rect x={wx} y="34" width="140" height="196" fill="var(--ink-soft)" />
        <!-- Dark storm clouds -->
        <ellipse cx={wx + 40} cy="70" rx="45" ry="22" fill="var(--ink)" opacity=".8" />
        <ellipse cx={wx + 90} cy="65" rx="35" ry="18" fill="var(--ink)" opacity=".7" />
        <!-- Lightning bolt in middle window -->
        {#if i === 1}
          <polygon points="{wx + 70},45 {wx + 58},85 {wx + 72},85 {wx + 52},130 {wx + 82},80 {wx + 68},80" fill="var(--gold)" />
        {/if}
      {:else if weather === 'rain'}
        <rect x={wx} y="34" width="140" height="196" fill="var(--art-wall)" />
        <!-- Overcast clouds -->
        <ellipse cx={wx + 50} cy="75" rx="50" ry="24" fill="var(--ink-soft)" opacity=".4" />
        <ellipse cx={wx + 90} cy="70" rx="35" ry="18" fill="var(--ink-soft)" opacity=".3" />
        <!-- Rain streaks -->
        {#each [20, 50, 80, 110] as rx (rx)}
          <line x1={wx + rx} y1="90" x2={wx + rx - 10} y2="170" stroke="var(--sky)" stroke-width="1.8" stroke-dasharray="8 12" />
        {/each}
      {:else}
        <!-- Sunny bright sky -->
        <rect x={wx} y="34" width="140" height="196" fill="var(--art-sky)" />
        <circle cx={wx + 110} cy="60" r="18" fill="var(--gold)" opacity=".6" />
        <g class="cloud" style="animation-delay:{-i * 9}s">
          <ellipse cx={wx + 30} cy="80" rx="30" ry="12" fill="var(--art-cloud)" />
          <ellipse cx={wx + 48} cy="70" rx="20" ry="12" fill="var(--art-cloud)" />
        </g>
      {/if}

      <!-- Rose Garden lawn and distant monument portico -->
      <rect x={wx} y="190" width="140" height="40" fill={weather === 'storm' ? 'var(--sage-dark)' : 'var(--art-grass)'} />
      {#if i === 1}
        <!-- Distant white portico -->
        <rect x={wx + 40} y="160" width="60" height="32" fill="var(--art-cloud)" />
        <path d="M{wx + 34} 162 L{wx + 70} 146 L{wx + 106} 162 Z" fill="var(--art-cloud)" />
      {/if}
    </g>

    <!-- Window mullion frames -->
    <g stroke="var(--art-wall)" stroke-width="5">
      <path d="M{wx + 46} 34 V230 M{wx + 93} 34 V230 M{wx} 99 H{wx + 140} M{wx} 164 H{wx + 140}" />
    </g>
    <rect x={wx} y="34" width="140" height="196" rx="4" fill="none" stroke="var(--ink)" stroke-width="3" />

    <!-- Drapes -->
    {#each [wx - 26, wx + 140] as dx (dx)}
      <path d="M{dx} 20 h40 v212 q-20 10 -40 0 Z" fill={evilMode ? 'var(--alert-dark)' : 'var(--art-curtain)'} stroke="var(--ink)" stroke-width="2" />
      <path d="M{dx + 12} 24 v204 M{dx + 26} 24 v206" stroke={evilMode ? 'var(--alert)' : 'var(--art-curtain-shade)'} stroke-width="4" />
    {/each}
  {/each}

  <!-- Floor + Oval Rug -->
  <rect y="290" width="800" height="90" fill="var(--art-floor)" />
  <ellipse cx="400" cy="352" rx="390" ry="58" fill={evilMode ? 'var(--paper)' : 'var(--art-carpet)'} />
  <ellipse cx="400" cy="352" rx="360" ry="46" fill="none" stroke="var(--gold)" stroke-width="4" />
  <ellipse cx="400" cy="352" rx="340" ry="40" fill="none" stroke="var(--gold)" stroke-width="1.5" stroke-dasharray="3 6" />

  <!-- Flag Poles -->
  <line x1="296" y1="70" x2="296" y2="300" stroke="var(--art-wood-dark)" stroke-width="5" />
  <circle cx="296" cy="66" r="6" fill="var(--gold)" />
  <g class="sway">
    <path d="M299 76 h40 q4 90 -6 170 h-34 Z" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
    {#each stripes as s (s)}
      {#if s % 2 === 0}<rect x={300 + s * 2.9} y="77" width="2.9" height="168" fill="var(--art-flag-red)" />{/if}
    {/each}
    <rect x="300" y="77" width="22" height="70" fill="var(--ink)" />
    {#each [0, 1, 2, 3, 4] as r (r)}
      <circle cx="306" cy={86 + r * 13} r="2" fill="var(--card)" /><circle cx="316" cy={92 + r * 13} r="2" fill="var(--card)" />
    {/each}
  </g>

  <line x1="504" y1="70" x2="504" y2="300" stroke="var(--art-wood-dark)" stroke-width="5" />
  <circle cx="504" cy="66" r="6" fill="var(--gold)" />
  <g class="sway" style="animation-delay:-1.3s">
    <path d="M501 76 h-40 q-4 90 6 170 h34 Z" fill="var(--ink)" stroke="var(--ink)" stroke-width="2" />
    <path d="M467 246 h34" stroke="var(--gold)" stroke-width="5" stroke-dasharray="3 3" />
  </g>

  <!-- President behind Resolute Desk -->
  <Character look={president} x={352} y={92} scale={0.82} delay={0.4} />

  <!-- Resolute Desk: Carved wood with ornamental panelling -->
  <rect x="246" y="236" width="308" height="16" rx="4" fill="var(--art-wood-light)" stroke="var(--ink)" stroke-width="2.5" />
  <rect x="256" y="250" width="288" height="96" rx="4" fill="var(--art-wood)" stroke="var(--ink)" stroke-width="2.5" />
  {#each [268, 466] as dx (dx)}
    <rect x={dx} y="262" width="66" height="72" rx="4" fill="var(--art-wood-dark)" opacity=".35" stroke="var(--ink)" stroke-width="1.5" />
    <!-- Carved rosette relief in panel center -->
    <circle cx={dx + 33} cy="298" r="10" fill="none" stroke="var(--gold)" stroke-width="1.5" />
  {/each}
  <path d="M352 346 V290 q48 -36 96 0 V346" fill="var(--art-wood-dark)" opacity=".45" stroke="var(--ink)" stroke-width="1.5" />

  <!-- Desk Props -->
  <!-- Steaming coffee mug -->
  <g transform="translate(268 218)">
    <rect x="0" y="4" width="16" height="14" rx="2" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" />
    <path d="M16 7 h4 a3 3 0 0 1 0 6 h-4" fill="none" stroke="var(--ink)" stroke-width="1.5" />
    <path d="M4 1 Q6 -2 4 -5 M10 1 Q12 -2 10 -5" fill="none" stroke="var(--ink-soft)" stroke-width="1.2" opacity=".5" stroke-linecap="round" />
  </g>

  <!-- Folders Stack (proportional to stagedCount) -->
  <g transform="translate(506 216)">
    {#each Array.from({ length: Math.min(4, Math.max(1, stagedCount)) }) as _, idx}
      <rect x={idx * 1.5} y={-idx * 4} width="24" height="6" rx="1.5" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.2" />
    {/each}
  </g>

  <!-- Brass desk lamp -->
  <path d="M440 236 q0 -14 14 -14 h12 q14 0 14 14 Z" fill="var(--ink)" />
  <circle cx="460" cy="222" r="5" fill="var(--gold)" />
  <path d="M452 232 L460 220 L468 232 Z" fill="var(--gold)" opacity=".4" />

  <!-- Signing pen tray -->
  <rect x="320" y="230" width="40" height="7" rx="1" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" transform="rotate(-6 340 233)" />
  <line x1="324" y1="233" x2="356" y2="230" stroke="var(--gold-dark)" stroke-width="2" />

  <!-- Crisis Red Hotline Telephone -->
  {#if hasCrisis}
    <g class="pulse-phone" transform="translate(296 214)" data-testid="oval-crisis-phone">
      <rect x="0" y="8" width="22" height="14" rx="3" fill="var(--alert)" stroke="var(--ink)" stroke-width="1.8" />
      <path d="M-2 4 Q11 0 24 4 L22 8 Q11 5 0 8 Z" fill="var(--alert-dark)" stroke="var(--ink)" stroke-width="1.5" />
      <!-- Pulsing red beacon halo -->
      <circle cx="11" cy="4" r="5" fill="var(--alert)" opacity=".5" class="halo" />
    </g>
  {/if}

  <!-- Satirical Evil Mode Props -->
  {#if evilMode}
    <!-- Document Shredder beside the desk -->
    <g transform="translate(180 260)" data-testid="oval-evil-shredder">
      <rect x="0" y="0" width="46" height="65" rx="4" fill="var(--ink)" stroke="var(--ink)" stroke-width="2" />
      <rect x="6" y="8" width="34" height="6" rx="2" fill="var(--alert)" stroke="var(--ink)" stroke-width="1.2" />
      <line x1="10" y1="11" x2="36" y2="11" stroke="var(--paper)" stroke-width="2" />
      <!-- Paper feeder label -->
      <text x="23" y="26" font-family="var(--font-ui)" font-size="7" font-weight="800" fill="var(--gold)" text-anchor="middle">SHRED-O-MATIC</text>
      <!-- Shredded paper strips in collection bin -->
      <rect x="6" y="32" width="34" height="26" rx="2" fill="var(--card)" opacity=".3" stroke="var(--ink)" stroke-width="1" />
      {#each [10, 14, 18, 22, 26, 30] as px (px)}
        <line x1={px} y1="34" x2={px} y2="52" stroke="var(--paper)" stroke-width="1.5" />
      {/each}
    </g>

    <!-- Offshore Trust ledger folder on desk -->
    <g transform="translate(370 230) rotate(8 385 233)">
      <rect x="0" y="0" width="32" height="8" rx="2" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.5" />
      <line x1="4" y1="4" x2="28" y2="4" stroke="var(--alert)" stroke-width="1.5" />
    </g>
  {/if}

  <!-- Chief of Staff giving briefing -->
  <Character
    look={chief}
    pose="point"
    prop="clipboard"
    {talking}
    x={596}
    y={128}
    scale={1}
    delay={1.6}
  />
</svg>

<style>
  .cloud { animation: drift 34s linear infinite; }
  .sway { transform-box: fill-box; transform-origin: top center; animation: sway 3.2s ease-in-out infinite; }
  .pulse-phone { transform-box: fill-box; transform-origin: center; animation: ring 1.4s ease-in-out infinite; }
  .halo { animation: glow 1.4s ease-in-out infinite alternate; }

  @keyframes drift { from { transform: translateX(-80px); } to { transform: translateX(180px); } }
  @keyframes sway { 50% { transform: skewX(1.5deg); } }
  @keyframes ring { 0%, 100% { transform: rotate(0deg); } 10%, 30% { transform: rotate(-5deg); } 20%, 40% { transform: rotate(5deg); } 50% { transform: rotate(0deg); } }
  @keyframes glow { from { opacity: .2; transform: scale(.8); } to { opacity: .8; transform: scale(1.4); } }
</style>
