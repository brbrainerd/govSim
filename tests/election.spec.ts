import { expect, test } from '@playwright/test';

test.describe('Election night, retry turn 16, and EndScreen E2E (ELC-01..ELC-05)', () => {
  test('advances to Turn 16, tests election reveal, skip, retry, and end screen flow', async ({ page }) => {
    // 1. Start new game as Democrat
    await page.goto('/');
    await expect(page.locator('.newgame')).toBeVisible();
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("START THE TERM")').click();
    await expect(page.locator('.app')).toBeVisible();

    // 2. Advance through the first 15 turns to reach Turn 16 (Year 4 Fall)
    let currentTurn = 1;
    while (currentTurn < 16) {
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

    // Confirm we are on Turn 16
    await expect(page.locator('.when')).toContainText('Turn 16 of 32');

    // 3. Advancing from Turn 16 launches Election Night reveal modal (ELC-01, ELC-02)
    await page.locator('button.stamp:has-text("Next turn")').click();

    const electionModal = page.locator('[data-testid="election-night-modal"]');
    await expect(electionModal).toBeVisible();
    await expect(electionModal.locator('.election-title')).toContainText('PRESIDENTIAL ELECTION DECISION NIGHT');
    await expect(electionModal.locator('[data-testid="live-player-ev"]')).toBeVisible();
    await expect(electionModal.locator('[data-testid="live-opponent-ev"]')).toBeVisible();

    // 4. Test Skip to Final Result (ELC-02)
    const skipBtn = page.locator('button.skip-btn:has-text("Skip to Final Result")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
    }

    // Result card is visible with certified results (ELC-03)
    const resultCard = page.locator('[data-testid="election-result-card"]');
    await expect(resultCard).toBeVisible();
    await expect(resultCard.locator('.cert-title')).toContainText('OFFICIAL CERTIFIED RESULT');
    await expect(resultCard.locator('.autopilot-comparison')).toContainText('Autopilot');
    await expect(resultCard.locator('.reasons-title')).toContainText('WHY THE ELECTION TURNED OUT THIS WAY');
    await expect(resultCard.locator('.reason-item')).not.toHaveCount(0);

    // 5. Test "Retry Turn 16" action (ELC-03)
    const retryBtn = page.locator('[data-testid="retry-turn16-btn"]');
    await expect(retryBtn).toBeVisible();
    await retryBtn.click();

    // Verify cleanly restored to Turn 16 Oval Office
    await expect(electionModal).not.toBeVisible();
    await expect(page.locator('.when')).toContainText('Turn 16 of 32');

    // 6. Advance from Turn 16 again and continue to result
    await page.locator('button.stamp:has-text("Next turn")').click();
    await expect(electionModal).toBeVisible();

    const skipBtn2 = page.locator('button.skip-btn:has-text("Skip to Final Result")');
    if (await skipBtn2.isVisible()) {
      await skipBtn2.click();
    }

    await expect(resultCard).toBeVisible();

    // 7. Click Continue button
    const continueBtn = page.locator('[data-testid="election-continue-btn"]');
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();
    await expect(electionModal).not.toBeVisible();

    // If won: on Turn 17 (or can continue). If lost: at EndScreen.
    // Verify either Turn 17 or EndScreen is reached
    const isEndScreen = await page.locator('[data-testid="end-screen"]').isVisible();
    if (isEndScreen) {
      // 8. EndScreen verification (ELC-05, GR-04)
      await expect(page.locator('.h:has-text("What is your lasting legacy?")')).toBeVisible();
      await expect(page.locator('[data-testid="headline-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="legacy-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="historian-verdict-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="verdict-tier"]')).toBeVisible();

      // Test Table toggle (Pitfall 22)
      const tableToggle = page.locator('[data-testid="toggle-table-btn"]');
      await tableToggle.click();
      await expect(page.locator('[data-testid="legacy-table"]')).toBeVisible();

      // Test Start New Presidency button
      const newPresBtn = page.locator('[data-testid="start-new-presidency-btn"]');
      await expect(newPresBtn).toBeVisible();
      await newPresBtn.click();
      await expect(page.locator('.newgame')).toBeVisible();
    } else {
      // Reelection was won: close turn report into Turn 17
      if (await page.locator('button.stamp:has-text("Continue term")').isVisible()) {
        await page.locator('button.stamp:has-text("Continue term")').click();
      }
      await expect(page.locator('.when')).toContainText('Turn 17 of 32');
    }
  });
});
