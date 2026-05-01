<script lang="ts">
  /**
   * Slide-in drawer panel (from the right). Accessible:
   *   - ESC closes
   *   - Focus trapped inside while open
   *   - Body scroll locked via counter (safe with nested drawers/modals)
   *   - Click backdrop closes (configurable)
   *   - Restores focus to the trigger element on close
   */
  import { onMount, onDestroy } from "svelte";
  import type { Snippet } from "svelte";

  interface Props {
    open:             boolean;
    title?:           string;
    width?:           string;
    closeOnBackdrop?: boolean;
    onClose?:         () => void;
    children?:        Snippet;
    footer?:          Snippet;
  }

  const {
    open,
    title,
    width = "420px",
    closeOnBackdrop = true,
    onClose,
    children,
    footer,
  }: Props = $props();

  let panel: HTMLElement | undefined = $state();
  let previouslyFocused: HTMLElement | null = null;
  let scrollLockedByThisInstance = false;

  function close() { onClose?.(); }

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

  function handleKeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "Tab" && panel) {
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (!first) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  }

  $effect(() => {
    if (open) {
      previouslyFocused = document.activeElement as HTMLElement;
      pushScrollLock();
      // Defer focus into panel so it's rendered
      setTimeout(() => {
        const first = panel?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        first?.focus();
      }, 16);
    } else {
      popScrollLock();
      previouslyFocused?.focus();
    }
  });

  onMount(()   => window.addEventListener("keydown", handleKeydown));
  onDestroy(() => { window.removeEventListener("keydown", handleKeydown); popScrollLock(); });
</script>

{#if open}
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="drawer-backdrop"
  role="presentation"
  onclick={() => { if (closeOnBackdrop) close(); }}
  aria-hidden="true"
></div>
{/if}

<div
  class="drawer"
  class:open
  style="--drawer-w: {width}"
  role="dialog"
  aria-modal="true"
  aria-label={title ?? "Panel"}
  bind:this={panel}
  tabindex="-1"
>
  <div class="drawer-header">
    {#if title}
    <h2 class="drawer-title">{title}</h2>
    {/if}
    <button class="close-btn" onclick={close} aria-label="Close panel">✕</button>
  </div>

  <div class="drawer-body">
    {@render children?.()}
  </div>

  {#if footer}
  <div class="drawer-footer">
    {@render footer()}
  </div>
  {/if}
</div>

<style>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: var(--z-modal-backdrop, 200);
  animation: fade-in 150ms ease;
}
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

.drawer {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: var(--drawer-w);
  max-width: 100vw;
  background: var(--color-surface-1);
  border-left: 1px solid var(--color-border-subtle);
  box-shadow: -8px 0 32px rgba(0,0,0,.35);
  z-index: var(--z-modal, 201);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}
.drawer.open {
  transform: translateX(0);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-subtle);
  flex-shrink: 0;
}
.drawer-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}
.close-btn {
  background: transparent;
  color: var(--color-text-muted);
  font-size: 16px;
  padding: 4px 8px;
  border: none;
  border-radius: var(--radius-sm, 4px);
  line-height: 1;
}
.close-btn:hover { color: var(--color-text-primary); background: var(--color-surface-2); }
.close-btn:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.drawer-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--color-border-subtle);
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
</style>
