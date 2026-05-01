<script lang="ts">
  import { sim, ui, navigate, tickToDate } from "$lib/store.svelte";
  import { stepAndGetState } from "$lib/ipc";
  import { beginLoad, endLoad, setError } from "$lib/store.svelte";
  import { toast } from "$lib/toasts.svelte";
  import ThemeToggle from "./ui/ThemeToggle.svelte";
  import PlayControls from "./ui/PlayControls.svelte";
  import { toggle as toggleAutostep } from "$lib/autostep.svelte";
  import { openPalette } from "$lib/commands.svelte";
  import { SHORTCUTS } from "$lib/routes";
  import { onMount, onDestroy } from "svelte";

  // Keyboard shortcuts:
  //   Space    → toggle auto-step (when not in a form field)
  //   ?        → open command palette
  //   g d/l/p/c/e/s → go-to-view two-key sequence (à la Gmail / GitHub)
  let gPrefix = false;
  let gTimer: ReturnType<typeof setTimeout> | null = null;

  function onKey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName;
    const inField = ["INPUT", "TEXTAREA", "SELECT"].includes(tag);
    if (inField) { gPrefix = false; return; }

    // ── Two-key "g <letter>" navigation ──────────────────────────
    if (gPrefix) {
      const view = SHORTCUTS[e.key];
      if (view) { e.preventDefault(); navigate(view); }
      gPrefix = false;
      if (gTimer) { clearTimeout(gTimer); gTimer = null; }
      return;
    }
    if (e.key === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      gPrefix = true;
      gTimer = setTimeout(() => { gPrefix = false; }, 500);
      return;
    }

    // ── Single-key shortcuts ──────────────────────────────────────
    if (e.code === "Space") {
      if (!sim.loaded) return;
      e.preventDefault();
      toggleAutostep();
      return;
    }
    if (e.key === "?") {
      e.preventDefault();
      openPalette();
      return;
    }
  }
  onMount(()   => window.addEventListener("keydown", onKey));
  onDestroy(() => {
    window.removeEventListener("keydown", onKey);
    if (gTimer) clearTimeout(gTimer);
  });

  async function handleStep(n: number) {
    if (!sim.loaded) return;
    beginLoad();
    try {
      const result     = await stepAndGetState(n, 360);
      sim.tick         = result.tick;
      sim.currentState = result.state;
      sim.metricsRows  = result.metrics;
      sim.laws         = result.laws;
    } catch (e) {
      setError(String(e));
      toast.error(e, "Step failed");
    } finally {
      endLoad();
    }
  }
</script>

<!-- Skip-to-content link — visually hidden until focused (AC-001) -->
<a class="skip-link" href="#main-content">Skip to main content</a>

