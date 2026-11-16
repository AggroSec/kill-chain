# Balance Reports

The full headless simulator (`npm run sim`, all classes, full runs) arrives in Milestone 3. Until then, entries here come from one-off bot measurements.

## Milestone 1: Demo fight (Arsenal of 5 Brute Force + 5 Obfuscate, 60 OpSec, vs Firewall)

2,000 seeded fights per bot.

- **Random bot:** plays random affordable cards until out of Cycles.
- **Greedy bot:** blocks when incoming damage exceeds current block, otherwise attacks.

| Firewall stats | Bot | Win rate | Avg turns | Avg OpSec left (wins) | Turn caps |
| --- | --- | --- | --- | --- | --- |
| v0: Attack 9; Attack 6 + Block 6 | Random | 100% | 9.6 | 50.3 / 60 | 0 |
| v0 | Greedy | 100% | 9.7 | 58.4 / 60 | 0 |
| **v1: Attack 13; Attack 9 + Block 6** | Random | 100% | 9.6 | 35.7 / 60 | 0 |
| **v1** | Greedy | 100% | 10.4 | 51.6 / 60 | 0 |

**Takeaway:** v0 was trivial. v1 makes a careless player lose ~40% of their OpSec and a careful one ~14%, a reasonable first normal fight. A 100% win rate is expected and fine for a single early fight. Real tuning starts once there are runs, classes and Alert.

The 300-seed random-play fuzz test (`src/data/content.test.ts`) also confirms every fight terminates.

## Milestone 2: Starter Arsenals vs Act 1 encounters

Produced by `npm run sim -- --fights 500` (fight-level simulator; full runs arrive in Milestone 3). Each cell is one class's starter Arsenal at full OpSec (65) against one encounter.

**Bots**
- **random:** plays random legal cards at random targets until it can't, then ends the turn.
- **greedy:** tries every legal play, scores the resulting state (incoming damage after block, enemy Integrity, debuffs, Alert, Implants), and takes the best one if it helps. This is the stand-in for a sensible player.
- **chain:** greedy, plus a small bonus for Chain stacks.

**Targets** (greedy bot, starter Arsenal, full OpSec)

| Tier | Win rate | OpSec lost |
| --- | --- | --- |
| easy | ~100% | 2–12 |
| normal | ≥ 90% | 9–27 |
| elite (Hardened Target) | 60–100% | 30–45 |

A starter Arsenal at full OpSec is the easiest case. Real runs arrive at fights already damaged, which the Milestone 3 run simulator will measure.

### Tuning log

| Change | Why |
| --- | --- |
| Firewall Integrity 44 → 40, Packet Drop 13 → 12 | With Alert bonuses on top, Firewall fights ran long and hurt. |
| SOC Analyst: Triage 6 → 5, Escalate 10 → 9 | The SOC pair cost ~26 OpSec. |
| Patch Cycle Integrity 90 → 80, Forced Reboot 18 → 16 | Cost ~50 OpSec at 72–88% wins: too punishing even for an elite. |
| Encounter Firewall + SOC Analyst → Firewall + Honeypot | Still ~36 OpSec lost after the changes above (tank + Alert-raiser snowballs). The new pair keeps a "tank + trap" puzzle at ~23–27. |
| Chain bot weight 4 → 2 | It was skipping block to build Chain and played worse than greedy. |
| Living off the Land and Fuzzing gained Burner | Each could loop forever in a trimmed Arsenal (see DECISIONS.md). |

### Findings

- **Classes are close.** On every encounter the two classes are within ~4 OpSec of each other. Exploit Dev finishes fights about 2–4 turns faster, and Social Engineer ends with much lower Alert (it sits at Quiet against Firewall, EDR and Patch Cycle).
- **Alert matters where intended.** Honeypot fights push Exploit Dev to ~13–14 peak Alert (Detected), versus ~7–11 for Social Engineer.
- **Chain is modest with starter decks** (an average max of 1–2 stacks per fight). The starter decks hold only 3–4 distinct tactics, and pool cards in Loot will lift this. Worth watching in Milestone 3.
- **Patch Cycle is close to 100% wins for greedy, but costs 40–44 OpSec.** That's the right "elite tax" shape. Revisit with run-level data.
- **No turn caps, stuck fights or suspected infinite combos** in any cell.

### Full report


> kill-chain@0.1.0 sim
> node scripts/sim.mjs --fights 500

Fights per cell: 500. Starter Arsenal at full OpSec, Act 1 encounters.

#### Bot: random

| Class | Encounter | Tier | Win | Avg turns | Avg OpSec lost | Avg peak Alert | Avg max Chain | Turn caps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Social Engineer | a1-firewall | easy | 100% | 11.2 | 17.8 | 0.0 | 1.2 | 0 |
| Social Engineer | a1-soc | easy | 100% | 5.4 | 3.0 | 4.2 | 1.1 | 0 |
| Social Engineer | a1-edr | easy | 100% | 7.0 | 10.1 | 0.0 | 1.1 | 0 |
| Social Engineer | a1-honeypot-soc | normal | 94% | 10.9 | 38.1 | 18.3 | 1.2 | 0 |
| Social Engineer | a1-firewall-honeypot | normal | 54% | 15.4 | 57.1 | 9.7 | 1.3 | 0 |
| Social Engineer | a1-edr-honeypot | normal | 85% | 12.4 | 47.3 | 10.1 | 1.3 | 0 |
| Social Engineer | a1-soc-pair | normal | 79% | 10.5 | 48.4 | 15.8 | 1.2 | 0 |
| Social Engineer | a1-patch-cycle | elite | 34% | 12.0 | 61.7 | 0.0 | 1.3 | 0 |
| Exploit Dev | a1-firewall | easy | 100% | 7.0 | 21.0 | 2.7 | 1.2 | 0 |
| Exploit Dev | a1-soc | easy | 100% | 4.0 | 5.7 | 5.7 | 1.1 | 0 |
| Exploit Dev | a1-edr | easy | 100% | 5.3 | 12.3 | 2.1 | 1.1 | 0 |
| Exploit Dev | a1-honeypot-soc | normal | 96% | 7.9 | 40.4 | 19.5 | 1.2 | 0 |
| Exploit Dev | a1-firewall-honeypot | normal | 32% | 9.2 | 61.4 | 15.8 | 1.2 | 0 |
| Exploit Dev | a1-edr-honeypot | normal | 69% | 9.0 | 52.9 | 16.3 | 1.2 | 0 |
| Exploit Dev | a1-soc-pair | normal | 78% | 7.6 | 50.5 | 17.7 | 1.2 | 0 |
| Exploit Dev | a1-patch-cycle | elite | 58% | 8.9 | 57.6 | 3.5 | 1.2 | 0 |

