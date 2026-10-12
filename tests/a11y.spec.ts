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

    // Close Turn Report
    await page.locator('button.stamp:has-text("Continue term")').click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();
  });
});
