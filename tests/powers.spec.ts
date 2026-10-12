import { expect, test } from '@playwright/test';

test.describe('Your Powers screen and modals (PWR-01..PWR-07, OBS-07)', () => {
  test('civics myth modal awards clout and teaches institutional reality', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.newgame')).toBeVisible();

    // Start game as Democratic party
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("Start the term")').click();
    await expect(page.locator('.app')).toBeVisible();

    // Verify initial clout is 120
    const cloutNum = page.locator('button[aria-describedby="tip-clout"] .num');
    await expect(cloutNum).toHaveText('120');

    // Click gas prices myth ticket in Oval Office Learn strip
    const mythTicket = page.locator('button.ticket:has-text("Myth? Can you lower gas prices")');
    await expect(mythTicket).toBeVisible();
    await mythTicket.click();

    // Verify Myth Modal is visible
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.myth-stamp')).toHaveText('MYTH');
    await expect(modal.locator('.myth-quote')).toContainText('The President sets gas prices.');
    await expect(modal.locator('.reality-title')).toHaveText('REALITY');
    await expect(modal.locator('.flow-steps')).toBeVisible();
    await expect(modal.locator('.character-wrapper')).toBeVisible();

    // Verify first view reward button
    const gotItBtn = modal.locator('button.got-it-btn');
    await expect(gotItBtn).toContainText('GOT IT (+5 CLOUT)');
    await gotItBtn.click();
    await expect(modal).not.toBeVisible();

    // Clout should increase by 5
    await expect(cloutNum).toHaveText('125');
  });

  test('your powers screen allows signing executive orders and managing institutions', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("Start the term")').click();
    await expect(page.locator('.app')).toBeVisible();

    // Advance to Turn 2 to unlock Your Powers screen
    await page.locator('button.stamp:has-text("Next turn")').click();
    await page.locator('button.stamp:has-text("Continue term")').click();

    // Navigate to Your Powers screen
    const powersTab = page.locator('.tab:has-text("Your Powers")');
    await expect(powersTab).toBeVisible();
    await expect(powersTab).not.toBeDisabled();
    await powersTab.click();

    // Verify screen structure
    await expect(page.locator('.h:has-text("What can you do without Congress?")')).toBeVisible();
    await expect(page.locator('.orders-grid')).toBeVisible();
    await expect(page.locator('.fed-card')).toBeVisible();
    await expect(page.locator('.court-card')).toBeVisible();

    // Select Federal hiring freeze order
    const hiringFreezeCard = page.locator('.order-card:has-text("Federal hiring freeze")');
    await hiringFreezeCard.click();
    await expect(hiringFreezeCard).toHaveClass(/selected/);

    // Verify preview card details
    const previewCard = page.locator('.preview-card');
    await expect(previewCard.locator('.preview-title')).toHaveText('Federal hiring freeze');
    await expect(previewCard.locator('.legal-basis')).toContainText('Civil Service Reform');

    // Sign the order
    const signBtn = page.locator('button.stamp-btn:has-text("SIGN ORDER")');
    await expect(signBtn).toBeVisible();
    await signBtn.click();

    // Card should now show Signing badge
    await expect(hiringFreezeCard.locator('.status-badge.signing')).toBeVisible();

    // Open speech modal
    await page.locator('.speech-dialog-link').click();
    const speechModal = page.locator('div[role="dialog"]');
    await expect(speechModal).toBeVisible();
    await expect(speechModal.locator('.title')).toHaveText('Bully Pulpit Address');

    // Deliver speech to General Public
    await speechModal.locator('.audience-card:has-text("General Public")').click();
    await speechModal.locator('button.deliver-btn').click();
    await expect(speechModal).not.toBeVisible();

    // Open Fed modal
    await page.locator('.fed-btn.secondary').click();
    const fedModal = page.locator('div[role="dialog"]');
    await expect(fedModal).toBeVisible();
    await expect(fedModal.locator('.title')).toHaveText('The Federal Reserve System');

    // Toggle rate pressure
    await fedModal.locator('input[type="checkbox"]').check();
    await fedModal.locator('button.confirm-btn').click();
    await expect(fedModal).not.toBeVisible();

    // Advance turn to resolve decisions
    await page.locator('button.stamp:has-text("Next turn")').click();
    await page.locator('button.stamp:has-text("Continue term")').click();

    // If crisis fires on Turn 3, resolve it first
    if (await page.locator('.breaking-ribbon').isVisible()) {
      await page.locator('button.stamp:has-text("DECIDE")').click();
    }

    // Order should now be active in force
    await powersTab.click();
    await expect(page.locator('.active-count')).toContainText('1 active');
    await expect(hiringFreezeCard.locator('.status-badge')).toBeVisible();
  });
});
