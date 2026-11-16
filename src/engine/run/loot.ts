/**
 * Random rewards: Loot card choices, Crypto, Tools, and Dark Web stock.
 * Everything takes the run's RNG so rewards are decided by the seed.
 */
import type { Rng } from '../rng';
import type { CardDef } from '../types';
import { isUpgraded } from './upgrades';
import type { LootRarity, LootTable, RunContent, RunState, ShopItem } from './runTypes';

const LOOT_RARITIES: readonly LootRarity[] = ['public', 'private', 'zero-day'];

/** Random integer in [min, max], both inclusive. */
export function rollRange(range: readonly [number, number], rng: Rng): number {
  const [min, max] = range;
  return min + rng.nextInt(max - min + 1);
}

export function rollRarity(weights: Readonly<Record<LootRarity, number>>, rng: Rng): LootRarity {
  const index = rng.pickWeightedIndex(LOOT_RARITIES.map((r) => weights[r]));
  return LOOT_RARITIES[index] ?? 'public';
}

/** Base (not upgraded), non-starter cards the class can find. */
export function classCardPool(content: RunContent, classId: string): CardDef[] {
  return Object.values(content.cards).filter(
    (card) => card.owner === classId && card.rarity !== 'starter' && !isUpgraded(card.id),
  );
}

/**
 * One random card of the rolled rarity, skipping ids in `exclude`.
 * If that rarity has nothing left, falls back to the whole pool. Null if the pool is empty.
 */
export function rollCard(
  content: RunContent,
  classId: string,
  rarity: LootRarity,
  rng: Rng,
  exclude: readonly string[] = [],
): string | null {
  const pool = classCardPool(content, classId).filter((card) => !exclude.includes(card.id));
  const ofRarity = pool.filter((card) => card.rarity === rarity);
  const candidates = ofRarity.length > 0 ? ofRarity : pool;
  if (candidates.length === 0) return null;
  return candidates[rng.nextInt(candidates.length)]?.id ?? null;
}

/** `count` different cards, each with its own rarity roll. */
export function rollCardChoices(
  content: RunContent,
  classId: string,
  weights: Readonly<Record<LootRarity, number>>,
  count: number,
  rng: Rng,
): string[] {
  const choices: string[] = [];
  for (let i = 0; i < count; i++) {
    const card = rollCard(content, classId, rollRarity(weights, rng), rng, choices);
    if (card !== null) choices.push(card);
  }
  return choices;
}

/** A random Tool the Operator doesn't have yet, skipping `exclude`. Null if none are left. */
export function rollTool(content: RunContent, owned: readonly string[], rng: Rng, exclude: readonly string[] = []): string | null {
  const candidates = Object.keys(content.tools).filter((id) => !owned.includes(id) && !exclude.includes(id));
  if (candidates.length === 0) return null;
  return candidates[rng.nextInt(candidates.length)] ?? null;
}

/** Card choices, Crypto and (maybe) a Tool for one Loot table. */
export function rollLoot(
  run: RunState,
  table: LootTable,
  content: RunContent,
  rng: Rng,
): { cardChoices: string[]; crypto: number; toolId: string | null } {
  return {
    cardChoices: rollCardChoices(content, run.classId, table.rarityWeights, table.cardChoices, rng),
    crypto: rollRange(table.crypto, rng),
    toolId: table.tool ? rollTool(content, run.tools, rng) : null,
  };
}

// ---------------------------------------------------------------------------
// Dark Web
// ---------------------------------------------------------------------------

export function wipePrice(run: RunState, content: RunContent): number {
  const { wipeBasePrice, wipePriceStep } = content.config.darkWeb;
  return wipeBasePrice + wipePriceStep * run.wipesBought;
}

/** Fresh Dark Web stock: priced cards (one on sale) and Tools. */
export function rollDarkWebStock(run: RunState, content: RunContent, rng: Rng): { cards: ShopItem[]; tools: ShopItem[] } {
  const shop = content.config.darkWeb;

  const cards: ShopItem[] = [];
  for (let i = 0; i < shop.cardCount; i++) {
    const rarity = rollRarity(content.config.loot.fight.rarityWeights, rng);
    const id = rollCard(content, run.classId, rarity, rng, cards.map((c) => c.id));
    if (id === null) break;
    const actualRarity = content.cards[id]?.rarity;
    const priceRange = actualRarity !== undefined && actualRarity !== 'starter' ? shop.cardPrice[actualRarity] : shop.cardPrice.public;
    cards.push({ id, price: rollRange(priceRange, rng), sold: false });
  }
  const onSale = cards.length > 0 ? cards[rng.nextInt(cards.length)] : undefined;
  if (onSale !== undefined) onSale.price = Math.floor(onSale.price * shop.saleMultiplier);

  const tools: ShopItem[] = [];
  for (let i = 0; i < shop.toolCount; i++) {
    const id = rollTool(content, run.tools, rng, tools.map((t) => t.id));
    if (id === null) break;
    tools.push({ id, price: rollRange(shop.toolPrice, rng), sold: false });
  }
  return { cards, tools };
}
