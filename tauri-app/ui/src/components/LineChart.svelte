<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as echarts from "echarts";

  interface Series {
    name: string;
    data: number[];
    color?: string;
  }

  interface Props {
    title?: string;
    xLabels: string[];
    series: Series[];
    height?: string;
    yMin?: number;
    yMax?: number;
    yFormatter?: (v: number) => string;
  }

  const {
    title, xLabels, series, height = "220px",
    yMin, yMax, yFormatter,
  }: Props = $props();

  let container: HTMLDivElement;
  let chart: echarts.ECharts | null = null;

  function buildOption() {
    return {
      backgroundColor: "transparent",
      animation: false,
      grid: { top: title ? 36 : 8, right: 12, bottom: 28, left: 54, containLabel: false },
      title: title ? { text: title, textStyle: { color: "#e2e8f0", fontSize: 13, fontWeight: 600 } } : undefined,
      tooltip: {
        trigger: "axis",
        backgroundColor: "#1a1d27",
        borderColor: "#2a2d3a",
        textStyle: { color: "#e2e8f0", fontSize: 12 },
        formatter: yFormatter
          ? (params: any[]) =>
              params.map((p: any) => `${p.seriesName}: ${yFormatter(p.value)}`).join("<br/>")
          : undefined,
      },
      legend: series.length > 1
        ? { bottom: 0, textStyle: { color: "#6b7280", fontSize: 11 } }
        : { show: false },
      xAxis: {
        type: "category",
        data: xLabels,
        axisLine: { lineStyle: { color: "#2a2d3a" } },
        axisLabel: { color: "#6b7280", fontSize: 10 },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        min: yMin,
        max: yMax,
        splitLine: { lineStyle: { color: "#2a2d3a", type: "dashed" } },
        axisLabel: {
          color: "#6b7280",
          fontSize: 10,
          formatter: yFormatter ?? ((v: number) => v.toFixed(2)),
        },
      },
      series: series.map((s, i) => ({
        name: s.name,
        type: "line",
        data: s.data,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: s.color ?? defaultColors[i % defaultColors.length], width: 2 },
        itemStyle: { color: s.color ?? defaultColors[i % defaultColors.length] },
        areaStyle: series.length === 1
          ? { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: (s.color ?? defaultColors[0]) + "55" },
              { offset: 1, color: "transparent" },
            ]) }
          : undefined,
      })),
    };
  }

  const defaultColors = ["#6366f1", "#22c55e", "#f59e0b", "#38bdf8", "#ef4444"];

  onMount(() => {
    chart = echarts.init(container, "dark");
    chart.setOption(buildOption());
    const ro = new ResizeObserver(() => chart?.resize());
    ro.observe(container);
    return () => ro.disconnect();
  });

  onDestroy(() => chart?.dispose());

  // Reactively update when props change.
  $effect(() => {
    if (chart) {
      // Access reactive props inside effect.
      void xLabels; void series;
      chart.setOption(buildOption(), { replaceMerge: ["series"] });
    }
  });
</script>

<div bind:this={container} style="width:100%; height:{height};"></div>
