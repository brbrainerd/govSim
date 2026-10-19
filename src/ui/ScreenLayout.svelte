<script lang="ts">
  import type { Snippet } from 'svelte';

  // Enforces the layout grammar (design.md §7d): What (question → main → learn) | Next step.
  let { question, main, learn, next }: { question: string; main: Snippet; learn?: Snippet; next: Snippet } = $props();
</script>

<main class="what">
  <h2 class="h">{question}</h2>
  {@render main()}
  {#if learn}<div class="learn"><span class="label">Learn</span>{@render learn()}</div>{/if}
</main>
<aside class="next" aria-label="Next step">
  {@render next()}
</aside>

<style>
  .what { display: flex; flex-direction: column; gap: clamp(8px, 1.2vh, 14px); min-width: 0; min-height: 0; height: 100%; overflow-y: auto; padding: 0 clamp(2px, 0.5vw, 6px); }
  .learn { display: flex; align-items: center; gap: clamp(8px, 1vw, 14px); margin-top: auto; flex-shrink: 0; }
  .learn > .label { color: var(--paper-ink-soft); }
  .learn :global(a), .learn :global(.link) { font: 600 clamp(14px, 1.1vw, 17px) var(--font-ui); color: var(--paper-ink); background: none; border: 0; padding: 0; text-decoration: underline; cursor: pointer; }
  /* Learn cards and myth tickets arrive in a later phase; until then they are visibly inert, not dead links. */
  .learn :global(button:disabled) { opacity: .55; cursor: default; }
  .next { display: flex; flex-direction: column; gap: clamp(8px, 1.2vh, 14px); min-width: 0; min-height: 0; height: 100%; overflow-y: auto; padding-left: clamp(12px, 1.5vw, 20px); border-left: 2px solid var(--paper-ink-soft); }
</style>
