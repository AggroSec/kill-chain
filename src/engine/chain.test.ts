import { describe, expect, it } from 'vitest';
import { play, endTurn, stateWithHand } from './__fixtures__/testContent';
import { advanceChain, emptyChain, extendsChain } from './chain';

describe('advanceChain', () => {
  it('the first card of a turn starts a chain at 0', () => {
    expect(advanceChain(emptyChain(), 'execution')).toEqual({ count: 0, lastTacticIndex: 3 });
    expect(extendsChain(emptyChain(), 'impact')).toBe(false);
  });

  it('each later tactic adds a stack', () => {
    let chain = advanceChain(emptyChain(), 'reconnaissance');
    chain = advanceChain(chain, 'initial-access');
    chain = advanceChain(chain, 'impact');
    expect(chain.count).toBe(2);
  });

  it('skipping tactics still counts as in order', () => {
    const chain = advanceChain(advanceChain(emptyChain(), 'reconnaissance'), 'exfiltration');
    expect(chain.count).toBe(1);
  });

  it('the same tactic twice breaks the chain', () => {
    let chain = advanceChain(emptyChain(), 'reconnaissance');
    chain = advanceChain(chain, 'execution');
    chain = advanceChain(chain, 'execution');
    expect(chain).toEqual({ count: 0, lastTacticIndex: 3 });
  });

  it('an earlier tactic breaks the chain and starts a new one from there', () => {
    let chain = advanceChain(emptyChain(), 'execution');
    chain = advanceChain(chain, 'impact');
    chain = advanceChain(chain, 'initial-access');
    expect(chain.count).toBe(0);
    chain = advanceChain(chain, 'execution');
    expect(chain.count).toBe(1);
  });
});

describe('Chain in combat', () => {
  it('boosts damage, including on the card that extends it', () => {
    // wall: 30 Integrity, no block at the start.
    let state = stateWithHand(['recon', 'poke', 'finisher'], { enemies: ['wall'] });
    state = play(state, 'recon'); // Chain 0
    state = play(state, 'poke'); // Chain 1: 1 + 1x2 = 3
    expect(state.chain.count).toBe(1);
    expect(state.enemies[0]?.integrity).toBe(27);
    state = play(state, 'finisher'); // Chain 2: 2 + 2x(2 + 3) = 12
    expect(state.chain.count).toBe(2);
    expect(state.enemies[0]?.integrity).toBe(15);
  });

  it('resets at the start of the next turn', () => {
    let state = stateWithHand(['recon', 'poke'], { enemies: ['wall'] });
    state = play(play(state, 'recon'), 'poke');
    expect(state.chain.count).toBe(1);
    state = endTurn(state);
    expect(state.chain).toEqual({ count: 0, lastTacticIndex: null });
  });
});
