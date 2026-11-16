import { describe, expect, it } from 'vitest';
import { endTurn, play, enemyAt, stateWithHand, TEST_CONTENT } from './__fixtures__/testContent';
import { incomingDamage, previewIntent } from './preview';

describe('debuffs on enemies', () => {
  it('Throttled cuts attack damage by 25% and wears off after the enemy acts', () => {
    let state = play(stateWithHand(['throttle']), 'throttle');
    state = endTurn(state); // puncher: floor(10 x 0.75) = 7
    expect(state.player.opsec).toBe(43);
    expect(state.enemies[0]?.statuses).toEqual({});
    state = endTurn(state); // full damage again
    expect(state.player.opsec).toBe(33);
  });

  it('Stalled skips one action per stack', () => {
    let state = play(stateWithHand(['stall']), 'stall');
    state = endTurn(state);
    expect(state.player.opsec).toBe(50);
    expect(state.enemies[0]?.statuses).toEqual({});
    state = endTurn(state);
    expect(state.player.opsec).toBe(40);
  });

  it('cleanse removes debuffs from every enemy but leaves buffs', () => {
    let state = stateWithHand(['recon'], { enemies: ['cleanser', 'wall'] });
    state = play(state, 'recon', 1);
    enemyAt(state, 1).statuses.hardened = 2;
    state = endTurn(state);
    expect(state.enemies[1]?.statuses).toEqual({ hardened: 2 });
  });
});

describe('enemy buffs', () => {
  it('Hardened adds damage to every hit', () => {
    let state = endTurn(stateWithHand([], { enemies: ['grower'] })); // 2 dmg, then Hardened 1
    expect(state.player.opsec).toBe(48);
    state = endTurn(state); // 2 + 1
    expect(state.player.opsec).toBe(45);
  });
});

describe('Implants', () => {
  it('fire at the start of each Operator turn', () => {
    let state = play(stateWithHand(['beacon'], { enemies: ['wall', 'wall'] }), 'beacon');
    state = endTurn(state); // walls block 8 on their turn, then beacon pings 1 into the block
    expect(state.enemies.map((e) => e.block)).toEqual([7, 7]);
  });

  it('can finish the last enemy at the start of a turn', () => {
    let state = play(stateWithHand(['beacon'], { enemies: ['puncher'] }), 'beacon');
    enemyAt(state, 0).integrity = 1;
    state = endTurn(state);
    expect(state.outcome).toBe('won');
  });

  it('removeImplants destroys the oldest Implant only', () => {
    let state = stateWithHand([], { enemies: ['patcher'] });
    state.player.statuses = { beacon: 1, 'second-implant': 2 };
    state = endTurn(state);
    expect(state.player.statuses).toEqual({ 'second-implant': 2 });
  });
});

describe('"when attacked" triggers (Honeypot)', () => {
  it('fire once per card, not once per hit', () => {
    const state = play(stateWithHand(['twin'], { enemies: ['honeypot'] }), 'twin');
    expect(state.alert).toBe(2);
  });

  it('fire for all-enemy damage too', () => {
    const state = play(stateWithHand(['sweep'], { enemies: ['honeypot', 'wall'] }), 'sweep');
    expect(state.alert).toBe(2);
  });

  it('do not fire when a different enemy is hit', () => {
    const state = play(stateWithHand(['strike'], { enemies: ['honeypot', 'wall'] }), 'strike', 1);
    expect(state.alert).toBe(0);
  });
});

describe('intent preview', () => {
  it('shows real attack numbers after Alert and Throttled', () => {
    let state = { ...stateWithHand(['throttle']), alert: 10 };
    state = play(state, 'throttle');
    const preview = previewIntent(state, 0, TEST_CONTENT);
    expect(preview?.effects).toEqual([{ kind: 'attack', damage: 9 }]); // floor((10 + 3) x 0.75)
    expect(incomingDamage(state, TEST_CONTENT)).toBe(9);
  });

  it('Stalled enemies deal no incoming damage', () => {
    const state = play(stateWithHand(['stall']), 'stall');
    expect(previewIntent(state, 0, TEST_CONTENT)?.stalled).toBe(true);
    expect(incomingDamage(state, TEST_CONTENT)).toBe(0);
  });
});
