/**
 * Combat rules added for Acts 2-3 and the Insider: enemies that heal allies
 * or debuff the Operator, Alert-gated enemy moves, random-enemy statuses,
 * Trusted Access (Chain start) and extra damage taken.
 */
import { describe, expect, it } from 'vitest';
import { handIndexOf, makeSetup, stateWithHand, TEST_CONTENT } from './__fixtures__/testContent';
import { combatReducer, startCombat } from './combat';
import { enemyHitDamage, operatorHitDamage } from './damage';
import { chooseNextMove } from './intents';
import { Rng } from './rng';
import type { CombatState } from './types';

const content = TEST_CONTENT;
/** The value, or a test failure if it's missing. */
function must<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing test value');
  return value;
}

const endTurn = (state: CombatState) => combatReducer(state, { type: 'END_TURN' }, content);
const play = (state: CombatState, defId: string, targetIndex = 0) =>
  combatReducer(state, { type: 'PLAY_CARD', handIndex: handIndexOf(state, defId), targetIndex }, content);

describe('enemies that heal and debuff', () => {
  it('healAllies restores other living enemies, capped at max, never itself', () => {
    const state = stateWithHand(['strike'], { enemies: ['healer', 'wall'] });
    must(state.enemies[0]).integrity = 10;
    must(state.enemies[1]).integrity = 27;
    const next = endTurn(state);
    expect(next.enemies[0]?.integrity).toBe(10);
    expect(next.enemies[1]?.integrity).toBe(30);
  });

  it('a Throttled Operator deals 25% less damage, rounded down', () => {
    expect(operatorHitDamage(10, 0, 0, {}, { throttled: 1 })).toBe(7);
    const state = endTurn(stateWithHand(['strike'], { enemies: ['throttler'] }));
    expect(state.player.statuses.throttled).toBe(1);
    // A strike played next turn deals 6 * 0.75 = 4.
    state.player.hand.push({ uid: 999, defId: 'strike' });
    const hit = play(state, 'strike');
    expect(hit.enemies[0]?.integrity).toBe(30 - 4);
  });

  it('Operator Throttled wears off at the end of the Operator turn', () => {
    const state = endTurn(stateWithHand(['strike'], { enemies: ['throttler'] }));
    const after = endTurn(state);
    // Wore off, then the throttler applied a fresh stack.
    expect(after.player.statuses.throttled).toBe(1);
  });

  it('an Exposed Operator takes 50% more damage from hits after it lands', () => {
    expect(enemyHitDamage(10, {}, 0, { exposed: 1 })).toBe(15);
    const state = endTurn(stateWithHand(['strike'], { enemies: ['exposer'] }));
    expect(state.player.opsec).toBe(50 - 15);
  });
});

describe('Alert-gated enemy moves', () => {
  const def = must(content.enemies.tripwire);
  const fresh = () => ({ ...must(startCombat(makeSetup({ enemies: ['tripwire'] }), 1, content).enemies[0]) });

  it('only picks moves whose Alert range matches', () => {
    const rng = new Rng(3);
    for (let i = 0; i < 50; i++) expect(chooseNextMove(fresh(), def, rng, 0)).toBe('calm');
    for (let i = 0; i < 50; i++) expect(chooseNextMove(fresh(), def, rng, 12)).toBe('trip');
  });

  it('rolls the next intent with the Alert at the end of the enemy turn', () => {
    const state = stateWithHand(['strike'], { enemies: ['tripwire'] });
    state.alert = 12;
    expect(endTurn(state).enemies[0]?.intentMoveId).toBe('trip');
  });
});

describe('class passive combat hooks', () => {
  it('randomEnemy statuses land on exactly one living enemy', () => {
    const state = startCombat(
      makeSetup({
        enemies: ['wall', 'wall', 'wall'],
        modifiers: { combatStart: [{ kind: 'applyStatus', status: 'stalled', stacks: 1, target: 'randomEnemy' }] },
      }),
      7,
      content,
    );
    expect(state.enemies.filter((e) => e.statuses.stalled === 1)).toHaveLength(1);
  });

  it('Trusted Access: the first card of a turn after the start tactic builds Chain', () => {
    const state = stateWithHand(['strike', 'poke']);
    state.chainStartIndex = 2; // initial-access
    state.chain = { count: 0, lastTacticIndex: 2 };
    // strike is execution (step 4): extends from Initial Access.
    expect(play(state, 'strike').chain.count).toBe(1);
    // poke is initial-access (step 3): same step, no Chain.
    expect(play(state, 'poke').chain.count).toBe(0);
  });

  it('Trusted Access resets to the start tactic every turn', () => {
    const state = startCombat(makeSetup({ modifiers: { chainStartTactic: 'initial-access' } }), 1, content);
    expect(state.chain).toEqual({ count: 0, lastTacticIndex: 2 });
    expect(endTurn(state).chain).toEqual({ count: 0, lastTacticIndex: 2 });
  });

  it('damageTakenPerHit adds to every enemy hit', () => {
    const state = startCombat(makeSetup({ modifiers: { damageTakenPerHit: 1 } }), 1, content);
    expect(endTurn(state).player.opsec).toBe(50 - 11);
  });
});
