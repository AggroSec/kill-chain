/**
 * Boss enemies. The Act 1 boss, the Incident Response Team, is three enemies
 * fought together. Kill order is the puzzle:
 * - Forensics Analyst first protects your Implants and debuffs.
 * - Threat Hunter first stops the damage spike (its multi-hit punishes high Alert).
 * - Incident Commander first stops the Hardened stacks, but it has the most Integrity.
 */
import type { EnemyDef } from '../engine';

export const BOSS_LIST: readonly EnemyDef[] = [
  {
    id: 'forensics-analyst',
    name: 'Forensics Analyst',
    tier: 'boss',
    maxIntegrity: 41,
    description: 'Incident Response Team. Destroys your Implants and cleanses debuffs from the team.',
    moves: [
      {
        id: 'image-disk',
        name: 'Image Disk',
        effects: [
          { kind: 'removeImplants', count: 1 },
          { kind: 'block', amount: 8 },
        ],
        weight: 1,
        maxInARow: 1,
      },
      {
        id: 'memory-analysis',
        name: 'Memory Analysis',
        effects: [{ kind: 'cleanse' }, { kind: 'attack', damage: 5 }],
        weight: 1,
        maxInARow: 1,
      },
      { id: 'evidence-trail', name: 'Evidence Trail', effects: [{ kind: 'attack', damage: 8 }], weight: 2, maxInARow: 2 },
    ],
  },
  {
    id: 'incident-commander',
    name: 'Incident Commander',
    tier: 'boss',
    maxIntegrity: 85,
    description: 'Incident Response Team. Hardens the rest of the team and raises Alert.',
    moves: [
      {
        id: 'coordinate',
        name: 'Coordinate',
        effects: [{ kind: 'buffAllies', status: 'hardened', stacks: 1 }],
        weight: 1,
        maxInARow: 1,
      },
      {
        id: 'declare-incident',
        name: 'Declare Incident',
        effects: [
          { kind: 'raiseAlert', amount: 3 },
          { kind: 'block', amount: 10 },
        ],
        weight: 1,
        maxInARow: 1,
      },
      { id: 'command-strike', name: 'Command Strike', effects: [{ kind: 'attack', damage: 11 }], weight: 2, maxInARow: 2 },
    ],
  },
  {
    id: 'threat-hunter',
    name: 'Threat Hunter',
    tier: 'boss',
    maxIntegrity: 47,
    description: 'Incident Response Team. Multi-hit attacks: the Alert bonus applies to every hit.',
    moves: [
      { id: 'hunt', name: 'Hunt', effects: [{ kind: 'attack', damage: 6 }], weight: 2, maxInARow: 2 },
      { id: 'pursuit', name: 'Pursuit', effects: [{ kind: 'attack', damage: 3, hits: 3 }], weight: 2, maxInARow: 1 },
      {
        id: 'track',
        name: 'Track',
        effects: [
          { kind: 'raiseAlert', amount: 2 },
          { kind: 'block', amount: 6 },
        ],
        weight: 1,
        maxInARow: 1,
      },
    ],
  },
];
