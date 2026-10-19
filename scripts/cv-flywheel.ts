// Reusable Before/After Screenshot Computer-Vision Flywheel
// Usage:
//   node scripts/cv-flywheel.ts --stage before
//   node scripts/cv-flywheel.ts --stage after
//   node scripts/cv-flywheel.ts --compare
import { chromium, type Browser, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

interface ViewportSpec {
  width: number;
  height: number;
  label: string;
}

interface SurfaceSpec {
  id: string;
  title: string;
  targetFile: string;
  evilMode: boolean;
  navLabel?: string;
}

interface PixelMetrics {
  meanR: number;
  meanG: number;
  meanB: number;
  meanLuminance: number;
  darkPixelRatio: number;
  warmCreamPixelRatio: number;
  topBarMeanLuminance: number;
  centerStageMeanLuminance: number;
}

interface DomMetrics {
  viewportWidth: number;
  viewportHeight: number;
  docScrollHeight: number;
  outerOverflowPx: number;
  paperBgRgb: string;
  cardBgRgb: string;
  cardInkRgb: string;
  cardLuminance: number;
  paperLuminance: number;
  cardIsCreamParchment: boolean;
  characterOuterStrokeCount: number;
  presidentLook0IsThumbDome: boolean;
  chyronOverlapsScenePx: number;
  fedPortraitAboveFold: boolean;
  courtBenchAboveFold: boolean;
  porticoHeroHeightPx: number;
  rawEmojiCountInCards: number;
  hasLayeredEnvPlate?: boolean;
  hasTurnAgendaCard?: boolean;
}

interface CaptureRecord {
  surfaceId: string;
  title: string;
  viewport: string;
  screenshotPath: string;
  targetPath: string;
  pixel: PixelMetrics;
  dom: DomMetrics;
}

interface StageReport {
  stage: 'before' | 'after';
  capturedAt: string;
  records: CaptureRecord[];
}

const VIEWPORTS: ViewportSpec[] = [
  { width: 1376, height: 768, label: '1376x768' },
  { width: 1280, height: 720, label: '1280x720' },
];

const SURFACES: SurfaceSpec[] = [
  { id: 'newgame', title: 'New Game (Inauguration Stage)', targetFile: 'g-newgame.png', evilMode: false },
  { id: 'oval-day', title: 'Oval Office (Standard Day)', targetFile: 'g-home.png', evilMode: false },
  { id: 'oval-evil', title: 'Oval Office (Evil Mode)', targetFile: 'g-evil.png', evilMode: true },
  { id: 'powers', title: 'Your Powers (EOs, Fed & SCOTUS)', targetFile: 'g-powers.png', evilMode: false, navLabel: 'Your Powers' },
  { id: 'congress', title: 'Congress (Hemicycle & Bloc Leaders)', targetFile: 'g-congress.png', evilMode: false, navLabel: 'Congress' },
  { id: 'budget', title: 'Budget & Taxes (Household & Levers)', targetFile: 'g-budget.png', evilMode: false, navLabel: 'Budget' },
];

const OUT_ROOT = resolve('.planning/cv-flywheel');
const TARGETS_DIR = resolve('.design-targets');

async function ensureServer(url: string): Promise<ChildProcess | null> {
  try {
    const res = await fetch(url);
    if (res.ok) return null;
  } catch {
    // start dev server
  }
  const proc = spawn('pnpm', ['dev', '--port', '5173'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    detached: false,
  });
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 250));
    try {
      const res = await fetch(url);
      if (res.ok) return proc;
    } catch {
      // wait
    }
  }
  throw new Error('Failed to start Vite dev server on http://localhost:5173');
}

