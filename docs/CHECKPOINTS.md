# Checkpoints

One entry per milestone, written when the milestone is submitted for review.

## Milestone 1: Scaffold + combat core

**Date:** 2026-11-13 · **Branch:** `milestone-1-scaffold-combat`

### What was built

**Project scaffold**
- Vite + React 19 + strict TypeScript, Vitest and ESLint (flat config).
- Scripts: `dev`, `test`, `check` (typecheck + lint + tests), `build`. `sim` comes in Milestone 3.
- `.github/workflows/ci.yml` runs `npm ci`, `check` and `build` on every PR and push to `main`, on Node LTS.
- `.github/workflows/deploy.yml` builds and deploys to GitHub Pages on push to `main`.
- `.github/pull_request_template.md` mirrors the checkpoint sections.
- README with "How this was built" and MITRE ATT&CK credit, `src/assets/ATTRIBUTION.md`, and `docs/` (DESIGN, DECISIONS, CHECKPOINTS, BALANCE).

**Combat engine** (`src/engine/`, pure and deterministic)
- `rng.ts`: seeded mulberry32 RNG. Its whole state is one number stored in the combat state.
- `deck.ts`: draw, discard, reshuffle the discard pile into an empty draw pile, and a 10-card hand cap.
- `damage.ts`: block absorbs damage first.
- `intents.ts`: weighted enemy move selection with a `maxInARow` streak limit.
- `combat.ts`: `startCombat()`, `combatReducer()` (`PLAY_CARD`, `END_TURN`), Cycles, win/loss, a 50-turn cap, and `whyCantPlay()` for the UI.
- Lint rules forbid `Math.random`, `Date`, DOM globals and React imports inside `src/engine/`.

**Content** (`src/data/`): Brute Force (6 damage), Obfuscate (5 Block), the **Firewall** enemy with 3 intents, the demo fight, and a starter `terms.ts`.

**Debug UI** (`src/ui/`): one playable fight against the Firewall. Tap a card to play it and tap End Turn. A winning or losing screen offers a new fight. The fight's seed is shown on screen.

**Tests:** 47 tests across 6 files. They cover RNG determinism and distribution; draw, reshuffle, hand cap and card conservation; block math; intent streak limits; the combat rules (costs, damage vs block, block expiry for both sides, win, loss, turn cap, immutability); same seed giving the same game; content validation; and a 300-seed random-play fuzz test showing every fight terminates.

### What to playtest on a phone

The real phone UI is Milestone 4, so this is a smoke test:
1. Open the deployed page (or `npm run dev` and visit `/kill-chain/` from your phone on the same network with `npm run dev -- --host`).
2. Play a few fights against the Firewall. Check that the intent shown matches what the Firewall actually does when you end your turn.
3. Check that Firewall block soaks your Brute Force damage on the following turn, and that your block resets each turn.
4. Win one fight and lose one (end turn repeatedly). Confirm "Exfiltrated" / "Burned" and that New Fight works.

### Known issues

- **GitHub Pages isn't enabled yet.** The deploy workflow needs **Settings → Pages → Source: GitHub Actions**. The repo is private, and Pages for private repos needs a paid GitHub plan, so either upgrade or make the repo public when you're ready. I didn't change any repo settings.
- **The hand scrolls sideways** at 360–430px (about 4 of 5 cards visible). That's acceptable for a debug screen; the real hand layout is Milestone 4.
- **The debug UI auto-targets the first living enemy.** Proper target selection comes with multi-enemy fights.
- **`npm audit` reports a moderate advisory** (minimatch ReDoS) in a dependency of `typescript-eslint`. It's dev-only lint tooling and never ships to players. The suggested `--force` "fix" downgrades typescript-eslint, so I left it.
- **TypeScript is pinned to 6.0.x** until typescript-eslint supports TS 7 (see DECISIONS.md).

### Balance numbers

From one-off bots (the full simulator is Milestone 3), 2,000 fights each, demo Arsenal vs Firewall:

| Bot | Win rate | Avg turns | Avg OpSec left | Turn caps |
| --- | --- | --- | --- | --- |
| Random | 100% | 9.6 | 35.7 / 60 | 0 |
| Greedy | 100% | 10.4 | 51.6 / 60 | 0 |

