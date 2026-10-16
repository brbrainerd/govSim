# Phase 38: Presidential Trade-Off Balance Audit, Readability Gate & Multi-Viewport Verification - Context

**Gathered:** 2026-10-16
**Status:** Ready for planning
**Mode:** Autonomous

<domain>
## Phase Boundary

Audit and verify that every presidential policy lever across Budget, Social, Orders, Trade, Foreign Policy, Congress, and Reforms has a genuine felt upside AND a counterbalancing catch aligned with its surfaced `👍 / ⚠️` UI badges (`BAL-01`), and verify Flesch-Kincaid readability (`<= 9.0`), zero outer viewport scrolling (`1376×768` and `1280×720`) in both `Plain Talk` and `Policy Wonk` modes, 0 axe accessibility violations, and 8/8 cross-browser determinism (`BAL-02`).

</domain>

<decisions>
## Implementation Decisions

### Balance & Trade-Off Alignment Audit (BAL-01)
- Verify via automated unit tests (`src/engine/balance.test.ts` and `src/content/tradeoffs.test.ts`) that:
  - Every budget lever, social lever, executive order, sector tariff, trade agreement, sanction, defense posture, foreign aid level, congressional deal, filibuster rule, judicial reform, and constitutional amendment has both a non-empty `upside` and `catchText` in `src/content/tradeoffs.ts` and that underlying engine mechanics reflect genuine trade-offs (no "free lunch" lever).
  - The 100-seed Monte Carlo balance harness passes (`sensible - nothing` mean prosperity delta in `[2, 10]`, party neutrality `<= 5 pp`).

### Readability, Multi-Viewport Zero-Scroll & Accessibility Gate (BAL-02)
- Extend `src/testing/content-gates.test.ts` (or `src/content/tradeoffs.test.ts`) so all new Plain-Talk copy (`GLOSSARY`, `TRADEOFFS`, `ORDERS_CATALOG`, `SOCIAL_CATALOG`, `SECTOR_TARIFFS_CATALOG`, `TRADE_AGREEMENTS_CATALOG`) is verified against the Flesch-Kincaid reading grade `<= 9.0` gate and nonpartisan lint rules (`GR-20`, `GR-21`).
- Create `tests/plain-talk-clarity.spec.ts` to run headless Playwright verification across both `1376×768` and `1280×720` viewports in both `🗣️ Plain Talk` and `📜 Policy Wonk` modes:
  - Verify the vocabulary toggle in `NewGame.svelte` and `StatusBar.svelte`.
  - Verify `<TradeoffPill>` and Plain-Talk / Policy Wonk switching across `OvalOffice`, `Budget`, `Congress`, `Powers`, `Trade`, `Economy`, and `Voters`.
  - Assert zero outer page scroll (`document.documentElement.scrollHeight <= document.documentElement.clientHeight + 1`) and capture verification screenshots across screens and viewports.
  - Assert 0 serious/critical axe-core accessibility violations in both vocabulary modes.
- Run `pnpm guard`, `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm determinism`.
</decisions>
