import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768, name: '1376x768' },
  { width: 1280, height: 720, name: '1280x720' },
];

test.describe('Phase 28: Show Your Work Model Inspector & Citation Audit (MODEL-01, MODEL-02)', () => {
  test('opens from Economy and AboutModal, filters by domain and search, handles Escape cleanly', async ({ page }) => {
    mkdirSync('.planning/phases/28-show-your-work-model-inspector-citation-audit/screenshots', { recursive: true });

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Start standard game
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('button.stamp:has-text("Start the term")').click();
      await expect(page.locator('.app')).toBeVisible();

      // 1. Navigate to Economy
      await page.locator('nav button:has-text("Economy")').click();
      const openBtn = page.locator('[data-testid="open-model-inspector-btn"]');
      await expect(openBtn).toBeVisible();
      await expect(openBtn).toContainText('Show your work');

      // 2. Open Model Inspector
      await openBtn.click();
      const modal = page.locator('[data-testid="model-inspector-modal"]');
      await expect(modal).toBeVisible();

      // Header, stats, and search input
      await expect(page.locator('.inspector-title')).toContainText('Economic Model & Equation Inspector');
      const searchInput = page.locator('[data-testid="model-search-input"]');
      await expect(searchInput).toBeVisible();

      // Equation cards visible
      const eqCards = page.locator('[data-testid="model-equation-card"]');
      await expect(eqCards.first()).toBeVisible();
      expect(await eqCards.count()).toBeGreaterThanOrEqual(1);

      // Parameter cards visible
      const cards = page.locator('[data-testid="model-entry-card"]');
      const initialCount = await cards.count();
      expect(initialCount).toBeGreaterThanOrEqual(100);

      // 3. Accessibility audit on open inspector
      const axeResults = await new AxeBuilder({ page })
        .include('[data-testid="model-inspector-modal"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const serious = axeResults.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(serious).toEqual([]);

      // 4. Zero outer viewport scrolling
      const scrollCheck = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollCheck.scrollHeight).toBeLessThanOrEqual(scrollCheck.clientHeight + 1);
      expect(scrollCheck.scrollWidth).toBeLessThanOrEqual(scrollCheck.clientWidth + 1);

      // 5. Test domain filter
      await page.locator('[data-testid="model-domain-macro"]').click();
      const macroCount = await cards.count();
      expect(macroCount).toBeLessThan(initialCount);
      expect(macroCount).toBeGreaterThan(15);

      // 6. Test text search
      await searchInput.fill('okun');
      await expect(page.locator('[data-testid="model-result-count"]')).toContainText('Showing');
      const filteredCards = page.locator('[data-testid="model-entry-card"]');
      const filteredCount = await filteredCards.count();
      expect(filteredCount).toBeGreaterThanOrEqual(1);
      await expect(filteredCards.first()).toContainText('Okun');

      // Screenshot filtered state
      await page.screenshot({
        path: `.planning/phases/28-show-your-work-model-inspector-citation-audit/screenshots/inspector-filtered-${vp.name}.png`,
      });

      // Clear search
      await searchInput.fill('');
      await page.locator('[data-testid="model-domain-all"]').click();

      // Screenshot full catalog
      await page.screenshot({
        path: `.planning/phases/28-show-your-work-model-inspector-citation-audit/screenshots/inspector-full-${vp.name}.png`,
      });

      // 7. Escape closes the modal
      await page.keyboard.press('Escape');
      await expect(modal).toHaveCount(0);

      // 8. Open from AboutModal
      const aboutBtn = page.locator('[data-testid="nav-about-btn"]');
      await expect(aboutBtn).toBeVisible();
      await aboutBtn.click();

      const aboutModal = page.locator('[data-testid="about-modal"]');
      await expect(aboutModal).toBeVisible();

      const aboutInspectorBtn = page.locator('[data-testid="about-model-inspector-btn"]');
      await expect(aboutInspectorBtn).toBeVisible();
      await aboutInspectorBtn.click();

      // AboutModal closed and ModelInspectorModal opened
      await expect(aboutModal).toHaveCount(0);
      await expect(modal).toBeVisible();

      // Close using footer button
      await page.locator('[data-testid="model-inspector-close-btn"]').click();
      await expect(modal).toHaveCount(0);

      // Clear state for next loop
      await page.evaluate(() => localStorage.clear());
    }
  });
});
