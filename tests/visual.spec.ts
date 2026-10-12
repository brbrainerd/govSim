import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768 },
  { width: 1280, height: 720 },
];

test.describe('viewport fitting and visual baselines (OBS-07)', () => {
  test.beforeAll(() => {
    try {
      mkdirSync('.playwright-screenshots', { recursive: true });
    } catch {}
  });

  for (const vp of VIEWPORTS) {
    test(`fits screen with zero page scroll and visible action buttons at ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize(vp);

      // Helper to assert no page-level scrollbars
      async function assertNoOuterScroll(screenName: string) {
        const scrollInfo = await page.evaluate(() => ({
          innerHeight: window.innerHeight,
          clientHeight: document.documentElement.clientHeight,
          scrollHeight: document.documentElement.scrollHeight,
          bodyScrollHeight: document.body.scrollHeight,
        }));
        expect(
          scrollInfo.scrollHeight,
          `${screenName} document scrollHeight (${scrollInfo.scrollHeight}) must not exceed innerHeight (${scrollInfo.innerHeight}) at ${vp.width}x${vp.height}`,
        ).toBeLessThanOrEqual(scrollInfo.innerHeight);
      }

      // Helper to assert button is within visible viewport bounds
      async function assertButtonInViewport(locator: any, btnName: string) {
        await expect(locator).toBeVisible();
        const box = await locator.boundingBox();
        expect(box, `${btnName} bounding box must be available`).not.toBeNull();
        if (box) {
          expect(box.y + box.height, `${btnName} bottom edge must not exceed viewport height`).toBeLessThanOrEqual(vp.height);
          expect(box.x + box.width, `${btnName} right edge must not exceed viewport width`).toBeLessThanOrEqual(vp.width);
        }
      }

      // 1. New Game screen
      await page.goto('/');
      await expect(page.locator('.newgame')).toBeVisible();
      await assertNoOuterScroll('New Game');
      const startBtn = page.locator('button.stamp:has-text("Start the term")');
      await assertButtonInViewport(startBtn, 'Start the term button');
      await page.screenshot({ path: `.playwright-screenshots/newgame-${vp.width}x${vp.height}.png` });

      // Select party and start
      await page.locator('input[name="party"][value="D"]').check();
      await startBtn.click();

      // 2. Oval Office screen
      await expect(page.locator('.app')).toBeVisible();
      await assertNoOuterScroll('Oval Office');
      await page.screenshot({ path: `.playwright-screenshots/oval-${vp.width}x${vp.height}.png` });

      // 3. Budget screen
      await page.locator('.tab:has-text("Budget")').click();
      await expect(page.locator('section[aria-label="Money in"]')).toBeVisible();
      await assertNoOuterScroll('Budget');
      const sendBtn = page.locator('button.stamp:has-text("Send to Congress")');
      await assertButtonInViewport(sendBtn, 'Send to Congress button');
      await page.screenshot({ path: `.playwright-screenshots/budget-${vp.width}x${vp.height}.png` });

      // 4. Congress screen
      await page.locator('.tab:has-text("Congress")').click();
      await expect(page.locator('.h:has-text("Can we pass the bill?")')).toBeVisible();
      await assertNoOuterScroll('Congress');
      const voteBtn = page.locator('button.stamp:has-text("Call the vote")');
      await assertButtonInViewport(voteBtn, 'Call the vote button');
      await page.screenshot({ path: `.playwright-screenshots/congress-${vp.width}x${vp.height}.png` });
    });
  }
});
