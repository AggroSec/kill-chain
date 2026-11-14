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
