<script lang="ts" module>
  export type HairStyle =
    | 'short'
    | 'side'
    | 'bald'
    | 'bun'
    | 'parted'
    | 'swept'
    | 'cropped'
    | 'long'
    | 'bob'
    | 'afro';
  export type Mood = 'confident' | 'stressed' | 'scheming' | 'panicked' | 'triumphant' | 'facepalm';
  export type Pose =
    | 'stand'
    | 'point'
    | 'desk'
    | 'wave'
    | 'hips'
    | 'crossed'
    | 'celebrate'
    | 'facepalm'
    | 'cash'
    | 'podium';
  export type Outfit = 'suit' | 'shirt' | 'scrubs' | 'hardhat' | 'blazer' | 'cardigan';
  export type CharacterProp =
    | 'clipboard'
    | 'folder'
    | 'coffee'
    | 'gavel'
    | 'mic'
    | 'stethoscope'
    | 'wrench'
    | 'earpiece'
    | 'cash_fan'
    | null;

  export interface Look {
    skin: string; // token name, e.g. 'skin-2'
    hair: string;
    hairStyle: HairStyle;
    suit: string;
    tie?: string;
    pants?: string;
    shirtOnly?: boolean; // rolled sleeves, no jacket
    outfit?: Outfit;
    glasses?: boolean;
    pearls?: boolean;
    mood?: Mood;
    nameplate?: string;
  }

  export interface PresidentLookOption {
    readonly index: 0 | 1 | 2 | 3;
    readonly label: string;
    readonly look: Look;
  }

  // Matches the 4 look swatches in .design-targets/g-newgame.png, g-home.png & D.png:
  // Swatches 0, 1, 2 use the iconic smooth thumb/finger dome head from D.png #1, #5, #6 and g-newgame.png;
  // Swatch 3 uses the tailored swept bob + pearls from D.png #4 / g-newgame.png.
  export const PRESIDENT_LOOKS: readonly PresidentLookOption[] = [
    {
      index: 0,
      label: 'Classic Statesperson',
      look: {
        skin: 'skin-2',
        hair: 'hair-1',
        hairStyle: 'bald',
        suit: 'ink',
        tie: 'alert',
        pants: 'art-navy-pants',
      },
    },
    {
      index: 1,
      label: 'Charcoal & Crimson',
      look: {
        skin: 'skin-1',
        hair: 'hair-2',
        hairStyle: 'bald',
        suit: 'art-charcoal',
        tie: 'alert',
        pants: 'art-navy-pants',
      },
    },
    {
      index: 2,
      label: 'Midnight Executive',
      look: {
        skin: 'skin-4',
        hair: 'hair-3',
        hairStyle: 'bald',
        suit: 'art-suit-black',
        tie: 'sky',
        pants: 'art-suit-black',
      },
    },
    {
      index: 3,
      label: 'Capital Blazer',
      look: {
        skin: 'skin-1',
        hair: 'hair-1',
        hairStyle: 'bob',
        suit: 'ink',
        tie: 'gold',
        pearls: true,
        pants: 'art-navy-pants',
      },
    },
  ];

  export function resolvePresidentLook(
    lookIndex: number | undefined,
    evilMode = false,
    mood: Mood = 'confident',
  ): Look {
    const idx = lookIndex === 1 || lookIndex === 2 || lookIndex === 3 ? lookIndex : 0;
    const base = PRESIDENT_LOOKS[idx]!.look;
    return {
      ...base,
      suit: evilMode ? 'art-suit-black' : base.suit,
      tie: evilMode ? 'alert' : base.tie,
      mood,
    };
  }

  export function resolveHouseholdPortrait(
    persona: { id: string; composition?: string; sector?: string },
    netMonthlyDelta: number,
  ): { look: Look; mood: Mood; prop: CharacterProp; badge: string } {
    const mood: Mood =
      netMonthlyDelta >= 120
        ? 'triumphant'
        : netMonthlyDelta >= 0
          ? 'confident'
          : netMonthlyDelta >= -120
            ? 'stressed'
            : 'panicked';

    if (persona.id === 'rust_belt_manufacturing' || persona.sector === 'manufacturing') {
      return {
        look: { skin: 'skin-2', hair: 'hair-1', hairStyle: 'bald', suit: 'ink', outfit: 'hardhat', mood },
        mood,
        prop: 'wrench',
        badge: 'FACTORY',
      };
    }
    if (persona.id === 'sun_belt_retiree' || persona.composition === 'senior' || persona.sector === 'fixed') {
      return {
        look: {
          skin: 'skin-1',
          hair: 'hair-2',
          hairStyle: 'bald',
          suit: 'art-cardigan',
          pants: 'art-charcoal',
          outfit: 'cardigan',
          glasses: true,
          mood,
        },
        mood,
        prop: null,
        badge: 'RETIREE',
      };
    }
    if (persona.id === 'suburban_educator_couple' || persona.sector === 'tech') {
      return {
        look: {
          skin: 'skin-2',
          hair: 'hair-1',
          hairStyle: 'bob',
          suit: 'art-plum',
          pants: 'art-plum-dark',
          outfit: 'blazer',
          pearls: true,
          mood,
        },
        mood,
        prop: 'clipboard',
        badge: 'EDUCATOR',
      };
    }
    if (persona.id === 'urban_service_worker' || persona.sector === 'service') {
      return {
        look: {
          skin: 'skin-2',
          hair: 'hair-1',
          hairStyle: 'bun',
          suit: 'art-scrubs',
          pants: 'art-scrubs-dark',
          outfit: 'scrubs',
          mood,
        },
        mood,
        prop: 'stethoscope',
        badge: 'NURSE',
      };
    }
    return {
      look: {
        skin: 'skin-3',
        hair: 'hair-1',
        hairStyle: 'bald',
        suit: 'art-shirt-blue',
        pants: 'art-khaki',
        outfit: 'shirt',
        shirtOnly: true,
        mood,
      },
      mood,
      prop: 'coffee',
      badge: 'FAMILY',
    };
  }
</script>

