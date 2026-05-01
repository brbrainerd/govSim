<script lang="ts">
  /**
   * Friendly placeholder for empty views with optional action.
   *
   * Usage:
   *   <EmptyState icon="📊" title="No data yet" description="Step the sim to populate the dashboard.">
   *     <Button onclick={…}>Step now</Button>
   *   </EmptyState>
   */
  import type { Snippet } from "svelte";

  interface Props {
    icon?:        string;
    title:        string;
    description?: string;
    children?:    Snippet;  /* Action slot */
  }

  const { icon = "📭", title, description, children }: Props = $props();
</script>

<div class="empty-state" role="status">
  <span class="icon" aria-hidden="true">{icon}</span>
  <h3 class="title">{title}</h3>
  {#if description}<p class="description">{description}</p>{/if}
  {#if children}<div class="action">{@render children()}</div>{/if}
</div>

<style>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-9) var(--space-7);
  gap: var(--space-3);
  color: var(--color-text-muted);
}
.icon {
  font-size: var(--font-size-4xl);
  filter: grayscale(0.3);
  opacity: 0.85;
}
.title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}
.description {
  max-width: 380px;
  line-height: var(--line-height-normal);
  font-size: var(--font-size-base);
}
.action { margin-top: var(--space-4); }
</style>
