<script lang="ts">
  import type { GameOptions } from '../app/session.svelte';
  import { PARTIES, type PartyId } from '../content/parties';
  import ScreenLayout from '../ui/ScreenLayout.svelte';

  let { onStart }: { onStart: (o: GameOptions) => void } = $props();
  // No party is preselected: the choice is the player's (FND-08).
  let party = $state<PartyId | null>(null);
</script>

<div class="newgame halftone">
  <ScreenLayout question="Which party do you lead?">
    {#snippet main()}
      <div class="options" role="radiogroup" aria-label="Your party">
        {#each PARTIES as p (p.id)}
          <label class="card option">
            <input type="radio" name="party" value={p.id} bind:group={party} />
            <b>{p.name}</b>
          </label>
        {/each}
      </div>
    {/snippet}
    {#snippet next()}
      <div class="card info">
        <span class="label">What it means</span>
        <span class="line">Your party changes the names you see. The economy plays the same either way.</span>
        <span class="line">Your term is made up. It starts from the real economy of late 2026.</span>
      </div>
      <div class="spacer"></div>
      <button class="stamp" disabled={party === null} onclick={() => party && onStart({ party })}>Start the term</button>
    {/snippet}
  </ScreenLayout>
</div>

<style>
  .newgame { height: 100dvh; max-height: 100dvh; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr) clamp(240px, 20vw, 290px); gap: clamp(14px, 2vw, 24px); padding: clamp(16px, 2.5vh, 28px) clamp(16px, 2.5vw, 28px); }
  .options { display: flex; flex-direction: column; gap: clamp(10px, 1.5vh, 14px); max-width: 48rem; }
  .option { display: flex; align-items: center; gap: clamp(10px, 1.2vw, 14px); padding: clamp(12px, 1.8vh, 18px) clamp(14px, 1.8vw, 20px); cursor: pointer; }
  .option b { font: 700 clamp(20px, 2vw, 24px) var(--font-display); color: var(--ink); }
  .option input { width: 22px; height: 22px; accent-color: var(--ink); }
  .option:has(input:checked) { background: var(--gold); }
  .option:has(input:focus-visible) { outline: 3px solid var(--ink); outline-offset: 3px; }
  .info { display: flex; flex-direction: column; gap: 4px; padding: clamp(12px, 1.5vh, 16px); }
  .line { font: 500 clamp(14px, 1.1vw, 16px)/1.3 var(--font-body); color: var(--ink-soft); max-width: 55ch; }
  .spacer { flex-grow: 1; min-height: 8px; }
  .stamp { align-self: center; flex-shrink: 0; }
  .stamp:disabled { opacity: .45; cursor: not-allowed; }
</style>
