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

  export const PRESIDENT_LOOKS: readonly PresidentLookOption[] = [
    {
      index: 0,
      label: 'Classic Navy',
      look: { skin: 'skin-1', hair: 'hair-2', hairStyle: 'parted', suit: 'ink', tie: 'sky' },
    },
    {
      index: 1,
      label: 'Crimson Tie',
      look: { skin: 'skin-3', hair: 'hair-1', hairStyle: 'cropped', suit: 'ink', tie: 'alert' },
    },
    {
      index: 2,
      label: 'Gold Standard',
      look: { skin: 'skin-4', hair: 'hair-1', hairStyle: 'afro', suit: 'ink', tie: 'gold' },
    },
    {
      index: 3,
      label: 'Slate Statesperson',
      look: { skin: 'skin-2', hair: 'hair-3', hairStyle: 'bob', suit: 'sky', tie: 'gold', pearls: true },
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
      suit: evilMode ? 'art-wood-dark' : base.suit,
      tie: evilMode ? 'gold' : base.tie,
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
        look: { skin: 'skin-2', hair: 'hair-2', hairStyle: 'short', suit: 'ink', outfit: 'hardhat', mood },
        mood,
        prop: 'wrench',
        badge: 'FACTORY',
      };
    }
    if (persona.id === 'sun_belt_retiree' || persona.composition === 'senior' || persona.sector === 'fixed') {
      return {
        look: { skin: 'skin-1', hair: 'hair-3', hairStyle: 'bald', suit: 'sage', outfit: 'cardigan', glasses: true, mood },
        mood,
        prop: null,
        badge: 'RETIREE',
      };
    }
    if (persona.id === 'suburban_educator_couple' || persona.sector === 'tech') {
      return {
        look: { skin: 'skin-3', hair: 'hair-1', hairStyle: 'bob', suit: 'sky', outfit: 'blazer', glasses: true, mood },
        mood,
        prop: 'clipboard',
        badge: 'EDUCATOR',
      };
    }
    if (persona.id === 'urban_service_worker' || persona.sector === 'service') {
      return {
        look: { skin: 'skin-4', hair: 'hair-1', hairStyle: 'bun', suit: 'sky', outfit: 'scrubs', mood },
        mood,
        prop: 'stethoscope',
        badge: 'NURSE',
      };
    }
    return {
      look: { skin: 'skin-2', hair: 'hair-1', hairStyle: 'parted', suit: 'ink', outfit: 'shirt', shirtOnly: true, mood },
      mood,
      prop: 'coffee',
      badge: 'FAMILY',
    };
  }
</script>

<script lang="ts">
  // High-craft layered editorial-poster character rig (design.md A3, ART-01, GFX-01, GFX-02).
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
  const effectivePose = $derived<Pose>(effectiveMood === 'facepalm' && pose === 'stand' ? 'facepalm' : pose);
  const hasPearls = $derived(look.pearls ?? false);
  const hasGlasses = $derived(look.glasses ?? false);
  const bannerLabel = $derived(nameplate ?? look.nameplate);
  const sleeveFill = $derived.by(() => {
    if (effectiveOutfit === 'shirt') return 'var(--art-shirt)';
    if (effectiveOutfit === 'scrubs') return 'var(--sky)';
    if (effectiveOutfit === 'hardhat') return 'var(--art-shirt)';
    if (effectiveOutfit === 'cardigan') return v(look.suit, 'sage-dark');
    return suit;
  });
</script>

<!-- Outer positioning group kept separate from inner CSS animation group so CSS transforms never clobber SVG translate/scale -->
<g
  transform="translate({x} {y}) scale({scale * (flip ? -1 : 1)} {scale})"
  data-mood={effectiveMood}
  data-pose={effectivePose}
  data-outfit={effectiveOutfit}
