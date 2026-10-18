<script lang="ts">
  // Multi-layered Americana vector emblem & icon library (matching .design-targets/uikit.png).
  // Replaces raw Unicode emojis across Doctrines, Task Force Perks, Heist Relics, Archetypes, and UI pills
  // with crisp SVG seals, medallions, and vector glyphs using design tokens (--*).

  let {
    kind,
    size = 20,
    medallion = false,
    tone = 'ink',
    label = undefined,
  }: {
    kind: string;
    size?: number;
    medallion?: boolean;
    tone?: 'ink' | 'gold' | 'sage' | 'alert' | 'sky' | 'card';
    label?: string;
  } = $props();

  const normalized = $derived.by(() => {
    const k = kind.trim();
    if (k === '🏗️' || k === 'industrial' || k.includes('infra') || k.includes('rail') || k.includes('housing')) return 'industrial';
    if (
      k === '⚖️' ||
      k === 'institutionalist' ||
      k === 'purist' ||
      k === 'gavel' ||
      k === 'scroll' ||
      k.includes('inspector') ||
      k.includes('bipartisan') ||
      k.includes('court')
    )
      return 'scales';
    if (
      k === '📣' ||
      k === 'populist' ||
      k === 'main_street' ||
      k.includes('junk_fee') ||
      k.includes('insulin') ||
      k.includes('rally') ||
      k.includes('press')
    )
      return 'megaphone';
    if (
      k === '📊' ||
      k === '🔬' ||
      k === 'technocrat' ||
      k === 'chart_up' ||
      k === 'chart' ||
      k.includes('chip') ||
      k.includes('ai_') ||
      k.includes('fed') ||
      k.includes('data')
    )
      return 'chip';
    if (
      k === '🌐' ||
      k === '🚢' ||
      k === 'globalist' ||
      k === 'compass' ||
      k.includes('port') ||
      k.includes('trade') ||
      k.includes('mineral') ||
      k.includes('export')
    )
      return 'globe';
    if (
      k === '🌱' ||
      k === '🔋' ||
      k === '⚡' ||
      k === 'green' ||
      k === 'green_transition' ||
      k.includes('clean') ||
      k.includes('grid') ||
      k.includes('fusion') ||
      k.includes('solar')
    )
      return 'leaf';
    if (
      k === '🛡️' ||
      k === '💻' ||
      k === 'security' ||
      k === 'national_security' ||
      k.includes('cyber') ||
      k.includes('defense') ||
      k.includes('darpa') ||
      k.includes('border')
    )
      return 'shield';
    if (k === '🤝' || k === 'dealmaker' || k.includes('whip') || k.includes('coalition')) return 'handshake';
    if (k === '🏛️' || k === 'insider' || k === 'capitol' || k.includes('commission') || k.includes('senate')) return 'capitol';
    if (
      k === '🕶️' ||
      k === '🕵️' ||
      k === 'shadow_cartel' ||
      k === 'fixer_ring' ||
      k.includes('shell') ||
      k.includes('dark_money') ||
      k.includes('kompromat') ||
      k.includes('bagman')
    )
      return 'syndicate';
    if (
      k === '💰' ||
      k === '💎' ||
      k === '🏦' ||
      k === 'kleptocracy' ||
      k === 'treasury' ||
      k.includes('offshore') ||
      k.includes('cayman') ||
      k.includes('crypto') ||
      k.includes('crony') ||
      k.includes('kickback')
    )
      return 'vault';
    if (
      k === '🗑️' ||
      k === '🙊' ||
      k === '📁' ||
      k === 'cover_up' ||
      k === 'captured_regulators' ||
      k.includes('shred') ||
      k.includes('watchdog') ||
      k.includes('pardon') ||
      k.includes('nda') ||
      k.includes('gag') ||
      k.includes('acting')
    )
      return 'shredder';
    if (k === '👍' || k === 'up') return 'up';
    if (k === '👎' || k === 'down') return 'down';
    if (k === '⚠️' || k === 'warn') return 'warn';
    if (k === '🎲' || k === 'dice') return 'dice';
    if (k === '🔒' || k === 'lock') return 'lock';
    if (k === '🔓' || k === 'unlock') return 'unlock';
    if (k === '⏭️' || k === 'skip') return 'skip';
    if (k === '🗣️' || k === 'speech') return 'speech';
    if (k === '🎓' || k === 'grad') return 'grad';
    if (k === 'bolt') return 'bolt';
    if (k === 'star_gold' || k === '★') return 'star_gold';
    if (k === 'star_silver') return 'star_silver';
    if (k === 'star_empty' || k === '☆') return 'star_empty';
    return 'capitol';
  });

  const strokeColor = $derived(`var(--${tone})`);
