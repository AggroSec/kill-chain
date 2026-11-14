/**
 * Checks on the real game data: every id resolves, numbers are sane,
 * and random play against the demo fight always terminates.
 */
import { describe, expect, it } from 'vitest';
import { combatReducer, Rng, startCombat, TURN_CAP, whyCantPlay } from '../engine';
import type { CombatState } from '../engine';
import { CONTENT, DEMO_COMBAT } from './content';

describe('content data', () => {
  it('card ids match their keys and numbers are sane', () => {
    for (const [key, card] of Object.entries(CONTENT.cards)) {
      expect(card.id).toBe(key);
      expect(card.cost).toBeGreaterThanOrEqual(0);
      expect(card.effects.length).toBeGreaterThan(0);
    }
  });

  it('enemy ids match their keys and every enemy has a pickable move', () => {
    for (const [key, enemy] of Object.entries(CONTENT.enemies)) {
      expect(enemy.id).toBe(key);
      expect(enemy.maxIntegrity).toBeGreaterThan(0);
      expect(enemy.moves.some((move) => move.weight > 0)).toBe(true);
      const moveIds = enemy.moves.map((move) => move.id);
      expect(new Set(moveIds).size).toBe(moveIds.length);
    }
  });

  it('the demo fight only references real content', () => {
    expect(() => startCombat(DEMO_COMBAT, 1, CONTENT)).not.toThrow();
  });
});

/** A bot that plays random legal cards and sometimes ends its turn early. */
function playRandomly(seed: number): CombatState {
  const botRng = new Rng(seed ^ 0x5eed);
  let state = startCombat(DEMO_COMBAT, seed, CONTENT);
  // Hard ceiling on actions so a bug can't hang the test run.
  for (let step = 0; step < 10_000 && state.outcome === 'ongoing'; step++) {
    const playable = state.player.hand
      .map((_, index) => index)
      .filter((index) => whyCantPlay(state, index, 0, CONTENT) === null);
    if (playable.length === 0 || botRng.next() < 0.15) {
      state = combatReducer(state, { type: 'END_TURN' }, CONTENT);
    } else {
      const handIndex = playable[botRng.nextInt(playable.length)] ?? 0;
      state = combatReducer(state, { type: 'PLAY_CARD', handIndex, targetIndex: 0 }, CONTENT);
    }
  }
  return state;
}

describe('random play fuzz test', () => {
  it('every fight ends within the turn cap with valid state', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const end = playRandomly(seed);
      expect(end.outcome).not.toBe('ongoing');
      expect(end.turn).toBeLessThanOrEqual(TURN_CAP);
      expect(end.player.opsec).toBeGreaterThanOrEqual(0);
      const { drawPile, hand, discardPile } = end.player;
      expect(drawPile.length + hand.length + discardPile.length).toBe(DEMO_COMBAT.deck.length);
    }
  });
});
