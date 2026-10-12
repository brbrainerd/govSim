<script lang="ts">
  import { DISTRICT_CHIPS, STATE_PATHS } from '../../data/us-states-paths';
  import type { StateVoterState } from '../../engine/voters';

  interface Props {
    states: Readonly<Record<string, StateVoterState>>;
    districts?: Readonly<Record<string, StateVoterState>>;
    selectedCode?: string | null;
    onSelect?: (code: string) => void;
  }

  const { states, districts = {}, selectedCode = null, onSelect }: Props = $props();

  const stateCodes = Object.keys(STATE_PATHS);

  function getLeaningColor(leaning?: string): string {
    switch (leaning) {
      case 'safe-you':
        return 'var(--color-sage-dark)';
      case 'likely-you':
        return 'var(--color-sage)';
      case 'lean-you':
        return 'var(--color-sky)';
      case 'tossup':
        return 'var(--color-gold)';
      case 'lean-them':
        return 'var(--color-alert)';
      case 'likely-them':
        return 'var(--color-alert)';
      case 'safe-them':
        return 'var(--color-alert-dark)';
      default:
        return 'var(--color-ink-soft)';
    }
  }

  function formatAria(item: StateVoterState | undefined, name: string): string {
    if (!item) return name;
    const outlook = item.leaning.replace('-', ' ');
    const swingText = item.isSwing ? ', Swing state' : '';
    const tippingText = item.isTippingPoint ? ', Tipping-point state' : '';
    return `${name}, ${item.electoralVotes} electoral votes, ${item.supportPct}% support, ${outlook}${swingText}${tippingText}`;
  }

  function handleKey(e: KeyboardEvent, code: string, index: number, total: number) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(code);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % total;
      const nextTarget = document.querySelector<SVGElement>(`[data-map-code="${stateCodes[nextIndex]}"]`);
      nextTarget?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + total) % total;
      const prevTarget = document.querySelector<SVGElement>(`[data-map-code="${stateCodes[prevIndex]}"]`);
      prevTarget?.focus();
    }
  }
</script>

