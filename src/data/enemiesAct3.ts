/**
 * Act 3, the Final Target. Each target has its own enemies and boss
 * (see targets.ts and the act 3 encounters). Adding a target = new
 * entries here, in encounters.ts and in targets.ts.
 * Approved list in #22; numbers are tuned by the simulator.
 */
import type { EnemyDef } from '../engine';

/** OT Facility: climb the Purdue model. Quiet play matters most here. */
export const OT_ENEMIES: readonly EnemyDef[] = [
  {
    id: 'hmi-operator',
    name: 'HMI Operator',
    tier: 'normal',
    maxIntegrity: 67,
    description: 'Only does routine rounds while Alert is Quiet. Above that, it hits hard.',
    moves: [
      { id: 'routine-rounds', name: 'Routine Rounds', effects: [{ kind: 'block', amount: 8 }], weight: 2, whenAlert: { atMost: 'quiet' } },
      { id: 'manual-override', name: 'Manual Override', effects: [{ kind: 'attack', damage: 16 }], weight: 2, maxInARow: 2 },
      {
        id: 'emergency-stop',
        name: 'Emergency Stop',
        effects: [
          { kind: 'attack', damage: 9 },
          { kind: 'raiseAlert', amount: 2 },
        ],
        weight: 2,
        whenAlert: { atLeast: 'noisy' },
      },
    ],
  },
  {
    id: 'historian',
    name: 'Historian',
    tier: 'normal',
    maxIntegrity: 57,
    description: 'Records every tag. Raises Alert, and whenever a card damages it, Alert +1.',
    onAttacked: [{ kind: 'raiseAlert', amount: 1 }],
    moves: [
      {
        id: 'log-tags',
        name: 'Log Tags',
        effects: [
          { kind: 'block', amount: 8 },
          { kind: 'raiseAlert', amount: 2 },
        ],
        weight: 2,
        maxInARow: 1,
      },
      {
        id: 'trend-analysis',
        name: 'Trend Analysis',
        effects: [
          { kind: 'attack', damage: 10 },
          { kind: 'raiseAlert', amount: 1 },
        ],
        weight: 2,
      },
      { id: 'archive', name: 'Archive', effects: [{ kind: 'block', amount: 12 }], weight: 1, maxInARow: 1 },
    ],
  },
  {
    id: 'data-diode',
    name: 'Data Diode',
    tier: 'normal',
    maxIntegrity: 81,
    description: 'Traffic only flows one way. Never attacks, but blocks heavily and Hardens its allies.',
    moves: [
      { id: 'one-way', name: 'One Way', effects: [{ kind: 'block', amount: 18 }], weight: 2 },
      { id: 'filter', name: 'Filter', effects: [{ kind: 'buffAllies', status: 'hardened', stacks: 1 }], weight: 1, maxInARow: 1 },
      {
        id: 'mirror-port',
        name: 'Mirror Port',
        effects: [
          { kind: 'block', amount: 10 },
          { kind: 'raiseAlert', amount: 2 },
        ],
        weight: 1,
        maxInARow: 1,
      },
    ],
  },
  {
    id: 'process-controller',
    name: 'Process Controller',
    tier: 'normal',
    maxIntegrity: 53,
    description: 'Ramps up: gets Hardened as the process runs.',
    moves: [
      {
        id: 'ramp-up',
        name: 'Ramp Up',
        effects: [
          { kind: 'attack', damage: 7 },
          { kind: 'buffSelf', status: 'hardened', stacks: 1 },
        ],
        weight: 2,
      },
      { id: 'setpoint', name: 'Setpoint Change', effects: [{ kind: 'attack', damage: 14 }], weight: 2, maxInARow: 1 },
    ],
  },
  {
    id: 'engineering-workstation',
    name: 'Engineering Workstation',
    tier: 'elite',
    maxIntegrity: 138,
    description: 'Hardened Target. Checks firmware (destroys an Implant) and raises the alarm.',
    moves: [
      { id: 'push-logic', name: 'Push Logic', effects: [{ kind: 'attack', damage: 12, hits: 2 }], weight: 2, maxInARow: 1 },
      {
        id: 'lock-project',
        name: 'Lock Project',
        effects: [{ kind: 'cleanse' }, { kind: 'block', amount: 18 }],
        weight: 1,
        maxInARow: 1,
      },
      {
        id: 'firmware-check',
        name: 'Firmware Check',
        effects: [
          { kind: 'attack', damage: 12 },
          { kind: 'removeImplants', count: 1 },
        ],
        weight: 1,
        maxInARow: 1,
      },
      {
        id: 'raise-alarm',
        name: 'Raise Alarm',
        effects: [
          { kind: 'attack', damage: 9 },
          { kind: 'raiseAlert', amount: 3 },
        ],
        weight: 1,
      },
    ],
  },

  // --- Boss: the Safety Instrumented System and two sensors ---
  {
    id: 'safety-instrumented-system',
    name: 'Safety Instrumented System',
    tier: 'boss',
    maxIntegrity: 200,
    description: 'OT Facility boss. At Detected Alert or higher it trips: huge attacks and Block every turn. Stay quiet.',
    moves: [
      {
        id: 'watch',
        name: 'Watch',
        effects: [
          { kind: 'attack', damage: 13 },
          { kind: 'block', amount: 8 },
        ],
        weight: 2,
        whenAlert: { atMost: 'noisy' },
      },
      {
        id: 'proof-test',
        name: 'Proof Test',
        effects: [
          { kind: 'buffSelf', status: 'hardened', stacks: 1 },
          { kind: 'block', amount: 10 },
        ],
        weight: 1,
        maxInARow: 1,
        whenAlert: { atMost: 'noisy' },
      },
      {
        id: 'safety-trip',
        name: 'Safety Trip',
        effects: [
          { kind: 'attack', damage: 22 },
          { kind: 'block', amount: 15 },
        ],
        weight: 1,
        whenAlert: { atLeast: 'detected' },
      },
    ],
  },
  {
    id: 'safety-sensor',
    name: 'Safety Sensor',
    tier: 'boss',
    maxIntegrity: 36,
    description: 'Safety Instrumented System add. Raises Alert, pushing the system toward a trip.',
    moves: [
      {
        id: 'sense',
        name: 'Sense',
        effects: [
          { kind: 'block', amount: 6 },
          { kind: 'raiseAlert', amount: 2 },
        ],
        weight: 2,
      },
      { id: 'vote', name: 'Vote to Trip', effects: [{ kind: 'attack', damage: 7 }], weight: 2 },
    ],
  },
];

