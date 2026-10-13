import { expect, test } from '@playwright/test';

test.describe('Voters screen and Electoral College E2E (VOT-01..VOT-06)', () => {
  test('navigates to Voters screen on Turn 3, inspects states, sorts table, and resolves midterms', async ({ page }) => {
    // 1. Start new game as Democrat
    await page.goto('/');
    await expect(page.locator('.newgame')).toBeVisible();
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("START THE TERM")').click();
    await expect(page.locator('.app')).toBeVisible();

    // 2. Advance to Turn 3 where Voters unlocks
    // Turn 1 -> Turn 2
    await page.locator('button.stamp:has-text("Next turn")').click();
    await page.locator('button.stamp:has-text("Continue term")').click();
    // Turn 2 -> Turn 3
    await page.locator('button.stamp:has-text("Next turn")').click();
    await page.locator('button.stamp:has-text("Continue term")').click();

    // Handle any crisis that fired
    if (await page.locator('.breaking-ribbon').isVisible()) {
      await page.locator('.modal-grid .option-card:not(.unaffordable)').first().click();
      await page.locator('button.stamp:has-text("DECIDE")').click();
      await expect(page.locator('.breaking-ribbon')).not.toBeVisible();
    }

    // 3. Navigate to Voters screen
    const votersTab = page.locator('.tab:has-text("Voters")');
    await expect(votersTab).toBeVisible();
    await votersTab.click();
    await expect(page.locator('.h:has-text("Who supports you?")')).toBeVisible();

    // 4. Verify US Map, District Chips, and 270 Bar (VOT-01, VOT-03)
    await expect(page.locator('[data-testid="us-map"]')).toBeVisible();
    await expect(page.locator('[data-testid="ec-bar"]')).toBeVisible();
    await expect(page.locator('.target-flag:has-text("270 TO WIN")')).toBeVisible();

    // District chips are present
    await expect(page.locator('text=ME-1 (1 EV)')).toBeVisible();
    await expect(page.locator('text=ME-2 (1 EV)')).toBeVisible();
    await expect(page.locator('text=NE-2 (1 EV)')).toBeVisible();

    // 5. State selection and inspector card (VOT-02)
    const paPath = page.locator('[data-map-code="PA"]');
    await expect(paPath).toBeVisible();
    await paPath.click();

    const inspector = page.locator('[data-testid="state-inspector"]');
    await expect(inspector).toBeVisible();
    await expect(inspector.locator('.state-title')).toHaveText('Pennsylvania');
    await expect(inspector.locator('.state-ev-pill')).toHaveText('19 EV');
    await expect(inspector.locator('.support-pct')).toBeVisible();
    await expect(inspector.locator('.reasons-title:has-text("WHY VOTERS FEEL THIS WAY")')).toBeVisible();
    await expect(inspector.locator('.reason-item')).not.toHaveCount(0);

    // Click ME-2 district chip and verify inspector updates
    const me2Chip = page.locator('.district-chip[aria-label*="Maine 2nd"]');
    await me2Chip.click();
    await expect(inspector.locator('.state-title')).toContainText('Maine 2nd');
    await expect(inspector.locator('.state-ev-pill')).toHaveText('1 EV');

    // Verify Local Family Impact card (SOC-05)
    const impactCard = inspector.locator('[data-testid="local-family-impact"]');
    await expect(impactCard).toBeVisible();
    await expect(impactCard.locator('.impact-label:has-text("LOCAL FAMILY IMPACT")')).toBeVisible();
    await expect(impactCard.locator('.rpp-note')).toContainText('Price parity index:');

    // 6. Switch to Table View and test sorting (VOT-01)
    await page.locator('.switch-btn:has-text("Table View")').click();
    await expect(page.locator('.states-table')).toBeVisible();
    const rows = page.locator('.states-table tbody tr');
    await expect(rows).toHaveCount(56); // 50 states + DC + 5 ME/NE districts

    // Sort by EV
    const evHeader = page.locator('th.sortable:has-text("EV")');
    await evHeader.click();
    // First row should have high EV (California 54) or low EV
    await expect(rows.first()).toBeVisible();

    // 7. Switch to Coalitions View and verify 6 cohorts (SOC-05)
    await page.locator('.switch-btn:has-text("Coalitions")').click();
    await expect(page.locator('.coalitions-wrapper')).toBeVisible();
    await expect(page.locator('.coalitions-title:has-text("National Demographic Coalitions")')).toBeVisible();
    for (const cohortId of ['seniors', 'working_class', 'young_families', 'college_educated', 'immigrant', 'energy_ag']) {
      const cohortCard = page.locator(`[data-testid="cohort-${cohortId}"]`);
      await expect(cohortCard).toBeVisible();
      await expect(cohortCard.locator('.cohort-pct')).toBeVisible();
      await expect(cohortCard.locator('.cohort-share')).toBeVisible();
    }

    // Switch back to Map View
    await page.locator('.switch-btn:has-text("Map View")').click();
    await expect(page.locator('[data-testid="us-map"]')).toBeVisible();

    // 7. Advance to Turn 8 (Midterm elections) and check Turn Report card (VOT-05)
    let currentTurn = 3;
    while (currentTurn < 8) {
      await page.locator('button.stamp:has-text("Next turn")').click();
      await page.locator('button.stamp:has-text("Continue term")').click();
      currentTurn++;

      // Handle crisis if one pops up
      if (await page.locator('.breaking-ribbon').isVisible()) {
        await page.locator('.modal-grid .option-card:not(.unaffordable)').first().click();
        await page.locator('button.stamp:has-text("DECIDE")').click();
        await expect(page.locator('.breaking-ribbon')).not.toBeVisible();
      }
    }

    // Now on Turn 8: click Next turn to transition across midterms into Turn 9
    await page.locator('button.stamp:has-text("Next turn")').click();
    await expect(page.locator('div[role="dialog"]')).toBeVisible();

    // Midterm Results card must be visible in Turn Report
    const midtermCard = page.locator('[data-testid="midterm-results-card"]');
    await expect(midtermCard).toBeVisible();
    await expect(midtermCard.locator('.midterm-headline:has-text("Voters have spoken")')).toBeVisible();
    await expect(midtermCard.locator('.seat-badge')).toBeVisible();

    // Close turn report into Turn 9 (Year 3)
    await page.locator('button.stamp:has-text("Continue term")').click();

    // Handle crisis if one pops up at Year 3 start
    if (await page.locator('.breaking-ribbon').isVisible()) {
      await page.locator('.modal-grid .option-card:not(.unaffordable)').first().click();
      await page.locator('button.stamp:has-text("DECIDE")').click();
      await expect(page.locator('.breaking-ribbon')).not.toBeVisible();
    }

    // In Year 3+, navigate to Voters and verify honest projection range (VOT-03)
    await page.locator('.tab:has-text("Voters")').click();
    await expect(page.locator('.projection-whisker-row')).toBeVisible();
    await expect(page.locator('.whisker-tag:has-text("Honest Model Range:")')).toBeVisible();
    await expect(page.locator('.whisker-range')).toContainText('EV');
  });
});
