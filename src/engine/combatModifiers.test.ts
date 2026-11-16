import { describe, expect, it } from 'vitest';
import { endTurn, enemyAt, makeSetup, play, stateWithHand, TEST_CONTENT } from './__fixtures__/testContent';
import { startCombat } from './combat';

describe('run modifiers on a fight (Tools and Heat)', () => {
  it('startingAlert sets Alert at the start of the fight (Heat), clamped to the max', () => {
    expect(startCombat(makeSetup({ modifiers: { startingAlert: 5 } }), 1, TEST_CONTENT).alert).toBe(5);
    expect(startCombat(makeSetup({ modifiers: { startingAlert: 99 } }), 1, TEST_CONTENT).alert).toBe(20);
    expect(startCombat(makeSetup(), 1, TEST_CONTENT).alert).toBe(0);
  });

  it('firstTurnDraw and firstTurnCycles only affect turn 1', () => {
    const state = startCombat(makeSetup({ modifiers: { firstTurnDraw: 2, firstTurnCycles: 1 } }), 1, TEST_CONTENT);
    expect(state.player.hand).toHaveLength(7);
    expect(state.player.cycles).toBe(4);
    const turn2 = endTurn(state);
    expect(turn2.player.hand).toHaveLength(5);
    expect(turn2.player.cycles).toBe(3);
  });

  it('combatStart effects resolve once and can trigger "when attacked"', () => {
    const setup = makeSetup({
      enemies: ['puncher', 'honeypot'],
      modifiers: { combatStart: [{ kind: 'damage', amount: 5, target: 'allEnemies' }] },
    });
    const state = startCombat(setup, 1, TEST_CONTENT);
    expect(enemyAt(state, 0).integrity).toBe(15);
    expect(enemyAt(state, 1).integrity).toBe(25);
    expect(state.alert).toBe(2); // Honeypot logged the hit
  });

  it('combatStart damage can win the fight outright', () => {
    const setup = makeSetup({ modifiers: { combatStart: [{ kind: 'damage', amount: 99, target: 'allEnemies' }] } });
    expect(startCombat(setup, 1, TEST_CONTENT).outcome).toBe('won');
  });

  it('noisyReduction lowers Noisy, never below 0', () => {
    const base = stateWithHand(['loud', 'loud']);
    expect(play(base, 'loud').alert).toBe(4);
    expect(play({ ...base, noisyReduction: 1 }, 'loud').alert).toBe(3);
    expect(play({ ...base, noisyReduction: 9 }, 'loud').alert).toBe(0);
  });
});
