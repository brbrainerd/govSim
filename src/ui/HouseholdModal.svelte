<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import HouseholdBreakdown from './HouseholdBreakdown.svelte';
  import Overlay from './Overlay.svelte';

  let {
    session,
    onClose,
  }: {
    session: Session;
    onClose: () => void;
  } = $props();
</script>

<Overlay title="Kitchen Table Household Impact" {onClose}>
  <div class="household-modal-inner" data-testid="household-modal">
    <header class="modal-header">
      <div class="header-titles">
        <h3 class="modal-title">Kitchen Table Household Impact</h3>
        <span class="modal-subtitle">
          Real monthly financial impact across 7 kitchen-table budget categories.
        </span>
      </div>
      <button
        type="button"
        class="close-x"
        onclick={onClose}
        aria-label="Close household dialog"
      >
        ✕
      </button>
    </header>

    <div class="modal-body">
      <HouseholdBreakdown {session} />
    </div>
  </div>
</Overlay>

<style>
  .household-modal-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 80vh;
    padding: clamp(12px, 1.5vh, 20px);
    gap: 12px;
    background: var(--card);
    border-radius: var(--r-md);
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--ink);
  }
  .header-titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .modal-title {
    margin: 0;
    font: 700 clamp(18px, 1.6vw, 24px)/1.2 var(--font-display);
    color: var(--ink);
  }
  .modal-subtitle {
    font: 500 13px/1.3 var(--font-body);
    color: var(--ink-soft);
  }
  .close-x {
    background: none;
    border: none;
    font: 700 18px/1 var(--font-ui);
    color: var(--ink);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
  }
  .close-x:hover {
    background: var(--paper);
  }
  .modal-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
</style>
