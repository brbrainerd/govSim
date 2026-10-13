import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768, name: '1376x768' },
  { width: 1280, height: 720, name: '1280x720' },
];

test.describe('Security Index & Macro Feedback Engine (SEC-01, SEC-02, SEC-03)', () => {
  for (const vp of VIEWPORTS) {
    test(`turn report card displays National Security and causal attribution (${vp.name})`, async ({ page }) => {
      mkdirSync('.planning/phases/15-security-index-macro-feedback-engine/screenshots', { recursive: true });
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto('/');
      await expect(page.locator('.newgame')).toBeVisible();

      // Start game as D
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('button.stamp:has-text("Start the term")').click();
      await expect(page.locator('.app')).toBeVisible();

      // Advance to turn 2 (Q1 report)
      await page.locator('button.stamp:has-text("Next turn")').click();
      const reportModal = page.locator('div[role="dialog"]');
      await expect(reportModal).toBeVisible();

      // Verify National Security row exists in table
      const secRowQ1 = reportModal.locator('.row:has-text("National Security")');
      await expect(secRowQ1).toBeVisible();
      await expect(secRowQ1.locator('.name')).toHaveText('National Security');
      await expect(secRowQ1.locator('.val')).toHaveText(/^\d{2}\.\d$/);

      // Continue to Turn 2
      await page.locator('button.stamp:has-text("Continue term")').click();
      await expect(reportModal).not.toBeVisible();

      // Navigate to Your Powers screen
      const powersTab = page.locator('.tab:has-text("Your Powers")');
      await expect(powersTab).toBeVisible();
      await powersTab.click();

      // Select Surge Readiness posture
      const postureSelector = page.locator('[data-testid="defense-posture-selector"]');
      await expect(postureSelector).toBeVisible();
      const surgeBtn = postureSelector.locator('button.posture-btn:has-text("Forward Surge")');
      await expect(surgeBtn).toBeVisible();
      await surgeBtn.click();
      await expect(surgeBtn).toHaveClass(/selected/);

      // Advance to turn 3 (Q2 report)
      await page.locator('button.stamp:has-text("Next turn")').click();
      await expect(reportModal).toBeVisible();

      // Verify National Security row moved up due to Defense posture
      const secRowQ2 = reportModal.locator('.row:has-text("National Security")');
      await expect(secRowQ2).toBeVisible();
      await expect(secRowQ2.locator('.val')).toHaveText(/^\d{2}\.\d$/);
      await expect(secRowQ2.locator('.badge')).toHaveClass(/up/);
      await expect(secRowQ2.locator('.badge')).toHaveClass(/positive/);
      await expect(secRowQ2.locator('.cause')).toHaveText('Defense readiness posture change');

      // Capture screenshot of Turn Report
      await page.screenshot({
        path: `.planning/phases/15-security-index-macro-feedback-engine/screenshots/turn-report-security-${vp.name}.png`,
        fullPage: true,
      });

      // Accessibility audit on Turn Report with National Security indicator
      const axe = await new AxeBuilder({ page })
        .include('.report-card')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const seriousOrCritical = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(seriousOrCritical).toHaveLength(0);
    });
  }
});