/** Cloud Tenant: identities and misconfigurations. Punishes Implants and noise. */
export const CLOUD_ENEMIES: readonly EnemyDef[] = [
  {
    id: 'conditional-access',
    name: 'Conditional Access',
    tier: 'normal',
    maxIntegrity: 60,
    description: 'At Detected Alert or higher, it challenges you with MFA: Throttled (your attacks deal 25% less).',
    moves: [
      {
        id: 'mfa-challenge',
        name: 'MFA Challenge',
        effects: [
          { kind: 'attack', damage: 9 },
          { kind: 'debuffPlayer', status: 'throttled', stacks: 1 },
        ],
        weight: 3,
        maxInARow: 1,
        whenAlert: { atLeast: 'detected' },
      },
      { id: 'evaluate-sign-in', name: 'Evaluate Sign-in', effects: [{ kind: 'attack', damage: 13 }], weight: 2 },
      { id: 'block-sign-in', name: 'Block Sign-in', effects: [{ kind: 'block', amount: 14 }], weight: 1, maxInARow: 1 },
    ],
  },
  {
    id: 'cloud-audit-log',
    name: 'Cloud Audit Log',
    tier: 'normal',
    maxIntegrity: 53,
    description: 'Logs every API call. Raises Alert.',
    moves: [
      {
        id: 'record-call',
        name: 'Record API Call',
        effects: [
          { kind: 'attack', damage: 7 },
          { kind: 'raiseAlert', amount: 2 },
        ],
        weight: 2,
      },
      {
        id: 'alert-rule',
        name: 'Alert Rule',
        effects: [
          { kind: 'block', amount: 6 },
          { kind: 'raiseAlert', amount: 3 },
        ],
        weight: 1,
        maxInARow: 1,
      },
      { id: 'investigate', name: 'Investigate', effects: [{ kind: 'attack', damage: 12 }], weight: 2 },
    ],
  },
  {
    id: 'workload-protection',
    name: 'Workload Protection',
    tier: 'normal',
    maxIntegrity: 69,
    description: 'Scans workloads: destroys your Implants and cleanses debuffs.',
    moves: [
      {
        id: 'runtime-scan',
        name: 'Runtime Scan',
        effects: [
          { kind: 'attack', damage: 9 },
          { kind: 'removeImplants', count: 1 },
        ],
        weight: 1,
        maxInARow: 1,
      },
      {
        id: 'quarantine',
        name: 'Quarantine',
        effects: [{ kind: 'cleanse' }, { kind: 'block', amount: 12 }],
        weight: 1,
        maxInARow: 1,
      },
      { id: 'terminate', name: 'Terminate Container', effects: [{ kind: 'attack', damage: 16 }], weight: 2, maxInARow: 2 },
    ],
  },
  {
    id: 'autoscaling-group',
    name: 'Autoscaling Group',
    tier: 'normal',
    maxIntegrity: 46,
    description: 'Scales out: gains Block and Hardened as the fight goes on.',
    moves: [
      {
        id: 'scale-out',
        name: 'Scale Out',
        effects: [
          { kind: 'block', amount: 8 },
          { kind: 'buffSelf', status: 'hardened', stacks: 1 },
        ],
        weight: 2,
        maxInARow: 1,
      },
      { id: 'load-spike', name: 'Load Spike', effects: [{ kind: 'attack', damage: 10 }], weight: 2 },
    ],
  },
  {
    id: 'posture-scanner',
    name: 'Posture Scanner',
    tier: 'elite',
    maxIntegrity: 132,
    description: 'Hardened Target. Finds your misconfigurations: leaves you Exposed (you take 50% more damage).',
    moves: [
      {
        id: 'misconfig-alert',
        name: 'Misconfiguration Alert',
        effects: [
          { kind: 'attack', damage: 9 },
          { kind: 'debuffPlayer', status: 'exposed', stacks: 2 },
        ],
        weight: 1,
        maxInARow: 1,
      },
      {
        id: 'auto-remediation',
        name: 'Auto-Remediation',
        effects: [{ kind: 'cleanse' }, { kind: 'block', amount: 16 }],
        weight: 1,
        maxInARow: 1,
      },
      { id: 'compliance-sweep', name: 'Compliance Sweep', effects: [{ kind: 'attack', damage: 8, hits: 2 }], weight: 2 },
      { id: 'benchmark', name: 'Benchmark', effects: [{ kind: 'buffSelf', status: 'hardened', stacks: 2 }], weight: 1, maxInARow: 1 },
    ],
  },

  // --- Boss: the Identity Provider and two token services ---
  {
    id: 'identity-provider',
    name: 'Identity Provider',
    tier: 'boss',
    maxIntegrity: 200,
    description: 'Cloud Tenant boss. Revokes sessions: destroys your Implants and Throttles you. Its token services keep it going.',
    moves: [
      {
        id: 'revoke-sessions',
        name: 'Revoke Sessions',
        effects: [
          { kind: 'removeImplants', count: 2 },
          { kind: 'debuffPlayer', status: 'throttled', stacks: 1 },
          { kind: 'block', amount: 10 },
        ],
        weight: 1,
        maxInARow: 1,
      },
      { id: 'token-burst', name: 'Token Burst', effects: [{ kind: 'attack', damage: 6, hits: 3 }], weight: 2, maxInARow: 1 },
      {
        id: 'step-up-auth',
        name: 'Step-up Auth',
        effects: [
          { kind: 'attack', damage: 14 },
          { kind: 'raiseAlert', amount: 2 },
        ],
        weight: 2,
      },
    ],
  },
  {
    id: 'token-service',
    name: 'Token Service',
    tier: 'boss',
    maxIntegrity: 35,
    description: 'Identity Provider add. Issues tokens and heals the rest of the team.',
    moves: [
      { id: 'issue-token', name: 'Issue Token', effects: [{ kind: 'attack', damage: 8 }], weight: 2 },
      {
        id: 'refresh-token',
        name: 'Refresh Token',
        effects: [
          { kind: 'healAllies', amount: 5 },
          { kind: 'block', amount: 6 },
        ],
        weight: 1,
        maxInARow: 1,
      },
    ],
  },
];
