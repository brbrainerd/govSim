import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VIEWPORTS = [
  { width: 1376, height: 768, name: '1376x768' },
  { width: 1280, height: 720, name: '1280x720' },
];

test.describe('Dramatic SVG Art Overhaul & Reactive Scenes (ART-01, ART-02, ART-03)', () => {
  for (const vp of VIEWPORTS) {
    test(`renders reactive Oval Office scene without outer scrolling on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // 1. Standard mode start
      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('button.stamp:has-text("Start the term")').click();
      await expect(page.locator('.app')).toBeVisible();

      // 2. Verify Oval Office Scene and upgraded Character
      const scene = page.locator('[data-testid="oval-office-scene"]');
      await expect(scene).toBeVisible();
      const weather = await scene.getAttribute('data-weather');
      expect(['sunny', 'rain', 'storm']).toContain(weather);

      // Verify character mood attribute
      const charRigs = page.locator('[data-testid="oval-office-scene"] [data-mood]');
      await expect(charRigs.first()).toBeVisible();
      const mood = await charRigs.first().getAttribute('data-mood');
      expect(['confident', 'stressed', 'scheming', 'panicked', 'triumphant']).toContain(mood);

      // 3. Verify zero outer viewport scrolling
      const overflows = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: window.innerHeight,
      }));
      expect(overflows.scrollHeight, `Outer viewport scrolling detected on ${vp.name}`).toBeLessThanOrEqual(overflows.clientHeight + 1);

      // 4. Axe accessibility audit
      const a11y = await new AxeBuilder({ page })
        .exclude('.scene') // SVG illustration decorations are presentational
        .analyze();
      expect(a11y.violations).toEqual([]);
    });

    test(`renders Evil Mode Oval Office with shredder and scheming mood on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // 1. Evil Mode start
      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('[data-testid="evil-mode-toggle"]').check();
      await page.locator('button.stamp:has-text("Seize power")').click();
      await expect(page.locator('.app')).toBeVisible();

      // 2. Verify Evil Mode props in Oval Office
      const scene = page.locator('[data-testid="oval-office-scene"]');
      await expect(scene).toBeVisible();
      await expect(page.locator('[data-testid="oval-evil-shredder"]')).toBeVisible();

      // 3. Verify President character is in scheming mood
      const schemingChar = page.locator('[data-testid="oval-office-scene"] [data-mood="scheming"]');
      await expect(schemingChar).toBeVisible();

      // 4. Navigate to Your Powers and verify upgraded CourtBench & FedPortrait
      await page.locator('[data-testid="goto-corrupt-levers-btn"]').click();
      await expect(page.locator('[data-testid="court-bench"]')).toBeVisible();
      await expect(page.locator('[data-testid="fed-portrait"]')).toBeVisible();

      // Verify zero outer viewport scrolling on Powers screen
      const overflows = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: window.innerHeight,
      }));
      expect(overflows.scrollHeight, `Outer viewport scrolling detected on Powers ${vp.name}`).toBeLessThanOrEqual(overflows.clientHeight + 1);
    });
  }
});
