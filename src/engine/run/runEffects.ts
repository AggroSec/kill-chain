/**
 * Run-level effects from Intel events and Tools (Crypto, OpSec, cards, Tools,
 * fights). These mutate a run state the caller has already copied.
 */
import type { Rng } from '../rng';
import { pickEncounter, startRunCombat } from './fights';
import { rollCard, rollCardChoices, rollTool } from './loot';
import { baseCardId, canUpgrade, upgradedId } from './upgrades';
import type { Rarity } from '../types';
import type { LootRarity, RunContent, RunEffect, RunPhase, RunState } from './runTypes';

export function healOpsec(run: RunState, amount: number): void {
  run.opsec = Math.min(run.maxOpsec, run.opsec + amount);
}

/** Lose OpSec. At 0 the run is lost (Burned). */
export function loseOpsec(run: RunState, amount: number): void {
  run.opsec = Math.max(0, run.opsec - amount);
  if (run.opsec === 0) run.outcome = 'lost';
}

/** Can the card at `deckIndex` be removed? (It exists, and the Arsenal stays at the minimum size or more.) */
export function canWipe(run: RunState, deckIndex: number, content: RunContent): boolean {
  return run.deck[deckIndex] !== undefined && run.deck.length > content.config.minArsenalSize;
}

/** Remove the card at `deckIndex`. Returns false if that isn't allowed. */
export function wipeCard(run: RunState, deckIndex: number, content: RunContent): boolean {
  if (!canWipe(run, deckIndex, content)) return false;
  run.deck.splice(deckIndex, 1);
  return true;
}

/** Upgrade the card at `deckIndex` to v2. Returns false if it can't be upgraded. */
export function upgradeCard(run: RunState, deckIndex: number, content: RunContent): boolean {
  const cardId = run.deck[deckIndex];
  if (cardId === undefined || !canUpgrade(content.cards, cardId)) return false;
  run.deck[deckIndex] = upgradedId(cardId);
  return true;
}

/** Add a Tool and fire its pickup effects. */
export function gainTool(run: RunState, toolId: string, content: RunContent, rng: Rng): void {
  run.tools.push(toolId);
  const onPickup = content.tools[toolId]?.onPickup;
  if (onPickup !== undefined) applyRunEffects(run, onPickup, content, rng);
}

/**
 * Does an effect list need the player to pick a card from their Arsenal?
 * (The UI asks for a deck index first.)
 */
export function runEffectsNeedDeckIndex(effects: readonly RunEffect[]): boolean {
  return effects.some((effect) => effect.kind === 'wipeChosenCard' || effect.kind === 'tradeUpChosenCard');
}

/** Is `deckIndex` an acceptable pick for these effects? (Wipes also respect the minimum Arsenal size.) */
export function deckIndexValidFor(
  effects: readonly RunEffect[],
  run: RunState,
  deckIndex: number | undefined,
  content: RunContent,
): boolean {
  if (deckIndex === undefined || run.deck[deckIndex] === undefined) return false;
  if (effects.some((effect) => effect.kind === 'wipeChosenCard')) return canWipe(run, deckIndex, content);
  return true;
}

const NEXT_RARITY: Readonly<Record<Rarity, LootRarity>> = {
  starter: 'public',
  public: 'private',
  private: 'zero-day',
  'zero-day': 'zero-day',
};

/** Swap the card at `deckIndex` for a random class card one rarity higher. */
function tradeUpCard(run: RunState, deckIndex: number, content: RunContent, rng: Rng): void {
  const cardId = run.deck[deckIndex];
  if (cardId === undefined) return;
  const rarity = content.cards[baseCardId(cardId)]?.rarity ?? 'starter';
  const replacement = rollCard(content, run.classId, NEXT_RARITY[rarity], rng);
  if (replacement === null) return;
  run.deck.splice(deckIndex, 1, replacement);
}

/**
 * Applies effects in order. Returns the phase the run should move to
 * (a fight or a card choice), or null to go back to the map.
 * `deckIndex` is the card the player picked, for effects that need one.
 */
export function applyRunEffects(
  run: RunState,
  effects: readonly RunEffect[],
  content: RunContent,
  rng: Rng,
  deckIndex?: number,
): RunPhase | null {
  let nextPhase: RunPhase | null = null;

  for (const effect of effects) {
    switch (effect.kind) {
      case 'gainCrypto':
        run.crypto += effect.amount;
        break;
      case 'loseOpsec':
        loseOpsec(run, effect.amount);
        break;
      case 'healOpsec':
        healOpsec(run, effect.amount);
        break;
      case 'gainMaxOpsec':
        run.maxOpsec += effect.amount;
        run.opsec += effect.amount;
        break;
      case 'gainRandomCard': {
        const card = rollCard(content, run.classId, effect.rarity, rng);
        if (card !== null) run.deck.push(card);
        break;
      }
      case 'cardChoice': {
        const choices = rollCardChoices(content, run.classId, content.config.loot.fight.rarityWeights, effect.count, rng);
        nextPhase = { kind: 'loot', loot: { crypto: 0, toolId: null, cardChoices: choices } };
        break;
      }
      case 'gainRandomTool': {
        const toolId = rollTool(content, run.tools, rng);
        if (toolId !== null) gainTool(run, toolId, content, rng);
        break;
      }
      case 'upgradeRandomCard': {
        const upgradable = run.deck.map((_, i) => i).filter((i) => canUpgrade(content.cards, run.deck[i] ?? ''));
        const pick = upgradable[rng.nextInt(Math.max(upgradable.length, 1))];
        if (pick !== undefined) upgradeCard(run, pick, content);
        break;
      }
      case 'wipeChosenCard':
        if (deckIndex !== undefined) wipeCard(run, deckIndex, content);
        break;
      case 'tradeUpChosenCard':
        if (deckIndex !== undefined) tradeUpCard(run, deckIndex, content, rng);
        break;
      case 'heat':
        run.heat += effect.amount;
        break;
      case 'fight':
        nextPhase = startRunCombat(run, pickEncounter(run, effect.tier, content, rng), 'fight', content, rng);
        break;
    }
  }
  return nextPhase;
}
