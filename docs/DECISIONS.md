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
- **Sensible run bots pick cards by measured value, not rarity.** `cardValues.ts` plays each class's starter Arsenal, with and without one extra pool card, against every Act 1 normal and elite encounter. A card's value is the OpSec it saves per fight. Picking by rarity made the bot grab loud 0-days that hurt its runs, so it badly underrated both classes: Social Engineer went from 36% to 79% wins with the same game data. The bot now skips Loot when every choice scores at or below 0.

### UI (Milestone 3 debug screens; the real phone UI is Milestone 4)
- **The current run is saved to localStorage** after every action, under a versioned key, with every read and write in try/catch. A refresh or a locked phone doesn't lose the run. A malformed or old save is ignored.
- **Replay links now cover runs:** `?class=<id>&seed=<n>` starts that exact run. Adding `&encounter=<id>` still starts a single practice fight.
- **The map is HTML buttons over an SVG layer of links.** Nodes are 44px tap targets. Floor 1 is at the bottom and the boss is at the top, and the view scrolls to your next choices.
- **Card choices (Weaponize, Go Dark, Wipe, event card picks) use one `DeckPicker` overlay.** Buttons are enabled by asking the engine whether the action is valid, so the UI never repeats rule checks. Weaponize shows each card as its v2 so you can see the upgrade before choosing.
- **Every card shows "N · Tactic"** (kill chain step and name) through one shared `CardFace` component, used in the hand, Loot, the Dark Web and the Arsenal view.

## Run logs (side task after Milestone 3, requested by AggroSec)

