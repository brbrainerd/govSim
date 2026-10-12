<script lang="ts">
  // Vector illustration of the 9 Supreme Court justices behind the mahogany bench (PWR-01, OBS-07).
  // 6 conservative-appointed justices and 3 liberal-appointed justices in Americana pill-person style.
  // All colors strictly sourced from tokens via CSS variables.

  interface Justice {
    skin: string;
    hair: string;
    hairStyle: 'short' | 'side' | 'bun' | 'bald';
    glasses?: boolean;
    lean: 'conservative' | 'liberal';
  }

  const JUSTICES: readonly Justice[] = [
    { skin: 'skin-1', hair: 'hair-2', hairStyle: 'short', lean: 'conservative' },
    { skin: 'skin-2', hair: 'hair-1', hairStyle: 'bun', glasses: true, lean: 'liberal' },
    { skin: 'skin-3', hair: 'hair-3', hairStyle: 'side', lean: 'conservative' },
    { skin: 'skin-4', hair: 'hair-3', hairStyle: 'bald', lean: 'conservative' },
    { skin: 'skin-1', hair: 'hair-2', hairStyle: 'short', lean: 'conservative' }, // Chief
    { skin: 'skin-2', hair: 'hair-1', hairStyle: 'bun', lean: 'liberal' },
    { skin: 'skin-3', hair: 'hair-1', hairStyle: 'side', lean: 'conservative' },
    { skin: 'skin-1', hair: 'hair-3', hairStyle: 'side', glasses: true, lean: 'liberal' },
    { skin: 'skin-2', hair: 'hair-3', hairStyle: 'short', lean: 'conservative' },
  ];
</script>

<svg
  viewBox="0 0 360 84"
  width="100%"
  height="100%"
  role="img"
  aria-label="Supreme Court bench, 6-3 conservative majority"
  preserveAspectRatio="xMidYMid meet"
>
  <!-- Background curtain / wood paneling -->
  <rect x="0" y="0" width="360" height="84" fill="var(--card)" />
  <rect x="6" y="6" width="348" height="72" rx="4" fill="var(--paper)" opacity="0.6" />

  <!-- 9 Justices seated behind the bench -->
  {#each JUSTICES as j, i}
    {@const cx = 32 + i * 37}
    <g class="justice" transform="translate({cx}, 36)">
      <!-- Body / Robe -->
      <path d="M-13,10 Q-15,-2 -7,-8 L7,-8 Q15,-2 13,10 Z" fill="var(--ink)" />
      <!-- White collar / rabat -->
      <polygon points="-3,-8 3,-8 2,-2 -2,-2" fill="var(--art-shirt)" />
      <polygon points="-5,-8 -3,-8 -2,-2 -5,-4" fill="var(--card)" />
      <polygon points="5,-8 3,-8 2,-2 5,-4" fill="var(--card)" />

      <!-- Head pill -->
      <rect x="-9" y="-24" width="18" height="22" rx="8" fill="var(--{j.skin})" />

      <!-- Hair -->
      {#if j.hairStyle === 'bun'}
        <circle cx="0" cy="-26" r="4.5" fill="var(--{j.hair})" />
        <path d="M-9,-20 Q-9,-26 0,-26 Q9,-26 9,-20 Q6,-23 0,-23 Q-6,-23 -9,-20 Z" fill="var(--{j.hair})" />
      {:else if j.hairStyle === 'side'}
        <path d="M-9,-18 Q-8,-26 0,-26 Q9,-26 9,-20 Q5,-24 0,-24 Q-5,-24 -9,-18 Z" fill="var(--{j.hair})" />
      {:else if j.hairStyle === 'short'}
        <path d="M-9,-19 Q-8,-26 0,-26 Q8,-26 9,-19 Q6,-23 0,-23 Q-6,-23 -9,-19 Z" fill="var(--{j.hair})" />
      {/if}

      <!-- Eyes -->
      <circle cx="-3.5" cy="-14" r="1.2" fill="var(--ink)" />
      <circle cx="3.5" cy="-14" r="1.2" fill="var(--ink)" />

      <!-- Glasses if present -->
      {#if j.glasses}
        <circle cx="-3.5" cy="-14" r="3" fill="none" stroke="var(--ink)" stroke-width="0.8" />
        <circle cx="3.5" cy="-14" r="3" fill="none" stroke="var(--ink)" stroke-width="0.8" />
        <line x1="-0.5" y1="-14" x2="0.5" y2="-14" stroke="var(--ink)" stroke-width="0.8" />
      {/if}
    </g>
  {/each}

  <!-- Mahogany Bench Front -->
  <!-- Upper moulding ledge -->
  <rect x="8" y="48" width="344" height="6" rx="2" fill="var(--art-wood-light)" />
  <line x1="8" y1="54" x2="352" y2="54" stroke="var(--ink)" stroke-width="1.5" />

  <!-- Main bench panel -->
  <rect x="12" y="54" width="336" height="24" fill="var(--art-wood-dark)" />
  <!-- Panel insets -->
  {#each Array.from({ length: 9 }) as _, i}
    <rect
      x={18 + i * 37}
      y="57"
      width="29"
      height="18"
      rx="2"
      fill="var(--art-wood)"
      stroke="var(--art-wood-light)"
      stroke-width="1"
    />
  {/each}

  <!-- Lower bench baseboard -->
  <rect x="10" y="78" width="340" height="4" rx="1" fill="var(--art-wood-dark)" />
  <line x1="8" y1="82" x2="352" y2="82" stroke="var(--ink)" stroke-width="1" />
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
