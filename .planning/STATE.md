---
gsd_state_version: "1.0"
milestone: v0.3
milestone_name: Social Policy & Domestic Reform
status: planning
stopped_at: Initialized Milestone v0.3 planning
last_updated: "2026-10-13T01:41:00.000Z"
last_activity: 2026-10-12
last_activity_desc: Initialized Milestone v0.3 cycle (Social Policy & Domestic Reform)
state_head: a9d0510a821679bb7ec02260ab4deccae36e1eb1
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
current_phase: 9
current_phase_name: Domestic Social Policy Levers
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-12)

**Core value:** A player can make real presidential tradeoffs against an honest, explainable model of the current US, and always understand *why* the country got better or worse.
**Current focus:** Milestone v0.3 — Social Policy & Domestic Reform

## Current Position

Phase: Phase 9 — Domestic Social Policy Levers
Plan: Ready to plan
Status: Milestone v0.3 initialized (Phases 9-12 scoped)
Last activity: 2026-10-12 — Initialized Milestone v0.3 planning

## Performance Metrics

**Velocity:**

- Total plans completed: 7
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 7 | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 1 P01 | 8min | 3 tasks | 12 files |
| Phase 1 P02 | 6min | 3 tasks | 10 files |
| Phase 1 P03 | 3 min | 3 tasks | 5 files |
| Phase 01 P05 | 6 min | 2 tasks | 8 files |
| Phase 01 P04 | 10min | 3 tasks | 3 files |
| Phase 01 P06 | 14 min | 3 tasks | 8 files |
| Phase 01 P07 | 12min | 3 tasks | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table; D1-D11 are in research/SUMMARY.md and applied in REQUIREMENTS.md.
Recent decisions affecting current work:

- [Roadmap]: Guardrails before content: engine rewrite (Phase 1), then saves/CI gates (Phase 2), before any crisis or copy is written
- [Roadmap]: Deploy pipeline (REL-05/06) lands in Phase 2 with CI and CSP, so every later phase ships to the private subdomain on green
- [Roadmap]: Phase 1 builds a scheduled-modifier mechanism so Phases 4 and 5 can run in parallel
- [Roadmap]: Badges (RPT-03) deferred to Phase 8 so milestones can span every mechanic
- [Phase 1]: 01-01: keyed RNG address (seed, stream, turn, key) replaces the GameState.rng cursor; STREAM ids and gap/infl/appr keys are the replay contract
- [Phase 1]: 01-01: scanner ignores a banned identifier only as the name of a property access, so Date.now() is caught
- [Phase 1]: 01-02: party lives in Session.options only; engine stays party-blind by absence (D4)
- [Phase 1]: 01-02: no party preselected at New Game; real calendar quarter is tooltip-only (D1)
- [Phase 1]: 01-03: only taylorInfl, taylorGap, inflTarget and okun are citations; every other coefficient is judgement — Sources were opened this session; CBO pages returned 403 and the Yale and FOMC calendar pages did not state the figures, so those entries stay judgement with the source flagged not confirmed
- [Phase 1]: 01-03: Taylor 1993 cited via the author's Stanford PDF, not the DOI — The DOI resolves to an Elsevier redirect page that shows no paper content
- [Phase 1]: 01-05: Deals made without Call the vote are voted and charged at Next turn (A8); enact() sends all three deals so budgets pass the House
- [Phase 1]: 01-05: Decisions is { bill?: { budget, deals } } with no clout field; resolveBill is shared by engine step and Session preview
- [Phase 1]: 01-04: @playwright/test 1.64.0 approved by user 2026-10-10, exact pin, dev-only, --ignore-scripts
- [Phase 1]: 01-06: conservationErrors tolerance scales with magnitude above 1 (ulp exceeds 1e-9 on collapsed legacy incomes near -6e7)
- [Phase 1]: 01-06: lever bases come from the lever tables (leverBase/leverDev), not literals 22/100; settleTo records floating-point carry as clamp (~1e-16), Phase 3 should hide sub-threshold residuals
- [Phase 1]: 01-07: modifiers fold into channel ledgers under their source name; scheduled items resolve at due===turn via Object.hasOwn registry; legacy drops eo and skips resolvers

### Pending Todos

- [Phase 1] Do REL-01 license files first as a quick task (D7)
- [Phase 3] Start VOT-06 data sourcing (ME/NE districts, House delegations, state exposure) in parallel

### Blockers/Concerns

- [Phase 2] REL-05 says "push to main" but the repo default branch is `master`: rename the branch or read "main" as the default branch before writing workflows
- [Phase 2] gigme's deploy uses self-hosted runners and `COOLIFY_INSECURE_HTTP`; GitHub-hosted runners need the Coolify API reachable over HTTPS, and `coolify-deploy-kit` must be fetchable from a public runner
- [Phase 2] Decide how the private subdomain is kept private (unlisted vs Cloudflare Access); which owned domain to use (D9)
- [Phase 1] D10 spike: cross-browser float drift magnitude is unknown

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-10-11T06:12:10.361Z
Stopped at: Phase 1 complete, ready to plan Phase 2
Resume file: None

## Operator Next Steps

- Start the next milestone with /gsd-new-milestone
