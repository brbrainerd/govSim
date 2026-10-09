# Stack Research

**Domain:** Static, open-source, privacy-first browser strategy/civics game (teens 14+), milestone v0.2 "Playable First Term"
**Researched:** 2026-10-09
**Confidence:** HIGH for versions and licenses (checked with `npm view` today). MEDIUM for library integration (Context7 plus the existing codebase). LOW-MEDIUM for the legal reading on minors (secondary web sources, not legal advice).

> Scope: only what v0.2 adds (events and report card, Economy, Voters, Your Powers, election night, legacy), plus the observability question. Svelte 5.57 / Vite 8 / TS 6 / vitest / tokens SSOT / `data/us-2026.json` are already validated and are not re-researched here.

## Headline

1. **v0.2 needs 4 new runtime packages**, and all 4 were already approved in design.md §9: `layerchart`, `us-atlas`, `topojson-client`, and `d3-geo`. Events, Electoral College, executive orders, courts, Fed chair and legacy are plain engine TypeScript. Do not add libraries for them.
2. **Observability is local and deterministic, not remote.** The engine is pure and seeded, so *a run log (seed + decisions) is a perfect replay*. That replay is the debugging tool, the bug-report payload, the "share your run" feature and the regression-test fixture.
3. **No telemetry and no remote error reporting in v0.2, and this is enforced technically.** A build-only CSP `connect-src 'none'` stops the browser from sending any data, even from a dependency. A Playwright egress test and a source-scan test keep the CSP from being loosened quietly. Collecting nothing removes the COPPA, GDPR-K and UK Children's Code questions for a mixed teen/classroom audience.
4. **Enforcement reuses the pattern already in the repo.** `src/app/screens.test.ts` already enforces token drift by scanning source in vitest. Extend that pattern instead of adding ESLint.

## Recommended Stack

### Core Technologies (new runtime deps for v0.2)

| Technology | Version | License | Purpose | Why Recommended |
|------------|---------|---------|---------|-----------------|
| `layerchart` | 2.6.0 (exact pin) | MIT | Economy screen: you-vs-autopilot line/area charts, 8 score sparklines, Fed rate | Built for Svelte 5 (peer `svelte ^5`). Since 2.0 it works with plain CSS, so Tailwind is not required (Context7, release notes). Minor versions have broken APIs before (D5), so pin exactly. **Use only on the Economy screen and lazy-load that screen**, because it lists about 30 d3/dagre deps. Tree-shaking must be proven by the bundle gate below. |
| `us-atlas` | 3.0.1 | ISC | `states-albers-10m.json`: 50 states + DC, already projected into a 975x610 viewBox | Already projected, so no projection math runs at runtime, and Alaska and Hawaii are already inset. About 29 KB gz (D6). |
| `topojson-client` | 3.1.0 | ISC | `feature(topology, topology.objects.states)` → GeoJSON | The standard 2-function decoder. It has no deps. |
| `d3-geo` | 3.1.1 | ISC | `geoPath()` with a **null projection** → SVG `d` strings | layerchart already depends on `^3.1.1`, so pnpm dedupes it and it costs no extra bytes. It still has to be a *direct* dep because pnpm's strict `node_modules` blocks imports of transitive packages. |

**Map decision (opinionated):** do **not** wrap the Voters map in LayerChart's `<Chart geo>`. The data is already projected, so the map is `<svg viewBox="0 0 975 610">` plus one `<path>` per state from `geoPath()(feature)`. That is about 15 lines and has no axes, scales or chart context. Each state path gets `tabindex="0"`, `role="button"`, `aria-label="Ohio, 17 electoral votes, leaning R by 4"`, a fill from a token **plus** a pattern or label so colour is not the only signal, and a sortable table fallback (design G10). Load the topology with `import('us-atlas/states-albers-10m.json')` inside the Voters screen chunk so it stays out of the initial bundle. Join on FIPS `id` with `data/us-2026.json` states, which already have `margin2024` and `electoralVotes` and a test asserting they sum to 538.