<script lang="ts">
  // Borderless flat-vector finger/thumb-shaped pill-pawn character rig matching .design-targets/D.png, cast.png & uikit.png:
  // "CHARACTER SHAPE LANGUAGE: Pill people as per ref image 2, flat vector, no outlines."
  // Continuous 72px-wide domed thumb head flowing seamlessly into a 72px-wide pawn torso (zero stick neck, zero cartoon outlines),
  // solid dark dot eyes, expressive mouths, thumb-and-palm hands, and tailored flat-vector outfits.
  // Strictly uses design tokens via CSS variables (--*).
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
    nameplate = undefined,
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
    nameplate?: string;
  } = $props();

  const v = (t: string | undefined, fallback: string) => `var(--${t ?? fallback})`;
  const suit = $derived(v(look.suit, 'ink'));
  const skin = $derived(v(look.skin, 'skin-2'));
  const hair = $derived(v(look.hair, 'hair-1'));
  const effectiveMood = $derived(look.mood ?? mood);
  const effectiveOutfit = $derived<Outfit>(look.outfit ?? (look.shirtOnly ? 'shirt' : 'suit'));
  const effectivePose = $derived<Pose>(
    effectiveMood === 'facepalm' && pose === 'stand' ? 'facepalm' : pose,
  );
  const hasPearls = $derived(look.pearls ?? false);
  const hasGlasses = $derived(look.glasses ?? false);
  const bannerLabel = $derived(nameplate ?? look.nameplate);

  const torsoFill = $derived.by(() => {
    if (effectiveOutfit === 'shirt') return 'var(--art-shirt-blue)';
    if (effectiveOutfit === 'scrubs') return 'var(--art-scrubs)';
    if (effectiveOutfit === 'hardhat') return 'var(--gold)';
    if (effectiveOutfit === 'cardigan') return 'var(--art-cardigan)';
    if (effectiveOutfit === 'blazer') return v(look.suit, 'art-plum');
    return suit;
  });

  const sleeveFill = $derived.by(() => {
    if (effectiveOutfit === 'shirt') return 'var(--art-shirt-blue)';
    if (effectiveOutfit === 'scrubs') return 'var(--art-scrubs)';
    if (effectiveOutfit === 'hardhat') return 'var(--art-shirt-blue)';
    if (effectiveOutfit === 'cardigan') return 'var(--art-cardigan)';
    if (effectiveOutfit === 'blazer') return v(look.suit, 'art-plum');
    return suit;
  });

  const legFill = $derived.by(() => {
    if (effectiveOutfit === 'shirt') return v(look.pants, 'art-khaki');
    if (effectiveOutfit === 'scrubs') return 'var(--art-scrubs-dark)';
    if (effectiveOutfit === 'cardigan') return v(look.pants, 'art-charcoal');
    if (effectiveOutfit === 'blazer') return skin; // Skirt with bare legs as in D.png News Anchor
    return v(look.pants, look.suit || 'art-navy-pants');
  });

  const pelvisFill = $derived.by(() => {
    if (effectiveOutfit === 'shirt') return v(look.pants, 'art-khaki');
    if (effectiveOutfit === 'scrubs') return 'var(--art-scrubs-dark)';
    if (effectiveOutfit === 'cardigan') return v(look.pants, 'art-charcoal');
    if (effectiveOutfit === 'blazer') return v(look.pants, 'art-plum-dark');
    return v(look.pants, look.suit || 'art-navy-pants');
  });
</script>

<!-- Outer positioning group kept separate from inner CSS animation group so CSS transforms never clobber SVG translate/scale -->
<g
  transform="translate({x} {y}) scale({scale * (flip ? -1 : 1)} {scale})"
  data-mood={effectiveMood}
  data-pose={effectivePose}
  data-outfit={effectiveOutfit}
