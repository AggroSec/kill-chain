/**
 * Saves the current run in localStorage so a refresh (or a phone locking)
 * doesn't lose it. Every read and write is wrapped in try/catch: private
 * browsing or full storage just means no save, never a crash.
 */
import type { RunState } from '../engine';

/** Bump this when RunState changes shape, so old saves are ignored instead of breaking. */
const SAVE_KEY = 'kill-chain.run.v1';

export interface SavedRun {
  seed: number;
  run: RunState;
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
