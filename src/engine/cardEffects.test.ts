import { describe, expect, it } from 'vitest';
import { endTurn, play, enemyAt, stateWithHand, TEST_CONTENT } from './__fixtures__/testContent';
import { cardNeedsTarget, getCardDef } from './combat';

describe('damage effects', () => {
  it('multi-hit damage hits several times, each through block', () => {
    let state = stateWithHand(['twin'], { enemies: ['wall'] });
    enemyAt(state, 0).block = 4;
    state = play(state, 'twin'); // 3 into 4 block, then 3 into 1 block => 2 through
    expect(state.enemies[0]?.block).toBe(0);
    expect(state.enemies[0]?.integrity).toBe(28);
  });

  it('all-enemy damage hits every living enemy', () => {
    const state = play(stateWithHand(['sweep'], { enemies: ['wall', 'puncher'] }), 'sweep');
    expect(state.enemies.map((e) => e.integrity)).toEqual([26, 16]);
  });

  it('Exposed enemies take 50% more attack damage (rounded down)', () => {
    let state = stateWithHand(['expose', 'strike'], { enemies: ['wall'] });
    state = play(state, 'expose');
    state = play(state, 'strike'); // execution after discovery: Chain breaks to 0. 6 x 1.5 = 9
    expect(state.enemies[0]?.integrity).toBe(21);
  });
});

describe('Exploit', () => {
  it('consumes all Vuln for damage per stack', () => {
    let state = stateWithHand(['recon', 'exploit'], { enemies: ['wall'] });
    state = play(state, 'recon'); // 2 Vuln
    expect(state.enemies[0]?.statuses).toEqual({ vuln: 2 });
    state = play(state, 'exploit'); // 2 x 5 = 10, +2 for Chain 1 = 12
    expect(state.enemies[0]?.statuses).toEqual({});
    expect(state.enemies[0]?.integrity).toBe(18);
  });

  it('does nothing without Vuln (and does not count as an attack)', () => {
    const state = play(stateWithHand(['exploit'], { enemies: ['honeypot'] }), 'exploit');
    expect(state.enemies[0]?.integrity).toBe(30);
    expect(state.alert).toBe(0); // the Honeypot was never actually hit
  });
});

describe('utility effects', () => {
  it('draw adds cards to hand', () => {
    const state = play(stateWithHand(['dig']), 'dig');
    expect(state.player.hand).toHaveLength(2);
  });

  it('gainCycles adds Cycles this turn', () => {
    const state = play(stateWithHand(['overclock']), 'overclock');
    expect(state.player.cycles).toBe(5);
  });
});

describe('keywords and card types', () => {
  it('Burner cards are spent for the rest of the fight', () => {
    const state = play(stateWithHand(['burner']), 'burner');
    expect(state.player.spentPile.map((c) => c.defId)).toEqual(['burner']);
    expect(state.player.discardPile).toHaveLength(0);
  });

  it('Implant cards are spent and leave a status on the Operator', () => {
    const state = play(stateWithHand(['beacon'], { enemies: ['wall'] }), 'beacon');
    expect(state.player.spentPile.map((c) => c.defId)).toEqual(['beacon']);
    expect(state.player.statuses).toEqual({ beacon: 1 });
  });

  it('Stash cards stay in hand at end of turn', () => {
    const state = endTurn(stateWithHand(['stashed', 'guard'], { enemies: ['wall'] }));
    const hand = state.player.hand.map((c) => c.defId);
    expect(hand[0]).toBe('stashed');
    expect(hand).toHaveLength(6); // kept 1 + drew 5
    expect(state.player.discardPile.map((c) => c.defId)).toEqual(['guard']);
  });

  it('cardNeedsTarget looks at every effect, including nested ones', () => {
    const needs = (id: string) => cardNeedsTarget(getCardDef(TEST_CONTENT, id));
    expect(needs('strike')).toBe(true);
    expect(needs('recon')).toBe(true);
    expect(needs('exploit')).toBe(true);
    expect(needs('guard')).toBe(false);
    expect(needs('sweep')).toBe(false);
    expect(needs('beacon')).toBe(false);
  });
});
