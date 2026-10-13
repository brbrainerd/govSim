import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768, name: '1376x768' },
  { width: 1280, height: 720, name: '1280x720' },
];

test.describe('Satirical Evil Mode & HUD (EVIL-01, EVIL-02, EVIL-03)', () => {
  test('New Game mode toggle, disclaimers, and HUD indicator comparison', async ({ page }) => {
    mkdirSync('.planning/phases/17-evil-mode-engine-offshore-stash-heat-meter/screenshots', { recursive: true });

    await page.goto('/');
    await expect(page.locator('.newgame')).toBeVisible();

    // 1. Verify New Game mode section and cards
    await expect(page.locator('.mode-section')).toBeVisible();
    await expect(page.locator('text=Public Servant (Standard)')).toBeVisible();
    await expect(page.locator('text=Satirical "Evil Mode"')).toBeVisible();

    // Default button text when party selected in Standard mode
    await page.locator('input[name="party"][value="D"]').check();
    await expect(page.locator('button.stamp:has-text("Start the term")')).toBeVisible();
    await expect(page.locator('.evil-warning')).toHaveCount(0);

    // 2. Select Evil Mode
    await page.locator('[data-testid="evil-mode-toggle"]').check();
    await expect(page.locator('.evil-warning')).toBeVisible();
    await expect(page.locator('.evil-warning')).toContainText('You have selected Satirical Evil Mode');
    await expect(page.locator('button.stamp:has-text("Seize power")')).toBeVisible();

    // 3. Start game in Evil Mode
    await page.locator('button.stamp:has-text("Seize power")').click();
    await expect(page.locator('.app')).toBeVisible();

    // 4. Verify Evil Mode indicators in StatusBar
    await expect(page.locator('[data-testid="status-offshore-stash"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-offshore-stash"]')).toContainText('$0.0B');

    await expect(page.locator('[data-testid="status-heat-meter"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-heat-meter"]')).toContainText('0/100');

    await expect(page.locator('[data-testid="evil-mode-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="evil-mode-indicator"]')).toContainText('SATIRICAL EVIL MODE');
  });

  test('Standard mode does not display Evil Mode indicators', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("Start the term")').click();
    await expect(page.locator('.app')).toBeVisible();

    await expect(page.locator('[data-testid="status-offshore-stash"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="status-heat-meter"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="evil-mode-indicator"]')).toHaveCount(0);
  });

  for (const vp of VIEWPORTS) {
    test(`multi-viewport layout, zero overflow, and axe a11y on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Check New Game screen with Evil Mode selected
      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('[data-testid="evil-mode-toggle"]').check();

      // Screenshot New Game screen in Evil Mode
      await page.screenshot({
        path: `.planning/phases/17-evil-mode-engine-offshore-stash-heat-meter/screenshots/newgame-evil-${vp.name}.png`,
      });

      // Axe audit on New Game screen
      const newGameAxe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      const newGameSevere = newGameAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(newGameSevere).toEqual([]);

      // Start game
      await page.locator('button.stamp:has-text("Seize power")').click();
      await expect(page.locator('.app')).toBeVisible();

      // Screenshot Oval Office in Evil Mode
      await page.screenshot({
        path: `.planning/phases/17-evil-mode-engine-offshore-stash-heat-meter/screenshots/oval-evil-${vp.name}.png`,
      });

      // Verify zero outer viewport scroll
      const scrollCheck = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          windowHeight: window.innerHeight,
          scrollHeight: root.scrollHeight,
        };
      });
      expect(
        scrollCheck.scrollHeight,
        `Outer scroll height exceeded viewport on ${vp.name}: ${scrollCheck.scrollHeight} > ${scrollCheck.windowHeight}`,
      ).toBeLessThanOrEqual(scrollCheck.windowHeight + 1);

      // Axe audit on active Evil Mode game screen
      const gameAxe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      const gameSevere = gameAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(gameSevere).toEqual([]);
    });
  }
});
