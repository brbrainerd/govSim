import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768, name: '1376x768' },
  { width: 1280, height: 720, name: '1280x720' },
];

test.describe('Structural Reforms viewport layout & scroll audit (1376x768 & 1280x720)', () => {
  for (const vp of VIEWPORTS) {
    test(`renders Congress and Powers modals cleanly with zero page overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      mkdirSync('.planning/phases/11-structural-government-reform/screenshots', { recursive: true });

      // Start new game
      await expect(page.locator('.newgame')).toBeVisible();
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('button.stamp:has-text("START THE TERM")').click();
      await expect(page.locator('.app')).toBeVisible();

      // 1. Audit Congress Screen & Filibuster Modal
      await page.locator('.tab:has-text("Congress")').click();
      await expect(page.locator('[data-testid="open-filibuster-modal"]')).toBeVisible();
      await page.locator('[data-testid="open-filibuster-modal"]').click();
      await expect(page.locator('[data-testid="filibuster-modal"]')).toBeVisible();

      await page.screenshot({
        path: `.planning/phases/11-structural-government-reform/screenshots/modal-filibuster-${vp.name}.png`,
      });

      let scrollCheck = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          windowHeight: window.innerHeight,
          scrollHeight: root.scrollHeight,
          windowWidth: window.innerWidth,
          scrollWidth: root.scrollWidth,
        };
      });
      expect(scrollCheck.scrollHeight, `Filibuster modal height overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowHeight);
      expect(scrollCheck.scrollWidth, `Filibuster modal width overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowWidth);

      await page.locator('[data-testid="filibuster-modal"] button.close-btn').click();
      await expect(page.locator('[data-testid="filibuster-modal"]')).not.toBeVisible();

      // 2. Audit Amendment Modal
      await page.locator('[data-testid="open-amendment-modal"]').click();
      await expect(page.locator('[data-testid="amendment-modal"]')).toBeVisible();

      await page.screenshot({
        path: `.planning/phases/11-structural-government-reform/screenshots/modal-amendment-${vp.name}.png`,
      });

      scrollCheck = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          windowHeight: window.innerHeight,
          scrollHeight: root.scrollHeight,
          windowWidth: window.innerWidth,
          scrollWidth: root.scrollWidth,
        };
      });
      expect(scrollCheck.scrollHeight, `Amendment modal height overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowHeight);
      expect(scrollCheck.scrollWidth, `Amendment modal width overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowWidth);

      await page.locator('[data-testid="amendment-modal"] button.close-btn').click();
      await expect(page.locator('[data-testid="amendment-modal"]')).not.toBeVisible();

      // 3. Advance to Turn 2 for Your Powers Screen
      await page.locator('button.stamp:has-text("Next turn")').click();
      await page.locator('button.stamp:has-text("Continue term")').click();

      // Dismiss crisis if any
      if (await page.locator('.breaking-ribbon').isVisible()) {
        await page.locator('.modal-grid .option-card:not(.unaffordable)').first().click();
        await page.locator('button.stamp:has-text("DECIDE")').click();
        await expect(page.locator('.breaking-ribbon')).not.toBeVisible();
      }

      await page.locator('.tab:has-text("Your Powers")').click();
      await expect(page.locator('[data-testid="open-judicial-reform-modal"]')).toBeVisible();

      await page.screenshot({
        path: `.planning/phases/11-structural-government-reform/screenshots/powers-screen-${vp.name}.png`,
      });

      scrollCheck = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          windowHeight: window.innerHeight,
          scrollHeight: root.scrollHeight,
          windowWidth: window.innerWidth,
          scrollWidth: root.scrollWidth,
        };
      });
      expect(scrollCheck.scrollHeight, `Powers screen height overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowHeight);
      expect(scrollCheck.scrollWidth, `Powers screen width overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowWidth);

      // 4. Audit Judicial Reform Modal
      await page.locator('[data-testid="open-judicial-reform-modal"]').click();
      await expect(page.locator('[data-testid="judicial-reform-modal"]')).toBeVisible();

      await page.screenshot({
        path: `.planning/phases/11-structural-government-reform/screenshots/modal-judicial-${vp.name}.png`,
      });

      scrollCheck = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          windowHeight: window.innerHeight,
          scrollHeight: root.scrollHeight,
          windowWidth: window.innerWidth,
          scrollWidth: root.scrollWidth,
        };
      });
      expect(scrollCheck.scrollHeight, `Judicial modal height overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowHeight);
      expect(scrollCheck.scrollWidth, `Judicial modal width overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowWidth);

      await page.locator('[data-testid="judicial-reform-modal"] button.close-btn').click();
      await expect(page.locator('[data-testid="judicial-reform-modal"]')).not.toBeVisible();
    });
  }
});
