<script lang="ts">
  /** Padded surface container. */
  import type { Snippet } from "svelte";

  interface Props {
    padding?:   "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8";
    surface?:   "1"|"2"|"3"|"none";
    border?:    boolean;
    radius?:    "sm"|"md"|"lg"|"xl"|"full"|"none";
    elevation?: "none"|"sm"|"md"|"lg"|"xl";
    children?: Snippet;
  }

  const {
    padding = "5",
    surface = "1",
    border = true,
    radius = "md",
    elevation = "none",
    children,
  }: Props = $props();

  const surfaceVar = $derived(surface === "none" ? "transparent" : `var(--color-surface-${surface})`);
  const radiusVar  = $derived(radius  === "none" ? "0" : `var(--radius-${radius})`);
  const shadowVar  = $derived(elevation === "none" ? "none" : `var(--shadow-${elevation})`);
</script>

<div
  class="box"
  class:bordered={border}
  style="
    --box-padding: var(--space-{padding});
    --box-surface: {surfaceVar};
    --box-radius:  {radiusVar};
    --box-shadow:  {shadowVar};
  "
>
  {@render children?.()}
</div>

<style>
.box {
  padding:       var(--box-padding);
  background:    var(--box-surface);
  border-radius: var(--box-radius);
  box-shadow:    var(--box-shadow);
}
.bordered { border: 1px solid var(--color-border-subtle); }
</style>