async function navigateToSurface(page: Page, spec: SurfaceSpec): Promise<void> {
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.newgame');

  if (spec.id === 'newgame') {
    await page.waitForTimeout(150);
    return;
  }

  // Pick first party
  await page.locator('.options label.option').first().click();

  // Enable unlockAll so Your Powers / Voters are immediately reachable on Turn 1
  const unlockCb = page.locator('[data-testid="unlock-all-toggle"]');
  if (!(await unlockCb.isChecked())) {
    await unlockCb.check();
  }

  if (spec.evilMode) {
    await page.locator('[data-testid="evil-mode-card"]').click();
  }

  await page.locator('.newgame button.stamp').click();
  await page.waitForSelector('header.bar');
  await page.waitForTimeout(120);

  if (spec.navLabel) {
    const navBtn = page.locator('nav button.tab', { hasText: new RegExp(spec.navLabel, 'i') }).first();
    await navBtn.click();
    await page.waitForTimeout(150);
  }
}

async function collectDomMetrics(page: Page, vp: ViewportSpec): Promise<DomMetrics> {
  return page.evaluate(
    ({ width, height }) => {
      const parseRgb = (str: string): [number, number, number] => {
        const m = str.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
      };
      const lum = ([r, g, b]: [number, number, number]): number =>
        Math.round((0.2126 * r + 0.7152 * g + 0.0722 * b) * 10) / 10;

      const shellEl = (document.querySelector('.app, .newgame') || document.body) as HTMLElement;
      const cardEl = (document.querySelector('.card.info, .card.tile, .order-card, .institution-card, .card.option') ||
        document.querySelector('.card') ||
        document.body) as HTMLElement;

      const paperBgRgb = getComputedStyle(document.body).backgroundColor;
      const cardBgRgb = getComputedStyle(cardEl).backgroundColor;
      const cardInkRgb = getComputedStyle(cardEl).color;

      const paperLuminance = lum(parseRgb(paperBgRgb));
      const cardLuminance = lum(parseRgb(cardBgRgb));
      const inkLuminance = lum(parseRgb(cardInkRgb));

      // A true cream parchment card has high luminance (> 200) and dark ink (< 90)
      const cardIsCreamParchment = cardLuminance >= 200 && inkLuminance <= 90;

      // Count outer cartoon stroke="var(--ink)" on filled character head/torso/limb silhouettes
      let characterOuterStrokeCount = 0;
      document
        .querySelectorAll('[data-pose] path, [data-pose] rect, [data-pose] circle, [data-pose] ellipse, [data-testid="fed-portrait"] path, [data-testid="court-bench"] .justice path')
        .forEach((el) => {
          const fill = el.getAttribute('fill') || '';
          const stroke = el.getAttribute('stroke') || '';
          const sw = Number(el.getAttribute('stroke-width') || '0');
          if (fill !== 'none' && stroke === 'var(--ink)' && sw >= 1.2) {
            characterOuterStrokeCount++;
          }
        });

      const presidentLook0IsThumbDome =
        document.querySelectorAll('.hair-back[data-hairstyle="bald"]').length > 0;

      // Check if .chyron-strip overlaps the Resolute Desk / Carpet Seal area at the bottom of .scene
      let chyronOverlapsScenePx = 0;
      const sceneEl = document.querySelector('.stage .scene');
      const chyronEl = document.querySelector('.chyron-strip');
      if (sceneEl && chyronEl) {
        const sRect = sceneEl.getBoundingClientRect();
        const cRect = chyronEl.getBoundingClientRect();
        const overlapTop = Math.max(sRect.top, cRect.top);
        const overlapBottom = Math.min(sRect.bottom, cRect.bottom);
        if (overlapBottom > overlapTop) {
          chyronOverlapsScenePx = Math.round(overlapBottom - overlapTop);
        }
      }

      // Check FedPortrait and CourtBench above the fold
      const fedEl = document.querySelector('[data-testid="fed-portrait"]');
      const courtEl = document.querySelector('[data-testid="court-bench"]');
      const fedPortraitAboveFold = fedEl
        ? fedEl.getBoundingClientRect().bottom <= height + 2
        : false;
      const courtBenchAboveFold = courtEl
        ? courtEl.getBoundingClientRect().bottom <= height + 2
        : false;

      // Check NewGame portico banner height
      const porticoEl = document.querySelector('[data-testid="newgame-portico-banner"]');
      const porticoHeroHeightPx = porticoEl ? Math.round(porticoEl.getBoundingClientRect().height) : 0;

      // Count raw Unicode emojis inside EO/institution/setup cards
      const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
      let rawEmojiCountInCards = 0;
      document
        .querySelectorAll('.order-card, .institution-card, .preview-card, .section-tag')
        .forEach((el) => {
          const matches = (el.textContent || '').match(emojiRe);
          if (matches) rawEmojiCountInCards += matches.length;
        });

      const hasLayeredEnvPlate = Boolean(
        document.querySelector('[data-testid="oval-env-plate"], [data-testid="newgame-env-plate"]'),
      );
      const hasTurnAgendaCard = Boolean(document.querySelector('[data-testid="turn-agenda-card"]'));

      return {
        viewportWidth: width,
        viewportHeight: height,
        docScrollHeight: shellEl.scrollHeight,
        outerOverflowPx: Math.max(0, document.documentElement.scrollHeight - height),
        paperBgRgb,
        cardBgRgb,
        cardInkRgb,
        cardLuminance,
        paperLuminance,
        cardIsCreamParchment,
        characterOuterStrokeCount,
        presidentLook0IsThumbDome,
        chyronOverlapsScenePx,
        fedPortraitAboveFold,
        courtBenchAboveFold,
        porticoHeroHeightPx,
        rawEmojiCountInCards,
        hasLayeredEnvPlate,
        hasTurnAgendaCard,
      };
    },
    { width: vp.width, height: vp.height },
  );
}

