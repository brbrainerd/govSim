<script lang="ts">
  // Vector illustration of the 9 Supreme Court justices behind the mahogany bench (PWR-01, OBS-07, ART-03).
  // Ideological balance with fluted marble columns, brass scales of justice, and expressive justices.
  // All colors strictly sourced from tokens via CSS variables.

  interface Justice {
    skin: string;
    hair: string;
    hairStyle: 'short' | 'side' | 'bun' | 'bald' | 'swept';
    glasses?: boolean;
    lean: 'conservative' | 'liberal';
    isChief?: boolean;
  }

  let {
    conservative = 6,
    liberal = 3,
  }: {
    conservative?: number;
    liberal?: number;
  } = $props();

  const totalSeats = $derived(conservative + liberal);

  const JUSTICES = $derived.by(() => {
    const list: Justice[] = [];
    const styles: ('short' | 'side' | 'bun' | 'bald' | 'swept')[] = ['short', 'side', 'bun', 'swept', 'bald'];
    const skins = ['skin-1', 'skin-2', 'skin-3', 'skin-4'];
    const hairs = ['hair-1', 'hair-2', 'hair-3'];

    let cLeft = conservative;
    let lLeft = liberal;

    for (let i = 0; i < totalSeats; i++) {
      const isChief = i === Math.floor(totalSeats / 2);
      const isLiberal = (i % 3 === 1 || cLeft === 0) && lLeft > 0;
      if (isLiberal) {
        lLeft--;
        list.push({
          skin: skins[i % skins.length]!,
          hair: hairs[i % hairs.length]!,
          hairStyle: styles[i % styles.length]!,
          glasses: i % 2 === 0,
          lean: 'liberal',
          isChief,
        });
      } else {
        cLeft--;
        list.push({
          skin: skins[i % skins.length]!,
          hair: hairs[i % hairs.length]!,
          hairStyle: styles[i % styles.length]!,
          glasses: i % 4 === 0,
          lean: 'conservative',
          isChief,
        });
      }
    }
    return list;
  });
</script>

<svg
  viewBox="0 0 360 88"
  width="100%"
  height="100%"
  role="img"
  aria-label="Supreme Court bench, {conservative}-{liberal} ideological balance"
  data-testid="court-bench"
  preserveAspectRatio="xMidYMid meet"
