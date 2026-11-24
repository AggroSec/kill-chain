/**
 * Class levels and Bounties (AggroSec, #22). Adding a level, a Bounty or an
 * unlockable card is a data change here (cards go in cards/unlockable.ts).
 *
 * Levels: 2 new cards each, at 40 / 120 / 250 total XP for that class.
 * Run XP: 1 per floor cleared, 10 per boss beaten, 20 for a win.
 */
import type { ProgressionDef } from '../engine';

const card = (cardId: string) => ({ kind: 'card', cardId }) as const;

export const PROGRESSION: ProgressionDef = {
  startingClasses: ['social-engineer', 'exploit-dev'],
  runXp: { perFloor: 1, perBoss: 10, win: 20 },
  classLevels: {
    'social-engineer': [
      { level: 1, xp: 40, unlocks: [card('spearphishing-voice'), card('gather-victim-identity')] },
      { level: 2, xp: 120, unlocks: [card('gather-victim-org-info'), card('spearphishing-via-service')] },
      { level: 3, xp: 250, unlocks: [card('establish-accounts'), card('spearphishing-attachment')] },
    ],
    'exploit-dev': [
      { level: 1, xp: 40, unlocks: [card('exploitation-for-client-execution'), card('scanning-ip-blocks')] },
      { level: 2, xp: 120, unlocks: [card('exploitation-for-defense-evasion'), card('obtain-capabilities')] },
      { level: 3, xp: 250, unlocks: [card('exploitation-of-remote-services'), card('endpoint-denial-of-service')] },
    ],
    insider: [
      { level: 1, xp: 40, unlocks: [card('remote-email-collection'), card('service-stop')] },
      { level: 2, xp: 120, unlocks: [card('data-obfuscation'), card('exfiltration-over-alternative-protocol')] },
      { level: 3, xp: 250, unlocks: [card('steal-application-access-token'), card('account-access-removal')] },
    ],
  },
  bounties: [
    {
      id: 'first-exfil',
      name: 'First Exfil',
      description: 'Win a run with any class.',
      condition: { kind: 'winRun' },
      xp: 25,
      unlocks: [{ kind: 'class', classId: 'insider' }],
    },
    {
      id: 'smooth-operator',
      name: 'Smooth Operator',
      description: 'Win a run as the Social Engineer.',
      condition: { kind: 'winAs', classId: 'social-engineer' },
      xp: 20,
      unlocks: [card('compromise-accounts')],
    },
    {
      id: 'weaponized',
      name: 'Weaponized',
      description: 'Win a run as the Exploit Dev.',
      condition: { kind: 'winAs', classId: 'exploit-dev' },
      xp: 20,
      unlocks: [card('firmware-corruption')],
    },
    {
      id: 'inside-job',
      name: 'Inside Job',
      description: 'Win a run as the Insider.',
      condition: { kind: 'winAs', classId: 'insider' },
      xp: 20,
      unlocks: [card('data-manipulation')],
    },
    {
      id: 'domain-dominance',
      name: 'Domain Dominance',
      description: 'Beat the Domain Controller.',
      condition: { kind: 'beatBoss', encounterId: 'a2-domain-controller' },
      xp: 15,
      unlocks: [],
    },
    {
      id: 'safety-off',
      name: 'Safety Off',
      description: 'Beat the Safety Instrumented System (OT Facility).',
      condition: { kind: 'beatBoss', encounterId: 'ot-sis' },
      xp: 20,
      unlocks: [],
    },
    {
      id: 'identity-crisis',
      name: 'Identity Crisis',
      description: 'Beat the Identity Provider (Cloud Tenant).',
      condition: { kind: 'beatBoss', encounterId: 'cloud-idp' },
      xp: 20,
      unlocks: [],
    },
    {
      id: 'ghost',
      name: 'Ghost',
      description: 'Win a run without Alert ever going above Noisy.',
      condition: { kind: 'winWithAlertAtMost', level: 'noisy' },
      xp: 25,
      unlocks: [],
    },
    {
      id: 'minimalist',
      name: 'Minimalist',
      description: 'Win a run with 12 cards or fewer in your Arsenal.',
      condition: { kind: 'winWithArsenalAtMost', size: 12 },
      xp: 25,
      unlocks: [],
    },
  ],
};
