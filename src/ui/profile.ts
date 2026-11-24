/**
 * The player's saved progress (class XP and earned Bounties) in localStorage.
 * Like every save, reads and writes are wrapped in try/catch: if storage is
 * unavailable, the game just starts from a fresh profile.
 */
import { applyRun, emptyProfile, summarizeRun } from '../engine';
import type { Profile, ProgressionDef, RunConfig, RunRewards, RunState } from '../engine';

const PROFILE_KEY = 'kill-chain.profile.v1';

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw === null) return emptyProfile();
    const parsed = JSON.parse(raw) as Partial<Profile>;
    const classXp: Record<string, number> = {};
    for (const [id, xp] of Object.entries(parsed.classXp ?? {})) {
      if (typeof xp === 'number' && xp >= 0) classXp[id] = xp;
    }
    const bounties = Array.isArray(parsed.bounties) ? parsed.bounties.filter((id): id is string => typeof id === 'string') : [];
    return { classXp, bounties };
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Storage unavailable: progress just won't be kept.
  }
}

/** What the run-end screen shows. Saved with the run so a refresh doesn't hand out XP twice. */
export type RewardsSummary = Omit<RunRewards, 'profile'>;

/**
 * Adds a finished run to the profile and saves it. Returns the new profile
 * and what was earned. Call once per finished run (the caller marks the run).
 */
export function recordFinishedRun(
  profile: Profile,
  run: RunState,
  config: RunConfig,
  progression: ProgressionDef,
): { profile: Profile; rewards: RewardsSummary } {
  const { profile: next, ...rewards } = applyRun(profile, summarizeRun(run, config), progression);
  saveProfile(next);
  return { profile: next, rewards };
}
