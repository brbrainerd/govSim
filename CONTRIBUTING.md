# Contributing

Thanks for helping. Read `docs/design.md` first; it holds the agreed design and the rules below.

## Ground rules

- **Nonpartisan.** Criticize institutions and incentives, never parties. No real officeholders' names.
- **Cite civic claims.** Every factual claim in player-facing text needs a source.
- **Plain language.** Labels ≤ 6 words, reading level ≤ grade 9.
- **No tracking.** The game collects nothing; PRs that add analytics, ads or network calls will be closed.
- **Deterministic engine.** `src/engine` stays pure: no UI imports, no `Math.random`, no `Date.now`.

## Workflow

```bash
pnpm install
pnpm test && pnpm check && pnpm build
```

Branch from the default branch, keep PRs small, and describe *why* in the PR.

## Sign your commits (DCO)

We use the [Developer Certificate of Origin](https://developercertificate.org/) instead of a CLA.
Add a sign-off line to every commit to certify you wrote the change or have the right to submit it:

```bash
git commit -s
```

which appends `Signed-off-by: Your Name <you@example.com>`.

## Licensing of contributions

Code you contribute is licensed under MIT (`LICENSE`); art, writing and data under CC BY 4.0
(`LICENSE-ASSETS`). See `TRADEMARKS.md` for the name and logo.
