import { describe, expect, it } from 'vitest';
import { act, inPhase, RUN_TEST_CONTENT } from '../__fixtures__/runContent';
import { combatModifiers } from './fights';
import { startRun } from './run';
import type { RunState } from './runTypes';

const content = RUN_TEST_CONTENT;

/** A run standing before a floor-1 fight. */
function beforeFight(overrides: Partial<RunState> = {}): RunState {
  const run = { ...startRun('tester', 2, content), ...overrides };
  for (const id of run.map.startIds) {
    const node = run.map.nodes[id];
    if (node !== undefined) node.kind = 'fight';
  }
  return run;
}

function enterFight(run: RunState): RunState {
  return act(run, { type: 'CHOOSE_NODE', nodeId: run.map.startIds[0] ?? '' });
}

describe('Heat', () => {
  it('an event adds Heat, and the next fight starts with that much Alert', () => {
    const atEvent = inPhase(beforeFight(), { kind: 'intel', eventId: 'mirror' });
    const heated = act(atEvent, { type: 'EVENT_CHOICE', index: 1 });
    expect(heated.heat).toBe(5);

    const fight = enterFight(heated);
    if (fight.phase.kind !== 'combat') throw new Error('expected combat');
    expect(fight.phase.combat.alert).toBe(5);
    expect(fight.heat).toBe(0); // only lasts one fight
  });
});

describe('Tool fight bonuses', () => {
  it('add up across Tools and reach the fight', () => {
    const run = beforeFight({ tools: ['kit', 'kit', 'plain'], heat: 2 });
    expect(combatModifiers(run, content)).toEqual({
      startingAlert: 2,
      noisyReduction: 2,
      firstTurnDraw: 2,
      firstTurnCycles: 0,
      damageTakenPerHit: 0,
      combatStart: [
        { kind: 'damage', amount: 3, target: 'allEnemies' },
        { kind: 'damage', amount: 3, target: 'allEnemies' },
      ],
    });

    const fight = enterFight(beforeFight({ tools: ['kit'] }));
    if (fight.phase.kind !== 'combat') throw new Error('expected combat');
    expect(fight.phase.combat.player.hand).toHaveLength(6);
    expect(fight.phase.combat.noisyReduction).toBe(1);
    expect(fight.phase.combat.enemies[0]?.integrity).toBe(17); // puncher 20 - 3
  });

  it('Lay Low bonus percent adds to the Safehouse heal', () => {
    const atSafehouse = inPhase(beforeFight({ opsec: 1, tools: ['bag'] }), { kind: 'safehouse' });
    expect(act(atSafehouse, { type: 'LAY_LOW' }).opsec).toBe(1 + 30); // 50% of 60
  });
});

describe('trade up', () => {
  it('swaps the picked card for a class card one rarity higher', () => {
    const atEvent = inPhase(beforeFight({ deck: ['t-strike', 'pub-a+'] }), { kind: 'intel', eventId: 'mirror' });
    expect(act(atEvent, { type: 'EVENT_CHOICE', index: 0 })).toBe(atEvent); // needs a picked card

    const fromStarter = act(atEvent, { type: 'EVENT_CHOICE', index: 0, deckIndex: 0 });
    expect(fromStarter.deck).toHaveLength(2);
    expect(content.cards[fromStarter.deck[0] ?? '']?.rarity).toBe('public');

    const fromPublicV2 = act(atEvent, { type: 'EVENT_CHOICE', index: 0, deckIndex: 1 });
    expect(content.cards[fromPublicV2.deck[1] ?? '']?.rarity).toBe('private');
  });
});
