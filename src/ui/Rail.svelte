<script lang="ts">
  import { navFor, type ScreenId } from '../app/screens';
  import { icons } from '../design/icons';

  let { turn, current, onSelect }: { turn: number; current: ScreenId; onSelect: (id: ScreenId) => void } = $props();
  const nav = $derived(navFor(turn));
</script>

<nav aria-label="Screens">
  {#each nav as group (group.id)}
    <span class="group">{group.label}</span>
    {#each group.screens as s (s.id)}
      {@const Icon = icons[s.icon]}
      <button class="tab" aria-current={s.id === current ? 'page' : undefined} disabled={s.locked} onclick={() => onSelect(s.id)}>
        <Icon size={24} strokeWidth={2.2} aria-hidden="true" />
        <span class="name">{s.label}</span>
        {#if s.locked}<span class="lock">Turn {s.unlockTurn}</span>{/if}
      </button>
    {/each}
  {/each}
</nav>

<style>
  nav { display: flex; flex-direction: column; gap: clamp(4px, 0.8vh, 10px); padding-right: clamp(10px, 1.2vw, 18px); border-right: 2px solid var(--ink); min-height: 0; overflow-y: auto; }
  .group { font: 600 clamp(11px, 0.8vw, 13px) var(--font-ui); letter-spacing: .1em; text-transform: uppercase; color: var(--ink); margin: clamp(4px, 0.6vh, 8px) 0 -2px 4px; }
  .tab {
    position: relative; display: flex; align-items: center; gap: clamp(6px, 0.8vw, 10px); min-height: clamp(38px, 4.8vh, 50px); padding: clamp(6px, 0.8vh, 10px) clamp(8px, 0.9vw, 12px); margin-top: clamp(2px, 0.4vh, 6px); text-align: left;
    background: var(--card); color: var(--ink); border: var(--rule) solid var(--ink); border-radius: 4px 12px 12px 12px;
    box-shadow: 3px 3px 0 var(--ink); cursor: pointer; font: 600 clamp(16px, 1.3vw, 20px)/1 var(--font-ui); letter-spacing: .03em; text-transform: uppercase;
    transition: transform var(--dur-fast);
  }
  /* folder notch */
  .tab::before {
    content: ''; position: absolute; left: -2.5px; top: -11px; width: 56px; height: 11px; background: inherit;
    border: var(--rule) solid var(--ink); border-bottom: 0; border-radius: 8px 10px 0 0;
  }
  .tab:hover:not(:disabled) { transform: translateX(4px); }
  .tab[aria-current='page'] { background: var(--alert); color: var(--card); border-color: var(--alert-dark); }
  .tab[aria-current='page']::before { border-color: var(--alert-dark); }
  .tab:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }
  .name { flex: 1; }
  .lock { white-space: nowrap; font: 700 11px var(--font-body); text-transform: none; letter-spacing: 0; background: var(--paper); border-radius: 6px; padding: 2px 5px; }
</style>
