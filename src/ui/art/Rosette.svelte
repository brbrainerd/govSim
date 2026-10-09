<script lang="ts">
  // Gold award rosette with ribbon tails (score / badges).
  let { size = 120 }: { size?: number } = $props();
  const points = Array.from({ length: 48 }, (_, i) => {
    const r = i % 2 ? 44 : 50;
    const a = (Math.PI * i) / 24;
    return `${(60 + r * Math.cos(a)).toFixed(1)},${(52 + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
</script>

<svg width={size} height={size} viewBox="0 0 120 130" aria-hidden="true">
  <path d="M34 80 L22 128 L40 118 L50 132 L58 90 Z" fill="var(--alert)" stroke="var(--ink)" stroke-width="2" />
  <path d="M86 80 L98 128 L80 118 L70 132 L62 90 Z" fill="var(--ink)" stroke="var(--ink)" stroke-width="2" />
  <polygon {points} fill="var(--gold)" stroke="var(--ink)" stroke-width="2.5" />
  <circle cx="60" cy="52" r="36" fill="var(--gold)" stroke="var(--gold-dark)" stroke-width="3" />
  <circle cx="60" cy="52" r="30" fill="none" stroke="var(--card)" stroke-width="1.5" opacity=".7" />
</svg>
