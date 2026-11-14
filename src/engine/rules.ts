/**
 * Core rule numbers for combat. Kept in one place so balance changes
 * (and the simulator in later milestones) have a single source of truth.
 */

/** Cards drawn at the start of every player turn. */
export const CARDS_DRAWN_PER_TURN = 5;

/** Maximum cards in hand. Cards drawn past this go straight to the discard pile. */
export const MAX_HAND_SIZE = 10;

/** Cycles (energy) the Operator gets each turn unless something changes it. */
export const DEFAULT_MAX_CYCLES = 3;

/**
 * Combat ends with outcome "turnCap" after this many turns.
 * Guarantees every fight terminates, even with a degenerate deck or bot.
 */
export const TURN_CAP = 50;
