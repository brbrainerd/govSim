<script lang="ts">
  /**
   * Cmd+K / Ctrl+K command palette overlay.
   *
   * Mounts globally. Listens for the shortcut, displays a fuzzy-searchable
   * list of all registered commands, and runs the chosen one.
   */
  import { onMount, onDestroy } from "svelte";
  import {
    commands, searchCommands, palette, openPalette, closePalette, togglePalette,
    type Command,
  } from "$lib/commands.svelte";
  import KBD from "./KBD.svelte";

  let query     = $state("");
  let cursor    = $state(0);
  let inputEl: HTMLInputElement | undefined = $state();

  const open = $derived(palette.open);

  // Reset query + focus input when the palette opens.
  $effect(() => {
    if (palette.open) {
      query = ""; cursor = 0;
      queueMicrotask(() => inputEl?.focus());
    }
  });

  const filtered = $derived<Command[]>(searchCommands(query));

  // Group commands for display.
  const grouped = $derived((() => {
    const groups: Record<string, Command[]> = {};
    for (const c of filtered) {
      const g = c.group ?? "Other";
      (groups[g] ??= []).push(c);
    }
    return Object.entries(groups);
  })());

  function hide() { closePalette(); }

  async function execute(c: Command) {
    hide();
    try { await c.run(); } catch (e) { console.error("Command failed:", c.id, e); }
  }

  function handleKeydown(e: KeyboardEvent) {
    const isMod = e.metaKey || e.ctrlKey;
    if (isMod && e.key === "k") {
      e.preventDefault();
      togglePalette();
      return;
    }
    if (!open) return;
    if (e.key === "Escape")     { e.preventDefault(); hide(); }
    if (e.key === "ArrowDown")  { e.preventDefault(); cursor = Math.min(cursor + 1, filtered.length - 1); }
    if (e.key === "ArrowUp")    { e.preventDefault(); cursor = Math.max(cursor - 1, 0); }
    if (e.key === "Enter" && filtered[cursor]) { e.preventDefault(); execute(filtered[cursor]); }
  }

  // Reset cursor when results change.
  $effect(() => { void filtered.length; cursor = 0; });

  onMount(()   => window.addEventListener("keydown", handleKeydown));
  onDestroy(() => window.removeEventListener("keydown", handleKeydown));
</script>

{#if open}
<div class="palette-backdrop" role="presentation" onclick={hide}>
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
  <div
    class="palette"
    role="dialog"
    aria-modal="true"
    aria-label="Command palette"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
  >
    <div class="search-row">
      <span class="search-icon" aria-hidden="true">🔍</span>
      <input
        bind:this={inputEl}
        bind:value={query}
        type="text"
        placeholder="Type a command…"
        aria-label="Command search"
        autocomplete="off"
        spellcheck="false"
      />
      <KBD>esc</KBD>
    </div>

    <div class="results">
      {#if filtered.length === 0}
        <div class="empty">No commands match.</div>
      {:else}
        {@const flat = filtered}
        {#each grouped as [groupName, items]}
          <div class="group-label">{groupName}</div>
          {#each items as cmd (cmd.id)}
            {@const idx = flat.indexOf(cmd)}
            <button
              class="cmd"
              class:active={idx === cursor}
              onclick={() => execute(cmd)}
              onmouseenter={() => cursor = idx}
            >
              <span class="cmd-icon">{cmd.icon ?? "▸"}</span>
              <span class="cmd-label">{cmd.label}</span>
              {#if cmd.shortcut}<KBD>{cmd.shortcut}</KBD>{/if}
            </button>
          {/each}
        {/each}
      {/if}
    </div>

    <div class="footer">
      <span><KBD>↑↓</KBD> navigate</span>
      <span><KBD>↵</KBD> run</span>
      <span><KBD>esc</KBD> close</span>
    </div>
  </div>
</div>
{/if}

<style>
.palette-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: var(--z-modal);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 14vh;
  animation: pal-in var(--duration-fast) var(--ease-out);
}

.palette {
  width: 100%;
  max-width: 560px;
  background: var(--color-surface-elev);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 60vh;
}

.search-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-subtle);
}
.search-icon { color: var(--color-text-muted); }
.search-row input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  outline: none;
  padding: 0;
}
.search-row input:focus { box-shadow: none; }

.results {
  overflow-y: auto;
  padding: var(--space-3);
  flex: 1;
}
.group-label {
  padding: var(--space-3) var(--space-3) var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}
.cmd {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  background: transparent;
  color: var(--color-text-primary);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  text-align: left;
  font-size: var(--font-size-base);
}
.cmd.active { background: var(--color-brand-subtle); }
.cmd-icon  { width: 18px; flex-shrink: 0; text-align: center; opacity: 0.8; }
.cmd-label { flex: 1; }
.empty {
  padding: var(--space-7);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.footer {
  display: flex;
  gap: var(--space-5);
  justify-content: center;
  padding: var(--space-3) var(--space-5);
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-surface-2);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

@keyframes pal-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
</style>
