/**
 * Small, fixed run content for run-engine tests (map, Loot, Safehouse,
 * Dark Web, Intel). Builds on the combat TEST_CONTENT. Numbers here are test
 * values, not game balance.
 */
import { runReducer } from '../run/run';
import { withUpgrades } from '../run/upgrades';
import type { EventDef, RunConfig, RunContent, RunPhase, RunState, ToolDef } from '../run/runTypes';
import type { CardDef } from '../types';
import { TEST_CONTENT } from './testContent';

const owner = 'tester';

function poolCard(id: string, rarity: CardDef['rarity'], v2?: CardDef['v2']): CardDef {
  const def: CardDef = { id, name: id, owner, rarity, type: 'skill', tactic: 'discovery', cost: 1, effects: [{ kind: 'block', amount: 1 }] };
  if (v2 !== undefined) def.v2 = v2;
  return def;
}

const testerCards: CardDef[] = [
  { ...poolCard('t-strike', 'starter', { effects: [{ kind: 'damage', amount: 9 }] }), type: 'attack', effects: [{ kind: 'damage', amount: 6 }] },
  poolCard('pub-a', 'public', { cost: 0 }),
  poolCard('pub-b', 'public'),
  poolCard('priv-a', 'private', { keywords: {} }),
  poolCard('zd-a', 'zero-day'),
  // Belongs to another class: must never show up as tester Loot.
  { ...poolCard('other-card', 'public'), owner: 'someone-else' },
];

export const TEST_CONFIG: RunConfig = {
  // One act, so the boss ends the run. Multi-act tests use MULTI_ACT_CONTENT.
  acts: 1,
  actHealPercentOfMissing: 50,
  floors: 6,
  lanes: 4,
  paths: 4,
  nodeWeights: { fight: 5, elite: 1, intel: 2, safehouse: 1, darkWeb: 1 },
  fixedFloors: [{ floor: 6, kind: 'safehouse' }],
  bannedKinds: [{ floor: 5, kinds: ['safehouse'] }],
  noBackToBack: ['safehouse', 'darkWeb'],
  easyFightCount: 2,
  // Low so tests can use tiny decks; the min-size rule has its own test.
  minArsenalSize: 1,
  startingCrypto: 100,
  loot: {
    fight: { rarityWeights: { public: 6, private: 3, 'zero-day': 1 }, crypto: [10, 20], cardChoices: 3, tool: false },
    elite: { rarityWeights: { public: 1, private: 1, 'zero-day': 1 }, crypto: [30, 30], cardChoices: 3, tool: true },
    boss: { rarityWeights: { public: 0, private: 0, 'zero-day': 1 }, crypto: [80, 80], cardChoices: 3, tool: true },
  },
  darkWeb: {
    cardCount: 3,
    toolCount: 2,
    cardPrice: { public: [50, 50], private: [80, 80], 'zero-day': [150, 150] },
    toolPrice: [120, 120],
    saleMultiplier: 0.5,
    wipeBasePrice: 75,
    wipePriceStep: 25,
  },
  safehouse: { layLowPercent: 35 },
};

const tools: ToolDef[] = [
  { id: 'big-heart', name: 'Big Heart', description: '+10 max OpSec', onPickup: [{ kind: 'gainMaxOpsec', amount: 10 }] },
  { id: 'wallet', name: 'Wallet', description: '+5 Crypto per win', afterCombatWin: [{ kind: 'gainCrypto', amount: 5 }] },
  { id: 'plain', name: 'Plain', description: 'Does nothing' },
  {
    id: 'kit',
    name: 'Kit',
    description: 'Fight bonuses',
    combat: { noisyReduction: 1, firstTurnDraw: 1, combatStart: [{ kind: 'damage', amount: 3, target: 'allEnemies' }] },
  },
  { id: 'bag', name: 'Bag', description: 'Better Lay Low', layLowBonusPercent: 15 },
];

const events: EventDef[] = [
  {
    id: 'shop-deal',
    title: 'Shop deal',
    text: '',
    choices: [
      { label: 'Pay for an upgrade', cryptoCost: 30, effects: [{ kind: 'upgradeRandomCard' }] },
      { label: 'Wipe a card', effects: [{ kind: 'wipeChosenCard' }] },
      { label: 'Pick a card', effects: [{ kind: 'cardChoice', count: 3 }] },
      { label: 'Fight', effects: [{ kind: 'fight', tier: 'easy' }] },
      { label: 'Ouch', effects: [{ kind: 'loseOpsec', amount: 1000 }] },
    ],
  },
  {
    id: 'mirror',
    title: 'Mirror',
    text: '',
    choices: [
      { label: 'Trade up', effects: [{ kind: 'tradeUpChosenCard' }] },
      { label: 'Get noticed', effects: [{ kind: 'heat', amount: 5 }] },
    ],
  },
  { id: 'gift', title: 'Gift', text: '', choices: [{ label: 'Take', effects: [{ kind: 'gainRandomTool' }, { kind: 'gainCrypto', amount: 5 }] }] },
];

