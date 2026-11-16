/**
 * Enemy definitions. Adding an enemy = adding an entry here.
 * Each move's effects are also what the UI shows as the enemy's intent.
 * Tip: list attacks before raiseAlert in a move, so the intent preview
 * (which uses the current Alert) matches what actually happens.
 */
import type { EnemyDef } from '../engine';

export const ENEMY_LIST: readonly EnemyDef[] = [
  {
    id: 'firewall',
    name: 'Firewall',
    tier: 'normal',
    maxIntegrity: 40,
    description: 'Heavy blocker. Hit it when its guard is down.',
    moves: [
      { id: 'deny-all', name: 'Deny All', effects: [{ kind: 'block', amount: 14 }], weight: 2, maxInARow: 1 },
      { id: 'packet-drop', name: 'Packet Drop', effects: [{ kind: 'attack', damage: 12 }], weight: 2, maxInARow: 2 },
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
  {
    id: 'edr',
    name: 'EDR',
    tier: 'normal',
    maxIntegrity: 38,
    description: 'Removes every debuff from every enemy. Learns as it goes.',
    moves: [
      {
        id: 'remediate',
        name: 'Remediate',
        effects: [{ kind: 'cleanse' }, { kind: 'block', amount: 8 }],
        weight: 2,
        maxInARow: 1,
      },
      { id: 'kill-process', name: 'Kill Process', effects: [{ kind: 'attack', damage: 11 }], weight: 2, maxInARow: 2 },
      {
        id: 'behavioral-analysis',
        name: 'Behavioral Analysis',
        effects: [
          { kind: 'attack', damage: 6 },
          { kind: 'buffSelf', status: 'hardened', stacks: 1 },
        ],
        weight: 1,
      },
    ],
  },
  {
    id: 'soc-analyst',
    name: 'SOC Analyst',
    tier: 'normal',
    maxIntegrity: 32,
    description: 'Raises Alert. Leave it alone too long and everything hits harder.',
    moves: [
      {
        id: 'triage',
        name: 'Triage',
        effects: [
          { kind: 'attack', damage: 5 },
          { kind: 'raiseAlert', amount: 2 },
        ],
        weight: 2,
      },
      { id: 'escalate', name: 'Escalate Ticket', effects: [{ kind: 'attack', damage: 9 }], weight: 2, maxInARow: 2 },
      {
        id: 'threat-hunt',
        name: 'Threat Hunt',
        effects: [
          { kind: 'block', amount: 6 },
          { kind: 'raiseAlert', amount: 3 },
        ],
        weight: 1,
        maxInARow: 1,
      },
    ],
  },
  {
    id: 'honeypot',
    name: 'Honeypot',
    tier: 'normal',
    maxIntegrity: 26,
    description: 'A trap. Whenever a card damages it, Alert +2.',
    onAttacked: [{ kind: 'raiseAlert', amount: 2 }],
    moves: [
      { id: 'lure', name: 'Lure', effects: [{ kind: 'block', amount: 6 }], weight: 1 },
      { id: 'trace', name: 'Trace', effects: [{ kind: 'attack', damage: 7 }], weight: 2, maxInARow: 2 },
      {
        id: 'log-everything',
        name: 'Log Everything',
        effects: [
          { kind: 'block', amount: 3 },
          { kind: 'raiseAlert', amount: 2 },
        ],
        weight: 1,
        maxInARow: 1,
      },
    ],
  },
  {
    id: 'patch-cycle',
    name: 'Patch Cycle',
    tier: 'elite',
    maxIntegrity: 80,
    description: 'Hardened Target. Destroys your Implants and grows stronger every update.',
    moves: [
      {
        id: 'patch-tuesday',
        name: 'Patch Tuesday',
        effects: [
          { kind: 'removeImplants', count: 1 },
          { kind: 'block', amount: 12 },
        ],
        weight: 1,
        maxInARow: 1,
      },
      { id: 'forced-reboot', name: 'Forced Reboot', effects: [{ kind: 'attack', damage: 16 }], weight: 2, maxInARow: 1 },
      {
        id: 'rolling-update',
        name: 'Rolling Update',
        effects: [
          { kind: 'attack', damage: 8 },
          { kind: 'buffSelf', status: 'hardened', stacks: 2 },
        ],
        weight: 2,
      },
    ],
  },
];
