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
