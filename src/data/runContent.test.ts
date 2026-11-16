/**
 * Checks on the run-level game data: v2s, class pools, Tools, Intel events,
 * encounter pools and the run config. Also a smoke test that full runs finish.
 */
import { describe, expect, it } from 'vitest';
import { classCardPool, isUpgraded, upgradedId } from '../engine';
import { RUN_BOTS, playRun } from '../sim/runSim';
import { CARD_LIST } from './cards';
import { CLASS_LIST } from './classes';
import { CONTENT } from './content';
import { EVENT_LIST } from './events';
import { RUN_CONFIG } from './runConfig';
import { TOOL_LIST } from './tools';

describe('v2 upgrades', () => {
  it('every card has a v2 that actually changes something', () => {
    for (const card of CARD_LIST) {
      const v2 = CONTENT.cards[upgradedId(card.id)];
      expect(v2, `${card.id} has no v2`).toBeDefined();
      const same = v2?.cost === card.cost && v2.effects === card.effects && v2.keywords === card.keywords;
      expect(same, `${card.id} v2 is identical`).toBe(false);
    }
  });

  it('v2 cards are never offered as Loot', () => {
    for (const cls of CLASS_LIST) {
      for (const card of classCardPool(CONTENT, cls.id)) expect(isUpgraded(card.id), card.id).toBe(false);
    }
  });
});

describe('class pools', () => {
  it.each(CLASS_LIST.map((cls) => [cls.id] as const))('%s has a 20-card Loot pool with every Loot rarity', (classId) => {
    expect(classCardPool(CONTENT, classId)).toHaveLength(20);
    const rarities = new Set(classCardPool(CONTENT, classId).map((card) => card.rarity));
    expect([...rarities].sort()).toEqual(['private', 'public', 'zero-day']);
  });
});

describe('Tools', () => {
  it('start-of-fight effects never need a picked target', () => {
    for (const tool of TOOL_LIST) {
      for (const effect of tool.combat?.combatStart ?? []) {
        if (effect.kind === 'damage') expect(effect.target, tool.id).toBe('allEnemies');
        if (effect.kind === 'applyStatus') expect(effect.target, tool.id).not.toBe('target');
        expect(effect.kind, tool.id).not.toBe('exploit');
      }
      expect(tool.description.length, tool.id).toBeGreaterThan(0);
    }
  });

  it('Tools never pick cards or start fights (they have no screen to do it on)', () => {
    for (const tool of TOOL_LIST) {
      for (const effect of [...(tool.onPickup ?? []), ...(tool.afterCombatWin ?? [])]) {
        expect(['cardChoice', 'fight', 'wipeChosenCard', 'tradeUpChosenCard'], tool.id).not.toContain(effect.kind);
      }
    }
  });
});

describe('Intel events', () => {
  it('have 2-3 labeled choices', () => {
    for (const event of EVENT_LIST) {
      expect(event.choices.length, event.id).toBeGreaterThanOrEqual(2);
      expect(event.choices.length, event.id).toBeLessThanOrEqual(3);
      for (const choice of event.choices) expect(choice.label.length, event.id).toBeGreaterThan(0);
    }
  });

  it('every event can always be resolved without Crypto', () => {
    for (const event of EVENT_LIST) {
      expect(event.choices.some((c) => (c.cryptoCost ?? 0) === 0), event.id).toBe(true);
    }
  });
});

describe('run config', () => {
  it('node odds add up to 100%', () => {
    expect(Object.values(RUN_CONFIG.nodeWeights).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('Act 1 has encounters for every tier the run uses', () => {
    for (const tier of ['easy', 'normal', 'elite', 'boss'] as const) {
      const pool = Object.values(CONTENT.encounters).filter((e) => e.act === 1 && e.tier === tier);
      expect(pool.length, tier).toBeGreaterThan(0);
    }
  });

  it('the boss encounter uses boss enemies only', () => {
    for (const encounter of Object.values(CONTENT.encounters).filter((e) => e.tier === 'boss')) {
      for (const id of encounter.enemies) expect(CONTENT.enemies[id]?.tier, id).toBe('boss');
    }
  });

  it('starter decks are at least the minimum Arsenal size', () => {
    for (const cls of CLASS_LIST) expect(cls.starterDeck.length).toBeGreaterThanOrEqual(RUN_CONFIG.minArsenalSize);
  });
});

describe('full runs', () => {
  it.each(CLASS_LIST.flatMap((cls) => RUN_BOTS.map((bot) => [cls.id, bot.name, bot] as const)))(
    '%s with the %s bot always finishes',
    (classId, _, bot) => {
      for (let seed = 1; seed <= 5; seed++) {
        const result = playRun(classId, seed, bot, CONTENT);
        expect(result.outcome, `seed ${seed}`).not.toBe('stuck');
        expect(result.suspectedInfinites, `seed ${seed}`).toBe(0);
      }
    },
  );
});
