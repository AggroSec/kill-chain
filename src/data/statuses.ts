/**
 * Status definitions: buffs, debuffs and Implants.
 * The first five ids have rules built into the engine (see CORE_STATUS in
 * src/engine/statuses.ts). Implants are fully data-driven via onTurnStart.
 */
import type { StatusDef } from '../engine';

export const STATUS_LIST: readonly StatusDef[] = [
  {
    id: 'vuln',
    name: 'Vuln',
    description: 'Exploit cards consume all Vuln on this enemy for bonus damage.',
    kind: 'debuff',
    decay: 'never',
  },
  {
    id: 'exposed',
    name: 'Exposed',
    description: 'Takes 50% more damage from attacks. Lasts a number of turns.',
    kind: 'debuff',
    decay: 'endOfOwnerTurn',
  },
  {
    id: 'throttled',
    name: 'Throttled',
    description: 'Deals 25% less attack damage. Lasts a number of turns.',
    kind: 'debuff',
    decay: 'endOfOwnerTurn',
  },
  {
    id: 'stalled',
    name: 'Stalled',
    description: 'Skips its next action. Each stack skips one action.',
    kind: 'debuff',
    decay: 'never',
  },
  {
    id: 'hardened',
    name: 'Hardened',
    description: 'Each stack adds 1 damage to every attack hit.',
    kind: 'buff',
    decay: 'never',
  },

  // --- Implants (Operator persistence effects) ---
  {
    id: 'insider-contact',
    name: 'Insider Contact',
    description: 'Implant. At the start of your turn, lower Alert by 1 and gain 3 Block.',
    kind: 'buff',
    decay: 'never',
    implant: true,
    onTurnStart: [
      { kind: 'alert', amount: -1 },
      { kind: 'block', amount: 3 },
    ],
  },
  {
    id: 'keylogger',
    name: 'Keylogger',
    description: 'Implant. At the start of your turn, apply 1 Vuln to every enemy.',
    kind: 'buff',
    decay: 'never',
    implant: true,
    onTurnStart: [{ kind: 'applyStatus', status: 'vuln', stacks: 1, target: 'allEnemies' }],
  },
];
