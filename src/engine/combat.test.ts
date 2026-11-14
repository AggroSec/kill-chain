import { describe, expect, it } from 'vitest';
import { handIndexOf, makeSetup, TEST_CONTENT } from './__fixtures__/testContent';
import { combatReducer, startCombat, whyCantPlay } from './combat';
import { CARDS_DRAWN_PER_TURN, TURN_CAP } from './rules';
import type { CombatAction, CombatState } from './types';

const content = TEST_CONTENT;

function act(state: CombatState, action: CombatAction): CombatState {
  return combatReducer(state, action, content);
}

const END_TURN: CombatAction = { type: 'END_TURN' };

function play(state: CombatState, defId: string, targetIndex = 0): CombatState {
  return act(state, { type: 'PLAY_CARD', handIndex: handIndexOf(state, defId), targetIndex });
}

describe('startCombat', () => {
  it('draws an opening hand and fills Cycles', () => {
    const state = startCombat(makeSetup(), 1, content);
    expect(state.turn).toBe(1);
    expect(state.outcome).toBe('ongoing');
    expect(state.player.hand).toHaveLength(CARDS_DRAWN_PER_TURN);
    expect(state.player.drawPile).toHaveLength(10 - CARDS_DRAWN_PER_TURN);
    expect(state.player.cycles).toBe(3);
  });

  it('gives every enemy full Integrity and a visible intent', () => {
    const state = startCombat(makeSetup({ enemies: ['puncher', 'wall'] }), 1, content);
    expect(state.enemies.map((e) => e.integrity)).toEqual([20, 30]);
    expect(state.enemies.map((e) => e.intentMoveId)).toEqual(['punch', 'brace']);
  });

  it('assigns unique uids to card copies', () => {
    const state = startCombat(makeSetup(), 1, content);
    const uids = [...state.player.hand, ...state.player.drawPile].map((c) => c.uid);
    expect(new Set(uids).size).toBe(10);
  });

  it('throws on unknown card or enemy ids', () => {
    expect(() => startCombat(makeSetup({ deck: ['nope'] }), 1, content)).toThrow(/nope/);
    expect(() => startCombat(makeSetup({ enemies: ['ghost'] }), 1, content)).toThrow(/ghost/);
  });
});

describe('playing cards', () => {
  it('spends Cycles, applies damage and moves the card to discard', () => {
    const start = startCombat(makeSetup({ deck: ['strike', 'strike', 'strike', 'strike', 'strike'] }), 1, content);
    const next = play(start, 'strike');
    expect(next.player.cycles).toBe(2);
    expect(next.enemies[0]?.integrity).toBe(14);
    expect(next.player.hand).toHaveLength(4);
    expect(next.player.discardPile).toHaveLength(1);
  });

  it('does not mutate the previous state', () => {
    const start = startCombat(makeSetup(), 1, content);
    const snapshot = structuredClone(start);
    act(start, { type: 'PLAY_CARD', handIndex: 0, targetIndex: 0 });
    expect(start).toEqual(snapshot);
  });

  it('block cards add to Operator block', () => {
    const start = startCombat(makeSetup({ deck: ['guard', 'guard', 'guard', 'guard', 'guard'] }), 1, content);
    const next = play(play(start, 'guard'), 'guard');
    expect(next.player.block).toBe(10);
  });

  it('enemy block absorbs damage first', () => {
    // Wall blocks 8 on its turn; that block protects it during our next turn.
    let state = startCombat(makeSetup({ deck: Array(10).fill('strike'), enemies: ['wall'] }), 1, content);
    state = act(state, END_TURN);
    expect(state.enemies[0]?.block).toBe(8);
    state = play(state, 'strike');
    expect(state.enemies[0]?.block).toBe(2);
    expect(state.enemies[0]?.integrity).toBe(30);
    state = play(state, 'strike');
    expect(state.enemies[0]?.block).toBe(0);
    expect(state.enemies[0]?.integrity).toBe(26);
  });

  it('refuses cards you cannot afford (state unchanged)', () => {
    // Two Walls (30 Integrity each) so one Nuke doesn't end the fight.
    const start = startCombat(makeSetup({ deck: ['nuke', 'nuke', 'nuke', 'nuke', 'nuke'], enemies: ['wall', 'wall'] }), 1, content);
    const afterOne = play(start, 'nuke'); // costs all 3 Cycles
    expect(afterOne.player.cycles).toBe(0);
    expect(whyCantPlay(afterOne, 0, 0, content)).toBe('notEnoughCycles');
    expect(play(afterOne, 'nuke')).toBe(afterOne);
  });

  it('zero-cost cards can be played with zero Cycles', () => {
    const start = startCombat(makeSetup({ deck: ['nuke', 'free', 'free', 'free', 'free'], enemies: ['wall', 'wall'] }), 1, content);
    const zero = play(start, 'nuke');
    expect(zero.player.cycles).toBe(0);
    expect(play(zero, 'free').player.block).toBe(1);
  });

  it('refuses bad hand indexes and dead or missing targets', () => {
    const start = startCombat(makeSetup({ deck: Array(5).fill('strike') }), 1, content);
    expect(act(start, { type: 'PLAY_CARD', handIndex: 99, targetIndex: 0 })).toBe(start);
    expect(act(start, { type: 'PLAY_CARD', handIndex: 0, targetIndex: 5 })).toBe(start);
    expect(whyCantPlay(start, 0, 5, content)).toBe('invalidTarget');
  });

  it('skills that need no target ignore the target index', () => {
    const start = startCombat(makeSetup({ deck: Array(5).fill('guard') }), 1, content);
    const next = act(start, { type: 'PLAY_CARD', handIndex: 0, targetIndex: 99 });
    expect(next.player.block).toBe(5);
  });
});