The Firewall's damage was raised after a first pass showed it was trivial. Details are in [`BALANCE.md`](BALANCE.md).

### Layouts checked

360px, 390px and 430px in headless Chrome. Everything renders, and the End Turn button and cards are well over 44px tall.

## Milestone 2: Content system

**Date:** 2026-11-15 · **Branch:** `milestone-2-content-system`

### What was built

**Content system (engine)**
- **Effects as data:** damage (single, all enemies, multi-hit, extra per-Chain scaling), block, draw, gain Cycles, change Alert, apply status, Exploit, and "If Alert is …" conditions. Card text is generated from this data.
- **Keywords:** Noisy N, Burner, Stash, plus the **Implant** card type for lasting effects.
- **Alert:** 0–20 meter; Quiet / Noisy / Detected / Lockdown add +0/+1/+3/+5 to every enemy hit.
- **Chain:** in-order tactics within a turn add stacks; each stack adds +2 to every damage hit.
- **Statuses:** Vuln, Exposed, Throttled, Stalled and Hardened are built in. Implants are data-driven turn-start effects.
- **Enemy abilities:** attack (multi-hit), block, raise Alert, cleanse debuffs, buff self, destroy Implants, and "when attacked" triggers.
- **Intent preview:** enemies show real damage after Alert, Hardened and Throttled.

**Content (data only)**
- **Social Engineer:** 10-card starter Arsenal and an 8-card pool (Throttle, Stall, Alert reduction, Quiet bonuses).
- **Exploit Dev:** 10-card starter Arsenal and an 8-card pool (Vuln setup, Exploit payoffs, loud damage).
- **Act 1 enemies:** Firewall, EDR, SOC Analyst, Honeypot, and the **Patch Cycle** Hardened Target.
- **Act 1 encounters:** 3 easy, 4 normal, 1 elite.

**Simulator:** `npm run sim` plays every class × encounter with random, greedy and chain-focused bots. It reports win rate, turns, OpSec lost, peak Alert and max Chain, and warns about turn caps, stuck fights and suspected infinite combos.

**Debug UI:** pick a class and encounter, tap an enemy to target it, and see the Alert level, Chain, status chips, real intent numbers and generated card text. Cards that would extend your Chain are marked ▲. Replay links: `?class=…&encounter=…&seed=…`.

**Tests:** 148 across 13 files. They cover every new rule (Chain, Alert levels and bonuses, conditions, Exploit, Exposed, Throttled, Stalled, Hardened, cleanse, Implants and their removal, Honeypot triggers, Burner, Stash, draw, Cycles, intent preview), state cloning, generated card text, sim determinism and infinite-combo detection. Content tests validate every id and cross-reference, and fuzz-test random play in all 16 class × encounter combos.

### What to playtest on a phone

Run `npm run dev -- --host` and open the Network URL on your phone, at `/kill-chain/`.

1. **Social Engineer vs EDR + Honeypot.** Try to win without touching the Honeypot until the EDR is down. Watch Alert stay Quiet, and use Pretexting to see Throttled reduce the EDR's shown attack number.
2. **Exploit Dev vs EDR (easy).** Active Scanning → Exploit Public App on the same turn is a Chain 1 combo. Then see what happens to your Vuln when the EDR uses Remediate.
3. **Exploit Dev vs Honeypot + SOC Analyst.** Feel Alert climb to Detected, and check the intent numbers go up with it.
4. **Either class vs Patch Cycle.** It should feel tough and leave you hurt.
5. **Look and feel:** do the Chain ▲ hints make sense? Is Alert readable at a glance? Is the card text clear?

Pool cards (Implants, Stall, Ransomware, …) can't be drawn yet; they arrive with Loot in Milestone 3. Their rules are covered by tests.

### Known issues

