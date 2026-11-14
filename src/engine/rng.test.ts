import { describe, expect, it } from 'vitest';
import { Rng } from './rng';

describe('Rng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = new Rng(1);
    const b = new Rng(2);
    expect(a.next()).not.toEqual(b.next());
  });

  it('can be resumed from its saved state', () => {
    const original = new Rng(7);
    original.next();
    original.next();
    const resumed = new Rng(original.state);
    expect(resumed.next()).toEqual(original.next());
  });

  it('next() stays in [0, 1)', () => {
    const rng = new Rng(123);
    for (let i = 0; i < 10_000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('nextInt() covers its whole range and nothing outside it', () => {
    const rng = new Rng(99);
    const seen = new Set<number>();
    for (let i = 0; i < 1_000; i++) seen.add(rng.nextInt(6));
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('nextInt() rejects bad input', () => {
    expect(() => new Rng(1).nextInt(0)).toThrow();
    expect(() => new Rng(1).nextInt(2.5)).toThrow();
  });

  it('shuffle() keeps exactly the same items', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = new Rng(5).shuffle([...items]);
    expect([...shuffled].sort((x, y) => x - y)).toEqual(items);
    expect(shuffled).not.toEqual(items); // astronomically unlikely to stay sorted
  });

  it('pickWeightedIndex() never picks zero-weight entries and respects ratios', () => {
    const rng = new Rng(2024);
    const picks = Array.from({ length: 10_000 }, () => rng.pickWeightedIndex([1, 0, 3]));
    const share = (index: number) => picks.filter((pick) => pick === index).length / picks.length;
    expect(share(1)).toBe(0);
    // Expect roughly 25% / 75%.
    expect(share(0)).toBeCloseTo(0.25, 1);
    expect(share(2)).toBeCloseTo(0.75, 1);
  });

  it('pickWeightedIndex() rejects all-zero weights', () => {
    expect(() => new Rng(1).pickWeightedIndex([0, 0])).toThrow();
  });
});
