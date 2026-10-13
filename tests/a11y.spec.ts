import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('accessibility audits (OBS-07, D6)', () => {
  test('New Game, Oval Office, Budget, and Congress screens have zero serious or critical violations', async ({ page }) => {
    // 1. New Game screen
    await page.goto('/');
    await expect(page.locator('.newgame')).toBeVisible();

    const newGameAxe = await new AxeBuilder({ page }).analyze();
    const newGameSevere = newGameAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(newGameSevere, `New Game a11y violations: ${JSON.stringify(newGameSevere, null, 2)}`).toEqual([]);

    // Select Democratic party and start game
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("START THE TERM")').click();

    // 2. Oval Office screen
    await expect(page.locator('.app')).toBeVisible();
    const ovalAxe = await new AxeBuilder({ page }).analyze();
    const ovalSevere = ovalAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(ovalSevere, `Oval Office a11y violations: ${JSON.stringify(ovalSevere, null, 2)}`).toEqual([]);

    // 2b. Myth card modal
    await page.locator('button.ticket:has-text("Myth? Can you lower gas prices")').click();
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    const mythAxe = await new AxeBuilder({ page }).analyze();
    const mythSevere = mythAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(mythSevere, `Myth modal a11y violations: ${JSON.stringify(mythSevere, null, 2)}`).toEqual([]);
    await page.locator('button.got-it-btn').click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();

    // 3. Budget screen
    await page.locator('.tab:has-text("Budget")').click();
    await expect(page.locator('section[aria-label="Money in"]')).toBeVisible();
    const budgetAxe = await new AxeBuilder({ page }).analyze();
    const budgetSevere = budgetAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(budgetSevere, `Budget a11y violations: ${JSON.stringify(budgetSevere, null, 2)}`).toEqual([]);

    // 4. Congress screen
    await page.locator('.tab:has-text("Congress")').click();
    await expect(page.locator('.h:has-text("Can we pass the bill?")')).toBeVisible();
    const congressAxe = await new AxeBuilder({ page }).analyze();
    const congressSevere = congressAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(congressSevere, `Congress a11y violations: ${JSON.stringify(congressSevere, null, 2)}`).toEqual([]);

    // 4b. Filibuster modal (REF-01, OBS-07)
    await page.locator('[data-testid="open-filibuster-modal"]').click();
    await expect(page.locator('[data-testid="filibuster-modal"]')).toBeVisible();
    const filibusterAxe = await new AxeBuilder({ page }).analyze();
    const filibusterSevere = filibusterAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(filibusterSevere, `Filibuster modal a11y violations: ${JSON.stringify(filibusterSevere, null, 2)}`).toEqual([]);
    await page.locator('[data-testid="filibuster-modal"] button.close-btn').click();
    await expect(page.locator('[data-testid="filibuster-modal"]')).not.toBeVisible();

    // 4c. Amendment modal (REF-04, OBS-07)
    await page.locator('[data-testid="open-amendment-modal"]').click();
    await expect(page.locator('[data-testid="amendment-modal"]')).toBeVisible();
    const amendmentAxe = await new AxeBuilder({ page }).analyze();
    const amendmentSevere = amendmentAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(amendmentSevere, `Amendment modal a11y violations: ${JSON.stringify(amendmentSevere, null, 2)}`).toEqual([]);
    await page.locator('[data-testid="amendment-modal"] button.close-btn').click();
    await expect(page.locator('[data-testid="amendment-modal"]')).not.toBeVisible();

    // 5. Economy screen
    await page.locator('.tab:has-text("Economy")').click();
    await expect(page.locator('.h:has-text("How is the economy doing?")')).toBeVisible();
    const econAxe = await new AxeBuilder({ page }).analyze();
    const econSevere = econAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(econSevere, `Economy a11y violations: ${JSON.stringify(econSevere, null, 2)}`).toEqual([]);

    // 6. All 8 scores modal
    await page.locator('button[aria-label="See all 8 prosperity scores"]').click();
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    const scoresAxe = await new AxeBuilder({ page }).analyze();
    const scoresSevere = scoresAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(scoresSevere, `Scores modal a11y violations: ${JSON.stringify(scoresSevere, null, 2)}`).toEqual([]);
    await page.locator('button:has-text("Done")').click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();

    // 7. Turn Report overlay dialog
    await page.locator('button.stamp:has-text("Next turn")').click();
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    const reportAxe = await new AxeBuilder({ page }).analyze();
    const reportSevere = reportAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(reportSevere, `Turn Report a11y violations: ${JSON.stringify(reportSevere, null, 2)}`).toEqual([]);

    // Close Turn Report (advancing to Turn 2)
    await page.locator('button.stamp:has-text("Continue term")').click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();

    // 8. Your Powers screen (Turn 2)
    await page.locator('.tab:has-text("Your Powers")').click();
    await expect(page.locator('.h:has-text("What can you do without Congress?")')).toBeVisible();
    const powersAxe = await new AxeBuilder({ page }).analyze();
    const powersSevere = powersAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(powersSevere, `Powers screen a11y violations: ${JSON.stringify(powersSevere, null, 2)}`).toEqual([]);

    // 8b. Speech modal
    await page.locator('.speech-dialog-link').click();
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    const speechAxe = await new AxeBuilder({ page }).analyze();
    const speechSevere = speechAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(speechSevere, `Speech modal a11y violations: ${JSON.stringify(speechSevere, null, 2)}`).toEqual([]);
    await page.locator('button.cancel-link').click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();

    // 8c. Fed modal
    await page.locator('.fed-btn.secondary').click();
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    const fedAxe = await new AxeBuilder({ page }).analyze();
    const fedSevere = fedAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(fedSevere, `Fed modal a11y violations: ${JSON.stringify(fedSevere, null, 2)}`).toEqual([]);
    await page.locator('button.cancel-link').click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();

    // 8d. Judicial Reform modal (REF-02, OBS-07)
    await page.locator('[data-testid="open-judicial-reform-modal"]').click();
    await expect(page.locator('[data-testid="judicial-reform-modal"]')).toBeVisible();
    const judicialAxe = await new AxeBuilder({ page }).analyze();
    const judicialSevere = judicialAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(judicialSevere, `Judicial Reform modal a11y violations: ${JSON.stringify(judicialSevere, null, 2)}`).toEqual([]);
    await page.locator('[data-testid="judicial-reform-modal"] button.close-btn').click();
    await expect(page.locator('[data-testid="judicial-reform-modal"]')).not.toBeVisible();

    // 8. Crisis modal (advance turns until crisis fires on turn 3, 4, or 5)
    while (!(await page.locator('.breaking-ribbon').isVisible())) {
      await page.locator('button.stamp:has-text("Next turn")').click();
      await page.locator('button.stamp:has-text("Continue term")').click();
    }

    await expect(page.locator('.breaking-ribbon')).toBeVisible();
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    const crisisAxe = await new AxeBuilder({ page }).analyze();
    const crisisSevere = crisisAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(crisisSevere, `Crisis modal a11y violations: ${JSON.stringify(crisisSevere, null, 2)}`).toEqual([]);

    // Select an option and click DECIDE
    await page.locator('.modal-grid .option-card:not(.unaffordable)').first().click();
    await page.locator('button.stamp:has-text("DECIDE")').click();
    await expect(page.locator('.breaking-ribbon')).not.toBeVisible();

    // 9. Voters screen (Map View & Table View, VOT-01, OBS-07)
    await page.locator('.tab:has-text("Voters")').click();
    await expect(page.locator('.h:has-text("Who supports you?")')).toBeVisible();
    await expect(page.locator('[data-testid="us-map"]')).toBeVisible();

    const votersMapAxe = await new AxeBuilder({ page }).analyze();
    const votersMapSevere = votersMapAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(votersMapSevere, `Voters Map View a11y violations: ${JSON.stringify(votersMapSevere, null, 2)}`).toEqual([]);

    // 9b. Voters Table View
    await page.locator('.switch-btn:has-text("Table View")').click();
    await expect(page.locator('.states-table')).toBeVisible();

    const votersTableAxe = await new AxeBuilder({ page }).analyze();
    const votersTableSevere = votersTableAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(votersTableSevere, `Voters Table View a11y violations: ${JSON.stringify(votersTableSevere, null, 2)}`).toEqual([]);

    // 9c. Voters Coalitions View (SOC-05)
    await page.locator('.switch-btn:has-text("Coalitions")').click();
    await expect(page.locator('.coalitions-wrapper')).toBeVisible();

    const votersCoalitionsAxe = await new AxeBuilder({ page }).analyze();
    const votersCoalitionsSevere = votersCoalitionsAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(votersCoalitionsSevere, `Voters Coalitions View a11y violations: ${JSON.stringify(votersCoalitionsSevere, null, 2)}`).toEqual([]);
  });

  test('Election Night modal, result card, and EndScreen have zero serious or critical violations (OBS-07)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.newgame')).toBeVisible();
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("START THE TERM")').click();
    await expect(page.locator('.app')).toBeVisible();

    // Fast-forward to Turn 16
    let currentTurn = 1;
    while (currentTurn < 16) {
      await page.locator('button.stamp:has-text("Next turn")').click();
      await page.locator('button.stamp:has-text("Continue term")').click();
      currentTurn++;

      if (await page.locator('.breaking-ribbon').isVisible()) {
        await page.locator('.modal-grid .option-card:not(.unaffordable)').first().click();
        await page.locator('button.stamp:has-text("DECIDE")').click();
        await expect(page.locator('.breaking-ribbon')).not.toBeVisible();
      }
    }

    // Advance from Turn 16 to trigger Election Night
    await page.locator('button.stamp:has-text("Next turn")').click();
    const electionModal = page.locator('[data-testid="election-night-modal"]');
    await expect(electionModal).toBeVisible();

    const electionAxe = await new AxeBuilder({ page }).analyze();
    const electionSevere = electionAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(electionSevere, `Election Night modal a11y violations: ${JSON.stringify(electionSevere, null, 2)}`).toEqual([]);

    // Skip to result card
    const skipBtn = page.locator('button.skip-btn:has-text("Skip to Final Result")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
    }
    const resultCard = page.locator('[data-testid="election-result-card"]');
    await expect(resultCard).toBeVisible();

    const resultAxe = await new AxeBuilder({ page }).analyze();
    const resultSevere = resultAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(resultSevere, `Result card a11y violations: ${JSON.stringify(resultSevere, null, 2)}`).toEqual([]);

    // Continue
    await page.locator('[data-testid="election-continue-btn"]').click();
    await expect(electionModal).not.toBeVisible();

    if (await page.locator('[data-testid="end-screen"]').isVisible()) {
      const endAxe = await new AxeBuilder({ page }).analyze();
      const endSevere = endAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(endSevere, `EndScreen a11y violations: ${JSON.stringify(endSevere, null, 2)}`).toEqual([]);

      // Milestones tab audit (RPT-03, OBS-07)
      const milestonesTab = page.locator('[data-testid="tab-milestones"]');
      if (await milestonesTab.isVisible()) {
        await milestonesTab.click();
        await expect(page.locator('[data-testid="badges-grid"]')).toBeVisible();
        const milestonesAxe = await new AxeBuilder({ page }).analyze();
        const milestonesSevere = milestonesAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        expect(milestonesSevere, `Milestones tab a11y violations: ${JSON.stringify(milestonesSevere, null, 2)}`).toEqual([]);
      }
    }
  });

  test('About modal and Problem Report modal have zero serious or critical violations (REL-02, REL-04)', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("START THE TERM")').click();
    await expect(page.locator('.app')).toBeVisible();

    // 1. Audit About & Privacy modal
    await page.locator('[data-testid="nav-about-btn"]').click();
    await expect(page.locator('[data-testid="about-modal"]')).toBeVisible();
    const aboutAxe = await new AxeBuilder({ page }).analyze();
    const aboutSevere = aboutAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(aboutSevere, `About modal a11y violations: ${JSON.stringify(aboutSevere, null, 2)}`).toEqual([]);

    // 2. Audit Problem Report modal
    await page.locator('[data-testid="about-report-btn"]').click();
    await expect(page.locator('[data-testid="problem-modal"]')).toBeVisible();
    const problemAxe = await new AxeBuilder({ page }).analyze();
    const problemSevere = problemAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(problemSevere, `Problem Report modal a11y violations: ${JSON.stringify(problemSevere, null, 2)}`).toEqual([]);
  });
});
