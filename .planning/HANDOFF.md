# govSim — Handoff for Antigravity + Gemini

Written 2026-10-12 by the previous agent (Claude Code). Read this whole file before doing anything.
It tells you what the project is, where everything is, what is finished, what is left, and the exact
rules and commands to finish milestone **v0.2 "Playable First Term"**.

If anything here conflicts with a file it points to, the pointed-to file wins
(`docs/design.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`).

---

## 0. TL;DR — your job, in order

1. **Finish Phase 1 sign-off** (§6.1): ask the user to do 2 manual checks, record results.
2. **Fix the Phase 1 code-review warnings** WR-01 … WR-09 (§6.2). Small, test-first commits.
3. **Phases 2 → 8** of `.planning/ROADMAP.md` (§6.3 – §6.9), one phase at a time, using the
   loop in §5: research → plan → execute (task by task, commit each) → verify → mark complete.
4. **Stop and ask the user** at every point listed in §8. Never guess on those.

Done = every requirement in `.planning/REQUIREMENTS.md` checked, every phase in
`.planning/ROADMAP.md` marked complete, all gates in §4 green, nothing pushed without permission.

---

## 1. What this project is (60-second version)

- A browser strategy game: you play a **fictional US President** starting from the **real 2026
  country** (`data/us-2026.json`, every number sourced). One goal: **prosperity**, scored as
  *your result minus an autopilot run on the same seed*, half "now" and half "10 years later".
- It also teaches civics: plain language, myth cards, **strictly nonpartisan** (real parties,
  fictional people), audience teens 14+ and adults.
- Open source: code MIT, art/text/data CC BY 4.0, forks must rename (`TRADEMARKS.md`).
- Tech: **Svelte 5.57 (runes) + Vite 8 + TypeScript 6**, pnpm, vitest, Playwright. Static app now;
  deploy target is **Coolify (Docker) on a Hetzner VPS**, images on GHCR, assets on Cloudflare R2.
- Visual style: **Americana civics poster** — cream paper, navy, brick red, mustard gold, slab
  serif headings (Arvo), condensed caps labels (Barlow Condensed), body Atkinson Hyperlegible,
  flat "pill-people" characters drawn in SVG code.

---

## 2. Read these first (in this order)

| File | Why |
|---|---|
| `/Users/brbrainerd/dev/AGENTS.md` | House rules for every agent in `~/dev` (pnpm, exact pins, no secrets, no push, small diffs) |
| `docs/design.md` | The agreed design. §2 scoring, §3 model, §7 UI (7a plain language, 7b journey, 7c reward/punish, **7d layout grammar**), §8 architecture, **§10 single sources of truth** |
| `.planning/PROJECT.md` | Current state, constraints, key decisions |
| `.planning/REQUIREMENTS.md` | The 53 v0.2 requirements with IDs (FND, OBS, RPT, ECO, EVT, PWR, VOT, ELC, REL) |
| `.planning/ROADMAP.md` | 8 phases; each has Goal, Requirements, **Success Criteria**, Research flag |
| `.planning/research/SUMMARY.md` | Milestone research + **Decisions D1–D11 (all accepted)** + guardrail IDs `GR-nn` |
| `.planning/research/PITFALLS.md` | The `GR-01…GR-41` guardrails each phase must enforce |
| `.planning/phases/01-engine-foundations/01-REVIEW.md` | The warnings you fix in §6.2 |
| `.planning/phases/01-engine-foundations/0*-SUMMARY.md` | What Phase 1 actually built |
| `.design-targets/` (local, gitignored) | **Approved visual targets** — see §7 |

---

## 3. Current state (as of commit `553c6e7`, branch `game-pivot`)

- **Branch:** work happens on `game-pivot`. The default branch on GitHub is `master`.
  `game-pivot` is **not pushed**. Never push or merge unless the user says so.
