<script lang="ts">
  import { navFor, type ScreenId } from '../app/screens';
  import { icons } from '../design/icons';

  let {
    turn,
    current,
    isEvilMode = false,
    unlockAll = false,
    onSelect,
    onExport,
    onImport,
    onAbout,
    onUnlockAll,
    onOpenAiSettings,
  }: {
    turn: number;
    current: ScreenId;
    isEvilMode?: boolean;
    unlockAll?: boolean;
    onSelect: (id: ScreenId) => void;
    onExport?: () => void;
    onImport?: (f: File) => void;
    onAbout?: () => void;
    onUnlockAll?: () => void;
    onOpenAiSettings?: () => void;
  } = $props();

  const nav = $derived(navFor(turn, unlockAll, isEvilMode));
  const hasLocked = $derived(nav.some((g) => g.screens.some((s) => s.locked)));
  let fileInput = $state<HTMLInputElement>();
  const DownloadIcon = icons.download;
  const UploadIcon = icons.upload;
  const InfoIcon = icons.info;
</script>

<nav aria-label="Screens">
  <div class="screens-list">
    {#each nav as group (group.id)}
      <span class="group">{group.label}</span>
      {#each group.screens as s (s.id)}
        {@const Icon = icons[s.icon]}
        <button class="tab" aria-current={s.id === current ? 'page' : undefined} disabled={s.locked} onclick={() => onSelect(s.id)}>
          <Icon size={24} strokeWidth={2.2} aria-hidden="true" />
          <span class="name">{s.label}</span>
          {#if s.locked}
            <span class="lock">Turn {s.unlockTurn}</span>
          {:else if s.newlyUnlocked}
            <span class="new-badge" data-testid={`rail-new-badge-${s.id}`}>NEW</span>
          {/if}
        </button>
      {/each}
    {/each}
  </div>

  <div class="save-tray">
    {#if onAbout}
      <button type="button" class="util-btn" onclick={onAbout} data-testid="nav-about-btn" aria-label="About govSim and Privacy">
        <InfoIcon size={16} strokeWidth={2.2} aria-hidden="true" />
        <span>About & Privacy</span>
      </button>
    {/if}
    {#if onOpenAiSettings}
      <button
        type="button"
        class="util-btn"
        onclick={onOpenAiSettings}
        data-testid="nav-ai-settings-btn"
        aria-label="Free AI Director Settings"
      >
        <span>AI Director (Free)</span>
      </button>
    {/if}
    {#if onExport}
      <button type="button" class="util-btn" onclick={onExport} aria-label="Export save file">
        <DownloadIcon size={16} strokeWidth={2.2} aria-hidden="true" />
        <span>Export save</span>
      </button>
    {/if}
    {#if onImport}
      <button type="button" class="util-btn" onclick={() => fileInput?.click()} aria-label="Load save file">
        <UploadIcon size={16} strokeWidth={2.2} aria-hidden="true" />
        <span>Load save</span>
      </button>
      <input
        bind:this={fileInput}
        type="file"
        accept=".json,application/json"
        style="display:none"
        onchange={(e) => {
          const f = e.currentTarget.files?.[0];
          if (f && onImport) onImport(f);
          e.currentTarget.value = '';
        }}
      />
    {/if}
    {#if hasLocked && onUnlockAll}
      <button
        type="button"
        class="util-btn"
        onclick={onUnlockAll}
        data-testid="rail-unlock-all-btn"
        aria-label="Unlock all screens on Turn 1"
      >
        <span>Unlock all screens</span>
      </button>
    {/if}
  </div>
</nav>

<style>
  nav {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: clamp(4px, 0.8vh, 10px);
    padding: 6px clamp(10px, 1.2vw, 16px) 6px 6px;
    border-right: 2px solid var(--paper-ink-soft);
    background-image: radial-gradient(var(--dot) 1.35px, transparent 1.35px);
    background-size: 6px 6px;
    min-height: 0;
    overflow-y: auto;
  }
  .screens-list { display: flex; flex-direction: column; gap: clamp(4px, 0.7vh, 8px); }
  .group {
    align-self: flex-start;
    position: relative;
    z-index: 2;
    font: 800 clamp(10px, 0.78vw, 12px)/1.15 var(--font-ui);
    letter-spacing: .1em;
    text-transform: uppercase;
    background: var(--ink);
    color: var(--card);
    border: 1.5px solid var(--ink);
    border-bottom: 0;
    border-radius: 5px 8px 0 0;
    padding: 2px 10px 3px;
    margin: clamp(4px, 0.5vh, 6px) 0 -6px 0;
  }
  .tab {
    position: relative; display: flex; align-items: center; gap: clamp(6px, 0.8vw, 10px); min-height: clamp(36px, 4.5vh, 46px); padding: clamp(5px, 0.7vh, 8px) clamp(8px, 0.9vw, 12px); margin-top: 4px; text-align: left;
    background: var(--card); color: var(--ink); border: var(--rule) solid var(--ink); border-radius: 2px 8px 8px 8px;
    box-shadow: 2.5px 2.5px 0 var(--ink); cursor: pointer; font: 700 clamp(15px, 1.2vw, 18px)/1 var(--font-ui); letter-spacing: .03em; text-transform: uppercase;
    transition: transform var(--dur-fast);
  }
  /* Manila folder ear notch */
  .tab::before {
    content: ''; position: absolute; left: -2px; top: -7px; width: 54px; height: 7px; background: inherit;
    border: var(--rule) solid var(--ink); border-bottom: 0; border-radius: 5px 8px 0 0;
  }
  .group + .tab {
    margin-top: 0;
    border-top-left-radius: 0;
  }
  .group + .tab::before {
    display: none;
  }
  .tab:hover:not(:disabled) { transform: translateX(3px); }
  .tab[aria-current='page'] { background: var(--alert); color: var(--card); border-color: var(--ink); }
  .tab[aria-current='page']::before { border-color: var(--ink); }
  .tab:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }
  .name { flex: 1; }
  .lock { white-space: nowrap; font: 700 11px var(--font-body); text-transform: none; letter-spacing: 0; background: var(--paper); border-radius: 6px; padding: 2px 5px; }
  .new-badge {
    margin-left: auto;
    font: 900 10px/1 var(--font-ui);
    padding: 2px 5px;
    border-radius: 4px;
    background: var(--gold);
    color: var(--ink);
    letter-spacing: .05em;
    border: 1px solid var(--ink);
    box-shadow: 1px 1px 0 var(--ink);
  }

  .save-tray {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: clamp(12px, 1.5vh, 20px);
    padding-top: 8px;
    border-top: 1px dashed var(--paper-ink-soft);
  }
  .util-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: var(--paper-ink-soft);
    font: 600 clamp(12px, 0.9vw, 14px) var(--font-ui);
    text-transform: uppercase;
    letter-spacing: .05em;
    cursor: pointer;
    padding: 4px 6px;
    border-radius: 4px;
  }
  .util-btn:hover {
    color: var(--ink);
    background: var(--card);
  }
</style>