### Supporting Libraries (dev-only)

| Library | Version | License | Purpose | When to Use |
|---------|---------|---------|---------|-------------|
| `@playwright/test` | 1.64.0 | Apache-2.0 | E2E host for visual regression (`toHaveScreenshot`), axe, egress check, keyboard-only turn, interaction perf | Already planned in §9. It lands this milestone because v0.2 is the first time every screen is real. |
| `@axe-core/playwright` | 4.13.0 (bundles `axe-core ~4.13`) | **MPL-2.0** | WCAG 2.x A/AA automated audit per screen and per overlay | The de-facto standard, and the same engine Lighthouse uses. **It breaks the MIT/ISC/Apache/CC0 policy, so it needs a logged exception:** dev-only, never bundled, and MPL is file-level copyleft that does not reach govSim's code. No MIT-licensed tool of comparable quality exists. Do **not** also install `axe-core` 4.14 directly, because the wrapper pins `~4.13`. |
| `fast-check` | 4.10.2 | MIT | Property-based engine invariants: any seed × any legal decision sequence | The existing balance harness covers 5 scripted strategies. Random decision sequences are what find degenerate states in events, executive orders, courts and elections. |
| `@vitest/coverage-v8` | 5.0.3 (must equal `vitest`) | MIT | Coverage *thresholds* on `src/engine/**` | Turns "engine is well tested" into a failing gate. |
| `sharp` / `pixelmatch` | 0.35.5 / 8.0.0 | Apache-2.0 / ISC | Contact sheets and motion metrics for the rig pipeline (already decided) | Use `sharp().raw()` to decode PNGs for pixelmatch. Do **not** add `pngjs`. |
| Types | `@types/topojson-client` 3.1.5, `@types/d3-geo` 3.1.1 | MIT | Types for the map code | `@types/geojson` and `@types/topojson-specification` come in transitively. |

### Platform / stdlib features used instead of packages (no deps)

| Need | Use | Why not a package |
|------|-----|-------------------|
| Seeded events / crisis deck | The existing `nextRandom` (mulberry32) in `src/engine/game.ts`, with **per-stream, per-turn derived seeds** (see Patterns) | It already exists. `seedrandom` and similar add nothing. |
| Electoral College, swing states, election night | Pure engine functions over `states[].margin2024` + approval/economy swing; Svelte `Tween` for the election-night count-up | Domain logic. No library models this. |
| Run-code compression for share links | `CompressionStream('deflate-raw')` + base64url (Baseline since 2023) | Native API, so `lz-string`/`pako` are unnecessary. |
| Replay hashes | `node:crypto` in tests, `crypto.subtle.digest('SHA-256')` in the browser | Stdlib. |
| Bundle budget | A ~20-line `scripts/budget.mjs` using `node:zlib` | Fewer deps than `size-limit` 14.2 and easy to read. |
| License gate | `pnpm licenses list --json` (verified working on pnpm 12.9.1) + a ~15-line script | Built into pnpm. Runs locally and in CI. |
| Error capture | `window` `error` / `unhandledrejection` listeners + Svelte 5 `<svelte:boundary onerror>` per screen | Native. See section (c). |
| Interaction timing | `performance.mark/measure` around Next turn | Native and almost free. Playwright reads the marks. |
| Save / run-log import validation | A hand-written `parseRunLog(unknown)` that checks each decision against the existing lever/EO content tables (ids exist, values within min/max) | This is a trust boundary (URL hashes come from strangers). Validating against the SSOT content tables is stricter than a generic schema and does not duplicate it. Consider `valibot` 1.5.0 (MIT) only if decision shapes grow past about 5 kinds. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `svelte-check --fail-on-warnings` | Makes Svelte's built-in compiler a11y warnings (`a11y_click_events_have_key_events`, `a11y_no_static_element_interactions`, missing `alt`/labels…) fail the build | The flag exists in 4.7.6 (verified with `--help`). No new dep, and it catches problems before axe ever runs. |
| Playwright Docker image `mcr.microsoft.com/playwright:v1.64.0-noble` | **The only place screenshot baselines are created and compared** | Font rendering on macOS and Linux differs. Baselines made on a Mac fail in CI. Locally, run `docker run … pnpm test:e2e --update-snapshots`. The image tag must match `@playwright/test` exactly. |
| GitHub branch protection (repo setting) | Makes the CI jobs *required* checks on `master` | This is a manual one-time setting, and without it every gate below is only advisory. |

