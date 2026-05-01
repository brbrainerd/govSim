<script lang="ts">
  /**
   * Accessible modal dialog.
   * - ESC closes
   * - Click on backdrop closes (configurable)
   * - Focus trapped inside while open
   * - Restores focus to trigger on close
   * - Body scroll locked while open
   */
  import { onMount, onDestroy } from "svelte";
  import type { Snippet } from "svelte";

  interface Props {
    open:        boolean;
    title?:      string;
    size?:       "sm"|"md"|"lg"|"xl";
    closeOnBackdrop?: boolean;
    onClose?:    () => void;
    children?:   Snippet;
    footer?:     Snippet;
  }

  const {
    open,
    title,
    size = "md",
    closeOnBackdrop = true,
    onClose,
    children,
    footer,
  }: Props = $props();

  let dialog: HTMLDivElement | undefined = $state();
  let previouslyFocused: HTMLElement | null = null;
  let scrollLockedByThisInstance = false;

  function close() { onClose?.(); }

  function handleKeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Tab" && dialog) {
      // Focus trap
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (closeOnBackdrop && e.target === e.currentTarget) close();
  }

  // Counter so nested modals don't release the scroll lock prematurely.
  function pushScrollLock() {
    if (scrollLockedByThisInstance) return;
    scrollLockedByThisInstance = true;
    const n = parseInt(document.body.dataset.modalLockCount ?? "0", 10) + 1;
    document.body.dataset.modalLockCount = String(n);
    if (n === 1) document.body.style.overflow = "hidden";
  }
  function popScrollLock() {
    if (!scrollLockedByThisInstance) return;
    scrollLockedByThisInstance = false;
    const n = Math.max(0, parseInt(document.body.dataset.modalLockCount ?? "1", 10) - 1);
    document.body.dataset.modalLockCount = String(n);
    if (n === 0) document.body.style.overflow = "";
  }

  $effect(() => {
    if (open) {
      previouslyFocused = document.activeElement as HTMLElement | null;
      pushScrollLock();
      // Focus first element after the dialog mounts
      queueMicrotask(() => {
        const first = dialog?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        first?.focus();
      });
    } else {
      popScrollLock();
      previouslyFocused?.focus();
    }
  });

  onMount(() => window.addEventListener("keydown", handleKeydown));
  onDestroy(() => {
    window.removeEventListener("keydown", handleKeydown);
    popScrollLock();
  });
</script>

{#if open}
<div
  class="backdrop"
  role="presentation"
  onclick={handleBackdropClick}
>
  <div
    bind:this={dialog}
    class="dialog"
    data-size={size}
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? "modal-title" : undefined}
    tabindex="-1"
  >
    {#if title}
    <header class="header">
      <h2 id="modal-title">{title}</h2>
      <button class="close" onclick={close} aria-label="Close dialog">✕</button>
    </header>
    {/if}
    <div class="body">
      {@render children?.()}
    </div>
    {#if footer}
    <footer class="footer">
      {@render footer()}
    </footer>
    {/if}
  </div>
</div>
{/if}

<style>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5);
  animation: fade-in var(--duration-fast) var(--ease-out);
}

.dialog {
  background: var(--color-surface-elev);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2 * var(--space-5));
  overflow: hidden;
  animation: scale-in var(--duration-normal) var(--ease-emphasised);
  width: 100%;
}
.dialog[data-size="sm"] { max-width: 380px; }
.dialog[data-size="md"] { max-width: 560px; }
.dialog[data-size="lg"] { max-width: 800px; }
.dialog[data-size="xl"] { max-width: 1100px; }

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border-subtle);
  flex-shrink: 0;
}
.header h2 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}
.close {
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
}
.close:hover { background: var(--color-surface-2); color: var(--color-text-primary); }

.body {
  padding: var(--space-6);
  overflow-y: auto;
  flex: 1 1 auto;
}

.footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border-subtle);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  flex-shrink: 0;
}

@keyframes fade-in   { from { opacity: 0; } to { opacity: 1; } }
@keyframes scale-in  { from { opacity: 0; transform: scale(0.96) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>
