<script lang="ts">
  /**
   * Line chart with optional vertical-line annotations and shaded x-bands.
   * Lazy-loads ECharts on first mount → keeps it out of the initial bundle.
   *
   * All colours are read from CSS custom properties at render time so the chart
   * updates automatically when the user switches between dark / light / auto
   * themes. A MutationObserver on <html data-theme> triggers a re-render
   * whenever the theme attribute changes.
   *
   * Annotation usage:
   *   <LineChart {series} {xLabels}
   *      markLines={[{ x: '40', label: 'Law #3 enacted', color: 'var(--color-warning)' }]}
   *      markBands={[{ from: '60', to: '90', color: 'var(--color-danger)', label: 'Recession' }]}
   *   />
   */
  import { onMount, onDestroy } from "svelte";
  import type { ECharts } from "echarts";

  interface Series    { name: string; data: number[]; color?: string; }
  interface MarkLine  { x: string; label?: string; color?: string; }
  interface YMarkLine { y: number; label?: string; color?: string; }
  interface MarkBand  { from: string; to: string; label?: string; color?: string; }

  interface Props {
    title?:       string;
    xLabels:      string[];
    series:       Series[];
    height?:      string;
    yMin?:        number;
    yMax?:        number;
    yFormatter?:  (v: number) => string;
    markLines?:   MarkLine[];
    yMarkLines?:  YMarkLine[];
    markBands?:   MarkBand[];
  }

  const {
    title, xLabels, series, height = "220px",
    yMin, yMax, yFormatter,
    markLines = [], yMarkLines = [], markBands = [],
  }: Props = $props();

  let container: HTMLDivElement | undefined = $state();
  let chart: ECharts | null = null;
  let echartsMod: typeof import("echarts") | null = null;
  let ro: ResizeObserver | null = null;
  let themeObs: MutationObserver | null = null;

  /** Read a CSS custom-property value from the root element at call time. */
  function cssVar(name: string): string {
    if (typeof document === "undefined") return "";
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function buildOption() {
    if (!echartsMod) return {};
    const echarts = echartsMod;

    // Resolve theme tokens at render time so light/dark/custom themes all work
    const surface    = cssVar("--color-surface-1");
    const border     = cssVar("--color-border-subtle");
    const textPri    = cssVar("--color-text-primary");
    const textMuted  = cssVar("--color-text-muted");
    const textSec    = cssVar("--color-text-secondary");
    const chartPal   = [
      cssVar("--chart-1"), cssVar("--chart-2"), cssVar("--chart-3"),
      cssVar("--chart-4"), cssVar("--chart-5"),
    ];

    return {
      backgroundColor: "transparent",
      animation: false,
      grid: { top: title ? 36 : 8, right: 12, bottom: 28, left: 54, containLabel: false },
      title: title
        ? { text: title, textStyle: { color: textPri, fontSize: 13, fontWeight: 600 } }
        : undefined,
      tooltip: {
        trigger: "axis",
        backgroundColor: surface,
        borderColor: border,
        textStyle: { color: textPri, fontSize: 12 },
        formatter: yFormatter
          ? (params: any[]) =>
              params.map((p: any) => `${p.seriesName}: ${yFormatter(p.value)}`).join("<br/>")
          : undefined,
      },
      legend: series.length > 1
        ? { bottom: 0, textStyle: { color: textMuted, fontSize: 11 } }
        : { show: false },
      xAxis: {
        type: "category",
        data: xLabels,
        axisLine: { lineStyle: { color: border } },
        axisLabel: { color: textMuted, fontSize: 10 },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        min: yMin,
        max: yMax,
        splitLine: { lineStyle: { color: border, type: "dashed" } },
        axisLabel: {
          color: textMuted,
          fontSize: 10,
          formatter: yFormatter ?? ((v: number) => v.toFixed(2)),
        },
      },
      series: [
        // Real data series
        ...series.map((s, i) => {
          const color = s.color ?? chartPal[i % chartPal.length];
          return {
            name: s.name,
            type: "line",
            data: s.data,
            smooth: true,
            showSymbol: false,
            lineStyle: { color, width: 2 },
            itemStyle: { color },
            areaStyle: series.length === 1
              ? { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: color + "55" },
                  { offset: 1, color: "transparent" },
                ]) }
              : undefined,
          };
        }),
        // Invisible "carrier" series for annotations (survives series replaceMerge)
        ...(markLines.length > 0 || yMarkLines.length > 0 || markBands.length > 0 ? [{
          name: "_annotations",
          type: "line",
          data: [],
          silent: true,
          tooltip: { show: false },
          markLine: (markLines.length > 0 || yMarkLines.length > 0) ? {
            symbol: ["none", "none"],
            silent: false,
            label: { color: textSec, fontSize: 10, position: "insideEndTop" },
            lineStyle: { type: "dashed", width: 1 },
            data: [
              ...markLines.map(m => ({
                name: m.label ?? "",
                xAxis: m.x,
                label: { formatter: m.label ?? "", color: m.color ?? textSec },
                lineStyle: { color: m.color ?? textSec },
              })),
              ...yMarkLines.map(m => ({
                name: m.label ?? "",
                yAxis: m.y,
                label: { formatter: m.label ?? "", color: m.color ?? textSec },
                lineStyle: { color: m.color ?? textSec, type: "dashed", width: 1 },
              })),
            ],
          } : undefined,
          markArea: markBands.length > 0 ? {
            silent: true,
            label: { color: textSec, fontSize: 10, position: "top" },
            data: markBands.map(b => [
              {
                xAxis: b.from,
                name: b.label ?? "",
                itemStyle: { color: (b.color ?? cssVar("--color-danger")) + "22" },
                label: { formatter: b.label ?? "", color: b.color ?? textSec },
              },
              { xAxis: b.to },
            ]),
          } : undefined,
        }] : []),
      ],
    };
  }

  async function init() {
    if (!container) return;
    // Dynamic import — keeps ECharts out of the initial chunk
    echartsMod = await import("echarts");
    // Initialise without a built-in theme; we supply all colours via CSS vars.
    chart = echartsMod.init(container);
    chart.setOption(buildOption());

    ro = new ResizeObserver(() => chart?.resize());
    ro.observe(container);

    // Re-render whenever the user switches theme or colour-blind palette
    themeObs = new MutationObserver(() => {
      if (chart) chart.setOption(buildOption(), { replaceMerge: ["series"] });
    });
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-cb"],
    });
  }

  onMount(() => { void init(); });
  onDestroy(() => { themeObs?.disconnect(); ro?.disconnect(); chart?.dispose(); });

  // Reactively update when props change.
  $effect(() => {
    void xLabels; void series; void markLines; void markBands;
    if (chart) chart.setOption(buildOption(), { replaceMerge: ["series"] });
  });
</script>

<div bind:this={container} style="width:100%; height:{height};"></div>
