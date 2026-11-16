/**
 * Read-only predictions for the UI and bots: what each enemy will
 * actually do next turn, with every modifier (Alert, Hardened, Throttled) applied.
 */
import { enemyHitDamage } from './damage';
import { isEnemyAlive } from './effects';
import { getEnemyDef } from './enemyTurn';
import { getMove } from './intents';
import { CORE_STATUS, getStacks } from './statuses';
import type { CombatState, ContentRegistry, EnemyEffect } from './types';

export interface IntentPreview {
  moveName: string;
  /** True if the enemy will skip this action (Stalled). */
  stalled: boolean;
  /** The move's effects, with attack damage replaced by the real per-hit number. */
  effects: EnemyEffect[];
}

export function previewIntent(state: CombatState, enemyIndex: number, content: ContentRegistry): IntentPreview | null {
  const enemy = state.enemies[enemyIndex];
  if (enemy === undefined || !isEnemyAlive(enemy)) return null;
  const move = getMove(getEnemyDef(content, enemy.defId), enemy.intentMoveId);
  return {
    moveName: move.name,
    stalled: getStacks(enemy.statuses, CORE_STATUS.stalled) > 0,
    effects: move.effects.map((effect) =>
      effect.kind === 'attack' ? { ...effect, damage: enemyHitDamage(effect.damage, enemy.statuses, state.alert) } : effect,
    ),
  };
}

/**
 * Total attack damage the enemies will deal next enemy turn, before the
 * Operator's block. Uses current Alert (moves list attacks before Alert raises).
 */
export function incomingDamage(state: CombatState, content: ContentRegistry): number {
  let total = 0;
  state.enemies.forEach((_, index) => {
    const preview = previewIntent(state, index, content);
    if (preview === null || preview.stalled) return;
    for (const effect of preview.effects) {
      if (effect.kind === 'attack') total += effect.damage * (effect.hits ?? 1);
    }
  });
  return total;
}
