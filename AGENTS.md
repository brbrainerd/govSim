# govSim — agent instructions

Before any work, read `.planning/HANDOFF.md` (current state, rules, remaining work), then
`docs/design.md`. House rules from `~/dev/AGENTS.md` also apply; this file and the handoff
take precedence where they are more specific.

Never push, merge to `master`, or deploy without the user's explicit yes.

Never ask the user to manually verify UI flows, button visibility, viewport scrolling, tooltips, or keyboard navigation: always audit them yourself with headless Playwright and screenshots across viewports (1376×768, 1280×720) before reporting completion.

`/api/health` reports the deployed commit: the Deploy workflow bakes `github.sha` into the image as
the `GOVSIM_CODE_VERSION` build-arg. Never set `GOVSIM_CODE_VERSION` in Coolify or in
`docker-compose.ghcr.yml`; an override goes stale and breaks ngi.video's deployed-version check.
(As of 2026-10-27 the workflow's Promote step is skipped because the repo has no Coolify secrets,
and the Coolify app has no settings row, so its deploy queue fails. Production is updated on helios
by pinning `GHCR_IMAGE_WEB` to `ghcr.io/brbrainerd/govsim:<sha>` in
`/data/coolify/applications/gsim0ngivideo0app0000001/.env` and running `docker compose up -d` there.)