## Installation

```bash
# Runtime (v0.2)
pnpm add -E layerchart@2.6.0 us-atlas@3.0.1 topojson-client@3.1.0 d3-geo@3.1.1

# Dev
pnpm add -DE @playwright/test@1.64.0 @axe-core/playwright@4.13.0 fast-check@4.10.2 \
  @vitest/coverage-v8@5.0.3 sharp@0.35.5 pixelmatch@8.0.0 \
  @types/topojson-client@3.1.5 @types/d3-geo@3.1.1
```

`pnpm-workspace.yaml` already sets a `minimumReleaseAge` exclusion list. `layerchart@2.6.0` was published 2026-10-08T17:14Z and `@playwright/test@1.64.0` on 2026-10-07. If install refuses them, either wait or add them to `minimumReleaseAgeExclude` the same way `vite@8.3.4` was added. Do not float the version.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Hand-rolled SVG map (topojson-client + d3-geo) | LayerChart `<Chart geo={{ projection: geoIdentity }}>` + `<GeoPath>` | If the map needs zoom/pan, tooltips coordinated with charts, or a scale legend (`GeoLegend referenceScale` supports pre-projected data). It is not needed for a 51-shape choropleth. |
| Build-time-free runtime `geoPath` | Precompute `{fips: d}` path strings in a script | Only if the bundle gate shows topojson-client + d3-geo pushing the Voters chunk over budget. That is unlikely because d3-geo is already shared with layerchart. |
| Source-scan vitest tests | ESLint 10.12 + `eslint-plugin-svelte` 3.23.1 + `typescript-eslint` 8.71.1 | Use these once you need *AST-aware* rules (for example "no `$effect` in screens") or autofix. Note that typescript-eslint 8.71 peers `typescript <6.1`. That is fine today, but it becomes a fourth package holding back the TS 7 upgrade, next to svelte-check. |
| Playwright timing marks + bundle gate | Lighthouse CI (`@lhci/cli` 0.15.1, Apache-2.0) | Add it if load performance on low-end school Chromebooks becomes a reported problem. Before that it means more Chrome downloads and flakier runs for a ~45 KB-gz app. |
| Hand-written run-log validator | `valibot` 1.5.0 / `zod` 4.6.5 | If import surfaces multiply (saves, mods, scenario files). |
| No remote telemetry (v0.2) | GoatCounter hosted (cookieless, free for non-commercial, EUPL server) with **opt-in, off-by-default**, coarse custom events only | Only if playtest data from shared runs proves insufficient. It would also need a privacy notice, a settings toggle, CSP `connect-src https://<code>.goatcounter.com`, and the egress test allowlist updated in the same PR. Re-evaluate if monetization makes the project commercial, since the free tier is non-commercial only. |
| No remote error reporting | `@sentry/svelte` 11.6.0 (MIT SDK, free Developer plan ~5k errors/mo per secondary sources) | Only with an adult-only audience or a documented legal basis: `sendDefaultPii: false`, opt-in, and `beforeSend` scrubbing. Not for v0.2. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| PostHog (cloud or self-host), Google Analytics, Hotjar, any session replay | Cookies, persistent IDs and person profiles by default, and session replay records minors' behaviour. Self-hosting PostHog needs a heavy server, which breaks the no-backend constraint. | Local run logs + voluntary "share your run" |
| OpenTelemetry Web SDK | Built for distributed tracing of services. It needs a collector backend, adds a large SDK, and a single-player game has no service traces. | `performance.mark` + deterministic replay |
| Umami / Plausible CE self-host | Each needs a server and database (Plausible CE is AGPL). That breaks "static, no backend". | Nothing (v0.2). GoatCounter hosted, opt-in, only if ever justified. |
| GlitchTip self-host | Needs Postgres + Redis + a server. | Local error ring buffer + "Report a problem" |
| Sentry in v0.2 | The ingest endpoint receives IP and user agent per request even with the PII flag off, and it is a third-party processor for a minors-heavy audience. It also forces the CSP open. | Same as above |
| `Math.random`, `Date.now`, `crypto.getRandomValues` inside `src/engine` | They break determinism, and therefore replay, golden tests and autopilot fairness | Seeded streams from `nextRandom` |
| `seedrandom`, `lz-string`, `pako`, `pngjs`, `size-limit`, `bundlesize` | Each duplicates something that already exists in the repo, stdlib or platform (see the table above) | The listed native or existing options |
| `axe-core` as a direct dep | Version skew with the `~4.13` pin in `@axe-core/playwright` | Let the wrapper bring it in |
| Screenshot baselines generated on macOS | Font antialiasing differs, so CI fails permanently | The Playwright Docker image only |
| Phaser/PixiJS/ECharts/GSAP/Rive | Already rejected in design.md §9 | Unchanged |

