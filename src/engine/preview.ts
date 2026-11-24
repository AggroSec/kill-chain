/**
 * Read-only predictions for the UI and bots: what each enemy will
 * actually do next turn, with every modifier (Alert, Hardened, Throttled) applied.
 */
import { extendsChain } from './chain';
import { enemyHitDamage, operatorBlock } from './damage';
import { CHAIN_DAMAGE_PER_STACK } from './rules';
import { isEnemyAlive } from './effects';
import { getEnemyDef } from './enemyTurn';
import { getMove } from './intents';
import { CORE_STATUS, getStacks } from './statuses';
import type { CardDef, CardEffect, CombatState, ContentRegistry, EnemyEffect } from './types';

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
      effect.kind === 'attack'
        ? { ...effect, damage: enemyHitDamage(effect.damage, enemy.statuses, state.alert, state.player.statuses, state.damageTakenPerHit) }
        : effect,
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

/** The Chain count a card would resolve at if it were played right now. */
export function chainIfPlayed(state: CombatState, def: CardDef): number {
  return extendsChain(state.chain, def.tactic) ? state.chain.count + 1 : 0;
}

function effectAtChain(effect: CardEffect, chainCount: number): CardEffect {
  switch (effect.kind) {
    case 'damage':
      return { ...effect, amount: effect.amount + chainCount * (CHAIN_DAMAGE_PER_STACK + (effect.bonusPerChain ?? 0)) };
    case 'block':
      return { ...effect, amount: operatorBlock(effect.amount, chainCount) };
    case 'ifAlert':
      return { ...effect, then: effect.then.map((inner) => effectAtChain(inner, chainCount)) };
    default:
      return effect;
  }
}

/**
 * A copy of the card with Chain already added to its damage and block
 * numbers, for display ("Deal 10 damage" at Chain 2 instead of "Deal 6").
 * Display only: combat still applies the bonus itself when the card resolves.
 * Exploit's bonus is added once to the total, so it can't be shown per stack
 * and is left as is.
 */
export function cardAtChain(def: CardDef, chainCount: number): CardDef {
  if (chainCount <= 0) return def;
  return { ...def, effects: def.effects.map((effect) => effectAtChain(effect, chainCount)) };
}