async function computePixelMetrics(page: Page, pngBase64: string): Promise<PixelMetrics> {
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);

    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let darkCount = 0;
    let creamCount = 0;
    let topBarLumSum = 0;
    let topBarCount = 0;
    let centerLumSum = 0;
    let centerCount = 0;

    const total = width * height;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        sumR += r;
        sumG += g;
        sumB += b;
        if (lum < 55) darkCount++;
        if (r > 215 && g > 200 && b > 170) creamCount++;
        if (y < 64) {
          topBarLumSum += lum;
          topBarCount++;
        }
        if (x >= width * 0.16 && x <= width * 0.68 && y >= height * 0.12 && y <= height * 0.85) {
          centerLumSum += lum;
          centerCount++;
        }
      }
    }

    const round = (n: number): number => Math.round(n * 100) / 100;
    const meanR = round(sumR / total);
    const meanG = round(sumG / total);
    const meanB = round(sumB / total);
    return {
      meanR,
      meanG,
      meanB,
      meanLuminance: round(0.2126 * meanR + 0.7152 * meanG + 0.0722 * meanB),
      darkPixelRatio: round(darkCount / total),
      warmCreamPixelRatio: round(creamCount / total),
      topBarMeanLuminance: round(topBarLumSum / Math.max(1, topBarCount)),
      centerStageMeanLuminance: round(centerLumSum / Math.max(1, centerCount)),
    };
  }, pngBase64);
}

