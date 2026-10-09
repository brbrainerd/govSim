# Distribution, Publishing & Monetization

**Project:** govSim, an open-source, static, nonpartisan civics strategy game for ages 14+ and classrooms
**Researched:** 2026-10-09
**Mode:** Ecosystem + comparison
**Overall confidence:** MEDIUM-HIGH. Platform fees and legal dates come from official docs or several agreeing sources. Grant availability and portal revenue splits are LOW-MEDIUM and are flagged where they appear.

Confidence tags used below: **[H]** official docs or primary source · **[M]** several agreeing secondary sources · **[L]** one secondary source or inference.

---

## 1. Summary

**Bottom line:** keep the web build free, ad-free and tracking-free, hosted on a custom domain. Collect donations on adult-facing pages only. Sell an optional paid "Supporter Edition" on Steam at v1.0. Treat grants as a later bonus.

Each other channel was weighed against four constraints: open source (D1), minors in the audience (14+, often in classrooms, so some players will be under 13), nonpartisan credibility (E4), and the static architecture with no backend.

- **Distribution backbone:** the free web build on a **custom domain** in front of GitHub Pages. We can move to Cloudflare Pages later without changing the URL. A custom domain must be set **before** the public alpha. localStorage saves are tied to the site's origin, so changing host or domain later would silently wipe every player's saves. It also gives school web filters a stable, education-category URL to allow. [M]
- **Second channel: itch.io.** It's free, has a play-in-browser embed and pay-what-you-want pricing, and its default cut is 10% (adjustable down to 0%). [H]
- **Main revenue channel: Steam, at v1.0.** Sell a paid Supporter Edition of the free code, with Steam extras (achievements, cloud saves), wrapped in Electron. Shattered Pixel Dungeon (GPLv3, $10 on Steam, free on GitHub) and Mindustry (GPLv3, paid on Steam, free on itch and GitHub) prove the model works. The $100 Steam Direct fee is recouped at $1,000 in revenue. [H/M]
- **Donations: GitHub Sponsors and Ko-fi.** GitHub Sponsors takes 0% from personal sponsors. Ko-fi takes 0% on one-time tips. Both links live on the About/Credits page. Never show in-game pay nags to a minors-heavy audience. [H]
- **Avoid:** ads, analytics SDKs, accounts, IAP/loot boxes, and web portals that require ads or exclusivity (Poki, CrazyGames). Each one collides with COPPA (amended rule fully enforceable since **2026-04-22**), the UK Children's Code, school filters, or the free open web build. [H]
- **Defer:** iOS/Android. The game is desktop-first, Apple charges $99/yr, and the Texas App Store Accountability Act has been enforceable since the Fifth Circuit stay on 2026-05-28, with more state laws coming in 2027. [M]
- **Grants are real but slow and need an institution.** Example: NEH Digital Projects for the Public (Discovery up to $30k, Prototyping $100k, Production $400k). Pursue them after v1.0 has classroom evidence. [M]
- **Blocker found during this research:** the repo `brbrainerd/govSim` is **public with no LICENSE file**. Legally that means "all rights reserved": nobody may reuse it or contribute under clear terms. Adding the license files is the single most important v0.2 distribution task. [H, verified via `gh repo view`]
- **Name risk:** "GovSim" is already taken in practice. It's a well-cited NeurIPS 2024 LLM benchmark ("Governance of the Commons Simulation") and the title of at least two itch.io games ("Gov Sim"). It's also descriptive, which makes it hard to register as a trademark. Keep `govSim` as the repo name (Q32), but choose a distinctive **store/display title** before the Steam page goes up. [M]

---

## 2. Channels

Build size for context: `dist/` is about 464 KB raw, about 350 KB compressed, 25 files. That is tiny for every channel below.

