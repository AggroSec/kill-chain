/**
 * Plays full runs headlessly (map → fights → Loot → ... → boss) and collects
 * the stats CLAUDE.md asks for: win rate, floor reached, card pick-to-win,
 * Tool win rate, plus Safehouse choices and causes of death.
 */
import { Rng, runReducer, startRun } from '../engine';
import type { RunAction, RunContent, RunState } from '../engine';
import { chainBot, greedyBot, randomBot } from './bots';
import type { Bot } from './bots';
import { SUSPICIOUS_PLAYS_PER_TURN } from './fightSim';
import { chooseRunAction } from './runBots';
import type { RunPolicy } from './runBots';
import { measureCardValues } from './cardValues';
import type { CardValues } from './cardValues';

/** Fights per encounter when measuring card values for the sensible bots. */
const CARD_VALUE_FIGHTS = 20;

/** A fight bot paired with a run-choice policy. */
export interface RunBot {
  name: string;
  fightBot: Bot;
  policy: RunPolicy;
}

export const RUN_BOTS: readonly RunBot[] = [
  { name: 'random', fightBot: randomBot, policy: 'random' },
  { name: 'greedy', fightBot: greedyBot, policy: 'sensible' },
  { name: 'chain', fightBot: chainBot, policy: 'sensible' },
];

/** Hard ceiling on actions per run, in case something never ends. */
const MAX_ACTIONS_PER_RUN = 100_000;

export type SafehouseChoice = 'LAY_LOW' | 'WEAPONIZE' | 'GO_DARK';

export interface RunResult {
  outcome: RunState['outcome'] | 'stuck';
  /** Floors reached across all acts (each act is floors + 1 with its boss). */
  floorReached: number;
  /** Act the run ended in. */
  actReached: number;
  finalTargetId: string;
  /** Encounter that burned the run, if a fight did. */
  killedBy: string | null;
  /** Cards added by Loot or bought at the Dark Web (not starters). */
  cardsGained: string[];
  tools: string[];
  safehouseChoices: SafehouseChoice[];
  /** Fights lost by hitting the turn cap. */
  turnCaps: number;
  /** Turns with more than SUSPICIOUS_PLAYS_PER_TURN card plays. */
  suspectedInfinites: number;
}

export function playRun(
  classId: string,
  seed: number,
  bot: RunBot,
  content: RunContent,
  values?: CardValues,
  lockedCardIds: readonly string[] = [],
): RunResult {
  const rng = new Rng(seed ^ 0x2545f491);
  let run = startRun(classId, seed, content, { lockedCardIds });
  const result: RunResult = {
    outcome: 'stuck',
    floorReached: 0,
    actReached: 1,
    finalTargetId: run.finalTargetId,
    killedBy: null,
    cardsGained: [],
    tools: [],
    safehouseChoices: [],
    turnCaps: 0,
    suspectedInfinites: 0,
  };
  let playsThisTurn = 0;

  for (let step = 0; step < MAX_ACTIONS_PER_RUN && run.outcome === 'ongoing'; step++) {
    const phase = run.phase;
    let action: RunAction;
    if (phase.kind === 'combat') {
      const combatAction = bot.fightBot.chooseAction(phase.combat, content, rng);
      playsThisTurn = combatAction.type === 'PLAY_CARD' ? playsThisTurn + 1 : 0;
      if (playsThisTurn === SUSPICIOUS_PLAYS_PER_TURN + 1) result.suspectedInfinites++;
      action = { type: 'COMBAT', action: combatAction };
    } else {
      action = chooseRunAction(run, content, bot.policy, rng, values);
    }

    const next = runReducer(run, action, content);
    if (next === run) {
      // An invalid bot choice would loop forever; count the run as stuck.
      return result;
    }
    recordAction(result, run, action, next);
    run = next;
  }

  if (run.outcome !== 'ongoing') result.outcome = run.outcome;
  const nodeFloor = run.currentNodeId === null ? 0 : (run.map.nodes[run.currentNodeId]?.floor ?? 0);
  result.floorReached = (run.act - 1) * (content.config.floors + 1) + nodeFloor;
  result.actReached = run.act;
  result.tools = [...run.tools];
  return result;
}

