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


## Milestone 3: Full Act 1 runs

Each run is a full Act 1: a seeded 12-floor map, then fights, Loot, Safehouses, the Dark Web, Intel and the Incident Response Team boss. Beating the boss counts as a win. The target, set by AggroSec in #5, is a **greedy-bot win rate of 35–50%**.

### Tuning log

AggroSec decided every change below.

| Step | Change | Social Engineer (greedy) | Exploit Dev (greedy) |
| --- | --- | --- | --- |
| 1 | Numbers approved in #6 | 0% | 0% |
| 2 | Fix B: boss −25% Integrity and −2 per hit, OpSec 75, Patch Cycle 64 | 36% | 4% |
| 3 | **Bot fix:** pick Loot by measured card value instead of rarity (no game change) | 79% | 30% |
| 4 | Setting M: boss ×0.85 of #6 (37/77/43) and −1 per hit, OpSec 70, Patch Cycle 72 | 42% | 2% |
| 5 | Exploit Dev package: +1 Vuln, −1 Noisy, +1 Exploit per stack, OpSec 75 | 42% | 35% |

Step 3 is a lesson worth keeping. The first run bot took the rarest card every time and never skipped. That stuffed Exploit Dev decks with loud 0-days that made runs *worse*, and it badly understated both classes. Fix B was chosen against that weak bot, so it was re-proposed once the bot was fixed.

### Findings

- **The boss is the main wall.** About 48% of Social Engineer runs end at the IR Team, which is expected for a final fight. Every other encounter ends 3% of runs or fewer.
- **Exploit Dev was starved of Vuln.** Its starter deck has one Vuln source, so Exploit cards often had nothing to consume. +1 Vuln on every Vuln source was the strongest single fix (2% → 16%).
- **Hit-all-enemies cards and the Honeypot.** Every all-enemy hit triggers the Honeypot (+2 Alert). Measured on starter decks, Email Collection (−11.7 OpSec per fight), Drive-by Compromise (−7.5) and the Web Shell Implant (−5.2) are net negatives. This works as designed (the Honeypot punishes attacks on it), but these cards are weak picks. Worth a look in playtests.
- **Card pick-to-win outliers** (CLAUDE.md flags cards under 35% or over 65%): six cards land at 29–34%. That's close to the overall 35–40% win rate, so none are dramatic. None are over 65%.
- **Turn caps:** 1–2 per 2,000 Social Engineer runs. No stuck runs and no suspected infinite combos.

### Card values (OpSec saved per fight by adding one copy to the starter deck)

The sensible bots use these values to pick cards. Measured before the Exploit Dev package (step 5). Rerun `measureCardValues` to refresh them.

- **Social Engineer, best:** Supply Chain Compromise +4.3, Long Con +4.2, Watering Hole +4.1, Trusted Relationship +4.0.
- **Social Engineer, worst:** Email Collection −11.7, Drive-by Compromise −7.5, Search Open Websites −2.4, Account Manipulation −2.0.
- **Exploit Dev (before step 5):** only Stage Payload (+2.3), Process Injection, Impair Defenses and Scripting were positive. Data Destruction (−5.6) and Web Shell (−5.2) were the worst.

### Full report

`npm run sim` (2,000 runs per class per bot):

Runs per class per bot: 2000. Act 1 only; beating the boss wins the run.

#### Win rate

| Bot | Class | Win | Avg floor reached | Turn caps | Stuck | Suspected infinites |
| --- | --- | --- | --- | --- | --- | --- |
| random | Social Engineer | 0% | 6.6 | 0 | 0 | 0 |
| random | Exploit Dev | 0% | 7.0 | 0 | 0 | 0 |
| greedy | Social Engineer | 40% | 12.5 | 1 | 0 | 0 |
| greedy | Exploit Dev | 35% | 11.8 | 0 | 0 | 0 |
| chain | Social Engineer | 39% | 12.6 | 2 | 0 | 0 |
| chain | Exploit Dev | 35% | 11.7 | 0 | 0 | 0 |

#### Social Engineer, greedy bot: what ends runs

- Forensics Analyst + Incident Commander + Threat Hunter: 986 (49%)
- Patch Cycle: 73 (4%)
- Firewall + Honeypot: 44 (2%)
- SOC Analyst + SOC Analyst: 43 (2%)
- EDR + Honeypot: 28 (1%)
- Honeypot + SOC Analyst: 17 (1%)
- SOC Analyst: 2 (0%)
- Firewall: 2 (0%)
- EDR: 1 (0%)

#### Social Engineer, greedy bot: card pick-to-win

| Card | Runs with it | Win rate |
| --- | --- | --- |
| Trusted Relationship | 1641 | 42% |
| Watering Hole | 1511 | 40% |
| Long Con | 1346 | 40% |
| Steal Web Session Cookie | 1147 | 50% |
| MFA Fatigue | 960 | 31% |
| Spearphishing | 944 | 45% |
| Insider Contact | 828 | 46% |
| Supply Chain Compromise | 579 | 53% |
| Phishing for Info | 577 | 40% |
| Valid Accounts | 509 | 41% |
| Exfiltration Over Web Service | 481 | 49% |
| Internal Spearphishing | 392 | 48% |
| Help Desk Pretext | 199 | 29% |
| Living off the Land | 108 | 31% |