- **Pool cards aren't simulated yet.** Only starter decks are measured. Card pick-to-win rates need Loot and full runs (Milestone 3).
- **The debug UI is still not the real phone UI** (Milestone 4). The hand scrolls sideways, there's no card inspect panel yet, and status descriptions only show as desktop tooltips.
- **Chain is modest with starter decks** (1–2 stacks per fight on average). This is expected with only 3–4 tactics in each starter deck; pool cards should lift it. Watch in Milestone 3.
- **The Pages deploy isn't enabled**, by choice while the repo is private. Test locally.
- Carried over: the moderate `npm audit` advisory in dev-only lint tooling, and TypeScript pinned to 6.0.

### Balance numbers

Greedy bot (the stand-in for a sensible player), starter Arsenal at full 65 OpSec, 500 fights per cell:

| Tier | Social Engineer: win / OpSec lost | Exploit Dev: win / OpSec lost |
| --- | --- | --- |
| Easy (3 encounters) | 100% / 2–9 | 100% / 3–10 |
| Normal (4 encounters) | 100% / 9–23 | 100% / 10–26 |
| Elite: Patch Cycle | 100% / 40 | 98% / 44 |

There were no turn caps, stuck fights or suspected infinite combos. The two classes are within about 4 OpSec of each other on every encounter. Exploit Dev wins 2–4 turns faster but runs much higher Alert. The full report and tuning log are in [`BALANCE.md`](BALANCE.md).

### Decisions for your review

These are marked ★ in [`DECISIONS.md`](DECISIONS.md) because players will notice them:
- **Chain:** strictly later tactic = +1, same or earlier tactic breaks it; +2 damage per stack per hit, including the card that extends it.
- **Alert:** level thresholds and flat damage bonuses, with no natural decay.
- **New keywords:** Burner, Stash and Implant.
- **Class mechanics:** Exploit Dev's Vuln → Exploit loop, and Social Engineer's Throttled and Stalled.

### Layouts checked

The setup and fight screens at 360px, 390px and 430px in headless Chrome. I fixed one bug (enemy panel text was vertically centered). Two enemies fit side by side at 360px.

## Milestone 3: Run loop

**Date:** 2026-11-16 · **Branch:** `milestone-3-run-loop`

AggroSec made every design choice in this milestone, in chat and on issues #3–#7. The content proposal is #6.

### What was built

**Run engine (`src/engine/run/`)**
- `startRun` and a pure `runReducer` that move between the phases: map → fight → Loot → … → boss. It's fully seeded, so the same seed and the same choices give the same run.
- **Map generator:** 12 floors × 4 lanes with non-crossing paths. Node odds come from data, and the floor before the boss is all Safehouses. Your first 3 map fights use the easy pool.
- **Loot:** pick 1 of 3 cards (or skip) plus Crypto. Hardened Targets add a Tool. The boss offers 2 0-day cards.
- **Safehouse:**
  - Lay Low recovers 35% of max OpSec.
  - Weaponize upgrades a card to v2.
  - Go Dark Wipes a card for free.
- **Dark Web:** 5 cards (one 50% off) and 2 Tools. Wipes have no per-visit limit, and the price rises with each one.
- **Intel events**, using run effects: Crypto, OpSec, cards, Tools, upgrades, Wipes, trade-ups, Heat and fights.
- **OpSec carries over between fights.** The Arsenal can't drop below 5 cards. A fight that hits the turn cap burns the run.
- **New mechanics:**
  - **Heat:** raises your starting Alert for the next fight.
  - **Tool fight bonuses:** less Noisy, extra turn-1 draw or Cycles, and start-of-fight effects.
  - **`buffAllies`:** an enemy effect that buffs every other living enemy.

**Content (data)**
- 12 new cards per class (20-card Loot pools), and a hand-written v2 for all 48 cards.
- 3 new Implants, 8 Tools and 8 Intel events.
- **The Incident Response Team boss:** Forensics Analyst, Incident Commander and Threat Hunter.
- Every card shows its kill chain step, e.g. "3 · Initial Access".

**Simulator:** `npm run sim` now plays full runs (2,000 per class per bot). It reports:
- win rate and floor reached
- what ends runs
- card pick-to-win, with outliers flagged
- Tool and Safehouse win rates
- turn caps, stuck runs and suspected infinites

The sensible bots choose a route, Loot, the Safehouse option, Dark Web purchases and event choices. They pick cards by measured value. `--mode fights` keeps the single-fight report.

