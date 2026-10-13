import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VIEWPORTS = [
  { width: 1376, height: 768 },
  { width: 1280, height: 720 },
];

for (const vp of VIEWPORTS) {
  test.describe(`Advisor Plays, Auto-Whip & Budget Household (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: vp });

    test('ADVISOR-01..03: advisor plays pre-fill budget, budget shows live household persona, and Congress auto-whips cheapest coalition', async ({
      page,
    }) => {
      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('button.stamp:has-text("Start the term")').click();
      await expect(page.locator('.app')).toBeVisible();

      // 1. ADVISOR-01: Oval Office suggestion displays Play badge and pre-fills Budget package
      const playBadge = page.locator('[data-testid="advisor-play-badge"]').first();
      await expect(playBadge).toBeVisible();
      await expect(playBadge).toContainText('Play: Infrastructure push');

      await page.click('.card.option button:has-text("Open Budget")');

      // Verify Budget screen opened with "Infrastructure push" pre-selected
      const infraBtn = page.locator('button.pack:has-text("Infrastructure push")');
      await expect(infraBtn).toHaveAttribute('aria-pressed', 'true');

      // 2. ADVISOR-03: Budget screen shows live Household Persona and Switch button
      const personaLabel = page.locator('[data-testid="budget-household-persona"]');
      await expect(personaLabel).toHaveText('Rust Belt Manufacturing Family · OH');

      await page.click('[data-testid="budget-switch-household-btn"]');
      const householdModal = page.locator('[data-testid="household-modal"]');
      await expect(householdModal).toBeVisible();

      await page.click('[data-testid="preset-tab-sun_belt_retiree"]');
      await page.click('button[aria-label="Close household dialog"]');
      await expect(householdModal).toBeHidden();

      await expect(personaLabel).toHaveText('Sun Belt Retiree · FL');

      // Audit Budget screen accessibility & screenshot
      const budgetAxe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(
        budgetAxe.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        ),
      ).toEqual([]);
      await page.screenshot({
        path: `test-results/phase22-budget-${vp.width}x${vp.height}.png`,
      });

      // 3. ADVISOR-02: Navigate to Congress and click Auto-whip
      await page.click('nav button:has-text("Congress")');
      const autoWhipBtn = page.locator('[data-testid="auto-whip-btn"]');
      await expect(autoWhipBtn).toBeVisible();
      await expect(autoWhipBtn).toContainText('Auto-whip (2 deals, 25 clout)');

      await page.screenshot({
        path: `test-results/phase22-congress-before-${vp.width}x${vp.height}.png`,
      });

      await autoWhipBtn.click();

      // House tally reaches 218 of 218 and the 2 cheapest deals are selected
      await expect(page.locator('.chamber').first()).toContainText('218 of 218');
      const selectedDeals = page.locator('.card.deal button.btn:has-text("Done")');
      await expect(selectedDeals).toHaveCount(2);

      const congressAxe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(
        congressAxe.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        ),
      ).toEqual([]);
      await page.screenshot({
        path: `test-results/phase22-congress-after-${vp.width}x${vp.height}.png`,
      });
    });
  });
}
