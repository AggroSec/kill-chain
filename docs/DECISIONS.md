# Decision Log

Judgment calls made during implementation, newest milestone last. Each entry: what was decided, and why.

## Milestone 1: Scaffold + combat core

### Tooling
- **TypeScript pinned to `~6.0`.** TypeScript 7 is out, but `typescript-eslint` (needed for `npm run check` lint) only supports `<6.1`. Revisit when typescript-eslint supports TS 7.
- **Strict compiler extras on:** `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. They catch "array index might be undefined" bugs that are common in card/pile code.
- **ESLint guards the engine.** In `src/engine/`, lint errors on `Math.random`, `Date`, `window`, `document`, `localStorage` and React imports. This enforces "engine is deterministic and DOM-free" automatically instead of relying on review.
- **No Prettier** for now. It's one less dependency, and ESLint covers correctness. Can be added later if formatting drifts.
- **Vite `base` is always `/kill-chain/`**, including the dev server. GitHub Pages serves from that path. Using it everywhere keeps `vite preview` working and avoids "works locally, 404s on Pages" bugs.
- **CI uses `node-version: lts/*`** so it tracks the current Node LTS without manual bumps.

### Engine architecture
- **Reducer style:** `combatReducer(state, action, content) => newState`. It clones state with `structuredClone`, then applies changes to the clone. The clone-then-mutate style is easier to read than deeply nested spread copies, and the old state is never touched (tested).
- **Invalid actions return the same state object.** For example, a card you can't afford leaves the state untouched. `whyCantPlay()` tells the UI *why*, so it can grey out cards. No exceptions are thrown for player mistakes; exceptions are reserved for bad data (unknown ids).
- **RNG state is a single number in `CombatState.rngState`** (mulberry32). Saving or replaying a fight is just saving the state, and same seed + same actions = identical state (tested).
- **Content is injected** (`ContentRegistry`) rather than imported by the engine. Tests use small fixture cards and enemies, so rebalancing real data never breaks engine tests.
- **Card effects are already a list of typed effects** (`damage`, `block`). Milestone 2 extends this union instead of replacing a hard-coded card format.
- **Card copies get unique `uid`s** so two "Brute Force" cards can be told apart (React keys, future targeting of specific cards).
- **Multiple enemies are supported** by the data model and actions (`targetIndex`), even though Milestone 1 only fights one.

### Rules choices
- **Hand limit 10; overflow draws go to discard.** This matches genre convention and the "hand usable with 10 cards" UI requirement.
- **Enemy block expires when that enemy next acts**, not at the start of the Operator's turn. Otherwise enemy block would be pointless, and the Firewall's heavy-block identity depends on it.
- **Turn cap = 50 turns**, with outcome `turnCap` (separate from `lost`), so the simulator can report stalemates separately. How a run treats it (likely counts as Burned) is a Milestone 3 decision.
- **Enemy moves support `maxInARow`** to prevent frustrating streaks from RNG while keeping weighted randomness.

### Content and UI
- **Milestone 1 enemy is the Firewall** (from the roster in CLAUDE.md). It's the simplest enemy to build with only damage and block, and it already shows why intents matter.
- **Firewall tuned up after measuring.** At first (Attack 9 / Attack 6 + Block 6) even random play won 100% losing ~10 OpSec. Raised to 13 / 9 + 6. See BALANCE.md.
- **`src/data/terms.ts` created early** (Milestone 3 lists it) so the Milestone 1 debug UI doesn't hard-code themed words that would need hunting down later.
- **Milestone 1 UI is a debug screen**, not the real phone UI (that's Milestone 4). Hand scrolls horizontally, cards auto-target the first living enemy, buttons are ≥44px tall.
- **The UI picks fight seeds with `Math.random`** and shows the seed on screen. Only the engine must be deterministic, and showing the seed makes any reported bug replayable.
