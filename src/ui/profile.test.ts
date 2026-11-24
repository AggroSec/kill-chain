import { describe, expect, it } from 'vitest';
import { emptyProfile, startRun } from '../engine';
import { CONTENT } from '../data/content';
import { PROGRESSION } from '../data/progression';
import { loadProfile, recordFinishedRun } from './profile';

describe('profile', () => {
  it('falls back to a fresh profile when storage is unavailable', () => {
    // Tests run in Node, where localStorage doesn't exist.
    expect(loadProfile()).toEqual(emptyProfile());
  });

  it('a lost run gives XP to its class and nothing else', () => {
    const run = { ...startRun('exploit-dev', 1, CONTENT), outcome: 'lost' as const, act: 2 };
    run.currentNodeId = Object.values(run.map.nodes).find((n) => n.floor === 5)?.id ?? null;
    const { profile, rewards } = recordFinishedRun(emptyProfile(), run, CONTENT.config, PROGRESSION);
    // Act 1 (13 floors) + 4 floors cleared in Act 2.
    expect(rewards.runXp).toBe(17);
    expect(profile.classXp).toEqual({ 'exploit-dev': 17 });
    expect(rewards.newBounties).toEqual([]);
  });

  it('a win unlocks the Insider', () => {
    const run = { ...startRun('social-engineer', 1, CONTENT), outcome: 'won' as const, act: 3, bossesBeaten: ['a1-incident-response', 'a2-domain-controller', 'ot-sis'] };
    run.currentNodeId = run.map.bossId;
    const { rewards } = recordFinishedRun(emptyProfile(), run, CONTENT.config, PROGRESSION);
    expect(rewards.newUnlocks).toContainEqual({ kind: 'class', classId: 'insider' });
    expect(rewards.newBounties.map((b) => b.id)).toEqual(expect.arrayContaining(['first-exfil', 'smooth-operator', 'domain-dominance', 'safety-off']));
  });
});
