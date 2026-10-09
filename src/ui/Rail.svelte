<script lang="ts">
  import { navFor, type ScreenId } from '../app/screens';

  let { turn, current, onSelect }: { turn: number; current: ScreenId; onSelect: (id: ScreenId) => void } = $props();
  const nav = $derived(navFor(turn));
</script>

<nav aria-label="Screens">
  {#each nav as group (group.id)}
    <span class="label group">{group.label}</span>
    {#each group.screens as s (s.id)}
      <button class="tab" aria-current={s.id === current ? 'page' : undefined} disabled={s.locked} onclick={() => onSelect(s.id)}>
        {s.label}
        {#if s.locked}<span class="lock">Turn {s.unlockTurn}</span>{/if}
      </button>
    {/each}
  {/each}
</nav>

<style>
  nav { display: flex; flex-direction: column; gap: 10px; }
  .group { font-size: 11px; margin: 6px 0 -4px 4px; }
  .tab {
    display: flex; align-items: center; gap: 8px; min-height: 48px; padding: 10px 14px; text-align: left;
    background: var(--card); color: var(--ink); border: var(--rule) solid var(--ink);
    border-radius: var(--r-sm) var(--r-md) var(--r-md) var(--r-sm); cursor: pointer;
    font: 600 17px var(--font-display); text-transform: uppercase; letter-spacing: .03em;
    transition: transform var(--dur-fast);
  }
  .tab:hover:not(:disabled) { transform: translateX(4px); }
  .tab[aria-current='page'] { background: var(--alert); border-color: var(--alert); color: var(--card); }
  .tab:disabled { opacity: .55; cursor: not-allowed; }
  .lock { margin-left: auto; font: 700 11px var(--font-body); text-transform: none; letter-spacing: 0; background: var(--paper); border-radius: 6px; padding: 2px 6px; }
</style>