- **A run log is the class, the seed and every action taken.** The engine is deterministic, so that is enough to replay a run exactly, every draw, intent and Loot roll included. No game events need logging. A full Act 1 run is about 400 bytes, small enough to paste from a phone.
- **Actions are short tokens** (`p2.0` = play hand card 2 at enemy 0, `e` = end turn, `n:3-1` = go to node 3-1; see `src/engine/run/runLog.ts`). The text format is plain `key: value` lines, so a log survives being pasted into a GitHub issue or a chat message, and the parser ignores text around it.
- **Each log records the build (short commit id).** Card or enemy changes after that commit can make a replay drift. The replay warns about a mismatch and stops at the first action the engine rejects.
- **The save now stores the action list.** Saves from before this change have none. Their log carries the final run state as JSON instead, so the run that prompted this feature can still be looked at.
- **The last 5 finished or abandoned runs are kept** in localStorage when a new run starts, so a log isn't lost by starting another run.
- **Getting a log off the phone:** Menu → Run Logs, or the Burned/Exfiltrated screen. Copy Log uses the clipboard, and the text sits in a box you can select by hand if the clipboard is blocked. Report on GitHub opens a new issue with the log prefilled (hidden if the URL would be too long).
- **`npm run replay -- <file>`** prints a turn-by-turn account (hands, intents, each card's effect, enemy turns, Loot and shop choices) by comparing the state before and after each action.

## Chain boosts block (after Milestone 3, chosen by AggroSec)

- **Each Chain stack adds +2 to block effects**, the same as damage. Most block cards are Defense Evasion (kill chain step 7), so they tend to land late in a chain, where the Chain bonus used to be wasted. The bonus lives in `operatorBlock()` next to `operatorHitDamage()`, with the number in `rules.ts` (`CHAIN_BLOCK_PER_STACK`).
- **Statuses get no Chain bonus.** Simmed as +1 stack per 2 Chain: it moved win rates by under 1 point, because almost every status card is kill chain step 1–3 and starts a chain instead of ending one. Future Chain ideas are collected in an issue.
- **Retune: boss team Integrity +10%** (Forensics Analyst 37 → 41, Incident Commander 77 → 85, Threat Hunter 43 → 47). Boss-only changes kept the two classes level. Changes to all enemies hurt Exploit Dev more, because it loses more runs before the boss. See BALANCE.md.

## Milestone 4: Playable phone UI

Design choices were made by AggroSec in #17 (hand fan, tap-then-target, enemy row, tactic icons, v2 badges, help in M4, three themes). Implementation choices are logged here.

- **The fan is laid out in code (`fanPosition` in `Hand.tsx`), not CSS.** It needs the hand's real width to work out the overlap, and unit tests check that 1–10 cards stay on screen at 360, 390 and 430px.
- **Slide-to-select on the hand.** With 10 cards on a 360px screen, each card shows only about 27px, below the 44px tap-target rule. Sliding a finger across the fan lifts the card under it, so a big hand stays usable. Taps alone still work everywhere (CLAUDE.md: dragging is never required).
- **Chain-boosted numbers come from the engine.** `cardAtChain()` returns the card with the Chain bonus added to damage and block, and a test checks it matches what playing the card really does. Exploit's Chain bonus is added to the total, so it can't be shown per stack and is left as is.
- **Changed numbers are found by comparing text.** A word-level diff (`textDiff.ts`) of the base and changed card text drives both the Chain highlights and the v2 "6 → 9" previews, with no hand-written upgrade notes.
- **v2 badges compare card data, not text.** Text was ambiguous (e.g. "Lower Alert by 3 → 4" read as "+1"). `upgradeSummary()` compares the effects, puts cost changes first and shows at most 2 changes.
- **Card picks are select-then-confirm everywhere.** Picking was one tap in M3, so a stray tap while scrolling could take or delete the wrong card.
- **Themes are CSS variables keyed on `<html data-theme>`.** Every color comes from these variables, so a new theme is one CSS block. Card frames take their hue from the tactic, and each theme sets the saturation and lightness. The saved theme is applied before the first render, so the page never flashes the default colors.
- **Tactic icons are game-icons.net SVGs used as CSS masks,** so they take the frame color in every theme. The black background square was removed. Small SVGs are inlined by Vite as `data:` URLs, which must be quoted inside `url()`.
- **Card art stays data-driven.** Drop an image in `src/assets/cards/` and set the card's `art` field. A missing or broken image falls back to the placeholder.
- **The glossary takes its numbers from the engine** (Alert thresholds, Chain bonus, Cycles), and statuses come from their data, so it can't drift from the rules. A test checks that every icon author in ATTRIBUTION.md is also on the credits screen.
- **The guided fight is a normal fight with a fixed seed and +1 card on turn 1** (an existing Tool modifier), plus a list of tips that advance on game state. A test pins the opening hand and steps through the script, so a content change can't silently break it.
- **The pause menu opens on top of the game,** so Glossary and Settings never interrupt a fight. Runs autosave after every move, so "Save and quit" just leaves.
- **Replays now show status changes** (e.g. "Firewall +2 Throttled") instead of "no visible change".

## Milestone 5: Acts 2–3, Final Targets, Insider, class levels and Bounties

The plan and every design choice are AggroSec's (#22). Implementation choices are logged here.

- **Boss Loot between acts.** Beating an Act 1 or 2 boss uses the boss Loot table (2 0-day picks and a Tool), then the next act starts when the Loot screen closes. The OpSec recovery is half of what's *missing*, rounded down, so it never overheals.
- **The Final Target is drawn after the Act 1 map.** Drawing it first would change every Act 1 map for a given seed whenever a target is added.
- **The act intro is a pop-up, not a game action.** Closing it is UI state, so it doesn't add tokens to run logs. The engine keeps `actStart` (act and OpSec healed) until the first node is chosen.
- **Class passives are data.** A passive is combat modifiers (Smooth Talker is a start-of-fight Stall on a random enemy; Trusted Access is a Chain start tactic plus extra damage taken), extra Cycles, and an optional bonus Loot rule. The class passive is added before Tools, so its start-of-fight effects resolve first.
- **Trusted Access starts each turn's Chain as if Initial Access (step 3) was played.** Chain count stays 0, so the first card of a turn at step 4 or later is the first stack. A step 1–3 card breaks it like any out-of-order card.
- **The bonus pick comes after normal Loot,** as a second Loot screen. It reuses the pick/skip actions, so the run log format didn't change.
- **Enemy debuffs on you tick down at the end of your turn,** like your own statuses. One stack applied during the enemy turn lasts through your next turn. Exposed from an add hits harder on the same enemy turn when allies act after it (e.g. Kerberos before the Domain Controller).
- **Alert-gated enemy moves (`whenAlert`) are checked when the intent is rolled.** The intent shown is always what happens. The OT Facility and Conditional Access use this to react to noise.
- **Unlockable cards are locked by default.** Everything any level or Bounty unlocks is locked on a fresh profile. The locked list is stored in the run and written to the run log (`locked:` line), since it changes Loot and must replay exactly.
- **XP is only for finished runs.** An abandoned run gives nothing, so restarting can't farm XP. Rewards are saved with the run, so a refresh on the end screen can't count it twice.
- **Old saves keep working.** An Act 1 run saved before M5 gets the new fields filled in (and the Final Target its seed would draw). Its log won't replay exactly on the new build.
- **The simulator plays full 3-act runs with everything unlocked by default** (`--locked` for a fresh profile), and reports how many runs reach each act and win rates per Final Target, both overall and once Act 3 is reached.
- **Balance changes were card and enemy numbers only.** Insider OpSec, extra damage and Cycles, the passives, XP numbers and Act structure are as AggroSec set them. See BALANCE.md for the reasoning and where the sim still disagrees with the targets.

