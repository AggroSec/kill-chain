/**
 * Checks on the real game data: every id resolves, numbers are sane, and
 * random play in every class x encounter combination always terminates.
 * These tests are the safety net that makes "content is data" safe.
 */
import { describe, expect, it } from 'vitest';
import { combatReducer, CORE_STATUS, livingEnemyIndexes, Rng, startCombat, TURN_CAP, whyCantPlay } from '../engine';
import type { CardEffect, CombatState, EnemyEffect } from '../engine';
import { CARD_LIST } from './cards';
import { CLASS_LIST } from './classes';
import { CONTENT, starterFight } from './content';
import { ENCOUNTER_LIST } from './encounters';
import { ENEMY_LIST } from './enemies';
import { STATUS_LIST } from './statuses';

const classIds = new Set(CLASS_LIST.map((c) => c.id));

function expectUniqueIds(items: readonly { id: string }[]) {
  const ids = items.map((item) => item.id);
  expect(new Set(ids).size, `duplicate ids in ${ids.join(', ')}`).toBe(ids.length);
}

/** Every status id mentioned anywhere in a list of card effects (including nested). */
function statusesInCardEffects(effects: readonly CardEffect[]): string[] {
  return effects.flatMap((effect) => {
    if (effect.kind === 'applyStatus') return [effect.status];
    if (effect.kind === 'ifAlert') return statusesInCardEffects(effect.then);
    return [];
  });
}

function statusesInEnemyEffects(effects: readonly EnemyEffect[]): string[] {
  return effects.flatMap((effect) => (effect.kind === 'buffSelf' || effect.kind === 'buffAllies' ? [effect.status] : []));
}

describe('ids', () => {
  it('are unique within each list', () => {
    expectUniqueIds(CARD_LIST);
    expectUniqueIds(ENEMY_LIST);
    expectUniqueIds(STATUS_LIST);
    expectUniqueIds(CLASS_LIST);
    expectUniqueIds(ENCOUNTER_LIST);
  });

  it('every core engine status is defined in data', () => {
    for (const id of Object.values(CORE_STATUS)) {
      expect(CONTENT.statuses[id], `missing core status "${id}"`).toBeDefined();
    }
  });
});

describe('cards', () => {
  it.each(CARD_LIST.map((card) => [card.id, card] as const))('%s is well-formed', (_, card) => {
    expect(card.cost).toBeGreaterThanOrEqual(0);
    expect(card.effects.length).toBeGreaterThan(0);
    expect(card.owner === 'neutral' || classIds.has(card.owner), `unknown owner "${card.owner}"`).toBe(true);
    for (const status of statusesInCardEffects(card.effects)) {
      expect(CONTENT.statuses[status], `unknown status "${status}"`).toBeDefined();
    }
    if (card.keywords?.noisy !== undefined) expect(card.keywords.noisy).toBeGreaterThan(0);
  });

  it('implant cards apply an implant status to the Operator', () => {
    for (const card of CARD_LIST.filter((c) => c.type === 'implant')) {
      const implantsApplied = card.effects.filter(
        (e) => e.kind === 'applyStatus' && e.target === 'self' && CONTENT.statuses[e.status]?.implant === true,
      );
      expect(implantsApplied.length, card.id).toBeGreaterThan(0);
    }
  });
});

describe('statuses', () => {
  it('turn-start effects never need a picked target', () => {
    for (const status of STATUS_LIST) {
      for (const effect of status.onTurnStart ?? []) {
        if (effect.kind === 'damage') expect(effect.target, status.id).toBe('allEnemies');
        if (effect.kind === 'applyStatus') expect(effect.target, status.id).not.toBe('target');
        expect(effect.kind, status.id).not.toBe('exploit');
      }
    }
  });
});

describe('enemies', () => {
  it.each(ENEMY_LIST.map((enemy) => [enemy.id, enemy] as const))('%s is well-formed', (_, enemy) => {
    expect(enemy.maxIntegrity).toBeGreaterThan(0);
    expect(enemy.moves.some((move) => move.weight > 0)).toBe(true);
    expectUniqueIds(enemy.moves);
    const allEffects = [...enemy.moves.flatMap((m) => m.effects), ...(enemy.onAttacked ?? [])];
    for (const status of statusesInEnemyEffects(allEffects)) {
      expect(CONTENT.statuses[status], `unknown status "${status}"`).toBeDefined();
    }
  });

  it('"when attacked" triggers never attack (keeps triggers simple and non-recursive)', () => {
    for (const enemy of ENEMY_LIST) {
      for (const effect of enemy.onAttacked ?? []) expect(effect.kind, enemy.id).not.toBe('attack');
    }
  });
});

describe('classes and encounters', () => {
  it('starter decks have 10 cards the class owns', () => {
    for (const cls of CLASS_LIST) {
      expect(cls.starterDeck).toHaveLength(10);
      for (const cardId of cls.starterDeck) {
        const card = CONTENT.cards[cardId];
        expect(card, `${cls.id}: unknown card "${cardId}"`).toBeDefined();
        expect(card?.owner).toBe(cls.id);
        expect(card?.rarity).toBe('starter');
      }
    }
  });

  it('encounters only reference real enemies', () => {
    for (const encounter of ENCOUNTER_LIST) {
      expect(encounter.enemies.length).toBeGreaterThan(0);
      for (const enemyId of encounter.enemies) expect(CONTENT.enemies[enemyId], enemyId).toBeDefined();
    }
  });
});

/** A bot that plays random legal cards at random targets and sometimes ends its turn early. */
function playRandomly(classId: string, encounterId: string, seed: number): CombatState {
  const botRng = new Rng(seed ^ 0x5eed);
  let state = startCombat(starterFight(classId, encounterId), seed, CONTENT);
  for (let step = 0; step < 10_000 && state.outcome === 'ongoing'; step++) {
    const targets = livingEnemyIndexes(state);
    const target = targets[botRng.nextInt(targets.length)] ?? 0;
    const playable = state.player.hand
      .map((_, index) => index)
      .filter((index) => whyCantPlay(state, index, target, CONTENT) === null);
    if (playable.length === 0 || botRng.next() < 0.15) {
      state = combatReducer(state, { type: 'END_TURN' }, CONTENT);
    } else {
      const handIndex = playable[botRng.nextInt(playable.length)] ?? 0;
      state = combatReducer(state, { type: 'PLAY_CARD', handIndex, targetIndex: target }, CONTENT);
    }
  }
  return state;
}

describe('random play fuzz test', () => {
  const combos = CLASS_LIST.flatMap((cls) => ENCOUNTER_LIST.map((enc) => [cls.id, enc.id] as const));

  it.each(combos)('%s vs %s always terminates with valid state', (classId, encounterId) => {
    const deckSize = starterFight(classId, encounterId).deck.length;
    for (let seed = 1; seed <= 40; seed++) {
      const end = playRandomly(classId, encounterId, seed);
      expect(end.outcome).not.toBe('ongoing');
      expect(end.turn).toBeLessThanOrEqual(TURN_CAP);
      expect(end.player.opsec).toBeGreaterThanOrEqual(0);
      expect(end.alert).toBeGreaterThanOrEqual(0);
      const { drawPile, hand, discardPile, spentPile } = end.player;
      expect(drawPile.length + hand.length + discardPile.length + spentPile.length).toBe(deckSize);
    }
  });
});
