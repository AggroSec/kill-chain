/**
 * Turns engine data into short display strings using TERMS.
 * Pure functions, so they're easy to test and reuse.
 */
import type { CardEffect, EnemyEffect } from '../engine';
import { TERMS } from '../data/terms';

export function describeIntent(effects: readonly EnemyEffect[]): string {
  return effects
    .map((effect) => {
      switch (effect.kind) {
        case 'attack':
          return `${TERMS.intentAttack} ${effect.damage}`;
        case 'block':
          return `${TERMS.intentBlock} ${effect.amount}`;
      }
    })
    .join(' + ');
}

export function describeCardEffects(effects: readonly CardEffect[]): string {
  return effects
    .map((effect) => {
      switch (effect.kind) {
        case 'damage':
          return `Deal ${effect.amount} damage.`;
        case 'block':
          return `Gain ${effect.amount} ${TERMS.block}.`;
      }
    })
    .join(' ');
}