async function runCaptureStage(stage: 'before' | 'after'): Promise<void> {
  const stageDir = join(OUT_ROOT, stage);
  mkdirSync(stageDir, { recursive: true });

  const serverProc = await ensureServer('http://localhost:5173/');
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const records: CaptureRecord[] = [];

    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      for (const spec of SURFACES) {
        await navigateToSurface(page, spec);
        const filename = `${spec.id}-${vp.label}.png`;
        const screenshotPath = join(stageDir, filename);
        const buf = await page.screenshot({ path: screenshotPath, fullPage: false });
        const dom = await collectDomMetrics(page, vp);
        const pixel = await computePixelMetrics(page, buf.toString('base64'));

        records.push({
          surfaceId: spec.id,
          title: spec.title,
          viewport: vp.label,
          screenshotPath,
          targetPath: join(TARGETS_DIR, spec.targetFile),
          pixel,
          dom,
        });
        console.log(
          `[cv:${stage}] ${spec.id} @ ${vp.label} -> envPlate=${dom.hasLayeredEnvPlate}, agendaCard=${dom.hasTurnAgendaCard}, outerOverflow=${dom.outerOverflowPx}px, cardCream=${dom.cardIsCreamParchment}, strokes=${dom.characterOuterStrokeCount}, emojis=${dom.rawEmojiCountInCards}`,
        );
      }

      await context.close();
    }

    const report: StageReport = {
      stage,
      capturedAt: new Date().toISOString(),
      records,
    };
    writeFileSync(join(stageDir, 'metrics.json'), JSON.stringify(report, null, 2));
    console.log(`[cv:${stage}] Saved ${records.length} captures + metrics to ${join(stageDir, 'metrics.json')}`);
  } finally {
    if (browser) await browser.close();
    if (serverProc) serverProc.kill('SIGTERM');
  }
}

async function buildComparisonSheet(
  page: Page,
  title: string,
  beforeB64: string,
  afterB64: string,
  targetB64: string | null,
  summaryLine: string,
): Promise<Buffer> {
  const dataUrl = await page.evaluate(
    async ({ titleText, b64Before, b64After, b64Target, summary }) => {
      const loadImg = (b64: string): Promise<HTMLImageElement> =>
        new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = rej;
          i.src = `data:image/png;base64,${b64}`;
        });

      const imgBefore = await loadImg(b64Before);
      const imgAfter = await loadImg(b64After);
      const imgTarget = b64Target ? await loadImg(b64Target) : null;

      const panelW = 640;
      const panelH = Math.round((imgAfter.height / imgAfter.width) * panelW);
      const cols = imgTarget ? 3 : 2;
      const pad = 20;
      const headerH = 78;
      const canvas = document.createElement('canvas');
      canvas.width = cols * panelW + (cols + 1) * pad;
      canvas.height = panelH + headerH + pad * 2;

      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#181410';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#F5EBD6';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(titleText, pad, 32);

      ctx.fillStyle = '#D5A93C';
      ctx.font = '15px monospace';
      ctx.fillText(summary, pad, 56);

      const drawPanel = (img: HTMLImageElement, colIdx: number, label: string, badgeColor: string): void => {
        const x = pad + colIdx * (panelW + pad);
        const y = headerH;
        ctx.strokeStyle = badgeColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, y - 2, panelW + 4, panelH + 4);
        ctx.drawImage(img, x, y, panelW, panelH);

        ctx.fillStyle = badgeColor;
        ctx.fillRect(x, y, 250, 28);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(label, x + 10, y + 19);
      };

      drawPanel(imgBefore, 0, 'BEFORE (v1.1 Baseline)', '#B63A2B');
      drawPanel(imgAfter, 1, 'AFTER (v1.2 Layered & Clear)', '#2E6B4E');
      if (imgTarget) {
        drawPanel(imgTarget, 2, 'DESIGN TARGET (.design-targets)', '#8A6718');
      }

      return canvas.toDataURL('image/png');
    },
    {
      titleText: title,
      b64Before: beforeB64,
      b64After: afterB64,
      b64Target: targetB64,
      summary: summaryLine,
    },
  );

  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

