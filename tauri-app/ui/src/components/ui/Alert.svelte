<script lang="ts">
  /** Inline contextual message — info / success / warning / danger. */
  import type { Snippet } from "svelte";

  interface Props {
    variant?: "info"|"success"|"warning"|"danger";
    title?:   string;
    onClose?: () => void;
    children?: Snippet;
  }

  const { variant = "info", title, onClose, children }: Props = $props();

  const ICONS: Record<string, string> = {
    info: "ℹ", success: "✓", warning: "⚠", danger: "✕",
  };
</script>

<div class="alert" data-variant={variant} role={variant === "danger" || variant === "warning" ? "alert" : "status"}>
  <span class="icon" aria-hidden="true">{ICONS[variant]}</span>
  <div class="body">
    {#if title}<div class="title">{title}</div>{/if}
    <div class="content">{@render children?.()}</div>
  </div>
  {#if onClose}
    <button class="close" onclick={onClose} aria-label="Dismiss">✕</button>
  {/if}
</div>

<style>
.alert {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-md);
  border: 1px solid;
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}
.alert[data-variant="info"]    { background: var(--color-info-subtle);    border-color: var(--color-info);    color: var(--color-text-primary); }
.alert[data-variant="success"] { background: var(--color-success-subtle); border-color: var(--color-success); color: var(--color-text-primary); }
.alert[data-variant="warning"] { background: var(--color-warning-subtle); border-color: var(--color-warning); color: var(--color-text-primary); }
.alert[data-variant="danger"]  { background: var(--color-danger-subtle);  border-color: var(--color-danger);  color: var(--color-text-primary); }

.icon { font-size: var(--font-size-md); flex-shrink: 0; line-height: 1; padding-top: 2px; }
.alert[data-variant="info"]    .icon { color: var(--color-info); }
.alert[data-variant="success"] .icon { color: var(--color-success); }
.alert[data-variant="warning"] .icon { color: var(--color-warning); }
.alert[data-variant="danger"]  .icon { color: var(--color-danger); }

.body { flex: 1; min-width: 0; }
.title { font-weight: var(--font-weight-semibold); margin-bottom: var(--space-1); }
.content { color: var(--color-text-secondary); }

.close {
  background: transparent;
  color: var(--color-text-muted);
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
.close:hover { background: var(--color-surface-2); color: var(--color-text-primary); }
</style>
