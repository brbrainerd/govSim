<script lang="ts" module>
  export type HairStyle = 'short' | 'side' | 'bald' | 'bun' | 'parted' | 'swept' | 'cropped';
  export type Mood = 'confident' | 'stressed' | 'scheming' | 'panicked' | 'triumphant';
  export type Pose = 'stand' | 'point' | 'desk' | 'wave';
  export type CharacterProp = 'clipboard' | 'folder' | 'coffee' | 'gavel' | 'mic' | null;

  export interface Look {
    skin: string; // token name, e.g. 'skin-2'
    hair: string;
    hairStyle: HairStyle;
    suit: string;
    tie?: string;
    pants?: string;
    shirtOnly?: boolean; // rolled sleeves, no jacket
    glasses?: boolean;
    pearls?: boolean;
    mood?: Mood;
  }
</script>

<script lang="ts">
  // Layered editorial-poster character rig (design.md A3, ART-01).
  let {
    look,
    pose = 'stand',
    prop = null,
    mood = 'confident',
    talking = false,
    flip = false,
    x = 0,
    y = 0,
    scale = 1,
    delay = 0,
  }: {
    look: Look;
    pose?: Pose;
    prop?: CharacterProp;
    mood?: Mood;
    talking?: boolean;
    flip?: boolean;
    x?: number;
    y?: number;
    scale?: number;
    delay?: number;
  } = $props();

  const v = (t: string | undefined, fallback: string) => `var(--${t ?? fallback})`;
  const suit = $derived(v(look.suit, 'ink'));
  const skin = $derived(v(look.skin, 'skin-2'));
  const hair = $derived(v(look.hair, 'hair-1'));
  const effectiveMood = $derived(look.mood ?? mood);
  const hasPearls = $derived(look.pearls ?? false);
  const hasGlasses = $derived(look.glasses ?? false);
</script>

