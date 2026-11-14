# CLAUDE.md — Kill Chain (working title)

## What this project is

A browser-playable deckbuilder roguelite with a cybersecurity theme, in the style of Slay the Spire. The player is a red-team operator working through a target environment. Cards are attack techniques tagged with MITRE ATT&CK tactics, enemies are blue-team defenses, and playing cards in kill-chain order builds combos. Each run ends against a different final target environment.

The game is **played mostly on a phone**, so touch-first design is a hard requirement, not polish.

This is an **AI-directed project**. AggroSec (the owner) sets direction, design and priorities, and reviews every pull request. Claude Code writes the code. The repo itself is part of the showcase: specs, decisions and process should be visible and tidy.

## Working agreement (read this first)

- **Work autonomously within a milestone.** Don't stop to ask about things you can decide sensibly yourself. Record those decisions in `docs/DECISIONS.md` and keep going.
- **Stop and ask only when** a choice changes the game's design in a way the player would notice (new mechanic, removing a class, changing the run structure). The same applies when a choice adds a runtime dependency not listed below, or when you're blocked.
- **Stop at the end of every milestone.** Write a checkpoint summary in `docs/CHECKPOINTS.md` covering what was built, what to playtest on a phone, known issues and simulator balance numbers. Then open a pull request (see Git workflow) and wait for AggroSec's review.
- **Never mark work done with failing tests or type errors.** `npm run check` must pass before every commit.
- **Write code to be reviewed.** AggroSec reviews every PR and is still learning TypeScript. Prefer clear, explicit code over clever one-liners. Keep PRs focused, and explain non-obvious code in short comments.
- If a design detail in this file is ambiguous, pick the option that makes card synergies more interesting and log it.

## Git workflow

**Never commit directly to `main`.** Every change reaches `main` through a pull request that AggroSec reviews and merges.

**Branches**
- Start each milestone from an up-to-date `main` on a branch named `milestone-<N>-<short-name>`.
- Standalone fixes outside a milestone go on `fix/<short-name>`.

**Opening the PR (at each checkpoint)**
1. Make sure `npm run check` and `npm run build` pass locally.
2. Push the branch and open a PR with `gh pr create`:
   - Title: `Milestone <N>: <name>`
   - Body: the checkpoint summary, plus `Closes #<issue>` for related issues.
3. Stop and wait. **Never merge your own PRs.** AggroSec reviews and squash-merges.

**Handling review feedback**
- Read comments with `gh pr view <number> --comments`.
- Address each comment in new commits on the same branch, push, then reply on the PR summarizing what changed.
- Don't force-push or rewrite history once a review has started.

**After a merge**
- `git checkout main && git pull`, delete the merged branch, then start the next milestone branch.

**Issues**
- Bugs or ideas outside the current milestone's scope become issues (`gh issue create`), not silent fixes.

**CI/CD (set up in Milestone 1)**
- `.github/workflows/ci.yml`: on every PR and push to `main`, use the current Node LTS and run `npm ci`, `npm run check` and `npm run build`.
- `.github/workflows/deploy.yml`: deploy to GitHub Pages on push to `main`.
- `.github/pull_request_template.md` with sections matching the checkpoint summary.

**Never commit**
- Secrets, tokens, `.env` files, `node_modules/`, `dist/`, or `CLAUDE.local.md`.
- Don't change repo settings (visibility, branch protection, collaborators). AggroSec owns those.

## Stack

- **TypeScript** (strict mode) everywhere.
- **Vite** for dev server and build.
- **React** for UI.
- **Vitest** for tests.
- **Deploy:** GitHub Pages via GitHub Actions.
- **No backend.** Save data (unlocks, settings, run history) lives in `localStorage`. Wrap every read and write in try/catch and fall back gracefully.
- Allowed extra deps without asking: a tiny seeded PRNG (or inline one), `clsx`. Anything else gets asked about first.

## Architecture rules

```
src/
  engine/      # Pure game logic. NO DOM, NO React, NO Math.random, NO Date.
  data/        # Cards, classes, enemies, events, tools as typed data
  sim/         # Headless simulator + bots (runs in Node)
  ui/          # React components; reads engine state, dispatches actions
  assets/      # Card art, icons + ATTRIBUTION.md
docs/
  DESIGN.md, DECISIONS.md, CHECKPOINTS.md, BALANCE.md
```

