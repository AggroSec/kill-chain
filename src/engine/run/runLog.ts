/**
 * Run logs: a short text record of a run that can be pasted into a bug
 * report and replayed exactly.
 *
 * Because the engine is deterministic, a run is fully described by its
 * class, its seed and the list of actions the player took. Replaying those
 * actions with the same build of the game reproduces every draw, intent and
 * Loot roll. The build id matters: if cards or enemies changed since the
 * log was made, the replay can drift.
 *
 * Text format (one "key: value" per line, order doesn't matter):
 *
 *   kill-chain run log v1
 *   build: 1a2b3c4
 *   class: exploit-dev
 *   seed: 123456
 *   result: lost on floor 12
 *   locked: card-a card-b
 *   actions: n:1-2 p0.0 p1.0 e ...
 *
 * "locked" lists the cards the player hadn't unlocked yet (they change
 * what Loot can offer). It's left out when nothing is locked.
 *
 * Each action is one short token (see encodeAction). A save from before
 * logging existed has no action list; its log carries the final run state
 * as JSON on a "state:" line instead, which is less useful but better than nothing.
 */
import type { CombatAction } from '../types';
import type { RunAction, RunContent, RunState } from './runTypes';
import { runReducer, startRun } from './run';

export const RUN_LOG_HEADER = 'kill-chain run log v1';

export interface RunLog {
  build: string;
  classId: string;
  seed: number;
  /** Free text written when the log was exported, e.g. "lost on floor 12". */
  result: string;
  /** Cards that were still locked for this run (see RunOptions). */
  lockedCardIds?: readonly string[];
  /** null when the run was saved before logging existed. */
  actions: RunAction[] | null;
  /** Only for logs without actions: the last saved state. */
  state?: RunState;
}

// --- Action tokens ---

function encodeCombat(action: CombatAction): string {
  return action.type === 'END_TURN' ? 'e' : `p${action.handIndex}.${action.targetIndex}`;
}

/** One action as a short token, e.g. "p2.0" = play hand card 2 at enemy 0. */
export function encodeAction(action: RunAction): string {
  switch (action.type) {
    case 'CHOOSE_NODE':
      return `n:${action.nodeId}`;
    case 'COMBAT':
      return encodeCombat(action.action);
    case 'PICK_LOOT_CARD':
      return `l${action.index}`;
    case 'SKIP_LOOT':
      return 's';
    case 'EVENT_CHOICE':
      return action.deckIndex === undefined ? `v${action.index}` : `v${action.index}.${action.deckIndex}`;
    case 'LAY_LOW':
      return 'r';
    case 'WEAPONIZE':
      return `w${action.deckIndex}`;
    case 'GO_DARK':
      return `g${action.deckIndex}`;
    case 'BUY_CARD':
      return `bc${action.index}`;
    case 'BUY_TOOL':
      return `bt${action.index}`;
    case 'BUY_WIPE':
      return `bw${action.deckIndex}`;
    case 'LEAVE':
      return 'x';
  }
}

/** Reads a whole non-negative number, or throws. */
function readIndex(text: string | undefined, token: string): number {
  const value = Number(text);
  if (text === undefined || text === '' || !Number.isInteger(value) || value < 0) {
    throw new Error(`Bad action "${token}" in run log`);
  }
  return value;
}