| Channel | Cost / cut | Requirements & limits | Fit for govSim | Verdict |
|---|---|---|---|---|
| **GitHub Pages** | Free | 100 GB/month soft bandwidth cap (about 285k cold loads at 350 KB). Site ≤1 GB. 10 builds/hr, but no limit when deploying via Actions. Not meant as free hosting for "an online business, e-commerce" or SaaS. Works with public repos on the free plan. Custom domain supported. [H] | Matches the design (§8). Donation links on a free game are fine. Selling happens on Steam/itch, not on Pages. | **Use now** (v0.2), behind a custom domain |
| **Cloudflare Pages** | Free | 500 builds/month, 20k files, 25 MiB per file, 100 custom domains per project. Bandwidth not capped on the official page, and secondary sources call it unlimited. [H/M] | The fallback if a classroom or Hacker News traffic spike hits GitHub's soft cap. Same static `dist/`. | **Standby.** Switch only if traffic demands it. Custom domain makes the switch invisible. |
| **Netlify** | Free tier is metered on credits/bandwidth | Free tier caps are tighter than Cloudflare's. [L] | No advantage over the two above. | Skip |
| **itch.io** (web + downloads) | Default 10% cut, adjustable 0–100%, plus payment fees (about 2.9% + $0.30). PWYW with a $0 minimum is supported. [H] | HTML5 zip with `index.html`, ≤500 MB unpacked, ≤200 MB per file. Embed code available. [M] | Indie and open-source audience, jams, devlogs, PWYW "pay if you like it". No ads, no SDK. | **Use at public alpha** (free / PWYW) |
| **Steam** | $100 Steam Direct fee per app, recouped at $1k AGR. Valve takes 30% up to $10M. [M; fee H] | Coming Soon page live ≥2 weeks before release. Store page review 3–5 business days, then a build review. Content survey including AI disclosure (Jan 2026 rewrite: shipped AI-generated art must be disclosed, code assistants are exempt). Steam keys need price parity with Steam. [H/M] | The biggest paying audience for political sims: Democracy 4 has about 5.8k reviews, 81% positive, list price $29.99. Paid builds of free open-source games are an established model. Needs a desktop wrapper. | **Use at v1.0** (store page during public alpha to collect wishlists) |
| **Steam wrapper choice** | n/a | **Electron + steamworks.js (MIT)**: overlay and achievements work on Windows, and the same Chromium runs everywhere. **Tauri**: about 600 KB, but no built-in Steamworks support, the Steam overlay fails over WebView2, and on Steam Deck/Linux it uses WebKitGTK, a third rendering engine to test. [M] | govSim is a DOM/SVG app. A consistent Chromium matters more than download size. | **Electron.** Ignore the archived `tauri-app/`. |
| **Poki** | 50/50 on Poki-sourced traffic, 100% on your own traffic, paid as ad revenue. [H] | **Web exclusivity** for 5–7 years (sources conflict), Poki SDK, ads. Developer program in closed beta. [H/M] | Exclusivity conflicts with our own free web build. Ads conflict with the minors policy. | **Reject** |
| **CrazyGames** | Ad revenue share; split not published (third parties say 50–70%). [L] | Basic Launch is a 2-week test with no SDK and no money. Full Launch requires the SDK, and only SDK ads are allowed. [H] | Revenue only comes through ads. Portal domains are routinely blocked by school filters. | **Reject** for revenue. A free Basic Launch for exposure is optional and not worth the effort. |
| **Newgrounds** | No developer revenue share since Flash; the site now runs on supporter subscriptions. [M] | Free HTML5 upload. | Small audience, skews older. Exposure only. | Optional, post-v1.0 |
| **Microsoft Store** | Free registration for individuals since Sept 2025. Companies pay $99 once. [H] | Accepts PWAs and Electron apps. IARC age rating (free). [H/L] | Low effort if a PWA manifest exists. Low traffic. | Post-v1.0, cheap extra |
| **Mac App Store / iOS** | $99/yr. Small Business Program takes 15% under $1M. [H/M] | Review, age rating. **State app-store age-signal laws** (Texas now; Alabama 2027-01-01, Utah 2027-05-06, Louisiana 2027-07-01) require developers to request and act on age signals. [M] | Game is desktop-first with a degraded phone experience (G6). iPad is plausible. Extra compliance burden. | **Defer** past v1.0 |
| **Google Play / Android** | $25 once. 15% on the first $1M; fee schedule changing in 2026. [M] | Target-audience declaration. Families policy if under-13 users are targeted. Same state age-signal laws. | Phone experience is degraded. Chromebooks run the web build or PWA directly, so Play isn't needed for schools. | **Defer** |
| **PWA install** | Free | Manifest + service worker. | Offline play on Chromebooks and in classrooms with flaky Wi-Fi. Install from browser. Fits the static architecture. | **Add by v1.0** (small) |
| **Google Classroom** | Free | The "Share to Classroom" button / link sharing needs no integration or student data. [M] | Teachers post a link, which is the whole classroom integration we need (E6: no teacher tools). | Add share link/button by public alpha |
| **Clever Library** | Free to list | Library "Install" creates student accounts via rostering. "Add Link" does not. Developer integration plus Clever's data-sharing agreement. [M] | We have no accounts or data, so rostering adds liability for zero benefit. | **Skip.** Teachers can "Add Link". |
| **Common Sense Education** | n/a | **Paused new edtech reviews as of January 2026.** [M, one source, page didn't confirm] | Can't be pursued right now. | Recheck at v1.0 |
| **iCivics-style partnership** | Partnership, not a store | iCivics co-hosts the Civic Learning Week National Forum with Knight (2027-03-11/12, Charlotte). [M] | Most credible nonpartisan endorsement path. Needs a polished, cited build first. | Outreach at v1.0 |

---

## 3. Monetization models

"Fit" is scored against the four constraints: open source, minors, nonpartisan credibility, and no backend.

| Model | Mechanics / fees | Open-source fit | Minors / legal fit | Neutrality risk | Effort | Expected $ | Verdict |
|---|---|---|---|---|---|---|---|
| **Free web build** (baseline) | n/a | Perfect | Perfect if no data is collected | None | Already the plan | $0, maximum reach | **Core. Always free.** |
| **GitHub Sponsors** | 0% from personal accounts. Up to 6% from org accounts (3% avoidable via invoicing). No PayPal. [H] | Native to the repo (`.github/FUNDING.yml`) | Adult-facing (GitHub ToS is 13+) | Low; publish the funder list | Trivial | Low (tens to hundreds of $/month if it gains traction) | **Yes**, from public alpha |
| **Ko-fi** | 0% on one-time tips (free tier). 5% on memberships, shop and monthly tips. Plus processor fees (~3% + $0.30). [H] | Fine | Link only, never in gameplay | Low | Trivial | Low | **Yes**, as a non-GitHub tip jar |
| **Open Collective** | Free; fiscal host fee 0–10% (OC takes 15% of host fees). OC Europe ~8–10%. [H] | Transparent ledger, popular in OSS | Fine | **Best for neutrality**: every dollar in and out is public | Low-medium | Low | Use **if** grants or institutional money arrive (fiscal sponsorship) |
| **Patreon** | 10% for creators publishing after 2025-08-04, plus processing. [H] | Fine | Content-gating doesn't fit a free game | Low | Medium (needs regular posts) | Low | **Skip** (duplicates Sponsors/Ko-fi at higher fees) |
| **itch.io PWYW** | $0 minimum, suggested $5. 10% default cut (choose 0–10%). [H] | Fine (Mindustry and SPD do this) | Buyers are adults with payment cards; nothing collected in-game | None | Low | Low | **Yes**, at public alpha |
| **Paid Steam "Supporter Edition"** ($9.99–14.99) | 30%; $100 fee recouped. Extras: achievements, cloud saves, maybe a scenario editor or Steam Workshop. [M] | Proven (SPD $10, Mindustry paid; both GPLv3 and free elsewhere). MIT lets anyone sell builds too, so the trademark/name is the moat (§4). | Steam handles payment and age. Game collects nothing. | Low. Paying for convenience, not content. | **High**: Electron wrapper, Steamworks, page, capsule art, AI disclosure, QA on Deck | **Highest realistic revenue.** Low thousands to tens of thousands $, comparable sims show a niche audience [L] | **Yes**, at v1.0 |
| **Cosmetic supporter unlocks** (president colour variants, evil-mode skin) | Via Steam DLC or supporter build | Code is open, so "unlocks" are honour-system on web. Ship in the paid build as the convenience. | Never use loot boxes or randomised paid items | Low | Medium | Small add-on | Optional at v1.0 via Steam only. **No IAP on web.** |
| **School / district licenses** | Procurement, invoices, data agreements | Conflicts with "free for everyone" | Procurement brings student-data agreements (SDPC NDPA etc.) even if we collect nothing | Medium (looks like selling civics to schools) | High (sales, contracts) | Uncertain | **Reject.** Always free for schools. |
| **Teacher packs** (lesson plans, discussion guides) | Sold as PDFs | Fine | Fine | Medium if paid; low if free | Medium | Low | **Free, CC BY.** Drives adoption. Note design E6 says "no teacher tools" in-game; these are documents, not features. |
| **Grants** | NEH Digital Projects for the Public: Discovery ≤$30k, Prototyping ≤$100k, Production ≤$400k, 1–3 yrs, games eligible. [H] Individuals generally not eligible; needs a nonprofit, university or fiscal sponsor. [M] Civics Learning Act of 2026 (H.R. 8402) would let Dept. of Ed civics grants fund games, but it is only introduced. [M] No open Knight call for OSS civic tech found. [M] | Grants favour open licenses | Fine | Low if the funder takes no editorial role; **high** if the funder is an advocacy org | High (writing, reporting, partner) | Potentially largest single sum | **Post-v1.0**, with an academic or nonprofit partner and Open Collective/fiscal host |
| **Corporate / org sponsorships** | Logo in credits | Fine | Fine | **High**: any think tank, PAC, party-adjacent group, campaign, or 501(c)(4) taints nonpartisan credibility | Medium | Variable | Only under the funding-neutrality policy below; otherwise **reject** |
| **Ads** (portal SDKs, AdSense) | ~50/50 portal splits | Ads in an open-source repo invite forks that strip them | **Bad.** Ad identifiers are personal information under COPPA. Since 2026-04-22, targeted-ad disclosure needs separate verifiable parental consent for under-13s. UK Children's Code says profiling off by default. School filters block ad-heavy sites. [H] | **High**: political ad inventory on a civics game | Medium | Low (small audience × low CPM) | **Reject** |
| **Analytics / telemetry** | n/a | n/a | Persistent identifiers count as personal information. The "no data" story is the compliance strategy. | n/a | n/a | n/a | **Reject by default.** If ever needed: cookieless aggregate counts only (e.g. Cloudflare Web Analytics), disclosed, never per-player. |
| **IAP, loot boxes, data sales, NFTs/crypto** | n/a | n/a | Loot-box regulation, app-store kids rules, COPPA | Very high | n/a | n/a | **Reject outright** |

### Funding-neutrality policy (adopt with the first donation link)

1. No money from political parties, campaigns, candidates, PACs/super PACs, 501(c)(4)s, or organisations whose primary purpose is policy advocacy.
2. No funder gets editorial input. Content changes only through cited sources and the public issue tracker (E7).
3. Publish all funders over $X per year in `FUNDERS.md` and in the in-game credits.
4. Myth cards stay CI-balanced by tag regardless of funding (E4).

**Why this matters:** for a civics game, one partisan-looking sponsor costs more in school adoption and press credibility than it pays.

---

## 4. Legal & licensing

### 4.1 License files (blocker: repo is public with no LICENSE)

| Layer | Recommended license | Why |
|---|---|---|
| Source code (`src/`, scripts, tests) | **MIT** | Matches decision D1 and the dependency policy, and it's the simplest license for teachers and contributors to understand. GPL (as used by SPD and Mindustry) adds no protection we need: it wouldn't stop an ad-laden repackage either. Only the trademark does that. |
| Original art (SVG parts, rig poses, UI illustrations), text and civics content (`src/content/text/`), explainers | **CC BY 4.0** | Reusable in classrooms with credit. Code licenses fit art badly. |
| Data (`data/us-2026.json`) | **CC BY 4.0** for our compilation. Underlying US federal data is public domain; keep per-field source citations. | Attribution travels with reuse. CC0 is acceptable if maximum reuse matters more. |
| Fonts (Atkinson Hyperlegible and the display slab, via @fontsource) | **OFL-1.1**, unchanged | OFL requires shipping its license text and forbids selling the fonts on their own. Include it in `THIRD_PARTY_LICENSES` and the credits screen. |
| Third-party code (`svelte`, `us-atlas`, `topojson-client`, `@lucide/svelte`…) | Their MIT/ISC notices | MIT/ISC require the notice to ship with distributions, **including the Steam/Electron build**. Generate the notice file at build time. |
| Name and logo | **Not licensed.** Add a `TRADEMARKS.md`: forks must rename. | The only lever against someone uploading our MIT code to Steam or app stores with ads under our name. Apache-2.0 §6 states this explicitly; with MIT we state it in `TRADEMARKS.md` and the README. |

**Contributions:** use the **DCO** (`Signed-off-by`), not a CLA. With MIT, inbound equals outbound already allows us to sell builds that include contributions, so a CLA would only add friction. Contributor art comes in under CC BY 4.0, recorded in `src/assets/manifest.ts` (which already plans a `license` and `credit` per asset).

**AI-generated assets:** the characters are agent-authored SVG. Under Steam's January 2026 disclosure rules, **shipped** AI-generated art must be disclosed, while concept-only art and code assistants are exempt. Disclose honestly on Steam and itch. The copyright status of purely AI-generated output is unsettled, so the CC BY grant on those parts is best-effort. That affects how strongly we can enforce the license, not whether we're allowed to distribute. [M]

### 4.2 Trademark

- **Conflicts:**
  - "GovSim" is a NeurIPS 2024 LLM benchmark, so search results for the name are dominated by arXiv papers.
  - "Gov Sim" is the title of two itch.io games: a VR game on hold, and a GMTK 2020 jam entry.
  - "govsim" is also the name of a Devpost hackathon project.
  - I could not query USPTO directly. Run a USPTO trademark search before spending on branding.
- **Recommendation:**
  - Keep the repo and code name `govSim`.
  - Choose a **distinctive public title** before the Steam page goes up (needed by the public alpha). A generic or descriptive name is weak for both SEO and trademark.
  - Rely on common-law rights from use at first. File a USPTO application in Class 9 (downloadable games) and/or 41 (online games) only once Steam revenue justifies it; the base fee was about $350 per class after the January 2025 fee change. [L]

### 4.3 Minors & privacy (the "collect nothing" strategy)

| Rule | What it requires | How govSim complies |
|---|---|---|
| **COPPA**, amended rule. Effective 2025-06-23, **full compliance 2026-04-22**, enforcement active. Penalties up to ~$53k per violation. [H] | Applies to sites directed to under-13s **or** with actual knowledge of collecting their personal information. Persistent identifiers count. New: separate parental consent for third-party disclosure (ads and AI training are "not integral"), a written retention policy, and an annual written security program. | Designed for 14+, but classroom use means some under-13 players will exist. **Collect no personal information:** no accounts, no analytics IDs, no ad SDKs. Saves live in localStorage. "Your Household" inputs never leave the browser (E5). Without collection, none of COPPA's obligations attach. |
| **UK Children's Code** (AADC) [M] | Applies if under-18s are "likely" to access the service **and** personal data is processed. The ICO launched a 2026 game-monitoring programme. | Same as COPPA: if nothing is processed, it's out of scope. Document that in `PRIVACY.md`. |
| **GDPR Art. 8** / EU | Parental consent for information-society services processing under-16 data (member states may lower to 13) | Same: no processing beyond the host's server logs. |
| **State student-privacy laws** (SOPIPA-style) and district data agreements | Apply to operators of K-12-purpose services that collect student data | We collect nothing. Provide a one-page "Data we collect: none" statement for district reviewers. |
| **App-store age-signal laws** (TX in force; AL, UT, LA in 2027) [M] | Developers must request and act on age signals | Only matters for iOS/Android. Another reason to defer mobile. |
| **Host logs** | GitHub and Cloudflare see visitor IPs | Disclose in `PRIVACY.md` with links to their privacy statements. |
| **"Report inaccuracy" → GitHub issue** (E7) | GitHub accounts require age 13+ | Add a note that reporting needs a GitHub account (13+), and offer an email alternative or teacher-relayed path. |

**v0.2 artefacts:** `PRIVACY.md` plus an in-game About/Privacy/Credits page stating: no accounts, no cookies, no analytics, saves stay on your device, external donation/store links leave the site.

---

## 5. Launch plan & calendar

### 5.1 Key dates

| Date | Event | Relevance |
|---|---|---|
| **2026-11-03** | US midterms | Too soon for any launch. Afterwards, refresh Congress data (Q23 pins the 119th Congress). |
| 2026-12-04 to 06 | NCSS Annual Conference, Chicago | Too early to exhibit. Watch and network only. |
| 2027-01-03 | 120th Congress sworn in | Needed for the post-midterm data refresh before public alpha |
| 2027-01-10 | Steam Next Fest (Feb) registration deadline | Not realistic for govSim; skip this edition |
| **2027-03-08 to 12** | Civic Learning Week; National Forum 03-11/12 in Charlotte (iCivics + Knight) | **Public alpha target.** Best nonpartisan civics news hook. |
| 2027-06-14 to 21 | Steam Next Fest (June) | Option for a Steam demo if the store page is up by spring |
| 2027-09-17 | Constitution Day | Classroom hook for a school-year push |
| ~Oct 2027 | Steam Next Fest (Oct; dates TBA) | **Preferred** Next Fest for the v1.0 demo |
| Dec 2027 | NCSS 2027 | Present or exhibit with classroom evidence |
| Jan to Jun 2028 | Presidential primaries | Rising interest. Highest partisan-reading risk. |
| **2028-11-07** | Presidential election | Peak interest. v1.0 must already be out and stable. |

### 5.2 Publishing tactics, in priority order

1. **Show HN** (open-source, deterministic, cited civic simulation, an HN-native story) at public alpha. The static build absorbs the traffic spike, and Cloudflare Pages is on standby.
2. **Reddit:** r/WebGames and r/incremental_games (web build); r/StrategyGames and r/4Xgaming (strategy players); r/socialstudies, r/Teachers, r/APGov (classroom; read each sub's self-promotion rules). Avoid r/politics and partisan subs.
3. **itch.io devlog and jams:** cross-post devlogs. A civic-themed jam entry of evil mode is a cheap test later (M4).
4. **Press kit:** a page on the site plus the itch press page. Include: one-paragraph pitch, the neutrality statement, the "collect nothing" privacy statement, 6 screenshots, a GIF from the existing ffmpeg pipeline, factsheet, licenses, and a contact. Pitch angle: "a civics sim where every number is cited and you're scored against doing nothing."
5. **Steam:** put up the Coming Soon page during public alpha (summer 2027) to collect wishlists. Enter October 2027 Next Fest with a demo. Release v1.0 shortly after.
6. **Streamers and YouTubers:** creators who already play Democracy 4 or political sims. Make their life easy: an obvious "streamer-safe" calm mode, no audio-licensing issues (we have no audio at all), and fast-forward.
7. **Education:** a Google Classroom share link; free CC BY lesson guides; Civic Learning Week; NCSS 2027 proposal; iCivics outreach once there's a polished cited build; recheck whether Common Sense has resumed reviews. Ask school web-filter vendors (GoGuardian, Securly, Lightspeed) to categorise the domain as education. [L]

**Neutrality protocol for every launch beat:** use no real officeholders or candidates in marketing; show both parties in any screenshot that shows party choice; avoid election-day stunts; run myth-card balance checks before each release.

---

## 6. Recommendation (ranked, phased)

### Ranked

| Rank | Do | Why it ranks here |
|---|---|---|
| 1 | **License files + `TRADEMARKS.md` + DCO** | Blocker. A public repo with no license can't be legally reused or contributed to, and no store will be safe without it. |
| 2 | **Free web build on a custom domain; GitHub Pages via a manual-trigger Actions deploy; "collect nothing" privacy page** | Maximum reach for the mission. Compliance by design. The domain protects player saves and makes school allow-listing possible. |
| 3 | **Funding-neutrality policy + GitHub Sponsors + Ko-fi links (adult-facing)** | Near-zero cost and fees, protects credibility, starts a small revenue stream |
| 4 | **itch.io free/PWYW page + press kit + Show HN at public alpha** | Cheapest audience-building with no compliance burden |
| 5 | **Paid Steam Supporter Edition at v1.0 (Electron + steamworks.js)** | Only channel likely to make meaningful money, with proven open-source precedent. Expensive in effort, so wait until the game is fun and stable. |
| 6 | **Education outreach + free CC BY teacher guides + Google Classroom share** | High mission value. Needs a polished build to be credible. |
| 7 | **Grants via an academic or nonprofit partner + Open Collective** | Largest potential sums but slow, institution-gated, and they need traction evidence |
| 8 | PWA, then Microsoft Store | Cheap extras for Chromebooks and offline play |
| — | **Reject:** ads, analytics IDs, IAP/loot boxes, Poki/CrazyGames revenue, school licensing, partisan sponsors. **Defer:** iOS/Android. | Each conflicts with minors law, neutrality, or the free open web build |

### Phased timeline

**v0.2 Playable First Term (now). Requirements to add:**
- `LICENSE` (MIT, code), `LICENSE-ASSETS` (CC BY 4.0: art, text, data), `THIRD_PARTY_LICENSES` generated at build time (OFL fonts, MIT/ISC deps), `TRADEMARKS.md` (forks must rename), README license section.
- `CONTRIBUTING.md` with DCO; asset manifest enforces `license` + `credit` (already designed in §10).
- `PRIVACY.md` + in-game About/Privacy/Credits screen (credits derived from the asset manifest). No analytics or third-party requests in the build; add a CI check that the build makes no external requests.
- Deploy pipeline: GitHub Actions `workflow_dispatch` → `actions/deploy-pages` (design: "deploys only on request"). `base: './'` already works for project paths.
- **Decision:** buy and attach a custom domain **before** any link is shared publicly (saves are bound to the origin).
- **Decision:** pick the public display title (trademark/SEO conflict with "GovSim").
- No monetization code in v0.2. A `FUNDING.yml` is optional, but hold it until the funding-neutrality policy is written.

**Public alpha (target: Civic Learning Week, 2027-03-08; after the 120th Congress data refresh):**
- itch.io page (free/PWYW, 0–10% cut), press kit, Show HN and Reddit.
- GitHub Sponsors and Ko-fi + `FUNDERS.md` + neutrality policy.
- Google Classroom share link; first free lesson guide.
- Cloudflare Pages on standby (same domain) if GitHub's 100 GB/month soft cap is approached.
- Late in the alpha: Steam Coming Soon page with wishlists, and AI disclosure in the content survey.

**v1.0 (target: autumn 2027, ahead of the 2028 cycle):**
- Electron + steamworks.js build: achievements, cloud saves, Deck verification pass. Price $9.99–14.99. Web build stays free and full-featured.
- Steam Next Fest (October 2027) demo, then release.
- PWA install; Microsoft Store (free individual registration).
- Education: NCSS 2027, iCivics outreach, recheck Common Sense reviews.
- Grants: find a university or nonprofit partner; NEH Digital Projects for the Public (Prototyping/Production tier) via Open Collective or a fiscal host.

**Post-v1.0 / 2028:** optional evil-mode cosmetic DLC on Steam only; mobile and iPad only if the age-signal law landscape settles; content updates timed to the primaries and Election Day under the neutrality protocol.

---

## 7. Open questions and gaps

- **USPTO search** for the chosen display title. Not done here.
- **Steam rule on free versions elsewhere:** Valve's parity rule as written covers Steam keys only. Mindustry and SPD show free-elsewhere is tolerated, but there's no official statement. [M]
- **NEH eligibility** (no individual applicants) and the 2026–27 DPP deadline. Confirm on neh.gov or Grants.gov.
- **Common Sense review pause:** single source. Recheck before v1.0.
- **CrazyGames and Poki exact terms:** irrelevant given the rejection, but unverified.
- **School filter categorisation** advice is practitioner knowledge, not documented policy. [L]

---

## Sources

**Hosting**
- GitHub Pages limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits [H]
- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits [H]

**itch.io**
- Open revenue sharing: https://itch.io/updates/open-revenue-sharing [H]
- Payments: https://itch.io/docs/creators/payments [H]
- HTML5 upload: https://itch.io/docs/creators/html5 [H]

**Steam**
- Releasing: https://partner.steamgames.com/doc/store/releasing [H]
- Coming Soon page: https://partner.steamgames.com/doc/store/coming_soon [H]
- Review process: https://partner.steamgames.com/doc/store/review_process [H]
- Steam keys: https://partner.steamgames.com/doc/features/keys [H]
- Next Fest Feb 2027: https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/feb_2027 [H]
- 2027 H1 events: https://www.pcgamer.com/games/steam-reveals-all-the-sale-dates-and-themed-events-for-the-first-half-of-2027/ [M]
- Fee and tiers: https://www.steampageanalyzer.com/blog/steam-direct-fee-explained [M]
- AI disclosure rewrite: https://videogameschronicle.com/news/valve-has-significantly-rewritten-steams-rules-for-how-developers-much-disclose-ai-use [M]
- AI disclosure summary: https://legalmoveslawfirm.com/steam-ai-policy/ [M]

**Wrappers**
- WebView2 overlay thread: https://github.com/MicrosoftEdge/WebView2Feedback/discussions/4019 [M]
- Packaging a JS game for PC: https://jslegenddev.substack.com/p/the-struggle-of-wrapping-a-javascript [L]
- Tauri and Steam achievements: https://forum.gdevelop.io/t/implementing-steam-achievements-with-tauri/73202 [L]

**Open-source precedents**
- Shattered Pixel Dungeon Steam release: https://ShatteredPixel.com/blog/shatteredpd-v120-and-steam-release.html [H]
- SPD on Steam: https://gamingonlinux.com/2022/03/shattered-pixel-dungeon-arrives-on-steam-eight-years-later [M]
- Mindustry on Steam: https://www.gamingonlinux.com/2019/09/mindustry-the-factorio-like-tower-defense-game-is-now-on-steam/ [M]
- Democracy 4 console edition: https://www.gamedeveloper.com/press-release/democracy-4-console-edition-launches-today- [M]
- Democracy 4 price data: https://isthereanydeal.com/game/democracy-4/info [M]

**Web portals**
- Poki deals: https://sdk.poki.com/deals [H]
- CrazyGames requirements: https://docs.crazygames.com/requirements/intro/ [H]
- Newgrounds finances: https://newgrounds.wiki.gg/wiki/Newgrounds_Finances [L]

**Stores**
- Microsoft Store free registration: https://blogs.windows.com/windowsdeveloper/2025/09/10/free-developer-registration-for-individual-developers-on-microsoft-store/ [H]
- Google Play fees: https://support.google.com/googleplay/android-developer/answer/112622 [H]
- Apple Small Business Program: https://www.businesswire.com/news/home/20201118005376/en/Apple-Announces-App-Store-Small-Business-Program [H]
- App-store accountability acts compared: https://fpf.org/blog/comparing-enacted-app-store-accountability-acts/ [M]
- Texas law takes effect: https://www.mofo.com/resources/insights/251111-texas-targets-app-stores-with-new-accountability-law [M]

**Donations**
- GitHub Sponsors: https://docs.github.com/en/billing/concepts/third-party-payments/github-sponsors [H]
- Open Collective fiscal host fees: https://docs.opencollective.com/help/fiscal-hosts/fiscal-host-fees [H]
- Ko-fi fees: https://help.ko-fi.com/hc/en-us/articles/360002506494-Does-Ko-fi-take-a-fee [H]
- Patreon standard fee: https://support.patreon.com/hc/en-us/articles/36426991446797 [H]

**Minors and privacy**
- COPPA final rule: https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule [H]
- Davis Polk on COPPA enforcement: https://www.davispolk.com/insights/client-update/ftc-prioritizes-coppa-enforcement-new-compliance-obligations-take-effect [M]
- Loeb on the amended rule: https://www.loeb.com/en/insights/publications/2025/05/childrens-online-privacy-in-2025-the-amended-coppa-rule [M]
- ICO Children's Code scope flowchart: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/annex-a-services-covered-by-the-code-flowchart/ [H]
- ICO game guidance: https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2023/02/new-guidance-to-industry-issued-for-game-developers-on-protecting-children [H]
- ICO 2026 mobile games scrutiny: https://www.freeths.co.uk/insights-events/legal-articles/2026/ico-launches-scrutiny-of-children-s-privacy-practices-in-mobile-gaming/ [M]

**Education**
- Clever Library integration guide: https://dev.clever.com/v2.0/docs/library-guide [H]
- Common Sense Education (review pause, single source; page didn't confirm): https://www.commonsense.org/education [M/L]
- NCSS 2026 conference: https://www.socialstudies.org/conference [H]
- Civic Learning Week 2027: https://hreusa.org/2026/07/06/save-the-date-for-civic-learning-week-2027-march-8-12/ [M]

**Grants**
- NEH Digital Projects for the Public: https://essentials.neh.gov/grants/public/digital-projects-the-public [H]
- Civics Learning Act of 2026: https://policyrisk.com/legislation/HR8402 [M]
- Knight Foundation: https://knightfoundation.org [M]

**Name conflicts**
- GovSim benchmark: https://arxiv.org/abs/2404.16698 [H]
- "Gov Sim" (itch.io): https://foxomat.itch.io/gov-sim [H]
- "Gov Sim" (itch.io): https://wr3nch4476.itch.io/gov-sim [H]
- govsim (Devpost): https://devpost.com/software/govsim [H]

**Repo state:** `gh repo view brbrainerd/govSim --json visibility,licenseInfo` → PUBLIC, `licenseInfo: null` (checked 2026-10-09).
