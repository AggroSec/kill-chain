/**
 * Playable classes. Each has a starter Arsenal and owns a card pool
 * (cards whose `owner` matches the class id).
 */
import type { RunClassDef } from '../engine';

/** A playable class: the run engine's fields (id, max OpSec, starter Arsenal, passive) plus display text. */
export interface ClassDef extends RunClassDef {
  name: string;
  /** One-line pitch for the class select screen. */
  tagline: string;
  /** The passive ability, as shown to the player (the rules are in `passive`). */
  passiveName: string;
  passiveText: string;
}

function copies(id: string, count: number): string[] {
  return Array<string>(count).fill(id);
}

export const CLASS_LIST: readonly ClassDef[] = [
  {
    id: 'social-engineer',
    name: 'Social Engineer',
    tagline: 'Talk your way in. Weaken and stall defenders, and keep Alert low.',
    maxOpsec: 70,
    starterDeck: [...copies('phishing', 4), ...copies('masquerade', 4), 'pretexting', 'impersonation'],
    passiveName: 'Smooth Talker',
    passiveText: 'At the start of each fight, a random enemy is Stalled for its first turn.',
    passive: {
      combat: { combatStart: [{ kind: 'applyStatus', status: 'stalled', stacks: 1, target: 'randomEnemy' }] },
    },
  },
  {
    id: 'exploit-dev',
    name: 'Exploit Dev',
    tagline: 'Scan for Vuln, then cash it in with devastating Exploits. Loud.',
    maxOpsec: 75,
    starterDeck: [...copies('brute-force', 4), ...copies('obfuscate', 4), 'active-scanning', 'exploit-public-app'],
    passiveName: 'Zero-Day Broker',
    passiveText: 'Every 3rd fight won, and after every Hardened Target, pick a bonus Private or 0-day card.',
    passive: {
      bonusLoot: { everyFightsWon: 3, afterElite: true, rarityWeights: { public: 0, private: 75, 'zero-day': 25 }, cardChoices: 3 },
    },
  },
  {
    id: 'insider',
    name: 'Insider',
    tagline: 'Already inside. Fast, mid-chain combos and big Collection payoffs, but fragile.',
    maxOpsec: 50,
    maxCycles: 4,
    starterDeck: [
      ...copies('data-from-local-system', 4),
      ...copies('indicator-removal', 3),
      'account-discovery',
      'remote-desktop',
      'exfiltration-over-physical-medium',
    ],
    passiveName: 'Trusted Access',
    passiveText: 'Each turn your Chain starts as if you played Initial Access (step 3). 4 Cycles a turn. Fragile: take 1 more damage from every hit.',
    passive: {
      combat: { chainStartTactic: 'initial-access', damageTakenPerHit: 1 },
    },
  },
];
