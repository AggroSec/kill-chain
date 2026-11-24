/**
 * Meta progression (AggroSec, #22): class XP and levels, and Bounties.
 *
 * - Every finished run (won or lost) gives XP to the class played. The
 *   further you got, the more XP. Class levels unlock that class's cards.
 * - Bounties are account-wide goals. Earning one gives XP to the class you
 *   were playing and can unlock classes, cards or (later) game modes.
 *
 * Pure functions over plain data: the UI loads and saves the Profile, and
 * passes the locked card ids into startRun. Unlocks add variety, not power.
 */
import { alertLevelIndex, getAlertLevel } from '../alert';
import type { AlertLevelId } from '../contentTypes';
import type { RunConfig, RunState } from '../run/runTypes';

/** Something a level or Bounty unlocks. */
export type Unlock = { kind: 'class'; classId: string } | { kind: 'card'; cardId: string } | { kind: 'mode'; modeId: string };

/** What a finished run has to do to earn a Bounty. */
export type BountyCondition =
  | { kind: 'winRun' }
  | { kind: 'winAs'; classId: string }
  /** Beat this boss encounter (the run doesn't have to be won). */
  | { kind: 'beatBoss'; encounterId: string }
  /** Win without Alert ever going above this level in any fight. */
  | { kind: 'winWithAlertAtMost'; level: AlertLevelId }
  /** Win with this many cards or fewer in the Arsenal at the end. */
  | { kind: 'winWithArsenalAtMost'; size: number };

export interface BountyDef {
  id: string;
  name: string;
  /** The goal, as shown to the player. */
  description: string;
  condition: BountyCondition;
  /** XP for the class played when it's earned. */
  xp: number;
  unlocks: readonly Unlock[];
}

/** One class level. `xp` is the total XP needed to reach it. */
export interface ClassLevelDef {
  level: number;
  xp: number;
  unlocks: readonly Unlock[];
}

export interface ProgressionDef {
  /** Classes playable from the start. Others need an unlock. */
  startingClasses: readonly string[];
  /** Levels per class, lowest first. Level 0 (no entry) is the starting pool. */
  classLevels: Readonly<Record<string, readonly ClassLevelDef[]>>;
  bounties: readonly BountyDef[];
  /** XP per run: per floor cleared, per boss beaten, and for a win. */
  runXp: { perFloor: number; perBoss: number; win: number };
}

/** The player's saved progress. */
export interface Profile {
  /** Total XP per class id. */
  classXp: Record<string, number>;
  /** Ids of Bounties earned. */
  bounties: string[];
}

export function emptyProfile(): Profile {
  return { classXp: {}, bounties: [] };
}

/** What a finished run did, for XP and Bounties. */
export interface RunSummary {
  classId: string;
  won: boolean;
  /** Floors cleared across all acts (each act's boss counts as a floor). */
  floorsCleared: number;
  /** Boss encounter ids beaten. */
  bossesBeaten: readonly string[];
  /** Highest Alert in any fight. */
  peakAlert: number;
  arsenalSize: number;
}

/** Summarizes a finished run. */
export function summarizeRun(run: RunState, config: RunConfig): RunSummary {
  const floorsPerAct = config.floors + 1; // floors plus the boss
  const nodeFloor = run.currentNodeId === null ? 0 : (run.map.nodes[run.currentNodeId]?.floor ?? 0);
  // A node you died on wasn't cleared. A won run cleared every floor of its last act.
  const clearedThisAct = run.outcome === 'lost' ? Math.max(0, nodeFloor - 1) : nodeFloor;
  return {
    classId: run.classId,
    won: run.outcome === 'won',
    floorsCleared: (run.act - 1) * floorsPerAct + clearedThisAct,
    bossesBeaten: [...run.bossesBeaten],
    peakAlert: run.peakAlert,
    arsenalSize: run.deck.length,
  };
}

/** XP a run gives its class, before Bounties. */
export function runXp(summary: RunSummary, progression: ProgressionDef): number {
  const { perFloor, perBoss, win } = progression.runXp;
  return summary.floorsCleared * perFloor + summary.bossesBeaten.length * perBoss + (summary.won ? win : 0);
}

