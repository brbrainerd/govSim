# Phase 2 Research: Saves, Guardrails & Continuous Deploy

**Phase:** 02-saves-guardrails-continuous-deploy  
**Researched:** 2026-10-12  
**Target Requirements:** OBS-01, OBS-02, OBS-03, OBS-04, OBS-05, OBS-06, OBS-07, OBS-08, REL-05, REL-06  

---

## 1. Findings & Technical Contracts

### 1.1 Save File & Persistence Architecture (OBS-01, OBS-02, GR-31, GR-34)
* **Design SSOT:** Saves are input logs, not state snapshots.
* **Schema Contract:**
  ```ts
  interface SaveFile {
    format: 'govsim';
    v: 1;
    engine: '0.2';
    seed: number;
    start: BaselineYearData;
    options: { party: 'D' | 'R' };
    inputs: Decisions[];
    check: string; // Murmur3 hash of the end-state
  }
  ```
* **Trust Boundary Validation (`parseSave`):**
  - Payload size cap: max 1 MB JSON.
  - Required top-level keys checked.
  - Numbers must be finite integers where expected (seed, turns, etc.).
  - Action IDs and lever values must be strictly within registered `LIMITS` and `spendLevers` / `taxLevers`.
  - Replay end state hash must match `check`. If corrupted or tampered, throw a descriptive, safe error without crashing.
* **Browser Persistence:**
  - Save to `localStorage['govsim_autosave']` at the start of each turn.
  - Call `navigator.storage?.persist?.()` to request durable storage against Safari's 7-day eviction policy (GR-34).
  - Export generates `.json` blob download; Import uses a `<input type="file" accept=".json">`.

### 1.2 Property Testing & Invariants (OBS-03)
* **Library:** `fast-check` (pinned exact version).
* **Properties Tested:**
  - Determinism: `newGame(seed)` + same inputs => identical state hash on every iteration.
  - Arithmetic invariants: No NaN, no Infinity, all indicators remain strictly within `LIMITS` across random action sequences and negative/extreme int32 seeds.
  - Conservation: Trace ledgers conserve across 1,000 randomized turn steps.

### 1.3 Zero-Telemetry & CSP Enforcement (OBS-04)
* **Build-time CSP header / meta:**
  `default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://*.r2.cloudflarestorage.com;`
* **Automated Egress Audit:** Playwright network listener asserting zero outbound HTTP requests outside `'self'` and asset host during full game playthrough.
* **Source Scan:** Static analysis checking for banned analytics tokens (`google-analytics`, `gtag`, `sentry`, `posthog`, `amplitude`, `mixpanel`).

### 1.4 Content & Readability Gates (OBS-05, GR-24, GR-25)
* **Readability Gate:**
  - Automated check over all UI text strings in `src/content/`:
  - Flesch-Kincaid reading grade ≤ 9.0.
  - Sentence length ≤ 20 words.
* **Neutrality & Civics Gate:**
  - Deny-list for real officeholder and living political figure names.
  - Party names restricted strictly to allowlist (`src/content/parties.ts`).
  - Civic claims must include valid, opened citation URLs.

### 1.5 Balance Report & Drift Guard (OBS-06, GR-35, GR-36)
* **Committed File:** `balance-report.json`.
* **Metrics Tracked:**
  - 100 seeds × 4 benchmark strategies (Autopilot, Balanced Sensible, Max Deficit, Max Austerity).
  - Asserts Sensible play beats doing nothing by +2.0 to +10.0 index points.
  - Asserts every slider lever moves the score by a non-zero margin.
* **CI Invariant:** Any change to `balance-report.json` without an explicit rationale in the commit fails CI.

### 1.6 E2E, Axe Accessibility & Screenshot Baselines (OBS-07, D6)
* **Tooling:** Playwright + `@axe-core/playwright`.
* **Axe Scope:** Run accessibility scan on New Game, Oval Office, Budget, Congress. Zero serious or critical violations.
* **Keyboard Navigation:** Playwright test executing 1 full turn exclusively using keyboard keystrokes (`Tab`, `Enter`, `Space`, Arrows).
* **Screenshot Baselines:** Rendered inside official Docker image `mcr.microsoft.com/playwright:v1.64.0-noble` to prevent cross-OS font rendering differences.

### 1.7 Continuous Deployment via Coolify & GHCR (REL-05, REL-06)
* **Design Patterns:** Modeled after `ramada` and `gigme`.
* **Decisions Made:**
  - Branch: `master` is the default deployment branch.
  - GitHub-hosted runners (`ubuntu-latest`) for CI and Docker builds.
  - Trigger: Webhook or HTTPS API call to Coolify with SHA-pinned image tag.
  - Health endpoint: Docker image serves `/api/health` returning `200 {"ok":true}`.
  - Deployed to unlisted private subdomain on owned domain.
  - Coolify deploy kit scripts vendored in `scripts/ci/`.
