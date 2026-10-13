import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VIEWPORTS = [
  { width: 1376, height: 768 },
  { width: 1280, height: 720 },
];

for (const vp of VIEWPORTS) {
  test.describe(`Replayable Starting Scenarios (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: vp });

    test('SCEN-01 & SCEN-02: selects 70s Stagflation Shock at New Game and surfaces scenario briefing and initial macro shock on Oval Office', async ({
      page,
    }) => {
      await page.goto('/');

      // 1. Verify all 4 scenario cards are visible on New Game
      await expect(page.locator('[data-testid="scenario-card-standard_2026"]')).toBeVisible();
      await expect(page.locator('[data-testid="scenario-card-stagflation_shock"]')).toBeVisible();
      await expect(page.locator('[data-testid="scenario-card-debt_brinkmanship"]')).toBeVisible();
      await expect(page.locator('[data-testid="scenario-card-global_trade_war"]')).toBeVisible();

      // Select party and "70s Stagflation Shock"
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('[data-testid="scenario-card-stagflation_shock"]').click();

      const preview = page.locator('[data-testid="newgame-scenario-preview"]');
      await expect(preview).toContainText('70s Stagflation Shock');
      await expect(preview).toContainText('High prices and weak hiring squeeze families on day one.');

      const newGameAxe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(
        newGameAxe.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        ),
      ).toEqual([]);
      await page.screenshot({
        path: `test-results/phase24-newgame-scenario-${vp.width}x${vp.height}.png`,
      });

      // Start the term
      await page.locator('button.stamp:has-text("Start the term")').click();
      await expect(page.locator('.app')).toBeVisible();

      // 2. Verify Oval Office displays scenario badge and high inflation / unemployment briefing
      const scenBadge = page.locator('[data-testid="oval-scenario-badge"]');
      await expect(scenBadge).toBeVisible();
      await expect(scenBadge).toHaveText('70s Stagflation Shock');

      // In stagflation_shock, inflation starts at 6.2% (>= 3.5%), so Oval Office briefing triggers "High living costs"
      await expect(page.locator('.card.info b').first()).toHaveText('High living costs');
      await expect(page.locator('.tiles')).toContainText('6.2%');

      const ovalAxe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(
        ovalAxe.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        ),
      ).toEqual([]);
      await page.screenshot({
        path: `test-results/phase24-oval-stagflation-${vp.width}x${vp.height}.png`,
      });
    });
  });
}
