/**
 * Damage and block math, shared by the Operator and enemies.
 */
import { getAlertLevel } from './alert';
import { CHAIN_BLOCK_PER_STACK, CHAIN_DAMAGE_PER_STACK, EXPOSED_DAMAGE_MULTIPLIER, THROTTLED_DAMAGE_MULTIPLIER } from './rules';
import { CORE_STATUS, getStacks } from './statuses';
import type { Statuses } from './types';

export interface BlockResult {
  /** Block left after absorbing the hit. */
  blockLeft: number;
  /** Damage that got through the block and should hit HP (OpSec / Integrity). */
  damageThrough: number;
}

/**
 * Block soaks damage first; whatever is left goes through.
 * Example: 8 damage into 5 block => blockLeft 0, damageThrough 3.
 */
export function absorbWithBlock(block: number, damage: number): BlockResult {
  const safeDamage = Math.max(0, damage);
  const absorbed = Math.min(block, safeDamage);
  return {
    blockLeft: block - absorbed,
    damageThrough: safeDamage - absorbed,
  };
}

/** Block the Operator gains from one block effect: base + Chain bonus. */
export function operatorBlock(base: number, chainCount: number): number {
  return base + chainCount * CHAIN_BLOCK_PER_STACK;
}

/**
 * Damage of one Operator hit on an enemy, before block.
 * Order: base + Chain bonus, then the target's Exposed and the Operator's
 * own Throttled multipliers (each rounded down).
 * `operator` is the Operator's statuses; enemies can Throttle you from Act 2 on.
 */
export function operatorHitDamage(
  base: number,
  chainCount: number,
  bonusPerChain: number,
  target: Statuses,
  operator: Statuses = {},
): number {
  let damage = base + chainCount * (CHAIN_DAMAGE_PER_STACK + bonusPerChain);
  if (getStacks(target, CORE_STATUS.exposed) > 0) {
    damage = Math.floor(damage * EXPOSED_DAMAGE_MULTIPLIER);
  }
  if (getStacks(operator, CORE_STATUS.throttled) > 0) {
    damage = Math.floor(damage * THROTTLED_DAMAGE_MULTIPLIER);
  }
  return Math.max(0, damage);
}

/**
 * Damage of one enemy hit on the Operator, before block.
 * Order: base + Hardened + Alert bonus + `extraPerHit` (the Insider's fragility),
 * then the attacker's Throttled and the Operator's Exposed multipliers (each rounded down).
 */
export function enemyHitDamage(base: number, attacker: Statuses, alert: number, operator: Statuses = {}, extraPerHit = 0): number {
  let damage = base + getStacks(attacker, CORE_STATUS.hardened) + getAlertLevel(alert).enemyDamageBonus + extraPerHit;
  if (getStacks(attacker, CORE_STATUS.throttled) > 0) {
    damage = Math.floor(damage * THROTTLED_DAMAGE_MULTIPLIER);
  }
  if (getStacks(operator, CORE_STATUS.exposed) > 0) {
    damage = Math.floor(damage * EXPOSED_DAMAGE_MULTIPLIER);
  }
  return Math.max(0, damage);
}
