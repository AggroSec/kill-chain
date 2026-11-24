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
  randomEnemy: 'a random enemy',

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
  cost: 'Cost',
  upgraded: 'Upgraded',
  newEffect: 'New effect',
  take: 'Take',
  buy: 'Buy',
  choose: 'Choose',
  tapEnemy: 'Tap an enemy to target it',
  notEnoughCycles: 'Not enough Cycles',
  menu: 'Menu',
  hand: 'Hand',
  incoming: 'Incoming',

  resume: 'Resume',
  glossary: 'Glossary',
  settings: 'Settings',
  credits: 'Credits',
  theme: 'Theme',
  back: 'Back',
  quitToMenu: 'Save and quit to menu',
  quitPractice: 'Quit to menu',
  savedNote: 'Your run is saved after every move.',
  howToPlay: 'How to Play',
  skipTutorial: 'Skip tutorial',
  tutorialOffer: 'New here? Play a short guided fight to learn the basics.',
  startTutorial: 'Play the guided fight',
  noThanks: 'No thanks',
  tutorialDone: 'That is the basics. The Glossary in the Menu explains every term. Good luck out there, Operator.',

  // --- Run logs (bug reports) ---
  runLog: 'Run log',
  runLogs: 'Run Logs',
  copyLog: 'Copy Log',
  copied: 'Copied',
  copyFailed: 'Copy was blocked. Tap the box, select all and copy by hand.',
  reportOnGitHub: 'Report on GitHub',
  runLogHelp: 'A run log is your seed plus every move you made, so the run can be replayed exactly. Paste it into a GitHub issue or a message.',
  noRunLogs: 'No runs yet.',

  // --- Acts, Final Targets and progression (Milestone 5) ---
  act: 'Act',
  finalTarget: 'Final Target',
  finalTargetDrawn: 'Your Final Target',
  boss: 'Boss',
  recovered: 'Recovered',
  actStartHint: 'New network, new map. Your Arsenal, Tools and Crypto carry over.',
  passive: 'Passive',
  bonusPick: 'bonus pick',
  bounties: 'Bounties',
  bounty: 'Bounty',
  level: 'Level',
  xp: 'XP',
  maxLevel: 'Max level',
  locked: 'Locked',
  earned: 'Earned',
  unlocks: 'Unlocks',
  unlockedBy: 'Unlock with',
  classLevels: 'Class levels',
  progress: 'Progress',
  xpGained: 'XP gained',
  levelUp: 'Level up',
  newUnlocks: 'Unlocked',
  newClass: 'New class',
  newMode: 'New mode',
  bountiesHelp: 'Bounties are goals across all your runs. Each one gives XP to the class you were playing, and some unlock cards or classes.',
  levelsHelp: 'Every run, won or lost, gives XP to the class you played. Each level adds new cards to that class\'s Loot pool.',
} as const;

/** Act names, shown on the map and in the act intro. Act 3 is the run's Final Target. */
export const ACT_NAMES: Readonly<Record<number, string>> = {
  1: 'Perimeter',
  2: 'Internal',
  3: 'Final Target',
};

/** Theme names for Settings. */
export const THEME_NAMES = {
  green: 'Green terminal',
  amber: 'Amber terminal',
  soft: 'Soft dark',
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
