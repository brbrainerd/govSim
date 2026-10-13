# Phase 19 Context: Institutional Backlash & Impeachment Trial

## Goal
Implement the institutional backlash mechanics when player Heat crosses constitutional crisis thresholds: ongoing clout drain from Special Counsel subpoenas (>60 heat), House impeachment votes using the 435-seat congressional model (>80 heat), and the Senate conviction trial requiring a 2/3 supermajority (67 votes) that removes the president from office and forfeits the entire offshore stash.

## Requirements
- **IMPEACH-01**: High heat levels (>60) trigger special counsel investigations and congressional subpoenas that drain presidential clout each quarter.
- **IMPEACH-02**: Critical heat levels (>80) trigger House impeachment votes using the 435-seat congressional bloc voting model.
- **IMPEACH-03**: Impeachment leads to a Senate conviction trial requiring a 2/3 supermajority; conviction instantly terminates the term and forfeits the entire offshore stash.

## Architecture & Constants
- Pure arithmetic-only calculation: zero bare literals.
- `HEAT_SPECIAL_COUNSEL_THRESHOLD = 60`
- `HEAT_IMPEACHMENT_THRESHOLD = 80`
- `SENATE_CONVICTION_THRESHOLD = 67` (2/3 of 100)
- `HOUSE_IMPEACHMENT_THRESHOLD = 218` (simple majority of 435)
- Clout drain: tracked with explanatory trace terms in `src/engine/trace.ts` and `src/content/text/why.ts`.
