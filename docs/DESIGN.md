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

Each card shows its **kill chain step** as a number and name, e.g. "3 · Initial Access" (AggroSec, #6). Players new to ATT&CK can build Chains just by playing increasing numbers. Every card also has a hand-written **v2** (upgrade) that changes only what's listed in its data.

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
- **Each Chain stack adds +2 damage to every damage hit and +2 to every block effect**, including the card that just extended the Chain. Some cards add more damage per stack. Implants fire at the start of the turn, when Chain is 0, so they get no bonus. (Block bonus: AggroSec, after M3, so a chain can end on a defensive card.)
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
| **Social Engineer** (70 OpSec) | Manipulates intents (Throttle, Stall) and keeps Alert low. Some cards get bonuses while Quiet. | 4 Phishing, 4 Masquerade, Pretexting, Impersonation |
| **Exploit Dev** (75 OpSec) | Stacks Vuln with recon, then cashes it in with Exploit cards. Loud. EDR cleanses the setup. | 4 Brute Force, 4 Obfuscate, Active Scanning, Exploit Public App |
| Insider | Unlockable, Milestone 5. | |

Each class has a **20-card Loot pool** (Public, Private and 0-day). Cards are listed in `src/data/cards/`. How the pool grows later (a neutral pool or unlockable cards) is open in #3.

## Act 1 enemies

| Enemy | Tier | Gimmick |
| --- | --- | --- |
| **Firewall** | normal | Heavy block |
| **EDR** | normal | Cleanses every debuff on every enemy; gains Hardened |
| **SOC Analyst** | normal | Raises Alert |
| **Honeypot** | normal | Whenever a card damages it, Alert +2 |
| **Patch Cycle** | elite (Hardened Target) | Destroys your oldest Implant; gains Hardened |
| **Incident Response Team** | boss (3 enemies) | Forensics Analyst destroys Implants and cleanses; Incident Commander gives the others Hardened and raises Alert; Threat Hunter's multi-hit takes the Alert bonus on every hit |

Encounter groups (easy, normal, elite, boss) are in `src/data/encounters.ts`. Boss enemies are in `src/data/bosses.ts`.

## Run loop (Milestone 3, decided by AggroSec)

Content and numbers were approved in #6. Balance changes since then are in [`BALANCE.md`](BALANCE.md). Exact numbers live in `src/data/runConfig.ts`.

- **Map:** 12 floors × 4 lanes, then the boss. Each run's seed generates a new map: a new layout, new room placement and new encounters. The floor before the boss is all Safehouses. Your first 3 map fights come from the easy pool. Fights started by Intel events set their own difficulty and don't count toward those 3.
- **OpSec carries over between fights with no automatic healing.** You recover at the Safehouse, through some events, and with some Tools.
- **Map odds (floors 1–11):** Fight 50%, Intel 20%, Safehouse 10%, Hardened Target 10%, Dark Web 10%. There are no Safehouses on floor 11, and no Safehouse → Safehouse or Dark Web → Dark Web back to back.
- **Loot:** pick 1 of 3 class cards (or skip), plus Crypto. Hardened Targets also drop a Tool. Bosses offer 2 cards, both 0-day.
- **v2 upgrades are written by hand for each card.**
- **Safehouse:** choose one option per visit.
  - **Lay Low:** recover 35% of max OpSec.
  - **Weaponize:** upgrade 1 card to v2.
  - **Go Dark:** Wipe 1 card for free.
  Balance is tracked in #4.
- **Dark Web:** sells class cards, Tools and Wipes. You can Wipe as many times as you can afford, and each Wipe this run raises the price.
- **Minimum Arsenal:** 5 cards. Wipe and Go Dark can't go below it.
- **Intel nodes are always an event** (8 in Act 1). Some events add **Heat**, which raises your starting Alert for the next fight only.
- **Tools** (8 so far) are passive run bonuses. They can change fights (less Noisy, extra turn-1 draw or Cycles, start-of-fight damage), pay out after wins, or improve Lay Low.
- **Act 1 boss:** the Incident Response Team, fought as a team of 3 enemies.
- **A fight that hits the turn cap burns the run**, the same as losing it.
- **Difficulty target:** the greedy bot wins Act 1 35–50% of the time (#5).
- **Balance changes after the run simulator** (AggroSec, see BALANCE.md):
  - The IR Team is at 85% of the #6 Integrity, with every attack −1.
  - The Patch Cycle has 72 Integrity.
  - Exploit Dev cards apply +1 Vuln, have −1 Noisy and deal +1 Exploit damage per stack.
  - With Chain boosting block, the IR Team got +10% Integrity back: Forensics Analyst 41, Incident Commander 85, Threat Hunter 47.