<g transform="translate({x} {y}) scale({scale * (flip ? -1 : 1)} {scale})" data-mood={effectiveMood} data-pose={pose}>
  <g class="breathe" style="animation-delay:{-delay}s">
    <!-- Legs + dress shoes -->
    {#if pose !== 'desk'}
      <rect x="40" y="174" width="17" height="52" rx="6" fill={v(look.pants, look.suit)} stroke="var(--ink)" stroke-width="1.5" />
      <rect x="63" y="174" width="17" height="52" rx="6" fill={v(look.pants, look.suit)} stroke="var(--ink)" stroke-width="1.5" />
      <path d="M34 220 h26 v8 a4 4 0 0 1 -4 4 h-18 a4 4 0 0 1 -4 -4 Z" fill="var(--hair-3)" stroke="var(--ink)" stroke-width="1.5" />
      <path d="M60 220 h26 v8 a4 4 0 0 1 -4 4 h-18 a4 4 0 0 1 -4 -4 Z" fill="var(--hair-3)" stroke="var(--ink)" stroke-width="1.5" />
    {/if}

    <!-- Arms: Stand or Desk pose -->
    {#if pose === 'stand' || pose === 'desk'}
      <rect x="14" y="98" width="18" height="72" rx="9" fill={look.shirtOnly ? 'var(--art-shirt)' : suit} stroke="var(--ink)" stroke-width="1.5" />
      <circle cx="23" cy="172" r="8.5" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
    {/if}

    {#if prop === null && pose !== 'point' && pose !== 'wave'}
      <rect x="88" y="98" width="18" height="72" rx="9" fill={look.shirtOnly ? 'var(--art-shirt)' : suit} stroke="var(--ink)" stroke-width="1.5" />
      <circle cx="97" cy="172" r="8.5" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
    {/if}

    <!-- Torso: Tailored suit with notched lapels and collar -->
    <rect x="26" y="90" width="68" height="96" rx="24" fill={look.shirtOnly ? 'var(--art-shirt)' : suit} stroke="var(--ink)" stroke-width="2" />

    {#if look.shirtOnly}
      <rect x="26" y="148" width="68" height="38" rx="8" fill={v(look.pants, 'art-wood-dark')} stroke="var(--ink)" stroke-width="1.5" />
      <!-- Belt buckle -->
      <rect x="54" y="149" width="12" height="8" rx="2" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.2" />
      <path d="M48 92 L60 110 L72 92" fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round" />
    {:else}
      <!-- Crisp White Shirt V-neck -->
      <path d="M46 92 L60 134 L74 92 Z" fill="var(--art-shirt)" stroke="var(--ink)" stroke-width="1.5" />
      <!-- Left & Right Notched Suit Lapels -->
      <path d="M38 90 L48 114 L39 122 L49 146 L58 132 L47 92 Z" fill={suit} stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M82 90 L72 114 L81 122 L71 146 L62 132 L73 92 Z" fill={suit} stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round" />
      <!-- Pocket Square on breast pocket -->
      <path d="M33 130 h14 v2 h-14 Z" fill="var(--ink)" stroke="var(--ink)" stroke-width="1" />
      <path d="M35 130 L40 124 L44 130 Z" fill="var(--card)" />
    {/if}

    <!-- Tie or Pearl Necklace -->
    {#if hasPearls}
      <g class="pearls">
        <circle cx="51" cy="106" r="3.2" fill="var(--card)" stroke="var(--ink)" stroke-width="1" />
        <circle cx="56" cy="111" r="3.4" fill="var(--card)" stroke="var(--ink)" stroke-width="1" />
        <circle cx="60" cy="113" r="3.6" fill="var(--card)" stroke="var(--ink)" stroke-width="1" />
        <circle cx="64" cy="111" r="3.4" fill="var(--card)" stroke="var(--ink)" stroke-width="1" />
        <circle cx="69" cy="106" r="3.2" fill="var(--card)" stroke="var(--ink)" stroke-width="1" />
      </g>
    {:else if look.tie}
      <!-- Knotted necktie with clip -->
      <path d="M56 94 h8 l-1 6 h-6 Z" fill={v(look.tie, 'alert')} stroke="var(--ink)" stroke-width="1.5" />
      <path d="M57 100 L63 100 L66 128 L60 138 L54 128 Z" fill={v(look.tie, 'alert')} stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round" />
      <!-- Gold tie-clip -->
      <line x1="56" y1="116" x2="64" y2="116" stroke="var(--gold)" stroke-width="2" />
    {/if}

    <!-- Props & Poses -->
    {#if prop === 'clipboard'}
      <rect x="86" y="98" width="18" height="46" rx="9" fill={look.shirtOnly ? 'var(--art-shirt)' : suit} stroke="var(--ink)" stroke-width="1.5" />
      <g transform="rotate(8 92 144)">
        <rect x="72" y="116" width="40" height="54" rx="4" fill="var(--art-wood-light)" stroke="var(--ink)" stroke-width="2" />
        <rect x="77" y="124" width="30" height="40" rx="2" fill="var(--card)" stroke="var(--ink)" stroke-width="1" />
        <path d="M81 134 h22 M81 142 h22 M81 150 h14" stroke="var(--ink-soft)" stroke-width="2" stroke-linecap="round" />
        <rect x="85" y="112" width="14" height="8" rx="2" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="1.2" />
      </g>
      <circle cx="108" cy="150" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
    {:else if prop === 'folder'}
      <rect x="86" y="98" width="18" height="46" rx="9" fill={look.shirtOnly ? 'var(--art-shirt)' : suit} stroke="var(--ink)" stroke-width="1.5" />
      <g transform="rotate(12 92 144)">
        <rect x="70" y="120" width="44" height="48" rx="3" fill="var(--gold)" stroke="var(--ink)" stroke-width="2" />
        <path d="M70 120 h16 l4 5 h24 v43 h-44 Z" fill="var(--gold-dark)" stroke="var(--ink)" stroke-width="1.5" />
        <rect x="76" y="128" width="32" height="34" rx="2" fill="var(--card)" />
        <line x1="80" y1="136" x2="102" y2="136" stroke="var(--alert)" stroke-width="2" />
      </g>
      <circle cx="106" cy="150" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
    {:else if prop === 'coffee'}
      <rect x="86" y="98" width="18" height="46" rx="9" fill={look.shirtOnly ? 'var(--art-shirt)' : suit} stroke="var(--ink)" stroke-width="1.5" />
      <g transform="translate(86 130)">
        <path d="M4 14 h18 l-2 18 h-14 Z" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
        <path d="M20 18 h6 a4 4 0 0 1 0 8 h-5" fill="none" stroke="var(--ink)" stroke-width="2" />
        <!-- Steam curl -->
        <path d="M9 10 Q12 6 9 2 M16 10 Q19 6 16 2" fill="none" stroke="var(--ink-soft)" stroke-width="1.5" opacity=".5" stroke-linecap="round" />
      </g>
      <circle cx="95" cy="152" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
    {:else if prop === 'gavel'}
      <rect x="86" y="98" width="18" height="46" rx="9" fill={look.shirtOnly ? 'var(--art-shirt)' : suit} stroke="var(--ink)" stroke-width="1.5" />
      <g transform="rotate(-20 92 144)">
        <rect x="88" y="120" width="6" height="36" rx="2" fill="var(--art-wood)" stroke="var(--ink)" stroke-width="1.5" />
        <rect x="80" y="112" width="22" height="12" rx="3" fill="var(--art-wood-dark)" stroke="var(--ink)" stroke-width="2" />
        <rect x="87" y="112" width="8" height="12" fill="var(--gold)" />
      </g>
      <circle cx="94" cy="148" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
    {:else if prop === 'mic'}
      <rect x="86" y="98" width="18" height="46" rx="9" fill={look.shirtOnly ? 'var(--art-shirt)' : suit} stroke="var(--ink)" stroke-width="1.5" />
      <g transform="translate(88 126)">
        <rect x="6" y="14" width="5" height="24" rx="2" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="1.5" />
        <rect x="3" y="4" width="11" height="13" rx="4" fill="var(--hair-2)" stroke="var(--ink)" stroke-width="1.8" />
        <rect x="1" y="13" width="15" height="7" rx="1.5" fill="var(--alert)" stroke="var(--ink)" stroke-width="1.2" />
      </g>
      <circle cx="96" cy="152" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
    {/if}

    {#if pose === 'point'}
      <g class="point">
        <rect x="14" y="96" width="18" height="58" rx="9" fill={look.shirtOnly ? 'var(--art-shirt)' : suit} stroke="var(--ink)" stroke-width="1.5" transform="rotate(130 23 104)" />
        <circle cx="-17" cy="71" r="8.5" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
        <rect x="-30" y="62" width="14" height="6" rx="3" fill={skin} stroke="var(--ink)" stroke-width="1.5" transform="rotate(-30 -24 64)" />
      </g>
    {:else if pose === 'wave'}
      <g class="point">
        <rect x="14" y="96" width="18" height="58" rx="9" fill={look.shirtOnly ? 'var(--art-shirt)' : suit} stroke="var(--ink)" stroke-width="1.5" transform="rotate(145 23 104)" />
        <circle cx="-21" cy="62" r="8.5" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
        <path d="M-30 52 L-26 50 L-22 53" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" />
      </g>
    {/if}

    <!-- Head Anatomy: Contoured face, ears, hairstyle, eyebrows, eyes, nose, and expressive mouth -->
    <g class="head">
      <!-- Ears with inner ear detail -->
      <g class="ears">
        <path d="M30 48 C24 48 24 62 30 62 Z" fill={skin} stroke="var(--ink)" stroke-width="2" />
        <path d="M28 52 C26 52 26 58 28 58" fill="none" stroke="var(--ink-soft)" stroke-width="1.5" />
        <path d="M90 48 C96 48 96 62 90 62 Z" fill={skin} stroke="var(--ink)" stroke-width="2" />
        <path d="M92 52 C94 52 94 58 92 58" fill="none" stroke="var(--ink-soft)" stroke-width="1.5" />
      </g>

      <!-- Head base with chin curve -->
      <rect x="30" y="10" width="60" height="88" rx="30" fill={skin} stroke="var(--ink)" stroke-width="2" />

      <!-- Subtle cheek contour shadow for editorial depth -->
      <path d="M32 50 C36 78 50 94 60 96 C40 94 32 76 32 50 Z" fill="var(--ink)" opacity=".08" />

      <!-- Hairstyles -->
      {#if look.hairStyle === 'short'}
        <path d="M30 46 Q28 8 60 8 Q92 8 90 46 Q86 28 60 26 Q34 28 30 46 Z" fill={hair} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
      {:else if look.hairStyle === 'side' || look.hairStyle === 'parted'}
        <!-- Classic Executive Side-Part -->
        <path d="M28 48 Q26 6 60 6 Q94 8 92 46 Q84 22 54 26 Q36 30 28 48 Z" fill={hair} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
        <path d="M42 10 Q52 14 62 10" fill="none" stroke="var(--ink-soft)" stroke-width="1.5" opacity=".6" />
      {:else if look.hairStyle === 'swept'}
        <!-- Swept-back Pompadour / Executive Wave -->
        <path d="M28 46 Q26 2 60 2 Q94 2 92 46 Q86 20 60 18 Q34 20 28 46 Z" fill={hair} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
        <path d="M36 18 Q60 12 84 18" fill="none" stroke="var(--card)" stroke-width="1.5" opacity=".35" />
      {:else if look.hairStyle === 'bun'}
        <!-- Editorial Crown Bun -->
        <circle cx="60" cy="6" r="14" fill={hair} stroke="var(--ink)" stroke-width="2" />
        <path d="M28 58 Q24 8 60 10 Q96 8 92 58 Q90 30 60 26 Q30 30 28 58 Z" fill={hair} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
      {:else if look.hairStyle === 'cropped'}
        <!-- Textured Crop -->
        <path d="M29 44 Q28 8 60 8 Q92 8 91 44 Q84 32 60 30 Q36 32 29 44 Z" fill={hair} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
        <path d="M40 18 l4 4 M58 16 l4 4 M74 18 l4 4" stroke="var(--ink)" stroke-width="1.8" />
      {/if}

      <!-- Eyebrows reacting to mood -->
      <g class="eyebrows">
        {#if effectiveMood === 'confident'}
          <path d="M42 47 Q48 44 54 46" fill="none" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round" />
          <path d="M66 46 Q72 44 78 47" fill="none" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round" />
        {:else if effectiveMood === 'stressed'}
          <!-- Furrowed inward and downward -->
          <path d="M42 49 Q48 47 54 44" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
          <path d="M66 44 Q72 47 78 49" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
        {:else if effectiveMood === 'scheming'}
          <!-- One raised eyebrow, one lowered -->
          <path d="M42 49 Q48 48 54 46" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
          <path d="M66 43 Q72 39 78 43" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
        {:else if effectiveMood === 'panicked'}
          <!-- High arched distressed eyebrows -->
          <path d="M42 43 Q48 39 54 42" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
          <path d="M66 42 Q72 39 78 43" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
        {:else if effectiveMood === 'triumphant'}
          <!-- High curved joyous brows -->
          <path d="M42 44 Q48 41 54 44" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
          <path d="M66 44 Q72 41 78 44" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
        {/if}
      </g>

      <!-- Eyes: Sclera + Pupil + White Catchlight -->
      <g class="eyes blink" style="animation-delay:{-delay * 1.7}s">
        {#if effectiveMood === 'scheming'}
          <!-- Half-lidded narrowed eyes -->
          <ellipse cx="48" cy="56" rx="5" ry="3.2" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" />
          <circle cx="49" cy="56" r="2.4" fill="var(--ink)" />
          <ellipse cx="72" cy="56" rx="5" ry="3.2" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" />
          <circle cx="73" cy="56" r="2.4" fill="var(--ink)" />
        {:else if effectiveMood === 'panicked'}
          <!-- Wide pupils with shrunk iris -->
          <ellipse cx="48" cy="56" rx="6" ry="6" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" />
          <circle cx="48" cy="56" r="2.2" fill="var(--ink)" />
          <ellipse cx="72" cy="56" rx="6" ry="6" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" />
          <circle cx="72" cy="56" r="2.2" fill="var(--ink)" />
        {:else}
          <!-- Standard expressive eye -->
          <ellipse cx="48" cy="56" rx="5" ry="4.5" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" />
          <circle cx="48" cy="56" r="3.2" fill="var(--ink)" />
          <circle cx="49.5" cy="54.5" r="1.2" fill="var(--card)" />
          <ellipse cx="72" cy="56" rx="5" ry="4.5" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" />
          <circle cx="72" cy="56" r="3.2" fill="var(--ink)" />
          <circle cx="73.5" cy="54.5" r="1.2" fill="var(--card)" />
        {/if}
      </g>

      <!-- Nose Bridge & Tip Contour -->
      <path d="M60 48 L62 57 L58 58" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Horn-rimmed Glasses -->
      {#if hasGlasses}
        <g fill="none" stroke="var(--ink)" stroke-width="2.5">
          <rect x="38" y="48" width="20" height="15" rx="5" />
          <rect x="62" y="48" width="20" height="15" rx="5" />
          <path d="M58 54 h4" stroke-linecap="round" />
        </g>
      {/if}

      <!-- Under-eye stress creases when stressed -->
      {#if effectiveMood === 'stressed'}
        <path d="M44 63 Q48 65 52 63" fill="none" stroke="var(--ink-soft)" stroke-width="1.5" />
        <path d="M68 63 Q72 65 76 63" fill="none" stroke="var(--ink-soft)" stroke-width="1.5" />
      {/if}

      <!-- Temple Sweat Droplet for Stressed or Panicked -->
      {#if effectiveMood === 'stressed' || effectiveMood === 'panicked'}
        <g data-testid="char-sweat">
          <path d="M84 44 C84 40 88 36 88 36 C88 36 92 40 92 44 C92 46.5 90 48 88 48 C86 48 84 46.5 84 44 Z" fill="var(--sky)" stroke="var(--ink)" stroke-width="1.2" />
          {#if effectiveMood === 'panicked'}
            <path d="M26 44 C26 40 30 36 30 36 C30 36 34 40 34 44 C34 46.5 32 48 30 48 C28 48 26 46.5 26 44 Z" fill="var(--sky)" stroke="var(--ink)" stroke-width="1.2" />
          {/if}
        </g>
      {/if}

      <!-- Triumphant Gold Sparkle -->
      {#if effectiveMood === 'triumphant'}
        <g data-testid="char-sparkle" transform="translate(86 28)">
          <path d="M5 0 L6.5 3.5 L10 5 L6.5 6.5 L5 10 L3.5 6.5 L0 5 L3.5 3.5 Z" fill="var(--gold)" stroke="var(--ink)" stroke-width="1" />
        </g>
      {/if}

      <!-- Mouth: Mood-reactive and speech-reactive -->
      {#if talking}
        <ellipse class="talk" cx="60" cy="74" rx="7" ry="5.5" fill="var(--alert-dark)" stroke="var(--ink)" stroke-width="2" />
      {:else if effectiveMood === 'confident'}
        <path d="M50 72 Q60 80 70 72" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" />
      {:else if effectiveMood === 'stressed'}
        <path d="M50 75 Q55 71 60 75 Q65 79 70 74" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
      {:else if effectiveMood === 'scheming'}
        <!-- Asymmetric sly smirk -->
        <path d="M49 75 Q56 75 66 70" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" />
      {:else if effectiveMood === 'panicked'}
        <!-- Agonized open oval -->
        <ellipse cx="60" cy="74" rx="6" ry="7" fill="var(--alert-dark)" stroke="var(--ink)" stroke-width="2" />
      {:else if effectiveMood === 'triumphant'}
        <!-- Broad joyous grin with teeth -->
        <path d="M47 70 Q60 84 73 70 Z" fill="var(--art-shirt)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
        <path d="M48 70 h24" stroke="var(--ink)" stroke-width="2" />
      {/if}
    </g>
  </g>
</g>

<style>
  .breathe { transform-box: fill-box; transform-origin: center bottom; animation: breathe 3.4s ease-in-out infinite; }
  .blink { transform-box: fill-box; transform-origin: center; animation: blink 4.6s infinite; }
  .talk { transform-box: fill-box; transform-origin: center top; animation: talk .26s ease-in-out infinite alternate; }
  .point { transform-box: fill-box; transform-origin: 85% 70%; animation: point 2.6s ease-in-out infinite; }
  @keyframes breathe { 50% { transform: scaleY(1.018); } }
  @keyframes blink { 0%, 93%, 100% { transform: scaleY(1); } 96% { transform: scaleY(.1); } }
  @keyframes talk { to { transform: scaleY(.35); } }
  @keyframes point { 50% { transform: rotate(-6deg); } }
</style>
