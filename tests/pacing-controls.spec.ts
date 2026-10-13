import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VIEWPORTS = [
  { width: 1376, height: 768 },
  { width: 1280, height: 720 },
];

for (const vp of VIEWPORTS) {
  test.describe(`Pacing Controls — Fast-Forward & Staged Decisions (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: vp });

    test('PACE-01 & PACE-02: staged decisions pill/popover tracks unsent and queued actions, and Skip to event halts on next event', async ({
      page,
    }) => {
      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('button.stamp:has-text("Start the term")').click();
      await expect(page.locator('.app')).toBeVisible();

      // 1. Initially 0 staged decisions
      const stagedPill = page.locator('[data-testid="staged-decisions-pill"]');
      await expect(stagedPill).toBeVisible();
      await expect(stagedPill).toContainText('0 staged');

      // 2. Click "Open Budget" advisor play (pre-fills Infrastructure push -> 1 staged unsent warning)
      await page.click('.card.option button:has-text("Open Budget")');
      await expect(stagedPill).toContainText('1 staged (unsent)');

      // Open Staged Decisions popover
      await stagedPill.click();
      const popover = page.locator('[data-testid="staged-decisions-popover"]');
      await expect(popover).toBeVisible();
      await expect(page.locator('[data-testid="staged-item-budget-unsent"]')).toContainText(
        'Budget draft (unsent)',
      );

      await page.screenshot({
        path: `test-results/phase23-staged-popover-${vp.width}x${vp.height}.png`,
      });

      const axePopover = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(
        axePopover.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        ),
      ).toEqual([]);

      // Close popover and send to Congress -> warning clears to "1 staged"
      await stagedPill.click();
      await page.click('button.stamp:has-text("Send to Congress")');
      await expect(stagedPill).toHaveText('1 staged');

      // 3. PACE-02: Click "Skip to event" fast-forward button
      const skipBtn = page.locator('[data-testid="fast-forward-btn"]');
      await expect(skipBtn).toBeEnabled();
      await skipBtn.click();

      // Turn advances past Turn 1 and halts on either a Crisis modal or TurnReport at a critical deadline turn
      await expect(page.locator('button.when')).not.toContainText('Turn 1 of 32');

      await page.screenshot({
        path: `test-results/phase23-after-skip-${vp.width}x${vp.height}.png`,
      });

      const axeAfterSkip = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(
        axeAfterSkip.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        ),
      ).toEqual([]);
    });
  });
}