export function meetsCondition(summary: RunSummary, condition: BountyCondition): boolean {
  switch (condition.kind) {
    case 'winRun':
      return summary.won;
    case 'winAs':
      return summary.won && summary.classId === condition.classId;
    case 'beatBoss':
      return summary.bossesBeaten.includes(condition.encounterId);
    case 'winWithAlertAtMost':
      return summary.won && alertLevelIndex(getAlertLevel(summary.peakAlert).id) <= alertLevelIndex(condition.level);
    case 'winWithArsenalAtMost':
      return summary.won && summary.arsenalSize <= condition.size;
  }
}

/** The level a class is at with this much XP (0 if none reached). */
export function classLevel(xp: number, levels: readonly ClassLevelDef[]): number {
  let level = 0;
  for (const def of levels) {
    if (xp >= def.xp) level = def.level;
  }
  return level;
}

/** XP needed for the next level, or null at max level. */
export function nextLevelXp(xp: number, levels: readonly ClassLevelDef[]): number | null {
  return levels.find((def) => xp < def.xp)?.xp ?? null;
}

/** Everything unlocked so far: reached class levels and earned Bounties. */
export function earnedUnlocks(profile: Profile, progression: ProgressionDef): Unlock[] {
  const unlocks: Unlock[] = [];
  for (const [classId, levels] of Object.entries(progression.classLevels)) {
    const xp = profile.classXp[classId] ?? 0;
    for (const def of levels) if (xp >= def.xp) unlocks.push(...def.unlocks);
  }
  for (const bounty of progression.bounties) {
    if (profile.bounties.includes(bounty.id)) unlocks.push(...bounty.unlocks);
  }
  return unlocks;
}

/** Every card that some level or Bounty unlocks. */
function unlockableCardIds(progression: ProgressionDef): Set<string> {
  const all = [...Object.values(progression.classLevels).flatMap((levels) => levels), ...progression.bounties];
  return new Set(all.flatMap((def) => def.unlocks.flatMap((u) => (u.kind === 'card' ? [u.cardId] : []))));
}

/** Cards that exist but aren't unlocked yet. Passed to startRun so they never show up. */
export function lockedCardIds(profile: Profile, progression: ProgressionDef): string[] {
  const earned = new Set(earnedUnlocks(profile, progression).flatMap((u) => (u.kind === 'card' ? [u.cardId] : [])));
  return [...unlockableCardIds(progression)].filter((id) => !earned.has(id)).sort();
}

export function isClassUnlocked(classId: string, profile: Profile, progression: ProgressionDef): boolean {
  if (progression.startingClasses.includes(classId)) return true;
  return earnedUnlocks(profile, progression).some((u) => u.kind === 'class' && u.classId === classId);
}

/** What one run earned: shown on the run-end screen. */
export interface RunRewards {
  profile: Profile;
  /** XP from the run itself. */
  runXp: number;
  /** Bounties earned for the first time. */
  newBounties: BountyDef[];
  /** Total XP gained (run plus Bounties). */
  totalXp: number;
  levelBefore: number;
  levelAfter: number;
  /** Unlocks earned by this run (new levels and new Bounties). */
  newUnlocks: Unlock[];
}

/** Adds a finished run to the profile. Returns a new profile; the old one is unchanged. */
export function applyRun(profile: Profile, summary: RunSummary, progression: ProgressionDef): RunRewards {
  const levels = progression.classLevels[summary.classId] ?? [];
  const xpBefore = profile.classXp[summary.classId] ?? 0;
  const before = earnedUnlocks(profile, progression);

  const newBounties = progression.bounties.filter(
    (bounty) => !profile.bounties.includes(bounty.id) && meetsCondition(summary, bounty.condition),
  );
  const fromRun = runXp(summary, progression);
  const totalXp = fromRun + newBounties.reduce((sum, bounty) => sum + bounty.xp, 0);

  const next: Profile = {
    classXp: { ...profile.classXp, [summary.classId]: xpBefore + totalXp },
    bounties: [...profile.bounties, ...newBounties.map((bounty) => bounty.id)],
  };
  const after = earnedUnlocks(next, progression);
  const key = (u: Unlock) => JSON.stringify(u);
  const beforeKeys = new Set(before.map(key));

  return {
    profile: next,
    runXp: fromRun,
    newBounties,
    totalXp,
    levelBefore: classLevel(xpBefore, levels),
    levelAfter: classLevel(xpBefore + totalXp, levels),
    newUnlocks: after.filter((u) => !beforeKeys.has(key(u))),
  };
}