- **Archived:** the old Rust simulator is at git tag `rust-final`. Do not touch it.
- **Built and working:**
  - Engine (`src/engine/`): pure, deterministic quarterly macro model. Keyed RNG
    (`rng.ts`, `draw(seed, stream, turn, key)`), arithmetic-only math (`detmath.ts`, no
    `Math.log/exp/sin/cos/tanh/pow/sqrt`), causal **trace ledgers** (`trace.ts`, every indicator
    change = sum of named terms), **coefficient registry** (`coefficients.ts`: `COEFF`, `LIMITS`,
    `SCORE`, `RULES` with citation/judgement + range), raw-input **decisions**
    (`decisions.ts`: `Decisions = { bill?: Bill }`, `resolveBill`, `sanitizeBudget`),
    **modifiers + scheduled effects** (`modifiers.ts`), legacy projection gating, scoring
    (`score.ts`, `finalScore` in `game.ts`), term calendar (`calendar.ts`: "Year N · Season").
  - App: `src/App.svelte` → `screens/NewGame.svelte` (party pick) → `screens/Game.svelte`
    (status bar + Home/See/Act rail + screen). Real screens: **Oval Office, Budget, Congress**.
    Economy, Voters, Your Powers are placeholders.
  - Data: `data/us-2026.json` (+ `src/data/schema.ts`, `src/data/us.ts`).
  - Tooling: `scripts/notices.mjs` (third-party notices), `scripts/determinism.mjs`
    (cross-browser replay proof), `.github/workflows/ci.yml` (check/test/build only).
- **Gates right now:** `pnpm test` 98 passing · `pnpm check` 0 errors · `pnpm build` ok ·
  `pnpm determinism` 8/8 OK · `node scripts/notices.mjs --check` ok.
- **Planning state:** milestone v0.2, Phase 1 executed + verified (`human_needed`), Phases 2–8
  not started. `.planning/STATE.md` tracks position.
- **Untracked, leave alone:** `.planning/config.json` (GSD config), `.gsd/`, `.planning/state.json`,
  `.planning/milestone.lock` (last three are gitignored).

### Known bugs / debts (do not lose these)

1. **Income floor missing.** Under extreme deficits the 10-year legacy projection drives family
   income to about −$60M (seed 31, max-deficit). Add a floor/sane collapse in Phase 2 balance
   work; then tighten `src/testing/conservation.ts` back to an absolute tolerance.
2. **Balance headroom.** Sensible play beats doing nothing by only ~0.5 index points; OBS-06
   requires 2–10. Phase 2 must tune (log every change in the balance report).
3. **Citations.** Only 4 coefficients are verified citations (Taylor ×2, inflation target, Okun).
   CBO/Yale URLs could not be fetched; those are tagged `judgement` with "Not confirmed". A human
   must open them before Phase 3 shows source links to players.
4. **Data gaps** in `data/us-2026.json`: `nondefenseDiscretionary` is null; outlay categories are
   11-month actuals; debt/GDP is a CBO projection. Refresh after Treasury's final Sept MTS
   (~Oct 13 2026). The **2026 midterms are Nov 3 2026** — the House/Senate counts (119th Congress)
   need a refresh once the 120th is seated (Jan 2027). Ask the user before refreshing.
5. Tooltips (approval, clout, calendar) are **mouse-only** → keyboard access in Phase 2 (OBS-07).

---

## 4. Hard rules (break none of these)

**Git**
- Work on `game-pivot`. **Never `git push`, never merge to `master`, never deploy** unless the
  user explicitly asks in this conversation.
- One task = one commit. Subject imperative, < 72 chars, GSD scope style `type(PP-NN): …`
  (e.g. `feat(02-03): autosave every turn`). Body explains **why**.
- Every commit ends with exactly these trailers (use your real model name):
  ```
  Signed-off-by: brbrainerd <brbrainerd@gmail.com>
  Co-Authored-By: <your model name> <noreply@google.com>
  ```
  If the shell refuses an inline message (it blocks `$(…)`, backticks, some parentheses), write the
  message to a file in `/private/tmp/` and use `git commit -F <file>`.
- Never `--no-verify`. Never commit secrets (`.env*` is ignored except `.env.example`).

**Dependencies**
- `pnpm` only. **Exact pins** (`pnpm add -E` / `--save-exact`), no `^`/`~`. Verify a package's
  latest version and license with `npm view <pkg> version license` before adding.
- Licenses allowed: MIT, ISC, Apache-2.0, BSD, CC0, OFL (fonts), CC BY (art). `@axe-core/playwright`
  (MPL-2.0) is an **approved dev-only exception** (decision D6) — log it in `docs/design.md` §9.
- New dependency = one line of justification in `docs/design.md` §9. Prefer stdlib/platform first.
- TypeScript must stay **6.x** (`svelte-check` 4.7 does not support TS 7).
- If pnpm's minimum-release-age blocks a brand-new version, **ask the user** (do not add
  exclusions yourself).

**Engine (`src/engine/`) — enforced by tests, keep them passing**
- Pure and deterministic: no UI imports, no `Math.random`, `Date`, `performance`, `crypto`, `Intl`,
  no `Math.log/exp/sin/cos/tan/tanh/pow/sqrt/atan`, no `**`. Use `detmath.ts`.
