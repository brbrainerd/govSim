<script lang="ts">
  import {
    sim, ui, navigate,
    beginLoad, endLoad, setError,
  } from "$lib/store.svelte";
  import { loadScenario, getCurrentState, getMetricsRows, listLaws } from "$lib/ipc";
  import { toast } from "$lib/toasts.svelte";

  const BUILT_IN_SCENARIOS = [
    {
      name:        "modern_democracy",
      title:       "Modern Democracy",
      description: "Universal suffrage, stable institutions, low legitimacy debt. Baseline reference.",
      icon:        "🏛",
      tags:        ["5k citizens", "2 years", "low crisis"],
    },
    {
      name:        "pre_rights_era",
      title:       "Pre-Rights Era",
      description: "Historical start: no civic rights, elevated pollution, authoritarian governance.",
      icon:        "⚙",
      tags:        ["2k citizens", "3 years", "no crisis"],
    },
    {
      name:        "australia_2022",
      title:       "Australia 2022",
      description: "V-Dem / World Bank calibrated: ~$55 K/yr income, 9.1% unemployment, low corruption. No rights pre-granted — expand them through legislation.",
      icon:        "🌏",
      tags:        ["25k citizens", "V-Dem calibrated", "no rights"],
    },
  ];

  let customPath = $state("");

  async function load(name: string) {
    beginLoad();
    try {
      const loaded        = await loadScenario(name);
      sim.scenarioName    = loaded;
      sim.tick            = 0;
      sim.currentState    = await getCurrentState();
      sim.metricsRows     = await getMetricsRows(360);
      sim.laws            = await listLaws();
      sim.loaded          = true;
      navigate("dashboard");
      toast.success(`Scenario "${loaded}" loaded.`);
    } catch (e) {
      setError(String(e));
      toast.error(e, "Load scenario failed");
    } finally {
      endLoad();
    }
  }
</script>

<div class="start-view">
  <div class="hero">
    <div class="hero-icon">🏛</div>
    <h1>Universal Government Simulator</h1>
    <p class="hero-sub">
      Model legislation, observe consequences. Propose laws — watch approval,
      GDP, inequality, and pollution respond in real time.
    </p>
  </div>

  <h2 class="section-title">Choose a Scenario</h2>

  <div class="scenario-grid">
    {#each BUILT_IN_SCENARIOS as s}
    <button class="scenario-card" onclick={() => load(s.name)} disabled={sim.loading}>
      <div class="s-icon">{s.icon}</div>
      <div class="s-body">
        <h3>{s.title}</h3>
        <p>{s.description}</p>
        <div class="s-tags">
          {#each s.tags as t}
          <span class="tag">{t}</span>
          {/each}
        </div>
      </div>
    </button>
    {/each}
  </div>

  <div class="custom-section">
    <h2 class="section-title">Load from path</h2>
    <div class="custom-row">
      <input
        type="text"
        placeholder="C:\path\to\scenario.yaml or scenario_name"
        bind:value={customPath}
      />
      <button
        class="btn-load"
        onclick={() => customPath && load(customPath)}
        disabled={sim.loading || !customPath}
      >Load</button>
    </div>
  </div>

  {#if sim.error}
  <div class="err-msg">⚠ {sim.error}</div>
  {/if}
</div>

{#if sim.loading}
<div class="load-overlay" role="status" aria-label="Loading scenario…">
  <div class="load-spinner"></div>
  <span class="load-label">Loading scenario…</span>
</div>
{/if}

<style>
.start-view {
  max-width: 720px;
  margin: 0 auto;
  padding: 20px 0;
}

.hero {
  text-align: center;
  padding: 40px 20px 36px;
}
.hero-icon { font-size: 52px; margin-bottom: 16px; }
h1 { font-size: 28px; font-weight: 800; margin-bottom: 12px; }
.hero-sub { font-size: 15px; color: var(--muted); max-width: 480px; margin: 0 auto; line-height: 1.6; }

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .5px;
  margin-bottom: 12px;
}

.scenario-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 28px;
}

.scenario-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
  display: flex;
  gap: 14px;
  text-align: left;
  width: 100%;
  transition: border-color .15s, background .15s;
}
.scenario-card:hover {
  border-color: var(--accent);
  background: rgba(99,102,241,.08);
}
.scenario-card:disabled { opacity: .5; cursor: default; }

.s-icon { font-size: 28px; flex-shrink: 0; line-height: 1; }
.s-body h3 { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
.s-body p  { font-size: 12px; color: var(--muted); line-height: 1.5; margin-bottom: 10px; }

.s-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.tag {
  font-size: 10px;
  background: rgba(99,102,241,.15);
  color: #a5b4fc;
  border-radius: 4px;
  padding: 2px 7px;
}

.custom-section { margin-top: 8px; }
.custom-row { display: flex; gap: 10px; }
.custom-row input { flex: 1; }
.btn-load {
  background: var(--accent);
  color: white;
  padding: 6px 18px;
  white-space: nowrap;
}
.btn-load:disabled { opacity: .4; }

.err-msg { color: var(--danger); font-size: 13px; margin-top: 16px; }

/* Loading overlay */
.load-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  z-index: 9999;
  backdrop-filter: blur(2px);
}
.load-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255,255,255,.15);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
.load-label {
  font-size: 14px;
  color: rgba(255,255,255,.85);
  letter-spacing: .3px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
