import { describe, expect, it } from 'vitest';
import { cardAt, fanPosition } from './Hand';

const CARD_WIDTH = 96;

describe('fanPosition', () => {
  // Hand width on phones: screen minus 12px padding each side.
  for (const screen of [360, 390, 430]) {
    it(`keeps 1 to 10 cards inside a ${screen}px screen`, () => {
      const width = screen - 24;
      for (let count = 1; count <= 10; count++) {
        for (let i = 0; i < count; i++) {
          const { left } = fanPosition(i, count, width);
          expect(left).toBeGreaterThanOrEqual(0);
          expect(left + CARD_WIDTH).toBeLessThanOrEqual(width + 0.001);
        }
      }
    });
  }

  it('leaves every card in a 10-card hand at least 24px of visible, tappable edge', () => {
    const width = 360 - 24;
    const lefts = Array.from({ length: 10 }, (_, i) => fanPosition(i, 10, width).left);
    for (let i = 1; i < lefts.length; i++) expect((lefts[i] ?? 0) - (lefts[i - 1] ?? 0)).toBeGreaterThanOrEqual(24);
  });
});

describe('cardAt', () => {
  it('finds the topmost card under a point', () => {
    const width = 336;
    for (let i = 0; i < 10; i++) {
      const { left } = fanPosition(i, 10, width);
      // Just right of a card's left edge is that card (it covers the one before it).
      expect(cardAt(left + 2, 10, width)).toBe(i);
    }
    expect(cardAt(-5, 10, width)).toBeNull();
  });
});
