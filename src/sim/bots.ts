/**
 * Bots that play fights for the simulator. They only use the public engine API
 * (legal moves + the reducer), exactly like the UI does.
 *
 * - random: plays random legal cards until it can't, then ends the turn.
 * - greedy: tries every legal play, scores the resulting state, and takes the
 *   best one if it improves things. A rough stand-in for a sensible player.
 * - chain: greedy, but it also values building Chain stacks.
 */
import { combatReducer, getEnemyDef, incomingDamage, isEnemyAlive, livingEnemyIndexes, whyCantPlay } from '../engine';
import type { CombatAction, CombatState, ContentRegistry, Rng } from '../engine';
import { CORE_STATUS, getStacks, implantIds } from '../engine';

export interface Bot {
  name: string;
  chooseAction(state: CombatState, content: ContentRegistry, rng: Rng): CombatAction;
}

const END_TURN: CombatAction = { type: 'END_TURN' };

/** Every legal PLAY_CARD action right now (one per card x valid target). */
export function legalPlays(state: CombatState, content: ContentRegistry): CombatAction[] {
  const targets = livingEnemyIndexes(state);
  const actions: CombatAction[] = [];
  state.player.hand.forEach((_, handIndex) => {
    for (const targetIndex of targets) {
      if (whyCantPlay(state, handIndex, targetIndex, content) === null) {
        actions.push({ type: 'PLAY_CARD', handIndex, targetIndex });
      }
    }
  });
  return actions;
}

export const randomBot: Bot = {
  name: 'random',
  chooseAction(state, content, rng) {
    const plays = legalPlays(state, content);
    return plays[rng.nextInt(plays.length || 1)] ?? END_TURN;
  },
};

/**
 * How good a state looks for the Operator, as one number.
 * Weights are hand-tuned guesses; they only need to make the bot "reasonable".
 */
function evaluate(state: CombatState, content: ContentRegistry, chainWeight: number): number {
  if (state.outcome === 'won') return 10_000;
  if (state.outcome === 'lost') return -10_000;

  let score = 0;
  // Damage we're about to take this enemy turn (after block) is the biggest cost.
  score -= 1.3 * Math.max(0, incomingDamage(state, content) - state.player.block);
  score += 0.2 * state.player.opsec;

  for (const enemy of state.enemies) {
    if (!isEnemyAlive(enemy)) {
      score += 12; // a dead enemy never attacks again
      continue;
    }
    score -= enemy.integrity;
    // Stripping block is worth something: it lets the next hit land. Without
    // this, a first hit that only removes block looks useless and the bot
    // ends its turn against block-heavy enemies forever.
    score -= 0.5 * enemy.block;
    score += 2.5 * getStacks(enemy.statuses, CORE_STATUS.vuln);
    score += 2 * getStacks(enemy.statuses, CORE_STATUS.exposed);
    score += 1.5 * getStacks(enemy.statuses, CORE_STATUS.throttled);
    // Honeypot-style enemies: hitting them costs Alert, which the Alert term below covers.
    if (getEnemyDef(content, enemy.defId).tier === 'elite') score -= 0.2 * enemy.integrity;
  }

  score -= 0.8 * state.alert;
  score += 8 * implantIds(state.player.statuses, content).length;
  score += 1.5 * state.player.hand.length + 1 * state.player.cycles;
  score += chainWeight * state.chain.count;
  return score;
}

function makeLookaheadBot(name: string, chainWeight: number): Bot {
  return {
    name,
    chooseAction(state, content) {
      const baseline = evaluate(state, content, chainWeight);
      let best: CombatAction = END_TURN;
      let bestGain = 0;
      for (const action of legalPlays(state, content)) {
        const gain = evaluate(combatReducer(state, action, content), content, chainWeight) - baseline;
        if (gain > bestGain) {
          bestGain = gain;
          best = action;
        }
      }
      return best;
    },
  };
}

export const greedyBot = makeLookaheadBot('greedy', 0);
export const chainBot = makeLookaheadBot('chain', 2);

export const BOTS: readonly Bot[] = [randomBot, greedyBot, chainBot];
