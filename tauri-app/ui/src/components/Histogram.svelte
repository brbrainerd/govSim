<script lang="ts">
  /**
   * Pure-CSS histogram. No ECharts dependency — feather-light, fast,
   * and theme-aware. Use for distribution previews, not interactive
   * exploration (use ECharts BarChart for that).
   *
   * Usage:
   *   <Histogram counts={[3, 7, 12, 9, 4]} edges={[0, 0.2, 0.4, 0.6, 0.8]}
   *              color="var(--chart-1)" formatEdge={v => v.toFixed(2)} />
   */
  interface Props {
    counts:        number[];
    edges?:        number[];
    color?:        string;
    height?:       string;
    formatEdge?:   (v: number) => string;
    /** ARIA label for the figure (read by screen readers). */
    label?:        string;
    /** Show count on hover via title attr */
    showTooltips?: boolean;
  }

  const {
    counts,
    edges,
    color = "var(--color-brand)",
    height = "80px",
    formatEdge = (v) => v.toFixed(2),
    label = "Distribution histogram",
    showTooltips = true,
  }: Props = $props();

  const max = $derived(Math.max(...counts, 1));
  const total = $derived(counts.reduce((a, b) => a + b, 0));
</script>

<figure class="hist-fig" role="img" aria-label="{label} ({total} samples)">
  <div class="bars" style="--hist-h: {height}; --hist-color: {color};">
    {#each counts as c, i}
      {@const norm = c / max}
      <div
        class="col"
        title={showTooltips
          ? `${edges?.[i] !== undefined ? formatEdge(edges[i]) : `bucket ${i}`}: ${c}`
          : undefined}
      >
        <div
          class="fill"
          style="height: {(norm * 100).toFixed(1)}%; opacity: {0.55 + norm * 0.45};"
        ></div>
      </div>
    {/each}
  </div>
  {#if edges && edges.length > 0}
  <figcaption class="axis">
    <span>{formatEdge(edges[0])}</span>
    <span>{formatEdge(edges[edges.length - 1])}</span>
  </figcaption>
  {/if}
</figure>

<style>
.hist-fig { margin: 0; }

.bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: var(--hist-h);
}
.col {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
  cursor: default;
}
.fill {
  width: 100%;
  min-height: 2px;
  background: var(--hist-color);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  transition: opacity var(--duration-fast) var(--ease-out);
}
.col:hover .fill { opacity: 1 !important; }

.axis {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: var(--space-2);
}
</style>
