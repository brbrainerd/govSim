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
  .what { display: flex; flex-direction: column; gap: 14px; min-width: 0; padding: 0 4px; }
  .learn { display: flex; align-items: center; gap: 14px; margin-top: auto; }
  .learn :global(a) { font: 600 17px var(--font-ui); color: var(--ink); }
  .next { display: flex; flex-direction: column; gap: 16px; padding-left: 20px; border-left: 2px solid var(--ink); }
</style>
