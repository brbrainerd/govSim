<script lang="ts">
  /** Horizontal or vertical separator with optional centred label. */
  interface Props {
    orientation?: "horizontal"|"vertical";
    label?: string;
  }

  const { orientation = "horizontal", label }: Props = $props();
</script>

{#if orientation === "vertical"}
  <span class="divider-v" role="separator" aria-orientation="vertical"></span>
{:else if label}
  <div class="divider-labelled" role="separator">
    <span class="line"></span>
    <span class="label">{label}</span>
    <span class="line"></span>
  </div>
{:else}
  <hr class="divider-h" />
{/if}

<style>
.divider-h {
  border: 0;
  height: 1px;
  background: var(--color-border-subtle);
  width: 100%;
}
.divider-v {
  display: inline-block;
  width: 1px;
  background: var(--color-border-subtle);
  align-self: stretch;
  min-height: 1em;
}
.divider-labelled {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
}
.divider-labelled .line {
  flex: 1;
  height: 1px;
  background: var(--color-border-subtle);
}
.divider-labelled .label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}
</style>
