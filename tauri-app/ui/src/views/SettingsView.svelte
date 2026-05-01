<script lang="ts">
  import {
    applyTheme, applyDensity, applyCB,
    getThemeMode, getDensityMode, getCBMode,
    type ThemeMode, type DensityMode, type CBPalette,
  } from "$lib/theme";
  import { autostep, setSpeed } from "$lib/autostep.svelte";
  import { sim, exportMetricsCsv } from "$lib/store.svelte";

  let theme:   ThemeMode   = $state(getThemeMode());
  let density: DensityMode = $state(getDensityMode());
  let cb:      CBPalette   = $state(getCBMode());

  $effect(() => { applyTheme(theme); });
  $effect(() => { applyDensity(density); });
  $effect(() => { applyCB(cb); });

  const SPEED_PRESETS = [0.5, 1, 2, 5, 10, 20, 30] as const;

  function exportCsv() {
    if (!exportMetricsCsv()) { alert("No metric data to export — run some ticks first."); }
  }

  const THEME_OPTS: Array<{ value: ThemeMode;   label: string; icon: string }> = [
    { value: "dark",  label: "Dark",  icon: "🌙" },
    { value: "light", label: "Light", icon: "☀" },
    { value: "auto",  label: "Auto (follow OS)", icon: "🖥" },
  ];
  const DENSITY_OPTS: Array<{ value: DensityMode; label: string }> = [
    { value: "compact",     label: "Compact"     },
    { value: "comfortable", label: "Comfortable" },
    { value: "spacious",    label: "Spacious"    },
  ];
  const CB_OPTS: Array<{ value: CBPalette; label: string; description: string }> = [
    { value: "default", label: "Default",      description: "Standard categorical chart palette." },
    { value: "safe",    label: "Color-blind safe", description: "Wong 2011 palette — distinguishable for deuteranopia / protanopia." },
  ];
</script>

