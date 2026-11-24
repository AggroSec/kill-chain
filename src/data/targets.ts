/**
 * Final Targets: one is drawn at the start of each run and is Act 3.
 * Adding a target = an entry here, its enemies (enemiesAct3.ts) and its
 * act 3 encounters with `target` set (encounters.ts). No engine changes.
 */
import type { TargetDef } from '../engine';

export const TARGET_LIST: readonly TargetDef[] = [
  {
    id: 'ot-facility',
    name: 'OT Facility',
    description: 'Climb the Purdue model to the plant floor. Defenders react to noise: quiet Arsenals do best.',
    bossName: 'Safety Instrumented System',
  },
  {
    id: 'cloud-tenant',
    name: 'Cloud Tenant',
    description: 'Pivot through identities and misconfigurations. Expect your Implants to be revoked and your attacks Throttled.',
    bossName: 'Identity Provider',
  },
];
