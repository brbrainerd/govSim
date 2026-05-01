<script lang="ts">
  import { sim, ui, navigate, tickToDate } from "$lib/store.svelte";
  import { stepSim, getCurrentState, getMetricsRows, listLaws } from "$lib/ipc";
  import { beginLoad, endLoad, setError } from "$lib/store.svelte";

  async function handleStep(n: number) {
    if (!sim.loaded) return;
    beginLoad();
    try {
      sim.tick       = await stepSim(n);
      sim.currentState = await getCurrentState();
      sim.metricsRows  = await getMetricsRows(360);
      sim.laws         = await listLaws();
    } catch (e) {
      setError(String(e));
    } finally {
      endLoad();
    }
  }
</script>

<div class="shell">
  <!-- ── Sidebar ── -->
  <nav class="sidebar">
    <div class="logo">
      <span class="logo-icon">🏛</span>
      <span class="logo-text">UGS</span>
    </div>

    <ul class="nav-links">
      <li class:active={ui.view === "dashboard"}>
        <button onclick={() => navigate("dashboard")}>📊 Dashboard</button>
      </li>
      <li class:active={ui.view === "laws"}>
        <button onclick={() => navigate("laws")}>📜 Active Laws</button>
      </li>
      <li class:active={ui.view === "propose"}>
        <button onclick={() => navigate("propose")}>⚖️ Propose Law</button>
      </li>
      {#if ui.view === "effect"}
      <li class:active={true}>
        <button onclick={() => navigate("effect")}>📈 Law Effect</button>
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
        <button class="btn-step" onclick={() => handleStep(1)}  disabled={sim.loading}>+1</button>
        <button class="btn-step" onclick={() => handleStep(30)} disabled={sim.loading}>+30</button>
        <button class="btn-step" onclick={() => handleStep(360)} disabled={sim.loading}>+1yr</button>
      </div>
    </div>
    {/if}

    <div class="sidebar-footer">
      <button class="btn-scenario" onclick={() => navigate("start")}>⚙ Scenarios</button>
    </div>
  </nav>

  <!-- ── Main content ── -->
  <main class="content">
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

.sidebar-footer { margin-top: auto; }
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
