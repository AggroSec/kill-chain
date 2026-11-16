/**
 * Measures how much each Loot card helps, so the run bots pick cards by
 * evidence instead of by rarity, and so balance reports can show weak or
 * strong cards.
 *
 * Method: for each class, play the starter Arsenal against every Act 1
 * normal and elite encounter, then the same with one extra copy of a pool
 * card. A card's value is the average OpSec it saves per fight (positive =
 * the card helps). Same seeds on both sides keep the comparison fair.
 */
import { classCardPool, DEFAULT_MAX_CYCLES } from '../engine';
import type { CombatSetup, RunContent } from '../engine';
import type { Bot } from './bots';
import { runFights } from './fightSim';

export type CardValues = ReadonlyMap<string, number>;

function averageOpsecLost(deck: readonly string[], classId: string, content: RunContent, bot: Bot, fights: number): number {
  const cls = content.classes[classId];
  if (cls === undefined) throw new Error(`Unknown class id "${classId}"`);
  const encounters = Object.values(content.encounters).filter((e) => e.act === 1 && (e.tier === 'normal' || e.tier === 'elite'));
  let total = 0;
  for (const encounter of encounters) {
    const setup: CombatSetup = {
      deck,
      opsec: cls.maxOpsec,
      maxOpsec: cls.maxOpsec,
      maxCycles: DEFAULT_MAX_CYCLES,
      enemies: encounter.enemies,
    };
    total += runFights(setup, fights, bot, content).avgOpsecLost;
  }
  return total / encounters.length;
}

/** OpSec saved per fight by adding one copy of each pool card to the starter Arsenal. */
export function measureCardValues(classId: string, content: RunContent, bot: Bot, fightsPerEncounter = 40): CardValues {
  const starter = content.classes[classId]?.starterDeck ?? [];
  const baseline = averageOpsecLost(starter, classId, content, bot, fightsPerEncounter);
  const values = new Map<string, number>();
  for (const card of classCardPool(content, classId)) {
    values.set(card.id, baseline - averageOpsecLost([...starter, card.id], classId, content, bot, fightsPerEncounter));
  }
  return values;
}
