/**
 * Alert: a per-fight meter. Noisy cards raise it, some enemies raise it,
 * and some cards lower it. Higher levels make every enemy attack hit harder.
 */
import type { AlertLevelId } from './contentTypes';

/** Alert can't go above this. */
export const ALERT_MAX = 20;

export interface AlertLevel {
  id: AlertLevelId;
  /** Lowest Alert value that counts as this level. */
  min: number;
  /** Extra damage added to every enemy attack hit at this level. */
  enemyDamageBonus: number;
}

/** Lowest to highest. Each level starts at `min` and runs to the next level's min - 1. */
export const ALERT_LEVELS: readonly AlertLevel[] = [
  { id: 'quiet', min: 0, enemyDamageBonus: 0 },
  { id: 'noisy', min: 5, enemyDamageBonus: 1 },
  { id: 'detected', min: 10, enemyDamageBonus: 3 },
  { id: 'lockdown', min: 15, enemyDamageBonus: 5 },
];

/** Position of a level in ALERT_LEVELS (quiet = 0 ... lockdown = 3). */
export function alertLevelIndex(id: AlertLevelId): number {
  return ALERT_LEVELS.findIndex((level) => level.id === id);
}

/** The level a given Alert value falls into. */
export function getAlertLevel(alert: number): AlertLevel {
  let current = ALERT_LEVELS[0] as AlertLevel;
  for (const level of ALERT_LEVELS) {
    if (alert >= level.min) current = level;
  }
  return current;
}

/** Adds `amount` (may be negative) and clamps to 0..ALERT_MAX. */
export function clampAlert(alert: number, amount: number): number {
  return Math.min(ALERT_MAX, Math.max(0, alert + amount));
}

/** True if the current Alert level is within [atLeast, atMost] (either bound optional). */
export function isAlertInRange(alert: number, atLeast?: AlertLevelId, atMost?: AlertLevelId): boolean {
  const current = alertLevelIndex(getAlertLevel(alert).id);
  if (atLeast !== undefined && current < alertLevelIndex(atLeast)) return false;
  if (atMost !== undefined && current > alertLevelIndex(atMost)) return false;
  return true;
}
