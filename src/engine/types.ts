/**
 * Shared types for the combat engine.
 *
 * Naming note: identifiers use the Kill Chain terms from CLAUDE.md
 * (OpSec = player HP, Cycles = energy, Integrity = enemy HP).
 */

// ---------------------------------------------------------------------------
// ATT&CK tactics
// ---------------------------------------------------------------------------

/**
 * MITRE ATT&CK Enterprise tactics, in kill-chain order.
 * The order matters: Chain combos (Milestone 2) reward playing them in sequence.
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

// ---------------------------------------------------------------------------
// Card definitions (static data, lives in src/data)
// ---------------------------------------------------------------------------

/**
 * A single thing a card does when played. Effects resolve in list order.
 * Milestone 2 grows this union (draw, Alert, Chain, keywords, ...).
 */
export type CardEffect =
  /** Deal damage to the targeted enemy. Enemy block absorbs it first. */
  | { kind: 'damage'; amount: number }
  /** Gain block, which absorbs damage until the start of your next turn. */
  | { kind: 'block'; amount: number };

export type CardType = 'attack' | 'skill';

export interface CardDef {
  /** Stable id used in save data and decklists, e.g. "brute-force". */
  id: string;
  /** Display name. */
  name: string;
  type: CardType;
  tactic: Tactic;
  /** Cycles needed to play the card. */
  cost: number;
  effects: readonly CardEffect[];
  /**
   * Optional art file name inside src/assets/cards/.
   * When missing, the UI renders a generated placeholder (Milestone 4).
   */
  art?: string;
}

// ---------------------------------------------------------------------------
// Enemy definitions (static data, lives in src/data)
// ---------------------------------------------------------------------------

/** Something an enemy does on its turn. Resolves in list order. */
export type EnemyEffect =
  /** Damage the Operator. Operator block absorbs it first. */
  | { kind: 'attack'; damage: number }
  /** Enemy gains block that lasts until the start of its next turn. */
  | { kind: 'block'; amount: number };

/** One move in an enemy's repertoire. Its effects double as the shown intent. */
export interface EnemyMove {
  id: string;
  name: string;
  effects: readonly EnemyEffect[];
  /** Relative chance of being picked. Higher = more likely. */
  weight: number;
  /**
   * Max times this move can be picked in a row. Stops long streaks
   * of the same move from bad luck. Omit for no limit.
   */
  maxInARow?: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  maxIntegrity: number;
  moves: readonly EnemyMove[];
}

/** Lookup tables the engine uses to resolve ids into definitions. */
export interface ContentRegistry {
  cards: Readonly<Record<string, CardDef>>;
  enemies: Readonly<Record<string, EnemyDef>>;
}

// ---------------------------------------------------------------------------
// Runtime combat state (changes every action; plain data so it can be cloned)
// ---------------------------------------------------------------------------

/**
 * A physical copy of a card in the Arsenal. Two copies of the same card
 * share a defId but have different uids, so the UI and tests can tell them apart.
 */
export interface CardInstance {
  uid: number;
  defId: string;
}

export interface PlayerState {
  opsec: number;
  maxOpsec: number;
  block: number;
  cycles: number;
  maxCycles: number;
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
}

export interface EnemyState {
  uid: number;
  defId: string;
  integrity: number;
  maxIntegrity: number;
  block: number;
  /** Id of the move this enemy will use on its next turn (shown as its intent). */
  intentMoveId: string;
  /** Last move used, and how many times in a row, for the maxInARow rule. */
  lastMoveId: string | null;
  timesInARow: number;
}

export type CombatOutcome = 'ongoing' | 'won' | 'lost' | 'turnCap';

export interface CombatState {
  /** Turn number, starting at 1. */
  turn: number;
  outcome: CombatOutcome;
  player: PlayerState;
  enemies: EnemyState[];
  /** Seeded RNG state. All randomness reads and advances this. */
  rngState: number;
}

/** Everything needed to start a fight. */
export interface CombatSetup {
  /** Card ids in the Operator's Arsenal. Order doesn't matter; it gets shuffled. */
  deck: readonly string[];
  opsec: number;
  maxOpsec: number;
  maxCycles: number;
  /** Enemy ids, left to right. */
  enemies: readonly string[];
}

// ---------------------------------------------------------------------------
// Actions the UI (or a bot) can send to the engine
// ---------------------------------------------------------------------------

export type CombatAction =
  | { type: 'PLAY_CARD'; handIndex: number; targetIndex: number }
  | { type: 'END_TURN' };
