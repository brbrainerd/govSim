# govSim — agent instructions

Before any work, read `.planning/HANDOFF.md` (current state, rules, remaining work), then
`docs/design.md`. House rules from `~/dev/AGENTS.md` also apply; this file and the handoff
take precedence where they are more specific.

Never push, merge to `master`, or deploy without the user's explicit yes.

Never ask the user to manually verify UI flows, button visibility, viewport scrolling, tooltips, or keyboard navigation: always audit them yourself with headless Playwright and screenshots across viewports (1376×768, 1280×720) before reporting completion.
