<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import { DOCTRINE_FAMILIES } from '../content/perks';
  import CivicEmblem from './art/CivicEmblem.svelte';

  let {
    session,
    compact = false,
  }: {
    session: Session;
    compact?: boolean;
  } = $props();

  const isWonk = $derived(session.vocabMode === 'wonk');
  const activeFamilies = $derived(
    session.activeSynergies.filter((f) => f.count > 0),
  );
  const chainLogs = $derived(session.lastSynergyLogs);
</script>

{#if !session.isClassicSim && (activeFamilies.length > 0 || chainLogs.length > 0)}
  <div
    class="synergy-bar"
    class:compact
    class:calm={session.calmMode}
    data-testid="synergy-bar"
    data-calm={session.calmMode ? 'true' : 'false'}
    role="region"
    aria-label="Active Policy Doctrine Synergies"
  >
    {#if activeFamilies.length > 0}
      <div class="doctrine-pills">
        {#each activeFamilies as fam (fam.tag)}
          {@const meta = DOCTRINE_FAMILIES[fam.tag]}
          <span
            class="synergy-chip"
            class:tier-active={fam.tier > 0}
            class:tier-2={fam.tier === 2}
            class:tier-4={fam.tier === 4}
            class:tier-6={fam.tier === 6}
            class:evil-chip={meta.evilOnly}
            data-testid={`synergy-chip-${fam.tag}`}
            data-tier={fam.tier}
            title={`${isWonk ? meta.wonkLabel : meta.label}: ${fam.count} active (${fam.tier > 0 ? `${fam.tier}-Piece Set Bonus Active` : `Next bonus at ${fam.nextThreshold}`}) — ${meta.summary}`}
          >
            <CivicEmblem kind={fam.tag} size={13} />
            <span class="chip-name">{isWonk ? meta.wonkLabel : meta.label}</span>
            <span class="chip-count">
              {fam.count}{#if fam.nextThreshold}/{fam.nextThreshold}{/if}
            </span>
            {#if fam.tier > 0}
              <b class="tier-tag">{fam.tier}x</b>
            {/if}
          </span>
        {/each}
      </div>
    {/if}

    {#if !compact && chainLogs.length > 0}
      <div class="chain-popups" role="status" aria-live="polite">
        {#each chainLogs as entry, idx (entry.id + idx)}
          <span
            class="chain-popup"
            style="--chain-idx: {idx}"
            data-testid="synergy-chain-popup"
          >
            <CivicEmblem kind="bolt" size={12} /> {entry.detail}
          </span>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .synergy-bar {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px 6px;
    background: var(--paper-warm);
    border: 1.5px solid var(--ink);
    border-radius: 6px;
  }

  .synergy-bar.compact {
    padding: 2px 4px;
    background: transparent;
    border: none;
  }

  .doctrine-pills {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }

  .synergy-chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 6px;
    border-radius: 999px;
    font: 700 9.5px/1.1 var(--font-ui);
    background: var(--card);
    border: 1px solid var(--ink-soft);
    color: var(--ink-soft);
  }

  .synergy-chip.tier-active {
    background: var(--gold);
    border: 1.5px solid var(--ink);
    color: var(--ink);
    box-shadow: 1px 1px 0 var(--ink);
  }

  .synergy-chip.tier-4,
  .synergy-chip.tier-6 {
    background: var(--sage-tint);
    border-color: var(--sage-dark);
  }

  .synergy-chip.evil-chip.tier-active {
    background: var(--alert-tint);
    border-color: var(--alert);
  }

  .chip-count {
    font-weight: 800;
    color: var(--ink);
  }

  .tier-tag {
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--ink);
    color: var(--card);
    font-size: 8.5px;
    letter-spacing: 0.03em;
  }

  .chain-popups {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .chain-popup {
    display: inline-flex;
    align-items: center;
    padding: 2px 7px;
    border-radius: 4px;
    font: 700 10px/1.2 var(--font-ui);
    background: var(--ink);
    color: var(--gold);
    border: 1px solid var(--gold);
    animation: chain-pop 280ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
    animation-delay: calc(var(--chain-idx, 0) * 110ms);
  }

  .synergy-bar.calm .chain-popup {
    animation: none;
  }

  @keyframes chain-pop {
    from {
      opacity: 0;
      transform: translateY(4px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>
