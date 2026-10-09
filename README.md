# govSim

Play a fictional President of the United States, inaugurated into the real,
present-day country. One goal: leave America as prosperous as possible — or, in
satirical evil mode, drain it and escape with the loot. Along the way, learn how
government actually works (and how much better it could).

Open source, browser-based, nonpartisan. Real parties, fictional people.

**Status:** design agreed; app scaffold (status bar, grouped rail, deterministic turn engine) in place. See [docs/design.md](docs/design.md).

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
