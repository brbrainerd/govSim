<script lang="ts">
  import { toSparkPoints } from "$lib/chart-utils";

  interface Props {
    label:      string;
    value:      string;
    sub?:       string;
    color?:     "default" | "good" | "warn" | "danger" | "info";
    trend?:     number;   // positive = up, negative = down
    onclick?:   () => void;
    /** Screen-reader hint when card is clickable. */
    clickLabel?: string;
    /**
     * Optional array of recent values for the inline micro-sparkline.
     * Pass the last N data points (e.g. last 30 ticks of a metric).
     * The sparkline is rendered as a tiny SVG path — no ECharts needed.
     */
    sparkData?: number[];
  }

  const { label, value, sub, color = "default", trend, onclick, clickLabel, sparkData }: Props = $props();

  const borderColor = $derived(({
    default: "var(--border)",
    good:    "var(--good)",
    warn:    "var(--warn)",
    danger:  "var(--danger)",
    info:    "var(--info)",
  } as Record<string, string>)[color]);

  const trendIcon  = $derived(trend === undefined ? "" : trend > 0 ? "▲" : trend < 0 ? "▼" : "─");
  const trendClass = $derived(trend === undefined ? "" : trend > 0 ? "trend-up" : trend < 0 ? "trend-down" : "");

  // ── Micro-sparkline ────────────────────────────────────────────────────────
  // Renders a 100×24 SVG polyline from `sparkData`. Points are normalised to
  // [2, 22] vertically so the line never clips the viewBox edge.
  const sparkStroke = $derived(({
    default: "var(--color-text-muted)",
    good:    "var(--good)",
    warn:    "var(--warn)",
    danger:  "var(--danger)",
    info:    "var(--info)",
  } as Record<string, string>)[color]);

  const sparkPoints = $derived(toSparkPoints(sparkData ?? []));
</script>

{#if onclick}
<button
  class="card card--link"
  style="border-left: 3px solid {borderColor}"
  {onclick}
  aria-label={clickLabel ?? `${label}: ${value}`}
>
  <span class="label">{label}</span>
  <span class="value">{value}</span>
  {#if sub || trend !== undefined}
  <div class="footer">
    {#if sub}<span class="sub">{sub}</span>{/if}
    {#if trend !== undefined}
    <span class="trend {trendClass}">{trendIcon} {Math.abs(trend).toFixed(2)}</span>
    {/if}
  </div>
  {/if}
  {#if sparkPoints}
  <svg class="spark" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
    <polyline
      points={sparkPoints}
      fill="none"
      stroke={sparkStroke}
      stroke-width="1.5"
      stroke-linejoin="round"
      stroke-linecap="round"
      opacity="0.7"
    />
  </svg>
  {/if}
</button>
{:else}
<div class="card" style="border-left: 3px solid {borderColor}">
  <span class="label">{label}</span>
  <span class="value">{value}</span>
  {#if sub || trend !== undefined}
  <div class="footer">
    {#if sub}<span class="sub">{sub}</span>{/if}
    {#if trend !== undefined}
    <span class="trend {trendClass}">{trendIcon} {Math.abs(trend).toFixed(2)}</span>
    {/if}
  </div>
  {/if}
  {#if sparkPoints}
  <svg class="spark" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
    <polyline
      points={sparkPoints}
      fill="none"
      stroke={sparkStroke}
      stroke-width="1.5"
      stroke-linejoin="round"
      stroke-linecap="round"
      opacity="0.7"
    />
  </svg>
  {/if}
</div>
{/if}

<style>
.card {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: var(--shadow);
  text-align: left;
  width: 100%;
}
.card--link {
  cursor: pointer;
  transition: background 120ms, box-shadow 120ms;
}
.card--link:hover {
  background: var(--color-surface-2);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,.2));
}
.card--link:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
.label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; }
.value { font-size: 22px; font-weight: 700; line-height: 1.1; }
.footer { display: flex; justify-content: space-between; align-items: center; margin-top: 2px; }
.sub    { font-size: 11px; color: var(--muted); }
.trend  { font-size: 11px; }
.trend-up   { color: var(--good); }
.trend-down { color: var(--danger); }

/* Micro-sparkline — sits flush at the bottom of the card */
.spark {
  display: block;
  width: 100%;
  height: 24px;
  margin-top: 4px;
  overflow: visible;
}
</style>
