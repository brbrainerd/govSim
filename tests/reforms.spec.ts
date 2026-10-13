import { expect, test } from '@playwright/test';

test.describe('Structural Government Reform & Amendments (REF-01..REF-04)', () => {
  test('filibuster rule reform flow, judicial reform, and amendment proposal in UI', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.newgame')).toBeVisible();

    // Start game as Democratic party
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("START THE TERM")').click();
    await expect(page.locator('.app')).toBeVisible();

    // 1. Congress: Senate Filibuster Reform (REF-01)
    const congressTab = page.locator('.tab:has-text("Congress")');
    await expect(congressTab).toBeVisible();
    await congressTab.click();

    const openFilibusterBtn = page.locator('[data-testid="open-filibuster-modal"]');
    await expect(openFilibusterBtn).toBeVisible();
    await expect(openFilibusterBtn).toContainText('60 votes');

    // Open Filibuster Modal
    await openFilibusterBtn.click();
    const filibusterModal = page.locator('[data-testid="filibuster-modal"]');
    await expect(filibusterModal).toBeVisible();

    // Select 55-Vote Cloture
    const fiftyFiveCard = page.locator('[data-testid="filibuster-rule-fifty_five_vote"]');
    await expect(fiftyFiveCard).toBeVisible();
    const enactBtn = fiftyFiveCard.locator('button:has-text("Enact")');
    await enactBtn.click();
    await expect(fiftyFiveCard.locator('.status-badge.staged')).toBeVisible();

    // Close filibuster modal
    await filibusterModal.locator('button.close-btn').click();
    await expect(filibusterModal).not.toBeVisible();
    await expect(openFilibusterBtn).toContainText('55 votes');

    // 2. Congress: Article V Amendment Modal (REF-04)
    const openAmendmentBtn = page.locator('[data-testid="open-amendment-modal"]');
    await expect(openAmendmentBtn).toBeVisible();
    await openAmendmentBtn.click();

    const amendmentModal = page.locator('[data-testid="amendment-modal"]');
    await expect(amendmentModal).toBeVisible();
    await expect(amendmentModal.locator('[data-testid="amendment-card-amendment_judicial_terms"]')).toBeVisible();
    await expect(amendmentModal.locator('[data-testid="amendment-card-amendment_campaign_finance"]')).toBeVisible();
    await expect(amendmentModal.locator('[data-testid="amendment-card-amendment_equal_rights"]')).toBeVisible();
    await expect(amendmentModal.locator('[data-testid="amendment-card-amendment_balanced_budget"]')).toBeVisible();

    // Close amendment modal
    await amendmentModal.locator('button.close-btn').click();
    await expect(amendmentModal).not.toBeVisible();

    // 3. Advance to Turn 2 to access Your Powers
    await page.locator('button.stamp:has-text("Next turn")').click();
    await page.locator('button.stamp:has-text("Continue term")').click();

    // If crisis fires, resolve it
    if (await page.locator('.breaking-ribbon').isVisible()) {
      await page.locator('.modal-grid .option-card:not(.unaffordable)').first().click();
      await page.locator('button.stamp:has-text("DECIDE")').click();
      await expect(page.locator('.breaking-ribbon')).not.toBeVisible();
    }

    const powersTab = page.locator('.tab:has-text("Your Powers")');
    await expect(powersTab).toBeVisible();
    await powersTab.click();

    // 4. Judicial Reform Modal (REF-02)
    const openJudicialBtn = page.locator('[data-testid="open-judicial-reform-modal"]');
    await expect(openJudicialBtn).toBeVisible();
    await openJudicialBtn.click();

    const judicialModal = page.locator('[data-testid="judicial-reform-modal"]');
    await expect(judicialModal).toBeVisible();
    await expect(judicialModal.locator('[data-testid="judicial-card-scotus_term_limits"]')).toBeVisible();
    await expect(judicialModal.locator('[data-testid="judicial-card-statutory_ethics_code"]')).toBeVisible();
    await expect(judicialModal.locator('[data-testid="judicial-card-court_expansion"]')).toBeVisible();

    // Enact Statutory Judicial Code of Conduct
    const ethicsCard = judicialModal.locator('[data-testid="judicial-card-statutory_ethics_code"]');
    await ethicsCard.locator('button.enact-btn').click();
    await expect(ethicsCard.locator('.status-badge.staged')).toBeVisible();

    // Close judicial modal
    await judicialModal.locator('button.close-btn').click();
    await expect(judicialModal).not.toBeVisible();

    // 5. Electoral Reforms Card (REF-03)
    const electoralCard = page.locator('[data-testid="electoral-reforms-card"]');
    await expect(electoralCard).toBeVisible();
    const rcvBtn = electoralCard.locator('.electoral-item').first().locator('button.electoral-btn');
    await expect(rcvBtn).toBeVisible();
    await rcvBtn.click();
    await expect(rcvBtn).toHaveText('Staged');
  });
});