#### Social Engineer, greedy bot: Tools and Safehouse

| Tool / choice | Runs | Win rate |
| --- | --- | --- |
| Ghost Persona | 475 | 46% |
| VPN Subscription | 473 | 40% |
| Dead Drop | 453 | 43% |
| Proxy Chain | 453 | 40% |
| Go Bag | 448 | 47% |
| Cold Wallet | 445 | 36% |
| USB Drop | 429 | 47% |
| Burner Phone | 418 | 44% |
| Safehouse: LAY_LOW | 1350 | 45% |
| Safehouse: WEAPONIZE | 1127 | 45% |

#### Exploit Dev, greedy bot: what ends runs

- Forensics Analyst + Incident Commander + Threat Hunter: 747 (37%)
- Firewall + Honeypot: 143 (7%)
- Patch Cycle: 110 (6%)
- EDR + Honeypot: 108 (5%)
- SOC Analyst + SOC Analyst: 105 (5%)
- Honeypot + SOC Analyst: 68 (3%)
- Firewall: 16 (1%)
- EDR: 5 (0%)
- SOC Analyst: 3 (0%)

#### Exploit Dev, greedy bot: card pick-to-win

| Card | Runs with it | Win rate |
| --- | --- | --- |
| Stage Payload | 1555 | 39% |
| Vulnerability Scanning | 1355 | 41% |
| Fuzzing | 1274 | 36% |
| Kernel Exploit | 1250 | 36% |
| Exploitation for Credential Access | 1087 | 36% |
| Exploitation for Privilege Escalation | 779 | 31% |
| Escape to Host | 778 | 34% |
| Scripting | 769 | 30% |
| Impair Defenses | 649 | 35% |

#### Exploit Dev, greedy bot: Tools and Safehouse

| Tool / choice | Runs | Win rate |
| --- | --- | --- |
| VPN Subscription | 467 | 42% |
| Ghost Persona | 439 | 42% |
| Dead Drop | 427 | 41% |
| Go Bag | 419 | 43% |
| USB Drop | 413 | 45% |
| Proxy Chain | 407 | 35% |
| Cold Wallet | 400 | 34% |
| Burner Phone | 382 | 37% |
| Safehouse: LAY_LOW | 1351 | 46% |
| Safehouse: WEAPONIZE | 839 | 48% |

#### Warnings

- greedy/social-engineer: mfa-fatigue pick-to-win 31% (below 35%)
- greedy/social-engineer: help-desk-pretext pick-to-win 29% (below 35%)
- greedy/social-engineer: living-off-the-land pick-to-win 31% (below 35%)
- greedy/exploit-dev: exploitation-for-privilege-escalation pick-to-win 31% (below 35%)
- greedy/exploit-dev: escape-to-host pick-to-win 34% (below 35%)
- greedy/exploit-dev: scripting pick-to-win 30% (below 35%)

## Chain block bonus and boss retune (after Milestone 3)

AggroSec chose Chain +2 block plus a retune. 2,000 runs per class per bot; win % for SE / ED with the greedy and chain bots.

### Chain variants (no retune)

| Chain rule | SE greedy / chain | ED greedy / chain |
| --- | --- | --- |
| Damage only (M3) | 40% / 39% | 35% / 35% |
| Block +1 per stack | 45% / 49% | 41% / 39% |
| Block +2 per stack | 58% / 56% | 56% / 57% |
| Block +2, statuses +1 per 2 Chain | 58% / 56% | 56% / 57% |

### Retunes with block +2

| Retune | SE greedy / chain | ED greedy / chain |
| --- | --- | --- |
| None | 58% / 56% | 56% / 57% |
| **Boss Integrity +10% (chosen)** | **45% / 45%** | **45% / 46%** |
| Boss Integrity +15% | 38% / 39% | 40% / 41% |
| Boss Integrity +20% | 35% / 35% | 36% / 37% |
| Boss attacks +10% | 47% / 46% | 47% / 48% |
| Boss attacks +20% | 32% / 31% | 34% / 36% |
| All enemies Integrity +10% | 43% / 42% | 36% / 35% |
| All enemies attacks +10% | 47% / 46% | 34% / 34% |
| Lay Low 35% → 30% | 55% / 54% | 52% / 52% |

### Full report (chosen settings)

Runs per class per bot: 2000. Act 1 only; beating the boss wins the run.

### Win rate

