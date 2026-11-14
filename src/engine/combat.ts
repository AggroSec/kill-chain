/**
 * The combat engine: start a fight, then feed it actions.
 *
 *   let state = startCombat(setup, seed, content);
 *   state = combatReducer(state, { type: 'PLAY_CARD', handIndex: 0, targetIndex: 0 }, content);
 *   state = combatReducer(state, { type: 'END_TURN' }, content);
 *
 * The reducer is pure: it never changes the state you pass in. It clones it,
 * applies the action to the clone, and returns the clone. Invalid actions
 * (not enough Cycles, bad index, fight already over) return the original
 * state object unchanged, so `next === prev` means "nothing happened".
 */
import { absorbWithBlock } from './damage';
import { discardHand, drawCards } from './deck';
import { chooseNextMove, getMove, recordMoveUsed } from './intents';
import { Rng } from './rng';
import { CARDS_DRAWN_PER_TURN, TURN_CAP } from './rules';
import type {
  CardDef,
  CardInstance,
  CombatAction,
  CombatSetup,
  CombatState,
  ContentRegistry,
  EnemyDef,
  EnemyState,
} from './types';

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function getCardDef(content: ContentRegistry, defId: string): CardDef {
  const def = content.cards[defId];
  if (def === undefined) throw new Error(`Unknown card id "${defId}"`);
  return def;
}

export function getEnemyDef(content: ContentRegistry, defId: string): EnemyDef {
  const def = content.enemies[defId];
  if (def === undefined) throw new Error(`Unknown enemy id "${defId}"`);
  return def;
}

export function isEnemyAlive(enemy: EnemyState): boolean {
  return enemy.integrity > 0;
}

// ---------------------------------------------------------------------------
// Starting a fight
// ---------------------------------------------------------------------------

/** Creates a fresh fight: shuffles the Arsenal, rolls intents, draws the opening hand. */
export function startCombat(setup: CombatSetup, seed: number, content: ContentRegistry): CombatState {
  const rng = new Rng(seed);

  // Give every card copy a unique id (1, 2, 3, ...).
  const cards: CardInstance[] = setup.deck.map((defId, index) => {
    getCardDef(content, defId); // fail fast on typos in deck data
    return { uid: index + 1, defId };
  });

  const enemies: EnemyState[] = setup.enemies.map((defId, index) => {
    const def = getEnemyDef(content, defId);
    const enemy: EnemyState = {
      uid: index + 1,
      defId,
      integrity: def.maxIntegrity,
      maxIntegrity: def.maxIntegrity,
      block: 0,
      intentMoveId: '',
      lastMoveId: null,
      timesInARow: 0,
    };
    enemy.intentMoveId = chooseNextMove(enemy, def, rng);
    return enemy;
  });

  const state: CombatState = {
    turn: 1,
    outcome: 'ongoing',
    player: {
      opsec: setup.opsec,
      maxOpsec: setup.maxOpsec,
      block: 0,
      cycles: setup.maxCycles,
      maxCycles: setup.maxCycles,
      drawPile: rng.shuffle(cards),
      hand: [],
      discardPile: [],
    },
    enemies,
    rngState: 0,
  };

  drawCards(state.player, CARDS_DRAWN_PER_TURN, rng);
  state.rngState = rng.state;
  return state;
}

// ---------------------------------------------------------------------------
// Validation helpers (the UI uses these to grey out cards)
// ---------------------------------------------------------------------------

/** Does this card need an enemy target? True if any effect hits an enemy. */
export function cardNeedsTarget(def: CardDef): boolean {
  return def.effects.some((effect) => effect.kind === 'damage');
}

/** Why a card can't be played right now, or null if it can. */
export type PlayBlockReason = 'combatOver' | 'noSuchCard' | 'notEnoughCycles' | 'invalidTarget';

