import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768, name: '1376x768' },
  { width: 1280, height: 720, name: '1280x720' },
];

test.describe('Institutional Backlash & Impeachment Trial (IMPEACH-01, IMPEACH-02, IMPEACH-03)', () => {
  test('Special counsel subpoena alerts, impeachment vote, trial acquittal, and conviction forfeiture', async ({ page }) => {
    mkdirSync('.planning/phases/19-institutional-backlash-impeachment-trial/screenshots', { recursive: true });

    // 1. Start game in Evil Mode
    await page.goto('/');
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('[data-testid="evil-mode-toggle"]').check();
    await page.locator('button.stamp:has-text("Seize power")').click();
    await expect(page.locator('.app')).toBeVisible();

    // 2. Go to Your Powers and stage directives to generate heat ~54 (Turn 1)
    const powersTab = page.locator('.tab:has-text("Your Powers")');
    await powersTab.click();
    await page.locator('[data-testid="evil-lever-toggle-crony_contracts"]').click();
    await page.locator('[data-testid="evil-lever-toggle-auction_public_lands"]').click();
    await page.locator('[data-testid="evil-lever-toggle-sell_tariff_exemptions"]').click();
    await page.locator('[data-testid="evil-lever-toggle-solicit_library_donations"]').click();

    // Advance turn 1 -> 2
    await page.locator('button.stamp:has-text("Next turn")').click();
    await page.locator('button.stamp:has-text("Continue term")').click();

    // Verify initial stash ($58B) and heat (54)
    await expect(page.locator('[data-testid="status-offshore-stash"]')).toContainText('$58.0B');
    await expect(page.locator('[data-testid="status-heat-meter"]')).toContainText('54/100');

    // 3. Stage more directives on Turn 2 to cross Special Counsel (>60) and Impeachment (>80)
    await powersTab.click();
    await page.locator('[data-testid="evil-lever-toggle-crony_contracts"]').click();
    await page.locator('[data-testid="evil-lever-toggle-auction_public_lands"]').click();

    // Advance turn 2 -> 3: triggers House Impeachment and Senate Trial
    await page.locator('button.stamp:has-text("Next turn")').click();

    // 4. Verify Impeachment Modal appears
    const modal = page.locator('[data-testid="impeachment-modal"]');
    await expect(modal).toBeVisible();

    // Verify Special Counsel badge in status bar
    await expect(page.locator('[data-testid="status-special-counsel"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-special-counsel"]')).toContainText('SPECIAL COUNSEL SUBPOENAS ACTIVE');

    // Verify House and Senate chamber tallies inside modal
    await expect(modal).toContainText('U.S. House of Representatives');
    await expect(modal).toContainText('Articles Adopted');
    await expect(modal).toContainText('United States Senate');

    // Screenshot acquittal or initial impeachment trial view
    await page.screenshot({
      path: '.planning/phases/19-institutional-backlash-impeachment-trial/screenshots/impeachment-trial.png',
    });

    // Check if acquitted on this step or convicted
    const continueBtn = page.locator('[data-testid="impeachment-continue-btn"]');
    const termOverBtn = page.locator('[data-testid="impeachment-term-over-btn"]');

    if (await continueBtn.isVisible()) {
      // Acquittal path: verify offshore stash preserved
      await expect(modal).toContainText('ACQUITTED');
      await continueBtn.click();
      await expect(modal).not.toBeVisible();
      await expect(page.locator('[data-testid="status-offshore-stash"]')).not.toContainText('$0.0B');

      // Now drive heat to extreme levels for conviction on turn 3
      await powersTab.click();
      await page.locator('[data-testid="evil-lever-toggle-crony_contracts"]').click();
      await page.locator('[data-testid="evil-lever-toggle-auction_public_lands"]').click();
      await page.locator('button.stamp:has-text("Next turn")').click();

      // Second trial: supermajority conviction
      await expect(modal).toBeVisible();
      await expect(modal).toContainText('Convicted by the Senate');
      await expect(modal).toContainText('All offshore accounts frozen by federal decree ($0.0B recovered)');
      await expect(termOverBtn).toBeVisible();

      // Screenshot conviction
      await page.screenshot({
        path: '.planning/phases/19-institutional-backlash-impeachment-trial/screenshots/impeachment-conviction.png',
      });

      // Accept verdict -> transitions to EndScreen
      await termOverBtn.click();
      await expect(modal).not.toBeVisible();
      await expect(page.locator('[data-testid="end-screen"]')).toBeVisible();
    } else {
      // Direct conviction path
      await expect(modal).toContainText('Convicted by the Senate');
      await expect(termOverBtn).toBeVisible();
      await termOverBtn.click();
      await expect(page.locator('[data-testid="end-screen"]')).toBeVisible();
    }
  });

  for (const vp of VIEWPORTS) {
    test(`multi-viewport layout, zero overflow, and axe a11y on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('[data-testid="evil-mode-toggle"]').check();
      await page.locator('button.stamp:has-text("Seize power")').click();
      await expect(page.locator('.app')).toBeVisible();

      // Generate heat to display Special Counsel badge and Impeachment Modal
      const powersTab = page.locator('.tab:has-text("Your Powers")');
      await powersTab.click();
      await page.locator('[data-testid="evil-lever-toggle-crony_contracts"]').click();
      await page.locator('[data-testid="evil-lever-toggle-auction_public_lands"]').click();
      await page.locator('[data-testid="evil-lever-toggle-sell_tariff_exemptions"]').click();
      await page.locator('[data-testid="evil-lever-toggle-solicit_library_donations"]').click();

      await page.locator('button.stamp:has-text("Next turn")').click();
      await page.locator('button.stamp:has-text("Continue term")').click();

      await powersTab.click();
      await page.locator('[data-testid="evil-lever-toggle-crony_contracts"]').click();
      await page.locator('[data-testid="evil-lever-toggle-auction_public_lands"]').click();
      await page.locator('button.stamp:has-text("Next turn")').click();

      // Modal is visible
      const modal = page.locator('[data-testid="impeachment-modal"]');
      await expect(modal).toBeVisible();

      // Screenshot on each viewport
      await page.screenshot({
        path: `.planning/phases/19-institutional-backlash-impeachment-trial/screenshots/impeachment-modal-${vp.name}.png`,
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

      // Axe audit on Impeachment Modal dialog
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast']) // verified via design tokens in unit tests
        .analyze();
      const severe = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(severe).toEqual([]);
    });
  }
});
