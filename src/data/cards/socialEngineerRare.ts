/**
 * Social Engineer cards, part 2: Private and 0-day.
 * See socialEngineer.ts for the class identity and starter/Public cards.
 *
 * Content safety: names reference ATT&CK techniques for flavor only.
 */
import type { CardDef } from '../../engine';

const owner = 'social-engineer';

export const SOCIAL_ENGINEER_RARE_CARDS: readonly CardDef[] = [
  // --- Private ---
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
    v2: { cost: 1 },
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
    v2: { effects: [{ kind: 'damage', amount: 7, bonusPerChain: 4 }] },
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
    v2: {
      effects: [
        { kind: 'block', amount: 9 },
        { kind: 'ifAlert', atMost: 'quiet', then: [{ kind: 'block', amount: 4 }] },
      ],
    },
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
    v2: { cost: 0 },
  },
  {
    id: 'internal-spearphishing',
    name: 'Internal Spearphishing',
    owner,
    rarity: 'private',
    type: 'attack',
    tactic: 'lateral-movement',
    cost: 1,
    effects: [
      { kind: 'damage', amount: 8 },
      { kind: 'alert', amount: -1 },
    ],
    v2: {
      effects: [
        { kind: 'damage', amount: 11 },
        { kind: 'alert', amount: -2 },
      ],
    },
  },
  {
    id: 'email-collection',
    name: 'Email Collection',
    owner,
    rarity: 'private',
    type: 'attack',
    tactic: 'collection',
    cost: 2,
    effects: [
      { kind: 'damage', amount: 6, target: 'allEnemies' },
      { kind: 'ifAlert', atMost: 'quiet', then: [{ kind: 'draw', count: 2 }] },
    ],
    v2: {
      effects: [
        { kind: 'damage', amount: 9, target: 'allEnemies' },
        { kind: 'ifAlert', atMost: 'quiet', then: [{ kind: 'draw', count: 2 }] },
      ],
    },
  },
  {
    id: 'account-manipulation',
    name: 'Account Manipulation',
    owner,
    rarity: 'private',
    type: 'implant',
    tactic: 'persistence',
    cost: 2,
    effects: [{ kind: 'applyStatus', status: 'shadow-account', stacks: 1, target: 'self' }],
    v2: { cost: 1 },
  },
  {
    id: 'financial-theft',
    name: 'Financial Theft',
    owner,
    rarity: 'private',
    type: 'attack',
    tactic: 'impact',
    cost: 2,
    effects: [{ kind: 'damage', amount: 13, bonusPerChain: 2 }],
    v2: { effects: [{ kind: 'damage', amount: 17, bonusPerChain: 2 }] },
  },
  {
    id: 'mfa-fatigue',
    name: 'MFA Fatigue',
    owner,
    rarity: 'private',
    type: 'skill',
    tactic: 'credential-access',
    cost: 1,
    // A cheap Stall that blows your cover.
    effects: [{ kind: 'applyStatus', status: 'stalled', stacks: 1, target: 'target' }],
    keywords: { noisy: 4 },
    v2: { keywords: { noisy: 2 } },
  },

  // --- 0-day ---
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
    v2: {
      effects: [
        {
          kind: 'ifAlert',
          atMost: 'quiet',
          then: [
            { kind: 'gainCycles', amount: 2 },
            { kind: 'draw', count: 3 },
          ],
        },
        { kind: 'ifAlert', atLeast: 'noisy', then: [{ kind: 'alert', amount: -6 }] },
      ],
    },
  },
  {
    id: 'supply-chain-compromise',
    name: 'Supply Chain Compromise',
    owner,
    rarity: 'zero-day',
    type: 'skill',
    tactic: 'initial-access',
    cost: 2,
    effects: [
      { kind: 'applyStatus', status: 'throttled', stacks: 2, target: 'allEnemies' },
      { kind: 'applyStatus', status: 'stalled', stacks: 1, target: 'allEnemies' },
    ],
    keywords: { burner: true },
    v2: { cost: 1 },
  },
  {
    id: 'exfiltration-over-web-service',
    name: 'Exfiltration Over Web Service',
    owner,
    rarity: 'zero-day',
    type: 'attack',
    tactic: 'exfiltration',
    cost: 1,
    effects: [{ kind: 'damage', amount: 4, bonusPerChain: 4 }],
    v2: { effects: [{ kind: 'damage', amount: 6, bonusPerChain: 5 }] },
  },
];
