<script lang="ts">
  import Layout      from "./components/Layout.svelte";
  import StartView   from "./views/StartView.svelte";
  import Dashboard   from "./views/Dashboard.svelte";
  import LawsView    from "./views/LawsView.svelte";
  import LawProposal from "./views/LawProposal.svelte";
  import LawEffect   from "./views/LawEffect.svelte";
  import { ui }      from "$lib/store.svelte";
</script>

{#if ui.view === "start"}
  <!-- Start screen has no sidebar — it's a full-page selector. -->
  <div class="start-shell">
    <StartView />
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
    {/if}
  </Layout>
{/if}

<style>
.start-shell {
  min-height: 100vh;
  overflow-y: auto;
  padding: 0 20px;
  background: var(--bg);
}
</style>
