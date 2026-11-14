/**
 * Enemy definitions. Adding an enemy = adding an entry here.
 * Each move's effects are also what the UI shows as the enemy's intent.
 */
import type { EnemyDef } from '../engine';

export const ENEMIES = {
  /** Heavy blocker that chips at you. Teaches "hit it when its guard is down". */
  firewall: {
    id: 'firewall',
    name: 'Firewall',
    maxIntegrity: 44,
    moves: [
      {
        id: 'deny-all',
        name: 'Deny All',
        effects: [{ kind: 'block', amount: 14 }],
        weight: 2,
        maxInARow: 1,
      },
      {
        id: 'packet-drop',
        name: 'Packet Drop',
        effects: [{ kind: 'attack', damage: 13 }],
        weight: 2,
        maxInARow: 2,
      },
      {
        id: 'stateful-inspection',
        name: 'Stateful Inspection',
        effects: [
          { kind: 'attack', damage: 9 },
          { kind: 'block', amount: 6 },
        ],
        weight: 2,
      },
    ],
  },
} satisfies Record<string, EnemyDef>;

export type EnemyId = keyof typeof ENEMIES;
