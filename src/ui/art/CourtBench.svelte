<script lang="ts">
  // Vector illustration of the 9 Supreme Court justices behind the mahogany bench matching .design-targets/g-powers.png.
  // Continuous finger/thumb-shaped heads flowing directly into black judicial robes & white collars,
  // seated in front of crimson high-back leather chairs behind a carved mahogany bench.
  // All colors strictly sourced from tokens via CSS variables.

  interface Justice {
    skin: string;
    hair: string;
    hairStyle: 'short' | 'side' | 'bun' | 'bald' | 'swept' | 'bob';
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
    const styles: ('bob' | 'bald' | 'bald' | 'bald' | 'bald' | 'bob')[] = [
      'bob',
      'bald',
      'bald',
      'bald',
      'bald',
      'bob',
    ];
    const skins = ['skin-1', 'skin-4', 'skin-2', 'skin-3', 'skin-2', 'skin-1', 'skin-4', 'skin-3', 'skin-2'];
    const hairs = ['hair-1', 'hair-3', 'hair-1'];

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
          glasses: i === 1 || i === 7,
          lean: 'liberal',
          isChief,
        });
      } else {
        cLeft--;
        list.push({
          skin: skins[i % skins.length]!,
          hair: hairs[i % hairs.length]!,
          hairStyle: styles[i % styles.length]!,
          glasses: i === 4,
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
  <!-- Cream card backdrop matching g-powers.png -->
  <rect x="0" y="0" width="360" height="88" fill="var(--card)" />

  <!-- Justices seated behind the mahogany bench (matching g-powers.png) -->
  {#each JUSTICES as j, i}
    {@const cx = 24 + ((i + 0.5) / totalSeats) * 312}
    {@const isMajority = conservative >= liberal ? j.lean === 'conservative' : j.lean === 'liberal'}
    <g class="justice" transform="translate({cx}, 44)">
      <!-- Crimson high-back judicial chair behind justice (g-powers.png) -->
      <rect x="-13" y="-22" width="26" height="28" rx="4" fill="var(--alert)" />
      <rect x="-11" y="-20" width="22" height="24" rx="3" fill="var(--alert-dark)" opacity=".45" />

      <!-- Back-hair layer for bob/bun (g-powers.png left & right female justices) -->
      {#if j.hairStyle === 'bob' || j.hairStyle === 'bun'}
        <path d="M-12,-18 C-14,-6 -13,4 -9,6 L9,6 C13,4 14,-6 12,-18 Z" fill="var(--{j.hair})" />
      {/if}

      <!-- Continuous Black Judicial Robe Torso (exact 22px width matching head width!) -->
      <path d="M-11,-5 L11,-5 L12,12 L-12,12 Z" fill="var(--art-suit-black)" />

      <!-- Crisp White V-Collar Jabot & Red/Blue Tie Accent (g-powers.png) -->
      <polygon points="-5,-5 5,-5 0,7" fill="var(--art-shirt)" />
      {#if !j.hairStyle || j.hairStyle === 'bald'}
        <polygon points="-1.2,-3 1.2,-3 1.5,6 0,8 -1.5,6" fill={j.lean === 'conservative' ? 'var(--alert)' : 'var(--sky)'} />
      {/if}

      <!-- Seamless Collar-to-Thumb-Head Contour Seam (no stick neck!) -->
      <path d="M-10.5 -5.5 Q0 -2 10.5 -5.5 L10.5 -4 Q0 -0.5 -10.5 -4 Z" fill="var(--ink)" opacity=".18" />

      <!-- Continuous 21px-wide Finger/Thumb Head Dome (exact match to g-powers.png!) -->
      <path
        d="M-10.5 -17 A10.5 10.5 0 0 1 10.5 -17 L10.5 -5 Q0 -2 -10.5 -5 Z"
        fill="var(--{j.skin})"
      />

      <!-- Front Swept Hair for bob/bun justices (g-powers.png) -->
      {#if j.hairStyle === 'bob' || j.hairStyle === 'bun'}
        <path
          d="M-11,-15 A11,11 0 0,1 11,-15 C8,-21 2,-24 -4,-24 C-8,-21 -10,-18 -11,-15 Z"
          fill="var(--{j.hair})"
        />
      {/if}

      <!-- Eyebrows reacting to majority/minority stance (g-powers.png) -->
      {#if !isMajority}
        <line x1="-6.5" y1="-16.5" x2="-2.5" y2="-15" stroke="var(--hair-3)" stroke-width="1.3" stroke-linecap="round" />
        <line x1="6.5" y1="-16.5" x2="2.5" y2="-15" stroke="var(--hair-3)" stroke-width="1.3" stroke-linecap="round" />
      {/if}

      <!-- Solid Dark Dot Eyes (g-powers.png) -->
      <circle cx="-4" cy="-13" r="1.4" fill="var(--hair-3)" />
      <circle cx="4" cy="-13" r="1.4" fill="var(--hair-3)" />

      <!-- Round Glasses if present -->
      {#if j.glasses}
        <circle cx="-4" cy="-13" r="3" fill="none" stroke="var(--hair-3)" stroke-width="0.9" />
        <circle cx="4" cy="-13" r="3" fill="none" stroke="var(--hair-3)" stroke-width="0.9" />
        <line x1="-1" y1="-13" x2="1" y2="-13" stroke="var(--hair-3)" stroke-width="0.9" />
      {/if}

      <!-- Expressive Mouth (g-powers.png) -->
      {#if isMajority}
        <path d="M-3 -8.5 Q0 -6.5 3 -8.5" fill="none" stroke="var(--hair-3)" stroke-width="1.2" stroke-linecap="round" />
      {:else}
        <line x1="-3" y1="-8" x2="3" y2="-8.8" stroke="var(--hair-3)" stroke-width="1.2" stroke-linecap="round" />
      {/if}
    </g>
  {/each}

  <!-- Carved Mahogany Bench Front (exact match to g-powers.png) -->
  <rect x="10" y="53" width="340" height="6" rx="1.5" fill="var(--art-wood-light)" stroke="var(--ink)" stroke-width="1.5" />
  <rect x="14" y="59" width="332" height="25" fill="var(--art-wood)" stroke="var(--ink)" stroke-width="1.5" />

  <!-- Recessed Wood Panels along Bench Front (g-powers.png) -->
  {#each [22, 68, 114, 160, 206, 252, 298] as px (px)}
    <rect
      x={px}
      y="63"
      width="38"
      height="17"
      rx="1.5"
      fill="var(--art-wood-dark)"
      opacity="0.45"
      stroke="var(--ink)"
      stroke-width="1"
    />
  {/each}
</svg>

<style>
  svg {
    display: inline-block;
    width: 100%;
    height: 100%;
  }
</style>