- All randomness via `rng.ts` keyed draws: `normal(seed, stream, turn, key)` / `uniform(…)`.
  Add new **streams** (e.g. `events`, `court`, `voters`, `election`) rather than reusing `macro`.
  A player decision must never change any draw on another stream (GR-01/02).
- Every number used in `step()` comes from `coefficients.ts` (`C`, `LIMITS`, `SCORE`, `RULES`)
  with `basis: 'citation' | 'judgement'`, a `range`, and a note. **Never invent a citation**; if you
  cannot open the source, tag it `judgement`.
- Every indicator change must be recorded as named terms in a `Ledger` (`trace.ts`); the trace
  conservation test must stay green. New mechanics emit `Modifier`s with a unique `source`.
- **Never run `vitest -u`** to make a refactor pass. The characterization block in
  `src/engine/determinism.test.ts`, the RNG known-answer vectors in `rng.test.ts`, and replay hash
  expectations are the behaviour contract. If behaviour must change on purpose, change the
  expectation by hand in the same commit and explain why in the commit body.
- Party never enters the engine (`src/engine/party.test.ts`). Party names live **only** in
  `src/content/parties.ts`.

**UI**
- Colours/fonts/spacing only from `src/design/tokens.ts` via CSS vars (`var(--ink)` etc.).
  A test fails on any hex/rgb literal in `.svelte`/`.css`.
- Every screen uses `src/ui/ScreenLayout.svelte` (layout grammar, design §7d): Status bar ·
  left rail (Home/See/Act) · main (one plain question headline → one main object → Learn strip
  bottom-left) · right "Next step" column (what it means → options → **one** red stamp button).
  Overlays (crisis, report, myth, election) split left = what happened, right = what you can do.
- Screens and the rail come from `src/app/screens.ts` (single registry). Icons only via
  `src/design/icons.ts` (Lucide).
- **Plain language** (design §7a): labels ≤ 6 words, reading grade ≤ 9, numbers with unit +
  arrow + the word up/down. Real civics term goes in a tooltip ("Real term: political capital").
- Svelte 5 runes only: shared state in classes with `$state` fields (no stores), `$state.raw`
  for snapshots, `$derived` for computation, `$effect` only as escape hatch, `{@attach}` for
  external libs, snippets not slots. No experimental `await` in components.
- Accessibility: keyboard reachable, `prefers-reduced-motion` respected, WCAG AA, no colour-only
  meaning, table fallback for every chart/map.
- Screens never mutate engine state; they edit the **draft** in `src/app/session.svelte.ts`;
  `nextTurn()` turns the draft into `Decisions` for the engine.

**Content & neutrality** (design §7, E4/E7)
- Criticize institutions and incentives, never parties. No real officeholder names anywhere.
- Every civic claim has a citation. Myth cards balanced across the spectrum.
- No telemetry, analytics, ads, accounts or network calls (OBS-04). Ever.

**Tools on this machine**
- `lean-ctx` may intercept shell/reads and sometimes roots at the wrong project (it has rooted at
  `~/dev/gigme` before). If a `ctx_*` call or `cat`/`sed` is refused, use your native file tools
  or `/bin/cat`. Use `timeout 300s <cmd>` (GNU coreutils) for anything slow.
- Python inline (`python3 -c`) is blocked by policy; write a script file instead or use `node`.

---

## 5. How to work a phase (the loop)

The previous agent used the **GSD** workflow. Its CLI is plain Node and works from any harness:

```bash
G=~/.claude/gsd-core/bin/gsd-tools.cjs        # alias for every command below
node $G query roadmap.get-phase 2             # phase goal, reqs, success criteria
node $G query init.plan-phase 2               # paths + flags for planning
node $G query phase-plan-index 2              # plans + waves after planning
node $G query state.begin-phase --phase 2 --name "<name>" --plans <N>
node $G query state.advance-plan              # call EXACTLY once per finished plan
node $G query roadmap.update-plan-progress 2
node $G query requirements.mark-complete OBS-01   # when a requirement is verified
node $G query phase.complete 2                # only after verification passes
node $G query commit "<msg>" --files <paths>  # commits planning docs
```

