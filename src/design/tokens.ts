// Single source of truth for visual tokens (design.md §10). Components use the
// CSS variables these produce; no colour or font literal lives anywhere else.

const base = {
  paper: '#F6EBD3',
  card: '#FFF8EA',
  ink: '#1F2F55',
  'ink-soft': '#4A5677',
  alert: '#B5402F',
  gold: '#D9A23B',
  sky: '#4FA3D9',
  sage: '#5BAF85',
  'skin-1': '#C68B59',
  'skin-2': '#7A4A2B',
  dot: 'rgba(31,47,85,.10)',
  'font-display': "'Rokkitt', Georgia, serif",
  'font-body': "'Atkinson Hyperlegible', system-ui, sans-serif",
  'r-sm': '10px',
  'r-md': '14px',
  rule: '2px',
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
    ink: '#EADBB8',
    'ink-soft': '#B9A988',
    alert: '#7A1E1E',
    gold: '#C9A23A',
    sky: '#8C7B5A',
    sage: '#6E7F4A',
    dot: 'rgba(201,162,58,.14)',
    shadow: '4px 4px 0 #000',
  },
} satisfies Record<string, Record<Token, string>>;

export type ThemeName = keyof typeof themes;

export function applyTheme(name: ThemeName, el: HTMLElement = document.documentElement): void {
  for (const [k, v] of Object.entries(themes[name])) el.style.setProperty(`--${k}`, v);
  el.dataset.theme = name;
}
