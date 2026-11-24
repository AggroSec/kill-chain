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
| **Exposed** | enemy, or you (Act 2+) | Takes 50% more damage from attacks | turns (ticks down after the owner acts) |
| **Throttled** | enemy, or you (Act 2+) | Deals 25% less attack damage | turns |
| **Stalled** | enemy | Skips its next action (1 stack per action) | until used |
| **Hardened** | enemy | +1 damage per attack hit per stack | rest of fight |
| Implants | Operator | Data-defined effects at the start of each turn | until removed |

Damage math, rounding down at each multiplier:
- **Operator hit:** (base + Chain bonus) × target's Exposed × your Throttled, then block.
- **Enemy hit:** (base + Hardened + Alert bonus + Insider's +1) × enemy's Throttled × your Exposed, then block.

Enemies can apply Throttled and Exposed to you from Act 2 on. They tick down at the end of your turn, so one stack applied during the enemy turn lasts through your next turn.

## Classes

| Class | Identity | Passive (AggroSec, #22) | Starter Arsenal (10) |
| --- | --- | --- | --- |
| **Social Engineer** (70 OpSec) | Manipulates intents (Throttle, Stall) and keeps Alert low. Some cards get bonuses while Quiet. | **Smooth Talker:** at the start of each fight, a random enemy is Stalled for its first turn. | 4 Phishing, 4 Masquerade, Pretexting, Impersonation |
| **Exploit Dev** (75 OpSec) | Stacks Vuln with recon, then cashes it in with Exploit cards. EDR cleanses the setup. | **Zero-Day Broker:** every 3rd fight won, and after every Hardened Target, a bonus pick of 3 Private/0-day cards (skippable). | 4 Brute Force, 4 Obfuscate, Active Scanning, Exploit Public App |
| **Insider** (50 OpSec, 4 Cycles) | Already inside: cheap mid-to-late chain cards (step 4+), Collection and Exfiltration payoffs. Few Block cards. Unlocked by the Bounty "First Exfil" (win a run). | **Trusted Access:** each turn your Chain starts as if you played Initial Access (step 3). Fragile: +1 damage from every enemy hit. | 4 Data from Local System, 3 Indicator Removal, Account Discovery, Remote Desktop, Exfiltration Over Physical Medium |

Each class starts with a **20-card Loot pool** (Public, Private and 0-day) and unlocks 7 more: 2 per class level (levels 1–3) and 1 from its "Win as..." Bounty. Cards are in `src/data/cards/`; unlockable ones are in `unlockable.ts`. Passives are data on the class (`src/data/classes.ts`).

## Act 1 enemies (Perimeter)

| Enemy | Tier | Gimmick |
| --- | --- | --- |
| **Firewall** | normal | Heavy block |
| **EDR** | normal | Cleanses every debuff on every enemy; gains Hardened |
| **SOC Analyst** | normal | Raises Alert |
| **Honeypot** | normal | Whenever a card damages it, Alert +2 |
| **Patch Cycle** | elite (Hardened Target) | Destroys your oldest Implant; gains Hardened |
| **Incident Response Team** | boss (3 enemies) | Forensics Analyst destroys Implants and cleanses; Incident Commander gives the others Hardened and raises Alert; Threat Hunter's multi-hit takes the Alert bonus on every hit |

Encounter groups (easy, normal, elite, boss) are in `src/data/encounters.ts`. Boss enemies are in `src/data/bosses.ts`.

## Acts 2–3 (Milestone 5, AggroSec approved the plan in #22)

A run is **3 acts of 13 floors** (12 plus the boss). Beating an Act 1 or 2 boss gives boss Loot, then the next act starts on a new map and **recovers half of your missing OpSec**. Beating the Act 3 boss wins the run.

**Act 2, Internal (Active Directory and lateral movement)**

| Enemy | Tier | Gimmick |
| --- | --- | --- |
| **SIEM** | normal | Raises Alert most turns; multi-hit Alert Storm |
| **Honeytoken** | normal | A fake admin account: whenever a card damages it, Alert +3. Hardens allies |
| **Group Policy** | normal | Support: Hardens allies and cleanses their debuffs |
| **Privileged Access Mgmt** | normal | Throttles you; heavy block |
| **Next-Gen EDR** | normal | Cleanses every debuff; hits hard |
| **Tier 0 Admin** | elite | Cleanses, Throttles you, keeps escalating |
| **Domain Controller** | boss (with Kerberos and GPO Server) | Heals its adds while they live. Kerberos leaves you Exposed; GPO Server Hardens the team and raises Alert |

**Act 3, the Final Target.** Drawn at random when the run starts (after the Act 1 map, so Act 1 maps don't depend on the target list) and shown in the Act 1 intro. Adding a target is data only: a `TargetDef`, its enemies, and Act 3 encounters with `target` set.

| Target | Enemies | Hardened Target | Boss |
| --- | --- | --- | --- |
| **OT Facility** (quiet play matters) | HMI Operator (only routine rounds while Quiet), Historian (Alert, +1 when hit), Data Diode (never attacks, heavy block, Hardens allies), Process Controller (ramps up) | Engineering Workstation | **Safety Instrumented System** + 2 Safety Sensors. At Detected Alert or higher it trips: huge attacks and block every turn. The sensors raise Alert |
| **Cloud Tenant** (Implants and noise get punished) | Conditional Access (Throttles you at Detected+), Cloud Audit Log (Alert), Workload Protection (destroys Implants), Autoscaling Group | Posture Scanner (leaves you Exposed) | **Identity Provider** + 2 Token Services. Revokes sessions (destroys 2 Implants, Throttles you); the token services heal the team |

New enemy rules, all data: `healAllies`, `debuffPlayer`, and moves gated on Alert (`whenAlert`, checked when the intent is rolled, so the intent you see is what happens).

**Intel:** 3 new events for Acts 2–3 (events can list the acts they appear in). **Tools:** 6 new ones (Golden Ticket, Jump Box, Stolen Session Token, Packet Sniffer, Air-Gap Bridge, Offline Backup).

## Progression: class levels and Bounties (Milestone 5)

Like clans in Monster Train, the more you play a class, the more you unlock for it.

- **Class XP:** every finished run (won or lost; abandoning gives nothing) gives XP to the class played: **1 per floor cleared, 10 per boss beaten, 20 for a win**.
- **Levels** at **40 / 120 / 250** total XP. Each unlocks 2 cards for that class.
- **Bounties** are account-wide goals with the reward shown up front. Their XP goes to the class you were playing. 9 at launch:

| Bounty | Goal | Reward |
| --- | --- | --- |
| First Exfil | Win a run | +25 XP, **unlocks the Insider** |
| Smooth Operator / Weaponized / Inside Job | Win as SE / ED / Insider | +20 XP and 1 card for that class |
| Domain Dominance | Beat the Domain Controller | +15 XP |
| Safety Off / Identity Crisis | Beat each Final Target boss | +20 XP |
| Ghost | Win with Alert never above Noisy | +25 XP |
| Minimalist | Win with 12 cards or fewer | +25 XP |

- Bounties can also unlock **game modes**; the first mode comes after M5.
- Progress lives in localStorage (`kill-chain.profile.v1`). Locked cards are passed into each new run and written into its run log, so replays stay exact.
- Everything is data in `src/data/progression.ts`; the rules are pure functions in `src/engine/meta/progression.ts`.

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

## Phone UI (Milestone 4, decided by AggroSec in #17)

- **Hand:** an overlapping fan. Cards overlap more as the hand grows, so 10 cards fit on a 360px screen without scrolling. Sliding a finger across the fan also selects the card under it. That's optional; taps always work.
- **Playing a card:** tap a card to select it. It lifts, and its full text shows above the hand with Chain-boosted numbers and short explanations of its keywords and statuses. Then tap an enemy, or tap Play for cards with no target (or when only one enemy is left). Tap the card again, or Cancel, to put it back.
- **Enemies:** a row of up to 3 compact panels showing Integrity bar, Block, a short intent (⚔ attack, ⛨ block, ⚠ Alert) and status chips. Tap an enemy with no card selected to see its full details.
- **Picking cards** (Loot, Dark Web, Weaponize, Go Dark, Wipe, Intel) is select-then-confirm, like playing a card.
- **Weaponize shows each card as its v2,** with changes highlighted ("Deal 6 → 9") and a badge ("v2: −1 Cost") (#14).
- **Card frames are colored by tactic:** step 1 is blue, shading through purple to red at step 14, so a Chain reads as a color gradient. Placeholder art is one icon per tactic until real art exists.
- **Themes:** Green terminal (default), Amber terminal and Soft dark, switched in Settings.
- **Help (#9):** a glossary reachable from the main menu and the in-game Menu, plus a guided first fight. The fight is offered once on first launch, can be skipped, and can be replayed from How to Play.
