# Kill Chain: Design

The design source of truth is the "Game design" section of [`CLAUDE.md`](../CLAUDE.md), owned by AggroSec. This doc records how that design is refined as it gets built. Implementation-level judgment calls go in [`DECISIONS.md`](DECISIONS.md). Exact numbers live in the data files under `src/data/` and are not copied here, so they can't drift.

## Turn flow

1. **Operator turn starts:** block resets to 0, Cycles refill (default 3), **Chain resets to 0**, Implants fire, then draw 5.
2. Play any number of cards whose cost fits your remaining Cycles.
3. **End turn:** cards with **Stash** stay in hand. Everything else is discarded.
4. **Enemy turn:** each living enemy, left to right, clears its own block. Then it either skips its action (if **Stalled**) or performs the move shown as its intent. After acting, its duration debuffs tick down by 1.
5. Each enemy picks and shows its next intent. Back to step 1.

The fight is won when every enemy is at 0 Integrity and lost at 0 OpSec. After turn 50 it ends as `turnCap`.

## Cards

Every card has a **cost**, a **type**, an **ATT&CK tactic**, a **rarity** (Starter / Public / Private / 0-day), an **owner** class, and a list of **effects** that resolve in order. Card text is generated from the effect data.

**Types**
- **Attack / Skill:** played, then discarded.
- **Implant:** installs a lasting effect on the Operator for the rest of the fight, then is Spent. Implants are the "persistence effects" that the Patch Cycle destroys.

**Effects:** damage (single target, all enemies, or multi-hit, with optional extra scaling per Chain), block, draw, gain Cycles, raise or lower Alert, apply a status, **Exploit**, and **"If Alert is …"** conditions.

**Keywords**

| Keyword | Meaning |
| --- | --- |
| **Noisy N** | After the card resolves, raise Alert by N. |
| **Burner** | Spent after use: out for the rest of the fight. |
| **Stash** | Stays in hand at end of turn. |
| **Implant** | (card type) Installs a lasting effect; Spent after use. |
| **Exploit N** | Consume all Vuln on the target; deal N damage per stack consumed. |

## Alert

A per-fight meter from 0 to 20. It starts at 0 and only changes when a card or enemy changes it; there's no natural decay. Noisy cards, SOC Analysts and Honeypots raise it, and Social Engineer cards lower it.

| Level | Alert | Every enemy attack hit |
| --- | --- | --- |
| Quiet | 0–4 | +0 |
| Noisy | 5–9 | +1 |
| Detected | 10–14 | +3 |
| Lockdown | 15–20 | +5 |

Some cards reward a level, either staying Quiet (Social Engineer) or being loud (Ransomware). Intents always show the real damage after Alert and other modifiers.

## Chain (kill-chain combos)

Tactics follow ATT&CK order: Reconnaissance → Resource Development → Initial Access → Execution → Persistence → Privilege Escalation → Defense Evasion → Credential Access → Discovery → Lateral Movement → Collection → Command and Control → Exfiltration → Impact.

- Within a turn, a card whose tactic comes **later** than the previous card's adds **+1 Chain**. Skipping tactics is fine.
- The **same or an earlier** tactic breaks the Chain to 0, and that card starts a new sequence.
- **Each Chain stack adds +2 damage to every damage hit**, including the hit from the card that just extended the Chain. Some cards add more per stack.
- Chain resets at the start of each turn. Cards in hand that would extend the current Chain are highlighted.

## Statuses

| Status | On | Effect | Duration |
| --- | --- | --- | --- |
| **Vuln** | enemy | Consumed by Exploit for bonus damage | until consumed or cleansed |
| **Exposed** | enemy | Takes 50% more damage from attacks | turns (ticks down after the enemy acts) |
| **Throttled** | enemy | Deals 25% less attack damage | turns |
| **Stalled** | enemy | Skips its next action (1 stack per action) | until used |
| **Hardened** | enemy | +1 damage per attack hit per stack | rest of fight |
| Implants | Operator | Data-defined effects at the start of each turn | until removed |

Damage math, rounding down at each multiplier:
- **Operator hit:** (base + Chain bonus) × Exposed, then block.
- **Enemy hit:** (base + Hardened + Alert bonus) × Throttled, then block.

## Classes

| Class | Identity | Starter Arsenal (10) |
| --- | --- | --- |
| **Social Engineer** | Manipulates intents (Throttle, Stall) and keeps Alert low. Some cards get bonuses while Quiet. | 4 Phishing, 4 Masquerade, Pretexting, Impersonation |
| **Exploit Dev** | Stacks Vuln with recon, then cashes it in with Exploit cards. Loud. EDR cleanses the setup. | 4 Brute Force, 4 Obfuscate, Active Scanning, Exploit Public App |
| Insider | Unlockable, Milestone 5. | |

Each class also has a pool of 8 cards to find as Loot (Milestone 3).

## Act 1 enemies

| Enemy | Tier | Gimmick |
| --- | --- | --- |
| **Firewall** | normal | Heavy block |
| **EDR** | normal | Cleanses every debuff on every enemy; gains Hardened |
| **SOC Analyst** | normal | Raises Alert |
| **Honeypot** | normal | Whenever a card damages it, Alert +2 |
| **Patch Cycle** | elite (Hardened Target) | Destroys your oldest Implant; gains Hardened |

Encounter groups (easy, normal, elite) are in `src/data/encounters.ts`. The Act 1 boss (Incident Response Team) comes in Milestone 3.

## Run loop (Milestone 3, decided by AggroSec)

Exact numbers and content are pending in #6. These rules are settled:

- **Map:** 12 floors × 4 lanes, then the boss. Each run's seed generates a new map: a new layout, new room placement and new encounters. The floor before the boss is all Safehouses. Your first 3 map fights come from the easy pool. Fights started by Intel events set their own difficulty and don't count toward those 3.
- **OpSec carries over between fights with no automatic healing.** You recover at the Safehouse, through some events, and with some Tools.
- **Loot:** pick 1 of 3 class cards (or skip), plus Crypto. Hardened Targets also drop a Tool.
- **v2 upgrades are written by hand for each card.**
- **Safehouse:** choose one option per visit.
  - **Lay Low:** recover 35% of max OpSec.
  - **Weaponize:** upgrade 1 card to v2.
  - **Go Dark:** Wipe 1 card for free.
  Balance is tracked in #4.
- **Dark Web:** sells class cards, Tools and Wipes. You can Wipe as many times as you can afford, and each Wipe this run raises the price.
- **Minimum Arsenal:** 5 cards. Wipe and Go Dark can't go below it.
- **Intel nodes are always an event.**
- **Act 1 boss:** the Incident Response Team, fought as a team of 3 enemies.
- **A fight that hits the turn cap burns the run**, the same as losing it.
- **Difficulty target:** the greedy bot wins Act 1 35–50% of the time (#5).