#### Bot: greedy

| Class | Encounter | Tier | Win | Avg turns | Avg OpSec lost | Avg peak Alert | Avg max Chain | Turn caps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Social Engineer | a1-firewall | easy | 100% | 10.4 | 8.9 | 0.0 | 1.6 | 0 |
| Social Engineer | a1-soc | easy | 100% | 3.9 | 2.1 | 3.0 | 1.0 | 0 |
| Social Engineer | a1-edr | easy | 100% | 5.4 | 4.9 | 0.0 | 1.1 | 0 |
| Social Engineer | a1-honeypot-soc | normal | 100% | 9.4 | 9.1 | 10.9 | 1.4 | 0 |
| Social Engineer | a1-firewall-honeypot | normal | 100% | 13.8 | 23.2 | 7.1 | 1.7 | 0 |
| Social Engineer | a1-edr-honeypot | normal | 100% | 10.3 | 15.8 | 8.3 | 1.4 | 0 |
| Social Engineer | a1-soc-pair | normal | 100% | 8.6 | 17.9 | 9.4 | 1.8 | 0 |
| Social Engineer | a1-patch-cycle | elite | 100% | 8.6 | 40.1 | 0.0 | 1.3 | 0 |
| Exploit Dev | a1-firewall | easy | 100% | 6.1 | 9.8 | 1.9 | 0.9 | 0 |
| Exploit Dev | a1-soc | easy | 100% | 3.4 | 2.8 | 3.9 | 1.0 | 0 |
| Exploit Dev | a1-edr | easy | 100% | 4.7 | 5.4 | 0.9 | 0.9 | 0 |
| Exploit Dev | a1-honeypot-soc | normal | 100% | 6.4 | 10.4 | 13.9 | 1.0 | 0 |
| Exploit Dev | a1-firewall-honeypot | normal | 100% | 8.6 | 26.4 | 13.0 | 1.0 | 0 |
| Exploit Dev | a1-edr-honeypot | normal | 100% | 7.5 | 16.4 | 11.6 | 1.0 | 0 |
| Exploit Dev | a1-soc-pair | normal | 100% | 6.9 | 18.7 | 12.9 | 1.0 | 0 |
| Exploit Dev | a1-patch-cycle | elite | 98% | 7.6 | 44.4 | 2.2 | 0.6 | 0 |

#### Bot: chain

| Class | Encounter | Tier | Win | Avg turns | Avg OpSec lost | Avg peak Alert | Avg max Chain | Turn caps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Social Engineer | a1-firewall | easy | 100% | 10.2 | 6.3 | 0.0 | 1.6 | 0 |
| Social Engineer | a1-soc | easy | 100% | 4.1 | 1.2 | 3.0 | 1.2 | 0 |
| Social Engineer | a1-edr | easy | 100% | 5.6 | 5.0 | 0.0 | 1.2 | 0 |
| Social Engineer | a1-honeypot-soc | normal | 100% | 9.8 | 8.3 | 9.8 | 1.5 | 0 |
| Social Engineer | a1-firewall-honeypot | normal | 100% | 14.1 | 23.1 | 6.6 | 1.8 | 0 |
| Social Engineer | a1-edr-honeypot | normal | 100% | 10.8 | 15.3 | 7.5 | 1.5 | 0 |
| Social Engineer | a1-soc-pair | normal | 100% | 8.9 | 17.5 | 9.5 | 1.9 | 0 |
| Social Engineer | a1-patch-cycle | elite | 99% | 9.7 | 40.0 | 0.0 | 1.7 | 0 |
| Exploit Dev | a1-firewall | easy | 100% | 5.8 | 9.5 | 1.8 | 1.0 | 0 |
| Exploit Dev | a1-soc | easy | 100% | 3.3 | 2.7 | 3.7 | 1.0 | 0 |
| Exploit Dev | a1-edr | easy | 100% | 4.6 | 5.3 | 0.9 | 0.9 | 0 |
| Exploit Dev | a1-honeypot-soc | normal | 100% | 6.5 | 10.8 | 13.8 | 1.0 | 0 |
| Exploit Dev | a1-firewall-honeypot | normal | 100% | 8.5 | 27.0 | 12.8 | 1.0 | 0 |
| Exploit Dev | a1-edr-honeypot | normal | 100% | 7.5 | 17.0 | 11.4 | 1.0 | 0 |
| Exploit Dev | a1-soc-pair | normal | 100% | 6.8 | 18.6 | 12.7 | 1.0 | 0 |
| Exploit Dev | a1-patch-cycle | elite | 98% | 7.6 | 44.4 | 2.2 | 0.6 | 0 |

#### Warnings

- None

