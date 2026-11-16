/**
 * Small, fixed content used only by engine tests, so tests don't break when
 * real game data in src/data gets rebalanced.
 */
import { combatReducer } from '../combat';
import type {
  CardDef,
  CardEffect,
  CardKeywords,
  CardType,
  CombatSetup,
  CombatState,
  ContentRegistry,
  EnemyDef,
  EnemyMove,
  StatusDef,
  Tactic,
} from '../types';

function card(
  id: string,
  type: CardType,
  tactic: Tactic,
  cost: number,
  effects: CardEffect[],
  keywords?: CardKeywords,
): CardDef {
  const def: CardDef = { id, name: id, type, tactic, cost, effects, rarity: 'starter', owner: 'neutral' };
  if (keywords !== undefined) def.keywords = keywords;
  return def;
}

function enemy(id: string, maxIntegrity: number, moves: EnemyMove[], extra: Partial<EnemyDef> = {}): EnemyDef {
  return { id, name: id, tier: 'normal', description: '', maxIntegrity, moves, ...extra };
}

function status(id: string, kind: StatusDef['kind'], decay: StatusDef['decay'], extra: Partial<StatusDef> = {}): StatusDef {
  return { id, name: id, description: '', kind, decay, ...extra };
}

const cardList: CardDef[] = [
  card('strike', 'attack', 'execution', 1, [{ kind: 'damage', amount: 6 }]),
  card('guard', 'skill', 'defense-evasion', 1, [{ kind: 'block', amount: 5 }]),
  card('nuke', 'attack', 'impact', 3, [{ kind: 'damage', amount: 30 }]),
  card('free', 'skill', 'discovery', 0, [{ kind: 'block', amount: 1 }]),
  // Tactic ladder for Chain tests: recon (0) < initial-access (2) < exfiltration (12).
  card('recon', 'skill', 'reconnaissance', 0, [{ kind: 'applyStatus', status: 'vuln', stacks: 2, target: 'target' }]),
  card('poke', 'attack', 'initial-access', 0, [{ kind: 'damage', amount: 1 }]),
  card('finisher', 'attack', 'exfiltration', 0, [{ kind: 'damage', amount: 2, bonusPerChain: 3 }]),
  card('exploit', 'attack', 'initial-access', 1, [{ kind: 'exploit', damagePerStack: 5 }]),
  card('loud', 'attack', 'impact', 0, [{ kind: 'damage', amount: 3 }], { noisy: 4 }),
  card('hush', 'skill', 'defense-evasion', 0, [{ kind: 'alert', amount: -3 }]),
  card('sweep', 'attack', 'impact', 1, [{ kind: 'damage', amount: 4, target: 'allEnemies' }]),
  card('twin', 'attack', 'execution', 1, [{ kind: 'damage', amount: 3, hits: 2 }]),
  card('expose', 'skill', 'discovery', 0, [{ kind: 'applyStatus', status: 'exposed', stacks: 1, target: 'target' }]),
  card('throttle', 'skill', 'reconnaissance', 0, [{ kind: 'applyStatus', status: 'throttled', stacks: 1, target: 'target' }]),
  card('stall', 'skill', 'reconnaissance', 0, [{ kind: 'applyStatus', status: 'stalled', stacks: 1, target: 'target' }]),
  card('beacon', 'implant', 'persistence', 1, [{ kind: 'applyStatus', status: 'beacon', stacks: 1, target: 'self' }]),
  card('burner', 'skill', 'discovery', 0, [{ kind: 'block', amount: 2 }], { burner: true }),
  card('stashed', 'skill', 'discovery', 0, [{ kind: 'block', amount: 2 }], { stash: true }),
  card('dig', 'skill', 'discovery', 0, [{ kind: 'draw', count: 2 }]),
  card('overclock', 'skill', 'execution', 0, [{ kind: 'gainCycles', amount: 2 }]),
  card('quiet-bonus', 'skill', 'discovery', 0, [{ kind: 'ifAlert', atMost: 'quiet', then: [{ kind: 'block', amount: 10 }] }]),
  card('loud-bonus', 'skill', 'discovery', 0, [{ kind: 'ifAlert', atLeast: 'noisy', then: [{ kind: 'block', amount: 10 }] }]),
];