export function whyCantPlay(
  state: CombatState,
  handIndex: number,
  targetIndex: number,
  content: ContentRegistry,
): PlayBlockReason | null {
  if (state.outcome !== 'ongoing') return 'combatOver';
  const card = state.player.hand[handIndex];
  if (card === undefined) return 'noSuchCard';
  const def = getCardDef(content, card.defId);
  if (def.cost > state.player.cycles) return 'notEnoughCycles';
  if (cardNeedsTarget(def)) {
    const target = state.enemies[targetIndex];
    if (target === undefined || !isEnemyAlive(target)) return 'invalidTarget';
  }
  return null;
}

// ---------------------------------------------------------------------------
// The reducer
// ---------------------------------------------------------------------------

export function combatReducer(state: CombatState, action: CombatAction, content: ContentRegistry): CombatState {
  switch (action.type) {
    case 'PLAY_CARD':
      return playCard(state, action.handIndex, action.targetIndex, content);
    case 'END_TURN':
      return endTurn(state, content);
  }
}

function playCard(state: CombatState, handIndex: number, targetIndex: number, content: ContentRegistry): CombatState {
  if (whyCantPlay(state, handIndex, targetIndex, content) !== null) return state;

  const next = structuredClone(state);
  const player = next.player;

  // Take the card out of hand and pay for it.
  const [card] = player.hand.splice(handIndex, 1);
  if (card === undefined) return state; // unreachable: validated above
  const def = getCardDef(content, card.defId);
  player.cycles -= def.cost;

  // Resolve each effect in order.
  for (const effect of def.effects) {
    switch (effect.kind) {
      case 'damage': {
        const target = next.enemies[targetIndex];
        if (target === undefined || !isEnemyAlive(target)) break;
        const { blockLeft, damageThrough } = absorbWithBlock(target.block, effect.amount);
        target.block = blockLeft;
        target.integrity = Math.max(0, target.integrity - damageThrough);
        break;
      }
      case 'block':
        player.block += effect.amount;
        break;
    }
  }

  player.discardPile.push(card);

  if (next.enemies.every((enemy) => !isEnemyAlive(enemy))) {
    next.outcome = 'won';
  }
  return next;
}

function endTurn(state: CombatState, content: ContentRegistry): CombatState {
  if (state.outcome !== 'ongoing') return state;

  const next = structuredClone(state);
  const rng = new Rng(next.rngState);
  const player = next.player;

  discardHand(player);

  // --- Enemy turn: each living enemy acts left to right. ---
  for (const enemy of next.enemies) {
    if (!isEnemyAlive(enemy)) continue;
    const def = getEnemyDef(content, enemy.defId);
    const move = getMove(def, enemy.intentMoveId);

    // Enemy block lasts through the Operator's turn, then expires as the enemy acts.
    enemy.block = 0;

    for (const effect of move.effects) {
      switch (effect.kind) {
        case 'attack': {
          const { blockLeft, damageThrough } = absorbWithBlock(player.block, effect.damage);
          player.block = blockLeft;
          player.opsec = Math.max(0, player.opsec - damageThrough);
          break;
        }
        case 'block':
          enemy.block += effect.amount;
          break;
      }
    }
    recordMoveUsed(enemy, move.id);

    if (player.opsec <= 0) {
      next.outcome = 'lost';
      next.rngState = rng.state;
      return next;
    }
  }

  // Roll what each enemy will do next turn, so the Operator can see it.
  for (const enemy of next.enemies) {
    if (!isEnemyAlive(enemy)) continue;
    enemy.intentMoveId = chooseNextMove(enemy, getEnemyDef(content, enemy.defId), rng);
  }

  // Turn cap: guarantees every fight ends (see rules.ts).
  if (next.turn >= TURN_CAP) {
    next.outcome = 'turnCap';
    next.rngState = rng.state;
    return next;
  }

  // --- Start of the Operator's next turn. ---
  next.turn++;
  player.block = 0; // Operator block expires at the start of their turn.
  player.cycles = player.maxCycles;
  drawCards(player, CARDS_DRAWN_PER_TURN, rng);

  next.rngState = rng.state;
  return next;
}