## Stack Patterns by Variant

**Seeded events that are identical for autopilot (most important engine pattern for v0.2):**
- Today `step()` draws exactly 3 normals per turn from one `state.rng` stream. That works only because both runs draw the same count. Events break this. A crisis that triggers an extra draw (severity, a decision-modal outcome, a court ruling) shifts every later macro shock, and the player and autopilot timelines then diverge for reasons that are not the player's policy.
- Use **counter-based substreams**. Derive `rngFor(seed, turn, stream)` with `stream ∈ {'macro','events','courts','election','voters'}` by hashing (a few lines of integer mixing, mulberry32 again) instead of threading one state forward. Policy may change event *probabilities*, but compare them against the *same uniform draw* (common random numbers). This keeps "same seed, same crises" true by construction and makes the score difference reflect the player's skill.
- This is a breaking change to golden outcomes. Do it in the first v0.2 phase, before the replay snapshots are created.

**Run log = replay = share code = bug report:**
- `RunLog = { v: 1, engine: ENGINE_VERSION, data: DATA_HASH, seed, decisions: Decisions[] }`. `Session.endTurn` appends the decisions it already builds. `replay(log)` folds `endTurn`.
- Share/bug code: `base64url(deflate-raw(JSON))`, carried in `#run=…`. Cap the encoded length (for example 16 KB) and stop decompressing past 256 KB so a crafted code cannot act as a decompression bomb. Then `parseRunLog` → replay. If `engine`/`data` differ from the build, show "made with an older version" instead of replaying silently.

**Production-only CSP (do not put it in `index.html` directly):**
- Vite's dev server uses a WebSocket for HMR, so a static CSP meta tag breaks `pnpm dev`. Inject it with a ~10-line `transformIndexHtml` plugin with `apply: 'build'` in `vite.config.ts`:
  `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'`
- `connect-src 'none'` works because `data/us-2026.json` is bundled via `import`, and the us-atlas topology is loaded by dynamic `import()`, which counts as script-src rather than connect-src.
- Meta-tag CSP cannot set `frame-ancestors` or reporting endpoints, and GitHub Pages cannot set headers. That is acceptable: the goal is "no data can leave the page", not clickjacking defence.
- `'unsafe-inline'` for styles covers Svelte `style=` attributes. The risk is negligible because the page loads no third-party scripts.

## Observability: what's enforced and how

