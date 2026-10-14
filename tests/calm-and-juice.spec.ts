import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VIEWPORTS = [
  { width: 1376, height: 768 },
  { width: 1280, height: 720 },
];

for (const vp of VIEWPORTS) {
  test.describe(`Calm Mode & Tactile Stamps (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: vp });

    test('JUICE-01 & JUICE-03: calm mode toggle and stamp-slam badges in Congress and Powers', async ({
      page,
    }) => {
      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('button.stamp:has-text("Start the term")').click();
      await expect(page.locator('.app')).toBeVisible();

      // 1. Calm Mode Toggle in StatusBar
      const calmToggle = page.locator('[data-testid="calm-mode-toggle"]');
      await expect(calmToggle).toBeVisible();
      await expect(calmToggle).toHaveAttribute('aria-pressed', 'false');

      // Click to enable calm mode
      await calmToggle.click();
      await expect(calmToggle).toHaveAttribute('aria-pressed', 'true');
      const isCalm = await page.evaluate(() => document.documentElement.dataset.calm);
      expect(isCalm).toBe('true');

      // Verify viewport fit
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

      // 2. Congress: Call vote and verify stamp-slam badge
      await page.click('nav button:has-text("Congress")');
      await expect(page.locator('.card.chamber')).toBeVisible();

      const callVoteBtn = page.locator('button.stamp:has-text("Call the vote")');
      await expect(callVoteBtn).toBeVisible();
      await callVoteBtn.click();

      const congressStamp = page.locator('[data-testid="stamp-slam-badge"]');
      await expect(congressStamp).toBeVisible();
      const stampText = await congressStamp.textContent();
      expect(stampText).toMatch(/PASSED & STAMPED|BLOCKED/);

      await page.screenshot({
        path: `test-results/phase26-congress-stamp-${vp.width}x${vp.height}.png`,
      });

      // 3. Advance to Turn 2 to unlock "Your Powers"
      await page.click('button.stamp:has-text("Next turn")');
      const continueBtn = page.locator('button.stamp:has-text("Continue term")');
      await expect(continueBtn).toBeVisible();
      await continueBtn.click();

      // 4. Powers: Stage an Executive Order and verify stamp-slam badge
      await page.click('nav button:has-text("Your Powers")');
      await expect(page.locator('.orders-grid')).toBeVisible();

      const signBtn = page.locator('button.stamp-btn:has-text("SIGN ORDER")');
      await expect(signBtn).toBeVisible();
      await signBtn.click();

      const powersStamp = page.locator('.orders-grid [data-testid="stamp-slam-badge"]').first();
      await expect(powersStamp).toBeVisible();
      await expect(powersStamp).toHaveText('SIGNED BY ORDER');

      await page.screenshot({
        path: `test-results/phase26-powers-stamp-${vp.width}x${vp.height}.png`,
      });

      // 5. Accessibility audit
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(
        axe.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        ),
      ).toEqual([]);
    });
  });
}
