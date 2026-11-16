import { describe, expect, it } from 'vitest';
import { enemyAt, stateWithHand } from './__fixtures__/testContent';
import { cloneCombatState } from './clone';

describe('cloneCombatState', () => {
  it('produces an equal but fully independent copy', () => {
    const original = stateWithHand(['strike', 'guard'], { enemies: ['wall', 'puncher'] });
    original.player.statuses = { beacon: 1 };
    enemyAt(original, 0).statuses = { vuln: 2 };
    const snapshot = structuredClone(original);

    const copy = cloneCombatState(original);
    expect(copy).toEqual(original);

    // Mutate every nested part of the copy; the original must not change.
    copy.chain.count = 9;
    copy.player.hand.pop();
    copy.player.drawPile[0] = { uid: 999, defId: 'changed' };
    copy.player.statuses.beacon = 5;
    enemyAt(copy, 0).statuses.vuln = 7;
    enemyAt(copy, 1).integrity = 1;
    copy.enemies.pop();

    expect(original).toEqual(snapshot);
  });
});
