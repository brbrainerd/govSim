import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768, name: '1376x768' },
  { width: 1280, height: 720, name: '1280x720' },
];

test.describe('Corrupt Executive Levers & Cronyism (LEVER-01, LEVER-02, LEVER-03)', () => {
  test('Evil Mode corrupt levers interaction, siphoning, and watchdog suppression', async ({ page }) => {
    mkdirSync('.planning/phases/18-corrupt-executive-levers-cronyism/screenshots', { recursive: true });

    // 1. Start game in Evil Mode
    await page.goto('/');
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('[data-testid="evil-mode-toggle"]').check();
    await page.locator('button.stamp:has-text("Seize power")').click();
    await expect(page.locator('.app')).toBeVisible();

    // 2. Navigate to Your Powers screen
    const powersTab = page.locator('.tab:has-text("Your Powers")');
    await expect(powersTab).toBeVisible();
    await expect(powersTab).toBeEnabled();
    await powersTab.click();

    // 3. Verify Corrupt Executive Levers section is present
    const evilSection = page.locator('[data-testid="evil-levers-section"]');
    await expect(evilSection).toBeVisible();
    await expect(evilSection).toContainText('Corrupt Executive Directives');

    // Initial summary
    await expect(page.locator('[data-testid="evil-staged-count"]')).toHaveText('0');
    await expect(page.locator('[data-testid="evil-staged-cost"]')).toHaveText('0');
    await expect(page.locator('[data-testid="evil-staged-kickback"]')).toHaveText('+$0.0B');
    await expect(page.locator('[data-testid="evil-staged-heat"]')).toHaveText('+0');

    // 4. Stage No-Bid Contracts and Public Lands Auction
    await page.locator('[data-testid="evil-lever-toggle-crony_contracts"]').click();
    await expect(page.locator('[data-testid="evil-staged-count"]')).toHaveText('1');
    await expect(page.locator('[data-testid="evil-staged-cost"]')).toHaveText('15');
    await expect(page.locator('[data-testid="evil-staged-kickback"]')).toHaveText('+$15.0B');
    await expect(page.locator('[data-testid="evil-staged-heat"]')).toHaveText('+14');

    await page.locator('[data-testid="evil-lever-toggle-auction_public_lands"]').click();
    await expect(page.locator('[data-testid="evil-staged-count"]')).toHaveText('2');
    await expect(page.locator('[data-testid="evil-staged-cost"]')).toHaveText('35');
    await expect(page.locator('[data-testid="evil-staged-kickback"]')).toHaveText('+$40.0B');
    await expect(page.locator('[data-testid="evil-staged-heat"]')).toHaveText('+36');

    // 5. Advance turn to enact directives
    await page.locator('button.stamp:has-text("Next turn")').click();
    await page.locator('button.stamp:has-text("Continue term")').click();

    // Verify Offshore Stash and Heat Meter in StatusBar
    await expect(page.locator('[data-testid="status-offshore-stash"]')).toContainText('$40.0B');
    await expect(page.locator('[data-testid="status-heat-meter"]')).toContainText('36/100');

    // 6. Navigate back to Powers and enact Watchdog Suppression (fire_inspectors_general)
    await powersTab.click();
    await expect(evilSection).toBeVisible();

    await page.locator('[data-testid="evil-lever-toggle-fire_inspectors_general"]').click();
    await expect(page.locator('[data-testid="evil-staged-count"]')).toHaveText('1');
    await expect(page.locator('[data-testid="evil-staged-cost"]')).toHaveText('25');
    await expect(page.locator('[data-testid="evil-staged-heat"]')).toHaveText('-20');

    // Advance turn to enact watchdog suppression
    await page.locator('button.stamp:has-text("Next turn")').click();
    await page.locator('button.stamp:has-text("Continue term")').click();

    // Heat cools down: 36 - 3 natural decay - 20 suppression = 13
    await expect(page.locator('[data-testid="status-heat-meter"]')).toContainText('13/100');
  });

  test('Standard mode does not display Corrupt Executive Levers on Powers screen', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("Start the term")').click();
    await expect(page.locator('.app')).toBeVisible();

    // Advance to turn 2 to unlock powers screen
    await page.locator('button.stamp:has-text("Next turn")').click();
    await page.locator('button.stamp:has-text("Continue term")').click();

    const powersTab = page.locator('.tab:has-text("Your Powers")');
    await powersTab.click();

    await expect(page.locator('[data-testid="foreign-policy-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="evil-levers-section"]')).toHaveCount(0);
  });

  for (const vp of VIEWPORTS) {
    test(`multi-viewport layout, zero overflow, and axe a11y on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('[data-testid="evil-mode-toggle"]').check();
      await page.locator('button.stamp:has-text("Seize power")').click();
      await expect(page.locator('.app')).toBeVisible();

      // Go to Powers
      const powersTab = page.locator('.tab:has-text("Your Powers")');
      await powersTab.click();
      await expect(page.locator('[data-testid="evil-levers-section"]')).toBeVisible();

      // Stage an evil lever
      await page.locator('[data-testid="evil-lever-toggle-crony_contracts"]').click();

      // Screenshot Powers screen with corrupt levers staged
      await page.screenshot({
        path: `.planning/phases/18-corrupt-executive-levers-cronyism/screenshots/powers-evil-${vp.name}.png`,
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

      // Axe audit on Powers screen in Evil Mode
      const powersAxe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast']) // color palette audited separately via design tokens
        .analyze();
      const powersSevere = powersAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(powersSevere).toEqual([]);
    });
  }
});
