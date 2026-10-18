import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768 },
  { width: 1280, height: 720 },
];

test.describe('v1.0 Milestone: Perks, Policy Doctrines, Heist Relics, Archetypes & Mastery Audit (AUDIT-01, AUDIT-02)', () => {
  test.beforeAll(() => {
    try {
      mkdirSync('.playwright-screenshots/v1', { recursive: true });
    } catch {}
  });

  for (const vp of VIEWPORTS) {
    test(`verifies v1.0 Standard & Evil Mode flows, zero scroll, and 0 axe violations at ${vp.width}x${vp.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(vp);

      async function assertNoOuterScroll(screenName: string) {
        const scrollInfo = await page.evaluate(() => ({
          innerHeight: window.innerHeight,
          scrollHeight: document.documentElement.scrollHeight,
        }));
        expect(
          scrollInfo.scrollHeight,
          `${screenName} document scrollHeight (${scrollInfo.scrollHeight}) must not exceed innerHeight (${scrollInfo.innerHeight}) at ${vp.width}x${vp.height}`,
        ).toBeLessThanOrEqual(scrollInfo.innerHeight);
      }

      async function assertNoAxeViolations(screenName: string) {
        const results = await new AxeBuilder({ page }).disableRules(['page-has-heading-one']).analyze();
        expect(results.violations, `${screenName} axe violations at ${vp.width}x${vp.height}`).toEqual([]);
      }

      // 1. New Game screen: Archetype selector, Mastery Stars, Classic Sim toggle
      await page.goto('/');
      await expect(page.locator('.newgame')).toBeVisible();
      await expect(page.locator('[data-testid="archetype-selector"]')).toBeVisible();
      await expect(page.locator('[data-testid="archetype-card-dealmaker"]')).toBeVisible();
      await expect(page.locator('[data-testid="mastery-stars-dealmaker"]')).toBeVisible();
      await expect(page.locator('[data-testid="classic-sim-toggle"]')).toBeVisible();

      // Select Party D, Deal-Maker Archetype, and Unlock All
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('[data-testid="archetype-card-dealmaker"]').click();
      await expect(page.locator('[data-testid="newgame-archetype-preview"]')).toBeVisible();
      await page.locator('[data-testid="unlock-all-toggle"]').check();

      await assertNoOuterScroll('New Game with Archetype');
      await assertNoAxeViolations('New Game with Archetype');
      await page.screenshot({
        path: `.playwright-screenshots/v1/newgame-archetype-${vp.width}x${vp.height}.png`,
      });

      const startBtn = page.locator('button.stamp:has-text("Start the term")');
      await startBtn.click();

      // 2. Oval Office screen: SynergyBar & Task Force Draft launcher
      await expect(page.locator('.app')).toBeVisible();
      await expect(page.locator('[data-testid="synergy-bar"]')).toBeVisible();
      await expect(page.locator('[data-testid="open-perk-draft-btn"]')).toBeVisible();
      await assertNoOuterScroll('Oval Office with SynergyBar');
      await assertNoAxeViolations('Oval Office with SynergyBar');
      await page.screenshot({
        path: `.playwright-screenshots/v1/oval-synergy-${vp.width}x${vp.height}.png`,
      });

      // 3. Open PerkDraftModal, inspect 3 cards, pick an affordable card
      await page.locator('[data-testid="open-perk-draft-btn"]').click();
      await expect(page.locator('[data-testid="perk-draft-modal"]')).toBeVisible();
      await assertNoOuterScroll('PerkDraftModal Standard');
      await assertNoAxeViolations('PerkDraftModal Standard');
      await page.screenshot({
        path: `.playwright-screenshots/v1/perk-draft-standard-${vp.width}x${vp.height}.png`,
      });

      // Pick first card or skip for clout and close modal
      const firstSelectBtn = page.locator('[data-testid^="perk-pick-"]').first();
      if (await firstSelectBtn.isEnabled()) {
        await firstSelectBtn.click();
      } else {
        await page.locator('[data-testid="perk-skip-btn"]').click();
      }
      await page.locator('[data-testid="perk-close-btn"]').click();
      await expect(page.locator('[data-testid="perk-draft-modal"]')).not.toBeVisible();

      // 4. Check Powers screen Doctrine tags
      await page.locator('button.tab:has-text("Your Powers")').click();
      await expect(page.locator('[data-testid^="eo-doctrine-"]').first()).toBeVisible();
      await assertNoOuterScroll('Powers with Doctrine Badges');
      await page.screenshot({
        path: `.playwright-screenshots/v1/powers-${vp.width}x${vp.height}.png`,
      });

      // 5. Check Trade screen Doctrine tags
      await page.locator('button.tab:has-text("Trade")').click();
      await expect(page.locator('[data-testid^="trade-doctrine-"]').first()).toBeVisible();
      await assertNoOuterScroll('Trade with Doctrine Badges');

      // 6. Advance to Turn 2 and verify TurnReport with SynergyBar
      await page.locator('button.tab:has-text("Oval Office")').click();
      // Resolve crisis if active on Turn 1
      const crisisOpt = page.locator('.crisis-options button.opt').first();
      if (await crisisOpt.isVisible()) {
        await crisisOpt.click();
      }
      await page.locator('button.stamp:has-text("Next turn")').click();
      await expect(page.locator('div[role="dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="synergy-bar"]').first()).toBeVisible();
      await assertNoOuterScroll('TurnReport with SynergyBar');
      await page.screenshot({
        path: `.playwright-screenshots/v1/turn-report-synergy-${vp.width}x${vp.height}.png`,
      });
    });
  }

  test('verifies Evil Mode Heist Relic dark-market draft skin at 1280x720 (HEIST-01, HEIST-02)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.locator('input[name="party"][value="R"]').check();
    await page.locator('[data-testid="evil-mode-toggle"]').check();
    await page.locator('[data-testid="archetype-card-insider"]').click();
    await page.locator('button.stamp:has-text("Seize power")').click();

    await expect(page.locator('[data-testid="open-perk-draft-btn"]')).toBeVisible();
    await page.screenshot({
      path: '.playwright-screenshots/v1/oval-evil-1280x720.png',
    });
    await page.locator('[data-testid="open-perk-draft-btn"]').click();
    await expect(page.locator('[data-testid="perk-draft-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="perk-draft-modal"]')).toHaveClass(/evil-draft-skin/);
    await page.screenshot({
      path: '.playwright-screenshots/v1/perk-draft-evil-1280x720.png',
    });
  });
});