**Debug run UI:**
- A main menu to start a run, continue a saved run, or play a practice fight.
- The map, Loot, Safehouse, Dark Web and Intel screens, a run header (OpSec, Crypto, floor, Heat, Tools, Arsenal), and win and lose screens.
- The run is saved in localStorage, so refreshing doesn't lose it.
- Replay links: `?class=…&seed=…`.

**Tests:** 247 across 21 files:
- **Run engine:** map invariants over 200 seeds, every phase and action, purity, Heat, Tool bonuses, trade-ups and the minimum Arsenal size.
- **Content:** v2s, pools, Tools, events, run config and the boss.
- **Simulator:** full-run smoke tests on real data, determinism, aggregation, and a regression test for the bot that stalled on enemy block.

**Also this session:** the repo is public, GitHub Pages is live at https://aggrosec.github.io/kill-chain/, and the noncommercial license is in its own PR (#8).

### What to playtest on a phone

After merging, Pages deploys automatically. Open **https://aggrosec.github.io/kill-chain/** on your phone. No LAN or VPN needed.

1. **Play a full run with each class.** Does 12 floors feel like the right length? Is it about as hard as 35–50% suggests?
2. **The map:** can you read the route and tap nodes comfortably? Try planning a path around a Hardened Target (☠).
3. **Social Engineer:** try a quiet build (Long Con, Watering Hole, Insider Contact) and keep Alert low into the boss.
4. **Exploit Dev:** after this milestone's buffs, does Scan → Exploit feel strong enough? Do you still feel "loud"?
5. **The IR Team boss:** does kill order matter? Try killing the Threat Hunter first, then the Forensics Analyst first.
6. **Kill chain step numbers on cards:** does "play increasing numbers" make Chains easier to see?
7. **Refresh mid-run:** the run should still be there (Menu → Continue Run).

### Known issues

- **One commit fails tests on its own:** 53df1c1. The test fix landed in the next commit (08d71de), because a force-push to amend it was blocked. Squash-merging hides this.
- **The debug UI isn't the phone UI yet** (Milestone 4):
  - Fights inside a run don't show the run header (Crypto, Tools).
  - There's no card inspect panel.
  - The map is functional but plain.
- **Hit-all-enemies cards are weak against the Honeypot.** Email Collection, Drive-by Compromise and Web Shell all measure as net negatives on starter decks (see BALANCE.md). It works as designed, but worth watching in playtests.
- **Six cards sit slightly under the 35% pick-to-win line** (29–34%): MFA Fatigue, Help Desk Pretext, Living off the Land, Exploitation for Privilege Escalation, Escape to Host and Scripting. Not dramatic outliers, but candidates for a future pass.
- **Floor 1 can roll a Hardened Target or Safehouse.** This is by design, since you chose not to fix floor 1. You can route around them.
- **Card values are measured on starter decks only**, so they understate cards that need a built deck (e.g. Chain payoffs).
- **The random bot never wins a run.** That's expected for random play over 12 floors.
- **1–2 turn caps per 2,000 Social Engineer runs.** Ideas for the turn cap are in #7.
- Carried over: the moderate `npm audit` advisory in dev-only lint tooling, and TypeScript pinned to 6.0.

### Balance numbers

`npm run sim`, 2,000 runs per class per bot, Act 1:

| Bot | Social Engineer | Exploit Dev |
| --- | --- | --- |
| greedy | 40% (avg floor 12.5) | 35% (avg floor 11.8) |
| chain | 39% (avg floor 12.6) | 35% (avg floor 11.7) |
| random | 0% | 0% |

