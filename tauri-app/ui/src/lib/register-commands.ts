/**
 * Standard command registry. Called once on app startup.
 * Add navigation, simulation, and settings actions here.
 */
import { registerCommand } from "./commands.svelte";
import { ROUTES } from "./routes";
import { navigate, sim, ui, exportMetricsCsv } from "./store.svelte";
import { stepAndGetState, saveSimSnapshot } from "./ipc";
import { toast } from "./toasts.svelte";
import { cycleTheme, applyDensity } from "./theme";
import { toggle as toggleAutostep, setSpeed } from "./autostep.svelte";

async function step(n: number) {
  if (!sim.loaded) { toast.warning("Load a scenario first."); return; }
  try {
    // One batched call replaces step_sim + get_current_state + get_metrics_rows + list_laws
    const result     = await stepAndGetState(n, 360);
    sim.tick         = result.tick;
    sim.currentState = result.state;
    sim.metricsRows  = result.metrics;
    sim.laws         = result.laws;
  } catch (e) { toast.error(e, "Step failed"); }
}

export function registerStandardCommands() {
  // ── Navigation ────────────────────────────────────────────────
  for (const r of ROUTES.filter(r => r.inNav)) {
    registerCommand({
      id:       `nav.${r.view}`,
      label:    `Go to ${r.label}`,
      group:    "Navigation",
      icon:     r.icon,
      shortcut: r.shortcut ? `g ${r.shortcut}` : undefined,
      run:      () => navigate(r.view),
    });
  }
  registerCommand({
    id: "nav.start",    label: "Open Scenarios",   group: "Navigation", icon: "⚙",
    run: () => navigate("start"),
  });
  registerCommand({
    id: "nav.settings", label: "Go to Settings",   group: "Navigation", icon: "⚙", shortcut: "g s",
    run: () => navigate("settings"),
  });
  registerCommand({
    id: "nav.effect",   label: "Go to Law Effect", group: "Navigation", icon: "📈",
    run: () => {
      if (ui.effectLawId !== null) navigate("effect");
      else navigate("laws");
    },
  });
  // ── Simulation ────────────────────────────────────────────────
  registerCommand({ id: "sim.step.1",   label: "Step +1 tick",   group: "Simulation", icon: "▸",   run: () => step(1) });
  registerCommand({ id: "sim.step.30",  label: "Step +30 ticks", group: "Simulation", icon: "▸▸",  run: () => step(30) });
  registerCommand({ id: "sim.step.360", label: "Step +1 year",   group: "Simulation", icon: "▸▸▸", run: () => step(360) });
  registerCommand({
    id: "sim.autostep.toggle",
    label: "Toggle auto-step (play/pause)",
    group: "Simulation", icon: "▶", shortcut: "space",
    run: () => toggleAutostep(),
  });

  registerCommand({
    id:      "sim.monte_carlo.run",
    label:   "Run Monte Carlo analysis on selected law",
    group:   "Simulation",
    icon:    "🎲",
    shortcut: "m c",
    run: () => {
      if (!sim.loaded) { toast.warning("Load a scenario first."); return; }
      if (ui.effectLawId === null) { toast.warning("Open a law's effect analysis first: Laws → select a law → Analyze."); navigate("laws"); return; }
      ui.triggerMC = true;
      navigate("effect");
    },
  });
  registerCommand({
    id:    "sim.snapshot.save",
    label: "Save counterfactual snapshot (overwrites previous)",
    group: "Simulation",
    icon:  "📌",
    run: async () => {
      if (!sim.loaded) { toast.warning("Load a scenario first."); return; }
      try {
        const tick = await saveSimSnapshot();
        toast.success(`Snapshot saved at tick ${tick}. Enact a law to run counterfactual analysis.`);
      } catch (e) { toast.error(e, "Snapshot failed"); }
    },
  });

  // ── Settings ──────────────────────────────────────────────────
  registerCommand({
    id: "settings.theme.cycle", label: "Cycle theme (dark / light / auto)",
    group: "Settings", icon: "🎨", run: () => { cycleTheme(); },
  });
  registerCommand({
    id: "settings.density.compact", label: "Set density: Compact",
    group: "Settings", icon: "📐", run: () => applyDensity("compact"),
  });
  registerCommand({
    id: "settings.density.comfortable", label: "Set density: Comfortable",
    group: "Settings", icon: "📐", run: () => applyDensity("comfortable"),
  });
  registerCommand({
    id: "settings.density.spacious", label: "Set density: Spacious",
    group: "Settings", icon: "📐", run: () => applyDensity("spacious"),
  });

  // ── Data ──────────────────────────────────────────────────────
  registerCommand({
    id: "data.export.csv",
    label: "Export metrics to CSV",
    group: "Data",
    icon: "⬇",
    run: () => {
      if (!exportMetricsCsv()) { toast.warning("No metric data yet."); return; }
      toast.success(`Exported ${sim.metricsRows.length} rows.`);
    },
  });

  // ── Speed presets ─────────────────────────────────────────────
  for (const s of [0.5, 1, 2, 5, 10, 20, 30] as const) {
    registerCommand({
      id: `sim.speed.${s}`, label: `Set autostep speed: ${s}×`,
      group: "Simulation", icon: "⏩",
      run: () => setSpeed(s),
    });
  }
}
