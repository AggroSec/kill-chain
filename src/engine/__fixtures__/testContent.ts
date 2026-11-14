/**
 * Small, fixed content used only by engine tests, so tests don't break when
 * real game data in src/data gets rebalanced.
 */
import type { CombatSetup, CombatState, ContentRegistry } from '../types';

export const TEST_CONTENT: ContentRegistry = {
  cards: {
    strike: { id: 'strike', name: 'Strike', type: 'attack', tactic: 'execution', cost: 1, effects: [{ kind: 'damage', amount: 6 }] },
    guard: { id: 'guard', name: 'Guard', type: 'skill', tactic: 'defense-evasion', cost: 1, effects: [{ kind: 'block', amount: 5 }] },
    nuke: { id: 'nuke', name: 'Nuke', type: 'attack', tactic: 'impact', cost: 3, effects: [{ kind: 'damage', amount: 30 }] },
    free: { id: 'free', name: 'Free', type: 'skill', tactic: 'discovery', cost: 0, effects: [{ kind: 'block', amount: 1 }] },
  },
  enemies: {
    // Always attacks for 10.
    puncher: {
      id: 'puncher',
      name: 'Puncher',
      maxIntegrity: 20,
      moves: [{ id: 'punch', name: 'Punch', effects: [{ kind: 'attack', damage: 10 }], weight: 1 }],
    },
    // Always blocks for 8. Never hurts you.
    wall: {
      id: 'wall',
      name: 'Wall',
      maxIntegrity: 30,
      moves: [{ id: 'brace', name: 'Brace', effects: [{ kind: 'block', amount: 8 }], weight: 1 }],
    },
    // Two moves; "spike" can't be used twice in a row.
    alternator: {
      id: 'alternator',
      name: 'Alternator',
      maxIntegrity: 20,
      moves: [
        { id: 'spike', name: 'Spike', effects: [{ kind: 'attack', damage: 1 }], weight: 100, maxInARow: 1 },
        { id: 'rest', name: 'Rest', effects: [{ kind: 'block', amount: 1 }], weight: 1 },
      ],
    },
  },
};

export function makeSetup(overrides: Partial<CombatSetup> = {}): CombatSetup {
  return {
    deck: ['strike', 'strike', 'strike', 'strike', 'strike', 'guard', 'guard', 'guard', 'guard', 'guard'],
    opsec: 50,
    maxOpsec: 50,
    maxCycles: 3,
    enemies: ['puncher'],
    ...overrides,
  };
}

/** Index of the first card in hand with this defId, or throws. */
export function handIndexOf(state: CombatState, defId: string): number {
  const index = state.player.hand.findIndex((card) => card.defId === defId);
  if (index === -1) throw new Error(`No "${defId}" in hand`);
  return index;
}
