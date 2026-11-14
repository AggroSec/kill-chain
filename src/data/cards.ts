/**
 * Card definitions. Adding a card = adding an entry here.
 *
 * Content safety: names reference ATT&CK techniques for flavor only.
 * Card behavior is pure game effects.
 */
import type { CardDef } from '../engine';

export const CARDS = {
  'brute-force': {
    id: 'brute-force',
    name: 'Brute Force',
    type: 'attack',
    tactic: 'credential-access',
    cost: 1,
    effects: [{ kind: 'damage', amount: 6 }],
  },
  obfuscate: {
    id: 'obfuscate',
    name: 'Obfuscate',
    type: 'skill',
    tactic: 'defense-evasion',
    cost: 1,
    effects: [{ kind: 'block', amount: 5 }],
  },
} satisfies Record<string, CardDef>;

export type CardId = keyof typeof CARDS;
