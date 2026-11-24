/**
 * Unlockable cards: earned through class levels and Bounties (see
 * data/progression.ts). Until unlocked they never show up as Loot, at the
 * Dark Web or from Intel. Each class gets 2 cards per level (levels 1-3)
 * and 1 from its "Win as..." Bounty.
 *
 * Content safety: names reference ATT&CK techniques for flavor only.
 */
import type { CardDef } from '../../engine';

const se = 'social-engineer';
const ed = 'exploit-dev';
const insider = 'insider';

export const UNLOCKABLE_CARDS: readonly CardDef[] = [
  // --- Social Engineer ---
  {
    id: 'spearphishing-voice',
    name: 'Spearphishing Voice',
    owner: se,
    rarity: 'public',
    type: 'attack',
    tactic: 'initial-access',
    cost: 1,
    effects: [
      { kind: 'damage', amount: 7 },
      { kind: 'applyStatus', status: 'throttled', stacks: 1, target: 'target' },
    ],
    v2: {
      effects: [
        { kind: 'damage', amount: 10 },
        { kind: 'applyStatus', status: 'throttled', stacks: 1, target: 'target' },
      ],
    },
  },
  {
    id: 'gather-victim-identity',
    name: 'Gather Victim Identity Info',
    owner: se,
    rarity: 'public',
    type: 'skill',
    tactic: 'reconnaissance',
    cost: 1,
    effects: [{ kind: 'applyStatus', status: 'throttled', stacks: 2, target: 'allEnemies' }],
    v2: { cost: 0 },
  },
  {
    id: 'gather-victim-org-info',
    name: 'Gather Victim Org Info',
    owner: se,
    rarity: 'private',
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
    id: 'spearphishing-via-service',
    name: 'Spearphishing via Service',
    owner: se,
    rarity: 'private',
    type: 'attack',
    tactic: 'initial-access',
    cost: 1,
    effects: [
      { kind: 'damage', amount: 8 },
      { kind: 'ifAlert', atMost: 'quiet', then: [{ kind: 'damage', amount: 4 }] },
    ],
    v2: {
      effects: [
        { kind: 'damage', amount: 10 },
        { kind: 'ifAlert', atMost: 'quiet', then: [{ kind: 'damage', amount: 6 }] },
      ],
    },
  },
  {
    id: 'establish-accounts',
    name: 'Establish Accounts',
    owner: se,
    rarity: 'private',
    type: 'implant',
    tactic: 'resource-development',
    cost: 2,
    effects: [{ kind: 'applyStatus', status: 'sock-puppet', stacks: 1, target: 'self' }],
    v2: { cost: 1 },
  },
  {
    id: 'spearphishing-attachment',
    name: 'Spearphishing Attachment',
    owner: se,
    rarity: 'zero-day',
    type: 'attack',
    tactic: 'initial-access',
    cost: 2,
    effects: [
      { kind: 'damage', amount: 9 },
      { kind: 'applyStatus', status: 'stalled', stacks: 1, target: 'target' },
    ],
    keywords: { burner: true },
    v2: {
      effects: [
        { kind: 'damage', amount: 12 },
        { kind: 'applyStatus', status: 'stalled', stacks: 1, target: 'target' },
      ],
    },
  },
  {
    id: 'compromise-accounts',
    name: 'Compromise Accounts',
    owner: se,
    rarity: 'zero-day',
    type: 'attack',
    tactic: 'resource-development',
    cost: 2,
    effects: [
      { kind: 'damage', amount: 8 },
      { kind: 'applyStatus', status: 'stalled', stacks: 1, target: 'target' },
    ],
    // Burner: a repeatable Stall every reshuffle was the strongest card in the sim.
    keywords: { burner: true },
    v2: { cost: 1 },
  },

  // --- Exploit Dev ---
  {
    id: 'exploitation-for-client-execution',
    name: 'Exploitation for Client Execution',
    owner: ed,
    rarity: 'public',
    type: 'attack',
    tactic: 'execution',
    cost: 1,
    effects: [
      { kind: 'damage', amount: 5 },
      { kind: 'exploit', damagePerStack: 6 },
    ],
    v2: {
      effects: [
        { kind: 'damage', amount: 7 },
        { kind: 'exploit', damagePerStack: 7 },
      ],
    },
  },
  {
    id: 'scanning-ip-blocks',
    name: 'Scanning IP Blocks',
    owner: ed,
    rarity: 'public',
    type: 'skill',
    tactic: 'reconnaissance',
    cost: 1,
    effects: [
      { kind: 'applyStatus', status: 'vuln', stacks: 3, target: 'target' },
      { kind: 'block', amount: 4 },
    ],
    v2: {
      effects: [
        { kind: 'applyStatus', status: 'vuln', stacks: 4, target: 'target' },
        { kind: 'block', amount: 6 },
      ],
    },
  },
  {
    id: 'exploitation-for-defense-evasion',
    name: 'Exploitation for Defense Evasion',
    owner: ed,
    rarity: 'private',
    type: 'skill',
    tactic: 'defense-evasion',
    cost: 1,
    effects: [
      { kind: 'block', amount: 10 },
      { kind: 'applyStatus', status: 'vuln', stacks: 2, target: 'target' },
    ],
    v2: {
      effects: [
        { kind: 'block', amount: 13 },
        { kind: 'applyStatus', status: 'vuln', stacks: 2, target: 'target' },
      ],
    },
  },
  {
    id: 'obtain-capabilities',
    name: 'Obtain Capabilities',
    owner: ed,
    rarity: 'private',
    type: 'skill',
    tactic: 'resource-development',
    cost: 1,
    effects: [
      { kind: 'draw', count: 2 },
      { kind: 'applyStatus', status: 'vuln', stacks: 1, target: 'allEnemies' },
    ],
    v2: { cost: 0 },
  },
  {
    id: 'exploitation-of-remote-services',
    name: 'Exploitation of Remote Services',
    owner: ed,
    rarity: 'private',
    type: 'attack',
    tactic: 'lateral-movement',
    cost: 2,
    effects: [{ kind: 'exploit', damagePerStack: 9 }],
    v2: { effects: [{ kind: 'exploit', damagePerStack: 11 }] },
  },
  {
    id: 'endpoint-denial-of-service',
    name: 'Endpoint Denial of Service',
    owner: ed,
    rarity: 'zero-day',
    type: 'attack',
    tactic: 'impact',
    cost: 2,
    effects: [{ kind: 'damage', amount: 7, hits: 2, target: 'allEnemies' }],
    keywords: { noisy: 1 },
    v2: { effects: [{ kind: 'damage', amount: 10, hits: 2, target: 'allEnemies' }] },
  },
  {
    id: 'firmware-corruption',
    name: 'Firmware Corruption',
    owner: ed,
    rarity: 'zero-day',
    type: 'attack',
    tactic: 'impact',
    cost: 2,
    effects: [{ kind: 'exploit', damagePerStack: 11 }],
    keywords: { noisy: 2 },
    v2: { keywords: {} },
  },

  // --- Insider ---
  {
    id: 'remote-email-collection',
    name: 'Remote Email Collection',
    owner: insider,
    rarity: 'public',
    type: 'attack',
    tactic: 'collection',
    cost: 1,
    effects: [
      { kind: 'damage', amount: 6 },
      { kind: 'applyStatus', status: 'exposed', stacks: 1, target: 'target' },
    ],
    v2: {
      effects: [
        { kind: 'damage', amount: 10 },
        { kind: 'applyStatus', status: 'exposed', stacks: 1, target: 'target' },
      ],
    },
  },
  {
    id: 'service-stop',
    name: 'Service Stop',
    owner: insider,
    rarity: 'public',
    type: 'attack',
    tactic: 'impact',
    cost: 2,
    effects: [
      { kind: 'damage', amount: 5, target: 'allEnemies' },
      { kind: 'applyStatus', status: 'throttled', stacks: 2, target: 'allEnemies' },
    ],
    v2: {
      effects: [
        { kind: 'damage', amount: 8, target: 'allEnemies' },
        { kind: 'applyStatus', status: 'throttled', stacks: 2, target: 'allEnemies' },
      ],
    },
  },
  {
    id: 'data-obfuscation',
    name: 'Data Obfuscation',
    owner: insider,
    rarity: 'private',
    type: 'skill',
    tactic: 'command-and-control',
    cost: 1,
    effects: [
      { kind: 'block', amount: 9 },
      { kind: 'alert', amount: -2 },
    ],
    v2: {
      effects: [
        { kind: 'block', amount: 13 },
        { kind: 'alert', amount: -2 },
      ],
    },
  },
  {
    id: 'exfiltration-over-alternative-protocol',
    name: 'Exfiltration Over Alternative Protocol',
    owner: insider,
    rarity: 'private',
    type: 'attack',
    tactic: 'exfiltration',
    cost: 2,
    effects: [{ kind: 'damage', amount: 19 }],
    keywords: { noisy: 1 },
    v2: { effects: [{ kind: 'damage', amount: 25 }] },
  },
  {
    id: 'steal-application-access-token',
    name: 'Steal Application Access Token',
    owner: insider,
    rarity: 'private',
    type: 'skill',
    tactic: 'credential-access',
    cost: 1,
    effects: [
      { kind: 'gainCycles', amount: 1 },
      { kind: 'draw', count: 2 },
    ],
    keywords: { burner: true },
    v2: { cost: 0 },
  },
  {
    id: 'account-access-removal',
    name: 'Account Access Removal',
    owner: insider,
    rarity: 'zero-day',
    type: 'attack',
    tactic: 'impact',
    cost: 2,
    effects: [
      { kind: 'damage', amount: 10 },
      { kind: 'applyStatus', status: 'stalled', stacks: 1, target: 'target' },
    ],
    v2: {
      effects: [
        { kind: 'damage', amount: 15 },
        { kind: 'applyStatus', status: 'stalled', stacks: 1, target: 'target' },
      ],
    },
  },
  {
    id: 'data-manipulation',
    name: 'Data Manipulation',
    owner: insider,
    rarity: 'zero-day',
    type: 'attack',
    tactic: 'impact',
    cost: 3,
    effects: [{ kind: 'damage', amount: 25, bonusPerChain: 3 }],
    keywords: { noisy: 2 },
    v2: { cost: 2 },
  },
];
