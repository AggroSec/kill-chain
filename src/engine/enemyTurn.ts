/**
 * Enemy actions: resolving enemy effects and running the enemy turn.
 * Mutates the draft state it's given; combat.ts passes a clone.
 */
import { clampAlert } from './alert';
import { absorbWithBlock, enemyHitDamage } from './damage';
import { isEnemyAlive } from './effects';
import { chooseNextMove, getMove, recordMoveUsed } from './intents';
import type { Rng } from './rng';
import { addStacks, CORE_STATUS, decayStatuses, getStacks, removeDebuffs, removeImplants } from './statuses';
import type { CombatState, ContentRegistry, EnemyDef, EnemyEffect } from './types';

export function getEnemyDef(content: ContentRegistry, defId: string): EnemyDef {
  const def = content.enemies[defId];
  if (def === undefined) throw new Error(`Unknown enemy id "${defId}"`);
  return def;
}

/** Resolves a list of effects for the enemy at `enemyIndex`. */
export function resolveEnemyEffects(
  state: CombatState,
  enemyIndex: number,
  effects: readonly EnemyEffect[],
  content: ContentRegistry,
): void {
  const enemy = state.enemies[enemyIndex];
  if (enemy === undefined) return;
  const player = state.player;

  for (const effect of effects) {
    switch (effect.kind) {
      case 'attack': {
        const hits = effect.hits ?? 1;
        for (let hit = 0; hit < hits; hit++) {
          const damage = enemyHitDamage(effect.damage, enemy.statuses, state.alert);
          const { blockLeft, damageThrough } = absorbWithBlock(player.block, damage);
          player.block = blockLeft;
          player.opsec = Math.max(0, player.opsec - damageThrough);
        }
        break;
      }
      case 'block':
        enemy.block += effect.amount;
        break;
      case 'raiseAlert':
        state.alert = clampAlert(state.alert, effect.amount);
        break;
      case 'cleanse':
        for (const other of state.enemies) removeDebuffs(other.statuses, content);
        break;
      case 'buffSelf':
        addStacks(enemy.statuses, effect.status, effect.stacks);
        break;
      case 'buffAllies':
        state.enemies.forEach((ally, index) => {
          if (index !== enemyIndex && isEnemyAlive(ally)) addStacks(ally.statuses, effect.status, effect.stacks);
        });
        break;
      case 'removeImplants':
        removeImplants(player.statuses, content, effect.count);
        break;
    }
  }
}

/**
 * Every living enemy acts, left to right, then picks its next intent.
 * Sets outcome "lost" (and stops early) if the Operator's OpSec hits 0.
 */
export function runEnemyTurn(state: CombatState, rng: Rng, content: ContentRegistry): void {
  state.enemies.forEach((enemy, index) => {
    if (state.outcome !== 'ongoing' || !isEnemyAlive(enemy)) return;

    // Enemy block lasts through the Operator's turn, then expires as the enemy acts.
    enemy.block = 0;

    if (getStacks(enemy.statuses, CORE_STATUS.stalled) > 0) {
      // Stalled: skip this action and use up one stack.
      addStacks(enemy.statuses, CORE_STATUS.stalled, -1);
    } else {
      const move = getMove(getEnemyDef(content, enemy.defId), enemy.intentMoveId);
      resolveEnemyEffects(state, index, move.effects, content);
      recordMoveUsed(enemy, move.id);
    }

    decayStatuses(enemy.statuses, content);
    if (state.player.opsec <= 0) state.outcome = 'lost';
  });

  if (state.outcome !== 'ongoing') return;

  // Roll what each enemy will do next turn, so the Operator can see it.
  for (const enemy of state.enemies) {
    if (!isEnemyAlive(enemy)) continue;
    enemy.intentMoveId = chooseNextMove(enemy, getEnemyDef(content, enemy.defId), rng);
  }
}