### (a) Dev/CI observability — every item is a failing gate

| # | Gate | Tool | Fails when | Runs in |
|---|------|------|-----------|---------|
| 1 | **Golden replays** | vitest + `toMatchFileSnapshot` over `src/engine/replays/*.json` (about 6 hand-picked run logs: autopilot, sensible, crisis-heavy, debt crisis, reelection loss, second term) | Any engine change alters any turn's state. The diff shows up in the PR and has to be accepted on purpose with `vitest -u`. | `pnpm test` |
| 2 | **Engine invariants (properties)** | fast-check 4.10.2, about 200 runs per property in CI | Over any seed and any legal decision sequence, any of these fails: all numbers finite; existing plausible ranges hold; seats sum to 435/100; EV sums to 538 and the winner has ≥270 or the contingent-election rule applies; `replay(log)` is deterministic (run twice, deep-equal); `endTurn` does not mutate a deep-frozen input; **autopilot's event sequence is the same whatever the player decides**; every report-card "why" line points at an indicator that actually moved in the stated direction. | `pnpm test` |
| 3 | **Engine purity / privacy source scans** (extend `screens.test.ts`) | vitest + `node:fs` | `src/engine/**` contains `Math.random`, `Date`, `performance`, `window`, `document`, `localStorage`, `fetch`, or imports from `ui/`, `app/`, or `screens/`. Anywhere in `src/` contains `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource`, `http(s)://` in markup or script, or `localStorage` outside the one storage module. Any `src/content/text` civic claim lacks a citation (E7). | `pnpm test` |
| 4 | **Coverage floor** | `@vitest/coverage-v8`, `thresholds` for `src/engine/**` (start at the measured value and ratchet up, for example 90% lines/branches) | Coverage drops below the floor | `pnpm test --coverage` in CI |
| 5 | **Compile-time a11y** | `svelte-check --fail-on-warnings` | Any Svelte a11y or type warning | `pnpm check` |
| 6 | **Runtime a11y** | `@axe-core/playwright`, tags `wcag2a, wcag2aa, wcag21aa, wcag22aa` | Any violation on any registry screen × theme (day/night), or on any overlay: crisis modal, turn report card, myth card, election night, end-of-term | e2e job |
| 7 | **Keyboard-only turn** | Playwright | It is impossible to change a budget lever, sign an executive order, inspect a state, and press Next turn without a mouse | e2e job |
| 8 | **Visual regression** | Playwright `toHaveScreenshot` in the Docker image; the screen list comes **from `src/app/screens.ts`** so a new screen without a baseline fails | Pixel diff beyond threshold. Make captures deterministic with `#seed=1&turn=N` URL fixtures, `reducedMotion: 'reduce'`, `animations: 'disabled'`, and `await document.fonts.ready`. | e2e job |
| 9 | **Bundle budget** | `scripts/budget.mjs` (node:zlib) | Initial JS > **60 KB gz** (today 40.7 KB), initial CSS > **10 KB gz** (today 4.1 KB), any lazy screen chunk > **60 KB gz**, or total JS > **200 KB gz**. Tighten the numbers once Economy/Voters land. | build job |
| 10 | **Engine perf budget** | vitest test that times 20 seeds × (32 turns + autopilot + 40-quarter legacy) | Median per full game > 50 ms (≈3× headroom over local for CI noise; print the measured value every run) | `pnpm test` |
| 11 | **Interaction perf budget** | Playwright reads `performance.measure('next-turn')` set by `Session` | Next turn → report card visible > 200 ms, or Voters/Economy first render > 300 ms (on the CI runner, not a desktop machine) | e2e job |
| 12 | **No egress** | Playwright `page.on('request')` across a scripted full term | Any request to a non-same-origin URL, or any request at all after first load other than lazy chunks/fonts | e2e job |
| 13 | **License allowlist** | `pnpm licenses list --prod --json` + script | A prod dep is not MIT/ISC/Apache-2.0/BSD-2/3/0BSD/CC0/OFL-1.1, or a dev dep is not on that list plus the logged MPL-2.0 axe exception | build job |
| 14 | **Exact pins** | Script: every `package.json` version matches `^\d+\.\d+\.\d+$` | Someone adds `^`/`~` | build job |

