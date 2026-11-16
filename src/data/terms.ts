/**
 * Every player-facing themed word lives here (see CLAUDE.md, "Theme and terminology").
 * Components import from this file instead of hard-coding words, so a rename
 * is a one-line change. Names of specific cards, enemies and statuses live
 * with their data instead.
 */
import type { AlertLevelId, Rarity } from '../engine';

export const TERMS = {
  gameTitle: 'Kill Chain',
  operator: 'Operator',
  arsenal: 'Arsenal',
  opsec: 'OpSec',
  cycles: 'Cycles',
  integrity: 'Integrity',
  block: 'Block',
  alert: 'Alert',
  chain: 'Chain',
  drawPile: 'Draw',
  discardPile: 'Discard',
  spentPile: 'Spent',
  endTurn: 'End Turn',
  turn: 'Turn',
  intent: 'Next',
  target: 'Target',
  newFight: 'New Fight',
  startFight: 'Start Fight',
  chooseClass: 'Class',
  chooseEncounter: 'Encounter',
  seed: 'Seed',
  runWon: 'Exfiltrated',
  runLost: 'Burned',
  turnCap: 'Timed Out',
  stalled: 'Stalled',
  allEnemies: 'ALL enemies',
} as const;

export const ALERT_LEVEL_NAMES: Record<AlertLevelId, string> = {
  quiet: 'Quiet',
  noisy: 'Noisy',
  detected: 'Detected',
  lockdown: 'Lockdown',
};

export const RARITY_NAMES: Record<Rarity, string> = {
  starter: 'Starter',
  public: 'Public',
  private: 'Private',
  'zero-day': '0-day',
};

/** Keyword names shown on cards. Explanations go in the inspect panel / glossary (Milestone 4+). */
export const KEYWORD_NAMES = {
  noisy: 'Noisy',
  burner: 'Burner',
  stash: 'Stash',
  implant: 'Implant',
  exploit: 'Exploit',
} as const;

export type TermKey = keyof typeof TERMS;
