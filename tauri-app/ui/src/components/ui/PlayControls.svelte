<script lang="ts">
  /** Play/pause + speed slider for auto-stepping the simulation. */
  import { autostep, toggle, setSpeed } from "$lib/autostep.svelte";
  import Tooltip from "./Tooltip.svelte";

  const SPEEDS = [0.5, 1, 2, 5, 10, 20, 30];

  function onSpeedChange(e: Event) {
    const v = parseFloat((e.target as HTMLInputElement).value);
    setSpeed(v);
  }
</script>

<div class="play-controls" role="group" aria-label="Auto-step controls">
  <Tooltip text={autostep.running ? "Pause (Space)" : "Play (Space)"}>
    <button
      class="play-btn"
      class:running={autostep.running}
      onclick={toggle}
      aria-label={autostep.running ? "Pause auto-step" : "Start auto-step"}
    >
      {autostep.running ? "⏸" : "▶"}
    </button>
  </Tooltip>
  <div class="speed">
    <label for="speed-range" class="sr-only">Speed</label>
    <input
      id="speed-range"
      type="range"
      list="speed-marks"
      min="0.5"
      max="30"
      step="0.5"
      value={autostep.speed}
      oninput={onSpeedChange}
    />
    <datalist id="speed-marks">
      {#each SPEEDS as s}<option value={s}></option>{/each}
    </datalist>
    <span class="speed-label">{autostep.speed.toFixed(1)}×</span>
  </div>
  {#if autostep.running}
    <span class="elapsed">+{autostep.elapsed}t</span>
  {/if}
</div>

<style>
.play-controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-subtle);
}
.play-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-md);
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  border-radius: var(--radius-sm);
  padding: 0;
}
.play-btn.running {
  background: var(--color-warning);
  color: var(--color-text-inverse);
}

.speed {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
}
.speed input[type="range"] {
  flex: 1;
  accent-color: var(--color-brand);
  background: transparent;
  border: none;
  padding: 0;
  min-width: 80px;
}
.speed input[type="range"]:focus { box-shadow: none; }
.speed-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  min-width: 32px;
  text-align: right;
}
.elapsed {
  font-size: var(--font-size-xs);
  color: var(--color-warning);
  font-family: var(--font-mono);
  font-weight: var(--font-weight-semibold);
}
</style>