describe('winning and losing', () => {
  it('wins when every enemy hits 0 Integrity, and then ignores actions', () => {
    let state = startCombat(makeSetup({ deck: Array(10).fill('strike') }), 1, content);
    state = play(play(play(state, 'strike'), 'strike'), 'strike');
    expect(state.enemies[0]?.integrity).toBe(2);
    state = act(state, END_TURN);
    state = play(state, 'strike');
    expect(state.enemies[0]?.integrity).toBe(0);
    expect(state.outcome).toBe('won');
    expect(act(state, END_TURN)).toBe(state);
    expect(whyCantPlay(state, 0, 0, content)).toBe('combatOver');
  });

  it('loses when OpSec hits 0', () => {
    let state = startCombat(makeSetup({ opsec: 25, deck: Array(10).fill('free') }), 1, content);
    state = act(state, END_TURN); // 25 -> 15
    state = act(state, END_TURN); // 15 -> 5
    expect(state.player.opsec).toBe(5);
    state = act(state, END_TURN); // 5 -> 0
    expect(state.player.opsec).toBe(0);
    expect(state.outcome).toBe('lost');
  });

  it('ends in turnCap when nobody can win', () => {
    // Guard-only deck vs a Wall that only blocks: nobody can ever take damage.
    let state = startCombat(makeSetup({ deck: Array(10).fill('guard'), enemies: ['wall'] }), 1, content);
    for (let i = 0; i < TURN_CAP + 10 && state.outcome === 'ongoing'; i++) {
      state = act(state, END_TURN);
    }
    expect(state.outcome).toBe('turnCap');
    expect(state.turn).toBe(TURN_CAP);
  });
});

describe('turn structure', () => {
  it('end turn discards the hand, enemy acts, and a new hand is drawn', () => {
    let state = startCombat(makeSetup(), 1, content);
    state = act(state, END_TURN);
    expect(state.turn).toBe(2);
    expect(state.player.opsec).toBe(40); // puncher hits for 10
    expect(state.player.hand).toHaveLength(CARDS_DRAWN_PER_TURN);
    expect(state.player.cycles).toBe(3);
    // 10 cards total: 5 in hand, 5 discarded from turn 1, 0 left to draw.
    expect(state.player.discardPile).toHaveLength(5);
    expect(state.player.drawPile).toHaveLength(0);
  });

  it('Operator block absorbs the enemy attack, then expires at the start of their next turn', () => {
    let state = startCombat(makeSetup({ deck: Array(10).fill('guard') }), 1, content);
    state = play(play(state, 'guard'), 'guard'); // 10 block
    state = act(state, END_TURN); // puncher hits for 10
    expect(state.player.opsec).toBe(50);
    expect(state.player.block).toBe(0);
  });

  it('leftover block does not carry over', () => {
    let state = startCombat(makeSetup({ deck: Array(10).fill('guard'), enemies: ['wall'] }), 1, content);
    state = play(play(play(state, 'guard'), 'guard'), 'guard'); // 15 block, wall never attacks
    state = act(state, END_TURN);
    expect(state.player.block).toBe(0);
  });

  it('enemy block resets when the enemy acts again', () => {
    let state = startCombat(makeSetup({ deck: Array(10).fill('guard'), enemies: ['wall'] }), 1, content);
    state = act(state, END_TURN);
    state = act(state, END_TURN);
    expect(state.enemies[0]?.block).toBe(8); // not 16
  });

  it('cards are conserved across many turns', () => {
    let state = startCombat(makeSetup({ enemies: ['wall'] }), 3, content);
    for (let i = 0; i < 20; i++) {
      if (state.player.hand.length > 0) state = act(state, { type: 'PLAY_CARD', handIndex: 0, targetIndex: 0 });
      state = act(state, END_TURN);
      const { drawPile, hand, discardPile } = state.player;
      expect(drawPile.length + hand.length + discardPile.length).toBe(10);
    }
  });
});

describe('determinism', () => {
  function playScript(seed: number): CombatState {
    let state = startCombat(makeSetup({ enemies: ['alternator', 'wall'] }), seed, content);
    for (let i = 0; i < 15 && state.outcome === 'ongoing'; i++) {
      state = act(state, { type: 'PLAY_CARD', handIndex: 0, targetIndex: 1 });
      state = act(state, END_TURN);
    }
    return state;
  }

  it('same seed and same actions give the exact same state', () => {
    expect(playScript(1234)).toEqual(playScript(1234));
  });

  it('different seeds give different shuffles', () => {
    const a = startCombat(makeSetup(), 1, content).player.drawPile.map((c) => c.uid);
    const b = startCombat(makeSetup(), 2, content).player.drawPile.map((c) => c.uid);
    expect(a).not.toEqual(b);
  });
});
