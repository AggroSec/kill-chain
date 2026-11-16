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
import { clampAlert } from './alert';
import { cloneCombatState } from './clone';
import { advanceChain, emptyChain } from './chain';
import { discardHand, drawCards } from './deck';
import { effectsNeedTarget, isEnemyAlive, resolveCardEffects } from './effects';
import type { EffectContext } from './effects';
import { getEnemyDef, resolveEnemyEffects, runEnemyTurn } from './enemyTurn';
import { chooseNextMove } from './intents';
import { Rng } from './rng';
import { CARDS_DRAWN_PER_TURN, TURN_CAP } from './rules';
import { decayStatuses, getStatusDef } from './statuses';
import type {
  CardDef,
  CardInstance,
  CombatAction,
  CombatModifiers,
  CombatSetup,
  CombatState,
  ContentRegistry,
  EnemyState,
} from './types';

export { getEnemyDef } from './enemyTurn';
export { isEnemyAlive } from './effects';

export function getCardDef(content: ContentRegistry, defId: string): CardDef {
  const def = content.cards[defId];
  if (def === undefined) throw new Error(`Unknown card id "${defId}"`);
  return def;
}

/** Does this card need the Operator to pick an enemy? */
export function cardNeedsTarget(def: CardDef): boolean {
  return effectsNeedTarget(def.effects);
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
      statuses: {},
      intentMoveId: '',
      lastMoveId: null,
      timesInARow: 0,
    };
    enemy.intentMoveId = chooseNextMove(enemy, def, rng);
    return enemy;
  });

  const modifiers = setup.modifiers ?? {};
  const state: CombatState = {
    turn: 1,
    outcome: 'ongoing',
    alert: clampAlert(0, modifiers.startingAlert ?? 0),
    chain: emptyChain(),
    player: {
      opsec: setup.opsec,
      maxOpsec: setup.maxOpsec,
      block: 0,
      cycles: setup.maxCycles,
      maxCycles: setup.maxCycles,
      drawPile: rng.shuffle(cards),
      hand: [],
      discardPile: [],
      spentPile: [],
      statuses: {},
    },
    enemies,
    noisyReduction: modifiers.noisyReduction ?? 0,
    rngState: 0,
  };

  startPlayerTurn(state, rng, content);
  applyFirstTurnModifiers(state, modifiers, rng, content);
  state.rngState = rng.state;
  return state;
}

// ---------------------------------------------------------------------------
// Validation (the UI and bots use this to know what's playable)
// ---------------------------------------------------------------------------

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

  const next = cloneCombatState(state);
  const rng = new Rng(next.rngState);
  const player = next.player;

  // 1. Take the card out of hand and pay for it.
  const [card] = player.hand.splice(handIndex, 1);
  if (card === undefined) return state; // unreachable: validated above
  const def = getCardDef(content, card.defId);
  player.cycles -= def.cost;

  // 2. Update the Chain first, so a card that extends it gets the bonus too.
  next.chain = advanceChain(next.chain, def.tactic);

  // 3. Resolve the card's effects in order.
  const ctx: EffectContext = { state: next, rng, content, targetIndex, hitEnemies: new Set() };
  resolveCardEffects(ctx, def.effects);

  // 4. "When attacked" triggers (e.g. Honeypot), once per enemy this card damaged.
  fireOnAttacked(next, ctx.hitEnemies, content);

  // 5. Noisy cards raise Alert after they land (less with Tools like Proxy Chain).
  if (def.keywords?.noisy !== undefined) {
    next.alert = clampAlert(next.alert, Math.max(0, def.keywords.noisy - next.noisyReduction));
  }

  // 6. Where the card goes: Implants and Burners are spent for the fight.
  if (def.type === 'implant' || def.keywords?.burner === true) {
    player.spentPile.push(card);
  } else {
    player.discardPile.push(card);
  }

  checkForWin(next);
  next.rngState = rng.state;
  return next;
}

function endTurn(state: CombatState, content: ContentRegistry): CombatState {
  if (state.outcome !== 'ongoing') return state;

  const next = cloneCombatState(state);
  const rng = new Rng(next.rngState);
  const player = next.player;

  // Stash cards stay in hand; everything else is discarded.
  const stashed = player.hand.filter((card) => getCardDef(content, card.defId).keywords?.stash === true);
  player.hand = player.hand.filter((card) => !stashed.includes(card));
  discardHand(player);
  player.hand = stashed;
  decayStatuses(player.statuses, content);

  runEnemyTurn(next, rng, content);
  if (next.outcome !== 'ongoing') {
    next.rngState = rng.state;
    return next;
  }

  // Turn cap: guarantees every fight ends (see rules.ts).
  if (next.turn >= TURN_CAP) {
    next.outcome = 'turnCap';
    next.rngState = rng.state;
    return next;
  }

  next.turn++;
  startPlayerTurn(next, rng, content);
  checkForWin(next); // an Implant could finish the last enemy
  next.rngState = rng.state;
  return next;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Start of an Operator turn: reset block, Cycles and Chain, fire Implants, draw. */
function startPlayerTurn(state: CombatState, rng: Rng, content: ContentRegistry): void {
  const player = state.player;
  player.block = 0;
  player.cycles = player.maxCycles;
  state.chain = emptyChain();

  // Implants (and any other turn-start statuses) fire once per stack.
  const ctx: EffectContext = { state, rng, content, targetIndex: -1, hitEnemies: new Set() };
  for (const [statusId, stacks] of Object.entries(player.statuses)) {
    const trigger = getStatusDef(content, statusId).onTurnStart;
    if (trigger === undefined) continue;
    for (let i = 0; i < stacks; i++) resolveCardEffects(ctx, trigger);
  }
  fireOnAttacked(state, ctx.hitEnemies, content);

  drawCards(player, CARDS_DRAWN_PER_TURN, rng);
}

/** Turn-1 bonuses from the run: extra draw and Cycles, then start-of-fight effects. */
function applyFirstTurnModifiers(state: CombatState, modifiers: CombatModifiers, rng: Rng, content: ContentRegistry): void {
  if (modifiers.firstTurnDraw !== undefined) drawCards(state.player, modifiers.firstTurnDraw, rng);
  if (modifiers.firstTurnCycles !== undefined) state.player.cycles += modifiers.firstTurnCycles;
  if (modifiers.combatStart !== undefined) {
    const ctx: EffectContext = { state, rng, content, targetIndex: -1, hitEnemies: new Set() };
    resolveCardEffects(ctx, modifiers.combatStart);
    fireOnAttacked(state, ctx.hitEnemies, content);
    checkForWin(state);
  }
}

/**
 * Fires each damaged enemy's "when attacked" effects once.
 * Fires even if the hit was lethal: the Honeypot logged the attack either way.
 */
function fireOnAttacked(state: CombatState, hitEnemies: Set<number>, content: ContentRegistry): void {
  for (const index of hitEnemies) {
    const enemy = state.enemies[index];
    if (enemy === undefined) continue;
    const trigger = getEnemyDef(content, enemy.defId).onAttacked;
    if (trigger !== undefined) resolveEnemyEffects(state, index, trigger, content);
  }
}

function checkForWin(state: CombatState): void {
  if (state.outcome === 'ongoing' && state.enemies.every((enemy) => !isEnemyAlive(enemy))) {
    state.outcome = 'won';
  }
}
