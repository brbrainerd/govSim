import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768, name: '1376x768' },
  { width: 1280, height: 720, name: '1280x720' },
];

test.describe('Household viewport layout & scroll audit (1376x768 & 1280x720)', () => {
  for (const vp of VIEWPORTS) {
    test(`renders Oval Office Household card, modal, and Economy breakdown with zero page overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      mkdirSync('.planning/phases/12-household-impact-card/screenshots', { recursive: true });

      // Start new game
      await expect(page.locator('.newgame')).toBeVisible();
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('button.stamp:has-text("START THE TERM")').click();
      await expect(page.locator('.app')).toBeVisible();

      // 1. Audit Oval Office Screen with Household Card
      await expect(page.locator('[data-testid="household-card"]')).toBeVisible();

      await page.screenshot({
        path: `.planning/phases/12-household-impact-card/screenshots/oval-office-household-${vp.name}.png`,
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
      expect(scrollCheck.scrollHeight, `Oval Office height overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowHeight);
      expect(scrollCheck.scrollWidth, `Oval Office width overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowWidth);

      // 2. Audit Household Modal from Oval Office
      await page.locator('[data-testid="household-card"] button:has-text("Explore Household Impact →")').click();
      await expect(page.locator('[data-testid="household-modal"]')).toBeVisible();

      await page.screenshot({
        path: `.planning/phases/12-household-impact-card/screenshots/modal-household-${vp.name}.png`,
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
      expect(scrollCheck.scrollHeight, `Household modal height overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowHeight);
      expect(scrollCheck.scrollWidth, `Household modal width overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowWidth);

      // Close modal
      await page.locator('[data-testid="household-modal"] button.close-x').click();
      await expect(page.locator('[data-testid="household-modal"]')).not.toBeVisible();

      // 3. Audit Economy Screen with Your Household View
      await page.locator('.tab:has-text("Economy")').click();
      await expect(page.locator('[data-testid="tab-household"]')).toBeVisible();
      await page.locator('[data-testid="tab-household"]').click();
      await expect(page.locator('[data-testid="household-breakdown"]')).toBeVisible();

      await page.screenshot({
        path: `.planning/phases/12-household-impact-card/screenshots/economy-household-${vp.name}.png`,
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
      expect(scrollCheck.scrollHeight, `Economy household view height overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowHeight);
      expect(scrollCheck.scrollWidth, `Economy household view width overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowWidth);
    });
  }
});
