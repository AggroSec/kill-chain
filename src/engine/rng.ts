/**
 * Seeded pseudo-random number generator (mulberry32).
 *
 * The engine never calls Math.random. Instead, the RNG's whole state is one
 * 32-bit integer stored in CombatState.rngState. Same seed + same actions
 * always produce the same game.
 *
 * Usage inside the engine:
 *   const rng = new Rng(state.rngState);
 *   const roll = rng.nextInt(6);
 *   state.rngState = rng.state; // save the advanced state back
 */
export class Rng {
  private current: number;

  constructor(seed: number) {
    // ">>> 0" forces the number into an unsigned 32-bit integer.
    this.current = seed >>> 0;
  }

  /** The state to store back into the game so the sequence continues later. */
  get state(): number {
    return this.current;
  }

  /** Returns a float in [0, 1). */
  next(): number {
    // mulberry32: small, fast, and good enough for a card game.
    // Math.imul does 32-bit integer multiplication.
    this.current = (this.current + 0x6d2b79f5) >>> 0;
    let t = this.current;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [0, maxExclusive). */
  nextInt(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error(`nextInt needs a positive integer, got ${maxExclusive}`);
    }
    return Math.floor(this.next() * maxExclusive);
  }

  /** Shuffles the array in place (Fisher-Yates) and returns it. */
  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      const temp = items[i] as T;
      items[i] = items[j] as T;
      items[j] = temp;
    }
    return items;
  }

  /**
   * Picks an index with probability proportional to its weight.
   * Weights must be non-negative and at least one must be positive.
   */
  pickWeightedIndex(weights: readonly number[]): number {
    const total = weights.reduce((sum, w) => sum + w, 0);
    if (!(total > 0)) {
      throw new Error('pickWeightedIndex needs at least one positive weight');
    }
    let roll = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i] ?? 0;
      if (roll < 0) return i;
    }
    // Floating-point rounding can leave us here; fall back to the last positive weight.
    for (let i = weights.length - 1; i >= 0; i--) {
      if ((weights[i] ?? 0) > 0) return i;
    }
    return 0;
  }
}
