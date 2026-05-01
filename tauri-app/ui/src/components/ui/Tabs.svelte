<script lang="ts">
  /**
   * Accessible tab strip.  Bind `active` to the currently-selected tab id.
   *
   * Usage:
   *   <script>
   *     let tab = $state("overview");
   *   <\/script>
   *   <Tabs tabs={[{id:"overview",label:"Overview"},{id:"table",label:"Detail"}]} bind:active={tab} />
   *   {#if tab === "overview"}<Overview />{/if}
   *   {#if tab === "table"}<Table />{/if}
   */
  interface Tab { id: string; label: string; badge?: string | number; }

  interface Props {
    tabs:     Tab[];
    active?:  string;
    /** Size variant: "sm" uses smaller text and tighter padding. */
    size?:    "md" | "sm";
  }

  let { tabs, active = $bindable(tabs[0]?.id ?? ""), size = "md" }: Props = $props();
</script>

<div class="tabs tabs--{size}" role="tablist" aria-label="View sections">
  {#each tabs as tab (tab.id)}
  <button
    role="tab"
    id="tab-{tab.id}"
    aria-selected={active === tab.id}
    aria-controls="panel-{tab.id}"
    class:active={active === tab.id}
    onclick={() => { active = tab.id; }}
    onkeydown={(e) => {
      if (e.key === "ArrowRight") {
        const idx = tabs.findIndex(t => t.id === active);
        active = tabs[(idx + 1) % tabs.length].id;
      } else if (e.key === "ArrowLeft") {
        const idx = tabs.findIndex(t => t.id === active);
        active = tabs[(idx - 1 + tabs.length) % tabs.length].id;
      }
    }}
  >
    {tab.label}
    {#if tab.badge !== undefined}
    <span class="badge">{tab.badge}</span>
    {/if}
  </button>
  {/each}
</div>

<style>
.tabs {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid var(--color-border-subtle);
  margin-bottom: 18px;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display: none; }

button[role="tab"] {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: color 120ms, border-color 120ms;
  margin-bottom: -1px;
  border-radius: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
button[role="tab"]:hover {
  color: var(--color-text-primary);
}
button[role="tab"].active {
  color: var(--color-brand);
  border-bottom-color: var(--color-brand);
  font-weight: 600;
}
button[role="tab"]:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: -2px;
  border-radius: 3px;
}

.badge {
  font-size: 10px;
  background: var(--color-border-subtle);
  color: var(--color-text-muted);
  border-radius: 99px;
  padding: 1px 6px;
  font-weight: 700;
}
button[role="tab"].active .badge {
  background: var(--color-brand-subtle);
  color: var(--color-brand);
}

/* Small variant */
.tabs--sm button[role="tab"] {
  font-size: 12px;
  padding: 6px 12px;
}
</style>