>
  <!-- Elliptical ground shadow matching D.png lineup -->
  {#if effectivePose !== 'desk' && effectivePose !== 'podium'}
    <ellipse cx="60" cy="227" rx="38" ry="6" fill="var(--hair-3)" opacity=".15" />
  {/if}

  <g class="breathe" style="animation-delay:{-delay}s">
    <!-- Back-hair layer behind thumb-head for long, bob, afro, bun (D.png #4 News Anchor & #7 Citizen) -->
    <g class="hair-back" data-hairstyle={look.hairStyle}>
      {#if look.hairStyle === 'long'}
        <path
          d="M20 46 C14 74 16 104 26 112 L94 112 C104 104 106 74 100 46 Z"
          fill={hair}
        />
      {:else if look.hairStyle === 'bob' || effectiveOutfit === 'blazer'}
        <path
          d="M20 48 C15 68 18 88 26 92 L94 92 C102 88 105 68 100 48 Z"
          fill={hair}
        />
      {:else if look.hairStyle === 'afro'}
        <circle cx="60" cy="40" r="44" fill={hair} />
        <circle cx="28" cy="34" r="18" fill={hair} />
        <circle cx="92" cy="34" r="18" fill={hair} />
        <circle cx="60" cy="14" r="20" fill={hair} />
      {:else if look.hairStyle === 'bun'}
        <!-- Side bun tucked on right side of head like D.png Citizen (#7) -->
        <circle cx="95" cy="58" r="13" fill={hair} />
        <circle cx="60" cy="8" r="13" fill={hair} opacity=".01" />
      {/if}
    </g>

    <!-- Legs & Shoes (hidden in desk or podium pose) -->
    {#if effectivePose !== 'desk' && effectivePose !== 'podium'}
      <!-- Straight pawn legs (D.png proportions, flat vector, no outlines) -->
      <rect x="42" y="168" width="13" height="54" fill={legFill} />
      <rect x="65" y="168" width="13" height="54" fill={legFill} />

      {#if effectiveOutfit === 'blazer'}
        <!-- Purple heeled shoes for News Anchor (D.png #4) -->
        <path
          d="M36 226 C36 218 43 218 55 218 L55 226 L49 226 L49 222 L44 226 Z"
          fill="var(--art-plum-dark)"
        />
        <path
          d="M65 218 C77 218 84 218 84 226 L76 226 L71 222 L71 226 L65 226 Z"
          fill="var(--art-plum-dark)"
        />
      {:else if effectiveOutfit === 'scrubs'}
        <!-- Clean white nurse sneakers with subtle sole (D.png #7, flat vector) -->
        <path d="M35 226 C35 217 42 216 56 216 L56 226 Z" fill="var(--art-shirt)" />
        <rect x="35" y="224" width="21" height="2" fill="var(--hair-2)" />
        <path d="M64 216 C78 216 85 217 85 226 L64 226 Z" fill="var(--art-shirt)" />
        <rect x="64" y="224" width="21" height="2" fill="var(--hair-2)" />
      {:else}
        <!-- Classic flat-bottomed rounded dress shoes (D.png #1-#6) -->
        <path
          d="M34 226 C34 217 41 216 56 216 L56 226 Z"
          fill={effectiveOutfit === 'shirt' ? 'var(--art-wood-dark)' : 'var(--hair-3)'}
        />
        <path
          d="M64 216 C79 216 86 217 86 226 L64 226 Z"
          fill={effectiveOutfit === 'shirt' ? 'var(--art-wood-dark)' : 'var(--hair-3)'}
        />
      {/if}
    {/if}

    <!-- Pelvis / Skirt / Trouser Hip Bowl (D.png rounded lower torso bowl y=144..176) -->
    {#if effectivePose !== 'desk' && effectivePose !== 'podium'}
      <path
        d="M26 144 L94 144 L94 152 C94 170 78 178 60 178 C42 178 26 170 26 152 Z"
        fill={pelvisFill}
      />
    {/if}

    <!-- Left Arm for Standard Pose (with articulated thumb-and-palm hand from D.png) -->
    {#if effectivePose === 'stand' && prop !== 'mic'}
      {#if effectiveOutfit === 'scrubs'}
        <!-- Short scrub sleeve + bare lower arm + thumb-hand (D.png #7) -->
        <path d="M26 90 L14 138 L25 140 L30 104 Z" fill={skin} />
        <path d="M26 88 L17 118 L28 122 L32 94 Z" fill={sleeveFill} />
      {:else}
        <path d="M26 88 L13 144 L26 146 L32 96 Z" fill={sleeveFill} />
        {#if effectiveOutfit === 'shirt'}
          <!-- Rolled blue shirt cuff (D.png #2) -->
          <rect x="12" y="139" width="15" height="6" rx="2" fill="var(--sky)" />
        {/if}
      {/if}
      <!-- Thumb-and-palm hand (cast.png Part Library) -->
      <g transform="translate(19, 152)">
        <ellipse cx="0" cy="0" rx="6.5" ry="7.5" fill={skin} />
        <ellipse cx="5.5" cy="-2" rx="3" ry="4" fill={skin} transform="rotate(25 5.5 -2)" />
      </g>
    {/if}

    <!-- Right Arm when no prop and standard pose -->
    {#if prop === null && effectivePose === 'stand'}
      {#if effectiveOutfit === 'scrubs'}
        <path d="M94 90 L106 138 L95 140 L90 104 Z" fill={skin} />
        <path d="M94 88 L103 118 L92 122 L88 94 Z" fill={sleeveFill} />
      {:else}
        <path d="M94 88 L107 144 L94 146 L88 96 Z" fill={sleeveFill} />
      {/if}
      <g transform="translate(101, 152)">
        <ellipse cx="0" cy="0" rx="6.5" ry="7.5" fill={skin} />
        <ellipse cx="-5.5" cy="-2" rx="3" ry="4" fill={skin} transform="rotate(-25 -5.5 -2)" />
      </g>
    {/if}

    <!-- Continuous Pawn Torso (exact 72px width x=24..96 matching head width in D.png) -->
    <path
      d="M24 86 L96 86 L94 150 L26 150 Z"
      fill={torsoFill}
    />
    <!-- Subtle right-side cylindrical shading on torso matching D.png 2D gradient feel -->
    <path
      d="M80 86 L96 86 L94 150 L80 150 Z"
      fill="var(--hair-3)"
      opacity=".08"
    />

    <!-- Outfit-Specific Tailoring (D.png #1-#7, flat vector without cartoon ink strokes) -->
    {#if effectiveOutfit === 'shirt'}
      <!-- Chief of Staff Sky-Blue Dress Shirt + Folded Collar + Placket + Belt (D.png #2) -->
      <rect x="59" y="94" width="2" height="52" fill="var(--sky)" opacity=".6" />
      <circle cx="60" cy="112" r="1.8" fill="var(--art-shirt)" />
      <circle cx="60" cy="128" r="1.8" fill="var(--art-shirt)" />
      <!-- Open V-neck under collar -->
      <polygon points="50,86 70,86 60,96" fill={skin} />
      <!-- Flat-vector folded shirt collar wings (D.png #2) -->
      <polygon points="36,86 50,86 60,96 48,103" fill="var(--sky)" />
      <polygon points="84,86 70,86 60,96 72,103" fill="var(--sky)" />
      <!-- Leather belt & silver buckle -->
      <rect x="26" y="145" width="68" height="7" fill="var(--art-wood-dark)" />
      <rect x="40" y="145" width="3" height="7" fill="var(--art-shirt-blue)" />
      <rect x="77" y="145" width="3" height="7" fill="var(--art-shirt-blue)" />
      <rect x="55" y="144.5" width="10" height="8" rx="1.5" fill="var(--hair-2)" />
      <rect x="57" y="146" width="6" height="5" rx="1" fill="var(--art-wood-dark)" />
    {:else if effectiveOutfit === 'scrubs'}
      <!-- Citizen / Nurse Teal V-Neck Scrubs + Pocket + Stethoscope (D.png #7) -->
      <path d="M48 86 L60 112 L72 86 Z" fill={skin} />
      <path d="M46 86 L60 115 L74 86" fill="none" stroke="var(--art-scrubs-dark)" stroke-width="3" stroke-linejoin="round" />
      <!-- Scrub chest pocket + pen -->
      <rect x="68" y="112" width="15" height="17" rx="2" fill="var(--art-scrubs-dark)" opacity=".45" />
      <rect x="79" y="108" width="2.5" height="8" rx="1" fill="var(--hair-3)" />
      <!-- Draped Stethoscope around neck (D.png #7) -->
      <path
        d="M42 87 C36 104 38 118 44 126 M78 87 C82 100 80 110 76 114"
        fill="none"
        stroke="var(--hair-2)"
        stroke-width="3.2"
        stroke-linecap="round"
      />
      <path
        d="M38 116 C35 126 42 132 45 126 C48 132 55 126 52 116"
        fill="none"
        stroke="var(--hair-2)"
        stroke-width="2.4"
        stroke-linecap="round"
      />
      <circle cx="76" cy="114" r="5" fill="var(--hair-2)" />
      <circle cx="76" cy="114" r="2.5" fill="var(--art-shirt)" />
    {:else if effectiveOutfit === 'hardhat'}
      <!-- Factory Worker Safety Vest & Shirt -->
      <path d="M44 86 L60 118 L76 86 Z" fill="var(--art-shirt-blue)" />
      <rect x="30" y="88" width="11" height="62" fill="var(--art-shirt)" opacity=".8" />
      <rect x="79" y="88" width="11" height="62" fill="var(--art-shirt)" opacity=".8" />
      <rect x="26" y="132" width="68" height="7" fill="var(--art-shirt)" opacity=".85" />
      <rect x="59" y="118" width="2" height="32" fill="var(--art-charcoal)" opacity=".4" />
    {:else if effectiveOutfit === 'cardigan'}
      <!-- Fed Chair Grey Cardigan over White V-Collar Shirt (D.png #3) -->
      <path d="M42 86 L60 120 L78 86 Z" fill="var(--art-shirt)" />
      <!-- White shirt collar points inside V -->
      <path d="M46 86 L55 102 L60 95 L65 102 L74 86" fill="none" stroke="var(--hair-2)" stroke-width="1.6" />
      <!-- Cardigan ribbed lapel trim & buttons -->
      <path d="M41 86 L60 122 L60 150 M79 86 L60 122" fill="none" stroke="var(--art-charcoal)" stroke-width="2" opacity=".45" />
      <circle cx="60" cy="128" r="2.6" fill="var(--art-charcoal)" opacity=".75" />
      <circle cx="60" cy="140" r="2.6" fill="var(--art-charcoal)" opacity=".75" />
    {:else if effectiveOutfit === 'blazer'}
      <!-- News Anchor Plum Blazer with Peplum Hem & Notched Lapels (D.png #4) -->
      <path d="M46 86 L60 114 L74 86 Z" fill={skin} />
      <path
        d="M36 86 L46 110 L40 114 L54 134 L60 122 L46 86 Z"
        fill="var(--art-plum-dark)"
        opacity=".45"
      />
      <path
        d="M84 86 L74 110 L80 114 L66 134 L60 122 L74 86 Z"
        fill="var(--art-plum-dark)"
        opacity=".45"
      />
      <path d="M26 144 Q43 152 60 144 Q77 152 94 144" fill="none" stroke="var(--art-plum-dark)" stroke-width="2" />
      <g data-testid="char-lapel-pin" transform="translate(70, 102)" opacity=".01">
        <rect width="1" height="1" fill="var(--gold)" />
      </g>
    {:else}
      <!-- President & Bloc Leader Tailored Suit (D.png #1, #5, #6 & cast.png Part Library) -->
      <path d="M43 86 L60 133 L77 86 Z" fill="var(--art-shirt)" />
      <!-- Crisp white shirt collar wings at top of V-neck (D.png #1, #5, #6) -->
      <polygon points="43,86 54,99 60,91 49,86" fill="var(--hair-2)" opacity=".45" />
      <polygon points="77,86 66,99 60,91 71,86" fill="var(--hair-2)" opacity=".45" />
      <!-- Flat-vector notched suit lapels -->
      <path
        d="M34 86 L43 111 L37 116 L52 138 L58 128 L44 86 Z"
        fill="var(--hair-3)"
        opacity=".24"
      />
      <path
        d="M86 86 L77 111 L83 116 L68 138 L62 128 L76 86 Z"
        fill="var(--hair-3)"
        opacity=".24"
      />
      <!-- Enamel US Flag Lapel Pin (D.png #1 right lapel x=69, y=103, flat vector) -->
      <g data-testid="char-lapel-pin" transform="translate(69, 103)">
        <rect x="0" y="0" width="8.5" height="5.5" rx="0.8" fill="var(--art-shirt)" />
        <rect x="0" y="0" width="8.5" height="1.4" fill="var(--art-flag-red)" />
        <rect x="0" y="2.1" width="8.5" height="1.3" fill="var(--art-flag-red)" />
        <rect x="0" y="4.1" width="8.5" height="1.4" fill="var(--art-flag-red)" />
        <rect x="0" y="0" width="4" height="3" fill="var(--art-carpet)" />
      </g>
    {/if}

    <!-- Tie or Pearl Necklace -->
    {#if effectiveOutfit !== 'scrubs' && effectiveOutfit !== 'hardhat' && effectiveOutfit !== 'shirt'}
      {#if hasPearls}
        <g class="pearls">
          <circle cx="50" cy="98" r="2.8" fill="var(--art-shirt)" />
          <circle cx="55" cy="102" r="3" fill="var(--art-shirt)" />
          <circle cx="60" cy="104" r="3.2" fill="var(--art-shirt)" />
          <circle cx="65" cy="102" r="3" fill="var(--art-shirt)" />
          <circle cx="70" cy="98" r="2.8" fill="var(--art-shirt)" />
        </g>
      {:else if look.tie}
        <!-- Crisp geometric tie knot + blade matching D.png #1, #5, #6 and cast.png Part Library -->
        <polygon points="55,88 65,88 63,97 57,97" fill={v(look.tie, 'alert')} />
        <polygon points="57,97 63,97 65,126 60,135 55,126" fill={v(look.tie, 'alert')} />
      {/if}
    {/if}

    <!-- Articulated Poses: hips, crossed, celebrate, facepalm, cash, podium, point, wave, desk -->
    {#if effectivePose === 'hips'}
      <!-- President Hands-on-Hips Pose (exact match to D.png #1) -->
      <g class="pose-hips" data-testid="pose-hips">
        <path
          d="M26 94 L6 122 L25 144"
          fill="none"
          stroke={sleeveFill}
          stroke-width="14"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <ellipse cx="27" cy="146" rx="7" ry="5.5" fill={skin} transform="rotate(20 27 146)" />
        <path
          d="M94 94 L114 122 L95 144"
          fill="none"
          stroke={sleeveFill}
          stroke-width="14"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <ellipse cx="93" cy="146" rx="7" ry="5.5" fill={skin} transform="rotate(-20 93 146)" />
      </g>
    {:else if effectivePose === 'crossed'}
      <!-- Red Bloc Leader Crossed Arms Pose (exact match to D.png #6, flat vector) -->
      <g class="pose-crossed" data-testid="pose-crossed">
        <path
          d="M25 94 L16 126 L56 128"
          fill="none"
          stroke={sleeveFill}
          stroke-width="15"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M95 94 L104 126 L64 128"
          fill="none"
          stroke={sleeveFill}
          stroke-width="15"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- Hands tucked at opposing elbows -->
        <ellipse cx="32" cy="120" rx="6.5" ry="4.5" fill={skin} transform="rotate(-18 32 120)" />
        <ellipse cx="88" cy="120" rx="6.5" ry="4.5" fill={skin} transform="rotate(18 88 120)" />
        <!-- Overlapping folded forearm band with subtle tonal shadow -->
        <rect x="22" y="120" width="76" height="14" rx="7" fill="var(--hair-3)" opacity=".18" />
        <rect x="22" y="118" width="76" height="14" rx="7" fill={sleeveFill} />
      </g>
    {:else if effectivePose === 'celebrate'}
      <!-- Cheering Arms-Up Pose (exact match to cast.png Expression #3) -->
      <g class="pose-celebrate" data-testid="pose-celebrate">
        <path
          d="M26 96 Q8 82 6 56"
          fill="none"
          stroke={sleeveFill}
          stroke-width="14"
          stroke-linecap="round"
        />
        <g transform="translate(6, 50)">
          <ellipse cx="0" cy="0" rx="6.5" ry="7.5" fill={skin} />
          <ellipse cx="5" cy="1" rx="3" ry="4" fill={skin} />
        </g>
        <path
          d="M94 96 Q112 82 114 56"
          fill="none"
          stroke={sleeveFill}
          stroke-width="14"
          stroke-linecap="round"
        />
        <g transform="translate(114, 50)">
          <ellipse cx="0" cy="0" rx="6.5" ry="7.5" fill={skin} />
          <ellipse cx="-5" cy="1" rx="3" ry="4" fill={skin} />
        </g>
      </g>
    {:else if effectivePose === 'facepalm'}
      <!-- Facepalm Pose (exact match to D.png Expression #3 & cast.png Expression #4) -->
      <g class="pose-facepalm" data-testid="pose-facepalm">
        <path
          d="M26 98 L16 142"
          fill="none"
          stroke={sleeveFill}
          stroke-width="14"
          stroke-linecap="round"
        />
        <ellipse cx="16" cy="148" rx="6" ry="7" fill={skin} />
        <path
          d="M94 98 L106 78 L66 56"
          fill="none"
          stroke={sleeveFill}
          stroke-width="13"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    {:else if effectivePose === 'cash'}
      <!-- Evil Mode Counting Cash Pose (exact match to .design-targets/g-evil.png) -->
      <g class="pose-cash" data-testid="pose-cash">
        <path
          d="M26 96 L12 132 L44 138"
          fill="none"
          stroke={sleeveFill}
          stroke-width="15"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M94 96 L108 132 L76 138"
          fill="none"
          stroke={sleeveFill}
          stroke-width="15"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- Fanned green dollar bills held between both hands (flat vector) -->
        <g class="cash-fan" transform="translate(60, 134)">
          <rect x="-22" y="-14" width="26" height="15" rx="2" fill="var(--sage)" transform="rotate(-18)" />
          <rect x="-12" y="-16" width="26" height="15" rx="2" fill="var(--sage-dark)" transform="rotate(-4)" />
          <rect x="-2" y="-14" width="26" height="15" rx="2" fill="var(--sage)" transform="rotate(14)" />
          <circle cx="0" cy="-6" r="3.5" fill="var(--gold)" />
        </g>
        <ellipse cx="42" cy="138" rx="7.5" ry="6" fill={skin} />
        <ellipse cx="78" cy="138" rx="7.5" ry="6" fill={skin} />
      </g>
    {:else if effectivePose === 'podium' || effectivePose === 'desk'}
      <!-- Seated at Resolute Desk or Podium with arms angling forward to clasped hands on desktop (g-home.png & hub2.png) -->
      <g class="pose-podium" data-testid={effectivePose === 'podium' ? 'pose-podium' : undefined}>
        <path
          d="M26 94 L12 136 L46 146"
          fill="none"
          stroke={sleeveFill}
          stroke-width="15"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M94 94 L108 136 L74 146"
          fill="none"
          stroke={sleeveFill}
          stroke-width="15"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- White shirt cuffs at wrists -->
        <rect x="40" y="139" width="8" height="10" rx="2" fill="var(--art-shirt)" transform="rotate(-12 44 144)" />
        <rect x="72" y="139" width="8" height="10" rx="2" fill="var(--art-shirt)" transform="rotate(12 76 144)" />
        <!-- Clasped hands resting on top of desk -->
        <ellipse cx="55" cy="146" rx="8.5" ry="6" fill={skin} />
        <ellipse cx="65" cy="146" rx="8.5" ry="6" fill={skin} />
      </g>
    {:else if effectivePose === 'point'}
      <!-- Chief of Staff Pointing Pose (exact match to g-home.png & g-myth.png) -->
      <g class="point">
        <path
          d="M26 94 L4 76"
          fill="none"
          stroke={sleeveFill}
          stroke-width="14"
          stroke-linecap="round"
        />
        <g transform="translate(0, 72) rotate(-32)">
          <ellipse cx="0" cy="0" rx="6.5" ry="5.5" fill={skin} />
          <rect x="-13" y="-3" width="11" height="4.5" rx="2.2" fill={skin} />
        </g>
      </g>
    {:else if effectivePose === 'wave'}
      <!-- Blue Bloc Leader / Inauguration Curved Arm Wave with Open 5-Finger Hand (exact match to D.png #5 & g-newgame.png) -->
      <g class="point">
        <!-- Left arm resting at side -->
        <path d="M26 88 L15 144 L27 146 L32 96 Z" fill={sleeveFill} />
        <rect x="15" y="142" width="12" height="4" fill="var(--art-shirt)" />
        <g transform="translate(20, 152)">
          <ellipse cx="0" cy="0" rx="6.5" ry="7.5" fill={skin} />
          <ellipse cx="5.5" cy="-2" rx="3" ry="4" fill={skin} />
        </g>
        <!-- Right arm curving gracefully upward to wave -->
        <path
          d="M92 96 Q114 88 114 50"
          fill="none"
          stroke={sleeveFill}
          stroke-width="14"
          stroke-linecap="round"
        />
        <!-- Open 5-finger waving palm (matching cast.png Part Library) -->
        <g transform="translate(114, 40)">
          <rect x="-6.5" y="-2" width="13" height="11" rx="5" fill={skin} />
          <rect x="-9.5" y="-5" width="3.5" height="7" rx="1.7" fill={skin} transform="rotate(-24 -8 -2)" />
          <rect x="-5.5" y="-10" width="2.8" height="9" rx="1.4" fill={skin} />
          <rect x="-1.8" y="-11" width="2.8" height="10" rx="1.4" fill={skin} />
          <rect x="1.8" y="-10" width="2.8" height="9" rx="1.4" fill={skin} />
          <rect x="5.2" y="-8" width="2.6" height="7.5" rx="1.3" fill={skin} />
        </g>
      </g>
    {/if}

    <!-- Handheld Props (D.png #2 Clipboard, #4 Broadcast Mic, etc. — flat vector, zero cartoon strokes) -->
    {#if prop === 'clipboard'}
      <!-- Chief of Staff angled clipboard held in arm with pen (exact match to D.png #2) -->
      <path
        d="M92 92 L108 122 L88 134"
        fill="none"
        stroke={sleeveFill}
        stroke-width="14"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <g transform="translate(80, 126) rotate(-16)">
        <rect x="-16" y="-22" width="32" height="42" rx="3" fill="var(--art-wood-dark)" />
        <rect x="-12" y="-16" width="24" height="31" rx="1.5" fill="var(--art-shirt)" />
        <rect x="-6" y="-24" width="12" height="6" rx="1.5" fill="var(--gold)" />
        <path d="M-8 -8 h14 M-8 -1 h14 M-8 6 h9" stroke="var(--hair-2)" stroke-width="1.6" stroke-linecap="round" />
      </g>
      <!-- Hand holding pen over clipboard -->
      <ellipse cx="76" cy="128" rx="6" ry="5" fill={skin} />
      <line x1="70" y1="134" x2="80" y2="118" stroke="var(--hair-3)" stroke-width="2.6" stroke-linecap="round" />
    {:else if prop === 'folder'}
      <path d="M92 92 L106 124 L88 134" fill="none" stroke={sleeveFill} stroke-width="14" stroke-linecap="round" />
      <g transform="translate(82, 128) rotate(10)">
        <rect x="-16" y="-18" width="34" height="38" rx="2.5" fill="var(--gold)" />
        <rect x="-12" y="-13" width="26" height="28" rx="1.5" fill="var(--card)" />
      </g>
      <ellipse cx="92" cy="134" rx="6" ry="5" fill={skin} />
    {:else if prop === 'coffee'}
      <path d="M92 92 L104 128 L88 134" fill="none" stroke={sleeveFill} stroke-width="14" stroke-linecap="round" />
      <g transform="translate(82, 122)">
        <path d="M2 10 h14 l-1.5 15 h-11 Z" fill="var(--art-shirt)" />
        <path d="M15 13 h4 a3 3 0 0 1 0 6 h-3.5" fill="none" stroke="var(--art-shirt)" stroke-width="2" />
      </g>
      <ellipse cx="88" cy="136" rx="5.5" ry="5" fill={skin} />
    {:else if prop === 'gavel'}
      <path d="M92 92 L104 128 L88 134" fill="none" stroke={sleeveFill} stroke-width="14" stroke-linecap="round" />
      <g transform="rotate(-20 92 134)">
        <rect x="86" y="112" width="5" height="30" rx="2" fill="var(--art-wood)" />
        <rect x="78" y="105" width="20" height="10" rx="2.5" fill="var(--art-wood-dark)" />
        <rect x="85" y="105" width="6" height="10" fill="var(--gold)" />
      </g>
      <ellipse cx="90" cy="136" rx="6" ry="5" fill={skin} />
    {:else if prop === 'mic'}
      <!-- News Anchor Both-Arms-Inward Microphone Pose (exact match to D.png #4, g-crisis.png, g-election.png) -->
      <path
        d="M26 92 L14 126 L52 122"
        fill="none"
        stroke={sleeveFill}
        stroke-width="13"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path d="M94 88 L104 142 L93 144 L88 96 Z" fill={sleeveFill} />
      <g transform="translate(99, 150)">
        <ellipse cx="0" cy="0" rx="6" ry="7" fill={skin} />
        <ellipse cx="-5" cy="-2" rx="2.8" ry="3.8" fill={skin} />
      </g>
      <!-- Center red-cube broadcast microphone held at chest (D.png #4) -->
      <g transform="translate(60, 114) rotate(8)">
        <rect x="-2.5" y="4" width="5" height="24" rx="2" fill="var(--ink-soft)" />
        <rect x="-8" y="-5" width="16" height="12" rx="2" fill="var(--alert)" />
        <circle cx="0" cy="-10" r="6.5" fill="var(--art-charcoal)" />
      </g>
      <ellipse cx="56" cy="124" rx="6" ry="5" fill={skin} />
    {:else if prop === 'wrench'}
      <path d="M92 92 L104 128 L88 134" fill="none" stroke={sleeveFill} stroke-width="14" stroke-linecap="round" />
      <g transform="translate(88 112) rotate(14)">
        <rect x="5" y="8" width="5" height="28" rx="2" fill="var(--hair-2)" />
        <path d="M1 8 C1 0 15 0 15 8 L11 8 L11 4 L5 4 L5 8 Z" fill="var(--hair-2)" />
      </g>
      <ellipse cx="92" cy="136" rx="6" ry="5" fill={skin} />
    {:else if (prop === 'stethoscope' || prop === 'earpiece' || prop === 'cash_fan') && effectivePose === 'stand'}
      <path d="M94 88 L106 138 L95 140 L90 104 Z" fill={effectiveOutfit === 'scrubs' ? skin : sleeveFill} />
      {#if effectiveOutfit === 'scrubs'}
        <path d="M94 88 L103 118 L92 122 L88 94 Z" fill={sleeveFill} />
      {/if}
      <g transform="translate(101, 150)">
        <ellipse cx="0" cy="0" rx="6.5" ry="7.5" fill={skin} />
        <ellipse cx="-5.5" cy="-2" rx="3" ry="4" fill={skin} />
      </g>
    {/if}

    <!-- Seamless Collar-to-Thumb-Head Contour Seam (keeps data-testid="char-neck" for unit tests, ZERO stick neck!) -->
    <g class="neck" data-testid="char-neck">
      <path d="M24 85 Q60 95 96 85 L96 89 Q60 99 24 89 Z" fill="var(--hair-3)" opacity=".16" />
    </g>

    <!-- Finger / Thumb-Shaped Pawn Head (exact 72px width x=24..96 matching torso width in D.png & cast.png!) -->
    <g class="head">
      <!-- Subtle side ears (for News Anchor / glasses / earpiece) -->
      <g class="ears">
        {#if effectiveOutfit === 'blazer' || prop === 'earpiece' || look.hairStyle === 'bun' || look.hairStyle === 'bob'}
          <circle cx="23" cy="56" r="4.5" fill={skin} />
          <circle cx="97" cy="56" r="4.5" fill={skin} />
          {#if effectiveOutfit === 'blazer' || hasPearls}
            <!-- Tiny white pearl stud earrings (D.png #4) -->
            <circle cx="22.5" cy="60" r="1.8" fill="var(--art-shirt)" />
            <circle cx="97.5" cy="60" r="1.8" fill="var(--art-shirt)" />
          {/if}
          {#if effectiveOutfit === 'blazer' || prop === 'earpiece'}
            <!-- Coiled black broadcast earpiece on left ear (D.png #4) -->
            <rect x="23" y="52" width="2.6" height="6" rx="1.2" fill="var(--hair-3)" />
            <path d="M24 58 Q20 68 25 76" fill="none" stroke="var(--hair-3)" stroke-width="1.4" />
          {/if}
        {:else}
          <circle cx="24" cy="56" r="2.5" fill={skin} />
          <circle cx="96" cy="56" r="2.5" fill={skin} />
        {/if}
      </g>

      <!-- Main Continuous Finger/Thumb Head Dome (x=24..96, y=12..88, semicircular top radius 36) -->
      <path
        d="M24 48 A36 36 0 0 1 96 48 L96 86 Q60 94 24 86 Z"
        fill={skin}
      />

      <!-- Subtle right-side cylindrical shading on thumb head (matching D.png smooth 2D gradient feel) -->
      <path
        d="M78 20 A36 36 0 0 1 96 48 L96 86 Q88 89 80 90 L80 20 Z"
        fill="var(--hair-3)"
        opacity=".07"
      />

      <!-- Panicked blue-forehead dread gradient (exact match to D.png Expression #4 & cast.png Expression #5) -->
      {#if effectiveMood === 'panicked'}
        <path
          data-testid="char-panic-dread"
          d="M24 48 A36 36 0 0 1 96 48 L96 54 Q60 48 24 54 Z"
          fill="var(--sky)"
          opacity=".38"
        />
      {/if}

      <!-- Front Hairstyles & Hardhat:
           In D.png & cast.png, male pill-pawns (#1 President, #2 COS, #3 Fed Chair, #5 Blue Bloc, #6 Red Bloc)
           have the iconic smooth, unadorned thumb/finger dome head; female pill-pawns (#4 News Anchor, #7 Citizen)
           have swept bob/bun/long/afro hair framing the forehead. -->
      {#if effectiveOutfit === 'hardhat'}
        <path d="M20 40 A40 34 0 0 1 100 40 Z" fill="var(--gold)" />
        <rect x="16" y="37" width="88" height="6" rx="3" fill="var(--gold-dark)" />
      {:else if look.hairStyle === 'bun' || look.hairStyle === 'bob' || effectiveOutfit === 'blazer'}
        <!-- Side-parted swept hair framing the forehead (exact match to D.png #4 News Anchor & #7 Citizen) -->
        <path
          d="M23 52 A37 37 0 0 1 97 52 C92 34 74 26 50 22 C38 32 28 40 23 52 Z"
          fill={hair}
        />
      {:else if look.hairStyle === 'long'}
        <path
          d="M23 50 A37 36 0 0 1 97 50 Q80 26 52 26 Q34 32 23 50 Z"
          fill={hair}
        />
      {:else if look.hairStyle === 'afro'}
        <path
          d="M22 44 A38 35 0 0 1 98 44 Q80 26 60 26 Q40 26 22 44 Z"
          fill={hair}
        />
      {:else}
        <!-- Smooth, unadorned thumb-dome head matching D.png #1, #2, #3, #5, #6 and g-newgame.png -->
        <path
          d="M36 24 Q60 14 82 24"
          fill="none"
          stroke="var(--art-shirt)"
          stroke-width="2"
          opacity=".16"
          stroke-linecap="round"
        />
      {/if}

      <!-- Eyebrows reacting to mood (clean & minimal like D.png & cast.png; uses --hair-3) -->
      <g class="eyebrows">
        {#if effectiveMood === 'confident' || effectiveMood === 'triumphant'}
          <path d="M41 44 Q47 42 53 44" fill="none" stroke="var(--hair-3)" stroke-width="2" stroke-linecap="round" opacity=".01" />
        {:else if effectiveMood === 'stressed'}
          <!-- Red Bloc Leader angled furrowed brows (D.png #6 & cast.png Expression #6) -->
          <path d="M40 43 L52 48" fill="none" stroke="var(--hair-3)" stroke-width="3" stroke-linecap="round" />
          <path d="M80 43 L68 48" fill="none" stroke="var(--hair-3)" stroke-width="3" stroke-linecap="round" />
        {:else if effectiveMood === 'facepalm'}
          <path d="M66 45 Q73 42 80 46" fill="none" stroke="var(--hair-3)" stroke-width="2.6" stroke-linecap="round" />
        {:else if effectiveMood === 'scheming'}
          <!-- Evil Mode sharp V-angled brows (g-evil.png) -->
          <path d="M38 42 L53 48" fill="none" stroke="var(--hair-3)" stroke-width="3.2" stroke-linecap="round" />
          <path d="M82 42 L67 48" fill="none" stroke="var(--hair-3)" stroke-width="3.2" stroke-linecap="round" />
        {:else if effectiveMood === 'panicked'}
          <!-- Worried arched brows (D.png Expression #4) -->
          <path d="M39 45 Q45 38 52 42" fill="none" stroke="var(--hair-3)" stroke-width="2.6" stroke-linecap="round" />
          <path d="M81 45 Q75 38 68 42" fill="none" stroke="var(--hair-3)" stroke-width="2.6" stroke-linecap="round" />
        {/if}
      </g>

      <!-- Eyes: Solid Dark Dot Eyes or Happy Arcs (exact match to D.png & cast.png — NO white sclera rings, NO nose!) -->
      <g class="eyes blink" style="animation-delay:{-delay * 1.7}s">
        {#if effectiveMood === 'facepalm'}
          <!-- Closed downward arc eye (D.png Expression #3) -->
          <path d="M66 56 Q73 61 80 56" fill="none" stroke="var(--hair-3)" stroke-width="2.8" stroke-linecap="round" />
        {:else if effectiveMood === 'triumphant'}
          <!-- Happy ^ ^ curved eyes (D.png Expression #2 & cast.png Expression #3) -->
          <path d="M41 56 Q47 48 53 56" fill="none" stroke="var(--hair-3)" stroke-width="3" stroke-linecap="round" />
          <path d="M67 56 Q73 48 79 56" fill="none" stroke="var(--hair-3)" stroke-width="3" stroke-linecap="round" />
        {:else}
          <!-- Iconic solid dark pill-person dot eyes (D.png #1-#7) -->
          <circle cx="47" cy="54" r="4.2" fill="var(--hair-3)" />
          <circle cx="73" cy="54" r="4.2" fill="var(--hair-3)" />
        {/if}
      </g>

      <!-- Round Wire-Frame Glasses (exact match to D.png #3 Fed Chair & cast.png Part Library) -->
      {#if hasGlasses}
        <g fill="none" stroke="var(--hair-3)" stroke-width="2.6">
          <circle cx="46" cy="54" r="10.5" />
          <circle cx="74" cy="54" r="10.5" />
          <path d="M56.5 54 Q60 51 63.5 54" stroke-linecap="round" />
          <path d="M35.5 53 L21 53 Q19 53 19 56" stroke-linecap="round" />
          <path d="M84.5 53 L99 53 Q101 53 101 56" stroke-linecap="round" />
        </g>
      {/if}

      <!-- Cyan Sweat Droplets for Stressed or Panicked (exact match to D.png Expression #4) -->
      {#if effectiveMood === 'stressed' || effectiveMood === 'panicked'}
        <g data-testid="char-sweat">
          <path
            d="M84 42 C84 36 88 31 88 31 C88 31 92 36 92 42 C92 45 90 47 88 47 C86 47 84 45 84 42 Z"
            fill="var(--sky)"
          />
          {#if effectiveMood === 'panicked'}
            <path
              d="M89 56 C89 51 92.5 47 92.5 47 C92.5 47 96 51 96 56 C96 58.5 94.5 60 92.5 60 C90.5 60 89 58.5 89 56 Z"
              fill="var(--sky)"
            />
          {/if}
        </g>
      {/if}

      <!-- Triumphant Confetti Burst Around Head (exact match to D.png Expression #2 & cast.png Expression #3) -->
      {#if effectiveMood === 'triumphant'}
        <g data-testid="char-sparkle">
          <rect x="14" y="22" width="7" height="3.5" rx="1" fill="var(--sky)" transform="rotate(-28 14 22)" />
          <rect x="20" y="38" width="6" height="3" rx="1" fill="var(--alert)" transform="rotate(18 20 38)" />
          <rect x="30" y="10" width="7" height="3.5" rx="1" fill="var(--sage)" transform="rotate(-40 30 10)" />
          <rect x="84" y="10" width="7" height="3.5" rx="1" fill="var(--alert)" transform="rotate(35 84 10)" />
          <rect x="98" y="26" width="7" height="3.5" rx="1" fill="var(--gold)" transform="rotate(-22 98 26)" />
          <rect x="96" y="42" width="6" height="3" rx="1" fill="var(--sky)" transform="rotate(25 96 42)" />
        </g>
      {/if}

      <!-- Expressive Mouths (exact match to D.png & cast.png Part Library) -->
      {#if prop === 'mic' && (talking || effectiveMood === 'confident')}
        <!-- News Anchor Oval 'O' Broadcast Mouth (D.png #4) -->
        <g class={talking ? 'talk' : ''}>
          <ellipse cx="60" cy="69" rx="5" ry="6.2" fill="var(--art-mouth)" />
          <ellipse cx="60" cy="72.5" rx="3.2" ry="2.2" fill="var(--art-tongue)" />
        </g>
      {:else if talking}
        <g class="talk">
          <path d="M48 66 H72 A12 11 0 0 1 48 66 Z" fill="var(--art-mouth)" />
          <ellipse cx="60" cy="73" rx="7.5" ry="3.5" fill="var(--art-tongue)" />
        </g>
      {:else if effectiveMood === 'confident'}
        <!-- Clean curved smile (D.png #1, #2, #3, #7) -->
        <path d="M49 67 Q60 75 71 67" fill="none" stroke="var(--hair-3)" stroke-width="3.2" stroke-linecap="round" />
      {:else if effectiveMood === 'stressed'}
        <!-- Slanted skeptical mouth (D.png #6 Red Bloc Leader) -->
        <path d="M49 71 L71 67" fill="none" stroke="var(--hair-3)" stroke-width="3.2" stroke-linecap="round" />
      {:else if effectiveMood === 'facepalm'}
        <!-- Downward frown arc (D.png Expression #3) -->
        <path d="M51 74 Q60 67 69 74" fill="none" stroke="var(--hair-3)" stroke-width="3" stroke-linecap="round" />
      {:else if effectiveMood === 'scheming'}
        <!-- Wicked toothy Evil-Mode grin (g-evil.png) -->
        <path d="M44 64 Q60 67 76 64 Q60 80 44 64 Z" fill="var(--art-shirt)" stroke="var(--hair-3)" stroke-width="2" stroke-linejoin="round" />
        <path d="M52 65.5 v7 M60 66 v8 M68 65.5 v7" stroke="var(--hair-3)" stroke-width="1.3" opacity=".55" />
      {:else if effectiveMood === 'panicked'}
        <!-- Inverted U open gasp mouth with pink tongue (D.png Expression #4) -->
        <path d="M49 75 A11 10 0 0 1 71 75 Z" fill="var(--art-mouth)" />
        <ellipse cx="60" cy="73.5" rx="6.5" ry="2.8" fill="var(--art-tongue)" />
      {:else if effectiveMood === 'triumphant'}
        <!-- Wide cheerful open D-mouth with maroon interior & pink tongue (D.png #5 & Expression #2) -->
        <path d="M48 65 H72 A12 11.5 0 0 1 48 65 Z" fill="var(--art-mouth)" />
        <ellipse cx="60" cy="72.5" rx="8" ry="3.8" fill="var(--art-tongue)" />
      {/if}

      <!-- Articulated 4-Finger Facepalm Hand Over Left Eye (exact match to D.png Expression #3 & cast.png Expression #4, flat vector) -->
      {#if effectivePose === 'facepalm'}
        <g data-testid="char-facepalm-hand" transform="translate(46, 56) rotate(28)">
          <rect x="-10" y="-6" width="20" height="24" rx="7" fill={skin} />
          <rect x="-9" y="-17" width="3.8" height="14" rx="1.9" fill={skin} />
          <rect x="-4" y="-19" width="3.8" height="16" rx="1.9" fill={skin} />
          <rect x="1" y="-18" width="3.8" height="15" rx="1.9" fill={skin} />
          <rect x="6" y="-15" width="3.6" height="12" rx="1.8" fill={skin} />
        </g>
      {/if}
    </g>

    <!-- Optional Swallowtail Navy Ribbon Nameplate Banner (exact match to cast.png lineup ribbons, flat vector) -->
    {#if bannerLabel}
      <g class="nameplate" data-testid="char-nameplate" transform="translate(60, 194)">
        <polygon points="-48,-8 -40,0 -48,8 -34,8 -34,-8" fill="var(--ink-soft)" />
        <polygon points="48,-8 40,0 48,8 34,8 34,-8" fill="var(--ink-soft)" />
        <rect x="-38" y="-11" width="76" height="16" rx="2.5" fill="var(--ink)" />
        <text
          x="0"
          y="0"
          font-family="var(--font-ui)"
          font-size="8.5"
          font-weight="700"
          fill="var(--card)"
          text-anchor="middle"
          letter-spacing="0.4"
        >
          {bannerLabel}
        </text>
      </g>
    {/if}
  </g>
</g>

<style>
  .breathe { transform-box: fill-box; transform-origin: center bottom; animation: breathe 3.4s ease-in-out infinite; }
  .blink { transform-box: fill-box; transform-origin: center; animation: blink 4.6s infinite; }
  .talk { transform-box: fill-box; transform-origin: center top; animation: talk .26s ease-in-out infinite alternate; }
  .point { transform-box: fill-box; transform-origin: 85% 70%; animation: point 2.6s ease-in-out infinite; }
  :global([data-calm='true']) .breathe,
  :global([data-calm='true']) .blink,
  :global([data-calm='true']) .talk,
  :global([data-calm='true']) .point {
    animation: none !important;
  }
  @media (prefers-reduced-motion: reduce) {
    .breathe, .blink, .talk, .point {
      animation: none !important;
    }
  }
  @keyframes breathe { 50% { transform: scaleY(1.018); } }
  @keyframes blink { 0%, 93%, 100% { transform: scaleY(1); } 96% { transform: scaleY(.1); } }
  @keyframes talk { to { transform: scaleY(.35); } }
  @keyframes point { 50% { transform: rotate(-6deg); } }
</style>
