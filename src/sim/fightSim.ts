/**
 * Runs many fights headlessly and collects stats.
 */
import { combatReducer, Rng, startCombat } from '../engine';
import type { CombatSetup, CombatState, ContentRegistry } from '../engine';
import type { Bot } from './bots';

/** Hard ceiling on actions per fight, in case a bot never ends its turn. */
const MAX_ACTIONS_PER_FIGHT = 5_000;

/**
 * More card plays than this in one turn suggests an infinite combo.
 * A normal turn is 3-6 plays; even a great draw-heavy turn stays under 20.
 */
export const SUSPICIOUS_PLAYS_PER_TURN = 30;

export interface FightResult {
  outcome: CombatState['outcome'];
  turns: number;
  opsecLost: number;
  finalAlert: number;
  peakAlert: number;
  maxChain: number;
  /** Most cards played in a single turn (for infinite-combo detection). */
  maxPlaysInTurn: number;
}

export function runFight(setup: CombatSetup, seed: number, bot: Bot, content: ContentRegistry): FightResult {
  const botRng = new Rng(seed ^ 0x9e3779b9);
  let state = startCombat(setup, seed, content);
  let peakAlert = 0;
  let maxChain = 0;
  let playsThisTurn = 0;
  let maxPlaysInTurn = 0;

  for (let step = 0; step < MAX_ACTIONS_PER_FIGHT && state.outcome === 'ongoing'; step++) {
    const action = bot.chooseAction(state, content, botRng);
    playsThisTurn = action.type === 'PLAY_CARD' ? playsThisTurn + 1 : 0;
    maxPlaysInTurn = Math.max(maxPlaysInTurn, playsThisTurn);
    state = combatReducer(state, action, content);
    peakAlert = Math.max(peakAlert, state.alert);
    maxChain = Math.max(maxChain, state.chain.count);
  }

  return {
    outcome: state.outcome,
    turns: state.turn,
    opsecLost: setup.opsec - state.player.opsec,
    finalAlert: state.alert,
    peakAlert,
    maxChain,
    maxPlaysInTurn,
  };
}

export interface FightStats {
  fights: number;
  winRate: number;
  avgTurns: number;
  avgOpsecLost: number;
  avgPeakAlert: number;
  avgMaxChain: number;
  turnCaps: number;
  /** Fights that hit the action ceiling without ending (should always be 0). */
  stuck: number;
  /** Fights with a turn over SUSPICIOUS_PLAYS_PER_TURN card plays. */
  suspectedInfinites: number;
}

export function runFights(setup: CombatSetup, fights: number, bot: Bot, content: ContentRegistry, seedBase = 1): FightStats {
  let wins = 0;
  let turns = 0;
  let opsecLost = 0;
  let peakAlert = 0;
  let maxChain = 0;
  let turnCaps = 0;
  let stuck = 0;
  let suspectedInfinites = 0;

  for (let i = 0; i < fights; i++) {
    const result = runFight(setup, seedBase + i, bot, content);
    if (result.outcome === 'won') wins++;
    if (result.outcome === 'turnCap') turnCaps++;
    if (result.outcome === 'ongoing') stuck++;
    if (result.maxPlaysInTurn > SUSPICIOUS_PLAYS_PER_TURN) suspectedInfinites++;
    turns += result.turns;
    opsecLost += result.opsecLost;
    peakAlert += result.peakAlert;
    maxChain += result.maxChain;
  }

  return {
    fights,
    winRate: wins / fights,
    avgTurns: turns / fights,
    avgOpsecLost: opsecLost / fights,
    avgPeakAlert: peakAlert / fights,
    avgMaxChain: maxChain / fights,
    turnCaps,
    stuck,
    suspectedInfinites,
  };
}
