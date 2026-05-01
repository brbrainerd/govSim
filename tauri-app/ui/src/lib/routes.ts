/**
 * Route registry — single source of truth for nav targets + their URLs.
 *
 * Hash-based routing (works in Tauri without a server). All routes start
 * with `/` because tinro normalises hash paths to that.
 */

export type ViewName =
  | "start"
  | "dashboard"
  | "laws"
  | "propose"
  | "effect"
  | "citizens"
  | "elections"
  | "regions"
  | "settings";

export interface RouteSpec {
  view:       ViewName;
  /** URL path matching pattern (tinro syntax). */
  path:       string;
  /** Sidebar label */
  label:      string;
  /** Sidebar emoji */
  icon:       string;
  /** Whether to show in main nav */
  inNav:      boolean;
  /** Optional keyboard shortcut prefix (after `g`) */
  shortcut?:  string;
}

export const ROUTES: RouteSpec[] = [
  { view: "start",     path: "/start",     label: "Scenarios",   icon: "⚙",  inNav: false,           },
  { view: "dashboard", path: "/dashboard", label: "Dashboard",   icon: "📊", inNav: true, shortcut: "d" },
  { view: "laws",      path: "/laws",      label: "Active Laws", icon: "📜", inNav: true, shortcut: "l" },
  { view: "propose",   path: "/propose",   label: "Propose Law", icon: "⚖",  inNav: true, shortcut: "p" },
  { view: "citizens",  path: "/citizens",  label: "Citizens",    icon: "👥", inNav: true, shortcut: "c" },
  { view: "elections", path: "/elections", label: "Elections",   icon: "🗳",  inNav: true, shortcut: "e" },
  { view: "regions",   path: "/regions",   label: "Regions",     icon: "🗺",  inNav: true, shortcut: "r" },
  { view: "effect",    path: "/effect",    label: "Law Effect",  icon: "📈", inNav: false,           },
  { view: "settings",  path: "/settings",  label: "Settings",    icon: "⚙",  inNav: false, shortcut: "s" },
];

/** Get the URL for a view. */
export function urlFor(view: ViewName): string {
  return ROUTES.find(r => r.view === view)?.path ?? "/dashboard";
}

/** Go-to-view shortcut keymap: { "d": "dashboard", "l": "laws", … }. */
export const SHORTCUTS: Record<string, ViewName> = ROUTES
  .filter(r => r.shortcut)
  .reduce((acc, r) => { acc[r.shortcut!] = r.view; return acc; }, {} as Record<string, ViewName>);