<div class="shell">
  <!-- ── Sidebar ── -->
  <nav class="sidebar">
    <div class="logo">
      <span class="logo-icon">🏛</span>
      <span class="logo-text">UGS</span>
    </div>

    <ul class="nav-links" role="list">
      <li class:active={ui.view === "dashboard"}>
        <button onclick={() => navigate("dashboard")} aria-current={ui.view === "dashboard" ? "page" : undefined}>📊 Dashboard</button>
      </li>
      <li class:active={ui.view === "laws"}>
        <button onclick={() => navigate("laws")} aria-current={ui.view === "laws" ? "page" : undefined}>📜 Active Laws</button>
      </li>
      <li class:active={ui.view === "propose"}>
        <button onclick={() => navigate("propose")} aria-current={ui.view === "propose" ? "page" : undefined}>⚖️ Propose Law</button>
      </li>
      <li class:active={ui.view === "citizens"}>
        <button onclick={() => navigate("citizens")} aria-current={ui.view === "citizens" ? "page" : undefined}>👥 Citizens</button>
      </li>
      <li class:active={ui.view === "elections"}>
        <button onclick={() => navigate("elections")} aria-current={ui.view === "elections" ? "page" : undefined}>🗳 Elections</button>
      </li>
      <li class:active={ui.view === "regions"}>
        <button onclick={() => navigate("regions")} aria-current={ui.view === "regions" ? "page" : undefined}>🗺 Regions</button>
      </li>
      {#if ui.view === "effect"}
      <li class:active={true}>
        <button onclick={() => navigate("effect")} aria-current="page">📈 Law Effect</button>
      </li>
      {/if}
    </ul>

    {#if sim.loaded}
    <div class="sim-controls">
      <div class="sim-tick">
        <span class="tick-label">Tick</span>
        <span class="tick-value">{sim.tick}</span>
        <span class="tick-date">{tickToDate(sim.tick)}</span>
      </div>
      <div class="step-buttons">
        <button class="btn-step" onclick={() => handleStep(1)}   disabled={sim.loading} aria-label="Step 1 tick">+1</button>
        <button class="btn-step" onclick={() => handleStep(30)}  disabled={sim.loading} aria-label="Step 30 ticks">+30</button>
        <button class="btn-step" onclick={() => handleStep(360)} disabled={sim.loading} aria-label="Step 1 year (360 ticks)">+1yr</button>
      </div>
      <PlayControls />
    </div>
    {/if}

    <div class="sidebar-footer">
      <button
        class="btn-palette"
        onclick={openPalette}
        title="Open command palette (Cmd+K or ?)"
      >
        🔍 <span>Commands</span> <kbd class="kbd-hint">?</kbd>
      </button>
      <ThemeToggle />
      <div class="footer-row">
        <button class="btn-scenario" onclick={() => navigate("settings")} title="Open settings (g s)">⚙ Settings</button>
        <button class="btn-scenario" onclick={() => navigate("start")} title="Switch scenario">📁 Scenarios</button>
      </div>
    </div>
  </nav>

  <!-- ── Visually-hidden aria-live region: announces tick / date changes to screen readers ── -->
  <div class="sr-only" aria-live="polite" aria-atomic="true">
    {#if sim.loaded}Tick {sim.tick}, {tickToDate(sim.tick)}{/if}
  </div>

  <!-- ── Main content ── -->
  <main id="main-content" class="content">
    {#if sim.loading}
    <div class="loading-bar"></div>
    {/if}

    {#if sim.error}
    <div class="error-banner">
      ⚠ {sim.error}
      <button onclick={() => { sim.error = null; }}>✕</button>
    </div>
    {/if}

    <slot />
  </main>
</div>

<style>
.shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  min-width: 200px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0 12px;
  border-bottom: 1px solid var(--border);
}
.logo-icon { font-size: 20px; }
.logo-text  { font-size: 16px; font-weight: 700; letter-spacing: .5px; }

.nav-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.nav-links li button {
  width: 100%;
  text-align: left;
  background: transparent;
  color: var(--muted);
  padding: 8px 10px;
  border-radius: var(--radius);
  font-size: 13px;
}
.nav-links li.active button,
.nav-links li button:hover {
  background: rgba(99,102,241,.15);
  color: var(--text);
}

.sim-controls {
  border-top: 1px solid var(--border);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sim-tick {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tick-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; }
.tick-value { font-size: 20px; font-weight: 700; line-height: 1; }
.tick-date  { font-size: 11px; color: var(--muted); }

.step-buttons {
  display: flex;
  gap: 4px;
}
.btn-step {
  flex: 1;
  background: var(--accent);
  color: white;
  padding: 5px 0;
  font-size: 12px;
}
.btn-step:disabled { opacity: .4; cursor: default; }

.sidebar-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.btn-palette {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: transparent;
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  text-align: left;
}
.btn-palette:hover { border-color: var(--color-border-strong); color: var(--color-text-primary); }
.btn-palette span  { flex: 1; }
.footer-row { display: flex; gap: var(--space-2); }
.footer-row .btn-scenario { flex: 1; }
.kbd-hint {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  background: var(--color-surface-2);
  padding: 1px 5px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
}
.btn-scenario {
  width: 100%;
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  text-align: left;
  padding: 6px 10px;
  border: 1px solid var(--border);
}

.content {
  flex: 1;
  overflow-y: auto;
  position: relative;
  padding: 24px;
}

.loading-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--accent);
  animation: slide 1s linear infinite;
}
@keyframes slide {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.error-banner {
  background: rgba(239,68,68,.15);
  border: 1px solid rgba(239,68,68,.4);
  border-radius: var(--radius);
  color: var(--danger);
  padding: 10px 14px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
.error-banner button {
  background: transparent;
  color: var(--danger);
  padding: 2px 6px;
  font-size: 14px;
}
</style>
