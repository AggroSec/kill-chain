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
