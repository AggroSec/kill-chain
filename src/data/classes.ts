/**
 * Playable classes. Each has a starter Arsenal and owns a card pool
 * (cards whose `owner` matches the class id).
 */
import type { RunClassDef } from '../engine';

/** A playable class: the run engine's fields (id, max OpSec, starter Arsenal) plus display text. */
export interface ClassDef extends RunClassDef {
  name: string;
  /** One-line pitch for the class select screen. */
  tagline: string;
}

function copies(id: string, count: number): string[] {
  return Array<string>(count).fill(id);
}

export const CLASS_LIST: readonly ClassDef[] = [
  {
    id: 'social-engineer',
    name: 'Social Engineer',
    tagline: 'Talk your way in. Weaken and stall defenders, and keep Alert low.',
    maxOpsec: 65,
    starterDeck: [...copies('phishing', 4), ...copies('masquerade', 4), 'pretexting', 'impersonation'],
  },
  {
    id: 'exploit-dev',
    name: 'Exploit Dev',
    tagline: 'Scan for Vuln, then cash it in with devastating Exploits. Loud.',
    maxOpsec: 65,
    starterDeck: [...copies('brute-force', 4), ...copies('obfuscate', 4), 'active-scanning', 'exploit-public-app'],
  },
];
