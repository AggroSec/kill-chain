/**
 * Damage and block math, shared by the Operator and enemies.
 */

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
