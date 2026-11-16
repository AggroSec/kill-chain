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

## Milestone 2: Content system

### Mechanics (★ = noticeable to players; flagged for AggroSec's review)
- ★ **Chain rule: strictly later tactic = +1. The same or an earlier tactic breaks the Chain to 0.** "Same tactic keeps the Chain" was the alternative, but repeating Phishing would then never break anything. Strict ordering makes tactic variety a real deckbuilding goal. CLAUDE.md: "pick the option that makes card synergies more interesting".
- ★ **Chain bonus is +2 per stack to every damage hit, and it applies to the card that extends the Chain.** "Boost later cards" reads naturally as including the card that just made the Chain. Rewarding the payoff card feels much better, and it makes finishers (Impact, Exfiltration) satisfying. Per hit rather than per card, so multi-hit cards synergize with Chain.
- ★ **Alert levels: Quiet 0–4, Noisy 5–9, Detected 10–14, Lockdown 15–20.** Enemies get a flat +0/+1/+3/+5 per attack hit. Flat numbers are easy to read on a phone and make multi-hit enemies scarier at high Alert. The intent display always shows the final numbers.
- ★ **Alert never decays on its own.** Only cards and enemies move it. Natural decay would make Social Engineer's Alert-lowering much less valuable, and quiet play should be a choice you build for.
- **Noisy raises Alert after the card resolves**, so a loud card's own "If Quiet" check sees the Alert from before it was played.
- ★ **Keywords: Burner (used once per fight), Stash (stays in hand) and Implant (a card type for lasting effects).** These are genre-standard, and Implants give the Patch Cycle elite ("destroys your persistence effects") something to destroy. "Burner" fits the theme (burner phone), and a rename is one line in `terms.ts` if it's confused with "Burned".
- ★ **Exploit Dev's "setup" is Vuln stacks plus Exploit payoffs.** That gives "high damage cards that need setup" a concrete form that the EDR ("removes your debuffs on enemies") naturally counters.
- ★ **Social Engineer's intent manipulation is Throttled (weaker attacks) and Stalled (skip an action).** Stall is powerful, so it's a 2-cost Burner.
- **Honeypot's trigger fires once per card that damages it, even if the hit kills it.** Per hit would make multi-hit cards unusable against it. Firing on the killing blow keeps "don't touch the Honeypot" a real decision. Exploit with no Vuln deals no damage, so it doesn't count as an attack.
- **Patch Cycle removes the oldest Implant first** (deterministic, and players can see it coming).
- **Duration debuffs (Exposed, Throttled) tick down after the affected enemy acts.** Throttled 1 applied on your turn therefore weakens that enemy's next attack, which is what players expect.

### Engine architecture
- **Content types split into `contentTypes.ts`** (static data shapes) and `types.ts` (runtime state), to keep files focused and under 300 lines.
- **Statuses are data with a few built-in rules.** Vuln, Exposed, Throttled, Stalled and Hardened have engine behavior keyed by id (`CORE_STATUS`). A content test checks that `src/data` defines them all. Implants are fully data-driven through `onTurnStart` effects, so new Implants need no code.
- **Effects that need a target are detected automatically** (`effectsNeedTarget`), including inside "If Alert" conditions, so data authors can't forget to mark a card as targeted.
- **Hand-written `cloneCombatState()` replaced `structuredClone`.** The simulator clones state thousands of times per second. A test verifies the clone is fully independent.
- **Intent preview (`previewIntent`, `incomingDamage`) lives in the engine**, so the UI and bots read the same numbers and the UI never does game math.

### Content
- **Card lists are arrays, not objects keyed by id** (`byId()` builds lookups). Arrays read more naturally, and a content test rejects duplicate ids.
- **Living off the Land and Fuzzing are Burner** so they can't loop forever in a trimmed Arsenal. The simulator now flags any turn with more than 30 card plays as a suspected infinite.
- **Encounter swap: Firewall + SOC Analyst → Firewall + Honeypot.** The original pair cost about 36 OpSec, well above other normal fights (see BALANCE.md).
- **Both classes start at 65 OpSec.** The sim shows the classes close without class-specific OpSec. The fragile class is the Insider (Milestone 5).

### Simulator and tooling
- **`npm run sim` exists now (fight-level) instead of waiting for Milestone 3.** CLAUDE.md asks for simulator balance numbers at every checkpoint, and fights need balancing before runs can be. Milestone 3 extends it to full runs.
- **The sim runs through Vite's `runnerImport`** (`scripts/sim.mjs`), so TypeScript runs in Node with no new dependency such as tsx.
- **Bots use 1-step lookahead through the real reducer.** They score each legal play by its resulting state instead of using hard-coded card logic, so new cards and effects work with the bots automatically.
- **Replay links:** `?class=<id>&encounter=<id>&seed=<n>` starts an exact fight. Seeds shown on screen make any bug reproducible.

## Milestone 3: Run loop

Design decisions for this milestone were made by AggroSec during planning (see the M3 planning issues #3–#6). Only implementation choices are logged here.

### Engine architecture
- **The run engine lives in `src/engine/run/`** and mirrors the combat engine: `startRun(classId, seed, content)` plus a pure `runReducer`. Invalid actions return the same state object.
- **Combat actions take a fast path in the run reducer.** They only wrap the combat reducer, which already returns a new object, so the whole run (map included) isn't copied on every card play. Other run actions are rare and use `structuredClone`.
- **Each fight gets its own seed from the run RNG.** A run seed decides the map, every encounter, all Loot and every fight's shuffles.
- **v2 cards are separate registry entries ending in "+"** (e.g. `phishing+`), built from each card's `v2` data by `withUpgrades()`. The Arsenal stores ids, so an upgraded copy is just a different id. The combat engine, bots and UI treat a v2 like any other card, with no special cases.
- **`EncounterDef` moved from `src/data` into the engine** (`run/runTypes.ts`), because the run engine picks encounters. The data file re-exports it.
- **Run numbers live in a `RunConfig` passed in with the content**, not as engine constants. Map odds, Loot tables, prices and Lay Low % can then be tuned in `src/data` like the rest of the content, and tests use their own fixed config.
- **Map generation draws non-crossing paths, then rolls node kinds.** Links only step to the same or a neighboring lane, so the map reads cleanly on a narrow screen. Tests check 200 seeds for reachability, no crossing links and the floor rules.

### Simulator
- **Run bots = a fight bot + a run-choice policy.** `random` pairs the random fight bot with random choices, which gives the least biased card pick-to-win signal. `greedy` and `chain` pair their fight bots with a `sensible` policy: heal when under half OpSec, avoid Hardened Targets when hurt, take the rarest card, buy Tools first, and trim the most-duplicated starter card. These are rough player stand-ins, not optimal play.
- **Fight-bot fix: stripping enemy Block now counts in the score (at half value).** Before, a first hit that only removed Block looked worthless, so lookahead bots ended their turns forever against block-only enemies and hit the turn cap. A regression test covers it. M2 fight numbers moved by less than 2 OpSec.
- **A run counts as "stuck" if a bot ever sends an invalid action**, so a bot bug shows up in the report instead of looping forever.
