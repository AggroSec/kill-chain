/**
 * Social Engineer cards. Identity: weaken and Stall enemy intents, keep Alert
 * low, and get bonuses while Quiet.
 *
 * Content safety: names reference ATT&CK techniques for flavor only.
 */
import type { CardDef } from '../../engine';

const owner = 'social-engineer';

export const SOCIAL_ENGINEER_CARDS: readonly CardDef[] = [
  // --- Starter ---
  {
    id: 'phishing',
    name: 'Phishing',
    owner,
    rarity: 'starter',
    type: 'attack',
    tactic: 'initial-access',
    cost: 1,
    effects: [{ kind: 'damage', amount: 6 }],
  },
  {
    id: 'masquerade',
    name: 'Masquerade',
    owner,
    rarity: 'starter',
    type: 'skill',
    tactic: 'defense-evasion',
    cost: 1,
    effects: [{ kind: 'block', amount: 5 }],
  },
  {
    id: 'pretexting',
    name: 'Pretexting',
    owner,
    rarity: 'starter',
    type: 'skill',
    tactic: 'reconnaissance',
    cost: 1,
    effects: [
      { kind: 'applyStatus', status: 'throttled', stacks: 2, target: 'target' },
      { kind: 'alert', amount: -1 },
    ],
  },
  {
    id: 'impersonation',
    name: 'Impersonation',
    owner,
    rarity: 'starter',
    type: 'skill',
    tactic: 'defense-evasion',
    cost: 1,
    effects: [
      { kind: 'block', amount: 4 },
      { kind: 'alert', amount: -2 },
    ],
  },

  // --- Pool ---
  {
    id: 'spearphishing',
    name: 'Spearphishing',
    owner,
    rarity: 'public',
    type: 'attack',
    tactic: 'initial-access',
    cost: 1,
    effects: [
      { kind: 'damage', amount: 9 },
      { kind: 'ifAlert', atMost: 'quiet', then: [{ kind: 'draw', count: 1 }] },
    ],
  },
  {
    id: 'phishing-for-info',
    name: 'Phishing for Info',
    owner,
    rarity: 'public',
    type: 'skill',
    tactic: 'reconnaissance',
    cost: 0,
    effects: [
      { kind: 'applyStatus', status: 'throttled', stacks: 1, target: 'target' },
      { kind: 'alert', amount: -1 },
    ],
  },
  {
    id: 'drive-by',
    name: 'Drive-by Compromise',
    owner,
    rarity: 'public',
    type: 'attack',
    tactic: 'initial-access',
    cost: 2,
    effects: [{ kind: 'damage', amount: 7, target: 'allEnemies' }],
    keywords: { noisy: 1 },
  },
  {
    id: 'help-desk-pretext',
    name: 'Help Desk Pretext',
    owner,
    rarity: 'private',
    type: 'skill',
    tactic: 'initial-access',
    cost: 2,
    effects: [{ kind: 'applyStatus', status: 'stalled', stacks: 1, target: 'target' }],
    keywords: { burner: true },
  },
  {
    id: 'valid-accounts',
    name: 'Valid Accounts',
    owner,
    rarity: 'private',
    type: 'attack',
    tactic: 'privilege-escalation',
    cost: 1,
    effects: [{ kind: 'damage', amount: 5, bonusPerChain: 3 }],
  },
  {
    id: 'long-con',
    name: 'Long Con',
    owner,
    rarity: 'private',
    type: 'skill',
    tactic: 'defense-evasion',
    cost: 1,
    effects: [
      { kind: 'block', amount: 6 },
      { kind: 'ifAlert', atMost: 'quiet', then: [{ kind: 'block', amount: 3 }] },
    ],
    keywords: { stash: true },
  },
  {
    id: 'insider-contact',
    name: 'Insider Contact',
    owner,
    rarity: 'private',
    type: 'implant',
    tactic: 'persistence',
    cost: 1,
    effects: [{ kind: 'applyStatus', status: 'insider-contact', stacks: 1, target: 'self' }],
  },
  {
    id: 'living-off-the-land',
    name: 'Living off the Land',
    owner,
    rarity: 'zero-day',
    type: 'skill',
    tactic: 'defense-evasion',
    cost: 1,
    effects: [
      {
        kind: 'ifAlert',
        atMost: 'quiet',
        then: [
          { kind: 'gainCycles', amount: 2 },
          { kind: 'draw', count: 2 },
        ],
      },
      { kind: 'ifAlert', atLeast: 'noisy', then: [{ kind: 'alert', amount: -4 }] },
    ],
    // Burner: without it, a trimmed Arsenal could replay this forever while Quiet.
    keywords: { burner: true },
  },
];
