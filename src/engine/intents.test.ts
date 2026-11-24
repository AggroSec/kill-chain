import { describe, expect, it } from 'vitest';
import { TEST_CONTENT } from './__fixtures__/testContent';
import { chooseNextMove, recordMoveUsed } from './intents';
import { Rng } from './rng';
import type { EnemyDef, EnemyState } from './types';

const alternator = TEST_CONTENT.enemies.alternator as EnemyDef;

function freshEnemy(): EnemyState {
  return { uid: 1, defId: 'alternator', integrity: 20, maxIntegrity: 20, block: 0, statuses: {}, intentMoveId: '', lastMoveId: null, timesInARow: 0 };
}

describe('enemy intents', () => {
  it('never repeats a move past its maxInARow limit', () => {
    const rng = new Rng(11);
    const enemy = freshEnemy();
    let previous: string | null = null;
    for (let i = 0; i < 500; i++) {
      const moveId = chooseNextMove(enemy, alternator, rng, 0);
      if (previous === 'spike') expect(moveId).not.toBe('spike');
      recordMoveUsed(enemy, moveId);
      previous = moveId;
    }
  });

  it('tracks how many times in a row a move was used', () => {
    const enemy = freshEnemy();
    recordMoveUsed(enemy, 'rest');
    recordMoveUsed(enemy, 'rest');
    expect(enemy.timesInARow).toBe(2);
    recordMoveUsed(enemy, 'spike');
    expect(enemy.lastMoveId).toBe('spike');
    expect(enemy.timesInARow).toBe(1);
  });
});