CI layout: extend `.github/workflows/ci.yml` into four jobs: `check` (gates 5, 14), `unit` (1–4, 10), `build` (9, 13, uploads `dist`), and `e2e` (container `mcr.microsoft.com/playwright:v1.64.0-noble`, gates 6–8, 11–12, uploads `playwright-report` on failure). Then mark all four as required checks.

### (b) Player-side telemetry: none in v0.2, with local-first replacements

**Why none (legal/ethical):**
- The audience is teens 14+, "classroom-usable". Teachers will put it in front of 8th graders, so treat it as **mixed-audience with likely under-13 users**.
- The amended COPPA Rule has applied since **2026-04-22**. Persistent identifiers count as personal information. The "support for internal operations" exception is narrow and now needs a specific notice, and disclosure to third parties (analytics vendors) needs separate consent. *(LOW-MEDIUM: law-firm summaries; read 16 CFR §312.2 and §312.5(c)(7) before ever adding collection.)*
- The UK Children's Code covers under-18s and requires high-privacy defaults and data minimisation. Optional data uses have to be turned on by the child. GDPR Art. 8 sets the age of digital consent at 13–16 depending on the member state. US state student-privacy laws apply once schools use the game.
- **Collecting nothing** means no consent UI, no age gate, no data-processing agreements, and a privacy notice of a few lines. That notice still has to disclose that **GitHub Pages logs visitor IPs for security** (GitHub docs). This also matches design E5 ("inputs never leave the browser").

**What replaces telemetry:**
1. **Local run log**, always on and stored with the save in localStorage. Players can inspect it on an "Your data" page and delete it.
2. **"Share your run"**: a copyable code or `#run=` link. The recipient replays it deterministically and gets identical results. It is also the classroom feature ("compare your term with a classmate's").
3. **"Report a problem"**: opens the GitHub issue form and copies a bundle (run code + local error ring buffer + build SHA + UA string). **The bundle is shown to the player before it is copied.** GitHub's ToS is 13+, which fits the audience.
4. **Fun/balance signal**: `scripts/analyze-runs.ts` replays voluntarily posted run codes (Issues/Discussions) offline to get win rates, turn-of-loss, and which levers get used. Add the balance harness and in-person classroom playtests. This answers "is it consistently fun?" without any collection.

### (c) Error reporting: local only

