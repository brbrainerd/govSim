import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ARTIFACT_DIR = '/Users/brbrainerd/.gemini/antigravity/brain/061ff89b-29ec-4512-822d-62fccc69e34c';
const BASE_URL = 'https://gsim.ngi.video';

const VIEWPORTS = [
  { width: 1376, height: 768, label: '1376x768' },
  { width: 1280, height: 720, label: '1280x720' },
] as const;

async function run() {
  if (!existsSync(ARTIFACT_DIR)) {
    mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Auditing Live Site ${BASE_URL} at ${vp.label} ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. NewGame Screen
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.clear();
      document.documentElement.setAttribute('data-calm', 'true');
    });
    await page.reload({ waitUntil: 'networkidle' });

    console.log(`Verifying NewGame on live...`);
    const porticoAttached = await page.locator('[data-testid="newgame-env-plate"]').count();
    console.log(`- NewGame portico plate count: ${porticoAttached}`);
    await page.screenshot({ path: join(ARTIFACT_DIR, `live-newgame-${vp.label}.png`), fullPage: false });

    // 2. Start Standard Game with all tabs unlocked for full audit
    await page.locator('input[name="party"]').first().check();
    const unlockToggle = page.locator('[data-testid="unlock-all-toggle"]');
    if (await unlockToggle.isVisible().catch(() => false)) {
      await unlockToggle.check();
    }
    await page.locator('button.stamp').click();
    await page.waitForTimeout(600);

    // Dismiss Quarter 1 Perk Draft Modal if visible
    const skipDraft = page.locator('[data-testid="perk-draft-skip-btn"]');
    if (await skipDraft.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipDraft.click();
      await page.waitForTimeout(300);
    }

    // 3. Oval Office Daytime
    console.log(`Verifying Oval Office Daytime on live...`);
    const ovalEnvCount = await page.locator('[data-testid="oval-env-plate"]').count();
    const agendaCount = await page.locator('[data-testid="turn-agenda-card"]').count();
    const clearingCount = await page.locator('[data-testid="clearing-summary-footer"]').count();
    console.log(`- Oval plate: ${ovalEnvCount}, Turn agenda: ${agendaCount}, Clearing summary: ${clearingCount}`);
    await page.screenshot({ path: join(ARTIFACT_DIR, `live-oval-day-${vp.label}.png`), fullPage: false });

    // 4. Congress Screen
    console.log(`Navigating to Congress...`);
    await page.locator('nav a, nav button').filter({ hasText: /Congress/i }).first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(ARTIFACT_DIR, `live-congress-${vp.label}.png`), fullPage: false });

    // 5. Voters Screen
    console.log(`Navigating to Voters...`);
    await page.locator('nav a, nav button').filter({ hasText: /Voters/i }).first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(ARTIFACT_DIR, `live-voters-${vp.label}.png`), fullPage: false });

    // 6. Economy Screen
    console.log(`Navigating to Economy...`);
    await page.locator('nav a, nav button').filter({ hasText: /Economy/i }).first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(ARTIFACT_DIR, `live-economy-${vp.label}.png`), fullPage: false });

    // 7. Budget Screen
    console.log(`Navigating to Budget...`);
    await page.locator('nav a, nav button').filter({ hasText: /Budget/i }).first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(ARTIFACT_DIR, `live-budget-${vp.label}.png`), fullPage: false });

    // 8. Powers Screen
    console.log(`Navigating to Powers...`);
    await page.locator('nav a, nav button').filter({ hasText: /Powers/i }).first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(ARTIFACT_DIR, `live-powers-${vp.label}.png`), fullPage: false });

    // 9. Evil Mode Oval Office
    console.log(`Starting Evil Mode session...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('input[name="party"]').first().check();
    await page.locator('[data-testid="evil-mode-toggle"]').check();
    await page.locator('[data-testid="unlock-all-toggle"]').check();
    await page.locator('button.stamp').filter({ hasNotText: /Resume/i }).first().click();
    await page.waitForTimeout(600);

    const skipDraftEvil = page.locator('[data-testid="perk-draft-skip-btn"]');
    if (await skipDraftEvil.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipDraftEvil.click();
      await page.waitForTimeout(300);
    }
    console.log(`Verifying Oval Office Evil Mode on live...`);
    const evilPlateCount = await page.locator('[data-testid="oval-env-plate"]').count();
    console.log(`- Evil plate count: ${evilPlateCount}`);
    await page.screenshot({ path: join(ARTIFACT_DIR, `live-oval-evil-${vp.label}.png`), fullPage: false });

    if (consoleErrors.length > 0) {
      console.warn(`Encountered ${consoleErrors.length} console errors:`, consoleErrors);
    } else {
      console.log(`Zero console errors!`);
    }

    await context.close();
  }

  await browser.close();
  console.log(`\nLive verification completed successfully.`);
}

run().catch((err) => {
  console.error('Live audit failed:', err);
  process.exit(1);
});
