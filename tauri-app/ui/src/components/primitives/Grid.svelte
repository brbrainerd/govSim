<script lang="ts">
  /** Auto-flowing CSS grid with min-column-width. */
  import type { Snippet } from "svelte";

  interface Props {
    /** Minimum column width before wrapping. Default 200px. */
    minColumn?: string;
    /** Gap token name. Default "5" (16px). */
    gap?: "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8";
    children?: Snippet;
  }

  const { minColumn = "200px", gap = "5", children }: Props = $props();
</script>

<div
  class="grid"
  style="--grid-min: {minColumn}; --grid-gap: var(--space-{gap});"
>
  {@render children?.()}
</div>

<style>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--grid-min), 1fr));
  gap: var(--grid-gap);
}
</style>
