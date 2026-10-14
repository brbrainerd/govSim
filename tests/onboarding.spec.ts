import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VIEWPORTS = [
  { width: 1376, height: 768 },
  { width: 1280, height: 720 },
];

for (const vp of VIEWPORTS) {
  test.describe(`Year-1 Progressive Onboarding (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: vp });

    test('ONBOARD-01 & ONBOARD-02: guides, progressive unlocking, and unlock-all controls', async ({
      page,
    }) => {
      // 1. Initial Start: Default game (unlockAll = false)
      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();

      // Check unlock-all toggle exists in NewGame
      const newGameToggle = page.locator('[data-testid="unlock-all-toggle"]');
      await expect(newGameToggle).toBeVisible();
      await expect(newGameToggle).not.toBeChecked();

      await page.locator('button.stamp:has-text("Start the term")').click();
      await expect(page.locator('.app')).toBeVisible();

      // Verify Year-1 guide callout on Turn 1
      const guide = page.locator('[data-testid="year1-onboarding-guide"]');
      await expect(guide).toBeVisible();
      await expect(guide).toContainText('Year 1 · Step 1 of 3');

      // Verify locked tabs and in-rail unlock button
      const powersTab = page.locator('nav button.tab:has-text("Your Powers")');
      const tradeTab = page.locator('nav button.tab:has-text("Trade & Tariffs")');
      const votersTab = page.locator('nav button.tab:has-text("Voters")');
      const unlockAllBtn = page.locator('[data-testid="rail-unlock-all-btn"]');

      await expect(powersTab).toBeDisabled();
      await expect(tradeTab).toBeDisabled();
      await expect(votersTab).toBeDisabled();
      await expect(unlockAllBtn).toBeVisible();

      // Verify viewport fit
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

      // 2. Advance to Turn 2
      await page.click('button.stamp:has-text("Next turn")');
      const continueBtn = page.locator('button.stamp:has-text("Continue term")');
      await expect(continueBtn).toBeVisible();
      await continueBtn.click();

      // Verify Turn 2 guide and NEW badges
      await expect(guide).toContainText('Year 1 · Step 2 of 3');
      const powersNewBadge = page.locator('[data-testid="rail-new-badge-powers"]');
      const tradeNewBadge = page.locator('[data-testid="rail-new-badge-trade"]');
      await expect(powersNewBadge).toBeVisible();
      await expect(tradeNewBadge).toBeVisible();
      await expect(powersTab).toBeEnabled();
      await expect(tradeTab).toBeEnabled();
      await expect(votersTab).toBeDisabled();

      // 3. Click "Unlock all screens" in rail -> voters unlocks immediately
      await unlockAllBtn.click();
      await expect(votersTab).toBeEnabled();
      await expect(unlockAllBtn).toBeHidden();

      // Navigate to Voters screen
      await votersTab.click();
      await expect(page.locator('[data-testid="voters-screen"]')).toBeVisible();

      // 4. Accessibility audit
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(
        axe.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        ),
      ).toEqual([]);
    });

    test('ONBOARD-01: Experienced Mode checkbox unlocks all screens on Turn 1', async ({
      page,
    }) => {
      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();

      // Enable Experienced Mode
      const newGameToggle = page.locator('[data-testid="unlock-all-toggle"]');
      await newGameToggle.check();
      await expect(newGameToggle).toBeChecked();

      await page.locator('button.stamp:has-text("Start the term")').click();
      await expect(page.locator('.app')).toBeVisible();

      // Verify all tabs are enabled on Turn 1
      const powersTab = page.locator('nav button.tab:has-text("Your Powers")');
      const tradeTab = page.locator('nav button.tab:has-text("Trade & Tariffs")');
      const votersTab = page.locator('nav button.tab:has-text("Voters")');
      const unlockAllBtn = page.locator('[data-testid="rail-unlock-all-btn"]');

      await expect(powersTab).toBeEnabled();
      await expect(tradeTab).toBeEnabled();
      await expect(votersTab).toBeEnabled();
      await expect(unlockAllBtn).toBeHidden();
    });
  });
}
