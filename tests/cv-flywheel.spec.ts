import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { width: 1376, height: 768 },
  { width: 1280, height: 720 },
] as const;

test.describe('Milestone v1.1 Visual Fidelity, Evil Mode Palette & CV Flywheel Invariants', () => {
  for (const vp of VIEWPORTS) {
    test(`Evil Mode non-inverted cream parchment cards, borderless pill-pawns, and Powers above-the-fold institutions at ${vp.width}x${vp.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(vp);
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.clear();
        document.documentElement.setAttribute('data-calm', 'true');
      });
      await page.reload();
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-calm', 'true');
      });

      // 1. NewGame: enlarged portico banner & borderless characters
      const porticoHeight = await page
        .locator('[data-testid="newgame-portico-banner"]')
        .evaluate((el) => Math.round(el.getBoundingClientRect().height));
      expect(porticoHeight).toBeGreaterThanOrEqual(200);

      // Select Evil Mode + Unlock All and start game
      await page.locator('input[name="party"]').first().check();
      await page.locator('[data-testid="evil-mode-toggle"]').check();
      await page.locator('[data-testid="unlock-all-toggle"]').check();
      await page.locator('button.stamp').click();

      // Dismiss Quarter 1 Perk Draft Modal if open
      const skipDraft = page.locator('[data-testid="perk-draft-skip-btn"]');
      if (await skipDraft.isVisible()) {
        await skipDraft.click();
      }

      // 2. Oval Office (Evil Mode): non-inverted warm cream parchment card + dark ink, zero outer strokes, zero chyron overlap
      const evilMetrics = await page.evaluate(() => {
        const parseRgb = (str: string): [number, number, number] => {
          const m = str.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
          return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
        };
        const lum = ([r, g, b]: [number, number, number]): number =>
          0.2126 * r + 0.7152 * g + 0.0722 * b;

        const cardEl = document.querySelector('.card.info, .card.tile') as HTMLElement;
        const cardLum = lum(parseRgb(getComputedStyle(cardEl).backgroundColor));
        const inkLum = lum(parseRgb(getComputedStyle(cardEl).color));
        const canvasLum = lum(parseRgb(getComputedStyle(document.body).backgroundColor));

        let outerStrokes = 0;
        document
          .querySelectorAll('[data-pose] path, [data-pose] rect, [data-pose] circle, [data-pose] ellipse')
          .forEach((el) => {
            const fill = el.getAttribute('fill') || '';
            const stroke = el.getAttribute('stroke') || '';
            const sw = Number(el.getAttribute('stroke-width') || '0');
            if (fill !== 'none' && stroke === 'var(--ink)' && sw >= 1.2) {
              outerStrokes++;
            }
          });

        const sceneRect = document.querySelector('.stage .scene')!.getBoundingClientRect();
        const chyronRect = document.querySelector('.chyron-strip')!.getBoundingClientRect();
        const overlapTop = Math.max(sceneRect.top, chyronRect.top);
        const overlapBottom = Math.min(sceneRect.bottom, chyronRect.bottom);
        const chyronOverlapPx = overlapBottom > overlapTop ? Math.round(overlapBottom - overlapTop) : 0;

        return { cardLum, inkLum, canvasLum, outerStrokes, chyronOverlapPx };
      });

      expect(evilMetrics.canvasLum).toBeLessThan(40); // Dark espresso outer canvas
      expect(evilMetrics.cardLum).toBeGreaterThan(200); // Warm cream parchment card (not inverted!)
      expect(evilMetrics.inkLum).toBeLessThan(60); // Dark ink on cream card
      expect(evilMetrics.outerStrokes).toBe(0); // Flat vector, no cartoon outlines
      expect(evilMetrics.chyronOverlapPx).toBe(0); // Chyron sits cleanly below .scene

      // 3. Navigate to Your Powers: verify 5x2 EO grid keeps FedPortrait and CourtBench above the fold
      await page.locator('nav button.tab', { hasText: /Your Powers/i }).click();
      const powersMetrics = await page.evaluate((vh) => {
        const fedRect = document.querySelector('[data-testid="fed-portrait"]')!.getBoundingClientRect();
        const courtRect = document.querySelector('[data-testid="court-bench"]')!.getBoundingClientRect();
        return {
          fedBottom: Math.round(fedRect.bottom),
          courtBottom: Math.round(courtRect.bottom),
          fedAboveFold: fedRect.bottom <= vh + 2,
          courtAboveFold: courtRect.bottom <= vh + 2,
        };
      }, vp.height);

      expect(powersMetrics.fedAboveFold).toBe(true);
      expect(powersMetrics.courtAboveFold).toBe(true);
    });
  }
});
