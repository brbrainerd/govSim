<script lang="ts">
  import Layout         from "./components/Layout.svelte";
  import ToastViewport  from "./components/ui/ToastViewport.svelte";
  import CommandPalette from "./components/ui/CommandPalette.svelte";
  import StartView      from "./views/StartView.svelte";
  import Dashboard      from "./views/Dashboard.svelte";
  import LawsView       from "./views/LawsView.svelte";
  import LawProposal    from "./views/LawProposal.svelte";
  import LawEffect      from "./views/LawEffect.svelte";
  import CitizenView    from "./views/CitizenView.svelte";
  import ElectionView   from "./views/ElectionView.svelte";
  import RegionsView    from "./views/RegionsView.svelte";
  import SettingsView   from "./views/SettingsView.svelte";
  import { ui }         from "$lib/store.svelte";
</script>

<!-- Accessibility: keyboard users hit Tab once to skip to content. -->
<a href="#main-content" class="skip-link">Skip to main content</a>

{#if ui.view === "start"}
  <!-- Start screen has no sidebar — it's a full-page selector. -->
  <div class="start-shell">
    <main id="main-content"><StartView /></main>
  </div>
{:else}
  <Layout>
    {#if ui.view === "dashboard"}
      <Dashboard />
    {:else if ui.view === "laws"}
      <LawsView />
    {:else if ui.view === "propose"}
      <LawProposal />
    {:else if ui.view === "effect"}
      <LawEffect />
    {:else if ui.view === "citizens"}
      <CitizenView />
    {:else if ui.view === "elections"}
      <ElectionView />
    {:else if ui.view === "regions"}
      <RegionsView />
    {:else if ui.view === "settings"}
      <SettingsView />
    {/if}
  </Layout>
{/if}

<!-- Global notification stack + command palette (always mounted) -->
<ToastViewport />
<CommandPalette />

<style>
.start-shell {
  min-height: 100vh;
  overflow-y: auto;
  padding: 0 var(--space-6);
  background: var(--color-bg);
}
</style>
