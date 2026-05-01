<script lang="ts">
  /** Keyboard shortcut display. <KBD>cmd+k</KBD> renders as styled <kbd>. */
  import type { Snippet } from "svelte";

  interface Props { children?: Snippet; }
  const { children }: Props = $props();
</script>

<kbd class="kbd">{@render children?.()}</kbd>

<style>
.kbd {
  display: inline-block;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-bottom-width: 2px;
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  line-height: 1.4;
  white-space: nowrap;
}
</style>
