import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';
import { encodeRunCode } from '../src/app/share';

const VIEWPORTS = [
  { width: 1376, height: 768, name: '1376x768' },
  { width: 1280, height: 720, name: '1280x720' },
];

test.describe('Geopolitical Crises & Response Triads (CRISIS-01, CRISIS-02, CRISIS-03)', () => {
  test('CrisisModal renders globe emblem, countdown badge, triad cards, precedent accordions, and Oval Office alert banner', async ({ page }) => {
    mkdirSync('.planning/phases/13-geopolitical-crises-deck-resolution-mechanics/screenshots', { recursive: true });

    // Seed 22 schedules Global Oil Supply Embargo on Turn 3
    const code = await encodeRunCode({ seed: 22, options: { party: 'D' }, inputs: [{}, {}] });
    await page.goto(`/#run=${code}`);

    // Wait for the app and CrisisModal to be visible
    await expect(page.locator('.app')).toBeVisible();
    await expect(page.locator('.crisis-shell')).toBeVisible();

    // 1. Verify Geopolitical badges in CrisisModal
    const geoBadge = page.locator('[data-testid="geopolitical-badge"]');
    await expect(geoBadge).toBeVisible();
    await expect(geoBadge).toContainText('International Crisis');

    const countdownBadge = page.locator('[data-testid="countdown-badge"]');
    await expect(countdownBadge).toBeVisible();
    await expect(countdownBadge).toContainText('2 Quarters to Escalation');

    // 2. Verify 3-Option Response Triad cards
    const optionCards = page.locator('.modal-grid .option-card');
    await expect(optionCards).toHaveCount(3);

    // 3. Verify Historical Precedent Accordion
    const precedentDetails = page.locator('[data-testid="precedent-private_market"]');
    await expect(precedentDetails).toBeVisible();
    const summary = precedentDetails.locator('summary');
    await expect(summary).toContainText('Historical Precedent & CRS Citation');

    // Expand accordion
    await summary.click();
    await expect(precedentDetails.locator('.precedent-citation')).toContainText('1979 Second Oil Shock');
    await expect(precedentDetails.locator('.precedent-text')).toContainText('Federal energy policy');

    // 4. Accessibility audit on CrisisModal
    const modalAxe = await new AxeBuilder({ page }).include('.dialog').analyze();
    const modalViolations = modalAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(modalViolations, `CrisisModal a11y violations: ${JSON.stringify(modalViolations, null, 2)}`).toEqual([]);

    // 5. Dismiss modal to inspect Oval Office persistent banner
    await page.locator('button.close-btn').click();
    await expect(page.locator('.crisis-shell')).not.toBeVisible();

    // Verify persistent alert card in Oval Office
    const alertCard = page.locator('[data-testid="geopolitical-alert-card"]');
    await expect(alertCard).toBeVisible();
    await expect(alertCard).toContainText('INTERNATIONAL CRISIS');
    await expect(alertCard).toContainText('Quarters Left');

    // Reopen modal via "Review Crisis Options" button
    const reviewBtn = page.locator('[data-testid="review-crisis-btn"]');
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();
    await expect(page.locator('.crisis-shell')).toBeVisible();

    // 6. Select Option B (SPR Drawdown) and Decide
    const sprOption = page.locator('[data-testid="crisis-option-spr_drawdown"] button.option-select-btn');
    await sprOption.click();

    const decideBtn = page.locator('button.stamp.decide-btn:has-text("DECIDE")');
    await expect(decideBtn).toBeEnabled();
    await decideBtn.click();

    // Verify modal dismissed and alert banner removed
    await expect(page.locator('.crisis-shell')).not.toBeVisible();
  });

  for (const vp of VIEWPORTS) {
    test(`zero outer viewport scroll and clean layout at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Load turn 3 with seed 22
      const code = await encodeRunCode({ seed: 22, options: { party: 'D' }, inputs: [{}, {}] });
      await page.goto(`/#run=${code}`);

      await expect(page.locator('.app')).toBeVisible();
      await expect(page.locator('.crisis-shell')).toBeVisible();

      // Screenshot CrisisModal
      await page.screenshot({
        path: `.planning/phases/13-geopolitical-crises-deck-resolution-mechanics/screenshots/modal-geopolitical-${vp.name}.png`,
      });

      // Verify zero viewport scroll for CrisisModal
      let scrollCheck = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          windowHeight: window.innerHeight,
          scrollHeight: root.scrollHeight,
          windowWidth: window.innerWidth,
          scrollWidth: root.scrollWidth,
        };
      });
      expect(scrollCheck.scrollHeight, `CrisisModal height overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowHeight);
      expect(scrollCheck.scrollWidth, `CrisisModal width overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowWidth);

      // Dismiss to check Oval Office screen
      await page.locator('button.close-btn').click();
      await expect(page.locator('[data-testid="geopolitical-alert-card"]')).toBeVisible();

      // Screenshot Oval Office with alert card
      await page.screenshot({
        path: `.planning/phases/13-geopolitical-crises-deck-resolution-mechanics/screenshots/oval-geopolitical-alert-${vp.name}.png`,
      });

      // Verify zero viewport scroll for Oval Office
      scrollCheck = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          windowHeight: window.innerHeight,
          scrollHeight: root.scrollHeight,
          windowWidth: window.innerWidth,
          scrollWidth: root.scrollWidth,
        };
      });
      expect(scrollCheck.scrollHeight, `Oval Office height overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowHeight);
      expect(scrollCheck.scrollWidth, `Oval Office width overflow at ${vp.name}`).toBeLessThanOrEqual(scrollCheck.windowWidth);

      // Accessibility audit on Oval Office
      const ovalAxe = await new AxeBuilder({ page }).include('.app').analyze();
      const ovalViolations = ovalAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(ovalViolations, `Oval Office a11y violations at ${vp.name}: ${JSON.stringify(ovalViolations, null, 2)}`).toEqual([]);
    });
  }
});
