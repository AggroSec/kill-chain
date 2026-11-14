/**
 * Draw pile / hand / discard pile handling.
 * These functions mutate the PlayerState they're given. The reducer in
 * combat.ts always passes a fresh copy, so callers never see mutation.
 */
import { MAX_HAND_SIZE } from './rules';
import type { Rng } from './rng';
import type { PlayerState } from './types';

/**
 * Moves the discard pile into the draw pile and shuffles it.
 * Called automatically when you need to draw from an empty draw pile.
 */
export function reshuffleDiscardIntoDraw(player: PlayerState, rng: Rng): void {
  player.drawPile = rng.shuffle([...player.drawPile, ...player.discardPile]);
  player.discardPile = [];
}

/**
 * Draws up to `count` cards, one at a time.
 * - Empty draw pile: reshuffle the discard pile into it first.
 * - Both piles empty: stop drawing early.
 * - Hand already at MAX_HAND_SIZE: the drawn card goes to the discard pile.
 *
 * Returns how many cards actually ended up in hand.
 */
export function drawCards(player: PlayerState, count: number, rng: Rng): number {
  let drawnIntoHand = 0;
  for (let i = 0; i < count; i++) {
    if (player.drawPile.length === 0) {
      if (player.discardPile.length === 0) break;
      reshuffleDiscardIntoDraw(player, rng);
    }
    // The top of the draw pile is the end of the array.
    const card = player.drawPile.pop();
    if (card === undefined) break;

    if (player.hand.length >= MAX_HAND_SIZE) {
      player.discardPile.push(card);
    } else {
      player.hand.push(card);
      drawnIntoHand++;
    }
  }
  return drawnIntoHand;
}

/** Moves every card in hand to the discard pile (end of turn). */
export function discardHand(player: PlayerState): void {
  player.discardPile.push(...player.hand);
  player.hand = [];
}