<div class="settings-view">
  <div class="page-header">
    <h1>Settings</h1>
  </div>

  <!-- ── Appearance ── -->
  <section class="section">
    <h2 class="section-title">Appearance</h2>

    <div class="row">
      <div class="row-label">
        <div class="row-title">Theme</div>
        <div class="row-help">Color scheme for the entire interface.</div>
      </div>
      <div class="row-control">
        <div class="seg" role="radiogroup" aria-label="Theme">
          {#each THEME_OPTS as opt}
            <button
              role="radio"
              aria-checked={theme === opt.value}
              class:active={theme === opt.value}
              onclick={() => theme = opt.value}
            >
              <span class="seg-icon">{opt.icon}</span> {opt.label}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <div class="row">
      <div class="row-label">
        <div class="row-title">Density</div>
        <div class="row-help">Spacing and text size throughout the UI.</div>
      </div>
      <div class="row-control">
        <div class="seg" role="radiogroup" aria-label="Density">
          {#each DENSITY_OPTS as opt}
            <button
              role="radio"
              aria-checked={density === opt.value}
              class:active={density === opt.value}
              onclick={() => density = opt.value}
            >
              {opt.label}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <div class="row">
      <div class="row-label">
        <div class="row-title">Chart palette</div>
        <div class="row-help">Affects categorical colors used in line / bar charts.</div>
      </div>
      <div class="row-control">
        <div class="seg" role="radiogroup" aria-label="Chart palette">
          {#each CB_OPTS as opt}
            <button
              role="radio"
              aria-checked={cb === opt.value}
              class:active={cb === opt.value}
              onclick={() => cb = opt.value}
              title={opt.description}
            >
              {opt.label}
            </button>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <!-- ── Simulation ── -->
  <section class="section">
    <h2 class="section-title">Simulation</h2>

    <div class="row">
      <div class="row-label">
        <div class="row-title">Autostep speed</div>
        <div class="row-help">Ticks per second during auto-run. Persisted across sessions.</div>
      </div>
      <div class="row-control speed-control">
        <div class="seg" role="radiogroup" aria-label="Autostep speed">
          {#each SPEED_PRESETS as s}
          <button
            role="radio"
            aria-checked={autostep.speed === s}
            class:active={autostep.speed === s}
            onclick={() => setSpeed(s)}
          >
            {s}×
          </button>
          {/each}
        </div>
        <span class="speed-note">current: <strong>{autostep.speed}×</strong></span>
      </div>
    </div>
  </section>

  <!-- ── Data ── -->
  <section class="section">
    <h2 class="section-title">Data</h2>
    <div class="row">
      <div class="row-label">
        <div class="row-title">Export metric history</div>
        <div class="row-help">Download all {sim.metricsRows.length} tick rows as a CSV file for external analysis.</div>
      </div>
      <div class="row-control">
        <button
          class="btn-export"
          onclick={exportCsv}
          disabled={!sim.loaded || sim.metricsRows.length === 0}
        >
          ⬇ Export CSV
        </button>
      </div>
    </div>
  </section>

  <!-- ── Keyboard shortcuts ── -->
  <section class="section">
    <h2 class="section-title">Keyboard Shortcuts</h2>
    <div class="shortcut-grid">
      {#each [
        ["Space",    "Toggle auto-step"],
        ["?",        "Open command palette"],
        ["g d",      "Go to Dashboard"],
        ["g l",      "Go to Active Laws"],
        ["g p",      "Go to Propose Law"],
        ["g c",      "Go to Citizens"],
        ["g e",      "Go to Elections"],
        ["g r",      "Go to Regions"],
        ["g s",      "Go to Settings"],
        ["Escape",   "Close drawer / palette"],
        ["↑ / ↓",   "Navigate palette list"],
        ["Enter",    "Run palette command"],
        ["Tab",      "Move focus forward"],
        ["Shift+Tab","Move focus backward"],
      ] as [key, desc]}
      <div class="shortcut-row">
        <kbd class="kbd">{key}</kbd>
        <span class="shortcut-desc">{desc}</span>
      </div>
      {/each}
    </div>
  </section>

  <!-- ── About ── -->
  <section class="section">
    <h2 class="section-title">About</h2>
    <div class="about">
      <p><strong>UGS</strong> — Universal Government Simulator</p>
      <p class="muted">Bevy ECS · Svelte 5 · Tauri 2 · ECharts</p>
      <p class="muted">Settings are stored in <code>localStorage</code> and persist across sessions.</p>
    </div>
  </section>
</div>

<style>
.settings-view { max-width: 720px; }

.page-header { margin-bottom: var(--space-7); }
h1 { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); }

.section {
  background: var(--color-surface-1);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  margin-bottom: var(--space-5);
}
.section-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  margin-bottom: var(--space-5);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border-subtle);
}
.row:last-child { border-bottom: none; padding-bottom: 0; }
.row-label { flex: 1; min-width: 0; }
.row-title { font-weight: var(--font-weight-semibold); margin-bottom: var(--space-1); }
.row-help  { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.row-control { flex-shrink: 0; }

/* Segmented control */
.seg {
  display: inline-flex;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 2px;
}
.seg button {
  background: transparent;
  color: var(--color-text-secondary);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.seg button.active {
  background: var(--color-surface-elev);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-sm);
}
.seg-icon { font-size: var(--font-size-md); line-height: 1; }

.about p { margin-bottom: var(--space-3); }
.about .muted { color: var(--color-text-muted); font-size: var(--font-size-sm); }
.about code  { background: var(--color-surface-2); padding: 1px 6px; border-radius: var(--radius-sm); font-size: var(--font-size-sm); }

/* Speed control */
.speed-control { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-2); }
.speed-note    { font-size: var(--font-size-xs); color: var(--color-text-muted); }

/* Export button */
.btn-export {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}
.btn-export:hover:not(:disabled) { border-color: var(--color-border-strong); color: var(--color-text-primary); }
.btn-export:disabled { opacity: .4; }

/* Keyboard shortcuts */
.shortcut-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2) var(--space-6);
}
.shortcut-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-1) 0;
}
.kbd {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border-subtle);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  min-width: 80px;
  text-align: center;
}
.shortcut-desc { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
</style>
