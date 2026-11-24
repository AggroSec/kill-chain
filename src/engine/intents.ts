/**
 * Enemy intent selection: picks each enemy's next move with the seeded RNG.
 */
import { isAlertInRange } from './alert';
import type { Rng } from './rng';
import type { EnemyDef, EnemyMove, EnemyState } from './types';

/**
 * True if picking `move` now would break its maxInARow limit.
 * Example: maxInARow 1 means the move can never be used twice in a row.
 */
function wouldExceedRepeatLimit(enemy: EnemyState, move: EnemyMove): boolean {
  if (move.maxInARow === undefined) return false;
  return enemy.lastMoveId === move.id && enemy.timesInARow >= move.maxInARow;
}

/** Is the move allowed at this Alert? (Moves without `whenAlert` always are.) */
function alertAllows(move: EnemyMove, alert: number): boolean {
  return move.whenAlert === undefined || isAlertInRange(alert, move.whenAlert.atLeast, move.whenAlert.atMost);
}

/** Chooses the enemy's next move id using weights, repeat limits and Alert conditions. */
export function chooseNextMove(enemy: EnemyState, def: EnemyDef, rng: Rng, alert: number): string {
  let candidates = def.moves.filter((move) => !wouldExceedRepeatLimit(enemy, move) && move.weight > 0 && alertAllows(move, alert));
  // Safety net: if data is set up so every move is blocked, allow any move.
  if (candidates.length === 0) candidates = [...def.moves];

  const index = rng.pickWeightedIndex(candidates.map((move) => move.weight));
  const chosen = candidates[index];
  if (chosen === undefined) throw new Error(`Enemy "${def.id}" has no moves`);
  return chosen.id;
}

/** Records that the enemy just used `moveId`, for repeat tracking. */
export function recordMoveUsed(enemy: EnemyState, moveId: string): void {
  if (enemy.lastMoveId === moveId) {
    enemy.timesInARow++;
  } else {
    enemy.lastMoveId = moveId;
    enemy.timesInARow = 1;
  }
}

/** Looks up a move by id, throwing a clear error for bad data. */
export function getMove(def: EnemyDef, moveId: string): EnemyMove {
  const move = def.moves.find((m) => m.id === moveId);
  if (move === undefined) throw new Error(`Enemy "${def.id}" has no move "${moveId}"`);
  return move;
}
