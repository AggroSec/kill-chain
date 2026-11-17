/**
 * Resolving card effects (and Implant turn-start effects, which use the same shapes).
 * Everything here mutates the draft state it's given; combat.ts passes a clone.
 */
import { clampAlert, isAlertInRange } from './alert';
import { absorbWithBlock, operatorBlock, operatorHitDamage } from './damage';
import { drawCards } from './deck';
import type { Rng } from './rng';
import { addStacks, CORE_STATUS, getStacks, getStatusDef } from './statuses';
import type { CardEffect, ContentRegistry, EnemyState } from './types';
import type { CombatState } from './types';

/** Everything an effect needs while resolving. */
export interface EffectContext {
  /** Draft state; effects mutate it. */
  state: CombatState;
  rng: Rng;
  content: ContentRegistry;
  /** Enemy picked by the Operator, or -1 if none (e.g. Implant triggers). */
  targetIndex: number;
  /** Indexes of enemies damaged so far, for "when attacked" triggers. */
  hitEnemies: Set<number>;
}

export function isEnemyAlive(enemy: EnemyState): boolean {
  return enemy.integrity > 0;
}

/** Indexes of every living enemy, left to right. */
export function livingEnemyIndexes(state: CombatState): number[] {
  return state.enemies.flatMap((enemy, index) => (isEnemyAlive(enemy) ? [index] : []));
}

/** The picked target as a one-item list, or empty if it's missing or dead. */
function pickedTarget(ctx: EffectContext): number[] {
  const enemy = ctx.state.enemies[ctx.targetIndex];
  return enemy !== undefined && isEnemyAlive(enemy) ? [ctx.targetIndex] : [];
}

/** Applies one hit of already-calculated damage to an enemy (block first). */
function hitEnemy(ctx: EffectContext, enemyIndex: number, damage: number): void {
  const enemy = ctx.state.enemies[enemyIndex];
  if (enemy === undefined || !isEnemyAlive(enemy)) return;
  const { blockLeft, damageThrough } = absorbWithBlock(enemy.block, damage);
  enemy.block = blockLeft;
  enemy.integrity = Math.max(0, enemy.integrity - damageThrough);
  ctx.hitEnemies.add(enemyIndex);
}

/** Does this list of effects (including nested ones) need a picked enemy? */
export function effectsNeedTarget(effects: readonly CardEffect[]): boolean {
  return effects.some((effect) => {
    switch (effect.kind) {
      case 'damage':
        return effect.target !== 'allEnemies';
      case 'applyStatus':
        return effect.target === 'target';
      case 'exploit':
        return true;
      case 'ifAlert':
        return effectsNeedTarget(effect.then);
      default:
        return false;
    }
  });
}

export function resolveCardEffects(ctx: EffectContext, effects: readonly CardEffect[]): void {
  for (const effect of effects) {
    resolveCardEffect(ctx, effect);
  }
}

function resolveCardEffect(ctx: EffectContext, effect: CardEffect): void {
  const { state } = ctx;
  const player = state.player;

  switch (effect.kind) {
    case 'damage': {
      const targets = effect.target === 'allEnemies' ? livingEnemyIndexes(state) : pickedTarget(ctx);
      const hits = effect.hits ?? 1;
      for (let hit = 0; hit < hits; hit++) {
        for (const index of targets) {
          const enemy = state.enemies[index];
          if (enemy === undefined) continue;
          const damage = operatorHitDamage(effect.amount, state.chain.count, effect.bonusPerChain ?? 0, enemy.statuses);
          hitEnemy(ctx, index, damage);
        }
      }
      return;
    }

    case 'block':
      // Chain boosts block like damage. Implants fire at turn start, when Chain is 0.
      player.block += operatorBlock(effect.amount, state.chain.count);
      return;

    case 'draw':
      drawCards(player, effect.count, ctx.rng);
      return;

    case 'gainCycles':
      player.cycles += effect.amount;
      return;

    case 'alert':
      state.alert = clampAlert(state.alert, effect.amount);
      return;

    case 'applyStatus': {
      getStatusDef(ctx.content, effect.status); // fail fast on typos
      if (effect.target === 'self') {
        addStacks(player.statuses, effect.status, effect.stacks);
        return;
      }
      const targets = effect.target === 'allEnemies' ? livingEnemyIndexes(state) : pickedTarget(ctx);
      for (const index of targets) {
        const enemy = state.enemies[index];
        if (enemy !== undefined) addStacks(enemy.statuses, effect.status, effect.stacks);
      }
      return;
    }

    case 'exploit': {
      // Consume every Vuln stack on the target; the payoff is one big hit.
      for (const index of pickedTarget(ctx)) {
        const enemy = state.enemies[index];
        if (enemy === undefined) continue;
        const stacks = getStacks(enemy.statuses, CORE_STATUS.vuln);
        if (stacks === 0) continue;
        addStacks(enemy.statuses, CORE_STATUS.vuln, -stacks);
        const damage = operatorHitDamage(stacks * effect.damagePerStack, state.chain.count, 0, enemy.statuses);
        hitEnemy(ctx, index, damage);
      }
      return;
    }

    case 'ifAlert':
      if (isAlertInRange(state.alert, effect.atLeast, effect.atMost)) {
        resolveCardEffects(ctx, effect.then);
      }
      return;
  }
}
