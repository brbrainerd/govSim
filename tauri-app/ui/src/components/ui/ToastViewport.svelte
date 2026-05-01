<script lang="ts">
  /**
   * Global toast renderer. Mount once, near the root of the app.
   * Subscribes to the `toasts` store and renders a fixed stack.
   */
  import { toasts, dismissToast } from "$lib/toasts.svelte";

  const ICONS: Record<string, string> = {
    info: "ℹ", success: "✓", warning: "⚠", danger: "✕",
  };
</script>

<div class="viewport" role="region" aria-label="Notifications" aria-live="polite">
  {#each toasts.items as t (t.id)}
    <div class="toast" data-variant={t.variant}>
      <span class="icon" aria-hidden="true">{ICONS[t.variant]}</span>
      <div class="body">
        {#if t.title}<div class="title">{t.title}</div>{/if}
        <div class="message">{t.message}</div>
      </div>
      <button class="close" onclick={() => dismissToast(t.id)} aria-label="Dismiss">✕</button>
    </div>
  {/each}
</div>

<style>
.viewport {
  position: fixed;
  bottom:   var(--space-5);
  right:    var(--space-5);
  display: flex;
  flex-direction: column-reverse;
  gap: var(--space-3);
  z-index: var(--z-toast);
  pointer-events: none;
  max-width: 380px;
}
.toast {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-surface-elev);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
  animation: toast-in var(--duration-normal) var(--ease-emphasised);
}
.toast[data-variant="success"] { border-left: 3px solid var(--color-success); }
.toast[data-variant="warning"] { border-left: 3px solid var(--color-warning); }
.toast[data-variant="danger"]  { border-left: 3px solid var(--color-danger); }
.toast[data-variant="info"]    { border-left: 3px solid var(--color-info); }

.icon { font-size: var(--font-size-md); line-height: 1; padding-top: 2px; flex-shrink: 0; }
.toast[data-variant="success"] .icon { color: var(--color-success); }
.toast[data-variant="warning"] .icon { color: var(--color-warning); }
.toast[data-variant="danger"]  .icon { color: var(--color-danger); }
.toast[data-variant="info"]    .icon { color: var(--color-info); }

.body { flex: 1; min-width: 0; font-size: var(--font-size-base); }
.title { font-weight: var(--font-weight-semibold); margin-bottom: var(--space-1); }
.message { color: var(--color-text-secondary); line-height: var(--line-height-normal); word-wrap: break-word; }

.close {
  background: transparent;
  color: var(--color-text-muted);
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-sm);
}
.close:hover { background: var(--color-surface-2); color: var(--color-text-primary); }

@keyframes toast-in {
  from { transform: translateX(20px); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
</style>
