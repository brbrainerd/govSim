import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768, name: '1376x768' },
  { width: 1280, height: 720, name: '1280x720' },
];

test.describe('Foreign Policy & Sanctions Levers (FORPOL-01, FORPOL-02, FORPOL-03)', () => {
  test('budget screen foreign assistance slider & foreign aid myth card ticket', async ({ page }) => {
    mkdirSync('.planning/phases/14-foreign-policy-sanctions-levers/screenshots', { recursive: true });

    await page.goto('/');
    await expect(page.locator('.newgame')).toBeVisible();

    // Start game as D
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("Start the term")').click();
    await expect(page.locator('.app')).toBeVisible();

    // Navigate to Budget tab
    const budgetTab = page.locator('.tab:has-text("Budget")');
    await budgetTab.click();

    // Verify foreign assistance slider exists
    const aidSlider = page.locator('#foreign-assistance-slider');
    await expect(aidSlider).toBeVisible();
    await expect(page.locator('.foreign-assistance-row')).toContainText('<1%');

    // Click foreign aid myth ticket
    const mythTicket = page.locator('button.ticket:has-text("Myth? Cut foreign aid to balance it")');
    await expect(mythTicket).toBeVisible();
    await mythTicket.click();

    // Verify Myth Modal opens with foreign aid details
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.myth-stamp')).toHaveText('MYTH');
    await expect(modal.locator('.myth-quote')).toContainText('Cutting foreign aid would balance the federal budget.');
    await expect(modal.locator('.reality-title')).toHaveText('REALITY');
    await expect(modal.locator('.reality-summary')).toContainText('less than one percent');

    // Close the myth modal
    await modal.locator('button.close-link').click();
    await expect(modal).not.toBeVisible();
  });

  test('powers screen defense posture and targeted sanctions controls with a11y', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("Start the term")').click();
    await expect(page.locator('.app')).toBeVisible();

    // Advance to turn 2 to unlock Powers screen
    await page.locator('button.stamp:has-text("Next turn")').click();
    await page.locator('button.stamp:has-text("Continue term")').click();

    // Navigate to Your Powers screen
    const powersTab = page.locator('.tab:has-text("Your Powers")');
    await expect(powersTab).toBeVisible();
    await powersTab.click();

    // Check foreign policy section
    const forpolSection = page.locator('[data-testid="foreign-policy-section"]');
    await expect(forpolSection).toBeVisible();

    // Check Defense Readiness Posture
    const postureSelector = page.locator('[data-testid="defense-posture-selector"]');
    await expect(postureSelector).toBeVisible();

    // Switch to peacetime posture
    const peacetimeBtn = postureSelector.locator('button.posture-btn:has-text("Peacetime Drawdown")');
    await peacetimeBtn.click();
    await expect(peacetimeBtn).toHaveClass(/selected/);

    // Check targeted sanctions list
    const sanctionsList = page.locator('[data-testid="targeted-sanctions-list"]');
    await expect(sanctionsList).toBeVisible();

    // Check clout before enacting sanction
    const cloutNum = page.locator('button[aria-describedby="tip-clout"] .num');
    const startClout = parseInt((await cloutNum.textContent()) || '0', 10);
    expect(startClout).toBeGreaterThanOrEqual(100);

    // Enact Asset Freeze sanction
    const assetFreezeItem = sanctionsList.locator('.sanction-item:has-text("Targeted Financial Asset Freezes")');
    await expect(assetFreezeItem).toBeVisible();
    await expect(assetFreezeItem.locator('.statutory-basis')).toContainText('IEEPA');

    const toggleBtn = assetFreezeItem.locator('.sanction-toggle-btn');
    await toggleBtn.click();
    await expect(assetFreezeItem).toHaveClass(/active/);
    await expect(toggleBtn).toHaveText('✓ Sanction Active');

    // Clout should reflect deduction in draft (10 Clout)
    await expect(cloutNum).toHaveText(String(startClout - 10));

    // Run Axe a11y audit on the foreign policy section
    const axe = await new AxeBuilder({ page }).include('[data-testid="foreign-policy-section"]').analyze();
    const violations = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(violations, `Powers screen a11y violations: ${JSON.stringify(violations, null, 2)}`).toEqual([]);

    // Advance to next turn
    await page.locator('button.stamp:has-text("Next turn")').click();
    await page.locator('button.stamp:has-text("Continue term")').click();

    // If crisis fires on Turn 3, resolve it
    if (await page.locator('.breaking-ribbon').isVisible()) {
      await page.locator('button.stamp:has-text("DECIDE")').click();
    }

    // Verify Powers tab shows sanction active in state
    await powersTab.click();
    const assetFreezeAfter = page.locator('[data-testid="targeted-sanctions-list"] .sanction-item:has-text("Targeted Financial Asset Freezes")');
    await expect(assetFreezeAfter).toHaveClass(/active/);
  });

  for (const vp of VIEWPORTS) {
    test(`zero outer viewport scroll and clean layout at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('button.stamp:has-text("Start the term")').click();
      await expect(page.locator('.app')).toBeVisible();

      // Go to Budget
      await page.locator('.tab:has-text("Budget")').click();
      await expect(page.locator('#foreign-assistance-slider')).toBeVisible();

      await page.screenshot({
        path: `.planning/phases/14-foreign-policy-sanctions-levers/screenshots/budget-foreign-assistance-${vp.name}.png`,
      });

      // Verify zero viewport scroll for Budget
      let scrollCheck = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          windowHeight: window.innerHeight,
          windowWidth: window.innerWidth,
          scrollHeight: root.scrollHeight,
          scrollWidth: root.scrollWidth,
        };
      });
      expect(
        scrollCheck.scrollHeight,
        `Budget outer scroll height exceeded viewport on ${vp.name}: ${scrollCheck.scrollHeight} > ${scrollCheck.windowHeight}`,
      ).toBeLessThanOrEqual(scrollCheck.windowHeight + 1);

      // Advance to Turn 2 and go to Powers
      await page.locator('button.stamp:has-text("Next turn")').click();
      await page.locator('button.stamp:has-text("Continue term")').click();

      await page.locator('.tab:has-text("Your Powers")').click();
      await expect(page.locator('[data-testid="foreign-policy-section"]')).toBeVisible();

      // Scroll inside panel to show foreign policy section
      await page.locator('[data-testid="foreign-policy-section"]').scrollIntoViewIfNeeded();

      await page.screenshot({
        path: `.planning/phases/14-foreign-policy-sanctions-levers/screenshots/powers-foreign-policy-${vp.name}.png`,
      });

      // Verify zero outer viewport scroll for Powers
      scrollCheck = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          windowHeight: window.innerHeight,
          windowWidth: window.innerWidth,
          scrollHeight: root.scrollHeight,
          scrollWidth: root.scrollWidth,
        };
      });
      expect(
        scrollCheck.scrollHeight,
        `Powers outer scroll height exceeded viewport on ${vp.name}: ${scrollCheck.scrollHeight} > ${scrollCheck.windowHeight}`,
      ).toBeLessThanOrEqual(scrollCheck.windowHeight + 1);
    });
  }
});
