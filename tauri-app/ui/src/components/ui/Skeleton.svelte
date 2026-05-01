<script lang="ts">
  /** Loading placeholder. Use to reserve layout space while data loads. */
  interface Props {
    width?:  string;
    height?: string;
    radius?: "sm"|"md"|"lg"|"full";
    /** Render N copies stacked vertically */
    repeat?: number;
  }

  const { width = "100%", height = "1em", radius = "sm", repeat = 1 }: Props = $props();
</script>

{#each Array(repeat) as _, i (i)}
<div
  class="sk"
  style="
    width:  {width};
    height: {height};
    border-radius: var(--radius-{radius});
  "
  aria-hidden="true"
></div>
{/each}

<style>
.sk {
  background: linear-gradient(
    90deg,
    var(--color-surface-2) 0%,
    var(--color-surface-3) 50%,
    var(--color-surface-2) 100%
  );
  background-size: 200% 100%;
  animation: sk-shimmer 1.4s ease-in-out infinite;
}
.sk + .sk { margin-top: var(--space-3); }

@keyframes sk-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
