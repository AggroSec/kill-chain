/**
 * Every player-facing themed word lives here (see CLAUDE.md, "Theme and terminology").
 * Components import from this file instead of hard-coding words, so a rename
 * is a one-line change. Milestone 3 fills this out; Milestone 1 only needs
 * what the debug combat screen shows.
 */
export const TERMS = {
  gameTitle: 'Kill Chain',
  operator: 'Operator',
  arsenal: 'Arsenal',
  opsec: 'OpSec',
  cycles: 'Cycles',
  integrity: 'Integrity',
  block: 'Block',
  drawPile: 'Draw',
  discardPile: 'Discard',
  endTurn: 'End Turn',
  turn: 'Turn',
  intent: 'Next',
  newFight: 'New Fight',
  seed: 'Seed',
  runWon: 'Exfiltrated',
  runLost: 'Burned',
  turnCap: 'Timed Out',
  intentAttack: 'Attack',
  intentBlock: 'Block',
} as const;

export type TermKey = keyof typeof TERMS;
