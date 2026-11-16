import { describe, expect, it } from 'vitest';
import { TEST_CONTENT, makeSetup } from '../engine/__fixtures__/testContent';
import type { CardDef, ContentRegistry } from '../engine';
import { BOTS, greedyBot, randomBot } from './bots';
import { runFight, runFights, SUSPICIOUS_PLAYS_PER_TURN } from './fightSim';

describe('fight simulator', () => {
  it('lookahead bots chip through block instead of stalling (regression)', () => {
    // Walls only ever block 8, so the first Strike each turn just strips block.
    const setup = makeSetup({ deck: Array<string>(10).fill('strike'), enemies: ['wall', 'wall'] });
    for (const bot of BOTS.filter((b) => b !== randomBot)) {
      expect(runFights(setup, 10, bot, TEST_CONTENT).winRate, bot.name).toBe(1);
    }
  });

  it('every bot finishes fights', () => {
    for (const bot of BOTS) {
      const stats = runFights(makeSetup(), 20, bot, TEST_CONTENT);
      expect(stats.stuck, bot.name).toBe(0);
      expect(stats.winRate + stats.turnCaps / 20, bot.name).toBeGreaterThan(0);
    }
  });

  it('is deterministic for the same seeds', () => {
    expect(runFights(makeSetup(), 20, greedyBot, TEST_CONTENT)).toEqual(runFights(makeSetup(), 20, greedyBot, TEST_CONTENT));
  });

  it('flags infinite combos', () => {
    // A free card that draws itself back: the deck is just copies of it, so a
    // random bot (which plays whenever anything is legal) loops forever in one turn.
    const loop: CardDef = {
      id: 'loop',
      name: 'loop',
      type: 'skill',
      tactic: 'discovery',
      rarity: 'starter',
      owner: 'neutral',
      cost: 0,
      effects: [
        { kind: 'block', amount: 1 },
        { kind: 'draw', count: 1 },
      ],
    };
    const content: ContentRegistry = { ...TEST_CONTENT, cards: { ...TEST_CONTENT.cards, loop } };
    const result = runFight(makeSetup({ deck: ['loop', 'loop'] }), 1, randomBot, content);
    expect(result.maxPlaysInTurn).toBeGreaterThan(SUSPICIOUS_PLAYS_PER_TURN);
  });
});
