<script lang="ts">
  import type { ScreenId } from '../app/screens';
  import { briefing, headline, prosperity, suggestions, thisTurn } from '../content/sample';
  import OvalOfficeScene from '../ui/art/OvalOfficeScene.svelte';
  import Rosette from '../ui/art/Rosette.svelte';
  import ScreenLayout from '../ui/ScreenLayout.svelte';

  let { question, go }: { question: string; go: (id: ScreenId) => void } = $props();

  const spark = (t: number[]) => {
    const pts = t.map((v, i) => `${(i * 100) / (t.length - 1)},${24 - v * 2}`);
    return { line: `M${pts.join(' L')}`, area: `M0,24 L${pts.join(' L')} L100,24 Z` };
  };
</script>

<ScreenLayout {question}>
  {#snippet main()}
    <div class="card stage">
      <div class="scene"><OvalOfficeScene /></div>
      <div class="bubble" role="status">{briefing}</div>
    </div>
    <div class="doing">
      <div class="doing-head"><h3>How America is doing</h3><a href="#economy" onclick={(e) => { e.preventDefault(); go('economy'); }}>See all 8</a></div>
      <div class="tiles">
        <div class="score">
          <Rosette size={96} />
          <div class="score-text"><b>{prosperity.score}</b><span>/ 100</span><em>up {prosperity.change} ▲</em></div>
        </div>
        {#each headline as t (t.label)}
          {@const s = spark(t.trend)}
          <div class="card tile">
            <svg class="spark" viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden="true">
              <path d={s.area} fill={t.good ? 'var(--sage)' : 'var(--alert)'} opacity=".18" />
              <path d={s.line} fill="none" stroke={t.good ? 'var(--sage)' : 'var(--alert)'} stroke-width="2.5" vector-effect="non-scaling-stroke" />
            </svg>
            <span class="label">{t.label}</span>
            <span class="num">{t.value}</span>
            <span class="dir" class:good={t.good}>{t.unit ? `${t.unit}, ` : ''}{t.direction} {t.direction === 'up' ? '▲' : '▼'}</span>
          </div>
        {/each}
      </div>
    </div>
  {/snippet}
  {#snippet learn()}
    <a href="#learn">How it works</a>
    <button class="ticket">Myth? Can you lower gas prices</button>
  {/snippet}
  {#snippet next()}
    <div class="card info"><span class="label">This turn</span><b>{thisTurn.title}</b><span>{thisTurn.detail}</span></div>
    {#each suggestions as s (s.title)}
      <div class="card option">
        <b>{s.title}</b>
        <button class="btn" onclick={() => s.target && go(s.target)}>{s.cta}</button>
      </div>
    {/each}
  {/snippet}
</ScreenLayout>

<style>
  .stage { position: relative; height: 330px; padding: 10px; }
  .scene { height: 100%; border-radius: 8px; overflow: hidden; border: 2px solid var(--ink); }
  .bubble {
    position: absolute; right: 34px; top: 30px; max-width: 220px; padding: 12px 16px; background: var(--card);
    border: 2.5px solid var(--ink); border-radius: 14px; font: 700 18px/1.3 var(--font-body); color: var(--ink); text-align: center;
    box-shadow: 3px 3px 0 var(--ink);
  }
  .bubble::after { content: ''; position: absolute; bottom: -14px; left: 40px; border: 14px solid transparent; border-top-color: var(--ink); border-bottom: 0; }
  .doing-head { display: flex; justify-content: space-between; align-items: baseline; }
  h3 { margin: 0; font: 700 22px var(--font-display); }
  .doing-head a { font: 600 17px var(--font-ui); color: var(--ink); }
  .tiles { display: grid; grid-template-columns: 210px repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 8px; }
  .score { display: flex; align-items: center; gap: 4px; }
  .score-text { display: flex; flex-direction: column; line-height: 1; }
  .score-text b { font: 700 46px var(--font-ui); }
  .score-text span { font: 600 18px var(--font-ui); color: var(--ink-soft); }
  .score-text em { font: 600 18px var(--font-ui); font-style: normal; color: var(--sage); margin-top: 4px; }
  .tile { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 10px 8px 10px; gap: 2px; }
  .tile .label { font-size: 13px; color: var(--ink); }
  .tile .num { font-size: 32px; }
  .spark { width: 70%; height: 22px; }
  .dir { font: 600 15px var(--font-ui); color: var(--alert); }
  .dir.good { color: var(--sage); }
  .info { display: flex; flex-direction: column; gap: 4px; padding: 16px; text-align: center; }
  .info b { font: 700 21px/1.2 var(--font-display); }
  .info span:last-child { font-size: 15px; color: var(--ink-soft); }
  .option { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 18px 14px; text-align: center; }
  .option b { font: 700 22px/1.15 var(--font-display); }
</style>