- Global `error` + `unhandledrejection` listeners write to a 20-entry ring buffer in localStorage: message, stack, turn, screen, build SHA. Never decision values beyond what the run log already contains.
- Each screen in `App.svelte` is wrapped in `<svelte:boundary onerror>`. The fallback card offers "Copy problem report" and "Reload start of this turn", reusing the existing start-of-quarter save model, so a crash never ends a run.
- Engine-side: `assertInvariants(state)` runs in `endTurn` under `import.meta.env.DEV` and in tests, so it is removed from the production build. Production errors therefore come mostly from the UI, and the replay reproduces them exactly.
- Rejected: Sentry (third-party processor of minors' data, needs CSP opened), GlitchTip (needs a server). Both are covered in the tables above.

### (d) Making it enforced instead of aspirational

- **Technical guarantee:** the build-only CSP `connect-src 'none'` makes privacy a browser-enforced property. Even a compromised dependency cannot send data.
- **Regression guarantee:** gates 3 (source scan) and 12 (egress test) fail any PR that adds a network call or loosens the CSP without updating the allowlist *in the same diff*, so a reviewer sees it.
- **Determinism guarantee:** gates 1–3 together mean every bug report can be replayed and every engine change shows up as a reviewed snapshot diff.
- **Process guarantee:** required checks on `master` via branch protection. Without them the gates above are only advisory. Record the logged exceptions (axe MPL-2.0) and the budgets in design.md §9 so changing them is a reviewed edit.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `layerchart@2.6.0` | `svelte@5.57.2` | peer `svelte ^5.0.0`. Depends on `d3-geo ^3.1.1`, so the direct `d3-geo@3.1.1` dedupes. Pulls `@layerstack/tailwind` (clsx + tailwind-merge utils only) and **no Tailwind CSS**. |
| `@vitest/coverage-v8@5.0.3` | `vitest@5.0.3` | Must match vitest exactly. Bump both together. |
| `@axe-core/playwright@4.13.0` | `@playwright/test@1.64.0` | peer `playwright-core >=1.0.0`. Bundles `axe-core ~4.13.0`. |
| `@playwright/test@1.64.0` | Docker `mcr.microsoft.com/playwright:v1.64.0-noble`, Node 24 | Image tag must equal the package version or the browsers will not be found. |
| `fast-check@4.10.2` | TS 6.0.3, vitest 5 | Plain library, used inside `it()`. No vitest plugin needed. |
| `typescript@6.0.3` | `svelte-check@4.7.6` | Unchanged constraint. Skipping ESLint avoids typescript-eslint's `<6.1` peer cap. |
| `us-atlas@3.0.1` | `topojson-client@3.1.0` | `states-albers-10m` objects: `states`, `nation`. viewBox 975×610. Feature `id` = 2-digit state FIPS string. |

## Sources

- npm registry via `npm view <pkg> version license time dependencies peerDependencies`, run 2026-10-09: all versions, licenses, publish dates, layerchart deps, axe wrapper pin (HIGH, primary)
- `pnpm licenses list --json` and `svelte-check --help` run locally (HIGH)
- Repo: `src/engine/game.ts` (single mulberry32 stream, 3 normals/turn), `src/app/session.svelte.ts`, `src/app/screens.test.ts` (existing source-scan pattern), `src/data/us.ts` (JSON bundled via import), current `dist/` sizes (HIGH)
- Context7 `/techniq/layerchart`: geo with `geoIdentity` / pre-projected `referenceScale`, 2.0 CSS-only (no Tailwind requirement) (MEDIUM)
- [FTC amended COPPA compliance date April 22, 2026: Toy Association](https://toyassociation.org/PressRoom2/News/2026-News/updated-coppa-rule-requirements-take-effect-april-22.aspx), [Finnegan: amended rule in full effect](https://www.finnegan.com/en/insights/articles/coppas-amended-rule-is-now-in-full-effect-what-operators-need-to-know.html), [Latham: FTC publishes updates](https://www.lw.com/en/insights/2025/05/ftc-publishes-updates-to-coppa-rule) (LOW-MEDIUM, secondary legal commentary)
- [ICO Children's Code strategy update (Standard 7 high-privacy defaults)](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/children-s-code-strategy-progress-update/), [gov.uk child online safety: data protection](https://gov.uk/guidance/child-online-safety-data-protection-and-privacy) (MEDIUM, official, but the ICO notes the guidance is under review after the Data (Use and Access) Act)
- [GitHub Pages docs: visitor IPs logged](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) (MEDIUM)
- [Sentry JS data collected / sendDefaultPii](https://docs.sentry.io/platforms/javascript/guides/vue/data-management/data-collected), [Sentry free plan summary (secondary)](https://costbench.com/software/developer-tools/sentry/free-plan/) (MEDIUM / LOW)
- [LWN on GoatCounter](https://lwn.net/Articles/822568), [GoatCounter Go package README](https://pkg.go.dev/zgo.at/goatcounter@v1.4.2): EUPL, free for non-commercial, cookieless (LOW-MEDIUM; check current terms before use)

---
*Stack research for: static privacy-first civics strategy game, v0.2 additions + enforced observability*
*Researched: 2026-10-09*