/** Notes what an action did, for the stats. */
function recordAction(result: RunResult, before: RunState, action: RunAction, after: RunState): void {
  const phase = before.phase;
  if (action.type === 'PICK_LOOT_CARD' && phase.kind === 'loot') {
    const card = phase.loot.cardChoices[action.index];
    if (card !== undefined) result.cardsGained.push(card);
  }
  if (action.type === 'BUY_CARD' && phase.kind === 'darkWeb') {
    const item = phase.cards[action.index];
    if (item !== undefined) result.cardsGained.push(item.id);
  }
  if (action.type === 'LAY_LOW' || action.type === 'WEAPONIZE' || action.type === 'GO_DARK') {
    result.safehouseChoices.push(action.type);
  }
  // A lost fight burns the run, and the run keeps the final combat state.
  if (phase.kind === 'combat' && after.outcome === 'lost') {
    result.killedBy = phase.encounterId;
    if (after.phase.kind === 'combat' && after.phase.combat.outcome === 'turnCap') result.turnCaps++;
  }
}

// ---------------------------------------------------------------------------
// Aggregates
// ---------------------------------------------------------------------------

export interface WinCount {
  runs: number;
  wins: number;
}

export interface RunStats {
  runs: number;
  winRate: number;
  avgFloor: number;
  stuck: number;
  turnCaps: number;
  suspectedInfinites: number;
  /** Runs where each card was gained at least once, and how many of those were won. */
  cards: Map<string, WinCount>;
  /** Runs that ended holding each Tool, and how many of those were won. */
  tools: Map<string, WinCount>;
  /** Each Safehouse choice, and how many of the runs it was made in were won. */
  safehouse: Map<SafehouseChoice, WinCount>;
  /** Run losses by encounter id. */
  killedBy: Map<string, number>;
  /** Runs that reached each act (index 0 = Act 1). */
  reachedAct: number[];
  /** Runs and wins per Final Target. */
  targets: Map<string, WinCount>;
  /** Runs that reached Act 3, and wins, per Final Target (the target's own difficulty). */
  targetsReached: Map<string, WinCount>;
}

function bump<K>(map: Map<K, WinCount>, key: K, won: boolean): void {
  const entry = map.get(key) ?? { runs: 0, wins: 0 };
  entry.runs++;
  if (won) entry.wins++;
  map.set(key, entry);
}

export function runRuns(
  classId: string,
  runs: number,
  bot: RunBot,
  content: RunContent,
  seedBase = 1,
  lockedCardIds: readonly string[] = [],
): RunStats {
  const stats: RunStats = {
    runs,
    winRate: 0,
    avgFloor: 0,
    stuck: 0,
    turnCaps: 0,
    suspectedInfinites: 0,
    cards: new Map(),
    tools: new Map(),
    safehouse: new Map(),
    killedBy: new Map(),
    reachedAct: Array<number>(content.config.acts).fill(0),
    targets: new Map(),
    targetsReached: new Map(),
  };
  let wins = 0;
  let floors = 0;
  // The sensible policy picks cards by measured value (measured once per class).
  const values = bot.policy === 'sensible' ? measureCardValues(classId, content, bot.fightBot, CARD_VALUE_FIGHTS, lockedCardIds) : undefined;

  for (let i = 0; i < runs; i++) {
    const result = playRun(classId, seedBase + i, bot, content, values, lockedCardIds);
    const won = result.outcome === 'won';
    for (let a = 0; a < result.actReached; a++) stats.reachedAct[a] = (stats.reachedAct[a] ?? 0) + 1;
    bump(stats.targets, result.finalTargetId, won);
    if (result.actReached >= content.config.acts) bump(stats.targetsReached, result.finalTargetId, won);
    if (won) wins++;
    if (result.outcome === 'stuck') stats.stuck++;
    floors += result.floorReached;
    stats.turnCaps += result.turnCaps;
    stats.suspectedInfinites += result.suspectedInfinites;
    for (const card of new Set(result.cardsGained)) bump(stats.cards, card, won);
    for (const tool of result.tools) bump(stats.tools, tool, won);
    for (const choice of new Set(result.safehouseChoices)) bump(stats.safehouse, choice, won);
    if (result.killedBy !== null) stats.killedBy.set(result.killedBy, (stats.killedBy.get(result.killedBy) ?? 0) + 1);
  }

  stats.winRate = wins / runs;
  stats.avgFloor = floors / runs;
  return stats;
}
