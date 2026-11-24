/**
 * Checks on the run-level game data: v2s, class pools, Tools, Intel events,
 * encounter pools and the run config. Also a smoke test that full runs finish.
 */
import { describe, expect, it } from 'vitest';
import { classCardPool, emptyProfile, isUpgraded, lockedCardIds, upgradedId } from '../engine';
import { RUN_BOTS, playRun } from '../sim/runSim';
import { CARD_LIST } from './cards';
import { CLASS_LIST } from './classes';
import { CONTENT } from './content';
import { ENCOUNTER_LIST } from './encounters';
import { EVENT_LIST } from './events';
import { PROGRESSION } from './progression';
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
  const locked = lockedCardIds(emptyProfile(), PROGRESSION);

  it.each(CLASS_LIST.map((cls) => [cls.id] as const))('%s starts with a 20-card Loot pool with every Loot rarity', (classId) => {
    const pool = classCardPool(CONTENT, classId, locked);
    expect(pool).toHaveLength(20);
    const rarities = new Set(pool.map((card) => card.rarity));
    expect([...rarities].sort()).toEqual(['private', 'public', 'zero-day']);
  });

  it.each(CLASS_LIST.map((cls) => [cls.id] as const))('%s unlocks 2 cards per level for 3 levels, plus 1 Bounty card', (classId) => {
    const levels = PROGRESSION.classLevels[classId] ?? [];
    expect(levels.map((l) => l.level)).toEqual([1, 2, 3]);
    const levelCards = levels.flatMap((l) => l.unlocks.flatMap((u) => (u.kind === 'card' ? [u.cardId] : [])));
    expect(levelCards).toHaveLength(6);
    const unlockedPool = classCardPool(CONTENT, classId, []);
    expect(unlockedPool).toHaveLength(27);
  });
});

describe('progression data', () => {
  it('every unlockable card exists, is a base card and is locked on a fresh profile', () => {
    const all = [...Object.values(PROGRESSION.classLevels).flat(), ...PROGRESSION.bounties].flatMap((d) => d.unlocks);
    for (const unlock of all) {
      if (unlock.kind === 'card') expect(CONTENT.cards[unlock.cardId], unlock.cardId).toBeDefined();
      if (unlock.kind === 'class') expect(CONTENT.classes[unlock.classId], unlock.classId).toBeDefined();
    }
    for (const id of lockedCardIds(emptyProfile(), PROGRESSION)) expect(isUpgraded(id)).toBe(false);
  });

  it('a class level only unlocks that class\'s cards', () => {
    for (const [classId, levels] of Object.entries(PROGRESSION.classLevels)) {
      for (const unlock of levels.flatMap((l) => l.unlocks)) {
        if (unlock.kind === 'card') expect(CONTENT.cards[unlock.cardId]?.owner, unlock.cardId).toBe(classId);
      }
    }
  });

  it('Bounty bosses are real boss encounters, and the Insider is unlocked by a Bounty', () => {
    for (const bounty of PROGRESSION.bounties) {
      if (bounty.condition.kind === 'beatBoss') {
        const id = bounty.condition.encounterId;
        expect(ENCOUNTER_LIST.find((e) => e.id === id)?.tier, id).toBe('boss');
      }
    }
    expect(PROGRESSION.startingClasses).not.toContain('insider');
    expect(PROGRESSION.bounties.some((b) => b.unlocks.some((u) => u.kind === 'class' && u.classId === 'insider'))).toBe(true);
  });
});

describe('acts and Final Targets', () => {
  it('every act has easy, normal, elite and boss encounters (per Final Target in the last act)', () => {
    const tiers = ['easy', 'normal', 'elite', 'boss'] as const;
    for (let act = 1; act < RUN_CONFIG.acts; act++) {
      for (const tier of tiers) expect(ENCOUNTER_LIST.some((e) => e.act === act && e.tier === tier && e.target === undefined), `act ${act} ${tier}`).toBe(true);
    }
    for (const target of Object.keys(CONTENT.targets)) {
      for (const tier of tiers) {
        expect(ENCOUNTER_LIST.some((e) => e.act === RUN_CONFIG.acts && e.tier === tier && e.target === target), `${target} ${tier}`).toBe(true);
      }
    }
  });

  it('only last-act encounters name a Final Target, and it exists', () => {
    for (const e of ENCOUNTER_LIST) {
      if (e.target !== undefined) {
        expect(e.act, e.id).toBe(RUN_CONFIG.acts);
        expect(CONTENT.targets[e.target], e.id).toBeDefined();
      } else {
        expect(e.act, e.id).toBeLessThan(RUN_CONFIG.acts);
      }
    }
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
