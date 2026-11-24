# Kill Chain

A browser-playable deckbuilder roguelite with a cybersecurity theme. You're a red-team **Operator** working through a target environment. Cards are attack techniques tagged with MITRE ATT&CK® tactics, enemies are blue-team defenses, and playing cards in kill-chain order builds combos.

Built touch-first for phones, playable on desktop too.

> **Status:** in development (Milestone 5: three acts, Final Targets, the Insider, class levels and Bounties). See [`docs/CHECKPOINTS.md`](docs/CHECKPOINTS.md).

## Play

The game lives at **https://aggrosec.github.io/kill-chain/**. It's a work in progress: playable on a phone, with polish (animations, sound, a title screen) coming in Milestone 6.

**Found a bug or want a run looked at?** Open Menu → Run Logs (or scroll down on the Burned/Exfiltrated screen), then tap Copy Log or Report on GitHub. A run log is your seed plus every move you made, so the run can be replayed exactly.

## Develop

Requires Node.js (current LTS).

```bash
npm install
npm run dev     # dev server at http://localhost:5173/kill-chain/
npm run test    # unit tests (Vitest)
npm run sim     # headless balance simulator (add -- --fights 1000 for more)
npm run replay -- log.txt   # replay a run log turn by turn
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

## License

Kill Chain is **free to play, study, modify and share for noncommercial purposes** under the [PolyForm Noncommercial License 1.0.0](LICENSE.md). Personal use, hobby projects, research, education, charities and public institutions are all fine.

**Commercial use is not covered.** That includes selling the game or a modified version, putting it behind a paywall, or using it in a paid product or service. If you'd like to use it commercially, reach out to [AggroSec](https://github.com/AggroSec) first, for example by opening an issue, to work out a commercial license.

The license covers this project's own code and content. MITRE ATT&CK® and third-party assets stay under their own terms (see Credits).
