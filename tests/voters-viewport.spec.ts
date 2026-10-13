import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768, name: '1376x768' },
  { width: 1280, height: 720, name: '1280x720' },
];

test.describe('Voters screen viewport layout & scroll audit (1376x768 & 1280x720)', () => {
  for (const vp of VIEWPORTS) {
    test(`renders cleanly with zero page overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Start new game
      await expect(page.locator('.newgame')).toBeVisible();
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('button.stamp:has-text("START THE TERM")').click();
      await expect(page.locator('.app')).toBeVisible();

      // Advance to Turn 3
      await page.locator('button.stamp:has-text("Next turn")').click();
      await page.locator('button.stamp:has-text("Continue term")').click();
      await page.locator('button.stamp:has-text("Next turn")').click();
      await page.locator('button.stamp:has-text("Continue term")').click();

      // Dismiss crisis if any
      if (await page.locator('.breaking-ribbon').isVisible()) {
        await page.locator('.modal-grid .option-card:not(.unaffordable)').first().click();
        await page.locator('button.stamp:has-text("DECIDE")').click();
        await expect(page.locator('.breaking-ribbon')).not.toBeVisible();
      }

      // Navigate to Voters
      const votersTab = page.locator('.tab:has-text("Voters")');
      await expect(votersTab).toBeVisible();
      await votersTab.click();
      await expect(page.locator('.h:has-text("Who supports you?")')).toBeVisible();

      mkdirSync('.planning/phases/10-demographic-regional-distribution/screenshots', { recursive: true });

      // 1. Audit Map View
      await expect(page.locator('[data-testid="us-map"]')).toBeVisible();
      await expect(page.locator('[data-testid="state-inspector"]')).toBeVisible();
      await page.screenshot({
        path: `.planning/phases/10-demographic-regional-distribution/screenshots/voters-map-${vp.name}.png`,
      });

      // Verify zero document-level scroll overflow
      const mapScrollCheck = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          windowHeight: window.innerHeight,
          scrollHeight: root.scrollHeight,
          windowWidth: window.innerWidth,
          scrollWidth: root.scrollWidth,
        };
      });
      expect(mapScrollCheck.scrollHeight, `Map view height overflow at ${vp.name}`).toBeLessThanOrEqual(mapScrollCheck.windowHeight);
      expect(mapScrollCheck.scrollWidth, `Map view width overflow at ${vp.name}`).toBeLessThanOrEqual(mapScrollCheck.windowWidth);

      // 2. Audit Table View
      await page.locator('.switch-btn:has-text("Table View")').click();
      await expect(page.locator('.states-table')).toBeVisible();
      await page.screenshot({
        path: `.planning/phases/10-demographic-regional-distribution/screenshots/voters-table-${vp.name}.png`,
      });

      const tableScrollCheck = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          windowHeight: window.innerHeight,
          scrollHeight: root.scrollHeight,
          windowWidth: window.innerWidth,
          scrollWidth: root.scrollWidth,
        };
      });
      expect(tableScrollCheck.scrollHeight, `Table view height overflow at ${vp.name}`).toBeLessThanOrEqual(tableScrollCheck.windowHeight);
      expect(tableScrollCheck.scrollWidth, `Table view width overflow at ${vp.name}`).toBeLessThanOrEqual(tableScrollCheck.windowWidth);

      // 3. Audit Coalitions View
      await page.locator('.switch-btn:has-text("Coalitions")').click();
      await expect(page.locator('.coalitions-wrapper')).toBeVisible();
      for (const id of ['seniors', 'working_class', 'young_families', 'college_educated', 'immigrant', 'energy_ag']) {
        await expect(page.locator(`[data-testid="cohort-${id}"]`)).toBeVisible();
      }
      await page.screenshot({
        path: `.planning/phases/10-demographic-regional-distribution/screenshots/voters-coalitions-${vp.name}.png`,
      });

      const coalitionsScrollCheck = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          windowHeight: window.innerHeight,
          scrollHeight: root.scrollHeight,
          windowWidth: window.innerWidth,
          scrollWidth: root.scrollWidth,
        };
      });
      expect(coalitionsScrollCheck.scrollHeight, `Coalitions view height overflow at ${vp.name}`).toBeLessThanOrEqual(coalitionsScrollCheck.windowHeight);
      expect(coalitionsScrollCheck.scrollWidth, `Coalitions view width overflow at ${vp.name}`).toBeLessThanOrEqual(coalitionsScrollCheck.windowWidth);
    });
  }
});
