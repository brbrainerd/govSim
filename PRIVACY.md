# Privacy Notice for govSim

**Last updated:** October 2026

## 1. Zero Telemetry & Zero Tracking Creed
govSim is designed from the ground up with a strict privacy-first architecture:
- **No telemetry**: There are zero tracking scripts, diagnostic probes, error aggregators, or telemetry daemons in the code.
- **No analytics**: We do not use Google Analytics, PostHog, Mixpanel, or any third-party behavioral trackers.
- **No cookies**: govSim sets zero tracking or advertising cookies.
- **No third-party network egress**: When you play, no data leaves your browser to any external analytics or tracking server.

## 2. Client-Side Only Data Storage
All game state, policies, presidential decisions, unlocked milestones, and save files are stored solely within your browser via `localStorage` (or downloaded to your computer as explicit `.json` files when you click "Export Record").
- Your game data never touches our servers.
- You can clear your game data at any time by clearing your browser's site data or local storage.

## 3. Infrastructure & Server Logs
govSim is served as static web assets. Like all internet services, our underlying hosting infrastructure logs minimal operational requests:
- **Hetzner / Coolify Web Proxy**: Our web server proxy records standard access logs (client IP address, timestamp, requested static file URL, HTTP status code, and browser user agent) strictly for DDoS defense, load monitoring, and operational reliability. These logs are ephemeral and never correlated with in-game actions.
- **Cloudflare R2 Static Asset Hosting**: Cloudflare provides static object delivery and generates standard aggregate CDN request metrics and edge logs (request counts, edge data transfer, and static asset URLs).

## 4. Diagnostics & Problem Reporting
If you choose to use the in-game "Report a Problem" feature:
- The game compiles a diagnostic bundle consisting of your platform user agent, screen dimensions, turn number, and deterministic run replay code.
- **Nothing is transmitted automatically.** The bundle is displayed on-screen for your review and is only copied to your clipboard if you click the copy button. You decide whether and where to paste it (e.g. into an open GitHub issue).

## 5. Protection for Minors & Students
govSim is designed for educational, civic, and analytical exploration:
- Because govSim collects no personal information whatsoever from any user, it is compliant by design with COPPA (Children's Online Privacy Protection Act) and the UK Age Appropriate Design Code (Children's Code).
- Students, minors (14+), teachers, and researchers can freely study and play without surveillance or profile creation.

## 6. Open Source Verification
govSim is fully open source. You can audit our code repository to verify that no tracking, analytics, or background egress requests exist anywhere in the codebase.
