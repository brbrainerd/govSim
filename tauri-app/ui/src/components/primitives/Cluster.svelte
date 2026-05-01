<script lang="ts">
  /** Horizontal flex with wrap + gap. The "row of chips/buttons" primitive. */
  import type { Snippet } from "svelte";

  interface Props {
    gap?:    "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8";
    align?:  "stretch"|"start"|"center"|"end"|"baseline";
    justify?:"start"|"center"|"end"|"between";
    wrap?:   boolean;
    children?: Snippet;
  }

  const { gap = "3", align = "center", justify = "start", wrap = true, children }: Props = $props();
</script>

<div
  class="cluster"
  style="--cluster-gap: var(--space-{gap}); --cluster-align: {align}; --cluster-justify: {justify === 'between' ? 'space-between' : `flex-${justify}`}; --cluster-wrap: {wrap ? 'wrap' : 'nowrap'};"
>
  {@render children?.()}
</div>

<style>
.cluster {
  display: flex;
  flex-direction: row;
  gap:             var(--cluster-gap);
  align-items:     var(--cluster-align);
  justify-content: var(--cluster-justify);
  flex-wrap:       var(--cluster-wrap);
}
</style>