| Bot | Class | Win | Avg floor reached | Turn caps | Stuck | Suspected infinites |
| --- | --- | --- | --- | --- | --- | --- |
| random | Social Engineer | 0% | 7.4 | 0 | 0 | 0 |
| random | Exploit Dev | 0% | 7.1 | 0 | 0 | 0 |
| greedy | Social Engineer | 45% | 12.9 | 1 | 0 | 0 |
| greedy | Exploit Dev | 45% | 12.4 | 0 | 0 | 0 |
| chain | Social Engineer | 45% | 12.9 | 3 | 0 | 0 |
| chain | Exploit Dev | 46% | 12.3 | 0 | 0 | 0 |

### Social Engineer, greedy bot: what ends runs

- Forensics Analyst + Incident Commander + Threat Hunter: 1071 (54%)
- SOC Analyst + SOC Analyst: 10 (1%)
- Firewall + Honeypot: 10 (1%)
- EDR + Honeypot: 8 (0%)
- Patch Cycle: 6 (0%)
- Honeypot + SOC Analyst: 4 (0%)

### Social Engineer, greedy bot: card pick-to-win

| Card | Runs with it | Win rate |
| --- | --- | --- |
| Watering Hole | 1750 | 44% |
| Trusted Relationship | 1653 | 44% |
| Spearphishing | 1300 | 50% |
| Long Con | 1151 | 44% |
| Phishing for Info | 1062 | 48% |
| Insider Contact | 1003 | 51% |
| Steal Web Session Cookie | 812 | 56% |
| MFA Fatigue | 769 | 33% |
| Supply Chain Compromise | 701 | 56% |
| Vishing | 536 | 40% |
| Valid Accounts | 445 | 52% |
| Help Desk Pretext | 271 | 33% |
| Internal Spearphishing | 139 | 56% |
| Exfiltration Over Web Service | 99 | 48% |
| Living off the Land | 49 | 43% |

### Social Engineer, greedy bot: Tools and Safehouse

| Tool / choice | Runs | Win rate |
| --- | --- | --- |
| VPN Subscription | 534 | 48% |
| Ghost Persona | 534 | 55% |
| Go Bag | 498 | 47% |
| USB Drop | 498 | 52% |
| Dead Drop | 496 | 49% |
| Cold Wallet | 486 | 43% |
| Proxy Chain | 481 | 42% |
| Burner Phone | 477 | 49% |
| Safehouse: WEAPONIZE | 1423 | 45% |
| Safehouse: LAY_LOW | 1023 | 47% |

### Exploit Dev, greedy bot: what ends runs

- Forensics Analyst + Incident Commander + Threat Hunter: 807 (40%)
- Firewall + Honeypot: 76 (4%)
- Patch Cycle: 70 (4%)
- SOC Analyst + SOC Analyst: 57 (3%)
- EDR + Honeypot: 44 (2%)
- Honeypot + SOC Analyst: 30 (2%)
- Firewall: 3 (0%)
- EDR: 3 (0%)
- SOC Analyst: 2 (0%)

### Exploit Dev, greedy bot: card pick-to-win

| Card | Runs with it | Win rate |
| --- | --- | --- |
| Stage Payload | 1620 | 49% |
| Fuzzing | 1515 | 47% |
| Vulnerability Scanning | 1273 | 52% |
| Scripting | 1176 | 42% |
| Kernel Exploit | 1174 | 48% |
| Process Injection | 969 | 45% |
| Exploitation for Credential Access | 808 | 49% |
| Escape to Host | 731 | 41% |
| Impair Defenses | 582 | 45% |

### Exploit Dev, greedy bot: Tools and Safehouse

| Tool / choice | Runs | Win rate |
| --- | --- | --- |
| VPN Subscription | 474 | 56% |
| Dead Drop | 455 | 48% |
| Ghost Persona | 454 | 52% |
| Go Bag | 445 | 50% |
| Proxy Chain | 443 | 43% |
| USB Drop | 437 | 54% |
| Cold Wallet | 425 | 46% |
| Burner Phone | 420 | 46% |
| Safehouse: WEAPONIZE | 1013 | 52% |
| Safehouse: LAY_LOW | 1433 | 52% |

### Warnings

- greedy/social-engineer: mfa-fatigue pick-to-win 33% (below 35%)
- greedy/social-engineer: help-desk-pretext pick-to-win 33% (below 35%)



## Milestone 4 (UI only)

No rule or content numbers changed. The engine only gained display helpers (`chainIfPlayed`, `cardAtChain`). The win rates match the Chain block bonus report above:

| Bot | Class | Win | Avg floor reached | Turn caps | Stuck | Suspected infinites |
| --- | --- | --- | --- | --- | --- | --- |
| random | Social Engineer | 0% | 7.4 | 0 | 0 | 0 |
| random | Exploit Dev | 0% | 7.1 | 0 | 0 | 0 |
| greedy | Social Engineer | 45% | 12.9 | 1 | 0 | 0 |
| greedy | Exploit Dev | 45% | 12.4 | 0 | 0 | 0 |
| chain | Social Engineer | 45% | 12.9 | 3 | 0 | 0 |
| chain | Exploit Dev | 46% | 12.3 | 0 | 0 | 0 |
