# Phase 08 — UI Specification: Balance, Hardening & Release

## 1. Design Targets & Visual References

This specification establishes the visual, layout, and interaction contracts for **Phase 8: Balance, hardening & release**, delivering:
* **Milestone Badges System (`RPT-03`)**: 12 policy achievement rosettes displayed on `TurnReport.svelte` and `EndScreen.svelte`.
* **About, Privacy & Credits Modal (`REL-02`)**: Sourced nonpartisan credits, license notices, and zero-telemetry disclosure modal.
* **Share-Your-Run Flow (`REL-03`)**: `#run=` URL hash generation and replay loader with clipboard integration.
* **Report-a-Problem Diagnostic Bundle (`REL-04`)**: Reviewable local diagnostics modal with 0 automated network egress.
* **Save Format v1 Freeze & Balance Verification**: Fixed schema stability, 40-seed hill climber tuning, and full-term keyboard navigation.

---

## 2. Layout Grammar & Screen Anatomy

### 2.1 Milestone Badges (`RPT-03`)
* **Badge Anatomy**:
  - Shaped as an Americana rosette / medal using SVG and tokens (`var(--gold)`, `var(--ink)`, `var(--card)`).
  - Unearned state: Muted ink silhouette with dashed border and tooltip describing how to unlock.
  - Earned state: Vibrant gold ribbon/rosette border with badge icon, bold title, and unlock turn tag.
* **Surfaces**:
  - **Turn Report Overlay (`TurnReport.svelte`)**:
    - When a badge unlocks on the turn just resolved, a celebratory ribbon appears below the indicators:
      `★ NEW MILESTONE EARNED: [Badge Name] — [Short Description] ★`
  - **End Screen (`EndScreen.svelte`)**:
    - New tab in Zone 2 / main section: `"Milestones"`.
    - 3×4 or 4×3 grid of all 12 badges organized by category: *Fiscal & Economy*, *Crises & Powers*, *Elections & Public Trust*.
    - Interactive card reveals exact conditions met and comparisons against Autopilot.

### 2.2 About / Privacy / Credits Modal (`REL-02`)
* **Trigger**: Accessible via a new `"About & Privacy"` link at the bottom of the left rail (`Where` zone) or a footer button.
* **Modal Structure** (`Overlay.svelte` split layout):
  - **Left Section (Story & Disclosures)**:
    - Heading: `"About govSim"`
    - Nonpartisan Creed: Plain explanation of the game's nonpartisan educational mission, institutional mechanics, and source basis (CBO, BEA, BLS, Federal Reserve).
    - Privacy Disclosure: Prominent statement:
      `"ZERO TELEMETRY · ZERO TRACKING · ZERO EXTERNAL REQUESTS"`
      Explicitly states that saves never leave browser `localStorage`. Discloses only infrastructure logs: Hetzner/Coolify host proxy logs and Cloudflare R2 asset requests.
    - Credits: Font licenses (Rokkitt, Atkinson Hyperlegible via OFL), code license (MIT), and asset license (CC BY 4.0).
  - **Right Section (Actions & Links)**:
    - Button: `"View Third-Party Notices"`
    - Button: `"Report a Problem"` (opens diagnostic bundle)
    - Primary Stamp: `"CLOSE"`

### 2.3 Share-Your-Run Dialog & Flow (`REL-03`)
* **Triggers**:
  - `"SHARE YOUR RECORD"` button on `EndScreen.svelte` (Zone 4 Next Step).
  - `"Copy run link"` button in the Save/Load menu.
* **Interaction**:
  - Compresses `{ format: "govsim-run", v: 1, seed, options, inputs }` using browser-native `CompressionStream('deflate-raw')` encoded into base64url.
  - Formats URL: `https://[host]/#run=[encoded]`.
  - Displays modal or toast with copyable text box and primary button `"Copy Replay Link"`.
  - When copied: Button changes to `"COPIED TO CLIPBOARD!"` in `var(--sage)` with 2-second timeout.
* **Loading a Shared Run**:
  - On application startup (`App.svelte`), if `window.location.hash` starts with `#run=`:
  - Decompresses and validates input array and checksum.
  - Replays deterministically through the exact game states.
  - Displays a banner at the top of the screen: `"Viewing Shared Presidential Record (Seed: [seed])"` with button `"Start Your Own Presidency"`.

### 2.4 Report-a-Problem Bundle Modal (`REL-04`)
* **Trigger**: `"Report a Problem"` button from About modal or navigation.
* **Layout**:
  - Caution Banner: `"REVIEW BEFORE COPYING: Everything below remains entirely in your browser until you choose to paste it. Zero data is sent automatically."`
  - Diagnostics Preview Box (`<pre>` with code font):
    - Platform info (OS, user agent, viewport size).
    - Game build SHA and version `1.0`.
    - Current Turn, Screen, and State Checksum.
    - Anonymized Run Replay Code.
    - Console error log buffer (last 10 events).
  - Action Rail:
    - Primary Red Stamp: `"COPY DIAGNOSTIC BUNDLE"`
    - Secondary Link: `"Open GitHub Issues →"`

---

## 3. Design Tokens & Styling Rules

* **Tokens**: Strictly use CSS custom properties from `src/design/tokens.ts`:
  - Surfaces: `var(--paper)` (`#FAF6EE`), `var(--card)` (`#FFF8EA`), `var(--card-alt)` (`#F3ECE0`).
  - Inks: `var(--ink)` (`#1F2F55`), `var(--ink-soft)` (`#506080`), `var(--rule)` (`#D8D0BE`).
  - Rosette / Badges: `var(--gold)` (`#D9A23B`), `var(--gold-soft)` (`#F6E7B9`), `var(--sage)` (`#2E7D5B`).
* **Contrast Compliance**:
  - All text on cards must exceed 4.5:1 WCAG AA.
  - Badge titles must be high-contrast dark navy (`var(--ink)`) against light gold/cream backgrounds.
* **Zero Literals**: No raw `#hex` or `rgb()` strings in component files outside `tokens.ts`.

---

## 4. Accessibility & Viewport Contracts

* **Viewport Restraints (`OBS-07`)**:
  - Zero outer document scroll on 1376×768 and 1280×720 viewports.
  - Modals and badge grids scroll internally using `overflow-y: auto`.
* **Keyboard Navigation**:
  - Full keyboard accessibility: every badge, link, copy button, and modal control reachable via `Tab`/`Shift+Tab` with clear 2px outline focus indicators.
  - Full term keyboard-only playthrough verified by automated test.
* **Egress Integrity (`OBS-04`, `REL-04`)**:
  - Zero network requests triggered during share run generation, problem bundle review, or clipboard copy.
