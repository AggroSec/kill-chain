/**
 * Runtime combat state and actions.
 *
 * Naming note: identifiers use the Kill Chain terms from CLAUDE.md
 * (OpSec = player HP, Cycles = energy, Integrity = enemy HP).
 * Static content types (cards, enemies, statuses) live in contentTypes.ts.
 */
export * from './contentTypes';
import type { CardEffect } from './contentTypes';

/**
 * A physical copy of a card in the Arsenal. Two copies of the same card
 * share a defId but have different uids.
 */
export interface CardInstance {
  uid: number;
  defId: string;
}

/**
 * Status stacks by status id, e.g. { vuln: 3, exposed: 1 }.
 * A status with 0 stacks is removed from the object.
 * Key order is insertion order, which Patch Cycle uses for "oldest first".
 */
export type Statuses = Record<string, number>;

export interface PlayerState {
  opsec: number;
  maxOpsec: number;
  block: number;
  cycles: number;
  maxCycles: number;
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  /** Burner and Implant cards go here after being played; out for the rest of the fight. */
  spentPile: CardInstance[];
  statuses: Statuses;
}

export interface EnemyState {
  uid: number;
  defId: string;
  integrity: number;
  maxIntegrity: number;
  block: number;
  statuses: Statuses;
  /** Id of the move this enemy will use on its next turn (shown as its intent). */
  intentMoveId: string;
  /** Last move used, and how many times in a row, for the maxInARow rule. */
  lastMoveId: string | null;
  timesInARow: number;
}

/**
 * Kill-chain combo tracker for the current turn (see chain.ts).
 * count: current Chain stacks. lastTacticIndex: tactic of the last card played this turn.
 */
export interface ChainState {
  count: number;
  lastTacticIndex: number | null;
}

export type CombatOutcome = 'ongoing' | 'won' | 'lost' | 'turnCap';

export interface CombatState {
  /** Turn number, starting at 1. */
  turn: number;
  outcome: CombatOutcome;
  /** Alert meter for this fight, 0 to ALERT_MAX. */
  alert: number;
  chain: ChainState;
  player: PlayerState;
  enemies: EnemyState[];
  /** Noisy cards raise Alert by this much less, minimum 0 (from Tools like Proxy Chain). */
  noisyReduction: number;
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
  /** Bonuses from the run (Tools, Heat). Omit for a plain fight. */
  modifiers?: CombatModifiers;
}

/** Run-level bonuses that change a fight. Every field is optional. */
export interface CombatModifiers {
  /** Alert at the start of the fight (Heat from Intel events). */
  startingAlert?: number;
  /** Noisy cards raise Alert by this much less (minimum 0). */
  noisyReduction?: number;
  /** Extra cards drawn on turn 1. */
  firstTurnDraw?: number;
  /** Extra Cycles on turn 1. */
  firstTurnCycles?: number;
  /** Effects that resolve once at the start of the fight, after the opening draw. No picked target. */
  combatStart?: readonly CardEffect[];
}

export type CombatAction =
  | { type: 'PLAY_CARD'; handIndex: number; targetIndex: number }
  | { type: 'END_TURN' };
