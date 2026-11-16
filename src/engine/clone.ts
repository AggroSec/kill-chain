/**
 * Deep copy of combat state. Written out by hand (instead of structuredClone)
 * because the simulator clones state thousands of times per second, and an
 * explicit copy is several times faster. If you add a field to the state
 * types, add it here too; the "does not mutate" tests will catch a miss.
 */
import type { CardInstance, CombatState, EnemyState, PlayerState } from './types';

function cloneCards(cards: CardInstance[]): CardInstance[] {
  return cards.map((card) => ({ uid: card.uid, defId: card.defId }));
}

function clonePlayer(player: PlayerState): PlayerState {
  return {
    ...player,
    drawPile: cloneCards(player.drawPile),
    hand: cloneCards(player.hand),
    discardPile: cloneCards(player.discardPile),
    spentPile: cloneCards(player.spentPile),
    statuses: { ...player.statuses },
  };
}

function cloneEnemy(enemy: EnemyState): EnemyState {
  return { ...enemy, statuses: { ...enemy.statuses } };
}

export function cloneCombatState(state: CombatState): CombatState {
  return {
    ...state,
    chain: { ...state.chain },
    player: clonePlayer(state.player),
    enemies: state.enemies.map(cloneEnemy),
  };
}
