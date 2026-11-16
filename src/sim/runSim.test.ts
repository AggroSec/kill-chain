import { describe, expect, it } from 'vitest';
import { RUN_TEST_CONTENT } from '../engine/__fixtures__/runContent';
import { playRun, RUN_BOTS, runRuns } from './runSim';

describe('run simulator', () => {
  it.each(RUN_BOTS.map((bot) => [bot.name, bot] as const))('%s bot always finishes runs', (_, bot) => {
    for (let seed = 1; seed <= 30; seed++) {
      const result = playRun('tester', seed, bot, RUN_TEST_CONTENT);
      expect(result.outcome, `seed ${seed}`).not.toBe('stuck');
      expect(result.floorReached).toBeGreaterThan(0);
      if (result.outcome === 'lost') expect(result.killedBy ?? 'event').toBeTruthy();
      if (result.outcome === 'won') expect(result.floorReached).toBe(RUN_TEST_CONTENT.config.floors + 1);
    }
  });

  it('is deterministic for a seed', () => {
    const bot = RUN_BOTS[1];
    if (bot === undefined) throw new Error('missing bot');
    expect(playRun('tester', 11, bot, RUN_TEST_CONTENT)).toEqual(playRun('tester', 11, bot, RUN_TEST_CONTENT));
  });

  it('aggregates win rate, cards, Tools and Safehouse choices', () => {
    const bot = RUN_BOTS[1];
    if (bot === undefined) throw new Error('missing bot');
    const stats = runRuns('tester', 40, bot, RUN_TEST_CONTENT);
    expect(stats.runs).toBe(40);
    expect(stats.stuck).toBe(0);
    expect(stats.winRate).toBeGreaterThanOrEqual(0);
    expect(stats.winRate).toBeLessThanOrEqual(1);
    expect(stats.cards.size).toBeGreaterThan(0);
    for (const [id, count] of stats.cards) {
      expect(RUN_TEST_CONTENT.cards[id]?.owner, id).toBe('tester');
      expect(count.wins).toBeLessThanOrEqual(count.runs);
    }
    expect(stats.safehouse.size).toBeGreaterThan(0);
  });
});