async function runCompare(): Promise<void> {
  const beforeFile = join(OUT_ROOT, 'before', 'metrics.json');
  const afterFile = join(OUT_ROOT, 'after', 'metrics.json');
  if (!existsSync(beforeFile) || !existsSync(afterFile)) {
    throw new Error('Both before/metrics.json and after/metrics.json must exist before running --compare');
  }

  const beforeReport = JSON.parse(readFileSync(beforeFile, 'utf8')) as StageReport;
  const afterReport = JSON.parse(readFileSync(afterFile, 'utf8')) as StageReport;
  const compareDir = join(OUT_ROOT, 'compare');
  mkdirSync(compareDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const mdLines: string[] = [
    '# Computer-Vision Before/After Flywheel Report (`v1.2`)',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| Surface | Viewport | Layered Env Plate (`B -> A`) | Turn Agenda Card (`B -> A`) | Outer Scroll (`B -> A`) | Card Parchment (`B -> A`) | Outer Ink Strokes (`B -> A`) | Raw Emojis (`B -> A`) |',
    '|---|---|---|---|---|---|---|---|',
  ];

  for (const afterRec of afterReport.records) {
    const beforeRec = beforeReport.records.find(
      (r) => r.surfaceId === afterRec.surfaceId && r.viewport === afterRec.viewport,
    );
    if (!beforeRec) continue;

    const beforeB64 = readFileSync(beforeRec.screenshotPath).toString('base64');
    const afterB64 = readFileSync(afterRec.screenshotPath).toString('base64');
    const targetB64 = existsSync(afterRec.targetPath)
      ? readFileSync(afterRec.targetPath).toString('base64')
      : null;

    const bEnv = Boolean(beforeRec.dom.hasLayeredEnvPlate);
    const aEnv = Boolean(afterRec.dom.hasLayeredEnvPlate);
    const bAgenda = Boolean(beforeRec.dom.hasTurnAgendaCard);
    const aAgenda = Boolean(afterRec.dom.hasTurnAgendaCard);

    const summary = `envPlate: ${bEnv} -> ${aEnv} | agendaCard: ${bAgenda} -> ${aAgenda} | scroll: ${beforeRec.dom.outerOverflowPx}px -> ${afterRec.dom.outerOverflowPx}px | creamCard: ${afterRec.dom.cardIsCreamParchment} | strokes: ${afterRec.dom.characterOuterStrokeCount} | emojis: ${afterRec.dom.rawEmojiCountInCards}`;

    const sheetBuf = await buildComparisonSheet(
      page,
      `${afterRec.title} [${afterRec.viewport}]`,
      beforeB64,
      afterB64,
      targetB64,
      summary,
    );

    const sheetName = `compare-${afterRec.surfaceId}-${afterRec.viewport}.png`;
    writeFileSync(join(compareDir, sheetName), sheetBuf);

    mdLines.push(
      `| **${afterRec.surfaceId}** | \`${afterRec.viewport}\` | \`${bEnv}\` → \`${aEnv}\` | \`${bAgenda}\` → \`${aAgenda}\` | \`${beforeRec.dom.outerOverflowPx}px\` → \`${afterRec.dom.outerOverflowPx}px\` | \`${beforeRec.dom.cardIsCreamParchment}\` → \`${afterRec.dom.cardIsCreamParchment}\` | \`${beforeRec.dom.characterOuterStrokeCount}\` → \`${afterRec.dom.characterOuterStrokeCount}\` | \`${beforeRec.dom.rawEmojiCountInCards}\` → \`${afterRec.dom.rawEmojiCountInCards}\` |`,
    );
  }

  await browser.close();

  const reportPath = join(OUT_ROOT, 'cv-report.md');
  writeFileSync(reportPath, mdLines.join('\n') + '\n');
  console.log(`[cv:compare] Wrote comparison sheets to ${compareDir} and report to ${reportPath}`);
}

const args = process.argv.slice(2);
const stageIdx = args.indexOf('--stage');
const isCompare = args.includes('--compare');

if (isCompare) {
  await runCompare();
} else if (stageIdx !== -1 && (args[stageIdx + 1] === 'before' || args[stageIdx + 1] === 'after')) {
  await runCaptureStage(args[stageIdx + 1] as 'before' | 'after');
} else {
  console.error('Usage: node scripts/cv-flywheel.ts --stage <before|after> | --compare');
  process.exit(1);
}
