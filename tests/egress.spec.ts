import { expect, test } from '@playwright/test';

test.describe('zero-telemetry egress audit (OBS-04)', () => {
  test('asserts 0 network requests outside origin and asset host during full game session', async ({
    page,
  }) => {
    const requestedUrls: string[] = [];
    const cspViolations: string[] = [];

    page.on('request', (req) => {
      requestedUrls.push(req.url());
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
        cspViolations.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page.locator('.newgame')).toBeVisible();

    // Select party and start term
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp').click();

    // Verify Oval Office loaded (Turn 1)
    await expect(page.locator('.app')).toBeVisible();

    // Navigate to Budget
    await page.locator('.tab:has-text("Budget")').click();
    await expect(page.locator('section[aria-label="Money in"]')).toBeVisible();

    // Advance turns
    for (let i = 0; i < 4; i++) {
      const nextBtn = page.locator('header.bar button.stamp:has-text("Next turn")');
      await expect(nextBtn).toBeVisible();
      await nextBtn.click();
      const continueBtn = page.locator('button.stamp:has-text("Continue term")');
      await expect(continueBtn).toBeVisible();
      await continueBtn.click();

      // If crisis modal appeared, decide it to continue
      const decideBtn = page.locator('button.stamp:has-text("DECIDE")');
      if (await decideBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await decideBtn.click();
      }
    }

    // Verify no CSP errors in console
    expect(cspViolations, 'CSP violations detected in browser console').toEqual([]);

    // Verify all requested URLs
    const allowedOrigin = new URL(page.url()).origin;
    const illegalRequests = requestedUrls.filter((u) => {
      if (u.startsWith('data:') || u.startsWith('blob:')) return false;
      if (u.startsWith(allowedOrigin)) return false;
      if (u.includes('.r2.cloudflarestorage.com')) return false;
      return true;
    });

    expect(
      illegalRequests,
      `Detected unauthorized network egress to external hosts:\n${illegalRequests.join('\n')}`,
    ).toEqual([]);
  });
});
