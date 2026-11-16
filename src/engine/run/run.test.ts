import { describe, expect, it } from 'vitest';
import { act, inPhase, loseFight, RUN_TEST_CONTENT, winFight } from '../__fixtures__/runContent';
import { startRun } from './run';
import type { NodeKind, RunState } from './runTypes';

const content = RUN_TEST_CONTENT;

/** A new tester run whose floor-1 nodes are all `kind`, standing at the start. */
function runStartingAt(kind: NodeKind, seed = 1): RunState {
  const run = startRun('tester', seed, content);
  for (const id of run.map.startIds) {
    const node = run.map.nodes[id];
    if (node !== undefined) node.kind = kind;
  }
  return run;
}

function firstStart(run: RunState): string {
  const id = run.map.startIds[0];
  if (id === undefined) throw new Error('Map has no start nodes');
  return id;
}

function enemiesInFight(run: RunState): string[] {
  if (run.phase.kind !== 'combat') throw new Error(`Expected a fight, got ${run.phase.kind}`);
  return run.phase.combat.enemies.map((e) => e.defId);
}

describe('starting a run', () => {
  it('uses the class starter deck, max OpSec and starting Crypto', () => {
    const run = startRun('tester', 1, content);
    expect(run.deck).toEqual(content.classes.tester?.starterDeck);
    expect(run.opsec).toBe(60);
    expect(run.crypto).toBe(100);
    expect(run.phase).toEqual({ kind: 'map' });
    expect(run.currentNodeId).toBeNull();
  });

  it('is deterministic for a seed', () => {
    expect(startRun('tester', 9, content)).toEqual(startRun('tester', 9, content));
  });

  it('rejects unknown classes', () => {
    expect(() => startRun('nobody', 1, content)).toThrow(/Unknown class/);
  });
});

describe('moving on the map', () => {
  it('only allows reachable nodes', () => {
    const run = runStartingAt('safehouse');
    expect(act(run, { type: 'CHOOSE_NODE', nodeId: 'boss' })).toBe(run);
    const moved = act(run, { type: 'CHOOSE_NODE', nodeId: firstStart(run) });
    expect(moved.currentNodeId).toBe(firstStart(run));
    expect(moved.phase.kind).toBe('safehouse');
  });

  it('never changes the state passed in', () => {
    const run = runStartingAt('fight');
    const snapshot = structuredClone(run);
    act(run, { type: 'CHOOSE_NODE', nodeId: firstStart(run) });
    expect(run).toEqual(snapshot);
  });
});

describe('fights', () => {
  it('uses the easy pool for the first fights, then the normal pool', () => {
    let run = runStartingAt('fight');
    run = act(run, { type: 'CHOOSE_NODE', nodeId: firstStart(run) });
    expect(enemiesInFight(run)).toEqual(['puncher']);

    run = { ...run, fightsStarted: 2, phase: { kind: 'map' }, currentNodeId: null };
    run = act(run, { type: 'CHOOSE_NODE', nodeId: firstStart(run) });
    expect(enemiesInFight(run)).toEqual(['alternator']);
  });

  it('carries OpSec out of the fight and offers Loot from the class pool', () => {
    let run = runStartingAt('fight');
    run = act(run, { type: 'CHOOSE_NODE', nodeId: firstStart(run) });
    if (run.phase.kind !== 'combat') throw new Error('expected combat');
    run.phase.combat.player.opsec = 40;

    const won = winFight(run);
    expect(won.opsec).toBe(40);
    if (won.phase.kind !== 'loot') throw new Error('expected loot');
    const { loot } = won.phase;
    expect(loot.crypto).toBeGreaterThanOrEqual(10);
    expect(won.crypto).toBe(100 + loot.crypto);
    expect(loot.toolId).toBeNull();
    expect(loot.cardChoices).toHaveLength(3);
    expect(new Set(loot.cardChoices).size).toBe(3);
    for (const id of loot.cardChoices) expect(content.cards[id]?.owner).toBe('tester');

    const picked = act(won, { type: 'PICK_LOOT_CARD', index: 1 });
    expect(picked.deck.at(-1)).toBe(loot.cardChoices[1]);
    expect(picked.phase.kind).toBe('map');
    expect(act(won, { type: 'SKIP_LOOT' }).deck).toEqual(won.deck);
  });

  it('a Hardened Target also drops a Tool, and Tools fire after later wins', () => {
    let run = runStartingAt('elite');
    run = act(run, { type: 'CHOOSE_NODE', nodeId: firstStart(run) });
    expect(enemiesInFight(run)).toEqual(['grower']);
    run = winFight(run);
    if (run.phase.kind !== 'loot') throw new Error('expected loot');
    expect(run.phase.loot.toolId).not.toBeNull();
    expect(run.tools).toEqual([run.phase.loot.toolId]);

    // With the Wallet, every later win pays 5 extra Crypto.
    const withWallet = { ...runStartingAt('fight'), tools: ['wallet'] };
    const fight = act(withWallet, { type: 'CHOOSE_NODE', nodeId: firstStart(withWallet) });
    const won = winFight(fight);
    if (won.phase.kind !== 'loot') throw new Error('expected loot');
    expect(won.crypto).toBe(100 + 5 + won.phase.loot.crypto);
  });

  it('losing a fight burns the run', () => {
    let run = runStartingAt('fight');
    run = act(run, { type: 'CHOOSE_NODE', nodeId: firstStart(run) });
    const lost = loseFight(run);
    expect(lost.outcome).toBe('lost');
    expect(lost.opsec).toBe(0);
    expect(act(lost, { type: 'LEAVE' })).toBe(lost);
  });

  it('beating the boss wins the run', () => {
    const run = runStartingAt('fight');
    run.currentNodeId = Object.values(run.map.nodes).find((n) => n.next.includes('boss'))?.id ?? null;
    const atBoss = act(run, { type: 'CHOOSE_NODE', nodeId: 'boss' });
    expect(enemiesInFight(atBoss)).toEqual(['wall', 'wall']);
    expect(winFight(atBoss).outcome).toBe('won');
  });
});

