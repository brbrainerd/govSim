<script lang="ts">
  /**
   * Polymorphic button.
   * - variants: primary | secondary | ghost | danger
   * - sizes:    sm | md | lg
   * - states:   loading, disabled
   *
   * Usage:
   *   <Button onclick={…}>Save</Button>
   *   <Button variant="ghost" size="sm" loading={…}>↻ Refresh</Button>
   */
  import type { Snippet } from "svelte";

  interface Props {
    variant?:  "primary"|"secondary"|"ghost"|"danger";
    size?:     "sm"|"md"|"lg";
    loading?:  boolean;
    disabled?: boolean;
    type?:     "button"|"submit"|"reset";
    full?:     boolean;
    onclick?:  (e: MouseEvent) => void;
    title?:    string;
    children?: Snippet;
  }

  const {
    variant = "primary",
    size    = "md",
    loading = false,
    disabled = false,
    type = "button",
    full = false,
    onclick,
    title,
    children,
  }: Props = $props();
</script>

<button
  class="btn"
  data-variant={variant}
  data-size={size}
  class:full
  class:loading
  disabled={disabled || loading}
  {type}
  {title}
  {onclick}
>
  {#if loading}
    <span class="spinner" aria-hidden="true"></span>
  {/if}
  <span class="content" class:dim={loading}>
    {@render children?.()}
  </span>
</button>

<style>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  user-select: none;
  border: 1px solid transparent;
  position: relative;
}

.btn[data-size="sm"] { padding: var(--space-2) var(--space-4); font-size: var(--font-size-sm); border-radius: var(--radius-sm); }
.btn[data-size="md"] { padding: var(--space-3) var(--space-5); font-size: var(--font-size-base); border-radius: var(--radius-md); }
.btn[data-size="lg"] { padding: var(--space-4) var(--space-7); font-size: var(--font-size-md);   border-radius: var(--radius-md); }

.full { width: 100%; }

/* Variants */
.btn[data-variant="primary"] {
  background: var(--color-brand);
  color:      var(--color-on-brand);
}
.btn[data-variant="primary"]:hover:not(:disabled) {
  background: var(--color-brand-hover);
}

.btn[data-variant="secondary"] {
  background: var(--color-surface-2);
  color:      var(--color-text-primary);
  border-color: var(--color-border-subtle);
}
.btn[data-variant="secondary"]:hover:not(:disabled) {
  background: var(--color-surface-3);
  border-color: var(--color-border-strong);
}

.btn[data-variant="ghost"] {
  background: transparent;
  color: var(--color-text-secondary);
}
.btn[data-variant="ghost"]:hover:not(:disabled) {
  background: var(--color-brand-subtle);
  color: var(--color-text-primary);
}

.btn[data-variant="danger"] {
  background: var(--color-danger);
  color: #fff;
}
.btn[data-variant="danger"]:hover:not(:disabled) {
  filter: brightness(1.10);
}

.dim { opacity: 0; }
.spinner {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: btn-spin 0.7s linear infinite;
}
@keyframes btn-spin { to { transform: rotate(360deg); } }
</style>
