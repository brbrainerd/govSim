/**
 * Theme + density preferences.
 *
 * Reads from localStorage on startup, writes attributes onto <html> so the
 * CSS token layer can switch palettes via [data-theme] and [data-density].
 *
 * - `theme`:    "auto" | "dark" | "light"   (auto = follow prefers-color-scheme)
 * - `density`:  "compact" | "comfortable" | "spacious"
 * - `cb`:       "default" | "safe"          (color-blind palette)
 */

export type ThemeMode   = "auto" | "dark" | "light";
export type DensityMode = "compact" | "comfortable" | "spacious";
export type CBPalette   = "default" | "safe";

const KEY_THEME         = "ugs.theme";
const KEY_DENSITY       = "ugs.density";
const KEY_CB            = "ugs.cb";
const KEY_AUTOSTEP_SPEED = "ugs.autostep.speed";

function get<T extends string>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return (v as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}

/** Resolve "auto" → "dark" or "light" via prefers-color-scheme. */
function resolveTheme(mode: ThemeMode): "dark" | "light" {
  if (mode === "auto") {
    return window.matchMedia?.("(prefers-color-scheme: light)").matches
      ? "light" : "dark";
  }
  return mode;
}

export function applyTheme(mode: ThemeMode) {
  const resolved = resolveTheme(mode);
  document.documentElement.setAttribute("data-theme", resolved);
  set(KEY_THEME, mode);
}

export function applyDensity(mode: DensityMode) {
  document.documentElement.setAttribute("data-density", mode);
  set(KEY_DENSITY, mode);
}

export function applyCB(mode: CBPalette) {
  document.documentElement.setAttribute("data-cb", mode);
  set(KEY_CB, mode);
}

export function getThemeMode():   ThemeMode   { return get<ThemeMode>(KEY_THEME, "dark"); }
export function getDensityMode(): DensityMode { return get<DensityMode>(KEY_DENSITY, "comfortable"); }
export function getCBMode():      CBPalette   { return get<CBPalette>(KEY_CB, "default"); }

/** Get persisted autostep speed (ticks/second). Defaults to 2. */
export function getAutostepSpeed(): number {
  const v = parseFloat(get(KEY_AUTOSTEP_SPEED, "2"));
  return isNaN(v) ? 2 : Math.min(30, Math.max(0.5, v));
}

/** Persist autostep speed to localStorage. */
export function saveAutostepSpeed(speed: number) {
  set(KEY_AUTOSTEP_SPEED, String(speed));
}

/** Apply all persisted preferences. Call once on app startup, before mount. */
export function initPreferences() {
  applyTheme(getThemeMode());
  applyDensity(getDensityMode());
  applyCB(getCBMode());

  // Re-resolve "auto" theme when the OS preference changes.
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
      if (getThemeMode() === "auto") applyTheme("auto");
    });
  }
}

/** Cycle through theme modes: dark → light → auto → dark. */
export function cycleTheme(): ThemeMode {
  const current = getThemeMode();
  const next: ThemeMode =
    current === "dark"  ? "light" :
    current === "light" ? "auto"  : "dark";
  applyTheme(next);
  return next;
}
