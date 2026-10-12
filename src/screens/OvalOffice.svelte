<script lang="ts">
  import { headline } from '../app/indicators';
  import type { Session } from '../app/session.svelte';
  import type { ScreenId } from '../app/screens';
  import { prosperity as score } from '../engine/game';
  import { briefing, suggestions, thisTurn } from '../content/sample';
  import OvalOfficeScene from '../ui/art/OvalOfficeScene.svelte';
  import Rosette from '../ui/art/Rosette.svelte';
  import ScreenLayout from '../ui/ScreenLayout.svelte';

  let { session, question, go }: { session: Session; question: string; go: (id: ScreenId) => void } = $props();

  const tiles = $derived(headline(session.history));
  const index = $derived(Math.round(session.index));
  const change = $derived(index - Math.round(score(session.previous).index));

  const spark = (t: number[]) => {
    const lo = Math.min(...t), hi = Math.max(...t), span = hi - lo || 1;
    const pts = t.map((v, i) => `${t.length > 1 ? (i * 100) / (t.length - 1) : 50},${22 - ((v - lo) / span) * 18}`);
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
          <div class="score-text"><b>{index}</b><span>/ 100</span><em class:down={change < 0}>{change === 0 ? 'no change' : change > 0 ? `up ${change} ▲` : `down ${-change} ▼`}</em></div>
        </div>
        {#each tiles as t (t.label)}
          {@const s = spark(t.trend)}
          <div class="card tile">
            <svg class="spark" viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden="true">
              <path d={s.area} fill={t.good ? 'var(--sage)' : 'var(--alert)'} opacity=".18" />
              <path d={s.line} fill="none" stroke={t.good ? 'var(--sage)' : 'var(--alert)'} stroke-width="2.5" vector-effect="non-scaling-stroke" />
            </svg>
            <span class="label">{t.label}</span>
            <span class="num">{t.value}</span>
            <span class="dir" class:good={t.good}>{t.unit ? `${t.unit}, ` : ''}{t.direction === 'flat' ? 'no change' : t.direction} {t.direction === 'up' ? '▲' : t.direction === 'down' ? '▼' : ''}</span>
          </div>
        {/each}
      </div>
    </div>
  {/snippet}
  {#snippet learn()}
    <button class="link" disabled title="Coming soon">How it works</button>
    <button class="ticket" disabled title="Coming soon">Myth? Can you lower gas prices</button>
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
  .stage { position: relative; height: clamp(170px, 30vh, 310px); padding: clamp(6px, 1vh, 10px); min-height: 0; flex-shrink: 1; }
  .scene { height: 100%; border-radius: 8px; overflow: hidden; border: 2px solid var(--ink); }
  .bubble {
    position: absolute; right: clamp(14px, 2vw, 34px); top: clamp(12px, 2vh, 30px); max-width: 24ch; padding: clamp(8px, 1.2vh, 12px) clamp(10px, 1.2vw, 16px); background: var(--card);
    border: 2.5px solid var(--ink); border-radius: 14px; font: 700 clamp(14px, 1.2vw, 18px)/1.3 var(--font-body); color: var(--ink); text-align: center;
    box-shadow: 3px 3px 0 var(--ink);
  }
  .bubble::after { content: ''; position: absolute; bottom: -14px; left: 40px; border: 14px solid transparent; border-top-color: var(--ink); border-bottom: 0; }
  .doing { min-height: 0; }
  .doing-head { display: flex; justify-content: space-between; align-items: baseline; }
  h3 { margin: 0; font: 700 clamp(18px, 1.5vw, 22px) var(--font-display); }
  .doing-head a { font: 600 clamp(14px, 1.1vw, 17px) var(--font-ui); color: var(--ink); }
  .tiles { display: grid; grid-template-columns: minmax(150px, 1.2fr) repeat(4, minmax(0, 1fr)); gap: clamp(6px, 1vw, 14px); margin-top: clamp(4px, 0.6vh, 8px); }
  .score { display: flex; align-items: center; gap: 4px; }
  .score-text { display: flex; flex-direction: column; line-height: 1; }
  .score-text b { font: 700 clamp(30px, 3.2vw, 44px) var(--font-ui); }
  .score-text span { font: 600 clamp(14px, 1.2vw, 18px) var(--font-ui); color: var(--ink-soft); }
  .score-text em { font: 600 clamp(14px, 1.1vw, 18px) var(--font-ui); font-style: normal; color: var(--sage-dark); margin-top: 2px; }
  .score-text em.down { color: var(--alert); }
  .tile { display: flex; flex-direction: column; align-items: center; text-align: center; padding: clamp(4px, 0.8vh, 8px) clamp(4px, 0.5vw, 8px); gap: 2px; min-width: 0; }
  .tile .label { font-size: clamp(11px, 0.85vw, 13px); line-height: 1.1; color: var(--ink); text-wrap: balance; height: 2.2em; display: grid; place-items: center; }
  .tile .num { font-size: clamp(20px, 2vw, 30px); }
  .spark { width: 70%; height: clamp(16px, 2vh, 22px); }
  .dir { font: 600 clamp(12px, 0.9vw, 15px) var(--font-ui); color: var(--alert); }
  .dir.good { color: var(--sage-dark); }
  .info { display: flex; flex-direction: column; gap: 4px; padding: clamp(8px, 1.2vh, 14px); text-align: center; }
  .info b { font: 700 clamp(17px, 1.4vw, 21px)/1.2 var(--font-display); }
  .info span:last-child { font-size: clamp(12px, 1vw, 15px); color: var(--ink-soft); max-width: 35ch; }
  .option { display: flex; flex-direction: column; align-items: center; gap: clamp(6px, 0.8vh, 10px); padding: clamp(8px, 1.2vh, 14px) clamp(8px, 1vw, 12px); text-align: center; }
  .option b { font: 700 clamp(16px, 1.3vw, 20px)/1.15 var(--font-display); max-width: 25ch; }
</style>
