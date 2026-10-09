<script lang="ts">
  import Character, { type Look } from './Character.svelte';

  let { talking = true }: { talking?: boolean } = $props();

  const president: Look = { skin: 'skin-1', hair: 'hair-2', hairStyle: 'short', suit: 'ink', tie: 'sky' };
  const chief: Look = { skin: 'skin-3', hair: 'hair-3', hairStyle: 'side', suit: 'art-shirt', shirtOnly: true, pants: 'art-wood-dark' };

  // Window: sky + clouds + lawn, 4×3 mullion grid, gold drapes either side.
  const windows = [120, 330, 540];
  const stripes = Array.from({ length: 13 }, (_, i) => i);
</script>

<svg viewBox="0 0 800 380" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img"
  aria-label="The Oval Office: the President at the desk while the Chief of Staff gives the briefing">
  <defs>
    {#each windows as wx, i (i)}
      <clipPath id="win{i}"><rect x={wx} y="34" width="140" height="196" rx="4" /></clipPath>
    {/each}
  </defs>
  <!-- back wall, crown moulding, wainscot -->
  <rect width="800" height="380" fill="var(--art-wall)" />
  <rect y="0" width="800" height="16" fill="var(--art-trim)" />
  <rect y="16" width="800" height="4" fill="var(--ink)" opacity=".15" />
  <rect y="236" width="800" height="54" fill="var(--art-trim)" />
  {#each [40, 280, 500, 740] as px (px)}
    <rect x={px} y="246" width="40" height="34" rx="3" fill="none" stroke="var(--art-wall)" stroke-width="3" />
  {/each}

  {#each windows as wx, i (i)}
    <g clip-path="url(#win{i})">
      <rect x={wx} y="34" width="140" height="196" fill="var(--art-sky)" />
      <g class="cloud" style="animation-delay:{-i * 9}s">
        <ellipse cx={wx + 30} cy="80" rx="30" ry="12" fill="var(--art-cloud)" />
        <ellipse cx={wx + 48} cy="70" rx="20" ry="12" fill="var(--art-cloud)" />
      </g>
      <rect x={wx} y="190" width="140" height="40" fill="var(--art-grass)" />
      {#if i === 1}
        <!-- distant monument-free columns: a small white portico -->
        <rect x={wx + 40} y="160" width="60" height="32" fill="var(--art-cloud)" />
        <path d="M{wx + 34} 162 L{wx + 70} 146 L{wx + 106} 162 Z" fill="var(--art-cloud)" />
      {/if}
    </g>
    <g stroke="var(--art-wall)" stroke-width="5">
      <path d="M{wx + 46} 34 V230 M{wx + 93} 34 V230 M{wx} 99 H{wx + 140} M{wx} 164 H{wx + 140}" />
    </g>
    <rect x={wx} y="34" width="140" height="196" rx="4" fill="none" stroke="var(--ink)" stroke-width="3" />
    <!-- drapes -->
    {#each [wx - 26, wx + 140] as dx (dx)}
      <path d="M{dx} 20 h40 v212 q-20 10 -40 0 Z" fill="var(--art-curtain)" stroke="var(--ink)" stroke-width="2" />
      <path d="M{dx + 12} 24 v204 M{dx + 26} 24 v206" stroke="var(--art-curtain-shade)" stroke-width="4" />
    {/each}
  {/each}

  <!-- floor + carpet -->
  <rect y="290" width="800" height="90" fill="var(--art-floor)" />
  <ellipse cx="400" cy="352" rx="390" ry="58" fill="var(--art-carpet)" />
  <ellipse cx="400" cy="352" rx="360" ry="46" fill="none" stroke="var(--gold)" stroke-width="4" />
  <ellipse cx="400" cy="352" rx="340" ry="40" fill="none" stroke="var(--gold)" stroke-width="1.5" stroke-dasharray="3 6" />

  <!-- flags -->
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

  <!-- President behind the desk -->
  <Character look={president} x={352} y={92} scale={0.82} delay={0.4} />

  <!-- desk -->
  <rect x="246" y="236" width="308" height="16" rx="4" fill="var(--art-wood-light)" stroke="var(--ink)" stroke-width="2.5" />
  <rect x="256" y="250" width="288" height="96" rx="4" fill="var(--art-wood)" stroke="var(--ink)" stroke-width="2.5" />
  {#each [268, 466] as dx (dx)}
    <rect x={dx} y="262" width="66" height="72" rx="4" fill="var(--art-wood-dark)" opacity=".35" stroke="var(--ink)" stroke-width="1.5" />
  {/each}
  <path d="M352 346 V290 q48 -36 96 0 V346" fill="var(--art-wood-dark)" opacity=".45" stroke="var(--ink)" stroke-width="1.5" />
  <!-- desk props -->
  <rect x="268" y="218" width="26" height="20" rx="2" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
  <rect x="506" y="216" width="24" height="22" rx="2" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
  <path d="M440 236 q0 -14 14 -14 h12 q14 0 14 14 Z" fill="var(--ink)" />
  <rect x="320" y="230" width="40" height="7" rx="1" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" transform="rotate(-6 340 233)" />

  <!-- Chief of Staff -->
  <Character look={chief} pose="point" prop="clipboard" {talking} x={596} y={128} scale={1} delay={1.6} />
</svg>

<style>
  .cloud { animation: drift 34s linear infinite; }
  .sway { transform-box: fill-box; transform-origin: top center; animation: sway 3.2s ease-in-out infinite; }
  @keyframes drift { from { transform: translateX(-80px); } to { transform: translateX(180px); } }
  @keyframes sway { 50% { transform: skewX(1.5deg); } }
</style>
