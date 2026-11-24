import { describe, expect, it } from 'vitest';
import { applyRun, classLevel, emptyProfile, isClassUnlocked, lockedCardIds, meetsCondition, nextLevelXp, runXp } from './progression';
import type { ProgressionDef, RunSummary } from './progression';

const progression: ProgressionDef = {
  startingClasses: ['a'],
  runXp: { perFloor: 1, perBoss: 10, win: 20 },
  classLevels: {
    a: [
      { level: 1, xp: 40, unlocks: [{ kind: 'card', cardId: 'a1' }] },
      { level: 2, xp: 120, unlocks: [{ kind: 'card', cardId: 'a2' }] },
    ],
    b: [{ level: 1, xp: 40, unlocks: [{ kind: 'card', cardId: 'b1' }] }],
  },
  bounties: [
    { id: 'win', name: 'Win', description: '', condition: { kind: 'winRun' }, xp: 25, unlocks: [{ kind: 'class', classId: 'b' }] },
    { id: 'win-a', name: 'Win A', description: '', condition: { kind: 'winAs', classId: 'a' }, xp: 20, unlocks: [{ kind: 'card', cardId: 'a-bounty' }] },
    { id: 'boss', name: 'Boss', description: '', condition: { kind: 'beatBoss', encounterId: 'act2-boss' }, xp: 15, unlocks: [] },
    { id: 'quiet', name: 'Quiet', description: '', condition: { kind: 'winWithAlertAtMost', level: 'noisy' }, xp: 5, unlocks: [] },
    { id: 'small', name: 'Small', description: '', condition: { kind: 'winWithArsenalAtMost', size: 12 }, xp: 5, unlocks: [] },
  ],
};

const loss: RunSummary = { classId: 'a', won: false, floorsCleared: 20, bossesBeaten: ['act1-boss'], peakAlert: 12, arsenalSize: 20 };
const win: RunSummary = {
  classId: 'a',
  won: true,
  floorsCleared: 39,
  bossesBeaten: ['act1-boss', 'act2-boss', 'act3-boss'],
  peakAlert: 9,
  arsenalSize: 12,
};

describe('run XP', () => {
  it('is floors cleared + 10 per boss + 20 for a win', () => {
    expect(runXp(loss, progression)).toBe(20 + 10);
    expect(runXp(win, progression)).toBe(39 + 30 + 20);
  });
});

describe('Bounty conditions', () => {
  it('check the run summary', () => {
    expect(meetsCondition(win, { kind: 'winRun' })).toBe(true);
    expect(meetsCondition(loss, { kind: 'winRun' })).toBe(false);
    expect(meetsCondition(win, { kind: 'winAs', classId: 'b' })).toBe(false);
    expect(meetsCondition(loss, { kind: 'beatBoss', encounterId: 'act1-boss' })).toBe(true);
    expect(meetsCondition(win, { kind: 'winWithAlertAtMost', level: 'noisy' })).toBe(true); // 9 is Noisy
    expect(meetsCondition({ ...win, peakAlert: 10 }, { kind: 'winWithAlertAtMost', level: 'noisy' })).toBe(false);
    expect(meetsCondition(win, { kind: 'winWithArsenalAtMost', size: 12 })).toBe(true);
    expect(meetsCondition({ ...win, arsenalSize: 13 }, { kind: 'winWithArsenalAtMost', size: 12 })).toBe(false);
  });
});

describe('levels', () => {
  it('count reached thresholds', () => {
    const levels = progression.classLevels.a ?? [];
    expect(classLevel(0, levels)).toBe(0);
    expect(classLevel(40, levels)).toBe(1);
    expect(classLevel(500, levels)).toBe(2);
    expect(nextLevelXp(50, levels)).toBe(120);
    expect(nextLevelXp(500, levels)).toBeNull();
  });
});

describe('unlocks', () => {
  it('a fresh profile has every unlockable card locked and only starting classes', () => {
    const profile = emptyProfile();
    expect(lockedCardIds(profile, progression)).toEqual(['a-bounty', 'a1', 'a2', 'b1']);
    expect(isClassUnlocked('a', profile, progression)).toBe(true);
    expect(isClassUnlocked('b', profile, progression)).toBe(false);
  });

  it('a loss gives class XP and can reach a level', () => {
    const rewards = applyRun({ classXp: { a: 15 }, bounties: [] }, loss, progression);
    expect(rewards.runXp).toBe(30);
    expect(rewards.profile.classXp.a).toBe(45);
    expect(rewards.levelBefore).toBe(0);
    expect(rewards.levelAfter).toBe(1);
    expect(rewards.newUnlocks).toEqual([{ kind: 'card', cardId: 'a1' }]);
    expect(lockedCardIds(rewards.profile, progression)).not.toContain('a1');
  });

  it('a win earns Bounties once, adds their XP to the class played, and unlocks classes', () => {
    const first = applyRun(emptyProfile(), win, progression);
    expect(first.newBounties.map((b) => b.id)).toEqual(['win', 'win-a', 'boss', 'quiet', 'small']);
    expect(first.totalXp).toBe(89 + 25 + 20 + 15 + 5 + 5);
    expect(isClassUnlocked('b', first.profile, progression)).toBe(true);
    expect(first.newUnlocks).toContainEqual({ kind: 'class', classId: 'b' });

    const second = applyRun(first.profile, win, progression);
    expect(second.newBounties).toEqual([]);
    expect(second.totalXp).toBe(89);
  });

  it('never changes the profile passed in', () => {
    const profile = emptyProfile();
    applyRun(profile, win, progression);
    expect(profile).toEqual(emptyProfile());
  });
});