describe('Safehouse', () => {
  const base = { ...startRun('tester', 1, content), opsec: 10, deck: ['t-strike', 'pub-b'] };
  const atSafehouse = inPhase(base, { kind: 'safehouse' });

  it('Lay Low recovers 35% of max OpSec, rounded down, capped at max', () => {
    expect(act(atSafehouse, { type: 'LAY_LOW' }).opsec).toBe(10 + 21);
    expect(act({ ...atSafehouse, opsec: 55 }, { type: 'LAY_LOW' }).opsec).toBe(60);
  });

  it('Weaponize upgrades a card that has a v2', () => {
    const next = act(atSafehouse, { type: 'WEAPONIZE', deckIndex: 0 });
    expect(next.deck).toEqual(['t-strike+', 'pub-b']);
    expect(next.phase.kind).toBe('map');
    expect(act(atSafehouse, { type: 'WEAPONIZE', deckIndex: 1 })).toBe(atSafehouse); // pub-b has no v2
    expect(act(atSafehouse, { type: 'WEAPONIZE', deckIndex: 9 })).toBe(atSafehouse);
  });

  it('Go Dark wipes a card for free', () => {
    const next = act(atSafehouse, { type: 'GO_DARK', deckIndex: 1 });
    expect(next.deck).toEqual(['t-strike']);
    expect(next.crypto).toBe(atSafehouse.crypto);
  });

  it('only one option per visit', () => {
    const next = act(atSafehouse, { type: 'LAY_LOW' });
    expect(act(next, { type: 'GO_DARK', deckIndex: 0 })).toBe(next);
  });
});

