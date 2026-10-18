import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768, name: '1376x768' },
  { width: 1280, height: 720, name: '1280x720' },
];

test.describe('Phase 21: Complete Learn Loop & Interactive Explainers (LEARN-01..03)', () => {
  test('Oval Office, Economy, Budget, and Trade Learn strips & suggestion modal triggers', async ({ page }) => {
    mkdirSync('.planning/phases/21-complete-learn-loop-explainers/screenshots', { recursive: true });

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('button.stamp:has-text("Start the term")').click();
      await expect(page.locator('.app')).toBeVisible();

      // 1. Oval Office: How it works explainer (+1 Clout curiosity bonus)
      const howBtn = page.locator('[data-testid="how-it-works-btn"]');
      await expect(howBtn).toBeEnabled();
      await howBtn.click();

      const explainerModal = page.locator('[data-testid="explainer-modal"]');
      await expect(explainerModal).toBeVisible();
      await expect(explainerModal).toContainText('How the Presidency works');
      await expect(page.locator('[data-testid="explainer-got-it-btn"]')).toContainText('+1 CLOUT');

      const axeExplainer = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const seriousExplainer = axeExplainer.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(seriousExplainer).toEqual([]);

      await page.screenshot({
        path: `.planning/phases/21-complete-learn-loop-explainers/screenshots/oval-explainer-${vp.name}.png`,
      });

      await page.locator('[data-testid="explainer-got-it-btn"]').click();
      await expect(explainerModal).toHaveCount(0);

      // 2. Oval Office Chief of Staff "Find out" suggestion button opens MythModal (LEARN-03)
      const findOutBtn = page.locator('.card.option button.btn:has-text("Find out")');
      await expect(findOutBtn).toBeVisible();
      await findOutBtn.click();
      await expect(page.locator('.myth-modal-content')).toBeVisible();
      await expect(page.locator('[data-testid="myth-soundbite"]')).toBeVisible();
      await expect(page.locator('[data-testid="myth-next-btn"]')).toBeVisible();
      const firstQuote = await page.locator('.myth-quote').textContent();
      await page.locator('[data-testid="myth-next-btn"]').click();
      await expect(page.locator('.myth-quote')).not.toHaveText(firstQuote ?? '');
      await page.locator('.myth-modal-content .close-link').click();
      await expect(page.locator('.myth-modal-content')).toHaveCount(0);

      // 3. Economy screen: How it works + supply_side_taxes myth + Pressure the Fed
      await page.locator('nav button:has-text("Economy")').click();
      await expect(page.locator('[data-testid="how-it-works-btn"]')).toBeEnabled();
      await page.locator('[data-testid="how-it-works-btn"]').click();
      await expect(explainerModal).toContainText('How the economy works');
      await page.locator('[data-testid="explainer-got-it-btn"]').click();

      const taxMythBtn = page.locator('button.ticket:has-text("Myth? Lower taxes boost growth?")');
      await expect(taxMythBtn).toBeEnabled();
      await taxMythBtn.click();
      await expect(page.locator('.myth-modal-content')).toContainText('Cutting tax rates always grows the economy');
      await page.locator('.myth-modal-content .close-link').click();

      // 4. Budget screen: How a budget becomes law explainer + live Congress whip preview
      await page.locator('nav button:has-text("Budget")').click();
      await expect(page.locator('[data-testid="budget-whip-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="how-it-works-btn"]')).toBeEnabled();
      await page.locator('[data-testid="how-it-works-btn"]').click();
      await expect(explainerModal).toContainText('How a budget becomes law');
      await page.locator('[data-testid="explainer-got-it-btn"]').click();

      // Advance to Turn 2 so Trade & Tariffs unlocks in the rail
      await page.locator('button:has-text("Next turn")').click();
      await page.locator('button:has-text("Continue term")').click();
      const crisisClose = page.locator('[aria-label="Close modal"]');
      if (await crisisClose.isVisible()) {
        await crisisClose.click();
      }

      // 5. Trade screen: Learn strip with explainer and trade_deficits myth (LEARN-02)
      await page.locator('nav button:has-text("Trade")').click();
      await expect(page.locator('[data-testid="how-it-works-btn"]')).toBeVisible();
      await page.locator('[data-testid="how-it-works-btn"]').click();
      await expect(explainerModal).toContainText('How tariffs and trade work');
      await page.locator('[data-testid="explainer-got-it-btn"]').click();

      const tradeMythBtn = page.locator('button.ticket:has-text("Myth? Foreign nations pay tariffs?")');
      await expect(tradeMythBtn).toBeVisible();
      await tradeMythBtn.click();
      await expect(page.locator('.myth-modal-content')).toContainText('Foreign states pay the tariffs');

      await page.screenshot({
        path: `.planning/phases/21-complete-learn-loop-explainers/screenshots/trade-myth-${vp.name}.png`,
      });
      await page.locator('.myth-modal-content .close-link').click();

      // Clear localStorage before next viewport loop
      await page.evaluate(() => localStorage.clear());
    }
  });

  test('Phase 33: Debunk vs. Spin choice in MythModal, staged tray, and Civic Mastery Dossier (SPIN-01, SPIN-02)', async ({ page }) => {
    mkdirSync('.planning/phases/33-debunk-vs-spin-gameplay-mechanics-endscreen-civic-dossier/screenshots', { recursive: true });

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('button.stamp:has-text("Start the term")').click();
      await expect(page.locator('.app')).toBeVisible();

      // 1. Economy Mirage Lever -> Debunk vs. Spin choice
      await page.locator('nav button:has-text("Economy")').click();
      const mirageBtn = page.locator('[data-testid="mirage-lever-economy"]');
      await expect(mirageBtn).toBeVisible();
      await mirageBtn.click();

      const modal = page.locator('.myth-modal-content');
      await expect(modal).toBeVisible();
      const spinBtn = page.locator('[data-testid="spin-myth-btn"]');
      const debunkBtn = page.locator('[data-testid="debunk-myth-btn"]');
      await expect(spinBtn).toBeVisible();
      await expect(spinBtn).toContainText('SPIN THIS MYTH');
      await expect(debunkBtn).toBeVisible();
      await expect(debunkBtn).toContainText('DEBUNK MYTH (+5 CLOUT)');

      // A11y audit on MythModal with both buttons
      const a11yModal = await new AxeBuilder({ page })
        .include('.myth-modal-content')
        .analyze();
      expect(a11yModal.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);

      await page.screenshot({
        path: `.planning/phases/33-debunk-vs-spin-gameplay-mechanics-endscreen-civic-dossier/screenshots/myth-debunk-vs-spin-${vp.name}.png`,
      });

      // 2. Click "Spin This Myth"
      await spinBtn.click();
      await expect(modal).toHaveCount(0);

      // Verify staged decisions tray reflects the choice
      const stagedPill = page.locator('[data-testid="staged-decisions-pill"]');
      await expect(stagedPill).toBeVisible();
      await expect(stagedPill).toContainText('1 staged');

      // 3. Advance turn to commit the spin
      await page.locator('button.stamp:has-text("Next turn")').click();
      await page.locator('button.stamp:has-text("Continue term")').click();

      const crisisClose = page.locator('[aria-label="Close modal"]');
      if (await crisisClose.isVisible()) {
        await crisisClose.click();
      }

      // 4. Budget screen -> Debunk foreign aid myth for Clout
      await page.locator('nav button:has-text("Budget")').click();
      const budgetMirageBtn = page.locator('[data-testid="mirage-lever-budget"]');
      await expect(budgetMirageBtn).toBeVisible();
      await budgetMirageBtn.click();
      await expect(modal).toBeVisible();

      await modal.locator('[data-testid="debunk-myth-btn"]').click();
      await expect(modal).toHaveCount(0);

      // Advance turn again to commit the debunk
      await page.locator('button.stamp:has-text("Next turn")').click();
      await page.locator('button.stamp:has-text("Continue term")').click();

      if (await crisisClose.isVisible()) {
        await crisisClose.click();
      }

      // Zero outer viewport scroll during gameplay
      const overflowGame = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));
      expect(overflowGame.scrollHeight).toBeLessThanOrEqual(overflowGame.clientHeight + 1);

      await page.evaluate(() => localStorage.clear());
    }
  });

  test('Phase 33: Civic Mastery Dossier on EndScreen after term end (SPIN-02)', async ({ page }) => {
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('[data-testid="evil-mode-toggle"]').check();
      await page.locator('button.stamp:has-text("Seize power")').click();
      await expect(page.locator('.app')).toBeVisible();

      // 1. Spin interest_rates myth on Economy screen
      await page.locator('nav button:has-text("Economy")').click();
      await page.locator('[data-testid="mirage-lever-economy"]').click();
      await page.locator('[data-testid="spin-myth-btn"]').click();

      // 2. Stage evil directives to trigger rapid impeachment & conviction
      const powersTab = page.locator('.tab:has-text("Your Powers")');
      await powersTab.click();
      await page.locator('[data-testid="evil-lever-toggle-crony_contracts"]').click();
      await page.locator('[data-testid="evil-lever-toggle-auction_public_lands"]').click();
      await page.locator('[data-testid="evil-lever-toggle-sell_tariff_exemptions"]').click();
      await page.locator('[data-testid="evil-lever-toggle-solicit_library_donations"]').click();

      // Advance turn 1 -> 2
      await page.locator('button.stamp:has-text("Next turn")').click();
      await page.locator('button.stamp:has-text("Continue term")').click();

      // Stage more on turn 2 to cross conviction threshold
      await powersTab.click();
      await page.locator('[data-testid="evil-lever-toggle-crony_contracts"]').click();
      await page.locator('[data-testid="evil-lever-toggle-auction_public_lands"]').click();

      // Advance turn 2 -> 3: triggers impeachment modal
      await page.locator('button.stamp:has-text("Next turn")').click();
      const modal = page.locator('[data-testid="impeachment-modal"]');
      await expect(modal).toBeVisible();

      const termOverBtn = page.locator('button.stamp:has-text("Accept Verdict")');
      if (await termOverBtn.isVisible()) {
        await termOverBtn.click();
      } else {
        // If acquitted in first trial, advance one more turn to trigger conviction
        const acquitBtn = page.locator('button.stamp:has-text("Acknowledge Acquittal")');
        if (await acquitBtn.isVisible()) {
          await acquitBtn.click();
          await powersTab.click();
          await page.locator('[data-testid="evil-lever-toggle-crony_contracts"]').click();
          await page.locator('button.stamp:has-text("Next turn")').click();
          await expect(modal).toBeVisible();
          await page.locator('button.stamp:has-text("Accept Verdict")').click();
        }
      }

      // 3. Verify EndScreen is reached
      const endScreen = page.locator('[data-testid="end-screen"]');
      await expect(endScreen).toBeVisible();

      // 4. Open Civic Mastery Dossier tab (SPIN-02)
      const civicTab = page.locator('[data-testid="tab-civic-dossier"]');
      await expect(civicTab).toBeVisible();
      await civicTab.click();

      const civicPanel = page.locator('[data-testid="civic-dossier-panel"]');
      await expect(civicPanel).toBeVisible();
      await expect(civicPanel).toContainText('Civic Mastery Dossier');
      await expect(page.locator('[data-testid="stat-myths-spun"]')).toContainText('1');
      await expect(page.locator('[data-testid="stat-trust-impact"]')).toContainText('-1.5%');
      await expect(page.locator('[data-testid="civic-archetype-title"]')).toBeVisible();

      // Verify the spun myth has the spun badge
      const spunCard = page.locator('[data-testid="civic-myth-card-interest_rates"]');
      await expect(spunCard).toBeVisible();
      await expect(spunCard).toContainText('SPUN ON TV');

      // 5. Axe accessibility audit on the civic dossier panel
      const a11yDossier = await new AxeBuilder({ page })
        .include('[data-testid="civic-dossier-panel"]')
        .analyze();
      expect(a11yDossier.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);

      // Screenshot Civic Dossier
      await page.screenshot({
        path: `.planning/phases/33-debunk-vs-spin-gameplay-mechanics-endscreen-civic-dossier/screenshots/civic-dossier-${vp.name}.png`,
      });

      // Zero outer viewport scroll on EndScreen
      const overflowEnd = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));
      expect(overflowEnd.scrollHeight).toBeLessThanOrEqual(overflowEnd.clientHeight + 1);

      await page.evaluate(() => localStorage.clear());
    }
  });
});
