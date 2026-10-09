# govSim

Play a fictional President of the United States, inaugurated into the real,
present-day country. One goal: leave America as prosperous as possible — or, in
satirical evil mode, drain it and escape with the loot. Along the way, learn how
government actually works (and how much better it could).

Open source, browser-based, nonpartisan. Real parties, fictional people.

**Status:** v0.1 playable slice (Oval Office, Budget, Congress on a sourced 2026 start); milestone v0.2 "Playable First Term" in progress. See [docs/design.md](docs/design.md).

The previous Rust research simulator is archived at tag `rust-final`
(`git checkout rust-final`).

## Develop

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm test     # engine, registry and token-drift tests
pnpm check    # types
pnpm build    # static site in dist/
```

## License

Code: [MIT](LICENSE). Art, writing and data compilation: [CC BY 4.0](LICENSE-ASSETS).
Fonts: SIL OFL 1.1. Bundled packages: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
The name and logo are not licensed for forks; see [TRADEMARKS.md](TRADEMARKS.md).
Contributions use a DCO sign-off; see [CONTRIBUTING.md](CONTRIBUTING.md).