- **The engine is deterministic.** All randomness goes through a seeded RNG passed in explicitly. Same seed + same player actions = same run.
- **The UI never computes game outcomes.** It sends actions (play card, end turn, choose reward) to the engine and renders the resulting state.
- **Game content is data, not code.** Adding a card, enemy or event should mean adding a data entry. Special behaviors go through a small, typed effect/keyword system.
- Keep files focused. If a file passes ~300 lines, split it.

## Mobile and touch (hard requirements)

- Design for a **portrait phone screen (~390px wide) first**, then scale up to desktop.
- **Tap to select, tap to play.** Dragging cards can be added later, but it's never required.
- Tap targets at least 44×44px. Nothing important depends on hover. Long-press or a tap-to-inspect panel shows full card text.
- The hand must stay usable with 10 cards on a phone screen (fan, overlap or scroll; log the choice).
- Test layouts at 360px, 390px and 430px widths before every checkpoint.

## Card art (data-driven from day one)

- Every card has an optional `art` field pointing to an image in `src/assets/cards/`.
- If `art` is missing or the file fails to load, render a **generated placeholder**: a frame colored by ATT&CK tactic, an icon, and the card name.
- Adding real art later must require only adding image files and filling in `art` fields, with no component changes.
- Icons from game-icons.net (CC BY 3.0) and sprites/UI from Kenney.nl (CC0) are fine. Credit everything in `src/assets/ATTRIBUTION.md` and on an in-game credits screen. Never use assets with unclear licenses.

## Content safety

- Cards reference real ATT&CK technique **names and concepts** for flavor and education, but card text describes **game effects only**.
- Never include real commands, exploit code, payloads or step-by-step attack instructions anywhere in the game or repo.
- Credit MITRE ATT&CK in the README and the credits screen, following MITRE's terms of use.

## Theme and terminology

The whole game speaks hacker. Every player-facing name below replaces the generic roguelite term, in UI text, card text, docs and code identifiers where practical.

- **All player-facing terms live in one file, `src/data/terms.ts`.** Components never hard-code these words, so a future rename is a one-line data change.
- **Flavor never costs clarity.** Every themed term is explained in the card inspect panel and a glossary screen reachable from the pause menu.
- **Slang, not instructions.** Flavor text can be playful and jargon-heavy, but the Content safety rules still apply.

| Generic roguelite term | Kill Chain term | Notes |
| --- | --- | --- |
| Player | **Operator** | Player picks a handle at the start of a run |
| Deck | **Arsenal** | |
| Gold | **Crypto** | Shown with a ₿-style icon |
| Shop | **Dark Web** | Buy cards and Tools, or **Wipe** (remove) a card |
| Rest site | **Safehouse** | **Lay Low** (recover OpSec) or **Weaponize** (upgrade a card) |
| Upgraded card | **v2** | e.g. "Spearphish v2" |
| Elite fight | **Hardened Target** | |
| Event | **Intel** | Leaked docs, insider tips, sketchy forum posts |
| Post-fight rewards | **Loot** | Pick 1 of 3 cards, plus Crypto |
| Relic | **Tool** | e.g. Proxy Chain, Burner Phone, USB Drop |
| Card rarity | **Public / Private / 0-day** | Common / Uncommon / Rare |
| Meta unlock milestones | **Bounties** | e.g. "Win with Alert never above Noisy" |
| Run won | **Exfiltrated** | Victory screen |
| Run lost | **Burned** | Game-over screen |

**Alert levels** (thresholds on the Alert meter): **Quiet → Noisy → Detected → Lockdown**.

**Look and feel:** terminal-inspired UI with monospace headers, a short boot-sequence title screen, and green-on-black as one color theme option. Keep body text in a readable sans-serif; nobody wants to read card text in a tiny monospace font on a phone.

## Game design (starting point, owned by AggroSec, refine in docs/DESIGN.md)

