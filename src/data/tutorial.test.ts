import { describe, expect, it } from 'vitest';
import { combatReducer } from '../engine';
import type { CombatState } from '../engine';
import { CONTENT } from './content';
import { currentTip, startTutorial } from './tutorial';

function playCard(state: CombatState, id: string): CombatState {
  const handIndex = state.player.hand.findIndex((c) => c.defId === id);
  if (handIndex === -1) throw new Error(`${id} not in hand`);
  return combatReducer(state, { type: 'PLAY_CARD', handIndex, targetIndex: 0 }, CONTENT);
}

describe('guided first fight', () => {
  it('opens with a 6-card hand holding the scripted cards, against an attacking Firewall', () => {
    const state = startTutorial();
    const hand = state.player.hand.map((c) => c.defId);
    expect(hand).toHaveLength(6);
    expect(hand).toEqual(expect.arrayContaining(['pretexting', 'phishing', 'masquerade']));
    expect(state.enemies[0]?.intentMoveId).toBe('packet-drop');
  });

  it('steps through the tips as the player follows them', () => {
    let state = startTutorial();
    const tip = (selectedCardId: string | null = null) => currentTip({ state, selectedCardId })?.id;
    expect(tip()).toBe('select');
    expect(tip('pretexting')).toBe('target');
    state = playCard(state, 'pretexting');
    expect(tip()).toBe('chain');
    state = playCard(state, 'phishing');
    expect(state.chain.count).toBe(1);
    expect(tip()).toBe('block');
    state = playCard(state, 'masquerade');
    expect(state.chain.count).toBe(2);
    expect(state.player.block).toBe(9); // 5 + 2 per Chain stack, as the tip promises
    expect(tip()).toBe('end-turn');
    state = combatReducer(state, { type: 'END_TURN' }, CONTENT);
    expect(tip()).toBe('finish');
  });
});
