import { describe, expect, it } from 'vitest';
import { discardHand, drawCards } from './deck';
import { Rng } from './rng';
import { MAX_HAND_SIZE } from './rules';
import type { CardInstance, PlayerState } from './types';

function cards(count: number, startUid = 1): CardInstance[] {
  return Array.from({ length: count }, (_, i) => ({ uid: startUid + i, defId: 'strike' }));
}

function makePlayer(parts: Partial<PlayerState>): PlayerState {
  return {
    opsec: 10,
    maxOpsec: 10,
    block: 0,
    cycles: 3,
    maxCycles: 3,
    drawPile: [],
    hand: [],
    discardPile: [],
    ...parts,
  };
}

describe('drawCards', () => {
  it('draws from the top (end) of the draw pile into hand', () => {
    const player = makePlayer({ drawPile: cards(5) });
    const drawn = drawCards(player, 2, new Rng(1));
    expect(drawn).toBe(2);
    expect(player.hand.map((c) => c.uid)).toEqual([5, 4]);
    expect(player.drawPile).toHaveLength(3);
  });

  it('reshuffles the discard pile when the draw pile runs out', () => {
    const player = makePlayer({ drawPile: cards(2), discardPile: cards(4, 10) });
    drawCards(player, 5, new Rng(1));
    expect(player.hand).toHaveLength(5);
    expect(player.discardPile).toHaveLength(0);
    expect(player.drawPile).toHaveLength(1);
  });

  it('stops early when both piles are empty', () => {
    const player = makePlayer({ drawPile: cards(2) });
    expect(drawCards(player, 5, new Rng(1))).toBe(2);
    expect(player.hand).toHaveLength(2);
  });

  it('sends cards to the discard pile when the hand is full', () => {
    const player = makePlayer({ hand: cards(MAX_HAND_SIZE - 1), drawPile: cards(3, 100) });
    const drawn = drawCards(player, 3, new Rng(1));
    expect(drawn).toBe(1);
    expect(player.hand).toHaveLength(MAX_HAND_SIZE);
    expect(player.discardPile).toHaveLength(2);
  });

  it('never loses or duplicates cards', () => {
    const player = makePlayer({ drawPile: cards(3), discardPile: cards(7, 50) });
    drawCards(player, 8, new Rng(3));
    const all = [...player.drawPile, ...player.hand, ...player.discardPile].map((c) => c.uid).sort((a, b) => a - b);
    expect(all).toEqual([1, 2, 3, 50, 51, 52, 53, 54, 55, 56]);
  });
});

describe('discardHand', () => {
  it('moves the whole hand to the discard pile', () => {
    const player = makePlayer({ hand: cards(3), discardPile: cards(1, 9) });
    discardHand(player);
    expect(player.hand).toHaveLength(0);
    expect(player.discardPile).toHaveLength(4);
  });
});