>
  <!-- Background Chamber Architecture: Fluted Marble Columns & Heavy Drapery -->
  <rect x="0" y="0" width="360" height="88" fill="var(--card)" />
  <rect x="4" y="4" width="352" height="80" rx="4" fill="var(--paper)" opacity="0.7" />

  <!-- Classical Fluted Columns in Background -->
  {#each [18, 68, 120, 230, 282, 332] as colX (colX)}
    <rect x={colX} y="6" width="12" height="42" fill="var(--card)" stroke="var(--ink)" stroke-width="1.2" />
    <line x1={colX + 3} y1="8" x2={colX + 3} y2="46" stroke="var(--ink-soft)" stroke-width="1" opacity=".4" />
    <line x1={colX + 6} y1="8" x2={colX + 6} y2="46" stroke="var(--ink-soft)" stroke-width="1" opacity=".4" />
    <line x1={colX + 9} y1="8" x2={colX + 9} y2="46" stroke="var(--ink-soft)" stroke-width="1" opacity=".4" />
    <!-- Column capital moulding -->
    <rect x={colX - 2} y="5" width="16" height="3" fill="var(--card)" stroke="var(--ink)" stroke-width="1" />
  {/each}

  <!-- Central Hanging Brass Scales of Justice -->
  <g class="scales" transform="translate(180, 16)">
    <!-- Central suspension post & pediment -->
    <line x1="0" y1="0" x2="0" y2="18" stroke="var(--gold-dark)" stroke-width="2" />
    <circle cx="0" cy="0" r="2.5" fill="var(--gold)" />
    <!-- Balance beam -->
    <line x1="-16" y1="5" x2="16" y2="5" stroke="var(--gold)" stroke-width="2" />
    <!-- Left pan cords & pan -->
    <line x1="-15" y1="5" x2="-20" y2="15" stroke="var(--ink-soft)" stroke-width="0.8" />
    <line x1="-15" y1="5" x2="-10" y2="15" stroke="var(--ink-soft)" stroke-width="0.8" />
    <path d="M-22 15 Q-15 19 -8 15 Z" fill="var(--gold)" stroke="var(--ink)" stroke-width="0.8" />
    <!-- Right pan cords & pan -->
    <line x1="15" y1="5" x2="10" y2="15" stroke="var(--ink-soft)" stroke-width="0.8" />
    <line x1="15" y1="5" x2="20" y2="15" stroke="var(--ink-soft)" stroke-width="0.8" />
    <path d="M8 15 Q15 19 22 15 Z" fill="var(--gold)" stroke="var(--ink)" stroke-width="0.8" />
  </g>

  <!-- Justices seated behind the bench -->
  {#each JUSTICES as j, i}
    {@const cx = 20 + ((i + 0.5) / totalSeats) * 320}
    {@const isMajority = conservative >= liberal ? j.lean === 'conservative' : j.lean === 'liberal'}
    <g class="justice" transform="translate({cx}, 36)">
      <!-- Black Judicial Robe with pleated folds -->
      <path d="M-13,12 Q-15,-2 -7,-8 L7,-8 Q15,-2 13,12 Z" fill="var(--ink)" stroke="var(--ink)" stroke-width="1.2" />
      <line x1="-4" y1="-4" x2="-6" y2="12" stroke="var(--ink-soft)" stroke-width="1" opacity=".5" />
      <line x1="4" y1="-4" x2="6" y2="12" stroke="var(--ink-soft)" stroke-width="1" opacity=".5" />

      <!-- White Pleated Judicial Jabot / Collar -->
      <polygon points="-3,-8 3,-8 2,-2 -2,-2" fill="var(--art-shirt)" />
      <polygon points="-5,-8 -3,-8 -2,-2 -5,-4" fill="var(--card)" />
      <polygon points="5,-8 3,-8 2,-2 5,-4" fill="var(--card)" />
      <polygon points="-3,-2 3,-2 2,4 -2,4" fill="var(--art-shirt)" stroke="var(--ink)" stroke-width="0.5" />

      <!-- Head with contoured chin -->
      <rect x="-9" y="-24" width="18" height="22" rx="8" fill="var(--{j.skin})" stroke="var(--ink)" stroke-width="1.2" />

      <!-- Hairstyles -->
      {#if j.hairStyle === 'bun'}
        <circle cx="0" cy="-26" r="4.5" fill="var(--{j.hair})" />
        <path d="M-9,-20 Q-9,-26 0,-26 Q9,-26 9,-20 Q6,-23 0,-23 Q-6,-23 -9,-20 Z" fill="var(--{j.hair})" />
      {:else if j.hairStyle === 'side' || j.hairStyle === 'swept'}
        <path d="M-9,-18 Q-8,-26 0,-26 Q9,-26 9,-20 Q5,-24 0,-24 Q-5,-24 -9,-18 Z" fill="var(--{j.hair})" />
      {:else if j.hairStyle === 'short'}
        <path d="M-9,-19 Q-8,-26 0,-26 Q8,-26 9,-19 Q6,-23 0,-23 Q-6,-23 -9,-19 Z" fill="var(--{j.hair})" />
      {/if}

      <!-- Eyebrows reacting to majority/minority ideological stance -->
      {#if isMajority}
        <!-- Composed, confident judicial brow -->
        <line x1="-6" y1="-17" x2="-2" y2="-17" stroke="var(--ink)" stroke-width="1.2" stroke-linecap="round" />
        <line x1="2" y1="-17" x2="6" y2="-17" stroke="var(--ink)" stroke-width="1.2" stroke-linecap="round" />
      {:else}
        <!-- Furrowed, dissenting critical brow -->
        <line x1="-6" y1="-16" x2="-2" y2="-18" stroke="var(--ink)" stroke-width="1.2" stroke-linecap="round" />
        <line x1="2" y1="-18" x2="6" y2="-16" stroke="var(--ink)" stroke-width="1.2" stroke-linecap="round" />
      {/if}

      <!-- Expressive eyes -->
      <circle cx="-3.5" cy="-14" r="1.3" fill="var(--ink)" />
      <circle cx="3.5" cy="-14" r="1.3" fill="var(--ink)" />

      <!-- Glasses if present -->
      {#if j.glasses}
        <circle cx="-3.5" cy="-14" r="3.2" fill="none" stroke="var(--ink)" stroke-width="0.9" />
        <circle cx="3.5" cy="-14" r="3.2" fill="none" stroke="var(--ink)" stroke-width="0.9" />
        <line x1="-0.3" y1="-14" x2="0.3" y2="-14" stroke="var(--ink)" stroke-width="0.9" />
      {/if}

      <!-- Subtle mouth line -->
      <line x1="-2.5" y1="-8" x2="2.5" y2="-8" stroke="var(--ink)" stroke-width="1" stroke-linecap="round" />
    </g>
  {/each}

  <!-- Mahogany Bench Front -->
  <!-- Upper moulding ledge -->
  <rect x="8" y="48" width="344" height="6" rx="2" fill="var(--art-wood-light)" stroke="var(--ink)" stroke-width="1.5" />

  <!-- Chief Justice Gavel and Sounding Block -->
  <g transform="translate(170, 43)">
    <!-- Round wooden sounding block -->
    <ellipse cx="10" cy="5" rx="7" ry="2.5" fill="var(--art-wood-dark)" stroke="var(--ink)" stroke-width="1" />
    <!-- Miniature gavel -->
    <rect x="4" y="2" width="12" height="3.5" rx="1" fill="var(--art-wood)" stroke="var(--ink)" stroke-width="0.8" />
    <line x1="10" y1="2" x2="10" y2="-4" stroke="var(--art-wood-dark)" stroke-width="1" stroke-linecap="round" />
  </g>

  <!-- Main bench panel with fluted insets -->
  <rect x="12" y="54" width="336" height="26" fill="var(--art-wood-dark)" />
  {#each Array.from({ length: 9 }) as _, i}
    <rect
      x={18 + i * 37}
      y="57"
      width="29"
      height="20"
      rx="2"
      fill="var(--art-wood)"
      stroke="var(--art-wood-light)"
      stroke-width="1"
    />
    <!-- Carved rosette center dot -->
    <circle cx={18 + i * 37 + 14.5} cy="67" r="2.5" fill="var(--gold)" opacity=".8" />
  {/each}

  <!-- Lower bench baseboard -->
  <rect x="10" y="80" width="340" height="5" rx="1" fill="var(--art-wood-dark)" />
  <line x1="8" y1="85" x2="352" y2="85" stroke="var(--ink)" stroke-width="1.5" />
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
