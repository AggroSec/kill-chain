# Kill Chain

A browser-playable deckbuilder roguelite with a cybersecurity theme. You're a red-team **Operator** working through a target environment. Cards are attack techniques tagged with MITRE ATT&CK® tactics, enemies are blue-team defenses, and playing cards in kill-chain order builds combos.

Built touch-first for phones, playable on desktop too.

> **Status:** early development (Milestone 2: content system). See [`docs/CHECKPOINTS.md`](docs/CHECKPOINTS.md).

## Play

Once deployed, the game lives at **https://aggrosec.github.io/kill-chain/**.

## Develop

Requires Node.js (current LTS).

```bash
npm install
npm run dev     # dev server at http://localhost:5173/kill-chain/
npm run test    # unit tests (Vitest)
npm run sim     # headless balance simulator (add -- --fights 1000 for more)
npm run check   # typecheck + lint + tests (must pass before every commit)
npm run build   # production build into dist/
```

To play on a phone on the same Wi-Fi, run `npm run dev -- --host` and open the "Network" URL it prints.

Any fight can be replayed exactly with a link like `/kill-chain/?class=exploit-dev&encounter=a1-edr&seed=123`. The seed is shown at the bottom of the fight screen.

## Project layout

```
src/
  engine/   Pure, deterministic game logic (no DOM, no React, seeded RNG only)
  data/     Cards, classes, enemies, statuses, encounters and player-facing terms as typed data
  sim/      Headless simulator and bots (npm run sim)
  ui/       React components: render engine state, dispatch actions
  assets/   Card art and icons, credited in assets/ATTRIBUTION.md
docs/       Design doc, decision log, checkpoints, balance reports
```

## How this was built

**AggroSec designed and directed this project. [Claude Code](https://claude.com/claude-code) wrote the code.**

AggroSec set the game's design, priorities and milestones, and reviewed and merged every pull request. Claude Code implemented each milestone, wrote the tests and logged its own decisions along the way. The process is in the repo:

- [`CLAUDE.md`](CLAUDE.md): the project brief and working agreement Claude Code follows
- [`docs/DESIGN.md`](docs/DESIGN.md): the evolving game design
- [`docs/DECISIONS.md`](docs/DECISIONS.md): every judgment call made during implementation
- [`docs/CHECKPOINTS.md`](docs/CHECKPOINTS.md): milestone summaries submitted for review
- [`docs/BALANCE.md`](docs/BALANCE.md): simulator balance reports

## Credits

- Built on concepts from **[MITRE ATT&CK®](https://attack.mitre.org/)**. © The MITRE Corporation. This work is reproduced and distributed with the permission of The MITRE Corporation, under its [terms of use](https://attack.mitre.org/resources/legal-and-branding/terms-of-use/). ATT&CK® is a registered trademark of The MITRE Corporation. Kill Chain is not affiliated with or endorsed by MITRE.
- Third-party assets are credited in [`src/assets/ATTRIBUTION.md`](src/assets/ATTRIBUTION.md).

Card text describes game effects only. The game contains no real commands, exploit code or attack instructions.
