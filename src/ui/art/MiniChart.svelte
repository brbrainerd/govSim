<script lang="ts">
  interface Props {
    title: string;
    currentValue: string;
    valueColor?: string;
    lineColor?: string;
    youSeries: number[];
    autoSeries: number[];
    unit?: string;
    zeroBased?: boolean;
  }

  let {
    title,
    currentValue,
    valueColor = 'var(--ink)',
    lineColor = 'var(--ink)',
    youSeries,
    autoSeries,
    unit = '%',
    zeroBased = true,
  }: Props = $props();

  const width = 280;
  const height = 130;
  const padLeft = 24;
  const padRight = 72;
  const padTop = 14;
  const padBottom = 22;

  const xMin = padLeft;
  const xMax = width - padRight;
  const yTop = padTop;
  const yBottom = height - padBottom;

  const chartData = $derived.by(() => {
    const yVals = [...youSeries, ...autoSeries];
    if (zeroBased) yVals.push(0);

    const minV = Math.min(...yVals);
    const maxV = Math.max(...yVals);
    const span = maxV - minV || 1;
    const pad = span * 0.12;
    const yMin = minV - pad;
    const yMax = maxV + pad;
    const yRange = yMax - yMin || 1;

    const getY = (val: number) => yBottom - ((val - yMin) / yRange) * (yBottom - yTop);

    const len = Math.max(youSeries.length, autoSeries.length, 1);
    const getX = (idx: number) => {
      if (len <= 1) return xMin;
      return xMin + (idx / (len - 1)) * (xMax - xMin);
    };

    // If only 1 data point (Turn 1 start), draw horizontal line from xMin to xMax
    const formatPath = (series: number[]) => {
      if (series.length === 0) return '';
      if (series.length === 1) {
        const y = getY(series[0]!);
        return `M ${xMin} ${y} L ${xMax} ${y}`;
      }
      return series.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(v)}`).join(' ');
    };

    const youPath = formatPath(youSeries);
    const autoPath = formatPath(autoSeries);

    const lastYouVal = youSeries[youSeries.length - 1] ?? 0;
    const lastAutoVal = autoSeries[autoSeries.length - 1] ?? 0;
    const lastYouY = getY(lastYouVal);
    const lastAutoY = getY(lastAutoVal);

    // Collision avoidance for right-side text labels
    let labelYouY = lastYouY;
    let labelAutoY = lastAutoY;
    if (Math.abs(lastYouY - lastAutoY) < 14) {
      if (lastYouY <= lastAutoY) {
        labelYouY = lastYouY - 6;
        labelAutoY = lastAutoY + 7;
      } else {
        labelYouY = lastYouY + 7;
        labelAutoY = lastAutoY - 6;
      }
    }

    const showZero = zeroBased && yMin <= 0 && yMax >= 0;
    const zeroY = showZero ? getY(0) : null;

    return {
      youPath,
      autoPath,
      lastYouX: xMax,
      lastYouY,
      lastAutoX: xMax,
      lastAutoY,
      labelYouY,
      labelAutoY,
      zeroY,
    };
  });
</script>

<div class="chart-card">
  <div class="chart-header">
    <h3 class="chart-title">{title}</h3>
    <span class="chart-value" style="color: {valueColor};">{currentValue}</span>
  </div>

  <div class="chart-stage">
    <svg viewBox="0 0 {width} {height}" class="chart-svg" preserveAspectRatio="none" aria-hidden="true">
      <!-- Zero baseline if present -->
      {#if chartData.zeroY !== null}
        <line
          x1={xMin}
          y1={chartData.zeroY}
          x2={xMax}
          y2={chartData.zeroY}
          stroke="var(--ink-soft)"
          stroke-opacity="0.3"
          stroke-width="1"
          stroke-dasharray="2 2"
        />
      {/if}

      <!-- Axis lines -->
      <line x1={xMin} y1={yTop} x2={xMin} y2={yBottom} stroke="var(--ink)" stroke-width="2" />
      <line x1={xMin} y1={yBottom} x2={xMax} y2={yBottom} stroke="var(--ink)" stroke-width="2" />

      <!-- Doing nothing (dashed) -->
      {#if chartData.autoPath}
        <path
          d={chartData.autoPath}
          fill="none"
          stroke="var(--ink)"
          stroke-width="2"
          stroke-dasharray="4 4"
          vector-effect="non-scaling-stroke"
        />
        <circle cx={chartData.lastAutoX} cy={chartData.lastAutoY} r="3" fill="var(--ink)" />
        <text
          x={chartData.lastAutoX + 6}
          y={chartData.labelAutoY + 3.5}
          class="label-auto"
        >Doing nothing</text>
      {/if}

      <!-- You (solid) -->
      {#if chartData.youPath}
        <path
          d={chartData.youPath}
          fill="none"
          stroke={lineColor}
          stroke-width="2.5"
          vector-effect="non-scaling-stroke"
        />
        <circle cx={chartData.lastYouX} cy={chartData.lastYouY} r="3.5" fill={lineColor} />
        <text
          x={chartData.lastYouX + 6}
          y={chartData.labelYouY + 3.5}
          class="label-you"
        >You</text>
      {/if}
    </svg>

    <!-- Accessible table fallback for screen readers (ECO-01, OBS-07) -->
    <div class="sr-only">
      <table>
        <caption>Historical trend for {title}</caption>
        <thead>
          <tr>
            <th scope="col">Turn</th>
            <th scope="col">You ({unit})</th>
            <th scope="col">Doing nothing ({unit})</th>
          </tr>
        </thead>
        <tbody>
          {#each youSeries as val, i}
            <tr>
              <td>Q{i + 1}</td>
              <td>{val.toFixed(1)}{unit}</td>
              <td>{autoSeries[i] !== undefined ? autoSeries[i].toFixed(1) : '—'}{unit}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
  .chart-card {
    background: var(--card);
    border: var(--rule) solid var(--ink);
    border-radius: var(--r-md);
    box-shadow: var(--shadow);
    padding: clamp(6px, 1vh, 10px) clamp(8px, 1vw, 14px);
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
  }
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: clamp(2px, 0.5vh, 6px);
  }
  .chart-title {
    margin: 0;
    font: 700 clamp(16px, 1.4vw, 22px) var(--font-display);
    color: var(--ink);
  }
  .chart-value {
    font: 700 clamp(15px, 1.2vw, 19px) var(--font-ui);
  }
  .chart-stage {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
  }
  .chart-svg {
    width: 100%;
    height: 100%;
    max-height: 140px;
    overflow: visible;
  }
  .label-you {
    font: 700 11px var(--font-ui);
    fill: var(--ink);
  }
  .label-auto {
    font: 600 10.5px var(--font-ui);
    fill: var(--ink-soft);
  }
</style>