</script>

<svg
  viewBox="0 0 32 32"
  width={size}
  height={size}
  class="civic-emblem"
  role={label ? 'img' : 'presentation'}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
  data-emblem={normalized}
>
  {#if medallion}
    <circle cx="16" cy="16" r="15" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
    <circle cx="16" cy="16" r="12.5" fill="var(--paper)" stroke={strokeColor} stroke-width="1.2" />
  {/if}

  <g transform={medallion ? 'translate(3.2, 3.2) scale(0.8)' : undefined}>
    {#if normalized === 'industrial'}
      <!-- Precision Gear + Steel Bridge Span -->
      <circle cx="16" cy="16" r="7" fill="var(--gold)" stroke="var(--ink)" stroke-width="2" />
      <circle cx="16" cy="16" r="3" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8" />
      <path
        d="M16 5 v3 M16 24 v3 M5 16 h3 M24 16 h3 M8.5 8.5 l2 2 M21.5 21.5 l2 2 M23.5 8.5 l-2 2 M10.5 21.5 l-2 2"
        stroke="var(--ink)"
        stroke-width="2.6"
        stroke-linecap="round"
      />
    {:else if normalized === 'scales'}
      <!-- Classical Scales of Justice -->
      <line x1="16" y1="5" x2="16" y2="26" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" />
      <path d="M10 26 h12" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" />
      <line x1="7" y1="10" x2="25" y2="10" stroke="var(--gold-dark)" stroke-width="2.2" stroke-linecap="round" />
      <path d="M7 10 L4 18 H10 Z" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round" />
      <path d="M25 10 L22 18 H28 Z" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round" />
      <circle cx="16" cy="6" r="2.2" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.5" />
    {:else if normalized === 'megaphone'}
      <!-- Bully Pulpit Broadcast Megaphone -->
      <path
        d="M6 14 L19 8 V24 L6 18 Z"
        fill="var(--alert)"
        stroke="var(--ink)"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <rect x="4" y="13" width="3.5" height="6" rx="1" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.6" />
      <path d="M8 18 L10 25 H13 L11 19" fill="var(--ink)" />
      <path d="M23 11 Q26 16 23 21 M26 8 Q30 16 26 24" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" />
    {:else if normalized === 'chip'}
      <!-- Silicon Wafer & Rising Trend Bars -->
      <rect x="8" y="8" width="16" height="16" rx="2.5" fill="var(--sky)" stroke="var(--ink)" stroke-width="2" />
      <rect x="11.5" y="11.5" width="9" height="9" rx="1" fill="var(--card)" stroke="var(--ink)" stroke-width="1.6" />
      <path
        d="M11 4 v4 M16 4 v4 M21 4 v4 M11 24 v4 M16 24 v4 M21 24 v4 M4 11 h4 M4 16 h4 M4 21 h4 M24 11 h4 M24 16 h4 M24 21 h4"
        stroke="var(--ink)"
        stroke-width="2"
        stroke-linecap="round"
      />
    {:else if normalized === 'globe'}
      <!-- Meridian Trade Globe -->
      <circle cx="16" cy="16" r="10.5" fill="var(--sky)" opacity=".3" />
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="var(--ink)" stroke-width="2" />
      <ellipse cx="16" cy="16" rx="5" ry="10.5" fill="none" stroke="var(--ink)" stroke-width="1.8" />
      <line x1="5.5" y1="16" x2="26.5" y2="16" stroke="var(--ink)" stroke-width="1.8" />
      <path d="M7.5 11 h17 M7.5 21 h17" stroke="var(--ink)" stroke-width="1.4" />
    {:else if normalized === 'leaf'}
      <!-- Clean Energy Leaf & Grid Bolt -->
      <path
        d="M8 24 C8 12 16 6 25 6 C25 16 20 24 8 24 Z"
        fill="var(--sage)"
        stroke="var(--ink)"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <path d="M7 25 Q15 17 21 11" fill="none" stroke="var(--card)" stroke-width="2" stroke-linecap="round" />
    {:else if normalized === 'shield'}
      <!-- National Security Heraldic Shield -->
      <path
        d="M16 4 L26 8 V15 C26 21.5 21.5 26 16 28 C10.5 26 6 21.5 6 15 V8 Z"
        fill="var(--ink)"
        stroke="var(--ink)"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <path d="M16 6.5 L23.5 9.5 V15 C23.5 19.8 20 23.5 16 25.2 Z" fill="var(--gold)" />
      <path d="M6 12 H26" stroke="var(--alert)" stroke-width="2.5" />
    {:else if normalized === 'handshake'}
      <!-- Bipartisan Legislative Clasp / Gavel Seal -->
      <rect x="6" y="12" width="20" height="8" rx="4" fill="var(--gold)" stroke="var(--ink)" stroke-width="2" />
      <path d="M11 12 v8 M16 12 v8 M21 12 v8" stroke="var(--ink)" stroke-width="1.8" />
      <path d="M3 16 h4 M25 16 h4" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" />
    {:else if normalized === 'capitol'}
      <!-- US Capitol Dome Silhouette -->
      <path d="M5 25 H27" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" />
      <rect x="7" y="18" width="18" height="7" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8" />
      <path d="M10 18 A6 6 0 0 1 22 18 Z" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.8" />
      <line x1="16" y1="8" x2="16" y2="12" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" />
      <path d="M10 18 v7 M14 18 v7 M18 18 v7 M22 18 v7" stroke="var(--ink)" stroke-width="1.5" />
    {:else if normalized === 'syndicate'}
      <!-- Shadow Syndicate Classified Briefcase & Seal -->
      <rect x="5" y="10" width="22" height="16" rx="2.5" fill="var(--alert-dark)" stroke="var(--ink)" stroke-width="2" />
      <path d="M12 10 V7 a2 2 0 0 1 2 -2 h4 a2 2 0 0 1 2 2 v3" fill="none" stroke="var(--ink)" stroke-width="2" />
      <line x1="5" y1="17" x2="27" y2="17" stroke="var(--gold)" stroke-width="2" />
      <rect x="14" y="15" width="4" height="4" rx="1" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.2" />
    {:else if normalized === 'vault'}
      <!-- Offshore Bullion & Vault Wheel -->
      <circle cx="16" cy="16" r="10.5" fill="var(--gold)" stroke="var(--ink)" stroke-width="2" />
      <circle cx="16" cy="16" r="6.5" fill="var(--card)" stroke="var(--ink)" stroke-width="1.6" />
      <path d="M16 9.5 v13 M9.5 16 h13" stroke="var(--ink)" stroke-width="2" />
      <circle cx="16" cy="16" r="2.2" fill="var(--alert)" />
    {:else if normalized === 'shredder'}
      <!-- Cover-Up Shredder & Redacted Memo -->
      <rect x="8" y="4" width="16" height="12" rx="1.5" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8" />
      <line x1="11" y1="8" x2="21" y2="8" stroke="var(--alert)" stroke-width="2.2" />
      <line x1="11" y1="12" x2="18" y2="12" stroke="var(--ink)" stroke-width="1.8" />
      <rect x="5" y="15" width="22" height="5" rx="1.5" fill="var(--ink)" />
      <path d="M10 20 v8 M14 20 v7 M18 20 v8 M22 20 v7" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" />
    {:else if normalized === 'up'}
      <!-- Positive Impact Up-Arrow Shield -->
      <circle cx="16" cy="16" r="11" fill="var(--sage)" stroke="var(--ink)" stroke-width="2" />
      <path d="M16 9 L22 16 H18 V23 H14 V16 H10 Z" fill="var(--card)" />
    {:else if normalized === 'down'}
      <!-- Negative Impact Down-Arrow Shield -->
      <circle cx="16" cy="16" r="11" fill="var(--alert)" stroke="var(--ink)" stroke-width="2" />
      <path d="M16 23 L22 16 H18 V9 H14 V16 H10 Z" fill="var(--card)" />
    {:else if normalized === 'warn'}
      <!-- Trade-off Warning Triangle -->
      <polygon points="16,4 28,26 4,26" fill="var(--gold)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
      <line x1="16" y1="11" x2="16" y2="19" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round" />
      <circle cx="16" cy="23" r="1.6" fill="var(--ink)" />
    {:else if normalized === 'dice'}
      <!-- Reroll Die Cube -->
      <rect x="5" y="5" width="22" height="22" rx="4" fill="var(--card)" stroke="var(--ink)" stroke-width="2.2" />
      <circle cx="11" cy="11" r="2.2" fill="var(--ink)" />
      <circle cx="21" cy="11" r="2.2" fill="var(--ink)" />
      <circle cx="16" cy="16" r="2.2" fill="var(--alert)" />
      <circle cx="11" cy="21" r="2.2" fill="var(--ink)" />
      <circle cx="21" cy="21" r="2.2" fill="var(--ink)" />
    {:else if normalized === 'lock'}
      <rect x="7" y="14" width="18" height="13" rx="2.5" fill="var(--gold)" stroke="var(--ink)" stroke-width="2" />
      <path d="M11 14 V10 a5 5 0 0 1 10 0 v4" fill="none" stroke="var(--ink)" stroke-width="2.2" />
      <circle cx="16" cy="20.5" r="2" fill="var(--ink)" />
    {:else if normalized === 'unlock'}
      <rect x="7" y="14" width="18" height="13" rx="2.5" fill="var(--card)" stroke="var(--ink)" stroke-width="2" />
      <path d="M11 14 V9 a5 5 0 0 1 9.5 -2" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" />
      <circle cx="16" cy="20.5" r="2" fill="var(--ink)" />
    {:else if normalized === 'skip'}
      <polygon points="6,8 17,16 6,24" fill="var(--ink)" />
      <polygon points="16,8 27,16 16,24" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round" />
    {:else if normalized === 'bolt'}
      <polygon points="18,3 7,18 15,18 13,29 25,14 17,14" fill="var(--gold)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
    {:else if normalized === 'speech'}
      <path
        d="M5 7 h22 a2 2 0 0 1 2 2 v11 a2 2 0 0 1 -2 2 h-11 l-6 5 v-5 h-5 a2 2 0 0 1 -2 -2 v-11 a2 2 0 0 1 2 -2 Z"
        fill="var(--card)"
        stroke="var(--ink)"
        stroke-width="2.2"
        stroke-linejoin="round"
      />
      <path d="M10 12 h12 M10 16 h8" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" />
    {:else if normalized === 'grad'}
      <polygon points="16,6 29,12 16,18 3,12" fill="var(--ink)" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M9 15 v6 c0 2.5 14 2.5 14 0 v-6" fill="var(--gold)" stroke="var(--ink)" stroke-width="1.8" />
      <line x1="27" y1="13" x2="27" y2="22" stroke="var(--alert)" stroke-width="2" stroke-linecap="round" />
    {:else if normalized === 'star_gold'}
      <polygon
        points="16,3 20,11 29,12.2 22.5,18.4 24,27.5 16,23.2 8,27.5 9.5,18.4 3,12.2 12,11"
        fill="var(--gold)"
        stroke="var(--ink)"
        stroke-width="2"
        stroke-linejoin="round"
      />
    {:else if normalized === 'star_silver'}
      <polygon
        points="16,3 20,11 29,12.2 22.5,18.4 24,27.5 16,23.2 8,27.5 9.5,18.4 3,12.2 12,11"
        fill="var(--hair-2)"
        stroke="var(--ink)"
        stroke-width="2"
        stroke-linejoin="round"
      />
    {:else if normalized === 'star_empty'}
      <polygon
        points="16,3 20,11 29,12.2 22.5,18.4 24,27.5 16,23.2 8,27.5 9.5,18.4 3,12.2 12,11"
        fill="none"
        stroke="var(--ink-soft)"
        stroke-width="2"
        stroke-linejoin="round"
      />
    {/if}
  </g>
</svg>

<style>
  .civic-emblem {
    display: inline-block;
    vertical-align: middle;
    flex-shrink: 0;
  }
</style>
