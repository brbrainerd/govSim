// Single source of truth for visual tokens (design.md §10). Components use the
// CSS variables these produce; no colour or font literal lives anywhere else.

const base = {
  // UI
  paper: '#F4E8CE',
  card: '#FFF8EA',
  'card-alt': '#F3ECE0',
  ink: '#1F2F55',
  'ink-soft': '#4A5677',
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

export const themes = {
  day: base,
  evil: {
    ...base,
    paper: '#1A1410',
    card: '#251C16',
    'card-alt': '#2E231C',
    ink: '#EADBB8',
    'ink-soft': '#B9A988',
    alert: '#7A1E1E',
    'alert-dark': '#5A1414',
    gold: '#C9A23A',
    'gold-dark': '#9B7924',
    sky: '#8C7B5A',
    sage: '#6E7F4A',
    'sage-dark': '#8EA064',
    dot: 'rgba(201,162,58,.14)',
    scrim: 'rgba(0,0,0,.75)',
    'sage-tint': 'rgba(110,127,74,.2)',
    'alert-tint': 'rgba(122,30,30,.25)',
    'ink-tint': 'rgba(234,219,184,.12)',
    'art-wall': '#2B211A',
    'art-sky': '#1B2236',
    'art-curtain': '#7A1E1E',
    'art-curtain-shade': '#5A1414',
    shadow: '4px 4px 0 #000',
  },
} satisfies Record<string, Record<Token, string>>;

export type ThemeName = keyof typeof themes;

export function applyTheme(name: ThemeName, el?: HTMLElement): void {
  const target = el ?? (typeof document !== 'undefined' ? document.documentElement : undefined);
  if (!target) return;
  for (const [k, v] of Object.entries(themes[name])) target.style.setProperty(`--${k}`, v);
  target.dataset.theme = name;
}
