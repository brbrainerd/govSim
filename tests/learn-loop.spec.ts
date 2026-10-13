import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768, name: '1376x768' },
  { width: 1280, height: 720, name: '1280x720' },
];

test.describe('Phase 21: Complete Learn Loop & Interactive Explainers (LEARN-01..03)', () => {
  test('Oval Office, Economy, Budget, and Trade Learn strips & suggestion modal triggers', async ({ page }) => {
    mkdirSync('.planning/phases/21-complete-learn-loop-explainers/screenshots', { recursive: true });

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('button.stamp:has-text("Start the term")').click();
      await expect(page.locator('.app')).toBeVisible();

      // 1. Oval Office: How it works explainer (+1 Clout curiosity bonus)
      const howBtn = page.locator('[data-testid="how-it-works-btn"]');
      await expect(howBtn).toBeEnabled();
      await howBtn.click();

      const explainerModal = page.locator('[data-testid="explainer-modal"]');
      await expect(explainerModal).toBeVisible();
      await expect(explainerModal).toContainText('How the Presidency works');
      await expect(page.locator('[data-testid="explainer-got-it-btn"]')).toContainText('+1 CLOUT');

      const axeExplainer = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const seriousExplainer = axeExplainer.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(seriousExplainer).toEqual([]);

      await page.screenshot({
        path: `.planning/phases/21-complete-learn-loop-explainers/screenshots/oval-explainer-${vp.name}.png`,
      });

      await page.locator('[data-testid="explainer-got-it-btn"]').click();
      await expect(explainerModal).toHaveCount(0);

      // 2. Oval Office Chief of Staff "Find out" suggestion button opens MythModal (LEARN-03)
      const findOutBtn = page.locator('.card.option button.btn:has-text("Find out")');
      await expect(findOutBtn).toBeVisible();
      await findOutBtn.click();
      await expect(page.locator('.myth-modal-content')).toBeVisible();
      await page.locator('.myth-modal-content .close-link').click();
      await expect(page.locator('.myth-modal-content')).toHaveCount(0);

      // 3. Economy screen: How it works + supply_side_taxes myth + Pressure the Fed
      await page.locator('nav button:has-text("Economy")').click();
      await expect(page.locator('[data-testid="how-it-works-btn"]')).toBeEnabled();
      await page.locator('[data-testid="how-it-works-btn"]').click();
      await expect(explainerModal).toContainText('How the economy works');
      await page.locator('[data-testid="explainer-got-it-btn"]').click();

      const taxMythBtn = page.locator('button.ticket:has-text("Myth? Lower taxes boost growth?")');
      await expect(taxMythBtn).toBeEnabled();
      await taxMythBtn.click();
      await expect(page.locator('.myth-modal-content')).toContainText('Cutting tax rates always grows the economy');
      await page.locator('.myth-modal-content .close-link').click();

      // 4. Budget screen: How a budget becomes law explainer
      await page.locator('nav button:has-text("Budget")').click();
      await expect(page.locator('[data-testid="how-it-works-btn"]')).toBeEnabled();
      await page.locator('[data-testid="how-it-works-btn"]').click();
      await expect(explainerModal).toContainText('How a budget becomes law');
      await page.locator('[data-testid="explainer-got-it-btn"]').click();

      // Advance to Turn 2 so Trade & Tariffs unlocks in the rail
      await page.locator('button:has-text("Next turn")').click();
      await page.locator('button:has-text("Continue term")').click();
      const crisisClose = page.locator('[aria-label="Close modal"]');
      if (await crisisClose.isVisible()) {
        await crisisClose.click();
      }

      // 5. Trade screen: Learn strip with explainer and trade_deficits myth (LEARN-02)
      await page.locator('nav button:has-text("Trade")').click();
      await expect(page.locator('[data-testid="how-it-works-btn"]')).toBeVisible();
      await page.locator('[data-testid="how-it-works-btn"]').click();
      await expect(explainerModal).toContainText('How tariffs and trade work');
      await page.locator('[data-testid="explainer-got-it-btn"]').click();

      const tradeMythBtn = page.locator('button.ticket:has-text("Myth? Foreign nations pay tariffs?")');
      await expect(tradeMythBtn).toBeVisible();
      await tradeMythBtn.click();
      await expect(page.locator('.myth-modal-content')).toContainText('Foreign states pay the tariffs');

      await page.screenshot({
        path: `.planning/phases/21-complete-learn-loop-explainers/screenshots/trade-myth-${vp.name}.png`,
      });
      await page.locator('.myth-modal-content .close-link').click();

      // Clear localStorage before next viewport loop
      await page.evaluate(() => localStorage.clear());
    }
  });
});