/** The reverse of encodeAction. Throws on anything it doesn't recognise. */
export function decodeAction(token: string): RunAction {
  if (token.startsWith('n:')) return { type: 'CHOOSE_NODE', nodeId: token.slice(2) };
  if (token === 'e') return { type: 'COMBAT', action: { type: 'END_TURN' } };
  if (token === 's') return { type: 'SKIP_LOOT' };
  if (token === 'r') return { type: 'LAY_LOW' };
  if (token === 'x') return { type: 'LEAVE' };

  // Tokens with numbers: a prefix, then "a" or "a.b".
  const match = /^(bc|bt|bw|[plvwg])(\d+)(?:\.(\d+))?$/.exec(token);
  if (match === null) throw new Error(`Bad action "${token}" in run log`);
  const [, prefix, first, second] = match;
  const a = readIndex(first, token);
  switch (prefix) {
    case 'p':
      return { type: 'COMBAT', action: { type: 'PLAY_CARD', handIndex: a, targetIndex: readIndex(second, token) } };
    case 'l':
      return { type: 'PICK_LOOT_CARD', index: a };
    case 'v':
      return second === undefined ? { type: 'EVENT_CHOICE', index: a } : { type: 'EVENT_CHOICE', index: a, deckIndex: readIndex(second, token) };
    case 'w':
      return { type: 'WEAPONIZE', deckIndex: a };
    case 'g':
      return { type: 'GO_DARK', deckIndex: a };
    case 'bc':
      return { type: 'BUY_CARD', index: a };
    case 'bt':
      return { type: 'BUY_TOOL', index: a };
    case 'bw':
      return { type: 'BUY_WIPE', deckIndex: a };
    default:
      throw new Error(`Bad action "${token}" in run log`);
  }
}

// --- Whole log ---

export function formatRunLog(log: RunLog): string {
  const lines = [RUN_LOG_HEADER, `build: ${log.build}`, `class: ${log.classId}`, `seed: ${log.seed}`, `result: ${log.result}`];
  if (log.lockedCardIds !== undefined && log.lockedCardIds.length > 0) lines.push(`locked: ${log.lockedCardIds.join(' ')}`);
  if (log.actions !== null) {
    lines.push(`actions: ${log.actions.map(encodeAction).join(' ')}`);
  } else {
    lines.push('actions: (not recorded)');
    if (log.state !== undefined) lines.push(`state: ${JSON.stringify(log.state)}`);
  }
  return lines.join('\n');
}

/**
 * Parses a pasted log. Tolerates extra text around it (Markdown fences,
 * a note from the player) by only reading lines that look like "key: value"
 * after the header line.
 */
export function parseRunLog(text: string): RunLog {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const start = lines.indexOf(RUN_LOG_HEADER);
  if (start === -1) throw new Error(`Not a run log: missing "${RUN_LOG_HEADER}" line`);

  const fields = new Map<string, string>();
  for (const line of lines.slice(start + 1)) {
    const colon = line.indexOf(':');
    if (colon <= 0) continue;
    const key = line.slice(0, colon).trim();
    // The first value wins, so text pasted after the log can't override it.
    if (!fields.has(key)) fields.set(key, line.slice(colon + 1).trim());
  }

  const classId = fields.get('class');
  const seed = Number(fields.get('seed'));
  if (classId === undefined || classId === '') throw new Error('Run log has no class');
  if (!Number.isInteger(seed) || fields.get('seed') === undefined) throw new Error('Run log has no valid seed');

  const actionText = fields.get('actions') ?? '';
  const recorded = actionText !== '(not recorded)';
  const log: RunLog = {
    build: fields.get('build') ?? 'unknown',
    classId,
    seed,
    result: fields.get('result') ?? '',
    actions: recorded ? actionText.split(/\s+/).filter((t) => t !== '').map(decodeAction) : null,
  };
  const locked = fields.get('locked');
  if (locked !== undefined) log.lockedCardIds = locked.split(/\s+/).filter((id) => id !== '');
  const state = fields.get('state');
  if (state !== undefined) log.state = JSON.parse(state) as RunState;
  return log;
}

/** One replayed step: the action and the states either side of it. */
export interface ReplayStep {
  index: number;
  action: RunAction;
  before: RunState;
  after: RunState;
  /** False when the engine rejected the action (the log and build don't match). */
  valid: boolean;
}

/**
 * Replays a log from the start. Stops at the first rejected action, since
 * every later action would be applied to the wrong state.
 */
export function replayRun(log: RunLog, content: RunContent): { start: RunState; steps: ReplayStep[]; final: RunState } {
  const start = startRun(log.classId, log.seed, content, { lockedCardIds: log.lockedCardIds ?? [] });
  const steps: ReplayStep[] = [];
  let state = start;
  for (const [index, action] of (log.actions ?? []).entries()) {
    const next = runReducer(state, action, content);
    const valid = next !== state;
    steps.push({ index, action, before: state, after: next, valid });
    if (!valid) break;
    state = next;
  }
  return { start, steps, final: state };
}
