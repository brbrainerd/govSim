<script lang="ts">
  /** Centres content with optional max-width constraint. */
  import type { Snippet } from "svelte";

  interface Props {
    maxWidth?: string;
    children?: Snippet;
  }

  const { maxWidth = "900px", children }: Props = $props();
</script>

<div class="center" style="--center-max: {maxWidth};">
  {@render children?.()}
</div>

<style>
.center {
  margin-left: auto;
  margin-right: auto;
  max-width: var(--center-max);
  width: 100%;
}
</style>
