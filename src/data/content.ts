/**
 * The full content registry the engine uses to look up cards and enemies by id.
 */
import type { CombatSetup, ContentRegistry } from '../engine';
import { DEFAULT_MAX_CYCLES } from '../engine';
import { CARDS } from './cards';
import { ENEMIES } from './enemies';

export const CONTENT: ContentRegistry = {
  cards: CARDS,
  enemies: ENEMIES,
};

/**
 * Milestone 1 test fight: a generic 10-card Arsenal against a Firewall.
 * Class starter decks replace this in Milestone 2.
 */
export const DEMO_COMBAT: CombatSetup = {
  deck: [
    'brute-force',
    'brute-force',
    'brute-force',
    'brute-force',
    'brute-force',
    'obfuscate',
    'obfuscate',
    'obfuscate',
    'obfuscate',
    'obfuscate',
  ],
  opsec: 60,
  maxOpsec: 60,
  maxCycles: DEFAULT_MAX_CYCLES,
  enemies: ['firewall'],
};