**Run structure**
- Three acts, each a branching node map: fights, **Hardened Targets**, **Intel**, a **Safehouse**, the **Dark Web**, and a boss. (See Theme and terminology.)
  - Act 1, **Perimeter:** a corporate network's edge.
  - Act 2, **Internal:** Active Directory and lateral movement.
  - Act 3, **Final Target:** chosen at random at the start of each run from a pool of target environments, each with its own enemies, events and final boss. Starting pool:
    - **OT Facility:** climb the Purdue model layers. Boss: Safety Instrumented System.
    - **Cloud Tenant:** pivot through identities and misconfigurations. Boss: Identity Provider.
    - **Financial Core:** reach the transaction systems. Boss: Fraud Detection Engine.
    - **Air-Gapped Research Lab:** get in without network access. Boss: The Air Gap.
  - The player sees which final target they drew at the start of the run, so deckbuilding can plan for it.
  - Adding a new target must be a data-only change (new enemies, events and boss entries), so the pool can keep growing.

**Combat**
- The player has **OpSec** (HP; at 0 you're burned and the run ends) and **Cycles** (energy per turn, default 3).
- Enemies have **Integrity** (HP) and show their next action (intent) each turn.
- **Alert** is a per-fight meter. Noisy cards raise it, and thresholds make enemies stronger. Quiet play is a strategy.
- **Kill-chain combos:** each card is tagged with an ATT&CK tactic. Playing tactics in kill-chain order within a turn (e.g. Initial Access → Execution → Privilege Escalation) builds **Chain** stacks that boost later cards. Playing out of order breaks the chain.

**Classes** (each with a starter deck, a card pool and a unique mechanic)
- **Social Engineer:** manipulates enemy intents and lowers Alert.
- **Exploit Dev:** high-damage cards that need setup.
- **Insider** (unlockable): starts with access other classes must earn, but is fragile.

**Enemies** (starting roster)
- EDR (removes your debuffs on enemies), SOC Analyst (raises Alert), Honeypot (punishes attacks on it), Firewall (heavy block), Patch Cycle (elite; destroys your persistence effects).
- Bosses: Incident Response Team (Act 1), Domain Controller (Act 2), and the drawn final target's boss (Act 3).

**Tools** (relics): passive run-long bonuses from Hardened Targets, bosses and the Dark Web.

**Meta progression (light):** unlock the Insider and new cards by completing **Bounties**. Unlocks add variety, not power.

## Testing and self-verification

- Unit tests for every engine rule: draw/discard/shuffle, Cycles, damage and block, Alert thresholds, Chain stacks, keywords, rewards.
- **Headless simulator** (`npm run sim`) plays N full runs (default 2,000) per class with several bot strategies (random, greedy, chain-focused). It reports:
  - win rate per class, act reached, card pick-to-win rate, tool win rate
  - outliers (cards above 65% or below 35% pick-to-win, infinite combos, fights over a turn cap)
- Balance with the simulator **before** asking AggroSec to playtest. Save reports to `docs/BALANCE.md`.
- Combat must always terminate; enforce a turn cap.

## Scripts

- `npm run dev`: local dev server
- `npm run test`: Vitest
- `npm run sim`: headless balance simulator
- `npm run check`: typecheck + lint + tests (must pass before every commit)
- `npm run build`: production build

## Milestones (stop for a checkpoint after each)

1. **Scaffold + combat core:** project setup, CI, deploy workflow, PR template, `docs/`. Then the deck/draw/discard cycle, Cycles, damage/block, one enemy with intents, deterministic RNG, tests.
2. **Content system:** card effects as data, keywords, Alert and Chain mechanics, starter decks for Social Engineer and Exploit Dev, Act 1 enemies.
3. **Run loop:** Act 1 map, Loot, Safehouse, Dark Web, Intel, Act 1 boss, `src/data/terms.ts`, and the simulator with bots.
4. **Playable phone UI:** touch-first combat screen, hand layout, card inspect, map, rewards, placeholder card art system. Deployed to Pages for phone testing.
5. **Acts 2–3:** Act 2 enemies and boss, the final target system with at least 2 targets (OT Facility and Cloud Tenant), the Insider class, tools, meta unlocks, simulator-driven balance pass. The simulator reports win rate per final target.
6. **Polish and 1.0:** animations, sound toggle, boot-sequence title screen, glossary screen, credits screen, README with screenshots/GIF and a "How this was built" section.

## README requirements

The README must include a **"How this was built"** section that states plainly: AggroSec designed and directed the project, and Claude Code wrote the code. Link to `CLAUDE.md` and the `docs/` folder as evidence of the process.