<div class="us-map-container" data-testid="us-map">
  <svg
    viewBox="0 0 960 600"
    class="us-map-svg"
    role="region"
    aria-label="United States Electoral Map"
  >
    <defs>
      <!-- Opponent pattern: 45-degree diagonal hatching (GR-23) -->
      <pattern id="pattern-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="8" stroke="var(--color-ink)" stroke-opacity="0.35" stroke-width="2.5" />
      </pattern>

      <!-- Tossup pattern: Stippled dots (GR-23) -->
      <pattern id="pattern-dots" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="1.5" fill="var(--color-ink)" fill-opacity="0.4" />
      </pattern>
    </defs>

    <!-- Base States Layer -->
    <g class="states-layer">
      {#each stateCodes as code, idx (code)}
        {@const path = STATE_PATHS[code]}
        {@const voterState = states[code]}
        {@const isSelected = selectedCode === code}
        {@const isOpponent = voterState?.leaning.includes('them')}
        {@const isTossup = voterState?.leaning === 'tossup'}
        {@const fillColor = getLeaningColor(voterState?.leaning)}

        {#if path}
          <path
            id={`state-${code}`}
            data-map-code={code}
            d={path.d}
            fill={fillColor}
            stroke="var(--color-ink)"
            stroke-width={isSelected ? '2.5' : '0.6'}
            stroke-linejoin="round"
            class="state-path"
            class:selected={isSelected}
            tabindex="0"
            role="button"
            aria-label={formatAria(voterState, path.name)}
            aria-pressed={isSelected}
            onclick={() => onSelect?.(code)}
            onkeydown={(e) => handleKey(e, code, idx, stateCodes.length)}
          />

          <!-- Pattern overlays for nonpartisanship & accessibility (GR-23) -->
          {#if isOpponent}
            <path
              d={path.d}
              fill="url(#pattern-hatch)"
              stroke="none"
              class="overlay-pattern"
              pointer-events="none"
            />
          {:else if isTossup}
            <path
              d={path.d}
              fill="url(#pattern-dots)"
              stroke="none"
              class="overlay-pattern"
              pointer-events="none"
            />
          {/if}

          <!-- Gold outline for selection -->
          {#if isSelected}
            <path
              d={path.d}
              fill="none"
              stroke="var(--color-gold)"
              stroke-width="3"
              stroke-linejoin="round"
              class="selected-glow"
              pointer-events="none"
            />
          {/if}

          <!-- Tipping-Point Star Marker -->
          {#if voterState?.isTippingPoint && path.center}
            <g
              transform="translate({path.center[0]}, {path.center[1]})"
              class="tipping-point-marker"
              pointer-events="none"
            >
              <circle r="8" fill="var(--color-paper)" stroke="var(--color-gold)" stroke-width="1.5" />
              <text text-anchor="middle" dominant-baseline="central" font-size="10" font-weight="bold" fill="var(--color-gold)">★</text>
            </g>
          {/if}
        {/if}
      {/each}
    </g>

    <!-- District Chips Callout Panel (ME/NE/DC) -->
    <g class="district-panel" transform="translate(680, 20)">
      <rect
        x="0"
        y="0"
        width="260"
        height="105"
        rx="4"
        fill="var(--color-card)"
        stroke="var(--color-ink)"
        stroke-width="1"
        class="panel-backdrop"
      />
      <text x="12" y="18" font-size="11" font-weight="bold" font-family="var(--font-condensed)" fill="var(--color-ink)">
        DISTRICT ELECTORAL VOTES & DC
      </text>

      {#each DISTRICT_CHIPS as chip, idx (chip.id)}
        {@const voterDist = districts[chip.id] ?? states[chip.id]}
        {@const isDistSelected = selectedCode === chip.id}
        {@const distColor = getLeaningColor(voterDist?.leaning)}
        {@const isOpp = voterDist?.leaning.includes('them')}
        {@const isToss = voterDist?.leaning === 'tossup'}
        {@const col = idx % 2}
        {@const row = Math.floor(idx / 2)}
        {@const x = 12 + col * 120}
        {@const y = 30 + row * 24}

        <g
          class="district-chip"
          class:selected={isDistSelected}
          transform="translate({x}, {y})"
          tabindex="0"
          role="button"
          aria-label={formatAria(voterDist, chip.name)}
          aria-pressed={isDistSelected}
          onclick={() => onSelect?.(chip.id)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect?.(chip.id);
            }
          }}
        >
          <rect
            width="112"
            height="20"
            rx="3"
            fill={distColor}
            stroke={isDistSelected ? 'var(--color-gold)' : 'var(--color-ink)'}
            stroke-width={isDistSelected ? '2' : '0.8'}
          />
          {#if isOpp}
            <rect width="112" height="20" rx="3" fill="url(#pattern-hatch)" pointer-events="none" />
          {:else if isToss}
            <rect width="112" height="20" rx="3" fill="url(#pattern-dots)" pointer-events="none" />
          {/if}
          <text
            x="6"
            y="14"
            font-size="10"
            font-family="var(--font-condensed)"
            font-weight="bold"
            fill="var(--color-card)"
            pointer-events="none"
          >
            {chip.id} ({chip.electoralVotes} EV)
          </text>
        </g>
      {/each}
    </g>

    <!-- Inset boundary boxes for AK and HI -->
    <rect x="25" y="470" width="180" height="120" fill="none" stroke="var(--color-ink)" stroke-width="0.5" stroke-dasharray="2 2" pointer-events="none" opacity="0.4" />
    <text x="30" y="482" font-size="9" font-family="var(--font-condensed)" fill="var(--color-ink-soft)" pointer-events="none">AK INSET</text>

    <rect x="230" y="520" width="110" height="70" fill="none" stroke="var(--color-ink)" stroke-width="0.5" stroke-dasharray="2 2" pointer-events="none" opacity="0.4" />
    <text x="235" y="532" font-size="9" font-family="var(--font-condensed)" fill="var(--color-ink-soft)" pointer-events="none">HI INSET</text>
  </svg>
</div>

<style>
  .us-map-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .us-map-svg {
    width: 100%;
    height: auto;
    max-height: 100%;
  }

  .state-path {
    cursor: pointer;
    transition: filter 0.15s ease, stroke-width 0.15s ease;
  }

  .state-path:hover,
  .state-path:focus-visible {
    filter: brightness(1.12);
    outline: none;
    stroke: var(--color-ink);
    stroke-width: 2px;
  }

  .district-chip {
    cursor: pointer;
    outline: none;
    transition: transform 0.1s ease;
  }

  .district-chip:hover,
  .district-chip:focus-visible {
    transform: scale(1.02);
  }
</style>
