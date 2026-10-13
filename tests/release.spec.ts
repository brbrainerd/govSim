import { expect, test } from '@playwright/test';
import { encodeRunCode } from '../src/app/share';

test.describe('Release hardening and verification (REL-02, REL-03, REL-04, OBS-04, OBS-07)', () => {
  test('verifies About modal, zero-egress Problem Report bundle, and copy interaction', async ({ page }) => {
    // Monitor all network requests to verify zero external egress (OBS-04, REL-04)
    const egressRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
        egressRequests.push(url);
      }
    });

    await page.goto('/');
    await expect(page.locator('.newgame')).toBeVisible();

    // Start a new term
    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("START THE TERM")').click();
    await expect(page.locator('.app')).toBeVisible();

    // 1. Open About & Privacy modal from navigation rail
    const aboutBtn = page.locator('[data-testid="nav-about-btn"]');
    await expect(aboutBtn).toBeVisible();
    await aboutBtn.click();

    // Verify About modal content (REL-02)
    const aboutModal = page.locator('[data-testid="about-modal"]');
    await expect(aboutModal).toBeVisible();
    await expect(aboutModal).toContainText('About govSim');
    await expect(aboutModal).toContainText('ZERO TELEMETRY · ZERO TRACKING');
    await expect(aboutModal.locator('[data-testid="about-github-link"]')).toHaveAttribute(
      'href',
      'https://github.com/brbrainerd/govSim',
    );

    // 2. Open Problem Report modal from About modal (REL-04)
    const reportBtn = page.locator('[data-testid="about-report-btn"]');
    await expect(reportBtn).toBeVisible();
    await reportBtn.click();

    // About modal closes, Problem Report modal opens
    await expect(aboutModal).not.toBeVisible();
    const problemModal = page.locator('[data-testid="problem-modal"]');
    await expect(problemModal).toBeVisible();
    await expect(problemModal).toContainText('REVIEW BEFORE COPYING');

    // Verify diagnostic bundle pre block is populated
    const diagPre = problemModal.locator('[data-testid="diagnostic-pre"]');
    await expect(diagPre).toBeVisible();
    await expect(diagPre).toContainText('"app": "govSim"');
    await expect(diagPre).toContainText('"turn": 1');

    // Click copy button
    const copyBtn = problemModal.locator('[data-testid="copy-bundle-btn"]');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Verify zero external network requests occurred (OBS-04)
    expect(egressRequests).toHaveLength(0);

    // Close modal with Escape key
    await page.keyboard.press('Escape');
    await expect(problemModal).not.toBeVisible();
  });

  test('verifies share-your-run #run= hash loading and deterministic replay (REL-03)', async ({ page }) => {
    const code = await encodeRunCode({
      seed: 42,
      options: { party: 'D' },
      inputs: [{}, {}],
    });
    const shareUrl = `/#run=${code}`;

    // Navigate to the shared run URL
    await page.goto(shareUrl);

    // Verify the shared presidential record banner appears
    const banner = page.locator('[data-testid="shared-run-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Viewing Shared Presidential Record (Seed: 42, Party: D)');

    // Verify game was restored to Turn 3 (after 2 empty inputs)
    await expect(page.locator('header.bar')).toContainText('Turn 3 of 32');

    // Click "Start Your Own Presidency" to exit shared replay
    const exitBtn = page.locator('[data-testid="exit-shared-replay-btn"]');
    await expect(exitBtn).toBeVisible();
    await exitBtn.click();

    // Banner dismissed and returned to New Game screen
    await expect(banner).not.toBeVisible();
    await expect(page.locator('.newgame')).toBeVisible();
  });

  test('verifies keyboard-only flow through About and Problem Report modals', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.newgame')).toBeVisible();

    await page.locator('input[name="party"][value="D"]').check();
    await page.locator('button.stamp:has-text("START THE TERM")').click();
    await expect(page.locator('.app')).toBeVisible();

    // Tab to About button in rail and press Enter
    let foundAbout = false;
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      const isAbout = await page.evaluate(() => {
        return document.activeElement?.getAttribute('data-testid') === 'nav-about-btn';
      });
      if (isAbout) {
        foundAbout = true;
        break;
      }
    }
    expect(foundAbout).toBe(true);
    await page.keyboard.press('Enter');

    // Verify About modal is focused and open
    const aboutModal = page.locator('[data-testid="about-modal"]');
    await expect(aboutModal).toBeVisible();

    // Close with Escape key
    await page.keyboard.press('Escape');
    await expect(aboutModal).not.toBeVisible();
  });
});
