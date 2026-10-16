import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768 },
  { width: 1280, height: 720 },
];

test.describe('v0.9 Plain-Talk Civics, Trade-Off Clarity & Multi-Viewport Audit (VOCAB-01..03, UI-CLARITY-01..03, SEE-01..02, BAL-02)', () => {
  test.beforeAll(() => {
    try {
      mkdirSync('.playwright-screenshots', { recursive: true });
    } catch {}
  });

  for (const vp of VIEWPORTS) {
    test(`verifies Plain Talk and Policy Wonk modes, TradeoffPills, zero outer scroll, and axe a11y across all 7 screens at ${vp.width}x${vp.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(vp);

      async function assertNoOuterScroll(contextLabel: string) {
        const scrollInfo = await page.evaluate(() => ({
          innerHeight: window.innerHeight,
          scrollHeight: document.documentElement.scrollHeight,
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(
          scrollInfo.scrollHeight,
          `${contextLabel} scrollHeight (${scrollInfo.scrollHeight}) exceeds innerHeight (${scrollInfo.innerHeight}) at ${vp.width}x${vp.height}`,
        ).toBeLessThanOrEqual(scrollInfo.innerHeight + 1);
        expect(
          scrollInfo.scrollWidth,
          `${contextLabel} scrollWidth (${scrollInfo.scrollWidth}) exceeds innerWidth (${scrollInfo.innerWidth}) at ${vp.width}x${vp.height}`,
        ).toBeLessThanOrEqual(scrollInfo.innerWidth + 1);
      }

      async function assertZeroAxeSerious(contextLabel: string) {
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .disableRules(['color-contrast'])
          .analyze();
        const severe = results.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        );
        expect(
          severe,
          `${contextLabel} axe serious/critical violations: ${JSON.stringify(severe, null, 2)}`,
        ).toEqual([]);
      }

      // 1. New Game screen: verify vocabMode selector defaults to Plain Talk and can switch
      await page.goto('/');
      await expect(page.locator('.newgame')).toBeVisible();
      await expect(page.locator('[data-testid="vocab-mode-toggle-newgame"]')).toBeVisible();
      await assertNoOuterScroll('New Game (Plain Talk)');

      // Unlock all screens so we can audit all 7 screens immediately on Turn 1
      const unlockCheckbox = page.locator('[data-testid="unlock-all-toggle"]');
      if (await unlockCheckbox.isVisible()) {
        await unlockCheckbox.check();
      }
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('button.stamp:has-text("Start the term")').click();

      // 2. Oval Office (Plain Talk default)
      await expect(page.locator('.app')).toBeVisible();
      const vocabToggle = page.locator('[data-testid="vocab-mode-toggle"]');
      await expect(vocabToggle).toBeVisible();
      await expect(vocabToggle).toContainText('Plain Talk');
      await assertNoOuterScroll('Oval Office (Plain Talk)');
      await page.screenshot({
        path: `.playwright-screenshots/v0.9-oval-plain-${vp.width}x${vp.height}.png`,
      });

      // 3. Budget screen (Plain Talk + Policy Wonk)
      await page.locator('.tab:has-text("Budget")').click();
      await expect(page.locator('[data-testid="budget-tradeoff-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="tradeoff-card"]')).toBeVisible();
      await assertNoOuterScroll('Budget (Plain Talk)');
      await assertZeroAxeSerious('Budget (Plain Talk)');
      await page.screenshot({
        path: `.playwright-screenshots/v0.9-budget-plain-${vp.width}x${vp.height}.png`,
      });

      // Toggle to Policy Wonk on Budget and verify drawer + zero scroll
      await vocabToggle.click();
      await expect(vocabToggle).toContainText('Policy Wonk');
      await expect(page.locator('[data-testid="tradeoff-wonk-drawer"]').first()).toBeVisible();
      await assertNoOuterScroll('Budget (Policy Wonk)');
      await page.screenshot({
        path: `.playwright-screenshots/v0.9-budget-wonk-${vp.width}x${vp.height}.png`,
      });

      // Toggle back to Plain Talk
      await vocabToggle.click();
      await expect(vocabToggle).toContainText('Plain Talk');

      // 4. Congress screen + Filibuster Modal TradeoffPills
      await page.locator('.tab:has-text("Congress")').click();
      await expect(page.locator('[data-testid^="deal-card-"]').first()).toBeVisible();
      await assertNoOuterScroll('Congress (Plain Talk)');
      await assertZeroAxeSerious('Congress (Plain Talk)');
      await page.screenshot({
        path: `.playwright-screenshots/v0.9-congress-plain-${vp.width}x${vp.height}.png`,
      });
      await page.locator('[data-testid="open-filibuster-modal"]').click();
      await expect(page.locator('[data-testid="tradeoff-pill"]').first()).toBeVisible();
      await assertNoOuterScroll('Filibuster Modal (Plain Talk)');
      await page.keyboard.press('Escape');

      // 5. Powers screen
      await page.locator('.tab:has-text("Powers")').click();
      await expect(page.locator('[data-testid="powers-preview-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="tradeoff-pill"]').first()).toBeVisible();
      await assertNoOuterScroll('Powers (Plain Talk)');
      await assertZeroAxeSerious('Powers (Plain Talk)');
      await page.screenshot({
        path: `.playwright-screenshots/v0.9-powers-plain-${vp.width}x${vp.height}.png`,
      });

      // 6. Trade screen
      await page.locator('.tab:has-text("Trade")').click();
      await expect(page.locator('[data-testid="tradeoff-pill"]').first()).toBeVisible();
      await assertNoOuterScroll('Trade (Plain Talk)');
      await assertZeroAxeSerious('Trade (Plain Talk)');
      await page.screenshot({
        path: `.playwright-screenshots/v0.9-trade-plain-${vp.width}x${vp.height}.png`,
      });

      // 7. Economy screen
      await page.locator('.tab:has-text("Economy")').click();
      await expect(page.locator('[data-testid="economy-kitchen-table-summary"]')).toBeVisible();
      await assertNoOuterScroll('Economy (Plain Talk)');
      await assertZeroAxeSerious('Economy (Plain Talk)');
      await page.screenshot({
        path: `.playwright-screenshots/v0.9-economy-plain-${vp.width}x${vp.height}.png`,
      });

      // 8. Voters screen
      await page.locator('.tab:has-text("Voters")').click();
      await expect(page.locator('[data-testid="local-family-impact"]')).toBeVisible();
      await assertNoOuterScroll('Voters (Plain Talk)');
      await assertZeroAxeSerious('Voters (Plain Talk)');
      await page.screenshot({
        path: `.playwright-screenshots/v0.9-voters-plain-${vp.width}x${vp.height}.png`,
      });

      // 9. Advance turn and verify TurnReport Kitchen-Table takeaway
      await page.locator('button.stamp:has-text("Next turn")').click();
      await expect(page.locator('[data-testid="report-kitchen-table-summary"]')).toBeVisible();
      await assertNoOuterScroll('Turn Report (Plain Talk)');
      await page.screenshot({
        path: `.playwright-screenshots/v0.9-report-plain-${vp.width}x${vp.height}.png`,
      });
    });
  }
});
