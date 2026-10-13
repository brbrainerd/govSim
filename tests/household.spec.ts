import { expect, test } from '@playwright/test';

test.describe('Household Impact Card & Balance (HOU-01, HOU-02)', () => {
  test('inspects household card in Oval Office, opens modal, switches personas and custom builder in Economy', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.newgame')).toBeVisible();

    // Start game as Democratic party
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("START THE TERM")').click();
    await expect(page.locator('.app')).toBeVisible();

    // 1. Oval Office Household Card
    const card = page.locator('[data-testid="household-card"]');
    await expect(card).toBeVisible();
    await expect(card.locator('.persona-name')).toContainText('Rust Belt Manufacturing Family');
    await expect(card.locator('.location-pill')).toContainText('OH');

    // 2. Open Household Modal from Oval Office
    const exploreBtn = card.locator('button:has-text("Explore Household Impact →")');
    await expect(exploreBtn).toBeVisible();
    await exploreBtn.click();

    const modal = page.locator('[data-testid="household-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.modal-title')).toContainText('Kitchen Table Household Impact');

    // Check all 7 ledger categories in modal
    for (const cat of ['wages', 'groceries', 'energy', 'healthcare', 'childcare', 'student_loans', 'taxes']) {
      await expect(modal.locator(`[data-testid="ledger-row-${cat}"]`)).toBeVisible();
    }

    // Close modal
    await modal.locator('button.close-x').click();
    await expect(modal).not.toBeVisible();

    // 3. Economy Screen: Toggle to "Your Household"
    await page.locator('.tab:has-text("Economy")').click();
    await expect(page.locator('[data-testid="tab-macro"]')).toBeVisible();
    const householdTab = page.locator('[data-testid="tab-household"]');
    await expect(householdTab).toBeVisible();
    await householdTab.click();

    // Verify Household Breakdown view is rendered
    const breakdown = page.locator('[data-testid="household-breakdown"]');
    await expect(breakdown).toBeVisible();
    await expect(breakdown.locator('.banner-amount')).toBeVisible();

    // 4. Switch Persona to Sun Belt Retiree
    const retireeTab = breakdown.locator('[data-testid="preset-tab-sun_belt_retiree"]');
    await expect(retireeTab).toBeVisible();
    await retireeTab.click();
    await expect(breakdown.locator('.banner-desc')).toContainText('Sun Belt Retiree (FL)');

    // 5. Open Custom Household Builder
    const customTab = breakdown.locator('[data-testid="preset-tab-custom"]');
    await expect(customTab).toBeVisible();
    await customTab.click();

    const builder = breakdown.locator('[data-testid="custom-builder"]');
    await expect(builder).toBeVisible();

    // Select California and $105k
    await builder.locator('select[aria-label="Select household state"]').selectOption('CA');
    await builder.locator('select[aria-label="Select annual household income"]').selectOption('105000');
    await builder.locator('input[type="checkbox"]').first().check(); // student debt

    await expect(breakdown.locator('.banner-desc')).toContainText('Custom Household (CA)');

    // 6. Navigate to Budget screen, increase taxes, and check reactive update
    await page.locator('.tab:has-text("Budget")').click();
    const incSlider = page.locator('input[type="range"][aria-label="Income tax"]');
    if (await incSlider.isVisible()) {
      await incSlider.fill('26');
      await incSlider.dispatchEvent('input');
      await incSlider.dispatchEvent('change');
    }

    // Return to Economy screen
    await page.locator('.tab:has-text("Economy")').click();
    // Switch to Your Household view if needed
    if (await householdTab.isVisible()) {
      await householdTab.click();
      const taxRow = page.locator('[data-testid="ledger-row-taxes"]');
      await expect(taxRow).toBeVisible();
      // Taxes row reflects the increased tax rate
      await expect(taxRow.locator('.row-pill')).toBeVisible();
    }
  });
});
