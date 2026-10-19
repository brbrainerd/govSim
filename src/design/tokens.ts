// Single source of truth for visual tokens (design.md §10). Components use the
// CSS variables these produce; no colour or font literal lives anywhere else.

const base = {
  // UI
  canvas: '#F4E8CE',
  paper: '#F4E8CE',
  'paper-warm': '#EFE0C2',
  'paper-dark': '#E6D6B2',
  card: '#FFF8EA',
  'card-alt': '#F3ECE0',
  ink: '#1F2F55',
  'ink-soft': '#4A5677',
  'paper-ink': '#1F2F55',
  'paper-ink-soft': '#4A5677',
  alert: '#B5402F',
  'alert-dark': '#8E2F22',
  gold: '#D9A23B',
  'gold-dark': '#A9771F',
  sky: '#4FA3D9',
  sage: '#4E9E74',
  'sage-dark': '#2B6E47',
  dot: 'rgba(31,47,85,.09)',
  scrim: 'rgba(31,47,85,.65)',
  'sage-tint': 'rgba(43,110,71,.12)',
  'alert-tint': 'rgba(142,47,34,.12)',
  'ink-tint': 'rgba(74,86,119,.15)',
  // Illustration
  'art-wall': '#F6EDD8',
  'art-trim': '#E6D6B2',
  'art-sky': '#9FD3F2',
  'art-cloud': '#FFFFFF',
  'art-grass': '#7DBB7A',
  'art-curtain': '#E2B04A',
  'art-curtain-shade': '#C48F2E',
  'art-wood': '#9A6236',
  'art-wood-dark': '#6E4223',
  'art-wood-light': '#B87B48',
  'art-carpet': '#2D4A86',
  'art-floor': '#C49A6C',
  'art-shirt': '#FFFFFF',
  'art-shirt-blue': '#96BEED',
  'art-khaki': '#946642',
  'art-cardigan': '#919191',
  'art-charcoal': '#3A3A3C',
  'art-navy-pants': '#172347',
  'art-suit-black': '#111318',
  'art-plum': '#9F6CA8',
  'art-plum-dark': '#6E3B78',
  'art-scrubs': '#47B8A6',
  'art-scrubs-dark': '#2A8F7E',
  'art-mouth': '#5A1E28',
  'art-tongue': '#E05A6B',
  'art-flag-red': '#C8463A',
  'skin-1': '#E2BE96',
  'skin-2': '#CC8E62',
  'skin-3': '#965F3E',
  'skin-4': '#684430',
  'hair-1': '#4A3222',
  'hair-2': '#C9CCD2',
  'hair-3': '#1C1B1F',
  'hair-4': '#C9CCD2',
  // Type
  'font-display': "'Arvo', Georgia, serif",
  'font-ui': "'Barlow Condensed', 'Arial Narrow', sans-serif",
  'font-body': "'Atkinson Hyperlegible', system-ui, sans-serif",
  // Shape & motion
  'r-sm': '10px',
  'r-md': '14px',
  rule: '2.5px',
  shadow: '4px 4px 0 #1F2F55',
  'dur-fast': '.15s',
  dur: '.45s',
  'ease-pop': 'cubic-bezier(.2,1.4,.4,1)',
};

export type Token = keyof typeof base;

// Evil Mode matches .design-targets/g-evil.png:
// - Outer canvas (--canvas) is dark charcoal-espresso (#1A1410) with gold halftone dots.
// - Cards (--card), sub-surfaces (--paper, --card-alt), and SVG paper/lamp fills stay warm cream parchment (#F5EBD6 / #E6D5B8).
// - Ink (--ink) stays dark espresso-black (#1E1612) so cards and SVG illustrations never invert into a photo-negative.
// - Headlines/labels sitting directly on the dark outer canvas use --paper-ink (#F5EBD6) and --paper-ink-soft (#D5C29A).
export const themes = {
  day: base,
  evil: {
    ...base,
    canvas: '#1A1410',
    paper: '#E6D5B8',
    'paper-warm': '#DEC9A4',
    'paper-dark': '#D2B98E',
    card: '#F5EBD6',
    'card-alt': '#E8D9BC',
    ink: '#1E1612',
    'ink-soft': '#38281A',
    'paper-ink': '#F5EBD6',
    'paper-ink-soft': '#D5C29A',
    alert: '#661214',
    'alert-dark': '#4E0D0F',
    gold: '#C8A252',
    'gold-dark': '#664B14',
    sky: '#3B7EA8',
    sage: '#3E7B52',
    'sage-dark': '#265336',
    dot: 'rgba(201,162,58,.16)',
    scrim: 'rgba(12,9,7,.78)',
    'sage-tint': 'rgba(62,123,82,.16)',
    'alert-tint': 'rgba(122,30,30,.15)',
    'ink-tint': 'rgba(30,22,18,.12)',
    'art-wall': '#584222',
    'art-trim': '#3D2D16',
    'art-sky': '#141821',
    'art-curtain': '#7A1E1E',
    'art-curtain-shade': '#521212',
    'art-wood': '#4A2E1B',
    'art-wood-dark': '#2E1B0F',
    'art-wood-light': '#68432A',
    'art-floor': '#462D1B',
    shadow: '4px 4px 0 #0D0907',
  },
} satisfies Record<string, Record<Token, string>>;

export type ThemeName = keyof typeof themes;

export function applyTheme(name: ThemeName, el?: HTMLElement): void {
  const target = el ?? (typeof document !== 'undefined' ? document.documentElement : undefined);
  if (!target) return;
  for (const [k, v] of Object.entries(themes[name])) target.style.setProperty(`--${k}`, v);
  target.dataset.theme = name;
}
