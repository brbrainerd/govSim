<script lang="ts">
  /**
   * Accessible tooltip wrapper. Wraps a single child element, attaches
   * hover + focus handlers, and uses Floating UI for positioning.
   *
   * Usage:
   *   <Tooltip text="Save changes">
   *     <Button>Save</Button>
   *   </Tooltip>
   */
  import { computePosition, autoUpdate, offset, flip, shift, arrow } from "@floating-ui/dom";
  import type { Placement } from "@floating-ui/dom";
  import { onMount, onDestroy } from "svelte";
  import type { Snippet } from "svelte";

  interface Props {
    text:        string;
    placement?:  Placement;
    delay?:      number;
    children?:   Snippet;
  }

  const { text, placement = "top", delay = 200, children }: Props = $props();

  let triggerEl:  HTMLSpanElement | undefined = $state();
  let tooltipEl:  HTMLDivElement  | undefined = $state();
  let arrowEl:    HTMLDivElement  | undefined = $state();
  let visible = $state(false);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let cleanup: (() => void) | null = null;
  let id = `tt-${Math.random().toString(36).slice(2, 9)}`;

  async function update() {
    if (!triggerEl || !tooltipEl) return;
    const target = triggerEl.firstElementChild as HTMLElement || triggerEl;
    const middleware = [offset(8), flip(), shift({ padding: 8 })];
    if (arrowEl) middleware.push(arrow({ element: arrowEl }));
    const { x, y, placement: pl, middlewareData } = await computePosition(target, tooltipEl, {
      placement,
      middleware,
    });
    Object.assign(tooltipEl.style, { left: `${x}px`, top: `${y}px` });
    if (arrowEl && middlewareData.arrow) {
      const ax = middlewareData.arrow.x;
      const ay = middlewareData.arrow.y;
      const side = pl.split("-")[0] as "top"|"right"|"bottom"|"left";
      const opp = { top: "bottom", right: "left", bottom: "top", left: "right" }[side];
      Object.assign(arrowEl.style, {
        left:   ax != null ? `${ax}px` : "",
        top:    ay != null ? `${ay}px` : "",
        [opp]:  "-4px",
      });
    }
  }

  function show() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      visible = true;
      queueMicrotask(() => {
        if (!triggerEl || !tooltipEl) return;
        const target = triggerEl.firstElementChild as HTMLElement || triggerEl;
        cleanup = autoUpdate(target, tooltipEl, update);
      });
    }, delay);
  }

  function hide() {
    if (timer) { clearTimeout(timer); timer = null; }
    visible = false;
    cleanup?.();
    cleanup = null;
  }

  onDestroy(() => { cleanup?.(); if (timer) clearTimeout(timer); });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
  bind:this={triggerEl}
  class="tt-trigger"
  role="presentation"
  onmouseenter={show}
  onmouseleave={hide}
  onfocusin={show}
  onfocusout={hide}
  aria-describedby={visible ? id : undefined}
>
  {@render children?.()}
</span>

{#if visible}
<div
  bind:this={tooltipEl}
  {id}
  class="tooltip"
  role="tooltip"
>
  {text}
  <div bind:this={arrowEl} class="arrow"></div>
</div>
{/if}

<style>
.tt-trigger { display: inline-block; }

.tooltip {
  position: absolute;
  top: 0;
  left: 0;
  background: var(--color-surface-elev);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-strong);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  box-shadow: var(--shadow-md);
  z-index: var(--z-tooltip);
  max-width: 260px;
  pointer-events: none;
  line-height: var(--line-height-normal);
  animation: tt-in var(--duration-fast) var(--ease-out);
}
.arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--color-surface-elev);
  border-right: 1px solid var(--color-border-strong);
  border-bottom: 1px solid var(--color-border-strong);
  transform: rotate(45deg);
}
@keyframes tt-in {
  from { opacity: 0; transform: translateY(-2px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
