import { describe, expect, it } from 'vitest';
import { play, stateWithHand, TEST_CONTENT } from './__fixtures__/testContent';
import { cardAtChain, chainIfPlayed } from './preview';
import type { CardDef } from './types';

const def = (id: string): CardDef => {
  const card = TEST_CONTENT.cards[id];
  if (card === undefined) throw new Error(id);
  return card;
};

describe('chainIfPlayed', () => {
  it('is 0 for the first card and counts up for cards that extend the Chain', () => {
    let state = stateWithHand(['recon', 'poke', 'finisher'], { enemies: ['wall'] });
    expect(chainIfPlayed(state, def('poke'))).toBe(0);
    state = play(state, 'recon');
    expect(chainIfPlayed(state, def('poke'))).toBe(1);
    state = play(state, 'poke');
    expect(chainIfPlayed(state, def('finisher'))).toBe(2);
    // Same tactic as the last card breaks the Chain.
    expect(chainIfPlayed(state, def('poke'))).toBe(0);
  });
});

describe('cardAtChain', () => {
  it('adds the Chain bonus to damage (with bonusPerChain) and block, matching what combat does', () => {
    expect(cardAtChain(def('finisher'), 2).effects).toEqual([{ kind: 'damage', amount: 12, bonusPerChain: 3 }]);
    expect(cardAtChain(def('guard'), 2).effects).toEqual([{ kind: 'block', amount: 9 }]);
    expect(cardAtChain(def('quiet-bonus'), 1).effects).toEqual([{ kind: 'ifAlert', atMost: 'quiet', then: [{ kind: 'block', amount: 12 }] }]);
  });

  it('returns the same card at Chain 0 and leaves other effects alone', () => {
    expect(cardAtChain(def('guard'), 0)).toBe(def('guard'));
    expect(cardAtChain(def('recon'), 3).effects).toEqual(def('recon').effects);
  });

  it('matches the real result of playing the card', () => {
    let state = stateWithHand(['recon', 'poke', 'finisher'], { enemies: ['wall'] });
    state = play(play(state, 'recon'), 'poke');
    const shown = cardAtChain(def('finisher'), chainIfPlayed(state, def('finisher'))).effects[0];
    const before = state.enemies[0]?.integrity ?? 0;
    state = play(state, 'finisher');
    expect(shown?.kind === 'damage' && shown.amount).toBe(before - (state.enemies[0]?.integrity ?? 0));
  });
});