describe('Dark Web', () => {
  function atDarkWeb(crypto: number): RunState {
    const run = { ...runStartingAt('darkWeb', 3), crypto, deck: ['t-strike', 'pub-a'] };
    return act(run, { type: 'CHOOSE_NODE', nodeId: firstStart(run) });
  }

  it('stocks class cards (one on sale) and Tools', () => {
    const run = atDarkWeb(500);
    if (run.phase.kind !== 'darkWeb') throw new Error('expected Dark Web');
    expect(run.phase.cards).toHaveLength(3);
    expect(run.phase.tools).toHaveLength(2);
    const prices = run.phase.cards.map((c) => c.price);
    const fullPrices = run.phase.cards.map((c) => content.config.darkWeb.cardPrice[content.cards[c.id]?.rarity as 'public'][0]);
    expect(prices.filter((p, i) => p === Math.floor((fullPrices[i] ?? 0) / 2))).toHaveLength(1);
  });

  it('buying a card costs Crypto, adds it, and marks it sold', () => {
    const run = atDarkWeb(500);
    if (run.phase.kind !== 'darkWeb') throw new Error('expected Dark Web');
    const item = run.phase.cards[0];
    const next = act(run, { type: 'BUY_CARD', index: 0 });
    expect(next.crypto).toBe(500 - (item?.price ?? 0));
    expect(next.deck.at(-1)).toBe(item?.id);
    expect(act(next, { type: 'BUY_CARD', index: 0 })).toBe(next);
  });

  it("can't buy what you can't afford", () => {
    const run = atDarkWeb(0);
    expect(act(run, { type: 'BUY_CARD', index: 0 })).toBe(run);
    expect(act(run, { type: 'BUY_TOOL', index: 0 })).toBe(run);
    expect(act(run, { type: 'BUY_WIPE', deckIndex: 0 })).toBe(run);
  });

  it('buying a Tool fires its pickup effect', () => {
    const run = atDarkWeb(500);
    if (run.phase.kind !== 'darkWeb') throw new Error('expected Dark Web');
    const heartIndex = run.phase.tools.findIndex((t) => t.id === 'big-heart');
    const toolIndex = heartIndex === -1 ? 0 : heartIndex;
    const next = act(run, { type: 'BUY_TOOL', index: toolIndex });
    expect(next.tools).toEqual([run.phase.tools[toolIndex]?.id]);
    if (heartIndex !== -1) expect(next.maxOpsec).toBe(70);
  });

  it('Wipe works once per visit and costs more each time this run', () => {
    const run = atDarkWeb(500);
    const wiped = act(run, { type: 'BUY_WIPE', deckIndex: 1 });
    expect(wiped.deck).toEqual(['t-strike']);
    expect(wiped.crypto).toBe(425);
    expect(wiped.wipesBought).toBe(1);
    expect(act(wiped, { type: 'BUY_WIPE', deckIndex: 0 })).toBe(wiped);

    const nextVisit = inPhase(wiped, { kind: 'darkWeb', cards: [], tools: [], wipeUsed: false });
    expect(act(nextVisit, { type: 'BUY_WIPE', deckIndex: 0 }).crypto).toBe(425 - 100);
  });

  it('leaving returns to the map', () => {
    expect(act(atDarkWeb(0), { type: 'LEAVE' }).phase.kind).toBe('map');
  });
});

describe('Intel events', () => {
  const run = { ...startRun('tester', 5, content), deck: ['t-strike', 'pub-b'] };
  const atEvent = inPhase(run, { kind: 'intel', eventId: 'shop-deal' });

  it('picks unseen events first', () => {
    const start = runStartingAt('intel', 5);
    const first = act(start, { type: 'CHOOSE_NODE', nodeId: firstStart(start) });
    const again = act({ ...first, phase: { kind: 'map' }, currentNodeId: null }, { type: 'CHOOSE_NODE', nodeId: firstStart(start) });
    if (first.phase.kind !== 'intel' || again.phase.kind !== 'intel') throw new Error('expected Intel');
    expect(first.phase.eventId).not.toBe(again.phase.eventId);
  });

  it('charges the choice cost, or refuses if you cannot pay', () => {
    const paid = act(atEvent, { type: 'EVENT_CHOICE', index: 0 });
    expect(paid.crypto).toBe(70);
    expect(paid.deck).toEqual(['t-strike+', 'pub-b']);
    expect(act({ ...atEvent, crypto: 10 }, { type: 'EVENT_CHOICE', index: 0 }).crypto).toBe(10);
  });

  it('wipe choices need a picked card', () => {
    expect(act(atEvent, { type: 'EVENT_CHOICE', index: 1 })).toBe(atEvent);
    expect(act(atEvent, { type: 'EVENT_CHOICE', index: 1, deckIndex: 0 }).deck).toEqual(['pub-b']);
  });

  it('can lead to a card pick or a fight', () => {
    expect(act(atEvent, { type: 'EVENT_CHOICE', index: 2 }).phase.kind).toBe('loot');
    const fight = act(atEvent, { type: 'EVENT_CHOICE', index: 3 });
    expect(enemiesInFight(fight)).toEqual(['puncher']);
    expect(winFight(fight).phase.kind).toBe('loot');
  });

  it('losing all OpSec in an event burns the run', () => {
    expect(act(atEvent, { type: 'EVENT_CHOICE', index: 4 }).outcome).toBe('lost');
  });

  it('gaining a random Tool fires its pickup effect', () => {
    const gift = act(inPhase(run, { kind: 'intel', eventId: 'gift' }), { type: 'EVENT_CHOICE', index: 0 });
    expect(gift.tools).toHaveLength(1);
    expect(gift.crypto).toBe(run.crypto + 5);
  });
});
