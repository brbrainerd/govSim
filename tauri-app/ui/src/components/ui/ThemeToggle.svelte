<script lang="ts">
  /** Cycles through theme modes: dark → light → auto → dark. */
  import { cycleTheme, getThemeMode } from "$lib/theme";

  let mode = $state(getThemeMode());

  function handleClick() {
    mode = cycleTheme();
  }

  const ICON: Record<string, string> = { dark: "🌙", light: "☀", auto: "🖥" };
  const LABEL: Record<string, string> = { dark: "Dark", light: "Light", auto: "Auto" };
</script>

<button
  class="theme-toggle"
  onclick={handleClick}
  title={`Theme: ${LABEL[mode]} (click to cycle)`}
  aria-label={`Theme: ${LABEL[mode]}. Click to switch.`}
>
  <span class="icon" aria-hidden="true">{ICON[mode]}</span>
  <span class="label">{LABEL[mode]}</span>
</button>

<style>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: transparent;
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}
.theme-toggle:hover {
  border-color: var(--color-border-strong);
  color: var(--color-text-primary);
}
.icon { font-size: var(--font-size-md); line-height: 1; }
</style>