export const RUN_TEST_CONTENT: RunContent = {
  ...TEST_CONTENT,
  cards: {
    ...TEST_CONTENT.cards,
    ...Object.fromEntries(withUpgrades(testerCards, ' v2').map((card) => [card.id, card])),
  },
  classes: { tester: { id: 'tester', maxOpsec: 60, starterDeck: Array<string>(8).fill('t-strike') } },
  encounters: {
    e1: { id: 'e1', act: 1, tier: 'easy', enemies: ['puncher'] },
    n1: { id: 'n1', act: 1, tier: 'normal', enemies: ['alternator'] },
    el: { id: 'el', act: 1, tier: 'elite', enemies: ['grower'] },
    b1: { id: 'b1', act: 1, tier: 'boss', enemies: ['wall', 'wall'] },
  },
  tools: Object.fromEntries(tools.map((tool) => [tool.id, tool])),
  events: Object.fromEntries(events.map((event) => [event.id, event])),
  targets: {},
  config: TEST_CONFIG,
};

/** Three acts: Act 2 has its own pool, Act 3 has two Final Targets. */
export const MULTI_ACT_CONTENT: RunContent = {
  ...RUN_TEST_CONTENT,
  encounters: {
    ...RUN_TEST_CONTENT.encounters,
    e2: { id: 'e2', act: 2, tier: 'easy', enemies: ['puncher'] },
    n2: { id: 'n2', act: 2, tier: 'normal', enemies: ['puncher'] },
    el2: { id: 'el2', act: 2, tier: 'elite', enemies: ['grower'] },
    b2: { id: 'b2', act: 2, tier: 'boss', enemies: ['wall'] },
    e3a: { id: 'e3a', act: 3, target: 'alpha', tier: 'easy', enemies: ['puncher'] },
    n3a: { id: 'n3a', act: 3, target: 'alpha', tier: 'normal', enemies: ['puncher'] },
    el3a: { id: 'el3a', act: 3, target: 'alpha', tier: 'elite', enemies: ['grower'] },
    b3a: { id: 'b3a', act: 3, target: 'alpha', tier: 'boss', enemies: ['wall'] },
    e3b: { id: 'e3b', act: 3, target: 'beta', tier: 'easy', enemies: ['alternator'] },
    n3b: { id: 'n3b', act: 3, target: 'beta', tier: 'normal', enemies: ['alternator'] },
    el3b: { id: 'el3b', act: 3, target: 'beta', tier: 'elite', enemies: ['grower'] },
    b3b: { id: 'b3b', act: 3, target: 'beta', tier: 'boss', enemies: ['wall', 'wall'] },
  },
  targets: {
    alpha: { id: 'alpha', name: 'Alpha', description: '', bossName: 'Wall' },
    beta: { id: 'beta', name: 'Beta', description: '', bossName: 'Two Walls' },
  },
  config: { ...TEST_CONFIG, acts: 3 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function act(run: RunState, action: Parameters<typeof runReducer>[1], content: RunContent = RUN_TEST_CONTENT): RunState {
  return runReducer(run, action, content);
}

/** A copy of `run` placed directly in `phase` (skips walking the map). */
export function inPhase(run: RunState, phase: RunPhase): RunState {
  return { ...structuredClone(run), phase: structuredClone(phase) };
}

/** Wins the current fight: drops every enemy to 1 Integrity, then plays t-strikes at them. */
export function winFight(run: RunState, content: RunContent = RUN_TEST_CONTENT): RunState {
  const prepared = structuredClone(run);
  if (prepared.phase.kind !== 'combat') throw new Error('Not in a fight');
  for (const enemy of prepared.phase.combat.enemies) {
    enemy.integrity = 1;
    enemy.block = 0;
  }
  let current = prepared;
  for (let guard = 0; guard < 20 && current.phase.kind === 'combat'; guard++) {
    const combat = current.phase.combat;
    const target = combat.enemies.findIndex((e) => e.integrity > 0);
    const handIndex = combat.player.hand.findIndex((c) => c.defId === 't-strike');
    const action =
      handIndex === -1 || combat.player.cycles < 1
        ? ({ type: 'END_TURN' } as const)
        : ({ type: 'PLAY_CARD', handIndex, targetIndex: target } as const);
    current = act(current, { type: 'COMBAT', action }, content);
  }
  return current;
}

/** Loses the current fight: sets OpSec to 1 and ends turns until an enemy lands a hit. */
export function loseFight(run: RunState): RunState {
  const prepared = structuredClone(run);
  if (prepared.phase.kind !== 'combat') throw new Error('Not in a fight');
  prepared.phase.combat.player.opsec = 1;
  let current = prepared;
  for (let guard = 0; guard < 10 && current.phase.kind === 'combat' && current.outcome === 'ongoing'; guard++) {
    current = act(current, { type: 'COMBAT', action: { type: 'END_TURN' } });
  }
  return current;
}
