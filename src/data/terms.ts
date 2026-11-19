/**
 * Every player-facing themed word lives here (see CLAUDE.md, "Theme and terminology").
 * Components import from this file instead of hard-coding words, so a rename
 * is a one-line change. Names of specific cards, enemies and statuses live
 * with their data instead.
 */
import type { AlertLevelId, NodeKind, Rarity } from '../engine';

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

  // --- Run loop (Milestone 3) ---
  crypto: 'Crypto',
  loot: 'Loot',
  skipLoot: 'Skip',
  tool: 'Tool',
  tools: 'Tools',
  /** Appended to an upgraded card's name, e.g. "Phishing v2". */
  upgradedSuffix: ' v2',
  map: 'Map',
  floor: 'Floor',
  wipe: 'Wipe',
  leave: 'Leave',
  layLow: 'Lay Low',
  weaponize: 'Weaponize',
  goDark: 'Go Dark',
  heat: 'Heat',
  startRun: 'Start Run',
  continueRun: 'Continue Run',
  abandonRun: 'Abandon Run',
  newRun: 'New Run',
  practiceFight: 'Practice Fight',
  mainMenu: 'Menu',
  pickCard: 'Pick a card',
  sold: 'Sold',
  cancel: 'Cancel',
  close: 'Close',
  done: 'Done',
  free: 'Free',
  minArsenal: 'Your Arsenal is at its minimum size.',
  noUpgrades: 'No cards can be upgraded.',
  chooseNext: 'Choose your next target',

  // --- Fight screen (Milestone 4) ---
  play: 'Play',
  tapEnemy: 'Tap an enemy to target it',
  notEnoughCycles: 'Not enough Cycles',
  menu: 'Menu',
  hand: 'Hand',
  incoming: 'Incoming',

  // --- Run logs (bug reports) ---
  runLog: 'Run log',
  runLogs: 'Run Logs',
  copyLog: 'Copy Log',
  copied: 'Copied',
  copyFailed: 'Copy was blocked. Tap the box, select all and copy by hand.',
  reportOnGitHub: 'Report on GitHub',
  runLogHelp: 'A run log is your seed plus every move you made, so the run can be replayed exactly. Paste it into a GitHub issue or a message.',
  noRunLogs: 'No runs yet.',
} as const;

/** Names for each kind of map node. */
export const NODE_NAMES: Record<NodeKind, string> = {
  fight: 'Fight',
  elite: 'Hardened Target',
  intel: 'Intel',
  safehouse: 'Safehouse',
  darkWeb: 'Dark Web',
  boss: 'Boss',
};

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