The full procedures are Markdown you can read and follow by hand:
`~/.claude/gsd-core/workflows/{plan-phase,execute-phase,execute-plan,verify-work,code-review}.md`
and templates in `~/.claude/gsd-core/templates/`. You do **not** need to replicate subagent
spawning; do each role yourself, sequentially. Phase 1 is the worked example — copy its shape
(`.planning/phases/01-engine-foundations/`).

**Per phase:**
1. **Research** (if the roadmap's Research flag says Yes): write
   `.planning/phases/NN-slug/NN-RESEARCH.md`. Verify versions with `npm view`, facts with web
   search; mark anything unverified. Include a "Validation Architecture" section (which test
   proves which success criterion).
2. **Plan:** write 2–7 `NN-MM-PLAN.md` files. Each: frontmatter (`phase`, `plan`, `wave`,
   `depends_on`, `files_modified`, `autonomous`, `requirements`), then tasks. Every task has
   `<read_first>`, `<action>` (concrete identifiers, no hand-waving), `<verify><automated>cmd
   </automated><fails_when>observable failure</fails_when></verify>`, `<acceptance_criteria>`.
   First task of each plan is a thin end-to-end "tracer" slice. Every requirement ID of the
   phase must appear in some plan's `requirements`. Plans that edit the same file go in
   different waves. Commit the plans.
3. **Execute** one plan at a time, one task at a time: read the files, make the change, run the
   task's verify command, commit. After each plan write `NN-MM-SUMMARY.md`
   (template `~/.claude/gsd-core/templates/summary.md`), commit it, `state.advance-plan` once.
4. **Review:** read your own diff against `docs/design.md` and the GR guardrails; write
   `NN-REVIEW.md` (critical/warning/info). Fix criticals before verifying.
5. **Verify:** check each roadmap success criterion against the real code, run all gates (§4/§10),
   write `NN-VERIFICATION.md` (`status: passed | gaps_found | human_needed`). If anything needs
   a human (visual check, a decision), write `NN-UAT.md` and **ask the user**. Only when it
   passes: `phase.complete N`, commit.

---

## 6. The remaining work

### 6.1 Finish Phase 1 sign-off (needs the user)

`.planning/phases/01-engine-foundations/01-UAT.md` has 2 pending tests. Ask the user to:
1. Run `pnpm dev` (http://localhost:5173): New Game has **no preselected party**; "Start the
   term" disabled until one is picked; status bar shows the party and
   "Turn 1 of 32 · Year 1 · Fall"; hover shows "Real calendar: Fall 2026. Your term is
   fictional and off-cycle."; after 7 × Next turn it reads "Turn 8 of 32 · Year 2 · Fall".
2. Push `game-pivot` + merge to `master` **themselves** (or explicitly ask you to), then confirm
   GitHub shows "MIT license".

Record `pass` / `issue` (verbatim + severity) in `01-UAT.md`. If both pass:
`node $G query phase.complete 1` and commit. If an issue, fix it as a small plan first.

### 6.2 Fix Phase 1 review warnings (before Phase 2)

Details and line numbers: `.planning/phases/01-engine-foundations/01-REVIEW.md`. Do each as
test-first → fix → commit (`fix(01): …`).

| ID | Fix |
|---|---|
| WR-01 | `decisions.ts`: `sanitizeBudget`/`resolveBill` must **reject** (not throw) on `null`, non-object budgets, non-array `deals`, `decisions: null`. Add tests for each malformed shape. Required before saves (Phase 2). |
| WR-02 | `session.svelte.ts` + `budget.ts`: packages must apply **on top of the policy in force**; "Keep as is" = current policy, not baseline. |
| WR-03 | `sentToCongress` is dead: a budget edited and sent without a vote is silently dropped. Either send it to the vote at Next turn (consistent with A8) or show it as unsent. Pick "vote at Next turn" and test it. |
| WR-04 | `game.ts` scheduled resolvers: make resolution order explicit/deterministic (sort by id) and **throw or log** on `due < turn` (never strand items). Fix the false comment. |
| WR-05 | `hash.ts` `stableHash`: throw on `Map`, `Set`, `Date`, class instances (only plain objects/arrays/finite numbers/strings/booleans/null). |
| WR-06 | Turn 32: disable deals/votes/sliders/Next turn at the last turn and route to the end screen placeholder. |
| WR-07 | `Congress.svelte`: bill name from the draft/package; "+10 clout" / "half back" text from `RULES` values. |
| WR-08 | Add `pnpm determinism` to CI (Phase 2 OBS-08 job, Playwright image). |
| WR-09 | Validate modifier `source`: reject reserved names `luck`, `clamp`, `rounding`, built-in source ids. |

Info items IN-01…IN-07 are optional; IN-04 ("−0.0 worse") and IN-05 (Congress a11y) are cheap — do them.

### 6.3 Phase 2 — Saves, guardrails & continuous deploy
Reqs OBS-01…08, REL-05, REL-06. Read ROADMAP Phase 2 success criteria and SUMMARY "Phase 2".
- Save = **input log** `{format, v, engine, seed, start, options, inputs[], check}`, replayed to
  restore; strict `parseSave` validator at the trust boundary (size caps, finite numbers, known
  ids, decompression limits); autosave every turn to localStorage; export/import JSON;
  `navigator.storage.persist()`.
- Golden replays replace the characterization block (only then may it be removed).
- fast-check property tests (`fast-check` exact pin), engine purity/privacy source scans.
- Build-time CSP `connect-src 'self'` + R2 host for assets; Playwright egress test; no telemetry.
- Content gates: reading grade ≤ 9, ≤ 20-word sentences, jargon only as "real term", party/
  person deny-list (allow-list `src/content/parties.ts`), citations required.
- Committed `balance-report.json`; CI fails on unexplained diffs; tune to sensible − nothing ∈ [2, 10].
  Fix the income floor (§3 bug 1) here.
- Playwright + `@axe-core/playwright` + keyboard-only + screenshot baselines on the 3 real screens
  — **baselines only inside the `mcr.microsoft.com/playwright:v1.64.0-noble` Docker image**.
- CI jobs: check / unit / build / e2e (+ `pnpm determinism`), license allowlist, exact-pin gate,
  bundle + perf budgets. Use **GitHub-hosted runners** (public repo — never self-hosted).
- Deploy (REL-05/06), mirror the user's gigme pattern (read
  `~/dev/gigme/.github/workflows/ghcr.yml`, `deploy-coolify.yml`, `~/dev/gigme/deploy.json`,
  `~/dev/coolify-deploy-kit/README.md`): Dockerfile serving the static build + `/api/health`
  returning `{"ok":true}`; GHCR image by commit SHA on push to the default branch; after CI green,
  promote to Coolify with health verify + rollback. **Before writing deploy config, ask the user
  the §8 deploy questions.** Do not trigger any deploy yourself.

### 6.4 Phase 3 — Turn report & Economy
Reqs RPT-01, RPT-02, ECO-01, ECO-02. `ui/Overlay.svelte` shell (left/right split); TurnReport
overlay from `report.trace` (top 3 causes + luck, hide residuals < 1e-9, "vs doing nothing");
`content/text/why.ts` copy for every trace source id (test: every emitted id has copy). One
headline score = projected final score everywhere (D11, GR-04). Economy screen: lazy-loaded
`layerchart@2.6.0` (exact pin) you-vs-autopilot charts + Fed explainer + table fallbacks.
Start sourcing Phase 6 data (ME/NE districts, House delegations, state exposure) in parallel.

### 6.5 Phase 4 — Events & crises
Reqs EVT-01…07, RPT-04. Research first (debt-limit X-date, base rates). Outside crises
**pre-rolled from the seed, identical for autopilot** (D2); policy changes only severity/recovery.
Player-caused crises triggered by conditions, labelled "autopilot didn't face this". Director:
none on turns 1–2, ≤ 1 modal per turn, cooldowns. 2–3 options + "do nothing", autopilot default,
choice resolves at Next turn. Deadlines with ≥ 2-turn countdown. Replace `src/content/sample.ts`.

### 6.6 Phase 5 — Your Powers
Reqs PWR-01…07. Research first (EO/court law post-2025, Fed chair term). ~10 cited EOs, keyed
court draws with delayed rulings (use scheduled modifiers), Fed chair hawk/centrist/dove +
pressure costs credibility, SCOTUS nomination, speech with diminishing returns, 5 balanced
myth cards, clout cap. EO modifiers tagged `eo` (legacy ignores them, D5). 4 and 5 both edit
`game.ts` — finish and commit one before starting the other.

### 6.7 Phase 6 — Voters & Electoral College (+ minimal midterms)
Reqs VOT-01…06. Hand-rolled SVG map from `us-atlas@3.0.1` `states-albers-10m` +
`topojson-client@3.1.0` (no map library), player-relative colours (not red/blue), keyboard
focus, sortable table. ME-2/NE-2 districts, per-state House delegations (269–269 contingent
election), **tipping-point centring** so both parties' reelection odds differ ≤ 5 pp over 300
seeds (D4). Minimal midterms at Year 2/Year 6 with a bounded penalty (D3).

### 6.8 Phase 7 — Election & end of term
Reqs ELC-01…05. Election at the end of Year 4 (turn 16) records a result **without halting the
engine** (autopilot must run to 32). Skippable reveal + reduced-motion version; why-you-won/lost
from the trace + retry from turn start; second term to turn 32; end screen with score vs
autopilot, legacy, historian tier (`content/text/verdict.ts`, bands not ideologies).

### 6.9 Phase 8 — Balance, hardening & release
Reqs RPT-03, REL-02, REL-03, REL-04. ~12 badges, share-your-run code (`#run=` using
`CompressionStream('deflate-raw')`), "report a problem" bundle shown before copying (nothing
sent), About/Privacy/Credits screen + `PRIVACY.md` (mention Coolify/proxy logs and R2), full
balance harness pass, freeze save format `v: 1`. Then the milestone audit.

---

## 7. Visual targets

The approved look lives in `.design-targets/` (local only, not in git):

| File | Screen |
|---|---|
| `g-home.png` | Oval Office (home) |
| `g-economy.png` | Economy (See) |
| `g-voters.png` | Voters map (See) |
| `g-budget.png` | Budget (Act) |
| `g-congress.png` | Congress (Act) |
| `g-powers.png` | Your Powers (Act) |
| `g-crisis.png`, `g-report.png`, `g-myth.png` | Overlays |
| `g-election.png`, `g-newgame.png`, `g-evil.png` | Election night, New game, evil-mode skin (M4) |
| `D.png`, `cast.png` | Character shape language (pill people) |
| `uikit.png` | Component sheet |
| `app-*.jpg` | What the built Oval Office / Budget / Congress look like now — match this quality |

These are **AI concept images** — treat labels/numbers in them as placeholders and known model
errors (a seal-like rug emblem must NOT appear; no presidential seal anywhere). Build with SVG/CSS
in the existing components (`src/ui/art/*`, `Character.svelte`, `Ribbon`, `Rosette`, `CoinStack`).
Check your work in a browser at 1376×768 against the target before calling a screen done.

The generator scripts and style guide (`docs/concepts/`) need `OPENROUTER_API_KEY`; only
regenerate concept art if the user asks (it costs money).

---

## 8. Stop and ask the user (never decide these yourself)

- Any `git push`, merge to `master`, branch rename, deploy, or Coolify/Hetzner/Cloudflare change.
- Deploy setup (Phase 2): (a) rename `master` → `main` or deploy from `master`? (b) Is the Coolify
  API reachable over HTTPS from GitHub-hosted runners, or use a Coolify deploy webhook? (c) Which
  subdomain, and is "private" unlisted or Cloudflare Access? (d) Vendor `coolify-deploy-kit`
  scripts into this repo, or fetch them?
- Refreshing `data/us-2026.json` (Treasury MTS, post-midterm Congress), or any change to sourced data.
- A dependency blocked by minimum-release-age, or any new license outside the allow-list.
- Any design decision not covered by `docs/design.md` / D1–D11, any change to scoring weights,
  the public title (D8), or anything partisan-sensitive in content.
- Spending money (OpenRouter image generation, domains, services).
- Any time a gate fails and you cannot fix it without weakening a test.

---

## 9. Definition of done for this handoff

- [ ] Phase 1 UAT recorded and phase marked complete
- [ ] WR-01…WR-09 fixed with tests
- [ ] Phases 2–8: each has RESEARCH (if flagged), PLANs, SUMMARYs, REVIEW, VERIFICATION, and is
      marked complete in `.planning/ROADMAP.md`
- [ ] All 53 requirements checked in `.planning/REQUIREMENTS.md`
- [ ] All gates in §10 green on the final commit
- [ ] Nothing pushed or deployed without the user's explicit yes
- [ ] This file updated with "what changed / what's next" at the end of each session

---

## 10. Gate commands (run before every phase sign-off)

```bash
cd /Users/brbrainerd/dev/govSim
pnpm install --frozen-lockfile
pnpm test                      # vitest — must be all green
pnpm check                     # svelte-check — 0 errors, 0 warnings
pnpm build                     # vite build
timeout 300s pnpm determinism  # Node + Chromium + Firefox + WebKit, min + unmin — all OK
node scripts/notices.mjs --check
```

Quick loop while coding the engine: `pnpm exec vitest run src/engine`.
Dev server: `pnpm dev` → http://localhost:5173.
