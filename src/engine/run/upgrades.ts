/**
 * v2 (upgraded) cards.
 *
 * An upgraded copy is stored in the Arsenal as the base id plus "+", e.g.
 * "phishing+". `withUpgrades` adds a full CardDef for every "+" id to the
 * card table, so the combat engine treats a v2 like any other card and
 * needs no special handling.
 */
import type { CardDef } from '../types';

const UPGRADE_SUFFIX = '+';

export function upgradedId(cardId: string): string {
  return cardId + UPGRADE_SUFFIX;
}

export function isUpgraded(cardId: string): boolean {
  return cardId.endsWith(UPGRADE_SUFFIX);
}

/** The base card id of a possibly-upgraded id ("phishing+" → "phishing"). */
export function baseCardId(cardId: string): string {
  return isUpgraded(cardId) ? cardId.slice(0, -UPGRADE_SUFFIX.length) : cardId;
}

/** Can this Arsenal card be upgraded? (Has v2 data and isn't upgraded yet.) */
export function canUpgrade(cards: Readonly<Record<string, CardDef>>, cardId: string): boolean {
  if (isUpgraded(cardId)) return false;
  return cards[cardId]?.v2 !== undefined;
}

/** Builds the CardDef for a card's v2. `nameSuffix` comes from terms.ts (e.g. " v2"). */
export function buildUpgradedCard(base: CardDef, nameSuffix: string): CardDef {
  const v2 = base.v2;
  if (v2 === undefined) throw new Error(`Card "${base.id}" has no v2`);

  // Copy the base, drop the v2 field (a v2 can't be upgraded again), then apply changes.
  const upgraded: CardDef = { ...base, id: upgradedId(base.id), name: base.name + nameSuffix };
  delete upgraded.v2;
  if (v2.cost !== undefined) upgraded.cost = v2.cost;
  if (v2.effects !== undefined) upgraded.effects = v2.effects;
  if (v2.keywords !== undefined) upgraded.keywords = v2.keywords;
  return upgraded;
}

/** Returns the card table plus a v2 entry for every card that has one. */
export function withUpgrades(cards: readonly CardDef[], nameSuffix: string): CardDef[] {
  const upgrades = cards.filter((card) => card.v2 !== undefined).map((card) => buildUpgradedCard(card, nameSuffix));
  return [...cards, ...upgrades];
}
