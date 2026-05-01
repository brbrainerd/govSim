<script lang="ts">
  interface Props {
    label: string;
    value: string;
    sub?: string;
    color?: "default" | "good" | "warn" | "danger" | "info";
    trend?: number;  // positive = up, negative = down
  }

  const { label, value, sub, color = "default", trend }: Props = $props();

  const borderColor = $derived(({
    default: "var(--border)",
    good:    "var(--good)",
    warn:    "var(--warn)",
    danger:  "var(--danger)",
    info:    "var(--info)",
  } as Record<string, string>)[color]);

  const trendIcon  = $derived(trend === undefined ? "" : trend > 0 ? "▲" : trend < 0 ? "▼" : "─");
  const trendClass = $derived(trend === undefined ? "" : trend > 0 ? "trend-up" : trend < 0 ? "trend-down" : "");
</script>

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
</div>

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
}
.label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; }
.value { font-size: 22px; font-weight: 700; line-height: 1.1; }
.footer { display: flex; justify-content: space-between; align-items: center; margin-top: 2px; }
.sub    { font-size: 11px; color: var(--muted); }
.trend  { font-size: 11px; }
.trend-up   { color: var(--good); }
.trend-down { color: var(--danger); }
</style>
