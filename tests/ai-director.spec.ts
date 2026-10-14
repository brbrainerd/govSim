import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const VIEWPORTS = [
  { width: 1376, height: 768, name: '1376x768' },
  { width: 1280, height: 720, name: '1280x720' },
];

const MOCK_MODELS_RESPONSE = {
  data: [
    { id: 'meta-llama/llama-3.3-70b-instruct:free', pricing: { prompt: '0', completion: '0' } },
    { id: 'google/gemma-3-27b-it:free', pricing: { prompt: 0, completion: 0 } },
    { id: 'qwen/qwen3-32b:free', pricing: { prompt: '0', completion: '0' } },
    { id: 'deepseek/deepseek-chat-v3-0324:free', pricing: { prompt: '0', completion: '0' } },
    { id: 'openai/gpt-4o', pricing: { prompt: '0.005', completion: '0.015' } },
  ],
};

const MOCK_CHAT_RESPONSE = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          advisorBubble: "Port negotiations have stalled. Shippers are queuing outside Long Beach.",
          chyron: "PACIFIC SHIPPING BOTTLENECKS THREATEN CONSUMER INVENTORY",
          turnHeadline: "Quarterly Supply Chain Standoff",
          turnDetail: "West Coast terminal volumes dip 12% as shipping surcharges rise.",
          dynamicCrisis: {
            id: "pacific_port_strike",
            title: "Pacific Maritime Logistics Gridlock",
            summary: "Container terminals on the West Coast face sudden dockside labor actions.",
            category: "economic",
            options: [
              {
                label: "Order Federal Maritime Arbitration",
                detail: "Dispatch emergency mediation board to expedite container movement.",
                cloutCost: 15,
                gapDelta: 0.25,
                infDelta: -0.15,
                approvalDelta: 3,
                trustDelta: 2,
              },
              {
                label: "Allow Carrier Self-Correction",
                detail: "Let shipping markets absorb demurrage fees naturally without federal intervention.",
                cloutCost: 0,
                gapDelta: -0.3,
                infDelta: 0.15,
                approvalDelta: -2,
                trustDelta: -1,
              },
            ],
          },
        }),
      },
    },
  ],
};

test.describe('Phase 29: Free AI Director, OpenRouter :free Auto-Routing & Living World Variance (AI-01..04)', () => {
  test('Living World toggle in NewGame, AI Settings modal, OpenRouter free discovery, and dynamic crisis staging', async ({ page }) => {
    mkdirSync('.planning/phases/29-free-ai-director-openrouter-free-auto-routing-living-world-variance/screenshots', { recursive: true });

    // Mock OpenRouter endpoints
    await page.route('https://openrouter.ai/api/v1/models', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_MODELS_RESPONSE),
      });
    });

    await page.route('https://openrouter.ai/api/v1/chat/completions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHAT_RESPONSE),
      });
    });

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // 1. NewGame screen: Living World toggle
      const lwToggle = page.locator('[data-testid="living-world-toggle"]');
      await expect(lwToggle).toBeVisible();
      await lwToggle.check();
      expect(await lwToggle.isChecked()).toBe(true);

      // Start game
      await page.locator('input[name="party"][value="D"]').check();
      await page.locator('button.stamp:has-text("Start the term")').click();
      await expect(page.locator('.app')).toBeVisible();

      // 2. Open AI Settings Modal from Rail
      const aiNavBtn = page.locator('[data-testid="nav-ai-settings-btn"]');
      await expect(aiNavBtn).toBeVisible();
      await aiNavBtn.click();

      const aiModal = page.locator('[data-testid="ai-settings-modal"]');
      await expect(aiModal).toBeVisible();

      // Accessibility audit on AI Settings Modal
      const axeResults = await new AxeBuilder({ page })
        .include('[data-testid="ai-settings-modal"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const serious = axeResults.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(serious).toEqual([]);

      // Select OpenRouter Free
      const providerSelect = page.locator('[data-testid="ai-provider-select"]');
      await providerSelect.selectOption('openrouter_free');

      // Click Discover Live :free Models
      const discoverBtn = page.locator('[data-testid="discover-free-models-btn"]');
      await expect(discoverBtn).toBeVisible();
      await discoverBtn.click();

      // Model select should contain discovered free models
      const modelSelect = page.locator('[data-testid="ai-model-select"]');
      await expect(modelSelect).toContainText('meta-llama/llama-3.3-70b-instruct:free');

      // Save AI Settings
      await page.locator('[data-testid="save-ai-settings-btn"]').click();
      await expect(aiModal).not.toBeVisible();

      // 3. Trigger or inspect AI Director on OvalOffice
      const triggerBtn = page.locator('[data-testid="trigger-ai-crisis-btn"]');
      await expect(triggerBtn).toBeVisible();
      await triggerBtn.click();

      // Verify AI Director badge and dynamic crisis modal
      const crisisModal = page.locator('[data-testid="dynamic-crisis-modal"]');
      await expect(crisisModal).toBeVisible();

      // Verify crisis content
      await expect(page.locator('.crisis-headline')).toContainText('Pacific Maritime Logistics Gridlock');
      const opt1 = page.locator('[data-testid="crisis-option-opt_1"]');
      const opt2 = page.locator('[data-testid="crisis-option-opt_2"]');
      await expect(opt1).toBeVisible();
      await expect(opt2).toBeVisible();

      // Choose Option 1 and stage response
      await opt1.click();
      await page.locator('[data-testid="decide-crisis-btn"]').click();
      await expect(crisisModal).not.toBeVisible();

      // Verify AI badge and chyron on OvalOffice
      await expect(page.locator('[data-testid="ai-director-badge"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="oval-news-chyron"]')).toContainText(
        'PACIFIC SHIPPING BOTTLENECKS THREATEN CONSUMER INVENTORY',
      );

      // Verify staged action badge in StatusBar
      const stagedPill = page.locator('[data-testid="staged-decisions-pill"]');
      await expect(stagedPill).toBeVisible();
      await expect(stagedPill).toContainText('staged');

      // 4. Zero viewport scrolling
      const scrollCheck = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));
      expect(scrollCheck.scrollWidth).toBeLessThanOrEqual(scrollCheck.clientWidth + 1);
      expect(scrollCheck.scrollHeight).toBeLessThanOrEqual(scrollCheck.clientHeight + 1);

      await page.screenshot({
        path: `.planning/phases/29-free-ai-director-openrouter-free-auto-routing-living-world-variance/screenshots/ai-director-${vp.name}.png`,
        fullPage: true,
      });
    }
  });
});
