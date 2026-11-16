/**
 * Core rule numbers for combat. One place to tune them.
 */

/** Cards drawn at the start of every player turn. */
export const CARDS_DRAWN_PER_TURN = 5;

/** Maximum cards in hand. Cards drawn past this go straight to the discard pile. */
export const MAX_HAND_SIZE = 10;

/** Cycles (energy) the Operator gets each turn unless something changes it. */
export const DEFAULT_MAX_CYCLES = 3;

/** Combat ends with outcome "turnCap" after this many turns, so every fight terminates. */
export const TURN_CAP = 50;

/** Extra damage per hit for each Chain stack (see chain.ts). */
export const CHAIN_DAMAGE_PER_STACK = 2;

/** Exposed enemies take this much more damage from attacks (0.5 = +50%). */
export const EXPOSED_DAMAGE_MULTIPLIER = 1.5;

/** Throttled enemies deal this fraction of their attack damage. */
export const THROTTLED_DAMAGE_MULTIPLIER = 0.75;
