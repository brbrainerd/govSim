<script lang="ts">
  /**
   * Vertical flex container with consistent gap.
   *
   * Usage:
   *   <Stack gap="5"><h1>…</h1><p>…</p></Stack>
   *
   * `gap` matches token space-{0..12}. Defaults to "5" (16px).
   */
  import type { Snippet } from "svelte";

  interface Props {
    gap?:    "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"|"10"|"11"|"12";
    align?:  "stretch"|"start"|"center"|"end";
    justify?:"start"|"center"|"end"|"between";
    as?:     "div"|"section"|"article"|"nav"|"main"|"aside"|"header"|"footer"|"ul"|"ol";
    children?: Snippet;
  }

  const { gap = "5", align = "stretch", justify = "start", children }: Props = $props();
</script>

<div
  class="stack"
  style="--stack-gap: var(--space-{gap}); --stack-align: {align}; --stack-justify: {justify === 'between' ? 'space-between' : `flex-${justify}`};"
>
  {@render children?.()}
</div>

<style>
.stack {
  display: flex;
  flex-direction: column;
  gap:        var(--stack-gap);
  align-items: var(--stack-align);
  justify-content: var(--stack-justify);
}
</style>