const enemyList: EnemyDef[] = [
  // Always attacks for 10.
  enemy('puncher', 20, [{ id: 'punch', name: 'Punch', effects: [{ kind: 'attack', damage: 10 }], weight: 1 }]),
  // Always blocks for 8. Never hurts you.
  enemy('wall', 30, [{ id: 'brace', name: 'Brace', effects: [{ kind: 'block', amount: 8 }], weight: 1 }]),
  // Two moves; "spike" can't be used twice in a row.
  enemy('alternator', 20, [
    { id: 'spike', name: 'Spike', effects: [{ kind: 'attack', damage: 1 }], weight: 100, maxInARow: 1 },
    { id: 'rest', name: 'Rest', effects: [{ kind: 'block', amount: 1 }], weight: 1 },
  ]),
  enemy('cleanser', 30, [{ id: 'scrub', name: 'Scrub', effects: [{ kind: 'cleanse' }], weight: 1 }]),
  enemy('patcher', 30, [{ id: 'patch', name: 'Patch', effects: [{ kind: 'removeImplants', count: 1 }], weight: 1 }]),
  enemy('alarm', 30, [{ id: 'ring', name: 'Ring', effects: [{ kind: 'raiseAlert', amount: 3 }], weight: 1 }]),
  enemy('grower', 30, [
    { id: 'grow', name: 'Grow', effects: [{ kind: 'attack', damage: 2 }, { kind: 'buffSelf', status: 'hardened', stacks: 1 }], weight: 1 },
  ]),
  enemy('honeypot', 30, [{ id: 'idle', name: 'Idle', effects: [{ kind: 'block', amount: 0 }], weight: 1 }], {
    onAttacked: [{ kind: 'raiseAlert', amount: 2 }],
  }),
];

const statusList: StatusDef[] = [
  status('vuln', 'debuff', 'never'),
  status('exposed', 'debuff', 'endOfOwnerTurn'),
  status('throttled', 'debuff', 'endOfOwnerTurn'),
  status('stalled', 'debuff', 'never'),
  status('hardened', 'buff', 'never'),
  // Implant: at the start of each Operator turn, deal 1 damage to all enemies.
  status('beacon', 'buff', 'never', { implant: true, onTurnStart: [{ kind: 'damage', amount: 1, target: 'allEnemies' }] }),
  status('second-implant', 'buff', 'never', { implant: true }),
];

function byId<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

export const TEST_CONTENT: ContentRegistry = {
  cards: byId(cardList),
  enemies: byId(enemyList),
  statuses: byId(statusList),
};

export function makeSetup(overrides: Partial<CombatSetup> = {}): CombatSetup {
  return {
    deck: ['strike', 'strike', 'strike', 'strike', 'strike', 'guard', 'guard', 'guard', 'guard', 'guard'],
    opsec: 50,
    maxOpsec: 50,
    maxCycles: 3,
    enemies: ['puncher'],
    ...overrides,
  };
}

/** Index of the first card in hand with this defId, or throws. */
export function handIndexOf(state: CombatState, defId: string): number {
  const index = state.player.hand.findIndex((c) => c.defId === defId);
  if (index === -1) throw new Error(`No "${defId}" in hand`);
  return index;
}

/**
 * Starts a fight whose opening hand is exactly `hand` (in order), by putting
 * those cards on top of a deck padded with `filler`. Handy for precise rule tests.
 */
export function stateWithHand(hand: string[], overrides: Partial<CombatSetup> = {}, filler = 'free'): CombatState {
  const deck = [...hand, ...Array<string>(10).fill(filler)];
  // startCombat shuffles, so build the state, then rearrange piles deterministically.
  const base = makeSetup({ deck, ...overrides });
  const cards = deck.map((defId, i) => ({ uid: i + 1, defId }));
  const state: CombatState = {
    turn: 1,
    outcome: 'ongoing',
    alert: 0,
    chain: { count: 0, lastTacticIndex: null },
    player: {
      opsec: base.opsec,
      maxOpsec: base.maxOpsec,
      block: 0,
      cycles: base.maxCycles,
      maxCycles: base.maxCycles,
      hand: cards.slice(0, hand.length),
      drawPile: cards.slice(hand.length),
      discardPile: [],
      spentPile: [],
      statuses: {},
    },
    enemies: base.enemies.map((defId, i) => {
      const def = TEST_CONTENT.enemies[defId];
      if (def === undefined) throw new Error(`Unknown test enemy ${defId}`);
      const firstMove = def.moves[0];
      if (firstMove === undefined) throw new Error(`Test enemy ${defId} has no moves`);
      return {
        uid: i + 1,
        defId,
        integrity: def.maxIntegrity,
        maxIntegrity: def.maxIntegrity,
        block: 0,
        statuses: {},
        intentMoveId: firstMove.id,
        lastMoveId: null,
        timesInARow: 0,
      };
    }),
    rngState: 12345,
  };
  return state;
}

// ---------------------------------------------------------------------------
// Tiny action helpers so tests read like a play-by-play.
// ---------------------------------------------------------------------------

/** Play the first card in hand with this id at the given enemy. */
export function play(state: CombatState, defId: string, targetIndex = 0): CombatState {
  return combatReducer(state, { type: 'PLAY_CARD', handIndex: handIndexOf(state, defId), targetIndex }, TEST_CONTENT);
}

export function endTurn(state: CombatState): CombatState {
  return combatReducer(state, { type: 'END_TURN' }, TEST_CONTENT);
}

/** The enemy at `index`, or throws (keeps tests free of `!` assertions). */
export function enemyAt(state: CombatState, index: number): CombatState['enemies'][number] {
  const found = state.enemies[index];
  if (found === undefined) throw new Error(`No enemy at index ${index}`);
  return found;
}