>
  <g class="breathe" style="animation-delay:{-delay}s">
    <!-- Back-hair layer behind head and shoulders for long, bob, afro, bun -->
    <g class="hair-back" data-hairstyle={look.hairStyle}>
      {#if look.hairStyle === 'long'}
        <path
          d="M22 44 C18 76 20 108 28 116 L92 116 C100 108 102 76 98 44 Z"
          fill={hair}
          stroke="var(--ink)"
          stroke-width="2"
          stroke-linejoin="round"
        />
      {:else if look.hairStyle === 'bob'}
        <path
          d="M22 42 C18 68 24 94 34 96 L86 96 C96 94 102 68 98 42 Z"
          fill={hair}
          stroke="var(--ink)"
          stroke-width="2"
          stroke-linejoin="round"
        />
      {:else if look.hairStyle === 'afro'}
        <circle cx="60" cy="40" r="42" fill={hair} stroke="var(--ink)" stroke-width="2" />
        <circle cx="32" cy="30" r="18" fill={hair} stroke="var(--ink)" stroke-width="1.5" />
        <circle cx="88" cy="30" r="18" fill={hair} stroke="var(--ink)" stroke-width="1.5" />
        <circle cx="60" cy="14" r="20" fill={hair} stroke="var(--ink)" stroke-width="1.5" />
      {:else if look.hairStyle === 'bun'}
        <circle cx="60" cy="4" r="15" fill={hair} stroke="var(--ink)" stroke-width="2" />
        <path d="M52 4 Q60 -2 68 4" fill="none" stroke="var(--card)" stroke-width="1.2" opacity=".35" />
      {/if}
    </g>

    <!-- Legs + dress shoes (hidden in desk or podium pose) -->
    {#if effectivePose !== 'desk' && effectivePose !== 'podium'}
      <rect x="40" y="174" width="17" height="52" rx="6" fill={v(look.pants, look.suit)} stroke="var(--ink)" stroke-width="1.5" />
      <rect x="63" y="174" width="17" height="52" rx="6" fill={v(look.pants, look.suit)} stroke="var(--ink)" stroke-width="1.5" />
      <path d="M34 220 h26 v8 a4 4 0 0 1 -4 4 h-18 a4 4 0 0 1 -4 -4 Z" fill="var(--hair-3)" stroke="var(--ink)" stroke-width="1.5" />
      <path d="M60 220 h26 v8 a4 4 0 0 1 -4 4 h-18 a4 4 0 0 1 -4 -4 Z" fill="var(--hair-3)" stroke="var(--ink)" stroke-width="1.5" />
    {/if}

    <!-- Sculpted Neck with Cast Jawline Shadow (seamless capsule-to-shoulder joint) -->
    <g class="neck" data-testid="char-neck">
      <rect x="49" y="80" width="22" height="20" rx="6" fill={skin} stroke="var(--ink)" stroke-width="1.8" />
      <path d="M49 84 Q60 94 71 84 L71 92 Q60 98 49 92 Z" fill="var(--ink)" opacity=".18" />
    </g>

    <!-- Left Arm for Standard / Desk Pose -->
    {#if effectivePose === 'stand' || effectivePose === 'desk'}
      <rect x="14" y="98" width="18" height="72" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" />
      <circle cx="23" cy="172" r="8.5" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
    {/if}

    <!-- Right Arm when no prop and standard/desk pose -->
    {#if prop === null && (effectivePose === 'stand' || effectivePose === 'desk')}
      <rect x="88" y="98" width="18" height="72" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" />
      <circle cx="97" cy="172" r="8.5" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
    {/if}

    <!-- Torso: Seamless shoulder capsule + outfit-specific tailoring -->
    <rect
      x="24"
      y="90"
      width="72"
      height="96"
      rx="24"
      fill={effectiveOutfit === 'shirt'
        ? 'var(--art-shirt)'
        : effectiveOutfit === 'scrubs'
          ? 'var(--sky)'
          : effectiveOutfit === 'hardhat'
            ? 'var(--gold)'
            : suit}
      stroke="var(--ink)"
      stroke-width="2"
    />

    {#if effectiveOutfit === 'shirt'}
      <rect x="24" y="148" width="72" height="38" rx="8" fill={v(look.pants, 'art-wood-dark')} stroke="var(--ink)" stroke-width="1.5" />
      <rect x="54" y="149" width="12" height="8" rx="2" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.2" />
      <path d="M48 92 L60 110 L72 92" fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round" />
    {:else if effectiveOutfit === 'scrubs'}
      <!-- Medical Scrubs V-neck + chest pocket + stethoscope -->
      <path d="M46 90 L60 116 L74 90 Z" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" />
      <rect x="66" y="122" width="16" height="18" rx="3" fill="var(--sky)" stroke="var(--ink)" stroke-width="1.5" />
      <!-- Stethoscope draped around neck -->
      <path
        d="M44 92 C40 118 46 134 52 138 M76 92 C80 118 74 134 68 134"
        fill="none"
        stroke="var(--ink)"
        stroke-width="3"
        stroke-linecap="round"
      />
      <circle cx="68" cy="138" r="5.5" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8" />
      <circle cx="68" cy="138" r="2" fill="var(--gold)" />
    {:else if effectiveOutfit === 'hardhat'}
      <!-- High-vis safety vest over work shirt with reflective stripes -->
      <path d="M44 90 L60 124 L76 90 Z" fill="var(--art-shirt)" stroke="var(--ink)" stroke-width="1.5" />
      <rect x="30" y="94" width="12" height="88" fill="var(--card)" opacity=".75" stroke="var(--ink)" stroke-width="1" />
      <rect x="78" y="94" width="12" height="88" fill="var(--card)" opacity=".75" stroke="var(--ink)" stroke-width="1" />
      <rect x="25" y="142" width="70" height="8" fill="var(--card)" opacity=".85" stroke="var(--ink)" stroke-width="1" />
      <line x1="60" y1="124" x2="60" y2="184" stroke="var(--ink)" stroke-width="1.8" />
    {:else if effectiveOutfit === 'cardigan'}
      <!-- Collared shirt + cozy buttoned cardigan sweater -->
      <path d="M45 90 L60 128 L75 90 Z" fill="var(--art-shirt)" stroke="var(--ink)" stroke-width="1.5" />
      <path d="M45 90 L60 130 L60 184 M75 90 L60 130" fill="none" stroke="var(--ink)" stroke-width="2" />
      <circle cx="60" cy="140" r="2.6" fill="var(--gold)" stroke="var(--ink)" stroke-width="1" />
      <circle cx="60" cy="154" r="2.6" fill="var(--gold)" stroke="var(--ink)" stroke-width="1" />
      <circle cx="60" cy="168" r="2.6" fill="var(--gold)" stroke="var(--ink)" stroke-width="1" />
      <rect x="32" y="146" width="16" height="14" rx="3" fill={suit} stroke="var(--ink)" stroke-width="1.4" />
    {:else}
      <!-- Tailored Suit or Broadcast Blazer -->
      <path d="M46 92 L60 134 L74 92 Z" fill="var(--art-shirt)" stroke="var(--ink)" stroke-width="1.5" />
      <!-- Left & Right Notched Suit Lapels -->
      <path d="M38 90 L48 114 L39 122 L49 146 L58 132 L47 92 Z" fill={suit} stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M82 90 L72 114 L81 122 L71 146 L62 132 L73 92 Z" fill={suit} stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round" />
      <!-- Enamel US Flag Lapel Pin on left lapel -->
      <g data-testid="char-lapel-pin" transform="translate(41, 108)">
        <rect x="0" y="0" width="7" height="4.8" rx="0.8" fill="var(--art-flag-red)" stroke="var(--gold)" stroke-width="0.8" />
        <rect x="0" y="0" width="3.2" height="2.6" fill="var(--ink)" />
        <line x1="3.2" y1="2.4" x2="6.8" y2="2.4" stroke="var(--card)" stroke-width="0.9" />
      </g>
      <!-- Pocket Square or Broadcast Press Badge -->
      {#if effectiveOutfit === 'blazer'}
        <rect x="70" y="124" width="13" height="16" rx="2" fill="var(--card)" stroke="var(--ink)" stroke-width="1.2" />
        <rect x="72" y="126" width="9" height="4" fill="var(--alert)" />
        <circle cx="45" cy="122" r="2.5" fill="var(--ink)" stroke="var(--gold)" stroke-width="0.8" />
      {:else}
        <path d="M33 130 h14 v2 h-14 Z" fill="var(--ink)" stroke="var(--ink)" stroke-width="1" />
        <path d="M35 130 L40 124 L44 130 Z" fill="var(--card)" />
      {/if}
    {/if}

    <!-- Tie or Pearl Necklace (for suit, blazer, cardigan, shirt) -->
    {#if effectiveOutfit !== 'scrubs' && effectiveOutfit !== 'hardhat'}
      {#if hasPearls}
        <g class="pearls">
          <circle cx="51" cy="106" r="3.2" fill="var(--card)" stroke="var(--ink)" stroke-width="1" />
          <circle cx="56" cy="111" r="3.4" fill="var(--card)" stroke="var(--ink)" stroke-width="1" />
          <circle cx="60" cy="113" r="3.6" fill="var(--card)" stroke="var(--ink)" stroke-width="1" />
          <circle cx="64" cy="111" r="3.4" fill="var(--card)" stroke="var(--ink)" stroke-width="1" />
          <circle cx="69" cy="106" r="3.2" fill="var(--card)" stroke="var(--ink)" stroke-width="1" />
        </g>
      {:else if look.tie}
        <path d="M56 94 h8 l-1 6 h-6 Z" fill={v(look.tie, 'alert')} stroke="var(--ink)" stroke-width="1.5" />
        <path d="M57 100 L63 100 L66 128 L60 138 L54 128 Z" fill={v(look.tie, 'alert')} stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round" />
        <line x1="56" y1="116" x2="64" y2="116" stroke="var(--gold)" stroke-width="2" />
      {/if}
    {/if}

    <!-- Articulated Poses: hips, crossed, celebrate, facepalm, cash, podium, point, wave -->
    {#if effectivePose === 'hips'}
      <g class="pose-hips" data-testid="pose-hips">
        <path d="M26 100 L8 132 L26 154" fill="none" stroke={sleeveFill} stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M26 100 L8 132 L26 154" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="27" cy="154" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
        <path d="M94 100 L112 132 L94 154" fill="none" stroke={sleeveFill} stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M94 100 L112 132 L94 154" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="93" cy="154" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
      </g>
    {:else if effectivePose === 'crossed'}
      <g class="pose-crossed" data-testid="pose-crossed">
        <rect x="14" y="98" width="18" height="44" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" transform="rotate(-18 23 110)" />
        <rect x="88" y="98" width="18" height="44" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" transform="rotate(18 97 110)" />
        <!-- Folded horizontal forearms across chest -->
        <rect x="26" y="128" width="68" height="16" rx="8" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.8" />
        <circle cx="32" cy="134" r="7.5" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
        <circle cx="88" cy="134" r="7.5" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
      </g>
    {:else if effectivePose === 'celebrate'}
      <g class="pose-celebrate" data-testid="pose-celebrate">
        <rect x="12" y="94" width="18" height="58" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" transform="rotate(148 21 102)" />
        <circle cx="-12" cy="54" r="8.5" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
        <rect x="90" y="94" width="18" height="58" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" transform="rotate(-148 99 102)" />
        <circle cx="132" cy="54" r="8.5" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
      </g>
    {:else if effectivePose === 'facepalm'}
      <g class="pose-facepalm" data-testid="pose-facepalm">
        <rect x="14" y="98" width="18" height="68" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" />
        <circle cx="23" cy="168" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
        <!-- Right arm raised to cover forehead/eyes -->
        <path d="M94 104 L110 76 L72 54" fill="none" stroke={sleeveFill} stroke-width="15" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M94 104 L110 76 L72 54" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    {:else if effectivePose === 'cash'}
      <g class="pose-cash" data-testid="pose-cash">
        <rect x="16" y="98" width="18" height="48" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" transform="rotate(-24 25 110)" />
        <rect x="86" y="98" width="18" height="48" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" transform="rotate(24 95 110)" />
        <!-- Fanned stacks of bills held in front -->
        <g class="cash-fan" transform="translate(60, 140)">
          <rect x="-24" y="-14" width="28" height="16" rx="2" fill="var(--sage)" stroke="var(--ink)" stroke-width="1.5" transform="rotate(-22)" />
          <rect x="-14" y="-16" width="28" height="16" rx="2" fill="var(--sage-dark)" stroke="var(--ink)" stroke-width="1.5" transform="rotate(-6)" />
          <rect x="-4" y="-14" width="28" height="16" rx="2" fill="var(--sage)" stroke="var(--ink)" stroke-width="1.5" transform="rotate(14)" />
          <circle cx="0" cy="-6" r="4" fill="var(--gold)" stroke="var(--ink)" stroke-width="1" />
        </g>
        <circle cx="38" cy="144" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
        <circle cx="82" cy="144" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
      </g>
    {:else if effectivePose === 'podium'}
      <g class="pose-podium" data-testid="pose-podium">
        <path d="M24 102 L12 138 L30 152" fill="none" stroke={sleeveFill} stroke-width="15" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M96 102 L108 138 L90 152" fill="none" stroke={sleeveFill} stroke-width="15" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="30" cy="152" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
        <circle cx="90" cy="152" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
      </g>
    {:else if effectivePose === 'point'}
      <g class="point">
        <rect x="14" y="96" width="18" height="58" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" transform="rotate(130 23 104)" />
        <circle cx="-17" cy="71" r="8.5" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
        <rect x="-30" y="62" width="14" height="6" rx="3" fill={skin} stroke="var(--ink)" stroke-width="1.5" transform="rotate(-30 -24 64)" />
      </g>
    {:else if effectivePose === 'wave'}
      <g class="point">
        <rect x="14" y="96" width="18" height="58" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" transform="rotate(145 23 104)" />
        <circle cx="-21" cy="62" r="8.5" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
        <path d="M-30 52 L-26 50 L-22 53" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" />
      </g>
    {/if}

    <!-- Handheld Props -->
    {#if prop === 'clipboard'}
      <rect x="86" y="98" width="18" height="46" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" />
      <g transform="rotate(8 92 144)">
        <rect x="72" y="116" width="40" height="54" rx="4" fill="var(--art-wood-light)" stroke="var(--ink)" stroke-width="2" />
        <rect x="77" y="124" width="30" height="40" rx="2" fill="var(--card)" stroke="var(--ink)" stroke-width="1" />
        <path d="M81 134 h22 M81 142 h22 M81 150 h14" stroke="var(--ink-soft)" stroke-width="2" stroke-linecap="round" />
        <rect x="85" y="112" width="14" height="8" rx="2" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="1.2" />
      </g>
      <circle cx="108" cy="150" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
    {:else if prop === 'folder'}
      <rect x="86" y="98" width="18" height="46" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" />
      <g transform="rotate(12 92 144)">
        <rect x="70" y="120" width="44" height="48" rx="3" fill="var(--gold)" stroke="var(--ink)" stroke-width="2" />
        <path d="M70 120 h16 l4 5 h24 v43 h-44 Z" fill="var(--gold-dark)" stroke="var(--ink)" stroke-width="1.5" />
        <rect x="76" y="128" width="32" height="34" rx="2" fill="var(--card)" />
        <line x1="80" y1="136" x2="102" y2="136" stroke="var(--alert)" stroke-width="2" />
      </g>
      <circle cx="106" cy="150" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
    {:else if prop === 'coffee'}
      <rect x="86" y="98" width="18" height="46" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" />
      <g transform="translate(86 130)">
        <path d="M4 14 h18 l-2 18 h-14 Z" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
        <path d="M20 18 h6 a4 4 0 0 1 0 8 h-5" fill="none" stroke="var(--ink)" stroke-width="2" />
        <path d="M9 10 Q12 6 9 2 M16 10 Q19 6 16 2" fill="none" stroke="var(--ink-soft)" stroke-width="1.5" opacity=".5" stroke-linecap="round" />
      </g>
      <circle cx="95" cy="152" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
    {:else if prop === 'gavel'}
      <rect x="86" y="98" width="18" height="46" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" />
      <g transform="rotate(-20 92 144)">
        <rect x="88" y="120" width="6" height="36" rx="2" fill="var(--art-wood)" stroke="var(--ink)" stroke-width="1.5" />
        <rect x="80" y="112" width="22" height="12" rx="3" fill="var(--art-wood-dark)" stroke="var(--ink)" stroke-width="2" />
        <rect x="87" y="112" width="8" height="12" fill="var(--gold)" />
      </g>
      <circle cx="94" cy="148" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
    {:else if prop === 'mic'}
      <rect x="86" y="98" width="18" height="46" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" />
      <g transform="translate(88 126)">
        <rect x="6" y="14" width="5" height="24" rx="2" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="1.5" />
        <rect x="3" y="4" width="11" height="13" rx="4" fill="var(--hair-2)" stroke="var(--ink)" stroke-width="1.8" />
        <rect x="1" y="13" width="15" height="7" rx="1.5" fill="var(--alert)" stroke="var(--ink)" stroke-width="1.2" />
      </g>
      <circle cx="96" cy="152" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
    {:else if prop === 'wrench'}
      <rect x="86" y="98" width="18" height="46" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" />
      <g transform="translate(88 118) rotate(14)">
        <rect x="6" y="8" width="6" height="32" rx="2" fill="var(--hair-2)" stroke="var(--ink)" stroke-width="1.5" />
        <path d="M2 8 C2 0 16 0 16 8 L12 8 L12 4 L6 4 L6 8 Z" fill="var(--hair-2)" stroke="var(--ink)" stroke-width="1.5" />
      </g>
      <circle cx="96" cy="150" r="8" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
    {:else if prop === 'stethoscope' || prop === 'earpiece' || prop === 'cash_fan'}
      <rect x="88" y="98" width="18" height="72" rx="9" fill={sleeveFill} stroke="var(--ink)" stroke-width="1.5" />
      <circle cx="97" cy="172" r="8.5" fill={skin} stroke="var(--ink)" stroke-width="1.5" />
    {/if}

    <!-- Head Anatomy: Contoured face, ears, hairstyle, eyebrows, eyelids, eyes, nose, and multi-layer mouth -->
    <g class="head">
      <!-- Ears with inner ear detail + optional broadcast earpiece -->
      <g class="ears">
        <path d="M30 48 C24 48 24 62 30 62 Z" fill={skin} stroke="var(--ink)" stroke-width="2" />
        <path d="M28 52 C26 52 26 58 28 58" fill="none" stroke="var(--ink-soft)" stroke-width="1.5" />
        <path d="M90 48 C96 48 96 62 90 62 Z" fill={skin} stroke="var(--ink)" stroke-width="2" />
        <path d="M92 52 C94 52 94 58 92 58" fill="none" stroke="var(--ink-soft)" stroke-width="1.5" />
        {#if effectiveOutfit === 'blazer' || prop === 'earpiece'}
          <circle cx="92" cy="56" r="2.5" fill="var(--card)" stroke="var(--ink)" stroke-width="1.2" />
          <path d="M92 58 Q96 68 90 78 Q94 84 88 92" fill="none" stroke="var(--card)" stroke-width="1.4" />
        {/if}
      </g>

      <!-- Head base with sculpted jawline -->
      <rect x="30" y="10" width="60" height="86" rx="30" fill={skin} stroke="var(--ink)" stroke-width="2" />

      <!-- Panicked blue-forehead dread gradient -->
      {#if effectiveMood === 'panicked'}
        <path
          data-testid="char-panic-dread"
          d="M32 38 Q32 12 60 12 Q88 12 88 38 Z"
          fill="var(--sky)"
          opacity=".24"
        />
      {/if}

      <!-- Subtle cheek & jaw contour shadow for editorial depth -->
      <path d="M32 50 C36 78 50 92 60 94 C40 92 32 76 32 50 Z" fill="var(--ink)" opacity=".09" />

      <!-- Front Hairstyles & Hardhat -->
      {#if effectiveOutfit === 'hardhat'}
        <path d="M26 36 Q26 6 60 6 Q94 6 94 36 Z" fill="var(--gold)" stroke="var(--ink)" stroke-width="2" />
        <rect x="22" y="33" width="76" height="6" rx="3" fill="var(--gold-dark)" stroke="var(--ink)" stroke-width="1.8" />
        <rect x="55" y="8" width="10" height="24" rx="3" fill="var(--card)" opacity=".45" />
      {:else if look.hairStyle === 'short'}
        <path d="M30 46 Q28 8 60 8 Q92 8 90 46 Q86 28 60 26 Q34 28 30 46 Z" fill={hair} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
      {:else if look.hairStyle === 'side' || look.hairStyle === 'parted'}
        <path d="M28 48 Q26 6 60 6 Q94 8 92 46 Q84 22 54 26 Q36 30 28 48 Z" fill={hair} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
        <path d="M42 10 Q52 14 62 10" fill="none" stroke="var(--ink-soft)" stroke-width="1.5" opacity=".6" />
      {:else if look.hairStyle === 'swept'}
        <path d="M28 46 Q26 2 60 2 Q94 2 92 46 Q86 20 60 18 Q34 20 28 46 Z" fill={hair} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
        <path d="M36 18 Q60 12 84 18" fill="none" stroke="var(--card)" stroke-width="1.5" opacity=".35" />
      {:else if look.hairStyle === 'bun'}
        <path d="M28 54 Q24 8 60 10 Q96 8 92 54 Q90 30 60 26 Q30 30 28 54 Z" fill={hair} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
      {:else if look.hairStyle === 'cropped'}
        <path d="M29 44 Q28 8 60 8 Q92 8 91 44 Q84 32 60 30 Q36 32 29 44 Z" fill={hair} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
        <path d="M40 18 l4 4 M58 16 l4 4 M74 18 l4 4" stroke="var(--ink)" stroke-width="1.8" />
      {:else if look.hairStyle === 'long' || look.hairStyle === 'bob'}
        <path d="M28 50 Q26 8 60 8 Q94 8 92 50 Q82 24 56 26 Q38 28 28 50 Z" fill={hair} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
      {:else if look.hairStyle === 'afro'}
        <path d="M26 42 Q26 10 60 10 Q94 10 94 42 Q84 26 60 26 Q36 26 26 42 Z" fill={hair} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
      {:else if look.hairStyle === 'bald'}
        <!-- Classic horseshoe side-fringe + crown shine -->
        <path d="M28 46 C26 36 32 32 35 42 Z" fill={hair} stroke="var(--ink)" stroke-width="1.5" />
        <path d="M92 46 C94 36 88 32 85 42 Z" fill={hair} stroke="var(--ink)" stroke-width="1.5" />
        <path d="M46 18 Q60 14 70 18" fill="none" stroke="var(--card)" stroke-width="2" stroke-linecap="round" opacity=".55" />
      {/if}

      <!-- Eyebrows reacting to mood -->
      <g class="eyebrows">
        {#if effectiveMood === 'confident'}
          <path d="M42 47 Q48 44 54 46" fill="none" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round" />
          <path d="M66 46 Q72 44 78 47" fill="none" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round" />
        {:else if effectiveMood === 'stressed' || effectiveMood === 'facepalm'}
          <path d="M42 49 Q48 47 54 44" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
          <path d="M66 44 Q72 47 78 49" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
        {:else if effectiveMood === 'scheming'}
          <path d="M42 49 Q48 48 54 46" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
          <path d="M66 43 Q72 39 78 43" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
        {:else if effectiveMood === 'panicked'}
          <path d="M42 43 Q48 39 54 42" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
          <path d="M66 42 Q72 39 78 43" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
        {:else if effectiveMood === 'triumphant'}
          <path d="M42 44 Q48 41 54 44" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
          <path d="M66 44 Q72 41 78 44" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
        {/if}
      </g>

      <!-- Eyes: Upper Eyelid Crease + Sclera + Pupil + White Catchlight -->
      <g class="eyes blink" style="animation-delay:{-delay * 1.7}s">
        {#if effectiveMood === 'facepalm'}
          <!-- Tightly shut exasperated eyes -->
          <path d="M42 56 Q48 60 54 56" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" />
          <path d="M66 56 Q72 60 78 56" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" />
        {:else if effectiveMood === 'scheming'}
          <ellipse cx="48" cy="56" rx="5" ry="3.2" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" />
          <circle cx="49" cy="56" r="2.4" fill="var(--ink)" />
          <circle cx="50" cy="55.2" r="0.9" fill="var(--card)" />
          <path d="M42.5 54.5 Q48 52 53.5 54.5" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" />
          <ellipse cx="72" cy="56" rx="5" ry="3.2" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" />
          <circle cx="73" cy="56" r="2.4" fill="var(--ink)" />
          <circle cx="74" cy="55.2" r="0.9" fill="var(--card)" />
          <path d="M66.5 54.5 Q72 52 77.5 54.5" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" />
        {:else if effectiveMood === 'panicked'}
          <ellipse cx="48" cy="56" rx="6" ry="6" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" />
          <circle cx="48" cy="56" r="2.2" fill="var(--ink)" />
          <circle cx="49" cy="55" r="0.9" fill="var(--card)" />
          <ellipse cx="72" cy="56" rx="6" ry="6" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" />
          <circle cx="72" cy="56" r="2.2" fill="var(--ink)" />
          <circle cx="73" cy="55" r="0.9" fill="var(--card)" />
        {:else}
          <path d="M42.5 52.5 Q48 49.5 53.5 52.5" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round" />
          <ellipse cx="48" cy="56" rx="5" ry="4.5" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" />
          <circle cx="48" cy="56" r="3.2" fill="var(--ink)" />
          <circle cx="49.5" cy="54.5" r="1.2" fill="var(--card)" />
          <path d="M66.5 52.5 Q72 49.5 77.5 52.5" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round" />
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

      <!-- Triumphant Gold Sparkle & Confetti -->
      {#if effectiveMood === 'triumphant'}
        <g data-testid="char-sparkle" transform="translate(86 28)">
          <path d="M5 0 L6.5 3.5 L10 5 L6.5 6.5 L5 10 L3.5 6.5 L0 5 L3.5 3.5 Z" fill="var(--gold)" stroke="var(--ink)" stroke-width="1" />
          <rect x="-64" y="-8" width="5" height="3" rx="1" fill="var(--alert)" transform="rotate(-24)" />
          <rect x="-56" y="8" width="5" height="3" rx="1" fill="var(--sage)" transform="rotate(18)" />
        </g>
      {/if}

      <!-- Multi-layer Mouth: Mood-reactive and speech-reactive -->
      {#if talking}
        <g class="talk">
          <ellipse cx="60" cy="74" rx="7.5" ry="5.5" fill="var(--alert-dark)" stroke="var(--ink)" stroke-width="2" />
          <path d="M54 70.5 h12" stroke="var(--art-shirt)" stroke-width="2" stroke-linecap="round" />
          <ellipse cx="60" cy="77" rx="4" ry="2" fill="var(--alert)" />
        </g>
      {:else if effectiveMood === 'confident'}
        <path d="M50 72 Q60 80 70 72" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" />
        <path d="M55 77 Q60 79 65 77" fill="none" stroke="var(--ink-soft)" stroke-width="1.2" stroke-linecap="round" opacity=".5" />
      {:else if effectiveMood === 'stressed' || effectiveMood === 'facepalm'}
        <path d="M50 75 Q55 71 60 75 Q65 79 70 74" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />
      {:else if effectiveMood === 'scheming'}
        <path d="M49 75 Q58 77 68 69" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" />
        <path d="M66 68 L70 71" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" />
      {:else if effectiveMood === 'panicked'}
        <ellipse cx="60" cy="74" rx="6.5" ry="7" fill="var(--alert-dark)" stroke="var(--ink)" stroke-width="2" />
        <path d="M55 70 h10" stroke="var(--art-shirt)" stroke-width="2" stroke-linecap="round" />
        <ellipse cx="60" cy="78" rx="3.8" ry="2.2" fill="var(--alert)" />
      {:else if effectiveMood === 'triumphant'}
        <path d="M47 70 Q60 84 73 70 Z" fill="var(--alert-dark)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
        <path d="M48 70 Q60 75 72 70 Z" fill="var(--art-shirt)" stroke="var(--ink)" stroke-width="1.4" />
      {/if}

      <!-- Facepalm hand over forehead/eye when in facepalm pose -->
      {#if effectivePose === 'facepalm'}
        <g data-testid="char-facepalm-hand">
          <ellipse cx="64" cy="54" rx="14" ry="10" fill={skin} stroke="var(--ink)" stroke-width="2" transform="rotate(-14 64 54)" />
          <line x1="54" y1="50" x2="68" y2="47" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" />
          <line x1="54" y1="55" x2="70" y2="52" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" />
        </g>
      {/if}
    </g>

    <!-- Optional Swallowtail Ribbon Nameplate Banner -->
    {#if bannerLabel}
      <g class="nameplate" data-testid="char-nameplate" transform="translate(60, 192)">
        <polygon points="-46,-10 -38,-2 -46,6 -34,6 -34,-10" fill="var(--gold-dark)" stroke="var(--ink)" stroke-width="1.4" />
        <polygon points="46,-10 38,-2 46,6 34,6 34,-10" fill="var(--gold-dark)" stroke="var(--ink)" stroke-width="1.4" />
        <rect x="-38" y="-12" width="76" height="16" rx="3" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8" />
        <text
          x="0"
          y="-1"
          font-family="var(--font-ui)"
          font-size="8.5"
          font-weight="800"
          fill="var(--ink)"
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
