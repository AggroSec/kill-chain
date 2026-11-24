/**
 * Act 2, Internal: Active Directory and lateral movement.
 * Tougher than Act 1, and the first enemies that debuff the Operator
 * (Throttled: your attacks deal less; Exposed: you take more).
 * Approved list in #22; numbers are tuned by the simulator.
 */
import type { EnemyDef } from '../engine';

export const ACT2_ENEMIES: readonly EnemyDef[] = [
  {
    id: 'siem',
    name: 'SIEM',
    tier: 'normal',
    maxIntegrity: 48,
    description: 'Correlates everything. Raises Alert almost every turn, so its hits keep getting harder.',
    moves: [
      {
        id: 'correlate',
        name: 'Correlate Events',
        effects: [
          { kind: 'attack', damage: 7 },
          { kind: 'raiseAlert', amount: 2 },
        ],
        weight: 2,
      },
      { id: 'alert-storm', name: 'Alert Storm', effects: [{ kind: 'attack', damage: 4, hits: 3 }], weight: 2, maxInARow: 1 },
      {
        id: 'dashboards',
        name: 'Build Dashboards',
        effects: [
          { kind: 'block', amount: 10 },
          { kind: 'raiseAlert', amount: 1 },
        ],
        weight: 1,
        maxInARow: 1,
      },
    ],
  },
  {
    id: 'honeytoken',
    name: 'Honeytoken',
    tier: 'normal',
    maxIntegrity: 30,
    description: 'A fake admin account. Whenever a card damages it, Alert +3.',
    onAttacked: [{ kind: 'raiseAlert', amount: 3 }],
    moves: [
      { id: 'bait', name: 'Bait', effects: [{ kind: 'block', amount: 8 }], weight: 1, maxInARow: 1 },
      {
        id: 'beacon',
        name: 'Beacon',
        effects: [
          { kind: 'buffAllies', status: 'hardened', stacks: 1 },
          { kind: 'raiseAlert', amount: 1 },
        ],
        weight: 2,
        maxInARow: 1,
      },
      { id: 'trip-wire', name: 'Trip Wire', effects: [{ kind: 'attack', damage: 8 }], weight: 2 },
    ],
  },
  {
    id: 'group-policy',
    name: 'Group Policy',
    tier: 'normal',
    maxIntegrity: 44,
    description: 'Support. Hardens its allies and cleanses their debuffs. Kill it first.',
    moves: [
      {
        id: 'enforce',
        name: 'Enforce Policy',
        effects: [
          { kind: 'buffAllies', status: 'hardened', stacks: 1 },
          { kind: 'block', amount: 6 },
        ],
        weight: 2,
        maxInARow: 1,
      },
      { id: 'account-lockout', name: 'Account Lockout', effects: [{ kind: 'attack', damage: 10 }], weight: 2 },
      {
        id: 'policy-refresh',
        name: 'Policy Refresh',
        effects: [{ kind: 'cleanse' }, { kind: 'block', amount: 8 }],
        weight: 1,
        maxInARow: 1,
      },
    ],
  },
  {
    id: 'pam',
    name: 'Privileged Access Mgmt',
    tier: 'normal',
    maxIntegrity: 52,
    description: 'Records your sessions and Throttles you (your attacks deal 25% less).',
    moves: [
      {
        id: 'session-recording',
        name: 'Session Recording',
        effects: [
          { kind: 'attack', damage: 6 },
          { kind: 'debuffPlayer', status: 'throttled', stacks: 1 },
        ],
        weight: 2,
        maxInARow: 1,
      },
      { id: 'password-vault', name: 'Password Vault', effects: [{ kind: 'block', amount: 16 }], weight: 1, maxInARow: 1 },
      { id: 'check-out', name: 'Credential Check-out', effects: [{ kind: 'attack', damage: 13 }], weight: 2, maxInARow: 2 },
    ],
  },
  {
    id: 'next-gen-edr',
    name: 'Next-Gen EDR',
    tier: 'normal',
    maxIntegrity: 56,
    description: 'The EDR, upgraded. Cleanses every debuff from every enemy and hits hard.',
    moves: [
      {
        id: 'auto-remediate',
        name: 'Auto-Remediate',
        effects: [{ kind: 'cleanse' }, { kind: 'block', amount: 10 }],
        weight: 2,
        maxInARow: 1,
      },
      { id: 'isolate-host', name: 'Isolate Host', effects: [{ kind: 'attack', damage: 14 }], weight: 2, maxInARow: 2 },
      {
        id: 'ml-detection',
        name: 'ML Detection',
        effects: [
          { kind: 'attack', damage: 8 },
          { kind: 'buffSelf', status: 'hardened', stacks: 1 },
        ],
        weight: 1,
      },
    ],
  },
  {
    id: 'tier0-admin',
    name: 'Tier 0 Admin',
    tier: 'elite',
    maxIntegrity: 110,
    description: 'Hardened Target. A domain admin on high alert: cleanses, Throttles you and keeps escalating.',
    moves: [
      { id: 'privileged-session', name: 'Privileged Session', effects: [{ kind: 'attack', damage: 18 }], weight: 2, maxInARow: 1 },
      {
        id: 'credential-rotation',
        name: 'Credential Rotation',
        effects: [{ kind: 'cleanse' }, { kind: 'block', amount: 16 }],
        weight: 1,
        maxInARow: 1,
      },
      {
        id: 'tier0-lockdown',
        name: 'Tier 0 Lockdown',
        effects: [
          { kind: 'attack', damage: 9 },
          { kind: 'debuffPlayer', status: 'throttled', stacks: 2 },
        ],
        weight: 2,
        maxInARow: 1,
      },
      {
        id: 'escalate-privileges',
        name: 'Escalate',
        effects: [
          { kind: 'attack', damage: 6 },
          { kind: 'buffSelf', status: 'hardened', stacks: 2 },
        ],
        weight: 1,
      },
    ],
  },

  // --- Boss: the Domain Controller and its two adds ---
  {
    id: 'domain-controller',
    name: 'Domain Controller',
    tier: 'boss',
    maxIntegrity: 130,
    description: 'Act 2 boss. Re-issues tickets: heals its adds while they live. Decide who goes down first.',
    moves: [
      {
        id: 'reissue-tickets',
        name: 'Re-issue Tickets',
        effects: [
          { kind: 'healAllies', amount: 12 },
          { kind: 'block', amount: 12 },
        ],
        weight: 1,
        maxInARow: 1,
      },
      { id: 'domain-lockout', name: 'Domain Lockout', effects: [{ kind: 'attack', damage: 15 }], weight: 2, maxInARow: 2 },
      {
        id: 'replicate',
        name: 'Replicate',
        effects: [
          { kind: 'attack', damage: 9 },
          { kind: 'buffAllies', status: 'hardened', stacks: 1 },
        ],
        weight: 1,
        maxInARow: 1,
      },
    ],
  },
  {
    id: 'kerberos',
    name: 'Kerberos',
    tier: 'boss',
    maxIntegrity: 50,
    description: 'Domain Controller add. Checks your tickets and leaves you Exposed (you take 50% more damage).',
    moves: [
      { id: 'ticket-check', name: 'Ticket Check', effects: [{ kind: 'attack', damage: 7, hits: 2 }], weight: 2, maxInARow: 1 },
      {
        id: 'pre-auth',
        name: 'Pre-Authentication',
        effects: [
          { kind: 'attack', damage: 6 },
          { kind: 'debuffPlayer', status: 'exposed', stacks: 1 },
        ],
        weight: 1,
        maxInARow: 1,
      },
      { id: 'renew', name: 'Renew', effects: [{ kind: 'block', amount: 10 }], weight: 1 },
    ],
  },
  {
    id: 'gpo-server',
    name: 'GPO Server',
    tier: 'boss',
    maxIntegrity: 55,
    description: 'Domain Controller add. Pushes policy: Hardens the team and raises Alert.',
    moves: [
      {
        id: 'push-policy',
        name: 'Push Policy',
        effects: [
          { kind: 'buffAllies', status: 'hardened', stacks: 1 },
          { kind: 'block', amount: 6 },
        ],
        weight: 1,
        maxInARow: 1,
      },
      {
        id: 'audit',
        name: 'Audit',
        effects: [
          { kind: 'attack', damage: 6 },
          { kind: 'raiseAlert', amount: 3 },
        ],
        weight: 2,
        maxInARow: 1,
      },
      { id: 'deny-logon', name: 'Deny Logon', effects: [{ kind: 'attack', damage: 10 }], weight: 2 },
    ],
  },
];