Both classes are inside the 35–50% target (#5). The IR Team ends about half of all runs. There were no stuck runs and no suspected infinites. The tuning history is in [`BALANCE.md`](BALANCE.md), including how fixing the bot's card picks changed the picture.

### Decisions for your review

You made all the design decisions in this milestone. Implementation choices are in [`DECISIONS.md`](DECISIONS.md) under Milestone 3: the run engine structure, v2s as "+" ids, the simulator bots, localStorage saves and the map rendering.

### Layouts checked

In headless Chrome at 360px, 390px and 430px: the menu, map, Intel, Loot, fight-in-run, Dark Web, Wipe picker, Safehouse and Weaponize picker. Two fixes came out of this:
- The boss node is now centered.
- Weaponize shows each card's v2, and Lay Low says "up to".

## Milestone 4: Playable phone UI

**Date:** 2026-11-19 · **Branch:** `milestone-4-phone-ui`

AggroSec made the design choices in #17. The v2 comparison is #14 and the help content is #9.

### What was built

- **A touch-first fight screen.**
  - An overlapping hand fan that fits 10 cards.
  - Tap a card to select it, then tap an enemy or Play.
  - Sliding a finger across the fan also selects.
- **The selected card shows its real numbers at the current Chain** (e.g. "Gain **9** Block" at Chain 2), plus short explanations of its keywords and statuses.
- **Compact enemy panels** in a row of 3, with Integrity bars, short intents and status chips. Tap an enemy for full details.
- **Card art system.**
  - Frames are colored by tactic: blue at step 1, through purple, to red at step 14.
  - Placeholder art is a game-icons.net icon per tactic.
  - Real art needs only an image file and an `art` field.
- **Weaponize shows each card as its v2,** with changes highlighted ("Deal 6 → 9") and a badge ("v2: −1 Cost") (#14).
- **Card picks are tap-then-confirm** everywhere: Loot, Dark Web, Safehouse and Intel.
- **A Menu button in fights and on run screens.** It holds Resume, Glossary, Settings, and Save and quit.
- **Glossary** of every themed term, kept short.
- **Settings** with 3 themes: Green terminal, Amber terminal and Soft dark.
- **Credits screen.**
- **A guided first fight**, offered once on first launch. It can be skipped and replayed from How to Play.
- **Replays show status changes.**

### What to playtest on a phone

After merging, open **https://aggrosec.github.io/kill-chain/**. Your saved settings are new, so the guided fight offer will show once.

1. **Guided fight:** do the tips make sense in order? Is anything missing for someone new to the game?
2. **Hand:** select and play cards with taps, then try sliding a finger across the fan. Does a big hand (Burner Phone, draw cards) stay usable?
3. **Targeting:** select an attack, then tap an enemy. Does the pulsing outline make it clear what to tap?
4. **Chain numbers:** play cards in increasing step order. Does the selected card's highlighted number match what happens?
5. **Weaponize:** can you spot cost cuts (−1 Cost) at a glance now?
6. **Themes:** try all three in bright light and in the dark.
7. **Menu mid-fight:** open the Glossary in the middle of a fight, then come back.

### Known issues

- With 10 cards on a 360px phone, each card shows about 27px, under the 44px tap-target rule. Slide-to-select is the workaround. Larger phones or fewer cards are fine.
- The map, run header, Safehouse, Dark Web and Intel screens use the new card and button styles, but their layouts are the M3 ones, cleaned up. They work, but aren't redesigned.
- No animations yet (Milestone 6).
- The Exploit Chain bonus isn't shown on the card, since it's added to the total rather than per Vuln stack.

### Balance numbers

No rule or content numbers changed in this milestone. 2,000 runs per class per bot:

| Bot | Class | Win | Avg floor reached | Turn caps | Stuck | Suspected infinites |
| --- | --- | --- | --- | --- | --- | --- |
| random | Social Engineer | 0% | 7.4 | 0 | 0 | 0 |
| random | Exploit Dev | 0% | 7.1 | 0 | 0 | 0 |
| greedy | Social Engineer | 45% | 12.9 | 1 | 0 | 0 |
| greedy | Exploit Dev | 45% | 12.4 | 0 | 0 | 0 |
| chain | Social Engineer | 45% | 12.9 | 3 | 0 | 0 |
| chain | Exploit Dev | 46% | 12.3 | 0 | 0 | 0 |

### Layouts checked

360, 390 and 430px:
- fight against the 3-enemy boss team, with a card selected and a Chain preview
- enemy sheet
- pause menu
- Weaponize picker
- Dark Web, Loot, Intel and map
- glossary, settings and the main menu with the tutorial offer
- guided fight steps

A unit test checks that the hand fan keeps 1–10 cards on screen at all three widths.
