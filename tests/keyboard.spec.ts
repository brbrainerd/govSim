import { expect, test } from '@playwright/test';

test.describe('100% keyboard-only turn navigation (OBS-07)', () => {
  test('plays a full turn from New Game through Turn 2 strictly with keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.newgame')).toBeVisible();

    // Helper: tabs until a condition on document.activeElement is met
    async function tabUntil(predicate: () => Promise<boolean>, maxTabs = 35) {
      for (let i = 0; i < maxTabs; i++) {
        await page.keyboard.press('Tab');
        const activeInfo = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return {
            tag: el.tagName,
            type: (el as any).type,
            text: el.textContent?.trim(),
            w: rect.width,
            h: rect.height,
            vis: style.visibility,
            disp: style.display,
          };
        });
        if (activeInfo) {
          const activeIsVisible = activeInfo.w > 0 && activeInfo.h > 0 && activeInfo.vis !== 'hidden' && activeInfo.disp !== 'none';
          expect(activeIsVisible, `Currently focused element must be visible: ${JSON.stringify(activeInfo)}`).toBe(true);
        }
        if (await predicate()) return;
      }
      throw new Error(`Failed to find target element after ${maxTabs} tabs`);
    }

    // 1. Tab to party radio and select with Space
    await tabUntil(async () => {
      return await page.evaluate(() => {
        const el = document.activeElement as HTMLInputElement;
        return el?.tagName === 'INPUT' && el?.name === 'party' && el?.value === 'D';
      });
    });
    await page.keyboard.press('Space');

    // 2. Tab to "Start the term" button and press Enter
    await tabUntil(async () => {
      return await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName === 'BUTTON' && el?.textContent?.toLowerCase().includes('start the term') === true;
      });
    });
    await page.keyboard.press('Enter');

    // 3. Verify Oval Office screen loaded
    await expect(page.locator('.app')).toBeVisible();
    await expect(page.locator('header.bar')).toContainText('Turn 1 of 32');

    // 4. Tab to Budget tab in navigation rail and press Enter
    await tabUntil(async () => {
      return await page.evaluate(() => {
        const el = document.activeElement;
        return el?.classList?.contains('tab') && el?.textContent?.toLowerCase().includes('budget') === true;
      });
    });
    await page.keyboard.press('Enter');
    await expect(page.locator('section[aria-label="Money in"]')).toBeVisible();

    // 5. Tab to a range slider and adjust with ArrowRight
    await tabUntil(async () => {
      return await page.evaluate(() => {
        const el = document.activeElement as HTMLInputElement;
        return el?.tagName === 'INPUT' && el?.type === 'range';
      });
    });
    const valBefore = await page.evaluate(() => (document.activeElement as HTMLInputElement).value);
    await page.keyboard.press('ArrowRight');
    const valAfter = await page.evaluate(() => (document.activeElement as HTMLInputElement).value);
    expect(Number(valAfter)).toBeGreaterThan(Number(valBefore));

    // 6. Tab to "Send to Congress" button and press Enter
    await tabUntil(async () => {
      return await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName === 'BUTTON' && el?.textContent?.toLowerCase().includes('send to congress') === true;
      });
    });
    await page.keyboard.press('Enter');
    await expect(page.locator('.sent')).toBeVisible();

    // 7. Tab to "Open Congress" or Congress tab and press Enter
    await tabUntil(async () => {
      return await page.evaluate(() => {
        const el = document.activeElement;
        const text = el?.textContent?.toLowerCase() ?? '';
        return el?.tagName === 'BUTTON' && (text.includes('open congress') || (el?.classList?.contains('tab') && text.includes('congress')));
      });
    });
    await page.keyboard.press('Enter');
    await expect(page.locator('.h:has-text("Can we pass the bill?")')).toBeVisible();

    // 8. Tab to "Call the vote" button and press Enter
    await tabUntil(async () => {
      return await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName === 'BUTTON' && el?.textContent?.toLowerCase().includes('call the vote') === true;
      });
    });
    await page.keyboard.press('Enter');

    // 9. Tab to "Next turn" button in the status bar and press Enter
    await tabUntil(async () => {
      return await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName === 'BUTTON' && el?.textContent?.toLowerCase().includes('next turn') === true;
      });
    });
    await page.keyboard.press('Enter');

    // 10. Verify turn advanced to Turn 2
    await expect(page.locator('header.bar')).toContainText('Turn 2 of 32');
  });
});
