/**
 * Types for static game content: cards, statuses and enemies.
 * The data itself lives in src/data; the engine only knows these shapes.
 */

// ---------------------------------------------------------------------------
// ATT&CK tactics
// ---------------------------------------------------------------------------

/**
 * MITRE ATT&CK Enterprise tactics, in kill-chain order.
 * Chain combos reward playing cards in this order within a turn (see chain.ts).
 */
export const TACTICS_IN_ORDER = [
  'reconnaissance',
  'resource-development',
  'initial-access',
  'execution',
  'persistence',
  'privilege-escalation',
  'defense-evasion',
  'credential-access',
  'discovery',
  'lateral-movement',
  'collection',
  'command-and-control',
  'exfiltration',
  'impact',
] as const;

/** One ATT&CK tactic, e.g. "initial-access". */
export type Tactic = (typeof TACTICS_IN_ORDER)[number];

/** Alert levels, lowest to highest. Thresholds live in alert.ts. */
export type AlertLevelId = 'quiet' | 'noisy' | 'detected' | 'lockdown';

// ---------------------------------------------------------------------------
// Card effects
// ---------------------------------------------------------------------------

/**
 * Who an effect applies to.
 * - target: the enemy the Operator picked when playing the card
 * - allEnemies: every living enemy
 * - randomEnemy: one random living enemy (used by start-of-fight effects like Smooth Talker)
 * - self: the Operator
 */
export type EffectTarget = 'target' | 'allEnemies' | 'randomEnemy' | 'self';

/** A single thing a card does when played. Effects resolve in list order. */
export type CardEffect =
  /**
   * Deal damage. Each hit gets the Chain bonus, then enemy block absorbs it.
   * `bonusPerChain` adds extra damage per Chain stack on top of the base rule.
   */
  | { kind: 'damage'; amount: number; hits?: number; target?: 'target' | 'allEnemies'; bonusPerChain?: number }
  /** Gain block until the start of your next turn. */
  | { kind: 'block'; amount: number }
  /** Draw cards. */
  | { kind: 'draw'; count: number }
  /** Gain Cycles this turn. */
  | { kind: 'gainCycles'; amount: number }
  /** Change Alert. Negative numbers lower it. */
  | { kind: 'alert'; amount: number }
  /** Add stacks of a status (see StatusDef) to enemies or yourself. */
  | { kind: 'applyStatus'; status: string; stacks: number; target: EffectTarget }
  /** Consume all Vuln on the target and deal this much damage per stack. */
  | { kind: 'exploit'; damagePerStack: number }
  /** Only resolve `then` if Alert is in range (both bounds inclusive). */
  | { kind: 'ifAlert'; atMost?: AlertLevelId; atLeast?: AlertLevelId; then: readonly CardEffect[] };

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

/** attack/skill are played and discarded; implants stay in play for the fight. */
export type CardType = 'attack' | 'skill' | 'implant';

/** Card rarity. Player-facing names (Public / Private / 0-day) live in terms.ts. */
export type Rarity = 'starter' | 'public' | 'private' | 'zero-day';

export interface CardKeywords {
  /** Raise Alert by this much after the card resolves. */
  noisy?: number;
  /** Removed for the rest of the fight after being played. */
  burner?: boolean;
  /** Stays in hand at end of turn instead of being discarded. */
  stash?: boolean;
}

export interface CardDef {
  /** Stable id used in save data and decklists, e.g. "brute-force". */
  id: string;
  name: string;
  type: CardType;
  tactic: Tactic;
  rarity: Rarity;
  /** Class id that can find this card, or "neutral". */
  owner: string;
  /** Cycles needed to play the card. */
  cost: number;
  effects: readonly CardEffect[];
  keywords?: CardKeywords;
  /** Optional art file name inside src/assets/cards/. Missing = generated placeholder. */
  art?: string;
  /** What changes when this card is upgraded to v2. Omit if the card can't be upgraded. */
  v2?: CardUpgrade;
}

/**
 * The fields a v2 replaces. Anything left out stays the same as the base card.
 * `keywords` replaces the whole keyword set (use {} to remove all keywords).
 */
export interface CardUpgrade {
  cost?: number;
  effects?: readonly CardEffect[];
  keywords?: CardKeywords;
}

// ---------------------------------------------------------------------------
// Statuses (buffs, debuffs, implants)
// ---------------------------------------------------------------------------

export interface StatusDef {
  id: string;
  name: string;
  /** Short rules text shown in the inspect panel. */
  description: string;
  kind: 'buff' | 'debuff';
  /**
   * endOfOwnerTurn: lose 1 stack at the end of the owner's turn (a duration).
   * never: stacks stay until consumed or removed.
   */
  decay: 'endOfOwnerTurn' | 'never';
  /** Implants are the Operator's persistence effects. Patch Cycle removes them. */
  implant?: boolean;
  /**
   * For Operator statuses: effects that fire at the start of each Operator turn,
   * once per stack. Must not use target "target" (there's no picked enemy then).
   */
  onTurnStart?: readonly CardEffect[];
}

// ---------------------------------------------------------------------------
// Enemies
// ---------------------------------------------------------------------------

/** Something an enemy does. Resolves in list order. */
export type EnemyEffect =
  /** Damage the Operator (each hit). Operator block absorbs it first. */
  | { kind: 'attack'; damage: number; hits?: number }
  /** Enemy gains block that lasts until it acts again. */
  | { kind: 'block'; amount: number }
  /** Raise Alert. */
  | { kind: 'raiseAlert'; amount: number }
  /** Remove every debuff from every enemy. */
  | { kind: 'cleanse' }
  /** Add stacks of a status to this enemy. */
  | { kind: 'buffSelf'; status: string; stacks: number }
  /** Add stacks of a status to every OTHER living enemy (e.g. the Incident Commander). */
  | { kind: 'buffAllies'; status: string; stacks: number }
  /** Destroy up to `count` of the Operator's Implants (oldest first). */
  | { kind: 'removeImplants'; count: number }
  /** Restore Integrity to every OTHER living enemy (e.g. the Domain Controller re-issuing tickets). */
  | { kind: 'healAllies'; amount: number }
  /** Add stacks of a debuff to the Operator (Throttled: your attacks deal less; Exposed: you take more). */
  | { kind: 'debuffPlayer'; status: string; stacks: number };

/** One move in an enemy's repertoire. Its effects double as the shown intent. */
export interface EnemyMove {
  id: string;
  name: string;
  effects: readonly EnemyEffect[];
  /** Relative chance of being picked. Higher = more likely. */
  weight: number;
  /** Max times this move can be picked in a row. Omit for no limit. */
  maxInARow?: number;
  /**
   * Only picked when Alert is in this range (checked when the intent is rolled).
   * e.g. the Safety Instrumented System only "trips" at Detected or higher.
   */
  whenAlert?: { atLeast?: AlertLevelId; atMost?: AlertLevelId };
}

export interface EnemyDef {
  id: string;
  name: string;
  tier: 'normal' | 'elite' | 'boss';
  maxIntegrity: number;
  moves: readonly EnemyMove[];
  /** Short description of the enemy's gimmick, for the inspect panel. */
  description: string;
  /** Fires once each time a card damages this enemy (not once per hit). */
  onAttacked?: readonly EnemyEffect[];
}

/** Lookup tables the engine uses to resolve ids into definitions. */
export interface ContentRegistry {
  cards: Readonly<Record<string, CardDef>>;
  enemies: Readonly<Record<string, EnemyDef>>;
  statuses: Readonly<Record<string, StatusDef>>;
}
