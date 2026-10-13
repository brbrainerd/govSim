import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768, name: '1376x768' },
  { width: 1280, height: 720, name: '1280x720' },
];

test.describe('International Trade & Tariffs Screen (TRADE-01, TRADE-02, TRADE-03)', () => {
  test('navigation, lock status on turn 1, unlock on turn 2', async ({ page }) => {
    mkdirSync('.planning/phases/16-international-trade-tariffs-screen/screenshots', { recursive: true });

    await page.goto('/');
    await expect(page.locator('.newgame')).toBeVisible();

    // Start game as D
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("Start the term")').click();
    await expect(page.locator('.app')).toBeVisible();

    // On Turn 1, Trade & Tariffs is locked
    const tradeTab = page.locator('.tab:has-text("Trade & Tariffs")');
    await expect(tradeTab).toBeVisible();
    await expect(tradeTab).toBeDisabled();
    await expect(tradeTab.locator('.lock')).toHaveText('Turn 2');

    // Advance to turn 2
    await page.locator('button.stamp:has-text("Next turn")').click();
    await page.locator('button.stamp:has-text("Continue term")').click();

    // On Turn 2, Trade & Tariffs is unlocked
    await expect(tradeTab).toBeEnabled();
    await tradeTab.click();

    // Verify Trade screen renders
    await expect(page.locator('.h:has-text("How should America trade with the world?")')).toBeVisible();
    await expect(page.locator('.metrics-strip')).toBeVisible();
    await expect(page.locator('.tariffs-section')).toBeVisible();
    await expect(page.locator('.agreements-section')).toBeVisible();
    await expect(page.locator('.exposure-section')).toBeVisible();
  });

  test('interactive sector tariffs, bilateral accords, and state exposure table with a11y', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("Start the term")').click();
    await expect(page.locator('.app')).toBeVisible();

    // Advance to turn 2
    await page.locator('button.stamp:has-text("Next turn")').click();
    await page.locator('button.stamp:has-text("Continue term")').click();

    const tradeTab = page.locator('.tab:has-text("Trade & Tariffs")');
    await tradeTab.click();

    // 1. Verify statutory authorities badges (TRADE-01)
    await expect(page.locator('.statutory-badge:has-text("Section 301, Trade Act of 1974")').first()).toBeVisible();
    await expect(page.locator('.statutory-badge:has-text("Section 232, Trade Expansion Act of 1962")')).toBeVisible();

    // Verify initial count: 0 of 3 active in force
    await expect(page.locator('.tariff-status-count')).toContainText('0 of 3');

    // 2. Toggle Advanced Semiconductors tariff (chips)
    const chipsBtn = page.locator('[data-testid="toggle-sector-chips"]');
    await expect(chipsBtn).toHaveText('Enact Sector Tariff');
    await chipsBtn.click();
    await expect(chipsBtn).toHaveText('Repeal Sector Tariff');
    await expect(page.locator('.tariff-status-count')).toContainText('1 of 3');

    // Verify metrics updated (price pass-through and retaliation increased)
    await expect(page.locator('.metric-card:has-text("Price Pass-Through") .num')).toContainText('+');

    // 3. Bilateral Agreements (TRADE-02)
    await expect(page.locator('.agreement-status-count')).toContainText('0 ratified accords');
    const americasBtn = page.locator('[data-testid="toggle-agreement-americas"]');
    await expect(americasBtn).toContainText('Ratify Agreement');
    await americasBtn.click();
    await expect(americasBtn).toHaveText('Withdraw Accord');
    await expect(page.locator('.agreement-status-count')).toContainText('1 ratified accords');

    // 4. State Export Exposure Table (TRADE-03)
    const table = page.locator('table.exposure-table');
    await expect(table).toBeVisible();
    await expect(table.locator('tbody tr')).toHaveCount(10);
    await expect(table).toContainText('Iowa (Soybeans & Corn)');
    await expect(table).toContainText('Illinois (Grain & Ag Machinery)');

    // 5. Run a11y audit
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // color palette audited separately via design tokens
      .analyze();

    const seriousViolations = axeResults.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(seriousViolations).toEqual([]);
  });

  for (const vp of VIEWPORTS) {
    test(`zero outer viewport scroll and clean layout at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('button.stamp:has-text("Start the term")').click();
      await expect(page.locator('.app')).toBeVisible();

      // Advance to Turn 2 and go to Trade
      await page.locator('button.stamp:has-text("Next turn")').click();
      await page.locator('button.stamp:has-text("Continue term")').click();

      await page.locator('.tab:has-text("Trade & Tariffs")').click();
      await expect(page.locator('.tariffs-section')).toBeVisible();

      // Screenshot 1: Trade screen top (metrics + sector tariffs)
      await page.screenshot({
        path: `.planning/phases/16-international-trade-tariffs-screen/screenshots/trade-top-${vp.name}.png`,
      });

      // Scroll inside the panel to show bilateral agreements and state exposure matrix
      await page.locator('.exposure-section').scrollIntoViewIfNeeded();

      // Screenshot 2: Trade screen bottom (accords + state matrix)
      await page.screenshot({
        path: `.planning/phases/16-international-trade-tariffs-screen/screenshots/trade-matrix-${vp.name}.png`,
      });

      // Verify zero outer viewport scroll
      const scrollCheck = await page.evaluate(() => {
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
        `Trade outer scroll height exceeded viewport on ${vp.name}: ${scrollCheck.scrollHeight} > ${scrollCheck.windowHeight}`,
      ).toBeLessThanOrEqual(scrollCheck.windowHeight + 1);
    });
  }
});
