# Kill Chain: Design

The design source of truth is the "Game design" section of [`CLAUDE.md`](../CLAUDE.md), owned by AggroSec. This doc records how that design is refined as it gets built. Implementation-level judgment calls go in [`DECISIONS.md`](DECISIONS.md).

## Combat rules (implemented in Milestone 1)

**Turn flow**
1. **Operator turn:** block resets to 0, Cycles refill to max (default 3), draw 5 cards.
2. Play any number of cards whose cost fits your remaining Cycles.
3. **End turn:** the whole hand is discarded.
4. **Enemy turn:** each living enemy, left to right, clears its own block and then performs the move it showed as its intent.
5. Each enemy picks its next intent, shown to the Operator. Back to step 1.

**Cards and piles**
- Arsenal → shuffled draw pile at fight start.
- Drawing from an empty draw pile shuffles the discard pile into it first.
- Hand limit is **10**. Cards drawn past the limit go straight to the discard pile.

**Damage and block**
- Block absorbs damage first; the rest hits OpSec (Operator) or Integrity (enemy).
- Operator block lasts until the start of the Operator's next turn.
- Enemy block lasts through the Operator's turn, until the enemy acts again. Hitting a Firewall right after it shields is a bad idea.

**Enemy intents**
- Each enemy has weighted moves. A move can set `maxInARow` to stop long streaks.
- The next move is always visible before the Operator acts.

**Ending a fight**
- **Won:** all enemies at 0 Integrity.
- **Lost:** Operator at 0 OpSec (Burned).
- **Turn cap:** after turn 50 the fight ends with outcome `turnCap`. How a run treats that is decided in Milestone 3.

## Milestone 1 content (placeholder)

| Card | Tactic | Cost | Effect |
| --- | --- | --- | --- |
| Brute Force | Credential Access | 1 | Deal 6 damage |
| Obfuscate | Defense Evasion | 1 | Gain 5 Block |

**Firewall** (44 Integrity): Deny All (Block 14, never twice in a row), Packet Drop (Attack 13, at most twice in a row), Stateful Inspection (Attack 9 + Block 6).

The demo Arsenal is 5 Brute Force + 5 Obfuscate, with 60 OpSec. Class starter decks replace it in Milestone 2.
