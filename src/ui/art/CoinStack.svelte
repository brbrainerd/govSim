<script lang="ts">
  // Clout icon: stacked gold coins.
</script>

<svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
  {#each [36, 28, 20, 12] as y (y)}
    <ellipse cx="22" cy={y + 4} rx="16" ry="6" fill="var(--gold-dark)" stroke="var(--ink)" stroke-width="2" />
    <ellipse cx="22" cy={y} rx="16" ry="6" fill="var(--gold)" stroke="var(--ink)" stroke-width="2" />
  {/each}
  <circle cx="34" cy="34" r="11" fill="var(--gold)" stroke="var(--ink)" stroke-width="2" />
  <text x="34" y="39" text-anchor="middle" font-size="14" font-weight="700" fill="var(--ink)" font-family="var(--font-ui)">$</text>
</svg>
