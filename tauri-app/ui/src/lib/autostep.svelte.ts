/**
 * Client-side auto-stepping. Calls `step_and_get_state(1)` on a setInterval.
 *
 * Pure-frontend approach (no backend cancellation tokens). The interval lives
 * in JS; pause = clearInterval. One batched IPC call per tick replaces the
 * previous 4-call chain (step + state + metrics + laws), cutting round-trip
 * overhead ~75% and eliminating inter-call state drift.
 *
 * Speed is in ticks/second. Maxes at 30 to avoid IPC saturation.
 */
import { sim } from "./store.svelte";
import { stepAndGetState } from "./ipc";
import { toast } from "./toasts.svelte";
import { getAutostepSpeed, saveAutostepSpeed } from "./theme";

export const autostep = $state<{
  running: boolean;
  /** Ticks per second */
  speed:   number;
  /** Total ticks elapsed in this auto-run (for the status display) */
  elapsed: number;
}>({
  running: false,
  speed:   getAutostepSpeed(),   // restored from localStorage
  elapsed: 0,
});

let timer: ReturnType<typeof setInterval> | null = null;
let inFlight = false;

async function tick() {
  if (inFlight) return;          // Drop ticks if previous IPC hasn't returned
  if (!sim.loaded) { stop(); return; }
  inFlight = true;
  try {
    const result     = await stepAndGetState(1, 360);
    sim.tick         = result.tick;
    sim.currentState = result.state;
    sim.metricsRows  = result.metrics;
    sim.laws         = result.laws;
    autostep.elapsed++;
  } catch (e) {
    toast.error(e, "Auto-step failed");
    stop();
  } finally {
    inFlight = false;
  }
}

export function start() {
  if (autostep.running) return;
  if (!sim.loaded) { toast.warning("Load a scenario first."); return; }
  autostep.running = true;
  autostep.elapsed = 0;
  const period = Math.max(33, Math.floor(1000 / autostep.speed));
  timer = setInterval(tick, period);
}

export function stop() {
  autostep.running = false;
  if (timer) { clearInterval(timer); timer = null; }
}

export function toggle() { autostep.running ? stop() : start(); }

/** Change speed; if running, restart interval at the new rate. Persists to localStorage. */
export function setSpeed(ticksPerSecond: number) {
  autostep.speed = Math.min(30, Math.max(0.5, ticksPerSecond));
  saveAutostepSpeed(autostep.speed);
  if (autostep.running) { stop(); start(); }
}
