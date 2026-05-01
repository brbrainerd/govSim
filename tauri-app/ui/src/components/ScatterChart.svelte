<script lang="ts">
  /**
   * 2-D scatter chart backed by ECharts.
   * Lazy-loads ECharts (shared chunk with LineChart). Colours read from CSS
   * custom-properties at render time, so dark↔light theme switches are live.
   *
   * `points` is an array of [x, y, colorValue] where colorValue is mapped
   * to a sequential colour scale between colorMin and colorMax.
   */
  import { onMount, onDestroy } from "svelte";
  import type { ECharts } from "echarts";

  interface Props {
    /** [x, y, colorValue] tuples */
    points:     [number, number, number][];
    xLabel?:    string;
    yLabel?:    string;
    colorLabel?: string;
    xFormatter?: (v: number) => string;
    yFormatter?: (v: number) => string;
    colorMin?:  number;
    colorMax?:  number;
    height?:    string;
    title?:     string;
  }

  const {
    points, xLabel = "X", yLabel = "Y", colorLabel = "Value",
    xFormatter, yFormatter,
    colorMin = 0, colorMax = 1,
    height = "280px", title,
  }: Props = $props();

  let container: HTMLDivElement | undefined = $state();
  let chart: ECharts | null = null;
  let echartsMod: typeof import("echarts") | null = null;
  let ro: ResizeObserver | null = null;
  let themeObs: MutationObserver | null = null;

  function cssVar(name: string): string {
    if (typeof document === "undefined") return "";
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function buildOption() {
    if (!echartsMod) return {};

    const border    = cssVar("--color-border-subtle");
    const surface   = cssVar("--color-surface-1");
    const textPri   = cssVar("--color-text-primary");
    const textMuted = cssVar("--color-text-muted");

    return {
      backgroundColor: "transparent",
      animation: false,
      title: title ? {
        text: title,
        textStyle: { color: textPri, fontSize: 13, fontWeight: 600 },
      } : undefined,
      tooltip: {
        trigger: "item",
        backgroundColor: surface,
        borderColor: border,
        textStyle: { color: textPri, fontSize: 12 },
        formatter: (p: any) => {
          const [x, y, c] = p.data as [number, number, number];
          const xStr = xFormatter ? xFormatter(x) : x.toFixed(2);
          const yStr = yFormatter ? yFormatter(y) : y.toFixed(2);
          const cPct = ((c - colorMin) / Math.max(colorMax - colorMin, 1e-9) * 100).toFixed(0);
          return `${xLabel}: ${xStr}<br/>${yLabel}: ${yStr}<br/>${colorLabel}: ${cPct}%`;
        },
      },
      visualMap: {
        min: colorMin,
        max: colorMax,
        dimension: 2,
        orient: "vertical",
        right: 8,
        top: "center",
        text: [String(colorMax.toFixed(1)), String(colorMin.toFixed(1))],
        textStyle: { color: textMuted, fontSize: 10 },
        calculable: false,
        inRange: {
          // green (healthy) → red (unhealthy), reversed so high=good
          color: ["#ef4444", "#f59e0b", "#22c55e"],
        },
      },
      grid: { top: title ? 40 : 10, right: 80, bottom: 40, left: 60, containLabel: false },
      xAxis: {
        type: "value",
        name: xLabel,
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: { color: textMuted, fontSize: 11 },
        axisLine: { lineStyle: { color: border } },
        axisLabel: {
          color: textMuted,
          fontSize: 10,
          formatter: xFormatter ?? ((v: number) => v.toFixed(0)),
        },
        splitLine: { lineStyle: { color: border, type: "dashed" } },
      },
      yAxis: {
        type: "value",
        name: yLabel,
        nameLocation: "middle",
        nameGap: 44,
        nameTextStyle: { color: textMuted, fontSize: 11 },
        axisLine: { lineStyle: { color: border } },
        axisLabel: {
          color: textMuted,
          fontSize: 10,
          formatter: yFormatter ?? ((v: number) => v.toFixed(0)),
        },
        splitLine: { lineStyle: { color: border, type: "dashed" } },
      },
      series: [{
        type: "scatter",
        data: points,
        symbolSize: 5,
        opacity: 0.7,
        emphasis: { scale: 1.5 },
      }],
    };
  }

  async function init() {
    if (!container) return;
    echartsMod = await import("echarts");
    chart = echartsMod.init(container);
    chart.setOption(buildOption());
    ro = new ResizeObserver(() => chart?.resize());
    ro.observe(container);
    themeObs = new MutationObserver(() => {
      if (chart) chart.setOption(buildOption(), { replaceMerge: ["series"] });
    });
    themeObs.observe(document.documentElement, {
      attributes: true, attributeFilter: ["data-theme", "data-cb"],
    });
  }

  onMount(() => { void init(); });
  onDestroy(() => { themeObs?.disconnect(); ro?.disconnect(); chart?.dispose(); });

  $effect(() => {
    void points;
    if (chart) chart.setOption(buildOption(), { replaceMerge: ["series"] });
  });
</script>

<div bind:this={container} style="width:100%; height:{height};"></div>
