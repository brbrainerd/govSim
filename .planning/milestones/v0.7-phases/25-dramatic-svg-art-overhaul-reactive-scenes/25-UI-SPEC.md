# Phase 25 UI Design Contract — Dramatic SVG Art Overhaul & Reactive Scenes

**Phase:** 25
**Requirements:** `ART-01`, `ART-02`, `ART-03`
**Target Visuals:** `.design-targets/g-home.png`, `.design-targets/D.png`, `.design-targets/cast.png`, `.design-targets/g-crisis.png`, `.design-targets/g-powers.png`

## 1. Visual Direction & Token Guardrails

- **No bare hex/rgb in `.svelte` files**: Every fill, stroke, and stop-color MUST reference `var(--...)` from `src/design/tokens.ts`. If new shading tokens are needed (e.g., `skin-1-shade`, `suit-navy`, `suit-charcoal`), add them to `base` and `themes.evil` in `src/design/tokens.ts` first.
- **Editorial Americana Poster Style**: Bold `2.5px` (`var(--ink)`) outer ink outlines, warm inner highlights, contoured facial structure (ears, brow ridges, nose bridge, chin shadow), distinct hairstyles (`parted`, `swept`, `bun`, `cropped`, `waves`), suit lapels with collar notch, tie/pearl accessories, and expressive hands/props.

## 2. Character Mood States (`ART-01`)

`Character.svelte` accepts an optional `mood?: 'confident' | 'stressed' | 'scheming' | 'panicked' | 'triumphant'` prop (default `'confident'`) and an optional `hairstyle?: 'parted' | 'swept' | 'bun' | 'cropped'` and `glasses?: boolean` prop:
- `confident`: Slight asymmetric smirk or warm smile, relaxed angled eyebrows, upright posture.
- `stressed`: Furrowed inward eyebrows, tight wavy mouth, subtle temple sweat drop, dark under-eye crease.
- `scheming`: Narrowed half-lidded eyes, one raised arch eyebrow, sly side-grin (used in Evil Mode or backroom whip deals).
- `panicked`: Wide open eyes with shrunk pupils, high arched eyebrows, open oval mouth, double sweat drops (used during imminent shutdown/impeachment/severe crisis).
- `triumphant`: Bright eyes, raised eyebrows, broad grin, subtle gold star/sparkle accent (used on bill passage or high prosperity).

## 3. State-Reactive Scenes (`ART-02`, `ART-03`)

- **`OvalOfficeScene.svelte`**:
  - Accepts optional `session?: Session` (or explicit reactive state props: `approval`, `inflation`, `unemployment`, `hasCrisis`, `evilMode`, `heat`, `stashBn`, `stagedCount`) while keeping all props optional so `<OvalOfficeScene />` works with zero required args.
  - **Window Sky & Weather**: Clear sun/clouds in healthy economy; overcast/rain streaks when `unemployment >= 6` or `inflation >= 4.5`; lightning bolt during active crisis; ominous dark-gold skyline in Evil Mode.
  - **Resolute Desk Props**: Stacks of folders proportional to `stagedCount`, steaming coffee mug, and a pulsing red hotline telephone when `hasCrisis` is true.
  - **Evil Mode Decor**: Document shredder (`PAPER GOBBLER 3000`) beside the desk with shredded strips and an open `"CAYMAN TRUST"` ledger when `evilMode` is active; advisor sweats when `heat >= 60`.
- **`ReporterScene.svelte`**:
  - Detailed broadcast studio microphone array, camera lens reflection, studio spotlight beams, and a dynamic `chyronText` prop (defaulting to a witty institutional headline) plus reactive reporter `mood`.
- **`CourtBench.svelte`**:
  - Fluted marble columns, hanging brass scales of justice, carved wooden bench reliefs, gavel block, lace/gold judicial jabots on the 9 justices, and reactive justice `mood` expressions.
- **`FedPortrait.svelte`**:
  - Ornate dual-ring frame with classical pediment, background interest-rate yield-curve ticker board, glasses on the Fed Chair, and hawk/centrist/dove expression + lapel pin detail.
