/**
 * Social Engineer cards, part 1: starter and Public.
 * Identity: weaken and Stall enemy intents, keep Alert low, and get bonuses
 * while Quiet. Private and 0-day cards are in socialEngineerRare.ts.
 *
 * `v2` lists only what changes when the card is upgraded (Weaponize).
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
    v2: { effects: [{ kind: 'damage', amount: 9 }] },
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
    v2: { effects: [{ kind: 'block', amount: 8 }] },
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
    v2: {
      effects: [
        { kind: 'applyStatus', status: 'throttled', stacks: 3, target: 'target' },
        { kind: 'alert', amount: -2 },
      ],
    },
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
    v2: {
      effects: [
        { kind: 'block', amount: 7 },
        { kind: 'alert', amount: -3 },
      ],
    },
  },

  // --- Public ---
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
    v2: {
      effects: [
        { kind: 'damage', amount: 12 },
        { kind: 'ifAlert', atMost: 'quiet', then: [{ kind: 'draw', count: 1 }] },
      ],
    },
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
    v2: {
      effects: [
        { kind: 'applyStatus', status: 'throttled', stacks: 2, target: 'target' },
        { kind: 'alert', amount: -1 },
      ],
    },
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
    v2: { effects: [{ kind: 'damage', amount: 10, target: 'allEnemies' }] },
  },
  {
    id: 'vishing',
    name: 'Vishing',
    owner,
    rarity: 'public',
    type: 'attack',
    tactic: 'initial-access',
    cost: 1,
    effects: [
      { kind: 'damage', amount: 5 },
      { kind: 'applyStatus', status: 'throttled', stacks: 1, target: 'target' },
    ],
    v2: {
      effects: [
        { kind: 'damage', amount: 8 },
        { kind: 'applyStatus', status: 'throttled', stacks: 1, target: 'target' },
      ],
    },
  },
  {
    id: 'watering-hole',
    name: 'Watering Hole',
    owner,
    rarity: 'public',
    type: 'skill',
    tactic: 'resource-development',
    cost: 1,
    effects: [
      { kind: 'block', amount: 7 },
      { kind: 'ifAlert', atMost: 'quiet', then: [{ kind: 'draw', count: 1 }] },
    ],
    v2: {
      effects: [
        { kind: 'block', amount: 10 },
        { kind: 'ifAlert', atMost: 'quiet', then: [{ kind: 'draw', count: 1 }] },
      ],
    },
  },
  {
    id: 'search-open-websites',
    name: 'Search Open Websites',
    owner,
    rarity: 'public',
    type: 'skill',
    tactic: 'reconnaissance',
    cost: 1,
    effects: [
      { kind: 'draw', count: 2 },
      { kind: 'alert', amount: -1 },
    ],
    v2: {
      effects: [
        { kind: 'draw', count: 3 },
        { kind: 'alert', amount: -1 },
      ],
    },
  },
  {
    id: 'steal-web-session-cookie',
    name: 'Steal Web Session Cookie',
    owner,
    rarity: 'public',
    type: 'attack',
    tactic: 'credential-access',
    cost: 1,
    effects: [
      { kind: 'damage', amount: 7 },
      { kind: 'ifAlert', atMost: 'quiet', then: [{ kind: 'damage', amount: 4 }] },
    ],
    v2: {
      effects: [
        { kind: 'damage', amount: 9 },
        { kind: 'ifAlert', atMost: 'quiet', then: [{ kind: 'damage', amount: 6 }] },
      ],
    },
  },
  {
    id: 'trusted-relationship',
    name: 'Trusted Relationship',
    owner,
    rarity: 'public',
    type: 'skill',
    tactic: 'initial-access',
    cost: 1,
    effects: [
      { kind: 'block', amount: 6 },
      { kind: 'applyStatus', status: 'throttled', stacks: 1, target: 'allEnemies' },
    ],
    v2: {
      effects: [
        { kind: 'block', amount: 9 },
        { kind: 'applyStatus', status: 'throttled', stacks: 1, target: 'allEnemies' },
      ],
    },
  },
];
