<script lang="ts">
  // Navy banner with folded tails (or crimson in Evil Mode matching g-evil.png); used only for the screen title (design.md §7d).
  let { text }: { text: string } = $props();
</script>

<div class="ribbon">
  <svg class="tail left" viewBox="0 0 60 56" aria-hidden="true"><path class="tail-main" d="M60 10 H0 L16 33 L0 56 H60 Z" fill="var(--ink)" /><path class="tail-fold" d="M44 46 L60 56 V46 Z" fill="var(--ink)" opacity=".55" /></svg>
  <h1>{text}</h1>
  <svg class="tail right" viewBox="0 0 60 56" aria-hidden="true"><path class="tail-main" d="M0 10 H60 L44 33 L60 56 H0 Z" fill="var(--ink)" /><path class="tail-fold" d="M16 46 L0 56 V46 Z" fill="var(--ink)" opacity=".55" /></svg>
</div>

<style>
  .ribbon { position: relative; display: flex; align-items: flex-start; }
  h1 {
    position: relative; z-index: 1; margin: 0; padding: 8px 36px 10px; background: var(--ink); color: var(--card);
    font: 700 34px/1 var(--font-display); letter-spacing: .05em; text-transform: uppercase; white-space: nowrap;
    box-shadow: inset 0 0 0 2px var(--ink), inset 0 0 0 4px var(--card);
  }
  :global([data-theme="evil"]) h1 {
    background: var(--alert);
    color: var(--card);
    box-shadow: inset 0 0 0 2px var(--ink), inset 0 0 0 4px var(--gold);
  }
  :global([data-theme="evil"]) .tail-main {
    fill: var(--alert-dark);
  }
  :global([data-theme="evil"]) .tail-fold {
    fill: var(--ink);
  }
  .tail { width: 56px; height: 52px; margin-top: 12px; }
  .left { margin-right: -14px; }
  .right { margin-left: -14px; }
</style>
