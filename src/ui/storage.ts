/**
 * Saves the current run in localStorage so a refresh (or a phone locking)
 * doesn't lose it, and keeps logs of the last few runs for bug reports.
 * Every read and write is wrapped in try/catch: private browsing or full
 * storage just means no save, never a crash.
 */
import { formatRunLog } from '../engine';
import type { RunAction, RunState } from '../engine';

/** Bump this when RunState changes shape, so old saves are ignored instead of breaking. */
const SAVE_KEY = 'kill-chain.run.v1';
/** Formatted logs of finished or abandoned runs, newest first. */
const LOG_HISTORY_KEY = 'kill-chain.runLogs.v1';
/** How many old run logs to keep. Each is a few KB. */
const LOG_HISTORY_SIZE = 5;

/** Short commit id of this build, injected by vite.config.ts. */
export const BUILD_ID: string = __BUILD_ID__;

export interface SavedRun {
  seed: number;
  run: RunState;
  /**
   * Every action taken this run, in order, so the run can be replayed from
   * its seed. Missing on saves made before run logs existed.
   */
  actions?: RunAction[];
}

/** An archived run log: the text plus a label for the list. */
export interface LogEntry {
  label: string;
  text: string;
}

export function loadRun(): SavedRun | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as SavedRun;
    // Light sanity check; a malformed save is treated as no save.
    if (typeof parsed.seed !== 'number' || typeof parsed.run.classId !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveRun(saved: SavedRun): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
  } catch {
    // Storage unavailable or full: the run just won't survive a refresh.
  }
}

export function clearRun(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Nothing to do.
  }
}

/** The floor the Operator reached (0 before the first node). */
export function floorOf(run: RunState): number {
  return run.currentNodeId === null ? 0 : (run.map.nodes[run.currentNodeId]?.floor ?? 0);
}

/** e.g. "lost on floor 13 (OpSec 0/75)". Written into the log so a reader knows what to expect. */
export function resultText(run: RunState): string {
  // Mid-fight, the run's OpSec isn't updated until the fight ends; read the fight's.
  const opsec = run.phase.kind === 'combat' ? run.phase.combat.player.opsec : run.opsec;
  const where = `floor ${floorOf(run)} (OpSec ${opsec}/${run.maxOpsec})`;
  if (run.outcome === 'won') return 'won';
  if (run.outcome === 'lost') return `lost on ${where}`;
  return `in progress on ${where}`;
}

/** The pasteable log text for a saved run. */
export function runLogText(saved: SavedRun): string {
  return formatRunLog({
    build: BUILD_ID,
    classId: saved.run.classId,
    seed: saved.seed,
    result: resultText(saved.run),
    actions: saved.actions ?? null,
    // Old saves have no actions; include the final state so there's still something to look at.
    ...(saved.actions === undefined ? { state: saved.run } : {}),
  });
}

export function loadLogHistory(): LogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_HISTORY_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw) as LogEntry[];
    return Array.isArray(parsed) ? parsed.filter((e) => typeof e.label === 'string' && typeof e.text === 'string') : [];
  } catch {
    return [];
  }
}

/** Adds a log to the front of the history, dropping the oldest past LOG_HISTORY_SIZE. */
export function archiveLog(entry: LogEntry): void {
  try {
    const history = [entry, ...loadLogHistory()].slice(0, LOG_HISTORY_SIZE);
    localStorage.setItem(LOG_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Storage unavailable or full: the old log is lost, the game carries on.
  }
}
