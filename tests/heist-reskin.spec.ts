import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768, name: '1376x768' },
  { width: 1280, height: 720, name: '1280x720' },
];

test.describe('Satirical UI Reskin & Heist End Screens (UI-01, UI-02, UI-03)', () => {
  test.beforeAll(() => {
    mkdirSync('.planning/phases/20-satirical-ui-reskin-heist-screens/screenshots', { recursive: true });
  });

  for (const vp of VIEWPORTS) {
    test(`Oval Office Evil Reskin and Live Widgets layout on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // 1. Start Evil Mode game
      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('[data-testid="evil-mode-toggle"]').check();
      await page.locator('button.stamp:has-text("Seize power")').click();
      await expect(page.locator('.app')).toBeVisible();

      // Verify theme attribute applied to documentElement
      const themeAttr = await page.evaluate(() => document.documentElement.dataset.theme);
      expect(themeAttr).toBe('evil');

      // Verify Oval Office live widgets (UI-02)
      await expect(page.locator('[data-testid="oval-offshore-stash"]')).toBeVisible();
      await expect(page.locator('[data-testid="oval-offshore-stash"]')).toContainText('Offshore Stash');
      await expect(page.locator('[data-testid="evil-situation-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="evil-situation-card"]')).toContainText('KLEPTOCRATIC INTEL');
      await expect(page.locator('[data-testid="oval-heat-pill"]')).toContainText('Heat: 0/100');

      // Verify shortcut button routes to Your Powers
      const leversBtn = page.locator('[data-testid="goto-corrupt-levers-btn"]');
      await expect(leversBtn).toBeVisible();

      // Zero outer viewport scroll
      const overflow = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));
      expect(overflow.scrollHeight).toBeLessThanOrEqual(overflow.clientHeight + 1);

      // Screenshot Oval Office
      await page.screenshot({
        path: `.planning/phases/20-satirical-ui-reskin-heist-screens/screenshots/oval-evil-reskin-${vp.name}.png`,
      });

      // Accessibility audit
      const a11y = await new AxeBuilder({ page })
        .include('.app')
        .disableRules(['color-contrast']) // verified via design tokens in unit tests
        .analyze();
      expect(a11y.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
    });
  }

  test('Conviction Downfall EndScreen on Senate impeachment conviction (UI-03)', async ({ page }) => {
    await page.setViewportSize({ width: 1376, height: 768 });

    // 1. Start Evil Mode game
    await page.goto('/');
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('[data-testid="evil-mode-toggle"]').check();
    await page.locator('button.stamp:has-text("Seize power")').click();
    await expect(page.locator('.app')).toBeVisible();

    // 2. Drive heat over thresholds to trigger conviction
    const powersTab = page.locator('.tab:has-text("Your Powers")');
    await powersTab.click();
    await page.locator('[data-testid="evil-lever-toggle-crony_contracts"]').click();
    await page.locator('[data-testid="evil-lever-toggle-auction_public_lands"]').click();
    await page.locator('[data-testid="evil-lever-toggle-sell_tariff_exemptions"]').click();
    await page.locator('[data-testid="evil-lever-toggle-solicit_library_donations"]').click();

    // Advance turn 1 -> 2
    await page.locator('button.stamp:has-text("Next turn")').click();
    await page.locator('button.stamp:has-text("Continue term")').click();

    // Turn 2: stage more levers
    await powersTab.click();
    await page.locator('[data-testid="evil-lever-toggle-crony_contracts"]').click();
    await page.locator('[data-testid="evil-lever-toggle-auction_public_lands"]').click();

    // Advance turn 2 -> 3: triggers impeachment & trial
    await page.locator('button.stamp:has-text("Next turn")').click();

    const modal = page.locator('[data-testid="impeachment-modal"]');
    await expect(modal).toBeVisible();

    const continueBtn = page.locator('[data-testid="impeachment-continue-btn"]');
    const termOverBtn = page.locator('[data-testid="impeachment-term-over-btn"]');

    if (await continueBtn.isVisible()) {
      // Acquitted on trial 1: push heat further for trial 2 conviction
      await continueBtn.click();
      await powersTab.click();
      await page.locator('[data-testid="evil-lever-toggle-crony_contracts"]').click();
      await page.locator('[data-testid="evil-lever-toggle-auction_public_lands"]').click();
      await page.locator('button.stamp:has-text("Next turn")').click();
      await expect(modal).toBeVisible();
    }

    // Must be convicted
    await expect(modal).toContainText('Convicted by the Senate');
    await expect(termOverBtn).toBeVisible();
    await termOverBtn.click();

    // 3. Verify EndScreen in Conviction Downfall State
    const endScreen = page.locator('[data-testid="end-screen"]');
    await expect(endScreen).toBeVisible();
    await expect(endScreen).toContainText('KLEPTOCRATIC HEIST REVIEW');
    await expect(endScreen).toContainText('Term Terminated (Convicted)');
    await expect(page.locator('[data-testid="end-offshore-stash"]')).toContainText('$0.0B');
    await expect(page.locator('[data-testid="evil-score-card"]')).toContainText('Asset Seizure & Forfeiture');
    await expect(page.locator('[data-testid="verdict-tier"]')).toContainText('Disgraced Convict');
    await expect(page.locator('[data-testid="kleptocrat-epilogue"]')).toContainText('federal facility');

    // Test Extraction Ledger tab
    const extractionTab = page.locator('[data-testid="tab-extraction"]');
    await expect(extractionTab).toBeVisible();
    await extractionTab.click();
    const ledgerPanel = page.locator('[data-testid="extraction-ledger-panel"]');
    await expect(ledgerPanel).toBeVisible();
    await expect(ledgerPanel).toContainText('Kleptocratic Extraction Ledger');
    await expect(ledgerPanel.locator('.extraction-item')).not.toHaveCount(0);

    // Screenshot conviction downfall
    await page.screenshot({
      path: '.planning/phases/20-satirical-ui-reskin-heist-screens/screenshots/end-conviction-downfall-1376x768.png',
    });

    // Zero outer scroll
    const overflow = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }));
    expect(overflow.scrollHeight).toBeLessThanOrEqual(overflow.clientHeight + 1);

    // Accessibility audit
    const a11y = await new AxeBuilder({ page })
      .include('[data-testid="end-screen"]')
      .disableRules(['color-contrast'])
      .analyze();
    expect(a11y.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });

  test('Unconvicted Heist Victory EndScreen with Kleptocrat Tiers (UI-03)', async ({ page }) => {
    await page.setViewportSize({ width: 1376, height: 768 });

    // 1. Start Evil Mode game
    await page.goto('/');
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('[data-testid="evil-mode-toggle"]').check();
    await page.locator('button.stamp:has-text("Seize power")').click();
    await expect(page.locator('.app')).toBeVisible();

    // 2. Stage siphoning + suppression on Turn 1 to accumulate $40B stash, 0 heat, and low approval
    const powersTab = page.locator('.tab:has-text("Your Powers")');
    await powersTab.click();
    await page.locator('[data-testid="evil-lever-toggle-crony_contracts"]').click(); // +$15B
    await page.locator('[data-testid="evil-lever-toggle-auction_public_lands"]').click(); // +$25B
    await page.locator('[data-testid="evil-lever-toggle-fire_inspectors_general"]').click(); // -8 approval, -15 heat
    await page.locator('[data-testid="evil-lever-toggle-pressure_justice_department"]').click(); // -10 approval, -20 heat
    // Total stash = $40B, heat = 0, approval drops ~25 points to guarantee electoral defeat at turn 16

    // Advance turn 1 -> 2
    await page.locator('button.stamp:has-text("Next turn")').click();
    await page.locator('button.stamp:has-text("Continue term")').click();

    // Verify stash ($40.0B)
    await expect(page.locator('[data-testid="status-offshore-stash"]')).toContainText('$40.0B');

    // 3. Advance through term 1 to reach election at Turn 16
    let currentTurn = 2;
    while (currentTurn < 16) {
      await page.locator('button.stamp:has-text("Next turn")').click();
      if (await page.locator('button.stamp:has-text("Continue term")').isVisible()) {
        await page.locator('button.stamp:has-text("Continue term")').click();
      }
      currentTurn++;

      // Handle breaking crisis if needed
      if (await page.locator('.breaking-ribbon').isVisible()) {
        await page.locator('.modal-grid .option-card:not(.unaffordable)').first().click();
        await page.locator('button.stamp:has-text("DECIDE")').click();
        await expect(page.locator('.breaking-ribbon')).not.toBeVisible();
      }

      // Handle impeachment modal if heat triggered one
      if (await page.locator('[data-testid="impeachment-continue-btn"]').isVisible()) {
        await page.locator('[data-testid="impeachment-continue-btn"]').click();
      }
    }

    // Turn 16 -> trigger election
    await page.locator('button.stamp:has-text("Next turn")').click();

    const electionModal = page.locator('[data-testid="election-night-modal"]');
    await expect(electionModal).toBeVisible();

    const skipBtn = page.locator('button.skip-btn:has-text("Skip to Final Result")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
    }

    // Official result card is visible
    const resultCard = page.locator('[data-testid="election-result-card"]');
    await expect(resultCard).toBeVisible();

    // Click continue to presidential legacy
    const continueBtn = page.locator('[data-testid="election-continue-btn"]');
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    // Verify unconvicted heist EndScreen
    const endScreen = page.locator('[data-testid="end-screen"]');
    await expect(endScreen).toBeVisible();
    await expect(endScreen).toContainText('KLEPTOCRATIC HEIST REVIEW');
    await expect(page.locator('[data-testid="end-offshore-stash"]')).toContainText('$40.0B');
    await expect(page.locator('[data-testid="evil-score-card"]')).toContainText('Total Offshore Loot Siphoned');
    await expect(page.locator('[data-testid="verdict-tier"]')).toBeVisible();
    await expect(page.locator('[data-testid="kleptocrat-epilogue"]')).toBeVisible();

    // Screenshot unconvicted heist review across viewports
    await page.screenshot({
      path: '.planning/phases/20-satirical-ui-reskin-heist-screens/screenshots/end-heist-review-1376x768.png',
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.screenshot({
      path: '.planning/phases/20-satirical-ui-reskin-heist-screens/screenshots/end-heist-review-1280x720.png',
    });

    // Zero outer scroll on 1280x720
    const overflow = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }));
    expect(overflow.scrollHeight).toBeLessThanOrEqual(overflow.clientHeight + 1);

    // Accessibility audit
    const a11y = await new AxeBuilder({ page })
      .include('[data-testid="end-screen"]')
      .disableRules(['color-contrast'])
      .analyze();
    expect(a11y.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });
});

